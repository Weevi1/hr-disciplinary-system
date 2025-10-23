# HR Disciplinary System - Complete Authentication & Authorization Flow

## System Overview

This is a comprehensive breakdown of ALL authentication flows, login patterns, and role/claims loading mechanisms in the HR Disciplinary System.

---

## 1. LOGIN FLOW (Step-by-Step)

### 1.1 User Initiates Login
**File**: `frontend/src/auth/LoginForm.tsx` (lines 59-202)

1. User enters email and password
2. Form validates inputs (required, email format)
3. User clicks "Sign In" button
4. `isLoggingIn` state set to true → displays `LoadingScreen` component
5. Calls `login(email, password)` from AuthContext

### 1.2 Firebase Authentication
**File**: `frontend/src/services/FirebaseService.ts` (lines 80-89)

```typescript
static async signIn(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}
```

- Uses Firebase's `signInWithEmailAndPassword()` directly
- Returns Firebase User object (minimal data)
- **No role/claims loaded at this stage**

### 1.3 Auth State Listener Triggered
**File**: `frontend/src/auth/AuthContext.tsx` (lines 164-390)

The `onAuthStateChanged()` listener in useEffect fires automatically when user logs in:

```typescript
const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
  if (firebaseUser) {
    // Stage 0: Initial connection (10%)
    // Stage 1: User authenticated (30%)
    // ... loading stages ...
  }
});
```

**This is where ALL post-login data loading happens.**

---

## 2. POST-LOGIN DATA LOADING (The Critical Flow)

### 2.1 Quick Custom Claims Check (Lines 233-252)

```typescript
const idTokenResult = await firebaseUser.getIdTokenResult();
const roleIsInvalid = !idTokenResult.claims.role || 
                      typeof idTokenResult.claims.role === 'object';

if (roleIsInvalid) {
  Logger.warn('⚠️ [AUTH] Role missing or incorrectly formatted!');
  const refreshClaims = httpsCallable(functions, 'refreshUserClaims');
  await refreshClaims({});
  // Sign out to force token refresh
  await auth.signOut();
  alert('Your user role has been refreshed! Please SIGN IN AGAIN.');
  return;
}
```

**Purpose**: Validates that Firebase custom claims have a VALID role string.
**Issue Detection**: If role is object or missing, triggers `refreshUserClaims` cloud function.

### 2.2 User Organization Index Lookup (Lines 224, 194)

**O(1) Scalable Lookup** - Instead of searching all organizations:

```typescript
const result = await UserOrgIndexService.getUserWithOrganization(firebaseUser.uid);
```

This performs:

**File**: `frontend/src/services/UserOrgIndexService.ts` (lines 174-211)

```typescript
static async getUserWithOrganization(userId: string) {
  const indexEntry = await this.getUserOrganization(userId);
  
  if (indexEntry.userType === 'flat') {
    // Super-user/reseller lookup
    userData = await FirebaseService.getDocument<User>('users', userId);
  } else {
    // Organization user - sharded lookup
    userData = await DatabaseShardingService.getDocument(
      indexEntry.organizationId, 
      'users', 
      userId
    );
  }
  
  return { user: userData, organizationId: indexEntry.organizationId };
}
```

**Returns**: `{ user: User, organizationId: string }`

### 2.3 Role Normalization (Lines 197-201, 255-259)

**File**: `frontend/src/auth/AuthContext.tsx` (lines 25-70)

```typescript
const normalizeUserRole = (rawRole: any) => {
  // If role is already complex object with id, return as-is
  if (typeof rawRole === 'object' && rawRole?.id) {
    return rawRole;
  }
  
  // If role is simple string, convert to complex object
  if (typeof rawRole === 'string') {
    return {
      id: rawRole,
      name: roleNames[rawRole] || rawRole,
      description: roleDescriptions[rawRole],
      level: roleLevels[rawRole]
    };
  }
};
```

**Purpose**: Handles both old (string) and new (object) role formats transparently.

**Output Structure**:
```typescript
{
  id: 'hr-manager',
  name: 'HR Manager',
  description: 'Human resources manager...',
  level: 3
}
```

### 2.4 Loading Stages Progress

The UI shows real-time loading progress:

| Stage | Progress | Message | Action |
|-------|----------|---------|--------|
| 0 | 10% | Connecting to server... | Initial connection |
| 1 | 30% | Authenticating user... | Firebase auth confirmed |
| 2 | 60% | Loading user profile... | User data fetched |
| 3 | 80% | Loading organization data... | Organization loaded |
| 4 | 95% | Preparing your dashboard... | Final setup |

