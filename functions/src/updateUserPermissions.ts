// functions/src/updateUserPermissions.ts
// Cloud Function to update user permissions with token revocation for immediate effect

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface UpdatePermissionsRequest {
  targetUserId: string;
  organizationId: string;
  newRole?: string;
  newDepartmentIds?: string[];
  newPermissions?: any[];
  revokeTokens?: boolean; // Immediate revocation for security
  reason?: string; // Audit trail
}

/**
 * Update user permissions and increment claims version for staleness detection
 * Optionally revoke tokens for immediate effect (security-critical changes)
 */
export const updateUserPermissions = onCall<UpdatePermissionsRequest>(
  {
    region: 'us-central1',
    cors: true
  },
  async (request) => {
    const {
      targetUserId,
      organizationId,
      newRole,
      newDepartmentIds,
      newPermissions,
      revokeTokens = false,
      reason
    } = request.data;

    try {
      // 1. Verify caller is authenticated
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const auth = getAuth();
      const db = getFirestore();

      // 2. Get caller's permissions
      const callerDocRef = db.doc(`organizations/${organizationId}/users/${request.auth.uid}`);
      const callerDoc = await callerDocRef.get();

      if (!callerDoc.exists) {
        throw new HttpsError('permission-denied', 'Caller not found in organization');
      }

      const callerData = callerDoc.data();
      const callerRole = callerData?.role?.id || callerData?.role;

      // 3. Permission check: Only business owners and super users can update permissions
      if (callerRole !== 'executive-management' && callerRole !== 'super-user') {
        logger.warn(`Permission denied: ${callerRole} tried to update permissions`);
        throw new HttpsError('permission-denied', 'Only business owners can update permissions');
      }

      // 4. Get current user data
      const userDocRef = db.doc(`organizations/${organizationId}/users/${targetUserId}`);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Target user not found');
      }

      const currentData = userDoc.data();
      const currentVersion = currentData?.claimsVersion || 1;

      // 5. Increment claims version for staleness detection
      const newVersion = currentVersion + 1;

      logger.info(`Updating permissions for ${targetUserId}: v${currentVersion} → v${newVersion}`);

      // 6. Build update object
      const updates: any = {
        claimsVersion: newVersion,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid
      };

      if (newRole) {
        updates.role = newRole;
        logger.info(`  - Role: ${currentData?.role} → ${newRole}`);
      }

      if (newDepartmentIds) {
        updates.departmentIds = newDepartmentIds;
        logger.info(`  - Departments updated`);
      }

      if (newPermissions) {
        updates.permissions = newPermissions;
        logger.info(`  - Permissions updated`);
      }

      // 7. Update Firestore (source of truth)
      await userDocRef.update(updates);

      logger.info(`✅ Firestore updated for ${targetUserId}`);

      // 8. Update custom claims (minimal format)
      const customClaims = {
        org: organizationId,
        r: newRole || currentData?.role?.id || currentData?.role,
        v: newVersion,
        iat: Date.now()
      };

      await auth.setCustomUserClaims(targetUserId, customClaims);

      logger.info(`✅ Custom claims updated for ${targetUserId}:`, customClaims);

      // 9. Optional: Revoke old tokens immediately (extra security)
      if (revokeTokens) {
        await auth.revokeRefreshTokens(targetUserId);
        logger.warn(`🔒 Revoked all tokens for ${targetUserId} for immediate effect`);
      }

      // 10. Create audit log
      await db.collection('auditLogs').add({
        action: 'USER_PERMISSIONS_UPDATED',
        resourceType: 'user',
        resourceId: targetUserId,
        performedBy: request.auth.uid,
        organizationId: organizationId,
        details: {
          oldVersion: currentVersion,
          newVersion: newVersion,
          tokensRevoked: revokeTokens,
          reason: reason || 'Permission update',
          changes: {
            role: newRole ? { from: currentData?.role, to: newRole } : undefined,
            departmentIds: newDepartmentIds ? 'updated' : undefined,
            permissions: newPermissions ? 'updated' : undefined
          }
        },
        timestamp: FieldValue.serverTimestamp()
      });

      logger.info(`✅ Audit log created for permission update`);

      return {
        success: true,
        oldVersion: currentVersion,
        newVersion: newVersion,
        tokensRevoked: revokeTokens,
        message: `Permissions updated successfully. Claims version: ${currentVersion} → ${newVersion}`
      };

    } catch (error) {
      logger.error('❌ Error updating user permissions:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to update permissions: ${(error as Error).message}`);
    }
  }
);
