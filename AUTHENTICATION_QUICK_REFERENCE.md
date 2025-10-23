# Authentication Flow - Quick Reference

## The 5-Stage Login Process

```
1. LOGIN FORM                    → User enters email/password
   └─ LoginForm.tsx (lines 59-202)

2. FIREBASE AUTHENTICATION       → signInWithEmailAndPassword()
   └─ FirebaseService.ts (lines 80-89)

3. AUTH STATE LISTENER TRIGGERED → onAuthStateChanged() fires automatically
   └─ AuthContext.tsx (lines 164-390)

4. VALIDATE CUSTOM CLAIMS        → Check if role is valid string
   └─ getIdTokenResult().claims.role validation (lines 233-252)

5. USER DATA + ORGANIZATION      → Load from index, fallback to search
   └─ UserOrgIndexService (O(1) lookup)
   └─ Role normalization (string → object)
   └─ Organization fetching
```

---

## Key Files Quick Map

| When | What | Where |
|------|------|-------|
| **User logs in** | Form submitted | `/frontend/src/auth/LoginForm.tsx` |
| **Firebase auth** | Email/password check | `/frontend/src/services/FirebaseService.ts` |
| **Post-login** | Custom claims validation + user data loading | `/frontend/src/auth/AuthContext.tsx` (lines 164-390) |
| **User lookup** | O(1) index-based retrieval | `/frontend/src/services/UserOrgIndexService.ts` |
| **Role format** | String → object conversion | `/frontend/src/auth/AuthContext.tsx` (lines 25-70) |
| **Custom claims** | Backend claims generation | `/functions/src/customClaims.ts` |
| **Permission checks** | What can user do? | `/frontend/src/hooks/useMultiRolePermissions.ts` |
| **Role definitions** | Role hierarchy + permissions | `/frontend/src/permissions/roleDefinitions.ts` |
| **Protected routes** | Route access control | `/frontend/src/App.tsx` (lines 291-434) |

---

## Custom Claims Validation (Critical Flow)

**Problem**: User's Firebase token might have invalid/missing role claim

**Solution** (AuthContext.tsx, lines 233-252):
```typescript
const idTokenResult = await firebaseUser.getIdTokenResult();
const roleIsInvalid = !idTokenResult.claims.role || 
                      typeof idTokenResult.claims.role === 'object';

if (roleIsInvalid) {
  // Call backend to refresh claims
  await refreshUserClaims();
  // Sign out user (force token refresh on next login)
  await auth.signOut();
  // Notify user
  alert('Your user role has been refreshed! Please SIGN IN AGAIN.');
}
```

**Why it matters**: If a user's role was just added/changed via admin panel, their cached token might not have it yet.

---

## Role Normalization (Backwards Compatibility)

**Input**: `'hr-manager'` (string) or `{id: 'hr-manager', name: '...'}` (object)

**Output** (AuthContext.tsx, lines 25-70):
```typescript
{
  id: 'hr-manager',
  name: 'HR Manager',
  description: 'Human resources manager...',
  level: 3
}
```

**Usage**: Can check role as `user.role.id` or use string methods

---

## User Lookup (O(1) Optimization)

### Normal Path (Fast - O(1))
```
1. Check userOrgIndex/{userId} (fast index lookup)
2. Return { user, organizationId }
```

### Fallback Path (Slow - O(n))
```
1. Check /users/{userId} (super-users/resellers)
2. If not found, search organizations/{*/users/{userId} (parallel)
3. Create index entry for future O(1) lookups
```

---

## Role Hierarchy

```
1 = super-user (highest access)
1.5 = reseller
2 = business-owner
3 = hr-manager
4 = hod-manager (lowest access)
```

Each role can only manage roles with equal or higher level.

---

## Permission Checking Pattern

```typescript
// In your component:
const { canCreateWarnings, hasRole } = useMultiRolePermissions();

if (canCreateWarnings()) {
  // Show warning creation UI
}

if (hasRole('super-user')) {
  // Show admin panel
}
```

**Available Functions**:
- `hasRole('role-id')` - Check single role
- `hasAnyRole(['role1', 'role2'])` - Check if user has any of these
- `hasAllRoles(['role1', 'role2'])` - Check if user has ALL
- `canCreateWarnings()`, `canManageEmployees()`, etc.

---

## Loading States (User Perspective)

```
Login → Spinner + Progress Bar → Dashboard

Progress:
10% - Connecting to server
30% - Authenticating user
60% - Loading user profile
80% - Loading organization
95% - Preparing dashboard
100% - Complete
```

---

## Route Protection

**Protected Routes** (require `user !== null`):
- `/dashboard`
- `/employees`
- `/warnings/create`
- `/users`
- All other routes inside `ProtectedLayout`

**Public Routes**:
- `/login`
- `/` → redirects to `/login` or `/dashboard`

---

## Common Debugging Tasks

### Check current user's claims
```typescript
const result = await FirebaseService.getUserClaims();
console.log(result.claims);
```

### Force refresh claims
```typescript
await FirebaseService.refreshUserClaims();
```

### Clear user organization index cache
```typescript
UserOrgIndexService.clearCache();
```

### Check index health
```typescript
const { healthy, issues } = await UserOrgIndexService.healthCheck();
if (!healthy) console.log('Index issues:', issues);
```

---

## Security Checklist

- [ ] Role validation on every login (getIdTokenResult check)
- [ ] Custom claims refresh if invalid
- [ ] Force re-login after claims update
- [ ] Route protection via ProtectedLayout
- [ ] Permission checks before sensitive operations
- [ ] Organization isolation enforced
- [ ] No sensitive data in localStorage

---

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| User stuck on loading | Claims validation failure | User will auto-refresh on next login |
| "Access Denied" | Role permission issue | Check `useMultiRolePermissions()` in component |
| User not found after creation | Index not created | `UserOrgIndexService.migrateExistingUsers()` |
| Role showing as object instead of string | Old vs new format | Role normalization handles this automatically |
| Forgot Password not working | Email not configured | Check Firebase project settings |

---

## Performance Notes

- **User Lookup**: O(1) with index, O(n) without (fallback)
- **Organization Load**: Single Firestore document read
- **Custom Claims**: Cached in JWT token (valid ~1 hour)
- **Index Caching**: 5-minute TTL to reduce Firestore reads

---

## File Size Reference

- `AuthContext.tsx`: ~600 lines (core auth logic)
- `FirebaseService.ts`: ~450 lines (Firebase operations)
- `UserOrgIndexService.ts`: ~320 lines (scalable user lookup)
- `customClaims.ts`: ~270 lines (backend claims management)
- `useMultiRolePermissions.ts`: ~180 lines (permission checking)
- `roleDefinitions.ts`: ~280 lines (role hierarchy + rules)

