"use strict";
// functions/src/customClaims.ts
// Firebase Auth Custom Claims Management for Sharded User System
// ✅ API v1.0.0 - Versioned responses
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshOrganizationUserClaims = exports.getUserClaims = exports.refreshUserClaims = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const apiVersioning_1 = require("./middleware/apiVersioning");
// Initialize Firebase Admin if not already initialized
try {
    (0, app_1.initializeApp)();
}
catch (e) {
    // Already initialized
}
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
/**
 * Manually refresh custom claims for a user
 * Can be called from the frontend after user data changes
 */
exports.refreshUserClaims = (0, https_1.onCall)(async (request) => {
    var _a;
    const { uid } = request.auth || {};
    const { targetUserId } = request.data || {};
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // If no target user specified, refresh current user
    const userIdToRefresh = targetUserId || uid;
    try {
        firebase_functions_1.logger.info(`🔄 [CUSTOM CLAIMS] Refreshing claims for user: ${userIdToRefresh}`);
        // Check if requesting user has permission to refresh claims for target user
        const requestingUserClaims = await auth.getUser(uid).then(user => user.customClaims);
        const isSuperUser = (requestingUserClaims === null || requestingUserClaims === void 0 ? void 0 : requestingUserClaims.role) === 'super-user';
        const isBusinessOwner = (requestingUserClaims === null || requestingUserClaims === void 0 ? void 0 : requestingUserClaims.role) === 'business-owner';
        const isSameUser = uid === userIdToRefresh;
        if (!isSuperUser && !isSameUser && !isBusinessOwner) {
            throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to refresh claims');
        }
        // First, check root /users collection for super-users
        const rootUserDoc = await db.collection('users').doc(userIdToRefresh).get();
        let userData;
        let organizationId;
        if (rootUserDoc.exists) {
            // User found in root collection (likely super-user or reseller)
            firebase_functions_1.logger.info(`📍 [CUSTOM CLAIMS] Found user ${userIdToRefresh} in root /users collection`);
            userData = rootUserDoc.data();
            organizationId = userData.organizationId || 'system';
        }
        else {
            // Find user in sharded collections
            const userDoc = await findUserInShardedCollections(userIdToRefresh);
            if (!userDoc) {
                throw new https_1.HttpsError('not-found', 'User not found in root or sharded collections');
            }
            userData = userDoc.userData;
            organizationId = userDoc.organizationId;
        }
        // Prepare custom claims
        const customClaims = {
            role: ((_a = userData.role) === null || _a === void 0 ? void 0 : _a.id) || userData.role, // Extract ID if role is an object
            organizationId: organizationId,
            permissions: userData.permissions ? Object.keys(userData.permissions) : [],
            lastUpdated: Date.now()
        };
        // Set custom claims in Firebase Auth
        await auth.setCustomUserClaims(userIdToRefresh, customClaims);
        firebase_functions_1.logger.info(`✅ [CUSTOM CLAIMS] Claims refreshed successfully for ${userIdToRefresh}:`, customClaims);
        return {
            success: true,
            claims: customClaims,
            message: 'Custom claims refreshed successfully'
        };
    }
    catch (error) {
        firebase_functions_1.logger.error(`❌ [CUSTOM CLAIMS] Failed to refresh claims for ${userIdToRefresh}:`, error);
        throw error;
    }
});
/**
 * Get current user's custom claims (for debugging)
 * ✅ API v1.0.0 - Returns versioned response
 */
exports.getUserClaims = (0, https_1.onCall)((0, apiVersioning_1.versionedFunction)('getUserClaims', async (request) => {
    const { uid } = request.auth || {};
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Log API usage for monitoring
        (0, apiVersioning_1.logApiUsage)('getUserClaims', '1.0.0', uid);
        const user = await auth.getUser(uid);
        return {
            uid,
            email: user.email,
            claims: user.customClaims || {},
            tokensValidAfterTime: user.tokensValidAfterTime
        };
    }
    catch (error) {
        firebase_functions_1.logger.error(`❌ [CUSTOM CLAIMS] Failed to get claims for ${uid}:`, error);
        throw new https_1.HttpsError('internal', 'Failed to retrieve user claims');
    }
}));
/**
 * Find user document in sharded collections by searching organizations
 */
