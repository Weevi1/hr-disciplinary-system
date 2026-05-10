import Logger from '../utils/logger';
// frontend/src/auth/AuthContext.tsx - PRODUCTION VERSION (Backwards Compatible Role Handling)
// 🚀 OPTIMIZED: Parallel loading, non-blocking claims validation
// 🚀 WEEK 4 OPTIMIZATION: Added categories prefetch to eliminate duplicate fetch
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirebaseService } from '../services/FirebaseService';
import { DatabaseShardingService } from '../services/DatabaseShardingService';
import { ShardedDataService } from '../services/ShardedDataService';  // 🚀 WEEK 4: For categories fetch
import { UserOrgIndexService } from '../services/UserOrgIndexService';
import { userCreationManager } from '../utils/userCreationContext';
import { ClaimsValidationService } from '../services/ClaimsValidationService';
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
    const roleNames: Record<string, string> = {
      'super-user': 'Super User',
      'reseller': 'Reseller',
      'executive-management': 'Executive Management',
      'hr-manager': 'HR Manager',
      'hod-manager': 'Department Manager',
      'department-manager': 'Department Manager'
    };

    const roleDescriptions: Record<string, string> = {
      'super-user': 'Global system administrator with full access',
      'reseller': 'Partner with client organization management access',
      'executive-management': 'Organization owner with business oversight',
      'hr-manager': 'Human resources manager with employee management access',
      'hod-manager': 'Department head with team management capabilities',
      'department-manager': 'Department manager with team management capabilities'
    };

    const roleLevels: Record<string, number> = {
      'super-user': 1,      // Highest access
      'reseller': 2,        // Partner level
      'executive-management': 3,  // Organization level
      'hr-manager': 4,      // HR operations
      'hod-manager': 5,     // Department level
      'department-manager': 5  // Department level (same as hod)
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

// 🚀 OPTIMIZED: Removed LoadingProgress - no longer using staged progress tracking

// Context types
interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  categories: any[] | null;  // 🚀 WEEK 4 OPTIMIZATION: Prefetch categories to eliminate duplicate fetch
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Auth state interface
interface AuthState {
  user: User | null;
  organization: Organization | null;
  categories: any[] | null;  // 🚀 WEEK 4 OPTIMIZATION: Prefetch categories
  loading: boolean;
  error: string | null;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_CATEGORIES'; payload: any[] | null }  // 🚀 WEEK 4 OPTIMIZATION
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
    case 'SET_CATEGORIES':  // 🚀 WEEK 4 OPTIMIZATION
      return { ...state, categories: action.payload };
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
        categories: null,  // 🚀 WEEK 4 OPTIMIZATION: Clear categories on logout
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
  categories: null,  // 🚀 WEEK 4 OPTIMIZATION
  loading: true,
  error: null
};

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔥 PRODUCTION Provider - Pure Firebase Integration with Backwards Compatibility
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 🔥 Firebase Auth State Listener - OPTIMIZED with Parallel Loading
  useEffect(() => {
    Logger.debug('🔐 Initializing Firebase authentication...')

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          Logger.debug('👤 Firebase user authenticated:', firebaseUser.email)

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

          // 🚀 PARALLEL EXECUTION - All requests start simultaneously
          const [userResult, orgPreviewResult] = await Promise.allSettled([
            // 1. User lookup (O(1) index) - PRIMARY DATA
            UserOrgIndexService.getUserWithOrganization(firebaseUser.uid),

            // 2. Optimistic org fetch (try to get from token claims)
            (async () => {
              try {
                const idTokenResult = await firebaseUser.getIdTokenResult();
                const claims = idTokenResult.claims as any;
                if (claims.org) {
                  const orgId = claims.org;
                  return await FirebaseService.getDocument<Organization>(
                    COLLECTIONS.ORGANIZATIONS,
                    orgId
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()
          ]);

          // 3. Start background claims validation (non-blocking, fire-and-forget)
          ClaimsValidationService.validateInBackground(firebaseUser).catch(err => {
            Logger.warn('⚠️ [AUTH] Background claims validation encountered an error (non-blocking):', err);
          });

          // Handle user result
          if (userResult.status === 'fulfilled' && userResult.value) {
            const result = userResult.value;

            // Check if user is active (critical security check)
            if (result.user.isActive === false) {
              Logger.warn('⚠️ [AUTH] User account is inactive');
              await auth.signOut();
              dispatch({ type: 'SET_ERROR', payload: 'Your account has been deactivated. Please contact support.' });
              return;
            }

            // ✅ User found via index - instant O(1) lookup
            const normalizedRole = normalizeUserRole(result.user.role);
            dispatch({
              type: 'SET_USER',
              payload: { ...result.user, role: normalizedRole } as User
            });

            // 🚀 WEEK 4 OPTIMIZATION: Fetch organization AND categories in parallel
            if (result.organizationId && result.organizationId !== 'system') {
              let orgData: Organization | null = null;
              let categoriesData: any[] | null = null;

              // Try to use prefetched org data
              if (orgPreviewResult.status === 'fulfilled' && orgPreviewResult.value) {
                orgData = orgPreviewResult.value;
                Logger.debug('✅ Using prefetched organization data');

                // Fetch categories in parallel since org is already available
                try {
                  categoriesData = await ShardedDataService.getWarningCategories(result.organizationId);
                  Logger.debug(`✅ Fetched ${categoriesData?.length || 0} categories during auth`);
                } catch (error) {
                  Logger.warn('⚠️ Failed to fetch categories during auth (non-critical):', error);
                  categoriesData = [];
                }
              } else {
                // 🚀 PARALLEL FETCH: Get both org and categories simultaneously
                const [fetchedOrg, fetchedCategories] = await Promise.allSettled([
                  FirebaseService.getDocument<Organization>(
                    COLLECTIONS.ORGANIZATIONS,
                    result.organizationId
                  ),
                  ShardedDataService.getWarningCategories(result.organizationId)
                ]);

                orgData = fetchedOrg.status === 'fulfilled' ? fetchedOrg.value : null;
                categoriesData = fetchedCategories.status === 'fulfilled' ? fetchedCategories.value : [];

                Logger.debug(`✅ Fetched org and ${categoriesData?.length || 0} categories in parallel`);
              }

              // Dispatch both organization and categories
              if (orgData) {
                dispatch({ type: 'SET_ORGANIZATION', payload: orgData });
              }
              if (categoriesData !== null) {
                dispatch({ type: 'SET_CATEGORIES', payload: categoriesData });
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

                // 🚀 WEEK 4 OPTIMIZATION: Load organization AND categories in parallel
                const [orgData, categoriesData] = await Promise.allSettled([
                  FirebaseService.getDocument<Organization>(
                    COLLECTIONS.ORGANIZATIONS,
                    foundResult.orgId
                  ),
                  ShardedDataService.getWarningCategories(foundResult.orgId)
                ]);

                if (orgData.status === 'fulfilled' && orgData.value) {
                  dispatch({ type: 'SET_ORGANIZATION', payload: orgData.value });
                }
                if (categoriesData.status === 'fulfilled' && categoriesData.value) {
                  dispatch({ type: 'SET_CATEGORIES', payload: categoriesData.value });
                  Logger.debug(`✅ Fetched ${categoriesData.value.length} categories (legacy path)`);
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

      Logger.success('✅ Firebase authentication successful')
      
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

  // 🔥 Password Reset - Send reset email via Firebase
  const resetPassword = async (email: string) => {
    Logger.debug('🔑 Password reset requested for:', email)

    try {
      // Validate input
      if (!email || !email.trim()) {
        throw new Error('Email address is required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      dispatch({ type: 'SET_ERROR', payload: null });

      // Send password reset email via Firebase
      Logger.debug('📧 Sending password reset email...')
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email.trim());

      Logger.success('✅ Password reset email sent successfully')

    } catch (error: unknown) {
      let message = 'Failed to send password reset email';

      if (error instanceof Error) {
        // Handle specific Firebase error codes
        if (error.message.includes('user-not-found')) {
          // For security, don't reveal if email exists or not
          // Just say the email was sent (even if it wasn't)
          Logger.debug('⚠️ User not found, but not revealing this to user')
        } else if (error.message.includes('invalid-email')) {
          message = 'Invalid email address format';
        } else if (error.message.includes('too-many-requests')) {
          message = 'Too many reset attempts. Please try again later';
        } else {
          message = error.message;
        }
      }

      // For security: If user not found, we still show success message
      // This prevents email enumeration attacks
      if (error instanceof Error && error.message.includes('user-not-found')) {
        Logger.debug('⚠️ Showing success message even though user not found (security)')
        return; // Don't throw error, pretend it worked
      }

      Logger.error('❌ Password reset failed:', message)
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    }
  };

  // Context value
  const value: AuthContextType = {
    user: state.user,
    organization: state.organization,
    categories: state.categories,  // 🚀 WEEK 4 OPTIMIZATION: Expose categories
    loading: state.loading,
    error: state.error,
    login,
    logout,
    switchOrganization,
    resetPassword
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
