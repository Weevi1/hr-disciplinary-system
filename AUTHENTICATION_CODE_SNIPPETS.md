# Authentication Flow - Code Snippets

Copy-paste ready code for understanding each phase of authentication.

---

## 1. LOGIN FORM SUBMISSION

**File**: `frontend/src/auth/LoginForm.tsx` (lines 68-85)

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoggingIn(true);

  try {
    // Call AuthContext login function
    await login(email, password);
    onSuccess?.();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
    setIsLoggingIn(false);
  }
};
```

**Flow**:
1. User submits email/password
2. `setIsLoggingIn(true)` triggers LoadingScreen
3. Calls `login()` from AuthContext
4. Success → onSuccess callback
5. Error → display error message

---

## 2. FIREBASE AUTHENTICATION

**File**: `frontend/src/services/FirebaseService.ts` (lines 80-89)

```typescript
static async signIn(email: string, password: string): Promise<FirebaseUser> {
  try {
    Logger.debug('Attempting sign in', { email });
    const credential = await signInWithEmailAndPassword(auth, email, password);
    Logger.debug('Sign in successful', { uid: credential.user.uid });
    return credential.user;
  } catch (error) {
    ErrorHandler.handle(error, 'signIn');
  }
}
```

**What happens**:
1. Firebase validates email/password
2. Returns Firebase User object (UID only, no role)
3. `onAuthStateChanged` listener auto-triggers

---

## 3. AUTH STATE LISTENER - ENTRY POINT

**File**: `frontend/src/auth/AuthContext.tsx` (lines 164-390)

```typescript
const unsubscribe = onAuthStateChanged(
  auth, 
  async (firebaseUser: FirebaseUser | null) => {
    try {
      if (firebaseUser) {
        // Stage 0: Initial connection
        dispatch({
          type: 'SET_LOADING_PROGRESS',
          payload: { stage: 0, message: 'Connecting to server...', progress: 10 }
        });

        // Check if currently being created
        if (userCreationManager.isPendingUser(firebaseUser.uid)) {
          // Wait for creation to complete
          dispatch({ type: 'SET_LOADING', payload: true });
          setTimeout(async () => {
            // Retry after delay
          }, 2000);
          return;
        }

        // Proceed to data loading...
      } else {
        // No authenticated user
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      Logger.error('Error in authentication flow:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Authentication error occurred. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }
);
```

---

## 4. CUSTOM CLAIMS VALIDATION (CRITICAL)

**File**: `frontend/src/auth/AuthContext.tsx` (lines 233-252)

```typescript
// Check if custom claims need to be refreshed
const idTokenResult = await firebaseUser.getIdTokenResult();
const roleIsInvalid = !idTokenResult.claims.role || 
                      typeof idTokenResult.claims.role === 'object';

if (roleIsInvalid) {
  Logger.warn('⚠️ [AUTH] Role missing or incorrectly formatted! Calling refreshUserClaims...');
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions(undefined, 'us-central1');
    const refreshClaims = httpsCallable(functions, 'refreshUserClaims');
    await refreshClaims({});
    Logger.debug('✅ [AUTH] Claims refreshed! Signing out...');
    
    // Sign out to force token refresh on next login
    await auth.signOut();
    alert('Your user role has been refreshed! Please SIGN IN AGAIN.');
    return;
  } catch (err) {
    Logger.error('❌ [AUTH] Failed to refresh claims:', err);
  }
}
```

**Why this matters**:
- Detects if Firebase token has valid role string
- If missing or object format → calls backend function
- Forces sign out to refresh token on next login

---

## 5. USER ORGANIZATION INDEX LOOKUP

**File**: `frontend/src/auth/AuthContext.tsx` (lines 224-230)

```typescript
// O(1) SCALABLE LOOKUP: Single index query instead of searching ALL organizations
const result = await UserOrgIndexService.getUserWithOrganization(firebaseUser.uid);

// Stage 2: User profile loaded (60% progress)
dispatch({
  type: 'SET_LOADING_PROGRESS',
  payload: { stage: 2, message: 'Loading user profile...', progress: 60 }
});
```

**Index Service Implementation**: `frontend/src/services/UserOrgIndexService.ts` (lines 174-211)

```typescript
static async getUserWithOrganization(
  userId: string
): Promise<{ user: User; organizationId: string } | null> {
  try {
    // Step 1: Get index entry (O(1))
    const indexEntry = await this.getUserOrganization(userId);
    if (!indexEntry) {
      return null;
    }

    let userData: User | null = null;

    // Step 2: Fetch user from correct location
    if (indexEntry.userType === 'flat') {
      // Super-user or reseller - flat structure
      userData = await FirebaseService.getDocument<User>('users', userId);
    } else {
      // Organization user - sharded structure
      userData = await DatabaseShardingService.getDocument<User>(
        indexEntry.organizationId,
        'users',
        userId
      );
    }

    if (userData) {
      return {
        user: userData,
        organizationId: indexEntry.organizationId
      };
    }

    // Index exists but user data is missing - cleanup needed
    Logger.warn(`⚠️ Index exists but user data missing for ${userId}, cleaning up index...`);
    await this.removeUserOrganization(userId);
    return null;

  } catch (error) {
    Logger.error('Error getting user with organization:', error);
    return null;
  }
}
```

---

## 6. ROLE NORMALIZATION

**File**: `frontend/src/auth/AuthContext.tsx` (lines 25-70)

```typescript
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
```

**Usage**:
```typescript
const normalizedRole = normalizeUserRole(result.user.role);
dispatch({
  type: 'SET_USER',
  payload: { ...result.user, role: normalizedRole } as User
});
```

---

## 7. ORGANIZATION LOADING

**File**: `frontend/src/auth/AuthContext.tsx` (lines 262-276)

```typescript
// Load organization if needed (not for system users)
if (result.organizationId && result.organizationId !== 'system') {
  // Stage 3: Loading organization data (80% progress)
  dispatch({
    type: 'SET_LOADING_PROGRESS',
    payload: { stage: 3, message: 'Loading organization data...', progress: 80 }
  });

  const orgData = await FirebaseService.getDocument<Organization>(
    COLLECTIONS.ORGANIZATIONS,
    result.organizationId
  );
  
  if (orgData) {
    dispatch({ type: 'SET_ORGANIZATION', payload: orgData });
  }
}
```

---

## 8. CUSTOM CLAIMS REFRESH (BACKEND)

**File**: `functions/src/customClaims.ts` (lines 33-103)

```typescript
export const refreshUserClaims = onCall(async (request) => {
  const { uid } = request.auth || {};
  const { targetUserId } = request.data || {};
  
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // If no target user specified, refresh current user
  const userIdToRefresh = targetUserId || uid;

  try {
    logger.info(`Refreshing claims for user: ${userIdToRefresh}`);

    // Check if requesting user has permission
    const requestingUserClaims = await auth.getUser(uid).then(user => user.customClaims);
    const isSuperUser = requestingUserClaims?.role === 'super-user';
    const isSameUser = uid === userIdToRefresh;
    
    if (!isSuperUser && !isSameUser) {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }

    // Find user in root or sharded collections
    const rootUserDoc = await db.collection('users').doc(userIdToRefresh).get();

    let userData: any;
    let organizationId: string;

    if (rootUserDoc.exists) {
      // User found in root collection
      userData = rootUserDoc.data();
      organizationId = userData.organizationId || 'system';
    } else {
      // Find user in sharded collections
      const userDoc = await findUserInShardedCollections(userIdToRefresh);
      if (!userDoc) {
        throw new HttpsError('not-found', 'User not found');
      }
      userData = userDoc.userData;
      organizationId = userDoc.organizationId;
    }

    // Prepare custom claims
    const customClaims: UserClaims = {
      role: userData.role?.id || userData.role, // Extract ID if role is object
      organizationId: organizationId,
      permissions: userData.permissions ? Object.keys(userData.permissions) : [],
      lastUpdated: Date.now()
    };

    // Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(userIdToRefresh, customClaims);
    
    logger.info(`Claims refreshed for ${userIdToRefresh}`);

    return {
      success: true,
      claims: customClaims,
      message: 'Custom claims refreshed successfully'
    };

  } catch (error) {
    logger.error(`Failed to refresh claims for ${userIdToRefresh}:`, error);
    throw error;
  }
});
```

---

## 9. PERMISSION CHECKING

**File**: `frontend/src/hooks/useMultiRolePermissions.ts` (lines 39-80)

```typescript
export const useMultiRolePermissions = (): MultiRolePermissions => {
  const { user } = useAuth();

  // Extract roles from user
  const getUserRoles = (): string[] => {
    if (!user) return [];
    
    // Handle current single-role system
    const primaryRole = user.role?.id || user.role;
    if (!primaryRole) return [];
    
    // For now, return single role as array
    // Future: Support multi-role system
    return [primaryRole];
  };

  const userRoles = getUserRoles();

  // Core role checking functions
  const hasRole = (role: string): boolean => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => userRoles.includes(role));
  };

  const getPrimaryRole = (): string => {
    return userRoles[0] || 'unknown';
  };

  const getAllRoles = (): string[] => {
    return [...userRoles];
  };

  // Permission functions (examples)
  const canCreateWarnings = (): boolean => {
    return hasAnyRole(['hod-manager', 'hr-manager', 'business-owner', 'super-user']);
  };

  const canManageEmployees = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getPrimaryRole,
    getAllRoles,
    canCreateWarnings,
    canManageEmployees,
    // ... more functions
  };
};
```

**Usage in Component**:
```typescript
const { canCreateWarnings, hasRole } = useMultiRolePermissions();