async function findUserInShardedCollections(uid) {
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
                    firebase_functions_1.logger.info(`📍 [CUSTOM CLAIMS] Found user ${uid} in organization: ${organizationId}`);
                    return {
                        userData: userDoc.data(),
                        organizationId
                    };
                }
            }
            catch (orgError) {
                // Continue searching other organizations
                firebase_functions_1.logger.debug(`🔍 [CUSTOM CLAIMS] User ${uid} not in org ${organizationId}`);
            }
        }
        // Strategy 2: If not found in active orgs, check if we have a flat user record with orgId
        try {
            const flatUserDoc = await db.collection('users').doc(uid).get();
            if (flatUserDoc.exists) {
                const flatUserData = flatUserDoc.data();
                if (flatUserData === null || flatUserData === void 0 ? void 0 : flatUserData.organizationId) {
                    // Try to find in the specified organization
                    const userDoc = await db.collection(`organizations/${flatUserData.organizationId}/users`)
                        .doc(uid)
                        .get();
                    if (userDoc.exists) {
                        firebase_functions_1.logger.info(`📍 [CUSTOM CLAIMS] Found user ${uid} via flat record in org: ${flatUserData.organizationId}`);
                        return {
                            userData: userDoc.data(),
                            organizationId: flatUserData.organizationId
                        };
                    }
                }
            }
        }
        catch (flatError) {
            firebase_functions_1.logger.debug(`🔍 [CUSTOM CLAIMS] No flat user record found for ${uid}`);
        }
        firebase_functions_1.logger.warn(`⚠️ [CUSTOM CLAIMS] User ${uid} not found in any sharded collections`);
        return null;
    }
    catch (error) {
        firebase_functions_1.logger.error(`❌ [CUSTOM CLAIMS] Error searching for user ${uid}:`, error);
        return null;
    }
}
/**
 * Bulk refresh claims for all users in an organization
 * Useful for organization setup or migration
 */
exports.refreshOrganizationUserClaims = (0, https_1.onCall)(async (request) => {
    var _a;
    const { uid } = request.auth || {};
    const { organizationId } = request.data || {};
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    if (!organizationId) {
        throw new https_1.HttpsError('invalid-argument', 'Organization ID is required');
    }
    try {
        // Check permissions
        const requestingUserClaims = await auth.getUser(uid).then(user => user.customClaims);
        const isSuperUser = (requestingUserClaims === null || requestingUserClaims === void 0 ? void 0 : requestingUserClaims.role) === 'super-user';
        const isOrgBusinessOwner = (requestingUserClaims === null || requestingUserClaims === void 0 ? void 0 : requestingUserClaims.role) === 'business-owner' &&
            (requestingUserClaims === null || requestingUserClaims === void 0 ? void 0 : requestingUserClaims.organizationId) === organizationId;
        if (!isSuperUser && !isOrgBusinessOwner) {
            throw new https_1.HttpsError('permission-denied', 'Insufficient permissions');
        }
        firebase_functions_1.logger.info(`🔄 [BULK CLAIMS] Refreshing claims for organization: ${organizationId}`);
        // Get all users in the organization
        const usersSnapshot = await db.collection(`organizations/${organizationId}/users`).get();
        const results = [];
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            try {
                const customClaims = {
                    role: ((_a = userData.role) === null || _a === void 0 ? void 0 : _a.id) || userData.role, // Extract ID if role is an object
                    organizationId: organizationId,
                    permissions: userData.permissions ? Object.keys(userData.permissions) : [],
                    lastUpdated: Date.now()
                };
                await auth.setCustomUserClaims(userId, customClaims);
                results.push({ userId, success: true, role: userData.role });
            }
            catch (error) {
                firebase_functions_1.logger.error(`❌ [BULK CLAIMS] Failed to set claims for ${userId}:`, error);
                results.push({ userId, success: false, error: error.message });
            }
        }
        firebase_functions_1.logger.info(`✅ [BULK CLAIMS] Bulk refresh completed for ${organizationId}. Results:`, results);
        return {
            success: true,
            organizationId,
            results,
            totalUsers: results.length,
            successCount: results.filter(r => r.success).length
        };
    }
    catch (error) {
        firebase_functions_1.logger.error(`❌ [BULK CLAIMS] Bulk refresh failed for ${organizationId}:`, error);
        throw error;
    }
});
//# sourceMappingURL=customClaims.js.map