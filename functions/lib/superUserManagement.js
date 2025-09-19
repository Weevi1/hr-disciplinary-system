"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSuperUser = exports.getSuperUserInfo = exports.manageSuperUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const superUserAuth_1 = require("./middleware/superUserAuth");
/**
 * Secure SuperUser Management Function
 * Only callable by existing super-users with proper authentication
 */
exports.manageSuperUser = (0, https_1.onCall)({
    region: 'us-east1',
    enforceAppCheck: false,
    cors: true, // Enable CORS
}, async (request) => {
    var _a, _b, _c;
    const { data } = request;
    // Debug logging
    firebase_functions_1.logger.info('SuperUser management request received', {
        action: data.action,
        targetUserId: data.targetUserId,
        hasNewEmail: !!data.newEmail,
        authUid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid
    });
    // Handle missing targetUserId by using current user
    const targetUserId = data.targetUserId || ((_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid);
    if (!targetUserId) {
        throw new https_1.HttpsError('invalid-argument', 'Target user ID is required');
    }
    // 1. COMPREHENSIVE AUTHENTICATION & AUTHORIZATION
    const context = await superUserAuth_1.SuperUserAuthMiddleware.validateSelfManagement(request, targetUserId);
    // 2. AUDIT LOGGING
    await superUserAuth_1.SuperUserAuthMiddleware.auditLog(context, 'manage-super-user', {
        targetUserId: targetUserId,
        action: data.action,
        ipAddress: ((_c = request.rawRequest) === null || _c === void 0 ? void 0 : _c.ip) || 'emulator'
    });
    try {
        const adminAuth = (0, auth_1.getAuth)();
        const db = (0, firestore_1.getFirestore)();
        switch (data.action) {
            case 'UPDATE_EMAIL':
                if (!data.newEmail || !isValidEmail(data.newEmail)) {
                    throw new https_1.HttpsError('invalid-argument', 'Valid email address is required');
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
                firebase_functions_1.logger.info('SuperUser email updated successfully', {
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
                    throw new https_1.HttpsError('invalid-argument', 'Password must be at least 12 characters long');
                }
                await adminAuth.updateUser(targetUserId, {
                    password: data.newPassword
                });
                firebase_functions_1.logger.info('SuperUser password updated successfully', {
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
                const superUserCount = existingSuperUsers.users.filter(user => { var _a; return ((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role) === 'super-user'; }).length;
                if (superUserCount >= 3) {
                    throw new https_1.HttpsError('resource-exhausted', 'Maximum of 3 super-users allowed');
                }
                await adminAuth.setCustomUserClaims(targetUserId, {
                    role: 'super-user',
                    permissions: ['all'],
                    grantedBy: context.uid,
                    grantedAt: new Date().toISOString()
                });
                firebase_functions_1.logger.warn('SuperUser privileges granted', {
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
                    throw new https_1.HttpsError('invalid-argument', 'Cannot revoke your own super-user privileges');
                }
                await adminAuth.setCustomUserClaims(targetUserId, {
                    role: 'business-owner',
                    permissions: [],
                    revokedBy: context.uid,
                    revokedAt: new Date().toISOString()
                });
                firebase_functions_1.logger.warn('SuperUser privileges revoked', {
                    targetUserId: targetUserId,
                    revokedBy: context.uid
                });
                return {
                    success: true,
                    message: 'Super-user privileges revoked'
                };
            default:
                throw new https_1.HttpsError('invalid-argument', 'Invalid action specified');
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('SuperUser management failed', {
            error: error.message,
            userId: targetUserId,
            action: data.action,
            initiatedBy: context.uid
        });
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'SuperUser management failed');
    }
});
/**
 * Get Super-User Information (for security audits)
 */
exports.getSuperUserInfo = (0, https_1.onCall)({
    region: 'us-east1',
    cors: true, // Enable CORS
}, async (request) => {
    // Validate super-user permissions
    await superUserAuth_1.SuperUserAuthMiddleware.validateSuperUser(request, {
        requireSuperUser: true,
        requiredPermissions: ['users:read', 'all']
    });
    const adminAuth = (0, auth_1.getAuth)();
    const allUsers = await adminAuth.listUsers();
    const superUsers = allUsers.users
        .filter(user => { var _a; return ((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role) === 'super-user'; })
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
});
// Helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Initialize Super-User Account (One-time use)
 * This function should be called once to create the initial super-user
 */
exports.initializeSuperUser = (0, https_1.onCall)({
    region: 'us-central1',
}, async (request) => {
    const { data } = request;
    // This function should only work if no super-users exist
    const adminAuth = (0, auth_1.getAuth)();
    const allUsers = await adminAuth.listUsers();
    const existingSuperUsers = allUsers.users.filter(user => { var _a; return ((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.role) === 'super-user'; });
    if (existingSuperUsers.length > 0) {
        throw new https_1.HttpsError('already-exists', 'Super-user already exists. Use manageSuperUser function instead.');
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
    firebase_functions_1.logger.info('Initial SuperUser created', {
        uid: userRecord.uid,
        email: data.email
    });
    return {
        success: true,
        message: 'Initial super-user account created successfully',
        userId: userRecord.uid
    };
});
//# sourceMappingURL=superUserManagement.js.map