### 2.5 Organization Data Loading (Lines 269-276)

For non-system users, organization data is fetched:

```typescript
if (result.organizationId && result.organizationId !== 'system') {
  const orgData = await FirebaseService.getDocument<Organization>(
    COLLECTIONS.ORGANIZATIONS,
    result.organizationId
  );
  dispatch({ type: 'SET_ORGANIZATION', payload: orgData });
}
```

---

## 3. FALLBACK FLOW (If Index Not Found)

If user is NOT in the index (legacy users), the system falls back to:

### 3.1 Flat Structure Check (Lines 289-293)

```typescript
let userData = await FirebaseService.getDocument<User>(
  COLLECTIONS.USERS,
  firebaseUser.uid
);
```

Checks `/users/{userId}` collection for super-users/resellers.

### 3.2 Sharded Search (Lines 296-341)

If not found in flat structure, searches all organizations in parallel:

```typescript
const organizations = await FirebaseService.getCollection<Organization>(
  COLLECTIONS.ORGANIZATIONS
);

const userSearchPromises = organizations.map(async (org) => {
  const shardedUser = await DatabaseShardingService.getDocument(
    org.id, 'users', firebaseUser.uid
  );
  return shardedUser ? { user: shardedUser, orgId: org.id } : null;
});

const searchResults = await Promise.all(userSearchPromises);
const foundResult = searchResults.find(result => result !== null);
```

### 3.3 Index Creation (Lines 320-327)

Once found, creates index entry for future O(1) lookups:

```typescript
await UserOrgIndexService.setUserOrganization(
  firebaseUser.uid,
  foundResult.orgId,
  userData.role,
  userData.email,
  'sharded'
);
```

---

## 4. CUSTOM CLAIMS MANAGEMENT

### 4.1 Backend Custom Claims Function

**File**: `functions/src/customClaims.ts` (lines 33-103)

```typescript
export const refreshUserClaims = onCall(async (request) => {
  const { uid } = request.auth || {};
  const { targetUserId } = request.data || {};
  
  const userIdToRefresh = targetUserId || uid;
  
  // Find user in flat or sharded collections
  // Extract role from user data
  const customClaims: UserClaims = {
    role: userData.role?.id || userData.role,  // Normalize role
    organizationId: organizationId,
    permissions: userData.permissions ? Object.keys(userData.permissions) : [],
    lastUpdated: Date.now()
  };
  
  // Set custom claims in Firebase Auth
  await auth.setCustomUserClaims(userIdToRefresh, customClaims);
  
  return { success: true, claims: customClaims };
});
```

### 4.2 When Claims Are Refreshed

1. **During Login**: If `getIdTokenResult().claims.role` is invalid
2. **Dashboard**: SuperAdmin/Reseller dashboards check and refresh if needed
3. **Manual Trigger**: Via `FirebaseService.refreshUserClaims()`

---

## 5. AUTHENTICATION STATE MANAGEMENT

### 5.1 AuthContext Reducer (Lines 111-145)

```typescript
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER': // User loaded successfully
      return {
        ...state,
        user: action.payload,
        loading: false,
        loadingProgress: null,
        error: null
      };
    case 'SET_ORGANIZATION':
      return { ...state, organization: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return initialState; // Clear all auth state
  }
};
```

### 5.2 AuthContext Type

