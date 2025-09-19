// functions/src/customClaims.ts
// Firebase Auth Custom Claims Management for Sharded User System

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
try {
  initializeApp();
} catch (e) {
  // Already initialized
}

const auth = getAuth();
const db = getFirestore();

interface UserClaims {
  role: string;
  organizationId: string;
  permissions?: string[];
  lastUpdated: number;
}

/**
 * Before Sign In Hook - Sets custom claims from sharded user data
 * This runs automatically whenever a user signs in
 */
export const setCustomClaimsOnSignIn = beforeUserSignedIn(async (event: any) => {
  const { uid, email } = event.data;
  
  try {
    logger.info(`🔐 [CUSTOM CLAIMS] Setting claims for user: ${uid} (${email})`);

    // Find user in sharded collections by searching all organizations
    const userDoc = await findUserInShardedCollections(uid);
    
    if (!userDoc) {
      logger.warn(`⚠️ [CUSTOM CLAIMS] User not found in sharded collections: ${uid}`);
      // Don't block sign-in, but user will have 'guest' role
      return;
    }

    const { userData, organizationId } = userDoc;

    // Prepare custom claims
    const customClaims: UserClaims = {
      role: userData.role,
      organizationId: organizationId,
      permissions: userData.permissions ? Object.keys(userData.permissions) : [],
      lastUpdated: Date.now()
    };

    // Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(uid, customClaims);
    
    logger.info(`✅ [CUSTOM CLAIMS] Claims set successfully for ${uid}:`, customClaims);

  } catch (error) {
    logger.error(`❌ [CUSTOM CLAIMS] Failed to set claims for ${uid}:`, error);
    // Don't throw error to avoid blocking sign-in
    // User will just have default 'guest' permissions
  }
});

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
    const isBusinessOwner = requestingUserClaims?.role === 'business-owner';
    const isSameUser = uid === userIdToRefresh;
    
    if (!isSuperUser && !isSameUser && !isBusinessOwner) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to refresh claims');
    }

    // Find user in sharded collections
    const userDoc = await findUserInShardedCollections(userIdToRefresh);
    
    if (!userDoc) {
      throw new HttpsError('not-found', 'User not found in sharded collections');
    }

    const { userData, organizationId } = userDoc;

    // Prepare custom claims
    const customClaims: UserClaims = {
      role: userData.role,
      organizationId: organizationId,
      permissions: userData.permissions ? Object.keys(userData.permissions) : [],
      lastUpdated: Date.now()
    };

    // Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(userIdToRefresh, customClaims);
    
    logger.info(`✅ [CUSTOM CLAIMS] Claims refreshed successfully for ${userIdToRefresh}:`, customClaims);

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
 */
export const getUserClaims = onCall(async (request) => {
  const { uid } = request.auth || {};
  
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
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
});

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
    const isOrgBusinessOwner = requestingUserClaims?.role === 'business-owner' && 
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
        const customClaims: UserClaims = {
          role: userData.role,
          organizationId: organizationId,
          permissions: userData.permissions ? Object.keys(userData.permissions) : [],
          lastUpdated: Date.now()
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