if (canCreateWarnings()) {
  // Show warning creation button
}

if (hasRole('super-user')) {
  // Show admin panel
}
```

---

## 10. ROUTE PROTECTION

**File**: `frontend/src/App.tsx` (lines 291-305)

```typescript
const ProtectedLayout = () => {
  const { user, loading, error } = useAuth();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!user) return <Navigate to="/login" replace />;

  // MainLayout includes OrganizationProvider
  // so all child routes have access to useOrganization()
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
```

**Route Configuration** (lines 315-434):
```typescript
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={
        loading ? <LoadingScreen /> :
        user ? <Navigate to="/dashboard" replace /> :
        <LoginForm />
      } />
      
      {/* Protected routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/warnings/create" element={<EnhancedWarningWizardWrapper />} />
        {/* ... more routes */}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
```

---

## 11. LOADING PROGRESS UI

**File**: `frontend/src/auth/LoginForm.tsx` (lines 14-57)

```typescript
const LoadingScreen = () => {
  const { loadingProgress } = useAuth();

  // Default values if no progress data yet
  const statusMessage = loadingProgress?.message || 'Connecting to server...';
  const progress = loadingProgress?.progress || 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <Logo size="xlarge" showText={true} />
        </div>

        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>

        {/* Status Message */}
        <p className="text-base font-medium text-gray-800 mb-4 transition-all duration-300">
          {statusMessage}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Percentage */}
        <p className="text-xs text-gray-500">
          {Math.round(progress)}% complete
        </p>
      </div>
    </div>
  );
};
```

---

## 12. FALLBACK USER LOOKUP (Legacy Users)

**File**: `frontend/src/auth/AuthContext.tsx` (lines 286-341)

```typescript
// User not found in index - fallback to legacy search
Logger.debug('User not found in index, trying legacy lookup...')

