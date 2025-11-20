// functions/src/customClaims.ts
// Firebase Auth Custom Claims Management for Sharded User System
// ✅ API v1.0.0 - Versioned responses

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { versionedFunction, logApiUsage } from './middleware/apiVersioning';

// Initialize Firebase Admin if not already initialized
try {
  initializeApp();
} catch (e) {
  // Already initialized
}

const auth = getAuth();
const db = getFirestore();

/**
 * Manually refresh custom claims for a user
 * Can be called from the frontend after user data changes
 */
export const refreshUserClaims = onCall(async (request) => {
  const { uid } = request.auth || {};
  const { targetUserId } = request.data || {};
  
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // If no target user specified, refresh current user
  const userIdToRefresh = targetUserId || uid;

  try {
    logger.info(`🔄 [CUSTOM CLAIMS] Refreshing claims for user: ${userIdToRefresh}`);

    // Check if requesting user has permission to refresh claims for target user
    const requestingUserClaims = await auth.getUser(uid).then(user => user.customClaims);
    const isSuperUser = requestingUserClaims?.role === 'super-user';
    const isBusinessOwner = requestingUserClaims?.role === 'executive-management';
    const isSameUser = uid === userIdToRefresh;
    
    if (!isSuperUser && !isSameUser && !isBusinessOwner) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to refresh claims');
    }

    // First, check root /users collection for super-users
    const rootUserDoc = await db.collection('users').doc(userIdToRefresh).get();

    let userData: any;
    let organizationId: string;

    if (rootUserDoc.exists) {
      // User found in root collection (likely super-user or reseller)
      logger.info(`📍 [CUSTOM CLAIMS] Found user ${userIdToRefresh} in root /users collection`);
      userData = rootUserDoc.data();
      organizationId = userData.organizationId || 'system';
    } else {
      // Find user in sharded collections
      const userDoc = await findUserInShardedCollections(userIdToRefresh);

      if (!userDoc) {
        throw new HttpsError('not-found', 'User not found in root or sharded collections');
      }

      userData = userDoc.userData;
      organizationId = userDoc.organizationId;
    }

    // Prepare MINIMAL custom claims (defense against 1000 byte limit)
    // Full permissions are in Firestore - backend functions MUST check there
    const roleId = userData.role?.id || userData.role;
    const claimsVersion = userData.claimsVersion || 1;

    // Build minimal claims based on user type
    let customClaims: any;

    if (roleId === 'reseller') {
      // Resellers don't have organizationId, they have resellerId
      customClaims = {
        r: roleId,
        res: userData.resellerId || organizationId,
        v: claimsVersion
      };
    } else if (roleId === 'super-user') {
      // Super users have special org value
      customClaims = {
        org: 'SYSTEM',
        r: roleId,
        v: claimsVersion
      };
    } else {
      // Normal organization users
      customClaims = {
        org: organizationId,
        r: roleId,
        v: claimsVersion
      };
    }

    // Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(userIdToRefresh, customClaims);

    logger.info(`✅ [CUSTOM CLAIMS] Minimal claims refreshed for ${userIdToRefresh}:`, customClaims);

    return {
      success: true,
      claims: customClaims,
      message: 'Custom claims refreshed successfully'
    };

  } catch (error) {
    logger.error(`❌ [CUSTOM CLAIMS] Failed to refresh claims for ${userIdToRefresh}:`, error);
    throw error;
  }
});

/**
 * Get current user's custom claims (for debugging)
 * ✅ API v1.0.0 - Returns versioned response
 */
export const getUserClaims = onCall(versionedFunction('getUserClaims', async (request) => {
  const { uid } = request.auth || {};

  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Log API usage for monitoring
    logApiUsage('getUserClaims', '1.0.0', uid);

    const user = await auth.getUser(uid);
    return {
      uid,
      email: user.email,
      claims: user.customClaims || {},
      tokensValidAfterTime: user.tokensValidAfterTime
    };
  } catch (error) {
    logger.error(`❌ [CUSTOM CLAIMS] Failed to get claims for ${uid}:`, error);
    throw new HttpsError('internal', 'Failed to retrieve user claims');
  }
}));

/**
 * Find user document in sharded collections by searching organizations
 */
