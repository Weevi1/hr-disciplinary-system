// functions/src/middleware/superUserAuth.ts
// Server-side permission validation middleware for SuperUser operations

import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface SuperUserContext {
  uid: string;
  email: string;
  role: string;
  permissions: string[];
  lastValidated: number;
}

interface ValidationOptions {
  requireSuperUser?: boolean;
  requiredPermissions?: string[];
  allowSelfManagement?: boolean;
  maxSessionAge?: number; // in milliseconds
}

/**
 * Server-side SuperUser Authentication & Authorization Middleware
 * Provides comprehensive permission validation for administrative operations
 */
export class SuperUserAuthMiddleware {
  private static auth = getAuth();
  private static db = getFirestore();
  private static sessionCache = new Map<string, SuperUserContext>();

  /**
   * Validate super-user permissions for a request
   */
  static async validateSuperUser(
    request: CallableRequest,
    options: ValidationOptions = {}
  ): Promise<SuperUserContext> {
    const {
      requireSuperUser = true,
      requiredPermissions = [],
      maxSessionAge = 3600000 // 1 hour default
    } = options;

    // 1. Basic authentication check
    if (!request.auth) {
      logger.warn('SuperUser validation failed: No authentication', {
        ip: request.rawRequest?.ip || 'emulator',
        userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown'
      });
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { uid, token } = request.auth;
    const userEmail = token.email || 'unknown';

    // 2. Check session cache for performance
    const cachedContext = this.sessionCache.get(uid);
    if (cachedContext && (Date.now() - cachedContext.lastValidated) < maxSessionAge) {
      logger.debug('SuperUser validation: Using cached session', { uid, email: userEmail });
      return this.validatePermissions(cachedContext, requiredPermissions, options);
    }

    // 3. Validate super-user role from custom claims
    const userRole = token.role || 'guest';
    
    // TEMPORARY: Allow specific super-user emails for development
    const isDevelopmentSuperUser = (
      (userEmail === 'superuser@hrdignitysystem.com' && uid === 'SYCfyGeQJ9OXTGNo7LPiNLRa7EX2') ||
      (userEmail === 'riaan.potas@gmail.com' && uid === 'SYCfyGeQJ9OXTGNo7LPiNLRa7EX2')
    );
    
    if (requireSuperUser && userRole !== 'super-user' && !isDevelopmentSuperUser) {
      logger.warn('SuperUser validation failed: Insufficient role', {
        uid,
        email: userEmail,
        role: userRole,
        requiredRole: 'super-user',
        ip: request.rawRequest?.ip || 'emulator'
      });
      throw new HttpsError('permission-denied', 'Super-user access required');
    }
    
    // Override role for development super-user
    const effectiveRole = isDevelopmentSuperUser ? 'super-user' : userRole;

    // 4. Get fresh user permissions from Firebase Auth
    let userPermissions: string[] = [];
    try {
      const userRecord = await this.auth.getUser(uid);
      userPermissions = userRecord.customClaims?.permissions || [];
      
      // Grant all permissions for development super-user
      if (isDevelopmentSuperUser) {
        userPermissions = ['all'];
      }
    } catch (error) {
      logger.error('SuperUser validation failed: User lookup error', {
        uid,
        email: userEmail,
        error: (error as Error).message
      });
      throw new HttpsError('internal', 'User validation failed');
    }

    // 5. Create validated context
    const context: SuperUserContext = {
      uid,
      email: userEmail,
      role: effectiveRole,
      permissions: userPermissions,
      lastValidated: Date.now()
    };

    // 6. Cache the validated session
    this.sessionCache.set(uid, context);

    // 7. Validate specific permissions
    return this.validatePermissions(context, requiredPermissions, options);
  }

  /**
   * Validate specific permissions for the user context
   */
  private static validatePermissions(
    context: SuperUserContext,
    requiredPermissions: string[],
    options: ValidationOptions
  ): SuperUserContext {
    // Check if user has all required permissions  
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        context.permissions.includes(permission) || context.permissions.includes('all')
      );

      if (!hasAllPermissions) {
        logger.warn('SuperUser validation failed: Insufficient permissions', {
          uid: context.uid,
          email: context.email,
          hasPermissions: context.permissions,
          requiredPermissions
        });
        throw new HttpsError('permission-denied', `Required permissions: ${requiredPermissions.join(', ')}`);
      }
    }

