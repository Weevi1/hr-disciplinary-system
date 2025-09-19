// frontend/src/services/UserCreationService.ts
// Service for creating new users without affecting current auth session

import { createUserWithEmailAndPassword, updateProfile, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { DatabaseShardingService } from './DatabaseShardingService';
import { TimeService } from './TimeService';
import Logger from '../utils/logger';

interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  organizationId: string;
  departmentIds?: string[];
  permissions: {
    canManageEmployees: boolean;
    canCreateWarnings: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
  };
}

interface CurrentUser {
  email: string;
  password?: string; // We'll need to handle this differently
}

export class UserCreationService {
  /**
   * Creates a new user without affecting the current authentication session
   */
  static async createUserWithoutSessionSwitch(
    userData: CreateUserData,
    currentUserEmail: string
  ): Promise<string> {
    try {
      Logger.debug(`🔧 Creating user without session switch: ${userData.email}`);
      
      // Step 1: Store current auth state
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No current user session found');
      }
      
      Logger.debug(`💾 Stored current user session: ${currentUserEmail}`);
      
      // Step 2: Create new Firebase Auth user (this will switch sessions)
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const newFirebaseUser = userCredential.user;
      
      Logger.debug(`👤 Created Firebase Auth user: ${newFirebaseUser.uid}`);
      
      // Step 3: Create Firestore document immediately
      const firestoreUserData = {
        id: newFirebaseUser.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        organizationId: userData.organizationId,
        departmentIds: userData.departmentIds || [],
        isActive: true,
        createdAt: TimeService.getServerTimestamp(),
        lastLogin: TimeService.getServerTimestamp(),
        permissions: userData.permissions
      };
      
      await DatabaseShardingService.createDocument(
        userData.organizationId,
        'users',
        firestoreUserData,
        newFirebaseUser.uid
      );
      
      Logger.debug(`📄 Created Firestore document: ${newFirebaseUser.uid}`);
      
      // Step 4: Update Firebase Auth profile
      await updateProfile(newFirebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Step 5: Sign out the newly created user
      await signOut(auth);
      Logger.debug(`🚪 Signed out new user: ${userData.email}`);
      
      // Step 6: Restore original user session
      // Note: We can't automatically sign back in without the password
      // The calling component will need to handle this
      
      Logger.success(`✅ User created successfully: ${newFirebaseUser.uid}`);
      Logger.warn(`⚠️ Original user session lost - user needs to sign in again`);
      
      return newFirebaseUser.uid;
      
    } catch (error) {
      Logger.error('❌ Error in user creation service:', error);
      throw error;
    }
  }
  
  /**
   * Alternative approach: Create user and handle session restoration
   */
  static async createUserWithSessionRestore(
    userData: CreateUserData,
    currentUserCredentials: { email: string; password: string }
  ): Promise<string> {
    try {
      Logger.debug(`🔧 Creating user with session restore: ${userData.email}`);
      
      // Step 1: Create new user (will switch sessions)
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const newFirebaseUser = userCredential.user;
      
      Logger.debug(`👤 Created Firebase Auth user: ${newFirebaseUser.uid}`);
      
      // Step 2: Create Firestore document
      const firestoreUserData = {
        id: newFirebaseUser.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        organizationId: userData.organizationId,
        departmentIds: userData.departmentIds || [],
        isActive: true,
        createdAt: TimeService.getServerTimestamp(),
        lastLogin: TimeService.getServerTimestamp(),
        permissions: userData.permissions
      };
      
      await DatabaseShardingService.createDocument(
        userData.organizationId,
        'users',
        firestoreUserData,
        newFirebaseUser.uid
      );
      
      // Step 3: Update profile
      await updateProfile(newFirebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Step 4: Sign out new user and restore original session
      await signOut(auth);
      await signInWithEmailAndPassword(
        auth, 
        currentUserCredentials.email, 
        currentUserCredentials.password
      );
      
      Logger.success(`✅ User created and original session restored: ${newFirebaseUser.uid}`);
      
      return newFirebaseUser.uid;
      
    } catch (error) {
      Logger.error('❌ Error in user creation with session restore:', error);
      throw error;
    }
  }
}