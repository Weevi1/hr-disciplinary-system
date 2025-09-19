import Logger from '../utils/logger';
// frontend/src/hooks/useUserManagement.ts
// 🎯 Enhanced Custom hook for User Management operations
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FirebaseService, COLLECTIONS } from '../services/FirebaseService';
import { USER_ROLES, USER_MANAGEMENT_RULES, getCreatableRoles, canManageUser } from '../permissions/roleDefinitions';
import type { User } from '../types';

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  departmentIds: string[];
  password: string;
}

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  creatableRoles: typeof USER_ROLES[keyof typeof USER_ROLES][];
  userManagementRules: typeof USER_MANAGEMENT_RULES[keyof typeof USER_MANAGEMENT_RULES];
}

// Enhanced department list matching your original component
export const DEPARTMENTS = [
  { id: 'executive', name: 'Executive' },
  { id: 'human-resources', name: 'Human Resources' },
  { id: 'operations', name: 'Operations' },
  { id: 'production', name: 'Production' },
  { id: 'quality-control', name: 'Quality Control' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'logistics', name: 'Logistics' },
  { id: 'finance', name: 'Finance' }
];

export const useUserManagement = () => {
  const { user: currentUser } = useAuth();
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
    creatableRoles: [],
    userManagementRules: USER_MANAGEMENT_RULES['business-owner'] // default
  });

  // Get user's permissions and rules
  useEffect(() => {
    if (currentUser?.role?.id) {
      const rules = USER_MANAGEMENT_RULES[currentUser.role.id as keyof typeof USER_MANAGEMENT_RULES];
      const creatableRoles = getCreatableRoles(currentUser.role.id);
      
      setState(prev => ({
        ...prev,
        userManagementRules: rules || USER_MANAGEMENT_RULES['business-owner'],
        creatableRoles
      }));
    }
  }, [currentUser]);

  // Enhanced role color function matching your original
  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'business-owner': return '#dc2626';
      case 'hr-manager': return '#059669';
      case 'hod-manager': return '#7c3aed';
      default: return '#64748b';
    }
  };

  // Enhanced date formatting matching your original
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if current user can perform action on target user
  const canManageUserAction = (targetUser: User, action: 'create' | 'read' | 'update' | 'deactivate'): boolean => {
    if (!currentUser || !state.userManagementRules) return false;

    return canManageUser(
      currentUser.role.id,
      currentUser.organizationId,
      targetUser.role.id,
      targetUser.organizationId,
      action
    );
  };

  // Enhanced load users matching your original approach but optimized
  const loadUsers = async (): Promise<void> => {
    if (!currentUser?.organizationId) {
      setState(prev => ({ ...prev, loading: false, error: 'No organization found' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      Logger.debug('🔍 Loading users for organization:', currentUser.organizationId)

      // Get all users from the organization (matching your original approach)
      const allUsers = await FirebaseService.getCollection<any>(COLLECTIONS.USERS);

      // Filter users that current user can manage
      const manageableUsers = allUsers
        .filter((user: any) => 
          canManageUser(
            currentUser.role.id,
            currentUser.organizationId,
            user.role?.id || user.role,
            user.organizationId,
            'read'
          )
        )
        .map((user: any) => ({
          ...user,
          role: typeof user.role === 'string' ? USER_ROLES[user.role] : user.role
        }));

      Logger.success(4262)

      setState(prev => ({ 
        ...prev, 
        users: manageableUsers, 
        loading: false 
      }));

    } catch (error) {
      Logger.error('❌ Error loading users:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load users' 
      }));
    }
  };

  // Enhanced create user with better error handling
  const createUser = async (userData: CreateUserData): Promise<void> => {
    if (!currentUser?.organizationId) {
      throw new Error('No organization found');
    }

    // Permission check
    const canCreate = state.userManagementRules.canCreate?.includes(userData.roleId) || false;
    if (!canCreate) {
      throw new Error(`You don't have permission to create ${userData.roleId} accounts`);
    }

    try {
      Logger.debug('🚀 Creating new user:', userData.email)

      // Step 1: Create Firebase Auth user
      const authUser = await FirebaseService.signUp(userData.email, userData.password);
      Logger.success(5389)

      // Step 2: Create Firestore user document with enhanced data structure
      const userDocument: Omit<User, 'permissions'> = {
        id: authUser.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: USER_ROLES[userData.roleId],
        organizationId: currentUser.organizationId,
        departmentIds: userData.roleId === 'hod-manager' ? userData.departmentIds : [],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: undefined
      };

      await FirebaseService.createDocument(
        COLLECTIONS.USERS,
        userDocument,
        authUser.uid
      );

      Logger.success(6159)

      // Update local state
      setState(prev => ({
        ...prev,
        users: [...prev.users, userDocument as User]
      }));

    } catch (error) {
      Logger.error('❌ Error creating user:', error)
      
      // Enhanced error handling matching your original
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          throw new Error('This email address is already registered');
        } else if (error.message.includes('weak-password')) {
          throw new Error('Password is too weak. Please choose a stronger password');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Please enter a valid email address');
        }
      }
      
      throw error;
    }
  };

  // Enhanced update user
  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      Logger.debug('📝 Updating user:', userId)

      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.id
      });

      // Update local state
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        )
      }));

      Logger.success(7586)

    } catch (error) {
      Logger.error('❌ Error updating user:', error)
      throw error;
    }
  };

  // Enhanced deactivate user
  const deactivateUser = async (userId: string): Promise<void> => {
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    if (!canManageUserAction(targetUser, 'deactivate')) {
      throw new Error('You don\'t have permission to deactivate this user');
    }

    try {
      Logger.debug('🚫 Deactivating user:', userId)

      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: currentUser?.id
      });

      // Update local state
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, isActive: false } : user
        )
      }));

      Logger.success(8612)

    } catch (error) {
      Logger.error('❌ Error deactivating user:', error)
      throw error;
    }
  };

  // Enhanced reactivate user
  const reactivateUser = async (userId: string): Promise<void> => {
    try {
      Logger.success(8897)

      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        isActive: true,
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: currentUser?.id
      });

      // Update local state
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, isActive: true } : user
        )
      }));

      Logger.success(9358)

    } catch (error) {
      Logger.error('❌ Error reactivating user:', error)
      throw error;
    }
  };

  // Load users on mount
  useEffect(() => {
    if (currentUser?.organizationId && state.userManagementRules) {
      loadUsers();
    }
  }, [currentUser?.organizationId, state.userManagementRules]);

  return {
    // State
    users: state.users,
    loading: state.loading,
    error: state.error,
    creatableRoles: state.creatableRoles,
    userManagementRules: state.userManagementRules,
    
    // Actions
    loadUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    canManageUser: canManageUserAction,
    
    // Utilities
    getRoleColor,
    formatLastLogin,
    departments: DEPARTMENTS
  };
};