    logger.info('SuperUser validation successful', {
      uid: context.uid,
      email: context.email,
      role: context.role,
      permissions: context.permissions.length,
      requiredPermissions
    });

    return context;
  }

  /**
   * Validate self-management operations (user managing their own account)
   */
  static async validateSelfManagement(
    request: CallableRequest,
    targetUserId: string
  ): Promise<SuperUserContext> {
    const context = await this.validateSuperUser(request, {
      requireSuperUser: true,
      allowSelfManagement: true
    });

    // Allow operation if user is managing themselves or has admin permissions
    if (context.uid === targetUserId || context.permissions.includes('all')) {
      return context;
    }

    logger.warn('SuperUser self-management validation failed', {
      uid: context.uid,
      email: context.email,
      targetUserId,
      permissions: context.permissions
    });

    throw new HttpsError('permission-denied', 'Can only manage your own account or need admin permissions');
  }

  /**
   * Validate organization management permissions
   */
  static async validateOrganizationAccess(
    request: CallableRequest,
    organizationId?: string,
    operation: 'read' | 'write' | 'delete' = 'read'
  ): Promise<SuperUserContext> {
    const requiredPermissions = operation === 'delete' 
      ? ['organizations:delete', 'all']
      : operation === 'write'
      ? ['organizations:write', 'all'] 
      : ['organizations:read', 'all'];

    const context = await this.validateSuperUser(request, {
      requireSuperUser: true,
      requiredPermissions
    });

    if (organizationId) {
      logger.info('SuperUser organization access granted', {
        uid: context.uid,
        email: context.email,
        organizationId,
        operation
      });
    }

    return context;
  }

  /**
   * Validate financial operations (billing, commissions, etc.)
   */
  static async validateFinancialAccess(
    request: CallableRequest,
    operation: 'read' | 'write' | 'process' = 'read'
  ): Promise<SuperUserContext> {
    const requiredPermissions = operation === 'process'
      ? ['finance:process', 'all']
      : operation === 'write'
      ? ['finance:write', 'all']
      : ['finance:read', 'all'];

    return await this.validateSuperUser(request, {
      requireSuperUser: true,
      requiredPermissions
    });
  }

  /**
   * Audit logging for super-user operations
   */
  static async auditLog(
    context: SuperUserContext,
    operation: string,
    details: any = {},
    success: boolean = true
  ): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: context.uid,
      userEmail: context.email,
      userRole: context.role,
      operation,
      success,
      details,
      sessionValidated: new Date(context.lastValidated).toISOString()
    };

    try {
      // Store in audit collection
      await this.db.collection('auditLogs').add(auditEntry);
      
      // Also log to Cloud Logging for real-time monitoring
      logger.info(`SuperUser audit: ${operation}`, auditEntry);
    } catch (error) {
      logger.error('Failed to write audit log', {
        error: (error as Error).message,
        auditEntry
      });
    }
  }

  /**
   * Clear session cache for a user (force re-validation)
   */
  static clearUserSession(uid: string): void {
    this.sessionCache.delete(uid);
    logger.debug('SuperUser session cache cleared', { uid });
  }

  /**
   * Clear all cached sessions (emergency use)
   */
  static clearAllSessions(): void {
    const sessionCount = this.sessionCache.size;
    this.sessionCache.clear();
    logger.warn('All SuperUser sessions cleared', { clearedSessions: sessionCount });
  }

  /**
   * Get active session information for monitoring
   */
  static getActiveSessionsInfo(): Array<{
    uid: string;
    email: string;
    role: string;
    lastValidated: string;
    sessionAge: number;
  }> {
    const now = Date.now();
    return Array.from(this.sessionCache.entries()).map(([uid, context]) => ({
      uid,
      email: context.email,
      role: context.role,
      lastValidated: new Date(context.lastValidated).toISOString(),
      sessionAge: now - context.lastValidated
    }));
  }
}

/**
 * Decorator for super-user function protection
 */
export function requireSuperUser(options: ValidationOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: CallableRequest, ...args: any[]) {
      const context = await SuperUserAuthMiddleware.validateSuperUser(request, options);
      
      try {
        const result = await originalMethod.call(this, request, context, ...args);
        await SuperUserAuthMiddleware.auditLog(context, propertyKey, { args }, true);
        return result;
      } catch (error) {
        await SuperUserAuthMiddleware.auditLog(context, propertyKey, { args, error: (error as Error).message }, false);
        throw error;
      }
    };

    return descriptor;
  };
}