```typescript
interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  loadingProgress: LoadingProgress | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

---

## 6. ROUTE PROTECTION

### 6.1 Protected Layout (App.tsx, Lines 291-305)

```typescript
const ProtectedLayout = () => {
  const { user, loading, error } = useAuth();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
```

All protected routes live inside this layout:
- `/dashboard`
- `/employees`
- `/warnings/create`
- `/users`
- etc.

### 6.2 Route Configuration (App.tsx, Lines 315-434)

```typescript
<Route path="/login" element={
  loading ? <LoadingScreen /> :
  user ? <Navigate to="/dashboard" replace /> :
  <LoginForm />
} />

<Route element={<ProtectedLayout />}>
  <Route path="/dashboard" element={...} />
  <Route path="/employees" element={...} />
  // All protected routes here
</Route>
```

---

## 7. PERMISSION & ROLE CHECKING

### 7.1 useMultiRolePermissions Hook

**File**: `frontend/src/hooks/useMultiRolePermissions.ts`

```typescript
export const useMultiRolePermissions = (): MultiRolePermissions => {
  const { user } = useAuth();

  const getUserRoles = (): string[] => {
    if (!user) return [];
    const primaryRole = user.role?.id || user.role;
    return [primaryRole];  // Array for future multi-role support
  };

  const hasRole = (role: string): boolean => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  };

  // Permission checking functions
  const canCreateWarnings = (): boolean => {
    return hasAnyRole(['hod-manager', 'hr-manager', 'business-owner', 'super-user']);
  };

  const canManageEmployees = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  // ... more permission functions
};
```

### 7.2 Role Definitions

**File**: `frontend/src/permissions/roleDefinitions.ts`

```typescript
export const USER_ROLES: Record<string, UserRole> = {
  'super-user': { id: 'super-user', level: 1, ... },
  'reseller': { id: 'reseller', level: 1.5, ... },
  'business-owner': { id: 'business-owner', level: 2, ... },
  'hr-manager': { id: 'hr-manager', level: 3, ... },
  'hod-manager': { id: 'hod-manager', level: 4, ... }
};

export const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  'super-user': {
    organizations: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    ...
  },
  'hr-manager': {
    employees: ['create', 'read', 'update', 'delete'],
    warnings: ['read', 'update'],
    ...
  },
  ...
};
```

### 7.3 User Management Rules

```typescript
export const USER_MANAGEMENT_RULES = {
  'super-user': {
    canManage: ['super-user', 'reseller', 'business-owner', 'hr-manager', 'hod-manager'],
    canCreate: ['reseller', 'business-owner', 'hr-manager', 'hod-manager'],
    canDelete: ['reseller', 'business-owner', 'hr-manager', 'hod-manager'],
    scope: 'global'
  },
  'business-owner': {
    canManage: ['hr-manager', 'hod-manager'],
    canCreate: ['hr-manager', 'hod-manager'],
    canDeactivate: ['hr-manager', 'hod-manager'],
    scope: 'organization'
  },
  'hr-manager': {
    canManage: ['hod-manager'],
    canCreate: ['hod-manager'],
    canUpdate: ['hr-manager', 'hod-manager'],
    scope: 'organization'
  }
};
```

---

## 8. DATA FLOW DIAGRAM

```
USER LOGIN
    ↓
LoginForm.tsx
    ↓ (email, password)
FirebaseService.signIn()
    ↓ (Firebase Auth)
onAuthStateChanged() TRIGGERED
    ↓
[STAGE 0] Initial Connection (10%)
    ↓
getIdTokenResult() - Check if role valid
    ↓ (if invalid)
refreshUserClaims() - Call backend function
    ↓ (customClaims.ts)
    └─ Find user in flat or sharded collections
    └─ Extract role data
    └─ Set custom claims in Firebase Auth
    └─ Sign out user (force token refresh)
    ↓ (if valid)
[STAGE 1] User Authenticated (30%)
    ↓
UserOrgIndexService.getUserWithOrganization()
    ↓
    ├─ Check userOrgIndex collection (O(1))
    └─ Fetch user from flat or sharded location
    ↓ (if not in index)
    ├─ Try flat structure
    └─ If not found, search all orgs in parallel
    └─ Create index entry for future O(1) lookups
    ↓
[STAGE 2] User Profile Loaded (60%)
    ↓
normalizeUserRole() - Convert role to standard format
    ↓
[STAGE 3] Organization Data Loading (80%)
    ↓
FirebaseService.getDocument('organizations', orgId)
    ↓
[STAGE 4] Dashboard Preparation (95%)
    ↓
dispatch(SET_USER, SET_ORGANIZATION)
    ↓
loading = false
    ↓
DASHBOARD RENDERS
    ↓
useMultiRolePermissions() - Permission checks
    ↓
