// functions/src/auth/userCreationService.ts
// Firebase Cloud Functions for creating authenticated users
// 🔧 FIXED VERSION - Handles both simple string roles and complex role objects
import * as admin from 'firebase-admin';
import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onCall } from 'firebase-functions/v2/https';

// Initialize Firebase Admin (only if not already initialized)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  sendWelcomeEmail?: boolean;
  requirePasswordChange?: boolean;
}

interface CreateUserResponse {
  uid: string;
  email: string;
  success: boolean;
  message: string;
}

// 🛡️ Helper function to extract role from both formats
const extractUserRole = (userData: any): string => {
  if (!userData) return '';
  
  // Handle simple string role (current database format)
  if (typeof userData.role === 'string') {
    return userData.role;
  }
  
  // Handle complex role object (future format)
  if (typeof userData.role === 'object' && userData.role?.id) {
    return userData.role.id;
  }
  
  return '';
};

// 🔐 Cloud Function to create authenticated organization admins
export const createOrganizationAdmin = onCall({
  enforceAppCheck: false, // Set to true in production
  cors: true
}, async (request: CallableRequest<CreateUserRequest>): Promise<CreateUserResponse> => {
  try {
    // Check if caller is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    console.log(`🔍 Checking permissions for user: ${request.auth.uid}`);

    // Get caller's profile to verify super-user role
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .get();

    if (!callerDoc.exists) {
      console.error(`❌ User profile not found for: ${request.auth.uid}`);
      throw new HttpsError('permission-denied', 'User profile not found');
    }

    // 🔧 FIXED: Handle both role formats robustly
    const userData = callerDoc.data();
    const userRole = extractUserRole(userData);
    
    console.log(`🔍 User role detected: "${userRole}" (type: ${typeof userData?.role})`);
    
// ENHANCED: Allow both super-users AND business owners
if (userRole !== 'super-user' && userRole !== 'business-owner') {
  console.error(`❌ Permission denied. Required: super-user or business-owner, Found: ${userRole}`);
  throw new HttpsError('permission-denied', 'Only super-users and business owners can create organization users');
}

// Additional security: Business owners can only create users in their own organization
if (userRole === 'business-owner') {
  const callerOrgId = userData?.organizationId;
  
  if (callerOrgId !== request.data.organizationId) {
    console.error(`❌ Business owner can only create users in their own organization. Caller org: ${callerOrgId}, Target org: ${request.data.organizationId}`);
    throw new HttpsError('permission-denied', 'Business owners can only create users in their own organization');
  }
  
  console.log(`✅ Business owner permission check passed for organization: ${request.data.organizationId}`);
}

    console.log(`✅ Permission check passed for super-user: ${request.auth.uid}`);

    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      organizationId,
      sendWelcomeEmail = true,
      requirePasswordChange = false
    } = request.data;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !organizationId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
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

  } catch (error: any) {
    console.error('❌ Error creating organization admin:', error);
    
    // Re-throw HttpsError as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists');
    }

    if (error.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Invalid email address');
    }

    if (error.code === 'auth/weak-password') {
      throw new HttpsError('invalid-argument', 'Password is too weak');
    }

    // Generic error for unexpected issues
    throw new HttpsError('internal', 'Failed to create administrator account');
  }
});

// 📝 Additional function to handle bulk user creation for organizations
export const createOrganizationUsers = onCall({
  enforceAppCheck: false,
  cors: true
}, async (request: CallableRequest<{
  organizationId: string;
  users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
  }>;
}>): Promise<{ created: number; failed: number; results: any[] }> => {
  try {
    // Verify caller is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .get();

    if (!callerDoc.exists) {
      throw new HttpsError('permission-denied', 'User profile not found');
    }

    // 🔧 FIXED: Use robust role extraction
    const userData = callerDoc.data();
    const userRole = extractUserRole(userData);

    console.log(`🔍 Bulk user creation - User role: "${userRole}"`);

    if (userRole !== 'super-user') {
      throw new HttpsError('permission-denied', `Only super-users can create organization users. Current role: ${userRole}`);
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
      } catch (error: any) {
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
  } catch (error: any) {
    console.error('❌ Error in bulk user creation:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to create organization users');
  }
});

// 🔄 Function to reset user password (for demo/development purposes)
export const resetUserPassword = onCall({
  enforceAppCheck: false,
  cors: true
}, async (request: CallableRequest<{
  email: string;
  newPassword?: string;
}>): Promise<{ success: boolean; message: string }> => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // 🔧 FIXED: Check caller permissions
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(request.auth.uid)
      .get();

    if (!callerDoc.exists) {
      throw new HttpsError('permission-denied', 'User profile not found');
    }

    const userData = callerDoc.data();
    const userRole = extractUserRole(userData);

    if (userRole !== 'super-user' && userRole !== 'hr-manager') {
      throw new HttpsError('permission-denied', 'Insufficient permissions to reset passwords');
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

  } catch (error: any) {
    console.error('❌ Error resetting password:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to reset password');
  }
});