// Try flat structure first (super users/resellers)
let userData = await FirebaseService.getDocument<User>(
  COLLECTIONS.USERS,
  firebaseUser.uid
);

if (!userData) {
  Logger.debug('User not found in flat structure, searching sharded organizations...')

  // Get all organizations to search for the user (parallel lookup)
  const organizations = await FirebaseService.getCollection<Organization>(
    COLLECTIONS.ORGANIZATIONS
  );

  // Try to find user in all organizations in parallel
  const userSearchPromises = organizations.map(async (org) => {
    try {
      const shardedUser = await DatabaseShardingService.getDocument(
        org.id, 'users', firebaseUser.uid
      );
      return shardedUser ? { user: shardedUser, orgId: org.id } : null;
    } catch (error) {
      return null;
    }
  });

  // Wait for all searches and take first successful result
  const searchResults = await Promise.all(userSearchPromises);
  const foundResult = searchResults.find(result => result !== null);

  if (foundResult) {
    userData = foundResult.user as User;
    Logger.success(`Found user in sharded organization: ${foundResult.orgId}`);

    // Create index entry for future O(1) lookups
    try {
      await UserOrgIndexService.setUserOrganization(
        firebaseUser.uid,
        foundResult.orgId,
        userData.role,
        userData.email,
        'sharded'
      );
      Logger.success(`Created index entry for user: ${firebaseUser.uid}`);
    } catch (indexError) {
      Logger.error('Failed to create index entry:', indexError);
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
}
```

---

## Summary Table

| Step | File | Purpose |
|------|------|---------|
| 1 | LoginForm.tsx | Capture credentials |
| 2 | FirebaseService.ts | Authenticate with Firebase |
| 3 | AuthContext.tsx | Listen for auth changes |
| 4 | AuthContext.tsx | Validate custom claims |
| 5 | UserOrgIndexService.ts | Fast user lookup |
| 6 | AuthContext.tsx | Normalize role format |
| 7 | AuthContext.tsx | Load organization data |
| 8 | customClaims.ts | Backend refresh if needed |
| 9 | useMultiRolePermissions.ts | Check permissions |
| 10 | App.tsx | Protect routes |

