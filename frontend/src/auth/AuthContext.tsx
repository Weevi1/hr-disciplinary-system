import Logger from '../utils/logger';
// frontend/src/auth/AuthContext.tsx - PRODUCTION VERSION (Backwards Compatible Role Handling)
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirebaseService } from '../services/FirebaseService';
import { DatabaseShardingService } from '../services/DatabaseShardingService';
import { UserOrgIndexService } from '../services/UserOrgIndexService';
import { userCreationManager } from '../utils/userCreationContext';
import type { User, Organization } from '../types';

// ✅ FIX: Define collections here since they're not exported from DataService
const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  EMPLOYEES: 'employees',
  WARNINGS: 'warnings',
  WARNING_CATEGORIES: 'warning_categories',
  ESCALATION_RULES: 'escalation_rules',
  AUDIT_LOGS: 'audit_logs'
};

// 🔧 BACKWARDS COMPATIBLE: Helper function to normalize role format
const normalizeUserRole = (rawRole: any) => {
  // If role is already a complex object with id, return as-is
  if (typeof rawRole === 'object' && rawRole?.id) {
    return rawRole;
  }
  
  // If role is a simple string, convert to complex object format
  if (typeof rawRole === 'string') {
    const roleNames = {
      'super-user': 'Super User',
      'business-owner': 'Business Owner', 
      'hr-manager': 'HR Manager',
      'hod-manager': 'Department Manager'
    };
    
    const roleDescriptions = {
      'super-user': 'Global system administrator with full access',
      'business-owner': 'Organization owner with business oversight',
      'hr-manager': 'Human resources manager with employee management access',
      'hod-manager': 'Department head with team management capabilities'
    };
    
    const roleLevels = {
      'super-user': 1,      // Highest access
      'business-owner': 2,  // Organization level
      'hr-manager': 3,      // HR operations
      'hod-manager': 4      // Department level
    };
    
    return {
      id: rawRole,
      name: roleNames[rawRole] || rawRole.charAt(0).toUpperCase() + rawRole.slice(1),
      description: roleDescriptions[rawRole] || `${rawRole} role`,
      level: roleLevels[rawRole] || 5
    };
  }
  
  // Fallback for completely invalid roles
  Logger.warn('⚠️ Invalid role format detected:', rawRole)
  return {
    id: 'unknown',
    name: 'Unknown Role',
    description: 'Role format not recognized',
    level: 99
  };
};

// Context types
interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

