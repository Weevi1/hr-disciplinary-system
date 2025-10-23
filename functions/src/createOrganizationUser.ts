// functions/src/createOrganizationUser.ts
// Cloud Function to create organization users without affecting client auth session

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'hr-manager' | 'hod-manager';
  organizationId: string;
  departmentIds?: string[];
  // New employee creation flags
  createEmployee?: boolean; // Flag to create employee record for new managers
  employeeId?: string; // Link to existing employee when promoting
  updateEmployeeEmail?: boolean; // Update employee record with verified email
}

export const createOrganizationUser = onCall<CreateUserRequest>(
  {
    region: 'us-central1',
    cors: true
  },
  async (request) => {
    try {
      // Verify the caller is authenticated
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated to create users');
      }

      const { data } = request;
      const {
        firstName,
        lastName,
        email,
        password,
        role,
        organizationId,
        departmentIds = [],
        createEmployee = false,
        employeeId,
        updateEmployeeEmail = false
      } = data;

      logger.info(`Creating ${role} user: ${email} for org: ${organizationId}`);

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role || !organizationId) {
        throw new HttpsError('invalid-argument', 'Missing required fields');
      }

      // Validate role
      if (!['hr-manager', 'hod-manager'].includes(role)) {
        throw new HttpsError('invalid-argument', 'Invalid role specified');
      }

      // Verify caller has permission to create users in this organization
      const auth = getAuth();
      const callerRecord = await auth.getUser(request.auth.uid);

      // Get caller's organization info from Firestore
      const db = getFirestore();
      const callerDocRef = db.doc(`organizations/${organizationId}/users/${request.auth.uid}`);
      const callerDoc = await callerDocRef.get();

      if (!callerDoc.exists) {
        throw new HttpsError('permission-denied', 'User not found in organization');
      }

      const callerData = callerDoc.data();
      const callerRole = typeof callerData?.role === 'string' ? callerData.role : callerData?.role?.id;

      // Business owners and HR managers can create HR/HOD managers
      if (callerRole !== 'business-owner' && callerRole !== 'hr-manager') {
        throw new HttpsError('permission-denied', 'Only business owners and HR managers can create managers');
      }

      // Create Firebase Auth user (server-side, won't affect client session)
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false
      });

      logger.info(`Created Firebase Auth user: ${userRecord.uid}`);

      // Prepare role data
      const roleData = {
        id: role,
        name: role === 'hr-manager' ? 'HR Manager' : 'Department Manager',
        description: role === 'hr-manager' ? 'Human Resources Manager' : 'Head of Department Manager',
        level: role === 'hr-manager' ? 3 : 2
      };

      // Create Firestore user document in sharded structure
      const userData = {
        uid: userRecord.uid,
        id: userRecord.uid,
        firstName,
        lastName,
        email,
        role: roleData,
        organizationId,
        departmentIds: role === 'hod-manager' ? departmentIds : [],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        permissions: [{
          resource: 'employees',
          actions: role === 'hr-manager' ? ['create', 'read', 'update', 'delete'] : ['read'],
          scope: 'organization'
        }, {
          resource: 'warnings',
          actions: role === 'hod-manager' ? ['create', 'read', 'update'] : ['read'],
          scope: role === 'hod-manager' ? 'department' : 'organization'
        }],
        createdBy: request.auth.uid,
        createdByEmail: callerRecord.email
      };

      // Initialize claims version (starts at 1)
      const initialClaimsVersion = 1;
      const extendedUserData = {
        ...userData,
        claimsVersion: initialClaimsVersion,
        updatedAt: new Date().toISOString()
      };

      // Save to sharded collection with claims version
      const userDocRef = db.doc(`organizations/${organizationId}/users/${userRecord.uid}`);

      try {
        await userDocRef.set(extendedUserData);
        logger.info(`Created Firestore user document: ${userRecord.uid}`);
      } catch (firestoreError) {
        // Rollback: Delete the Firebase Auth user if Firestore fails
        logger.error(`Failed to create Firestore document, rolling back Auth user:`, firestoreError);
        await auth.deleteUser(userRecord.uid);
        throw new HttpsError('internal', 'Failed to create user profile. Auth user rolled back.');
      }

      // Set MINIMAL custom claims in Firebase Auth token (defense against 1000 byte limit)
      // Full permissions are in Firestore - backend MUST validate there
      const customClaims = {
        org: organizationId,        // Shortened key to save bytes
        r: role,                    // Role: 'hr-manager' or 'hod-manager'
        v: initialClaimsVersion     // Version for staleness detection
      };

      try {
        await auth.setCustomUserClaims(userRecord.uid, customClaims);
        logger.info(`✅ Set minimal custom claims for ${userRecord.uid}:`, customClaims);
      } catch (claimsError) {
        // Claims failed - user exists but has no claims
        // Log error but don't rollback (can be fixed with refreshUserClaims)
        logger.error(`⚠️ Failed to set custom claims for ${userRecord.uid}:`, claimsError);
        logger.warn(`User ${userRecord.uid} created but requires manual claims refresh`);
        // Don't throw - user can still login and AuthContext will handle it
      }

      // Handle employee creation/linking
      if (createEmployee) {
        // Create new employee record for new manager
        logger.info(`Creating employee record for new ${role}: ${userRecord.uid}`);

        const employeeData = {
          id: userRecord.uid, // Use same ID as user for easy linking
          profile: {
            firstName,
            lastName,
            email,
            phone: null,
            dateOfBirth: null,
            idNumber: null,
            address: null
          },
          employment: {
            employeeNumber: `EMP-${Date.now()}`, // Generate unique employee number
            department: departmentIds.length > 0 ? departmentIds[0] : null,
            position: roleData.name,
            startDate: new Date().toISOString(),
            endDate: null,
            status: 'active',
            managerId: null, // Managers don't have managers by default
            managerName: null,
            managerRole: null
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: request.auth.uid,
          metadata: {
            source: 'user_creation',
            linkedUserId: userRecord.uid
          }
        };

        const employeeDocRef = db.doc(`organizations/${organizationId}/employees/${userRecord.uid}`);
        await employeeDocRef.set(employeeData);
        logger.info(`Created employee record: ${userRecord.uid}`);

      } else if (employeeId) {
        // Link existing employee to new user account
        logger.info(`Linking existing employee ${employeeId} to user ${userRecord.uid}`);

        const employeeDocRef = db.doc(`organizations/${organizationId}/employees/${employeeId}`);
        const updateData: any = {
          'metadata.linkedUserId': userRecord.uid,
          'employment.position': roleData.name,
          updatedAt: new Date().toISOString()
        };

        // Update employee email if requested
        if (updateEmployeeEmail) {
          updateData['profile.email'] = email;
          logger.info(`Updating employee email to: ${email}`);
        }

        await employeeDocRef.update(updateData);
        logger.info(`Updated employee record: ${employeeId}`);
      }

      // Create UserOrgIndex entry for fast organization lookup
      try {
        const userOrgIndexRef = db.doc(`userOrgIndex/${userRecord.uid}`);
        await userOrgIndexRef.set({
          organizationId,
          role: role,
          email,
          dataStructure: 'sharded',
          createdAt: new Date().toISOString()
        });
        logger.info(`Created UserOrgIndex entry: ${userRecord.uid} → ${organizationId}`);
      } catch (indexError) {
        logger.error('Failed to create UserOrgIndex entry:', indexError);
        // Don't fail the entire operation for index issues
      }

      // Return success response
      return {
        success: true,
        userId: userRecord.uid,
        email: userRecord.email,
        role: role,
        message: `${roleData.name} created successfully`
      };

    } catch (error) {
      logger.error('Error creating organization user:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle specific Firebase Auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'auth/email-already-exists':
            throw new HttpsError('already-exists', 'A user with this email already exists');
          case 'auth/invalid-email':
            throw new HttpsError('invalid-argument', 'Invalid email address');
          case 'auth/weak-password':
            throw new HttpsError('invalid-argument', 'Password is too weak');
          default:
            throw new HttpsError('internal', `Authentication error: ${error.code}`);
        }
      }

      throw new HttpsError('internal', 'Internal server error while creating user');
    }
  }
);