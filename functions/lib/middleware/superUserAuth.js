"use strict";
// functions/src/middleware/superUserAuth.ts
// Server-side permission validation middleware for SuperUser operations
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperUserAuthMiddleware = void 0;
exports.requireSuperUser = requireSuperUser;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
/**
 * Server-side SuperUser Authentication & Authorization Middleware
 * Provides comprehensive permission validation for administrative operations
 */
class SuperUserAuthMiddleware {
    /**
     * Validate super-user permissions for a request
     */
    static async validateSuperUser(request, options = {}) {
        var _a, _b, _c, _d, _e;
        const { requireSuperUser = true, requiredPermissions = [], maxSessionAge = 3600000 // 1 hour default
         } = options;
        // 1. Basic authentication check
        if (!request.auth) {
            firebase_functions_1.logger.warn('SuperUser validation failed: No authentication', {
                ip: ((_a = request.rawRequest) === null || _a === void 0 ? void 0 : _a.ip) || 'emulator',
                userAgent: ((_c = (_b = request.rawRequest) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['user-agent']) || 'unknown'
            });
            throw new https_1.HttpsError('unauthenticated', 'Authentication required');
        }
        const { uid, token } = request.auth;
        const userEmail = token.email || 'unknown';
        // 2. Check session cache for performance
        const cachedContext = this.sessionCache.get(uid);
        if (cachedContext && (Date.now() - cachedContext.lastValidated) < maxSessionAge) {
            firebase_functions_1.logger.debug('SuperUser validation: Using cached session', { uid, email: userEmail });
            return this.validatePermissions(cachedContext, requiredPermissions, options);
        }
        // 3. Validate super-user role from custom claims
        const userRole = token.role || 'guest';
        // TEMPORARY: Allow specific super-user emails for development
        const isDevelopmentSuperUser = ((userEmail === 'superuser@hrdignitysystem.com' && uid === 'SYCfyGeQJ9OXTGNo7LPiNLRa7EX2') ||
            (userEmail === 'riaan.potas@gmail.com' && uid === 'SYCfyGeQJ9OXTGNo7LPiNLRa7EX2'));
        if (requireSuperUser && userRole !== 'super-user' && !isDevelopmentSuperUser) {
            firebase_functions_1.logger.warn('SuperUser validation failed: Insufficient role', {
                uid,
                email: userEmail,
                role: userRole,
                requiredRole: 'super-user',
                ip: ((_d = request.rawRequest) === null || _d === void 0 ? void 0 : _d.ip) || 'emulator'
            });
            throw new https_1.HttpsError('permission-denied', 'Super-user access required');
        }
        // Override role for development super-user
        const effectiveRole = isDevelopmentSuperUser ? 'super-user' : userRole;
        // 4. Get fresh user permissions from Firebase Auth
        let userPermissions = [];
        try {
            const userRecord = await this.auth.getUser(uid);
            userPermissions = ((_e = userRecord.customClaims) === null || _e === void 0 ? void 0 : _e.permissions) || [];
            // Grant all permissions for development super-user
            if (isDevelopmentSuperUser) {
                userPermissions = ['all'];
            }
        }
        catch (error) {
            firebase_functions_1.logger.error('SuperUser validation failed: User lookup error', {
                uid,
                email: userEmail,
                error: error.message
            });
            throw new https_1.HttpsError('internal', 'User validation failed');
        }
        // 5. Create validated context
        const context = {
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
    static validatePermissions(context, requiredPermissions, options) {
        // Check if user has all required permissions  
        if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every(permission => context.permissions.includes(permission) || context.permissions.includes('all'));
            if (!hasAllPermissions) {
                firebase_functions_1.logger.warn('SuperUser validation failed: Insufficient permissions', {
                    uid: context.uid,
                    email: context.email,
                    hasPermissions: context.permissions,
                    requiredPermissions
                });
                throw new https_1.HttpsError('permission-denied', `Required permissions: ${requiredPermissions.join(', ')}`);
            }
        }
        firebase_functions_1.logger.info('SuperUser validation successful', {
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
    static async validateSelfManagement(request, targetUserId) {
        const context = await this.validateSuperUser(request, {
            requireSuperUser: true,
            allowSelfManagement: true
        });
        // Allow operation if user is managing themselves or has admin permissions
        if (context.uid === targetUserId || context.permissions.includes('all')) {
            return context;
        }
        firebase_functions_1.logger.warn('SuperUser self-management validation failed', {
            uid: context.uid,
            email: context.email,
            targetUserId,
            permissions: context.permissions
        });
        throw new https_1.HttpsError('permission-denied', 'Can only manage your own account or need admin permissions');
    }
    /**
     * Validate organization management permissions
     */
    static async validateOrganizationAccess(request, organizationId, operation = 'read') {
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
            firebase_functions_1.logger.info('SuperUser organization access granted', {
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
    static async validateFinancialAccess(request, operation = 'read') {
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
    static async auditLog(context, operation, details = {}, success = true) {
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
            firebase_functions_1.logger.info(`SuperUser audit: ${operation}`, auditEntry);
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to write audit log', {
                error: error.message,
                auditEntry
            });
        }
    }
    /**
     * Clear session cache for a user (force re-validation)
     */
    static clearUserSession(uid) {
        this.sessionCache.delete(uid);
        firebase_functions_1.logger.debug('SuperUser session cache cleared', { uid });
    }
    /**
     * Clear all cached sessions (emergency use)
     */
    static clearAllSessions() {
        const sessionCount = this.sessionCache.size;
        this.sessionCache.clear();
        firebase_functions_1.logger.warn('All SuperUser sessions cleared', { clearedSessions: sessionCount });
    }
    /**
     * Get active session information for monitoring
     */
    static getActiveSessionsInfo() {
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
exports.SuperUserAuthMiddleware = SuperUserAuthMiddleware;
SuperUserAuthMiddleware.auth = (0, auth_1.getAuth)();
SuperUserAuthMiddleware.db = (0, firestore_1.getFirestore)();
SuperUserAuthMiddleware.sessionCache = new Map();
/**
 * Decorator for super-user function protection
 */
function requireSuperUser(options = {}) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (request, ...args) {
            const context = await SuperUserAuthMiddleware.validateSuperUser(request, options);
            try {
                const result = await originalMethod.call(this, request, context, ...args);
                await SuperUserAuthMiddleware.auditLog(context, propertyKey, { args }, true);
                return result;
            }
            catch (error) {
                await SuperUserAuthMiddleware.auditLog(context, propertyKey, { args, error: error.message }, false);
                throw error;
            }
        };
        return descriptor;
    };
}
//# sourceMappingURL=superUserAuth.js.map