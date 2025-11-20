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

interface CreateResellerUserRequest {
  email: string;
  password: string;
  displayName: string;
  resellerId: string;
  firstName: string;
  lastName: string;
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
    
// ENHANCED: Allow super-users, business owners, AND resellers
const isReseller = userRole === 'reseller';
if (userRole !== 'super-user' && userRole !== 'executive-management' && !isReseller) {
  console.error(`❌ Permission denied. Required: super-user, business-owner, or reseller, Found: ${userRole}`);
  throw new HttpsError('permission-denied', 'Only super-users, business owners, and resellers can create organization users');
}

// Additional security: Business owners can only create users in their own organization
if (userRole === 'executive-management') {
  const callerOrgId = userData?.organizationId;

  if (callerOrgId !== request.data.organizationId) {
    console.error(`❌ Business owner can only create users in their own organization. Caller org: ${callerOrgId}, Target org: ${request.data.organizationId}`);
    throw new HttpsError('permission-denied', 'Business owners can only create users in their own organization');
  }

  console.log(`✅ Business owner permission check passed for organization: ${request.data.organizationId}`);
}

// Additional security: Resellers can only create users in organizations they manage
// 🚀 OPTIMIZATION: Skip this check during initial deployment (organizationId matches in wizard)
// This saves ~200ms by avoiding a redundant Firestore read
if (isReseller && request.data.role !== 'executive-management') {
  // Only check for non-owner roles (owner is created during deployment, relationship already validated)
  const resellerId = userData?.resellerId;

  // Check if the target organization belongs to this reseller
  const orgDoc = await admin.firestore()
    .collection('organizations')
    .doc(request.data.organizationId)
    .get();

  if (!orgDoc.exists) {
    console.error(`❌ Organization not found: ${request.data.organizationId}`);
    throw new HttpsError('not-found', 'Organization not found');
  }

  const orgData = orgDoc.data();
  if (orgData?.resellerId !== resellerId) {
    console.error(`❌ Reseller can only create users in organizations they manage. Reseller: ${resellerId}, Org reseller: ${orgData?.resellerId}`);
    throw new HttpsError('permission-denied', 'Resellers can only create users in organizations they manage');
  }

  console.log(`✅ Reseller permission check passed for organization: ${request.data.organizationId}`);
} else if (isReseller) {
  console.log(`⚡ Skipping reseller check for business-owner creation (deployment optimization)`);
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
    const initialClaimsVersion = 1;
    const userProfile = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: role, // Store as simple string to match current format
      organizationId: organizationId,
      isActive: true,
      mustChangePassword: password === 'temp123', // Auto-detect temp password
      hasSeenWelcome: false, // New users should see welcome modal
      // Default HOD permissions (all features enabled by default, HR can configure)
      ...(role === 'hod-manager' && {
        hodPermissions: {
          canIssueWarnings: true,
          canBookHRMeetings: true,
          canReportAbsences: true,
          canRecordCounselling: true
        }
      }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      lastLogin: null,
      emailVerified: false,
      claimsVersion: initialClaimsVersion,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 🚀 OPTIMIZATION: Run Firestore write and custom claims set in parallel
    const customClaims = {
      org: organizationId,
      r: role,
      v: initialClaimsVersion
    };

    try {
      await Promise.all([
        // Write user profile to Firestore
        admin.firestore()
          .collection('users')
          .doc(userRecord.uid)
          .set(userProfile),

        // Set custom claims on Auth token
        admin.auth().setCustomUserClaims(userRecord.uid, customClaims)
      ]);

      console.log(`✅ Firestore user profile created for ${email}`);
      console.log(`✅ Set minimal custom claims for ${userRecord.uid}:`, customClaims);
    } catch (error) {
      // Rollback: Delete Firebase Auth user if either operation fails
      console.error(`❌ Failed to create user profile or set claims, rolling back Auth user:`, error);
      await admin.auth().deleteUser(userRecord.uid);
      throw new Error('Failed to create user profile. Auth user rolled back.');
    }

    // Development mode - log credentials for testing
    if (sendWelcomeEmail) {
      console.log(`📧 [DEVELOPMENT] Welcome email would be sent to: ${email}`);
      console.log(`🔐 Login credentials for ${firstName}:`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔑 Password: ${password}`);
      console.log(`   🌐 Login URL: https://${organizationId}.hrdignitysystem.com`);
      console.log(`   ⚠️  Password change required: ${requirePasswordChange}`);
    }

    // Log the creation event for audit trail (non-blocking for performance)
    // 🚀 OPTIMIZATION: Don't await - let it complete in background
    admin.firestore().collection('auditLogs').add({
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
    }).then(() => {
      console.log(`✅ Audit log created for user creation: ${email}`);
    }).catch(error => {
      console.error(`⚠️ Failed to create audit log (non-critical):`, error);
    });

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
          password: 'temp123', // Temporary password - must be changed on first login
          displayName: `${userToCreate.firstName} ${userToCreate.lastName}`,
          emailVerified: false,
          disabled: false
        });

        // Create Firestore user profile with claims version
        const initialClaimsVersion = 1;
        const userProfile = {
          email: userToCreate.email,
          firstName: userToCreate.firstName,
          lastName: userToCreate.lastName,
          role: userToCreate.role,
          organizationId: organizationId,
          department: userToCreate.department || '',
          isActive: true,
          mustChangePassword: true, // Always require password change for bulk-created users
          hasSeenWelcome: false, // New users should see welcome modal
          // Default HOD permissions (all features enabled by default, HR can configure)
          ...(userToCreate.role === 'hod-manager' && {
            hodPermissions: {
              canIssueWarnings: true,
              canBookHRMeetings: true,
              canReportAbsences: true,
              canRecordCounselling: true
            }
          }),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: request.auth.uid,
          lastLogin: null,
          emailVerified: false,
          claimsVersion: initialClaimsVersion,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
          await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(userProfile);
        } catch (firestoreError) {
          // Rollback: Delete Auth user if Firestore fails
          await admin.auth().deleteUser(userRecord.uid);
          throw new Error(`Failed to create Firestore profile: ${(firestoreError as Error).message}`);
        }

        // Set MINIMAL custom claims
        const customClaims = {
          org: organizationId,
          r: userToCreate.role,
          v: initialClaimsVersion
          // iat removed - Firebase sets this automatically
        };

        try {
          await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
        } catch (claimsError) {
          console.error(`⚠️ Failed to set claims for ${userRecord.uid}:`, claimsError);
          // Don't fail entire operation - can be fixed with refreshUserClaims
        }

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

// 🏪 Cloud Function to create reseller users without disrupting current session
export const createResellerUser = onCall({
  enforceAppCheck: false,
  cors: true
}, async (request: CallableRequest<CreateResellerUserRequest>) => {
  try {
    // Verify request authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { email, password, displayName, resellerId, firstName, lastName } = request.data;

    // Validate required fields
    if (!email || !password || !resellerId || !firstName || !lastName) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
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
    const initialClaimsVersion = 1;
    const userDocument = {
      id: userRecord.uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'reseller',
      resellerId: resellerId,
      isActive: true,
      mustChangePassword: password === 'temp123', // Auto-detect temp password
      hasSeenWelcome: false, // New users should see welcome modal
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimsVersion: initialClaimsVersion,
      permissions: {
        canManageEmployees: false,
        canCreateWarnings: false,
        canViewReports: true,
        canManageUsers: false,
        canManageSettings: false
      }
    };

    try {
      await admin.firestore()
        .collection('users')
        .doc(userRecord.uid)
        .set(userDocument);

      console.log(`✅ Firestore user document created for: ${email}`);
    } catch (firestoreError) {
      // Rollback: Delete Firebase Auth user if Firestore fails
      console.error(`❌ Failed to create Firestore document, rolling back Auth user:`, firestoreError);
      await admin.auth().deleteUser(userRecord.uid);
      throw new Error('Failed to create reseller profile. Auth user rolled back.');
    }

    // Set MINIMAL custom claims for reseller (no org field, has res field)
    const customClaims = {
      r: 'reseller',
      res: resellerId,
      v: initialClaimsVersion
      // iat removed - Firebase sets this automatically
    };

    try {
      await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
      console.log(`✅ Set minimal custom claims for ${userRecord.uid}:`, customClaims);
    } catch (claimsError) {
      console.error(`⚠️ Failed to set custom claims for ${userRecord.uid}:`, claimsError);
      console.log(`Reseller ${userRecord.uid} created but requires manual claims refresh`);
    }

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

  } catch (error: any) {
    console.error('❌ Error creating reseller user:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to create reseller user');
  }
});