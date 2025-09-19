import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { SuperUserAuthMiddleware } from './middleware/superUserAuth';

interface UpdateSuperUserRequest {
  targetUserId: string;
  newEmail?: string;
  newPassword?: string;
  action: 'UPDATE_EMAIL' | 'UPDATE_PASSWORD' | 'GRANT_SUPER_USER' | 'REVOKE_SUPER_USER';
}

/**
 * Secure SuperUser Management Function
 * Only callable by existing super-users with proper authentication
 */
export const manageSuperUser = onCall<UpdateSuperUserRequest>(
  { 
    region: 'us-east1', // Changed from us-central1 due to quota limits
    enforceAppCheck: false, // Disable for development
    cors: true, // Enable CORS
  },
  async (request) => {
    const { data } = request;
    
    // Debug logging
    logger.info('SuperUser management request received', {
      action: data.action,
      targetUserId: data.targetUserId,
      hasNewEmail: !!data.newEmail,
      authUid: request.auth?.uid
    });
    
    // Handle missing targetUserId by using current user
    const targetUserId = data.targetUserId || request.auth?.uid;
    if (!targetUserId) {
      throw new HttpsError('invalid-argument', 'Target user ID is required');
    }
    
    // 1. COMPREHENSIVE AUTHENTICATION & AUTHORIZATION
    const context = await SuperUserAuthMiddleware.validateSelfManagement(request, targetUserId);

    // 2. AUDIT LOGGING
    await SuperUserAuthMiddleware.auditLog(context, 'manage-super-user', {
      targetUserId: targetUserId,
      action: data.action,
      ipAddress: request.rawRequest?.ip || 'emulator'
    });

    try {
      const adminAuth = getAuth();
      const db = getFirestore();

      switch (data.action) {
        case 'UPDATE_EMAIL':
          if (!data.newEmail || !isValidEmail(data.newEmail)) {
            throw new HttpsError('invalid-argument', 'Valid email address is required');
          }

          // Update Firebase Auth email
          await adminAuth.updateUser(targetUserId, {
            email: data.newEmail,
            emailVerified: false // Require email verification
          });

          // Update custom claims if needed
          const currentClaims = (await adminAuth.getUser(targetUserId)).customClaims || {};
          await adminAuth.setCustomUserClaims(targetUserId, {
            ...currentClaims,
            email: data.newEmail,
            lastUpdated: new Date().toISOString()
          });

          // Update any user documents in Firestore
          const userDoc = await db.collection('users').doc(targetUserId).get();
          if (userDoc.exists) {
            await userDoc.ref.update({
              email: data.newEmail,
              updatedAt: new Date(),
              updatedBy: context.uid
            });
          }

          logger.info('SuperUser email updated successfully', {
            userId: targetUserId,
            newEmail: data.newEmail,
            updatedBy: context.uid
          });

          return { 
            success: true, 
            message: 'Email updated successfully. Please verify the new email address.',
            emailVerificationRequired: true
          };

        case 'UPDATE_PASSWORD':
          if (!data.newPassword || data.newPassword.length < 12) {
            throw new HttpsError('invalid-argument', 'Password must be at least 12 characters long');
          }

          await adminAuth.updateUser(targetUserId, {
            password: data.newPassword
          });

          logger.info('SuperUser password updated successfully', {
            userId: targetUserId,
            updatedBy: context.uid
          });

          return { 
            success: true, 
            message: 'Password updated successfully' 
          };

        case 'GRANT_SUPER_USER':
          // Only allow if there are less than 3 super-users (security limit)
          const existingSuperUsers = await adminAuth.listUsers();
          const superUserCount = existingSuperUsers.users.filter(
            user => user.customClaims?.role === 'super-user'
          ).length;

          if (superUserCount >= 3) {
            throw new HttpsError('resource-exhausted', 'Maximum of 3 super-users allowed');
          }

          await adminAuth.setCustomUserClaims(targetUserId, {
            role: 'super-user',
            permissions: ['all'],
            grantedBy: context.uid,
            grantedAt: new Date().toISOString()
          });

          logger.warn('SuperUser privileges granted', {
            targetUserId: targetUserId,
            grantedBy: context.uid,
            totalSuperUsers: superUserCount + 1
          });

          return { 
            success: true, 
            message: 'Super-user privileges granted' 
          };

        case 'REVOKE_SUPER_USER':
          // Prevent users from revoking their own privileges
          if (targetUserId === context.uid) {
            throw new HttpsError('invalid-argument', 'Cannot revoke your own super-user privileges');
          }

          await adminAuth.setCustomUserClaims(targetUserId, {
            role: 'business-owner', // Downgrade to business owner
            permissions: [],
            revokedBy: context.uid,
            revokedAt: new Date().toISOString()
          });

          logger.warn('SuperUser privileges revoked', {
            targetUserId: targetUserId,
            revokedBy: context.uid
          });

          return { 
            success: true, 
            message: 'Super-user privileges revoked' 
          };

        default:
          throw new HttpsError('invalid-argument', 'Invalid action specified');
      }

    } catch (error) {
      logger.error('SuperUser management failed', {
        error: (error as Error).message,
        userId: targetUserId,
        action: data.action,
        initiatedBy: context.uid
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'SuperUser management failed');
    }
  }
);

/**
 * Get Super-User Information (for security audits)
 */
export const getSuperUserInfo = onCall(
  { 
    region: 'us-east1', // Changed from us-central1 due to quota limits
    cors: true, // Enable CORS
  },
  async (request) => {
    // Validate super-user permissions
    await SuperUserAuthMiddleware.validateSuperUser(request, {
      requireSuperUser: true,
      requiredPermissions: ['users:read', 'all']
    });

    const adminAuth = getAuth();
    const allUsers = await adminAuth.listUsers();
    
    const superUsers = allUsers.users
      .filter(user => user.customClaims?.role === 'super-user')
      .map(user => ({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        lastSignInTime: user.metadata.lastSignInTime,
        creationTime: user.metadata.creationTime,
        customClaims: user.customClaims
      }));

    return {
      totalSuperUsers: superUsers.length,
      superUsers,
      securityInfo: {
        maxAllowed: 3,
        currentCount: superUsers.length,
        available: 3 - superUsers.length
      }
    };
  }
);

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Initialize Super-User Account (One-time use)
 * This function should be called once to create the initial super-user
 */
export const initializeSuperUser = onCall<{ 
  email: string; 
  password: string; 
  firstName: string; 
  lastName: string; 
}>(
  { 
    region: 'us-central1',
  },
  async (request) => {
    const { data } = request;
    
    // This function should only work if no super-users exist
    const adminAuth = getAuth();
    const allUsers = await adminAuth.listUsers();
    const existingSuperUsers = allUsers.users.filter(
      user => user.customClaims?.role === 'super-user'
    );

    if (existingSuperUsers.length > 0) {
      throw new HttpsError('already-exists', 'Super-user already exists. Use manageSuperUser function instead.');
    }

    // Create the initial super-user
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false
    });

    // Set super-user claims
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'super-user',
      permissions: ['all'],
      organizationId: 'SYSTEM',
      isFounder: true,
      createdAt: new Date().toISOString()
    });

    logger.info('Initial SuperUser created', {
      uid: userRecord.uid,
      email: data.email
    });

    return {
      success: true,
      message: 'Initial super-user account created successfully',
      userId: userRecord.uid
    };
  }
);