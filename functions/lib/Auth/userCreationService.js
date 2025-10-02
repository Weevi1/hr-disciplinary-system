"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResellerUser = exports.resetUserPassword = exports.createOrganizationUsers = exports.createOrganizationAdmin = void 0;
// functions/src/auth/userCreationService.ts
// Firebase Cloud Functions for creating authenticated users
// 🔧 FIXED VERSION - Handles both simple string roles and complex role objects
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
// Initialize Firebase Admin (only if not already initialized)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// 🛡️ Helper function to extract role from both formats
const extractUserRole = (userData) => {
    var _a;
    if (!userData)
        return '';
    // Handle simple string role (current database format)
    if (typeof userData.role === 'string') {
        return userData.role;
    }
    // Handle complex role object (future format)
    if (typeof userData.role === 'object' && ((_a = userData.role) === null || _a === void 0 ? void 0 : _a.id)) {
        return userData.role.id;
    }
    return '';
};
// 🔐 Cloud Function to create authenticated organization admins
exports.createOrganizationAdmin = (0, https_2.onCall)({
    enforceAppCheck: false, // Set to true in production
    cors: true
}, async (request) => {
    try {
        // Check if caller is authenticated
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        console.log(`🔍 Checking permissions for user: ${request.auth.uid}`);
        // Get caller's profile to verify super-user role
        const callerDoc = await admin.firestore()
            .collection('users')
            .doc(request.auth.uid)
            .get();
        if (!callerDoc.exists) {
            console.error(`❌ User profile not found for: ${request.auth.uid}`);
            throw new https_1.HttpsError('permission-denied', 'User profile not found');
        }
        // 🔧 FIXED: Handle both role formats robustly
        const userData = callerDoc.data();
        const userRole = extractUserRole(userData);
        console.log(`🔍 User role detected: "${userRole}" (type: ${typeof (userData === null || userData === void 0 ? void 0 : userData.role)})`);
        // ENHANCED: Allow both super-users AND business owners
        if (userRole !== 'super-user' && userRole !== 'business-owner') {
            console.error(`❌ Permission denied. Required: super-user or business-owner, Found: ${userRole}`);
            throw new https_1.HttpsError('permission-denied', 'Only super-users and business owners can create organization users');
        }
        // Additional security: Business owners can only create users in their own organization
        if (userRole === 'business-owner') {
            const callerOrgId = userData === null || userData === void 0 ? void 0 : userData.organizationId;
            if (callerOrgId !== request.data.organizationId) {
                console.error(`❌ Business owner can only create users in their own organization. Caller org: ${callerOrgId}, Target org: ${request.data.organizationId}`);
                throw new https_1.HttpsError('permission-denied', 'Business owners can only create users in their own organization');
            }
            console.log(`✅ Business owner permission check passed for organization: ${request.data.organizationId}`);
        }
        console.log(`✅ Permission check passed for super-user: ${request.auth.uid}`);
        const { email, password, firstName, lastName, role, organizationId, sendWelcomeEmail = true, requirePasswordChange = false } = request.data;
        // Validate required fields
        if (!email || !password || !firstName || !lastName || !role || !organizationId) {
            throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
        }
        console.log(`🚀 Creating Firebase Auth user for: ${email}`);
        // Create Firebase Authentication user
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false, // They'll verify via welcome email
            disabled: false
        });
        console.log(`✅ Firebase Auth user created: ${userRecord.uid} (${email})`);
        // 🗃️ Create Firestore user profile with simple role format
        const userProfile = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: role, // Store as simple string to match current format
            organizationId: organizationId,
            isActive: true,
            requirePasswordChange: requirePasswordChange,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
            lastLogin: null,
            emailVerified: false
        };
        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(userProfile);
        console.log(`✅ Firestore user profile created for ${email}`);
        // Development mode - log credentials for testing
        if (sendWelcomeEmail) {
            console.log(`📧 [DEVELOPMENT] Welcome email would be sent to: ${email}`);
            console.log(`🔐 Login credentials for ${firstName}:`);
            console.log(`   📧 Email: ${email}`);
            console.log(`   🔑 Password: ${password}`);
            console.log(`   🌐 Login URL: https://${organizationId}.hrdignitysystem.com`);
            console.log(`   ⚠️  Password change required: ${requirePasswordChange}`);
        }
        // Log the creation event for audit trail
        await admin.firestore().collection('auditLogs').add({
            action: 'USER_CREATED',
            resourceType: 'user',
            resourceId: userRecord.uid,
            performedBy: request.auth.uid,
            organizationId: organizationId,
            details: {
                email: email,
                role: role,
                method: 'organization_deployment'
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: request.rawRequest.ip || 'unknown'
        });
        console.log(`✅ Audit log created for user creation: ${email}`);
        return {
            uid: userRecord.uid,
            email: email,
            success: true,
            message: `Administrator account created successfully. Login with: ${email} / ${password}`
        };
    }
    catch (error) {
        console.error('❌ Error creating organization admin:', error);
        // Re-throw HttpsError as-is
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'An account with this email already exists');
        }
        if (error.code === 'auth/invalid-email') {
            throw new https_1.HttpsError('invalid-argument', 'Invalid email address');
        }
        if (error.code === 'auth/weak-password') {
            throw new https_1.HttpsError('invalid-argument', 'Password is too weak');
        }
        // Generic error for unexpected issues
        throw new https_1.HttpsError('internal', 'Failed to create administrator account');
    }
});
// 📝 Additional function to handle bulk user creation for organizations
exports.createOrganizationUsers = (0, https_2.onCall)({
    enforceAppCheck: false,
    cors: true
}, async (request) => {
    try {
        // Verify caller is authenticated
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const callerDoc = await admin.firestore()
            .collection('users')
            .doc(request.auth.uid)
            .get();
        if (!callerDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'User profile not found');
        }
        // 🔧 FIXED: Use robust role extraction
        const userData = callerDoc.data();
        const userRole = extractUserRole(userData);
        console.log(`🔍 Bulk user creation - User role: "${userRole}"`);
        if (userRole !== 'super-user') {
            throw new https_1.HttpsError('permission-denied', `Only super-users can create organization users. Current role: ${userRole}`);
        }
        const { organizationId, users } = request.data;
        const results = [];
        let created = 0;
        let failed = 0;
        console.log(`📝 Creating ${users.length} users for organization: ${organizationId}`);
        // Process each user
        for (const userToCreate of users) {
            try {
                // Create Firebase Authentication user
                const userRecord = await admin.auth().createUser({
                    email: userToCreate.email,
                    password: 'demo123', // Default demo password
                    displayName: `${userToCreate.firstName} ${userToCreate.lastName}`,
                    emailVerified: false,
                    disabled: false
                });
                // Create Firestore user profile
                const userProfile = {
                    email: userToCreate.email,
                    firstName: userToCreate.firstName,
                    lastName: userToCreate.lastName,
                    role: userToCreate.role,
                    organizationId: organizationId,
                    department: userToCreate.department || '',
                    isActive: true,
                    requirePasswordChange: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: request.auth.uid,
                    lastLogin: null,
                    emailVerified: false
                };
                await admin.firestore()
                    .collection('users')
                    .doc(userRecord.uid)
                    .set(userProfile);
                // Log audit event
                await admin.firestore().collection('auditLogs').add({
                    action: 'USER_CREATED',
                    resourceType: 'user',
                    resourceId: userRecord.uid,
                    performedBy: request.auth.uid,
                    organizationId: organizationId,
                    details: {
                        email: userToCreate.email,
                        role: userToCreate.role,
                        method: 'bulk_user_creation'
                    },
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    ipAddress: request.rawRequest.ip || 'unknown'
                });
                results.push({
                    email: userToCreate.email,
                    success: true,
                    uid: userRecord.uid,
                    message: `User created successfully`
                });
                created++;
                console.log(`✅ Created user: ${userToCreate.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to create user ${userToCreate.email}:`, error.message);
                results.push({
                    email: userToCreate.email,
                    success: false,
                    error: error.message || 'Unknown error'
                });
                failed++;
            }
        }
        console.log(`📊 Bulk creation complete: ${created} created, ${failed} failed`);
        return { created, failed, results };
    }
    catch (error) {
        console.error('❌ Error in bulk user creation:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to create organization users');
    }
});
// 🔄 Function to reset user password (for demo/development purposes)
exports.resetUserPassword = (0, https_2.onCall)({
    enforceAppCheck: false,
    cors: true
}, async (request) => {
    try {
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        // 🔧 FIXED: Check caller permissions
        const callerDoc = await admin.firestore()
            .collection('users')
            .doc(request.auth.uid)
            .get();
        if (!callerDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'User profile not found');
        }
        const userData = callerDoc.data();
        const userRole = extractUserRole(userData);
        if (userRole !== 'super-user' && userRole !== 'hr-manager') {
            throw new https_1.HttpsError('permission-denied', 'Insufficient permissions to reset passwords');
        }
        const { email, newPassword = 'demo123' } = request.data;
        console.log(`🔄 Resetting password for: ${email}`);
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        // Update password
        await admin.auth().updateUser(userRecord.uid, {
            password: newPassword
        });
        // Update Firestore profile
        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .update({
            requirePasswordChange: true,
            passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
            passwordResetBy: request.auth.uid
        });
        console.log(`✅ Password reset successfully for ${email}`);
        return {
            success: true,
            message: `Password reset to ${newPassword} for ${email}`
        };
    }
    catch (error) {
        console.error('❌ Error resetting password:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to reset password');
    }
});
// 🏪 Cloud Function to create reseller users without disrupting current session
exports.createResellerUser = (0, https_2.onCall)({
    enforceAppCheck: false,
    cors: true
}, async (request) => {
    try {
        // Verify request authentication
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { email, password, displayName, resellerId, firstName, lastName } = request.data;
        // Validate required fields
        if (!email || !password || !resellerId || !firstName || !lastName) {
            throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
        }
        console.log(`🏪 Creating reseller user: ${email} for reseller: ${resellerId}`);
        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName
        });
        console.log(`✅ Firebase Auth user created: ${userRecord.uid}`);
        // Create user document in Firestore
        const userDocument = {
            id: userRecord.uid,
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: 'reseller',
            resellerId: resellerId,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            permissions: {
                canManageEmployees: false,
                canCreateWarnings: false,
                canViewReports: true,
                canManageUsers: false,
                canManageSettings: false
            }
        };
        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(userDocument);
        console.log(`✅ Firestore user document created for: ${email}`);
        // Log audit event
        await admin.firestore().collection('auditLog').add({
            action: 'RESELLER_USER_CREATED',
            resourceType: 'user',
            resourceId: userRecord.uid,
            performedBy: request.auth.uid,
            details: {
                email: email,
                resellerId: resellerId,
                method: 'cloud_function'
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ipAddress: request.rawRequest.ip || 'unknown'
        });
        return {
            uid: userRecord.uid,
            email: email,
            success: true,
            message: `Reseller user account created successfully`
        };
    }
    catch (error) {
        console.error('❌ Error creating reseller user:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to create reseller user');
    }
});
//# sourceMappingURL=userCreationService.js.map