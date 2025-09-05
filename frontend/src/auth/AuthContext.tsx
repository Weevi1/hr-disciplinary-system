// frontend/src/auth/AuthContext.tsx - PRODUCTION VERSION (Backwards Compatible Role Handling)
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirebaseService } from '../services/FirebaseService';
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
  console.warn('⚠️ Invalid role format detected:', rawRole);
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
    console.log('🔐 Initializing Firebase authentication...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          console.log('👤 Firebase user authenticated:', firebaseUser.email);
          
          // Load user profile from Firestore
          const userData = await FirebaseService.getDocument<User>(
            COLLECTIONS.USERS,
            firebaseUser.uid
          );
          
          if (!userData) {
            // User exists in Firebase Auth but not in Firestore
            console.error('❌ User profile not found in Firestore for:', firebaseUser.email);
            dispatch({ 
              type: 'SET_ERROR', 
              payload: 'User profile not found. Please contact administrator.' 
            });
            return;
          }

          // 🔧 BACKWARDS COMPATIBLE: Normalize role format
          const normalizedRole = normalizeUserRole(userData.role);
          console.log('✅ User profile loaded:', userData.email, 'Role:', normalizedRole.id);
          
          // Create user object with normalized role
          const userWithNormalizedRole = {
            ...userData,
            role: normalizedRole
          };
          
          dispatch({ type: 'SET_USER', payload: userWithNormalizedRole });
          
          // Load organization if user belongs to one
          if (userData.organizationId) {
            console.log('🏢 Loading organization:', userData.organizationId);
            
            try {
              const organization = await FirebaseService.getDocument<Organization>(
                COLLECTIONS.ORGANIZATIONS,
                userData.organizationId
              );
              
              if (organization) {
                console.log('✅ Organization loaded:', organization.name);
                dispatch({ type: 'SET_ORGANIZATION', payload: organization });
              } else {
                console.warn('⚠️ Organization not found:', userData.organizationId);
                dispatch({ 
                  type: 'SET_ERROR', 
                  payload: 'Organization not found. Please contact administrator.' 
                });
              }
            } catch (orgError) {
              console.error('❌ Failed to load organization:', orgError);
              dispatch({ 
                type: 'SET_ERROR', 
                payload: 'Failed to load organization data.' 
              });
            }
          } else {
            // Super user or user without organization
            console.log('ℹ️ User has no organization (likely super-user)');
            dispatch({ type: 'SET_ORGANIZATION', payload: null });
          }
          
        } else {
          // No authenticated user
          console.log('🚪 No authenticated user found');
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('❌ Error in authentication flow:', error);
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
    console.log('🚀 Login attempt for:', email);
    
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
      console.log('🔐 Authenticating with Firebase...');
      const firebaseUser = await FirebaseService.signIn(email, password);
      
      if (!firebaseUser) {
        throw new Error('Authentication failed');
      }

      console.log('✅ Firebase authentication successful');
      
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
      
      console.error('❌ Login failed:', message);
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    }
    // Note: Don't set loading to false here - let the auth listener handle it
  };

  // 🔥 Production Logout
  const logout = async () => {
    console.log('🚪 Logging out...');
    
    try {
      await FirebaseService.signOut();
      console.log('✅ Logout successful');
      // State will be cleared by the auth listener
    } catch (error) {
      console.error('⚠️ Logout error:', error);
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
        console.log('🌐 Switching to global view');
        dispatch({ type: 'SET_ORGANIZATION', payload: null });
      } else {
        // Load specific organization
        console.log('🔄 Switching to organization:', orgId);
        
        const organization = await FirebaseService.getDocument<Organization>(
          COLLECTIONS.ORGANIZATIONS,
          orgId
        );
        
        if (!organization) {
          throw new Error(`Organization '${orgId}' not found`);
        }
        
        console.log('✅ Switched to organization:', organization.name);
        dispatch({ type: 'SET_ORGANIZATION', payload: organization });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to switch organization';
      console.error('❌ Organization switch failed:', message);
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