Display role-specific content
```

---

## 9. ERROR HANDLING

### 9.1 Custom Claims Refresh Errors

If custom claims refresh fails:
1. User is signed out immediately
2. Alert shown: "Your user role has been refreshed! Please SIGN IN AGAIN."
3. User forced to re-login (tokens will have correct claims)

### 9.2 User Not Found

- Falls back to legacy search (O(n))
- Creates index entry for future O(1) lookups
- If still not found: `SET_ERROR` dispatched, shows error screen

### 9.3 Logout

```typescript
const logout = async () => {
  try {
    await FirebaseService.signOut();
    // State cleared by auth listener
  } catch (error) {
    dispatch({ type: 'LOGOUT' });
  }
};
```

---

## 10. LOADING STATES

### 10.1 Login Page Loading Screen
**File**: `frontend/src/auth/LoginForm.tsx` (lines 14-57)

Shows real-time progress from AuthContext:
- Spinner
- Status message (from `loadingProgress.message`)
- Progress bar (from `loadingProgress.progress`)

### 10.2 App-Level Loading Screen
**File**: `frontend/src/App.tsx` (lines 54-114)

Shows during initial auth state check:
- Same progress tracking as login
- Displayed when `loading === true`

### 10.3 Component Loading Fallback
**File**: `frontend/src/App.tsx` (lines 117-124)

For lazy-loaded components:
```typescript
<Suspense fallback={<ComponentLoader text="Loading Warning Wizard..." />}>
  <EnhancedWarningWizard />
</Suspense>
```

---

## 11. KEY AUTHENTICATION FILES

| File | Purpose | Key Functions |
|------|---------|---|
| `frontend/src/auth/AuthContext.tsx` | Auth state management | `onAuthStateChanged()`, role normalization, custom claims validation |
| `frontend/src/auth/LoginForm.tsx` | Login UI | Form submission, password visibility, forgot password link |
| `frontend/src/auth/ForgotPasswordModal.tsx` | Password reset | Firebase `sendPasswordResetEmail()` |
| `frontend/src/services/FirebaseService.ts` | Firebase operations | `signIn()`, `signOut()`, `refreshUserClaims()` |
| `frontend/src/services/UserOrgIndexService.ts` | User lookup | O(1) user-org mapping via index |
| `functions/src/customClaims.ts` | Backend claims | `refreshUserClaims()`, `getUserClaims()`, `refreshOrganizationUserClaims()` |
| `frontend/src/hooks/useMultiRolePermissions.ts` | Permission system | `hasRole()`, `canManageEmployees()`, etc. |
| `frontend/src/permissions/roleDefinitions.ts` | Role definitions | `USER_ROLES`, `ROLE_PERMISSIONS`, `USER_MANAGEMENT_RULES` |
| `frontend/src/App.tsx` | Route configuration | Protected routes, role-based navigation |

---

## 12. PRODUCTION FEATURES

- ✅ **O(1) User Lookup**: Via UserOrgIndex (prevents O(n) organization search)
- ✅ **Role Normalization**: Handles both string and object formats
- ✅ **Custom Claims Validation**: Detects and fixes invalid claims
- ✅ **Fallback Search**: Legacy users automatically indexed
- ✅ **Real-Time Progress**: 5-stage loading feedback
- ✅ **Multi-Role Support**: Framework ready for future expansion
- ✅ **Permission Granularity**: Per-role and per-action rules
- ✅ **Password Reset**: Email-based forgot password
- ✅ **Super User Organization Switching**: Global view capability

---

## 13. BACKWARDS COMPATIBILITY

The system maintains full backwards compatibility:

1. **Role Format**: Accepts both `'hr-manager'` (string) and `{id: 'hr-manager', name: '...'}` (object)
2. **User Location**: Searches flat (/users) and sharded (organizations/{id}/users) structures
3. **Organization Index**: Automatic index creation for legacy users
4. **Claims Format**: Handles old/new Firebase custom claims formats

---

## 14. SECURITY CONSIDERATIONS

- ✅ **Secure Claim Validation**: Detects tampering on token decode
- ✅ **Force Re-Login on Claim Changes**: Signs out if claims modified
- ✅ **Email Enumeration Prevention**: Password reset doesn't reveal user existence
- ✅ **Rate Limiting**: Firebase handles failed login attempts
- ✅ **Organization Isolation**: Users can only access their organization
- ✅ **Role-Based Access**: Routes protected by role checks

---

## 15. DEBUGGING COMMANDS

Check custom claims:
```typescript
const result = await FirebaseService.getUserClaims();
console.log(result); // { uid, email, claims, tokensValidAfterTime }
```

Refresh user claims:
```typescript
await FirebaseService.refreshUserClaims('user-id');
```

Clear cache:
```typescript
UserOrgIndexService.clearCache();
```

Health check index:
```typescript
const { healthy, issues } = await UserOrgIndexService.healthCheck();
```