// Auth state interface
interface AuthState {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        loading: false,
        error: null // Clear error when user is set successfully
      };
    case 'SET_ORGANIZATION':
      return { ...state, organization: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        loading: false 
      };
    case 'LOGOUT':
      return {
        user: null,
        organization: null,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

// Initial state
const initialState: AuthState = {
  user: null,
  organization: null,
  loading: true,
  error: null
};

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔥 PRODUCTION Provider - Pure Firebase Integration with Backwards Compatibility
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 🔥 Firebase Auth State Listener - Production Ready with Role Normalization
  useEffect(() => {
    Logger.debug('🔐 Initializing Firebase authentication...')
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          Logger.debug('👤 Firebase user authenticated:', firebaseUser.email)

          // 🚀 PRODUCTION OPTIMIZATION: Use O(1) UserOrgIndex lookup instead of O(n) organization search
          // This works for ALL user types: Business Owner, HR Manager, HOD Manager, Super User, Reseller

          // Check if this user is currently being created
          if (userCreationManager.isPendingUser(firebaseUser.uid)) {
            Logger.debug('⏳ User creation in progress, waiting for completion...')
            dispatch({ type: 'SET_LOADING', payload: true });

            // Try again after a short delay to allow creation to complete
            setTimeout(async () => {
              const result = await UserOrgIndexService.getUserWithOrganization(firebaseUser.uid);

              if (result) {
                const normalizedRole = normalizeUserRole(result.user.role);
                dispatch({
                  type: 'SET_USER',
                  payload: { ...result.user, role: normalizedRole } as User
                });

                // Load organization if needed
                if (result.organizationId && result.organizationId !== 'system') {
                  const orgData = await FirebaseService.getDocument<Organization>(
                    COLLECTIONS.ORGANIZATIONS,
                    result.organizationId
                  );
                  if (orgData) {
                    dispatch({ type: 'SET_ORGANIZATION', payload: orgData });
                  }
                }
              } else {
                Logger.error('❌ User creation completed but user not found in index');
                dispatch({ type: 'SET_ERROR', payload: 'User profile not found after creation' });
              }

              dispatch({ type: 'SET_LOADING', payload: false });
            }, 2000);
            return;
          }

          // 🎯 SCALABLE LOOKUP: Single index query instead of searching ALL organizations
          const result = await UserOrgIndexService.getUserWithOrganization(firebaseUser.uid);

          if (result) {
            // ✅ User found via index - instant O(1) lookup regardless of organization count
            const normalizedRole = normalizeUserRole(result.user.role);
            dispatch({
              type: 'SET_USER',
              payload: { ...result.user, role: normalizedRole } as User
            });

            // Load organization if needed (not for system users)
            if (result.organizationId && result.organizationId !== 'system') {
              const orgData = await FirebaseService.getDocument<Organization>(
                COLLECTIONS.ORGANIZATIONS,
                result.organizationId
              );
              if (orgData) {
                dispatch({ type: 'SET_ORGANIZATION', payload: orgData });
              }
            }

            Logger.success(`✅ User authenticated via index: ${result.user.email} → ${result.organizationId}`);
          } else {
            // ❌ User not found in index - fallback to legacy search for backward compatibility
            Logger.debug('👤 User not found in index, trying legacy lookup...')

            // Try flat structure first (super users/resellers)
            let userData = await FirebaseService.getDocument<User>(
              COLLECTIONS.USERS,
              firebaseUser.uid
            );

            if (!userData) {
              Logger.debug('👤 User not found in flat structure, searching sharded organizations...')

              // Get all organizations to search for the user (parallel lookup for better performance)
              const organizations = await FirebaseService.getCollection<Organization>(COLLECTIONS.ORGANIZATIONS);

              // Try to find user in all organizations in parallel instead of sequentially
              const userSearchPromises = organizations.map(async (org) => {
                try {
                  const shardedUser = await DatabaseShardingService.getDocument(org.id, 'users', firebaseUser.uid);
                  return shardedUser ? { user: shardedUser, orgId: org.id } : null;
                } catch (error) {
                  return null;
                }
              });

              // Wait for all searches to complete and take the first successful result
              const searchResults = await Promise.all(userSearchPromises);
              const foundResult = searchResults.find(result => result !== null);

              if (foundResult) {
                userData = foundResult.user as User;
                Logger.success(`✅ Found user in sharded organization: ${foundResult.orgId}`);

                // Create index entry for future O(1) lookups
                try {
                  await UserOrgIndexService.setUserOrganization(
                    firebaseUser.uid,
                    foundResult.orgId,
                    userData.role,
                    userData.email,
                    'sharded'
                  );
                  Logger.success(`✅ Created index entry for user: ${firebaseUser.uid}`);
                } catch (indexError) {
                  Logger.error('❌ Failed to create index entry:', indexError);
                }

                // Load organization
                const orgData = await FirebaseService.getDocument<Organization>(
                  COLLECTIONS.ORGANIZATIONS,
                  foundResult.orgId
                );
                if (orgData) {
                  dispatch({ type: 'SET_ORGANIZATION', payload: orgData });
                }
              }
            } else {
              Logger.success(`✅ Found user in flat structure (super user/reseller)`);

              // Create index entry for flat users too
              try {
                await UserOrgIndexService.setUserOrganization(
                  firebaseUser.uid,
                  userData.organizationId || 'system',
                  userData.role,
                  userData.email,
                  'flat'
                );
                Logger.success(`✅ Created index entry for flat user: ${firebaseUser.uid}`);
              } catch (indexError) {
                Logger.error('❌ Failed to create index entry for flat user:', indexError);
              }
            }

            if (userData) {
              const normalizedRole = normalizeUserRole(userData.role);
              dispatch({
                type: 'SET_USER',
                payload: { ...userData, role: normalizedRole } as User
              });
            } else {
              Logger.error('❌ User not found in any organization');
              dispatch({ type: 'SET_ERROR', payload: 'User profile not found' });
            }
          }
          
        } else {
          // No authenticated user
          Logger.debug('🚪 No authenticated user found')
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        Logger.error('❌ Error in authentication flow:', error)
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Authentication error occurred. Please try again.' 
        });
      } finally {
        // Always stop loading
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return unsubscribe;
  }, []);

  // 🔥 Production Login - Pure Firebase with Enhanced Error Handling
  const login = async (email: string, password: string) => {
    Logger.debug('🚀 Login attempt for:', email)
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Firebase authentication
      Logger.debug('🔐 Authenticating with Firebase...')
      const firebaseUser = await FirebaseService.signIn(email, password);
      
      if (!firebaseUser) {
        throw new Error('Authentication failed');
      }

      Logger.success(8714)
      
      // User data will be loaded automatically by the auth state listener
      // No need to manually load here - let the listener handle it with role normalization
      
    } catch (error: unknown) {
      let message = 'Login failed';
      
      if (error instanceof Error) {
        // Handle specific Firebase error codes
        if (error.message.includes('user-not-found')) {
          message = 'No account found with this email address';
        } else if (error.message.includes('wrong-password')) {
          message = 'Incorrect password';
        } else if (error.message.includes('invalid-email')) {
          message = 'Invalid email address format';
        } else if (error.message.includes('too-many-requests')) {
          message = 'Too many failed attempts. Please try again later';
        } else if (error.message.includes('user-disabled')) {
          message = 'This account has been disabled. Please contact support';
        } else {
          message = error.message;
        }
      }
      
      Logger.error('❌ Login failed:', message)
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    }
    // Note: Don't set loading to false here - let the auth listener handle it
  };

  // 🔥 Production Logout
  const logout = async () => {
    Logger.debug('🚪 Logging out...')
    
    try {
      await FirebaseService.signOut();
      Logger.success(10222)
      // State will be cleared by the auth listener
    } catch (error) {
      Logger.error('⚠️ Logout error:', error)
      // Force clear state even if Firebase logout fails
      dispatch({ type: 'LOGOUT' });
    }
  };

  // 🔥 Organization Switching (for super users) with Role Compatibility
  const switchOrganization = async (orgId: string) => {
    if (!state.user) {
      throw new Error('No authenticated user');
    }

    // 🔧 BACKWARDS COMPATIBLE: Check role using normalized format
    if (state.user.role.id !== 'super-user') {
      throw new Error('Only super users can switch organizations');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (orgId === 'all' || orgId === '') {
        // View all organizations (super user global view)
        Logger.debug('🌐 Switching to global view')
        dispatch({ type: 'SET_ORGANIZATION', payload: null });
      } else {
        // Load specific organization
        Logger.debug('🔄 Switching to organization:', orgId)
        
        const organization = await FirebaseService.getDocument<Organization>(
          COLLECTIONS.ORGANIZATIONS,
          orgId
        );
        
        if (!organization) {
          throw new Error(`Organization '${orgId}' not found`);
        }
        
        Logger.success(11662)
        dispatch({ type: 'SET_ORGANIZATION', payload: organization });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to switch organization';
      Logger.error('❌ Organization switch failed:', message)
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Context value
  const value: AuthContextType = {
    user: state.user,
    organization: state.organization,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    switchOrganization
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook with role format validation
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