async function findUserInShardedCollections(uid: string): Promise<{
  userData: any;
  organizationId: string;
} | null> {
  try {
    // First, try to get organizations the user might belong to
    // We'll search through recent organizations or use a more efficient method
    
    // Strategy 1: Search through active organizations (limit to reasonable number)
    const orgsSnapshot = await db.collection('organizations')
      .where('isActive', '==', true)
      .limit(100) // Reasonable limit for now
      .get();

    for (const orgDoc of orgsSnapshot.docs) {
      const organizationId = orgDoc.id;
      
      try {
        // Check if user exists in this organization's sharded users collection
        const userDoc = await db.collection(`organizations/${organizationId}/users`)
          .doc(uid)
          .get();

        if (userDoc.exists) {
          logger.info(`📍 [CUSTOM CLAIMS] Found user ${uid} in organization: ${organizationId}`);
          return {
            userData: userDoc.data(),
            organizationId
          };
        }
      } catch (orgError) {
        // Continue searching other organizations
        logger.debug(`🔍 [CUSTOM CLAIMS] User ${uid} not in org ${organizationId}`);
      }
    }

    // Strategy 2: If not found in active orgs, check if we have a flat user record with orgId
    try {
      const flatUserDoc = await db.collection('users').doc(uid).get();
      if (flatUserDoc.exists) {
        const flatUserData = flatUserDoc.data();
        if (flatUserData?.organizationId) {
          // Try to find in the specified organization
          const userDoc = await db.collection(`organizations/${flatUserData.organizationId}/users`)
            .doc(uid)
            .get();
          
          if (userDoc.exists) {
            logger.info(`📍 [CUSTOM CLAIMS] Found user ${uid} via flat record in org: ${flatUserData.organizationId}`);
            return {
              userData: userDoc.data(),
              organizationId: flatUserData.organizationId
            };
          }
        }
      }
    } catch (flatError) {
      logger.debug(`🔍 [CUSTOM CLAIMS] No flat user record found for ${uid}`);
    }

    logger.warn(`⚠️ [CUSTOM CLAIMS] User ${uid} not found in any sharded collections`);
    return null;

  } catch (error) {
    logger.error(`❌ [CUSTOM CLAIMS] Error searching for user ${uid}:`, error);
    return null;
  }
}

/**
 * Bulk refresh claims for all users in an organization
 * Useful for organization setup or migration
 */
export const refreshOrganizationUserClaims = onCall(async (request) => {
  const { uid } = request.auth || {};
  const { organizationId } = request.data || {};
  
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!organizationId) {
    throw new HttpsError('invalid-argument', 'Organization ID is required');
  }

  try {
    // Check permissions
    const requestingUserClaims = await auth.getUser(uid).then(user => user.customClaims);
    const isSuperUser = requestingUserClaims?.role === 'super-user';
    const isOrgBusinessOwner = requestingUserClaims?.role === 'executive-management' && 
                              requestingUserClaims?.organizationId === organizationId;
    
    if (!isSuperUser && !isOrgBusinessOwner) {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }

    logger.info(`🔄 [BULK CLAIMS] Refreshing claims for organization: ${organizationId}`);

    // Get all users in the organization
    const usersSnapshot = await db.collection(`organizations/${organizationId}/users`).get();
    const results = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        const roleId = userData.role?.id || userData.role;
        const claimsVersion = userData.claimsVersion || 1;

        // Build minimal claims
        const customClaims = {
          org: organizationId,
          r: roleId,
          v: claimsVersion
        };

        await auth.setCustomUserClaims(userId, customClaims);
        results.push({ userId, success: true, role: userData.role });

      } catch (error) {
        logger.error(`❌ [BULK CLAIMS] Failed to set claims for ${userId}:`, error);
        results.push({ userId, success: false, error: (error as Error).message });
      }
    }

    logger.info(`✅ [BULK CLAIMS] Bulk refresh completed for ${organizationId}. Results:`, results);

    return {
      success: true,
      organizationId,
      results,
      totalUsers: results.length,
      successCount: results.filter(r => r.success).length
    };

  } catch (error) {
    logger.error(`❌ [BULK CLAIMS] Bulk refresh failed for ${organizationId}:`, error);
    throw error;
  }
});