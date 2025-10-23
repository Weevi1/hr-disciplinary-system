# Authentication Architecture Testing Guide

**Session 36 Continuation - Option A Implementation**

This guide provides comprehensive test scenarios for the new best-practice authentication and authorization architecture. All changes are now **LIVE IN PRODUCTION**.

---

## Overview of Changes

### **What Changed**

1. **Minimal Custom Claims**: JWT tokens now use shortened format (`org`, `r`, `v`, `iat`) instead of large permissions arrays
2. **Claims Version Tracking**: Every permission change increments `claimsVersion` in Firestore
3. **Staleness Detection**: Frontend and backend detect outdated JWT tokens and force refresh
4. **Error Handling with Rollback**: Failed Firestore creation deletes Firebase Auth user automatically
5. **Defense-in-Depth Authorization**: Backend ALWAYS checks Firestore, never trusts JWT claims alone
6. **Token Revocation**: Optional immediate token revocation for security-critical permission changes

### **What Stayed the Same**

- User login flow (email/password)
- Password reset functionality
- Role-based access control
- Firestore as source of truth for permissions
- Organization sharding architecture

### **Backward Compatibility**

- Old users with legacy claims (`role`, `organizationId`) continue to work
- AuthContext supports both old and new claim formats
- `refreshUserClaims` function migrates users to new format on next refresh
- No breaking changes for existing users

---

## Test Scenarios

### **Scenario 1: New User Creation (Manager)**

**Test**: Business Owner creates a new HR Manager

**Steps**:
1. Login as Business Owner
2. Navigate to User Management
3. Click "Create New User"
4. Fill in form:
   - Email: `hr-test@example.com`
   - First Name: `Test`
   - Last Name: `Manager`
   - Role: `HR Manager`
   - Password: `Test123!`
5. Click "Create User"

**Expected Behavior**:
1. ✅ Firebase Auth user created with email and password
2. ✅ Firestore document created at `organizations/{orgId}/users/{uid}` with:
   - `claimsVersion: 1`
   - `updatedAt: <current timestamp>`
   - `role: 'hr-manager'`
3. ✅ Custom claims set in Firebase Auth:
   ```json
   {
     "org": "{organizationId}",
     "r": "hr-manager",
     "v": 1,
     "iat": 1729785600000
   }
   ```
4. ✅ Success message displayed: "User created successfully"

**Verification**:
- Check Firebase Console → Authentication: User exists
- Check Firestore Console → `organizations/{orgId}/users/{uid}`: Document exists with `claimsVersion: 1`
- Check browser console for log: `✅ Set minimal custom claims for {uid}:`

**Error Handling Test**:
- **Test**: Create user with duplicate email
  - **Expected**: Error message "Email already exists", no Firestore document created
- **Test**: Simulate Firestore failure (disable Firestore in Firebase Console temporarily)
  - **Expected**: Auth user deleted automatically, error message "Failed to create user profile. Auth user rolled back."

---

### **Scenario 2: Immediate User Login After Creation**

**Test**: New user created in Scenario 1 logs in immediately

**Steps**:
1. Complete Scenario 1 (create HR Manager)
2. **Without signing out**, open new incognito window
3. Navigate to login page
4. Login with credentials from Scenario 1:
   - Email: `hr-test@example.com`
   - Password: `Test123!`

**Expected Behavior**:
1. ✅ Login succeeds immediately (no need to wait)
2. ✅ User redirected to HR Dashboard
3. ✅ AuthContext loads user profile from Firestore
4. ✅ Browser console shows:
   - `✅ [AUTH] Custom claims found (role: hr-manager, version: 1)`
   - `✅ [AUTH] User authenticated: {uid}`

**Verification**:
- Check Network tab: No errors related to missing claims
- Check Application tab → IndexedDB → `firebaseLocalStorageDb`: User data stored
- Check Redux DevTools (if enabled): User state populated with correct role

---

### **Scenario 3: Permission Change with Staleness Detection**

**Test**: Business Owner changes user's role, user's token becomes stale

**Steps**:
1. Login as HR Manager (from Scenario 1)
2. Open HR Dashboard (keep this tab open)
3. In another tab, login as Business Owner
4. Navigate to User Management
5. Find HR Manager created in Scenario 1
6. Click "Edit Permissions"
7. Change role from "HR Manager" to "HOD Manager"
8. Click "Save Changes"
9. **Switch back to HR Manager tab**
10. Perform any action (navigate to Warnings, refresh page, etc.)

**Expected Behavior**:
1. ✅ Business Owner sees success message: "Permissions updated successfully. Claims version: 1 → 2"
2. ✅ Firestore updated:
   - `role: 'hod-manager'`
   - `claimsVersion: 2`
   - `updatedAt: <new timestamp>`
   - `updatedBy: <business-owner-uid>`
3. ✅ Custom claims updated in Firebase Auth:
   ```json
   {
     "org": "{organizationId}",
     "r": "hod-manager",
     "v": 2,
     "iat": 1729786000000
   }
   ```
4. ✅ When HR Manager tab performs action:
   - Browser console shows: `⚠️ [AUTH] Stale token detected (v1 vs v2), refreshing...`
   - Token automatically refreshed: `✅ [AUTH] Token refreshed from v1 to v2`
   - Page reloads with new permissions
   - Dashboard switches from HR Dashboard to HOD Dashboard

**Verification**:
- Check Firestore Console: `claimsVersion` incremented to 2
- Check browser console (HR Manager tab): Staleness detection logs
- Check Network tab: `getIdToken(true)` called to refresh token
- Check `auditLogs` collection: Audit entry created with details of permission change

---

### **Scenario 4: Token Revocation for Security-Critical Changes**

**Test**: Business Owner deactivates user account with immediate token revocation

**Steps**:
1. Login as HOD Manager (from Scenario 3, now with `hod-manager` role)
2. Keep HOD Manager tab open
3. In another tab, login as Business Owner
4. Navigate to User Management
5. Find HOD Manager
6. Click "Deactivate Account"
7. Check option: "Revoke all tokens immediately (recommended for security)"
8. Click "Confirm Deactivation"
9. **Switch back to HOD Manager tab**
10. Perform any action (navigate, refresh, etc.)

**Expected Behavior**:
1. ✅ Business Owner sees: "User account deactivated. All tokens revoked."
2. ✅ Firestore updated:
   - `isActive: false`
   - `claimsVersion: 3` (incremented)
3. ✅ `auth.revokeRefreshTokens(uid)` called in backend
4. ✅ Backend log shows: `🔒 Revoked all tokens for {uid} for immediate effect`
5. ✅ When HOD Manager tab performs action:
   - API request fails with: `permission-denied: Account is inactive`
   - User redirected to login page
   - Error message displayed: "Your account has been deactivated. Please contact support."

**Verification**:
- Check Firestore Console: `isActive: false`, `claimsVersion: 3`
- Check Firebase Console → Authentication → User → Tokens: `tokensValidAfterTime` updated
- Check browser console (HOD Manager tab): Authentication error logged
- Check `auditLogs` collection: Audit entry with `tokensRevoked: true`

---

### **Scenario 5: Missing Claims Auto-Refresh**

**Test**: User has Firebase Auth account but missing custom claims

**Simulation Setup**:
1. Manually remove custom claims via Firebase Console:
   - Firebase Console → Authentication → Users
   - Find test user
   - Custom Claims tab → Delete all claims
2. User already logged in (has valid session)

**Steps**:
1. Refresh browser tab (user stays logged in)
2. Perform any action

**Expected Behavior**:
1. ✅ AuthContext detects missing claims: `!hasClaims` check passes
2. ✅ Browser console shows: `⚠️ [AUTH] Missing custom claims, auto-refreshing...`
3. ✅ `refreshUserClaims` Cloud Function called automatically
4. ✅ Claims set in Firebase Auth
5. ✅ Token refreshed: `await firebaseUser.getIdToken(true)`
6. ✅ Browser console shows: `✅ [AUTH] Claims refreshed and token updated`
7. ✅ Auth state change re-triggered, user profile loaded
8. ✅ User can proceed normally without manual logout/login

**Verification**:
- Check Firebase Console → Authentication → User → Custom Claims: Claims restored
- Check browser console: Auto-refresh logs
- Check Network tab: `refreshUserClaims` function called

---

### **Scenario 6: Backend Authorization (Defense-in-Depth)**

**Test**: Backend function validates permissions from Firestore, not just JWT

**Steps**:
1. Login as HOD Manager
2. Open browser DevTools → Console
3. Call a protected function manually with stale token:
   ```javascript
   // Simulate calling function with old token (before permission change)
   const functions = firebase.functions();
   const createWarning = functions.httpsCallable('createWarning');

   createWarning({
     employeeId: 'test123',
     offense: 'Late arrival'
   }).then(result => {
     console.log('Success:', result);
   }).catch(error => {
     console.error('Error:', error);
   });
   ```

**Expected Behavior** (if user role changed but token not refreshed yet):
1. ✅ Backend function receives request with JWT claims
2. ✅ `AuthorizationMiddleware.validatePermission()` called
3. ✅ Backend fetches user data from Firestore (NOT from JWT)
4. ✅ Backend compares token version vs Firestore version:
   - Token version: `v1`
   - Firestore version: `v2`
5. ✅ Backend detects stale token
6. ✅ Request rejected with error:
   ```
   failed-precondition: Token is stale (v1 vs v2). Please refresh your session.
   ```
7. ✅ Frontend catches error, triggers token refresh

**Verification**:
- Check Firebase Functions logs: `Stale token detected for {uid}: v1 vs v2`
- Check browser console: Error logged with specific message
- Check that function did NOT execute with stale permissions

---

### **Scenario 7: Rollback on Firestore Failure**

**Test**: Firestore creation fails after Firebase Auth user created

**Simulation**:
1. Temporarily modify Firestore security rules to deny writes to `organizations/{orgId}/users/{uid}` collection
2. Or use Firebase Console to simulate Firestore outage (pause Firestore)

**Steps**:
1. Login as Business Owner
2. Attempt to create new user (same as Scenario 1)

**Expected Behavior**:
1. ✅ Firebase Auth user created successfully
2. ✅ Firestore write attempted
3. ✅ Firestore write fails (permission denied or service unavailable)
4. ✅ Backend catches error in try-catch block
5. ✅ Backend calls `auth.deleteUser(userRecord.uid)` to rollback
6. ✅ Firebase Auth user deleted automatically
7. ✅ Error returned to frontend: `Failed to create user profile. Auth user rolled back.`
8. ✅ User not created in system (atomic operation maintained)

**Verification**:
- Check Firebase Console → Authentication: User does NOT exist
- Check Firestore Console: No document created
- Check Firebase Functions logs: Error log with rollback message
- Frontend shows clear error message to Business Owner

**Restore**: Re-enable Firestore writes after test

---

### **Scenario 8: Backward Compatibility (Old Claims Format)**

**Test**: User with legacy claims format can still login and use system

**Simulation Setup**:
1. Manually set old claims format via Firebase Console:
   - Firebase Console → Authentication → Users
   - Custom Claims tab → Set claims:
     ```json
     {
       "role": "hr-manager",
       "organizationId": "org123",
       "permissions": ["warnings:create", "warnings:read"]
     }
     ```
2. Ensure user document in Firestore does NOT have `claimsVersion` field (simulates old user)

**Steps**:
1. Login with user that has old claims format
2. Navigate to HR Dashboard
3. Perform normal actions (create warning, view employees, etc.)

**Expected Behavior**:
1. ✅ Login succeeds
2. ✅ AuthContext detects old claims format: `claims.role` instead of `claims.r`
3. ✅ AuthContext extracts role from old format: `claims.role || claims.r`
4. ✅ User can access system normally
5. ✅ On next permission change or manual refresh, user migrated to new format
6. ✅ Backend functions work with both formats (normalize role extraction)

**Verification**:
- Check browser console: No errors related to claims format
- Check that user can perform all normal actions
- After calling `refreshUserClaims` manually or permission change, verify claims updated to new format

---

### **Scenario 9: Bulk User Migration**

**Test**: Migrate all users in an organization to new claims format

**Steps**:
1. Login as Business Owner or Super User
2. Open browser DevTools → Console
3. Call bulk refresh function:
   ```javascript
   const functions = firebase.functions();
   const refreshOrg = functions.httpsCallable('refreshOrganizationUserClaims');

   refreshOrg({ organizationId: 'your-org-id' })
     .then(result => {
       console.log('Migration results:', result.data);
     });
   ```

**Expected Behavior**:
1. ✅ Function iterates through all users in organization
2. ✅ Each user's claims updated to new format
3. ✅ `claimsVersion` initialized to 1 (if not present)
4. ✅ Function returns summary:
   ```json
   {
     "success": true,
     "organizationId": "org123",
     "totalUsers": 15,
     "successCount": 15,
     "results": [
       { "userId": "uid1", "success": true, "role": "hr-manager" },
       { "userId": "uid2", "success": true, "role": "hod-manager" },
       ...
     ]
   }
   ```

**Verification**:
- Check Firebase Console → Authentication: All users have new claims format
- Check Firestore Console: All user documents have `claimsVersion` field
- Check Firebase Functions logs: Bulk refresh completed log

---

### **Scenario 10: Audit Trail Verification**

**Test**: All permission changes create audit log entries

**Steps**:
1. Perform Scenario 3 (permission change)
2. Navigate to Firestore Console
3. Open `auditLogs` collection
4. Filter by `resourceType: 'user'` and `action: 'USER_PERMISSIONS_UPDATED'`

**Expected Behavior**:
1. ✅ Audit log entry created with:
   ```javascript
   {
     action: 'USER_PERMISSIONS_UPDATED',
     resourceType: 'user',
     resourceId: '{targetUserId}',
     performedBy: '{businessOwnerUid}',
     organizationId: '{orgId}',
     details: {
       oldVersion: 1,
       newVersion: 2,
       tokensRevoked: false,
       reason: 'Role change',
       changes: {
         role: { from: 'hr-manager', to: 'hod-manager' }
       }
     },
     timestamp: <Firestore Timestamp>
   }
   ```

**Verification**:
- Complete audit trail exists for all permission changes
- Audit log includes who made the change, when, and what changed
- Version history tracked (oldVersion → newVersion)

---

## Performance Testing

### **Test 1: JWT Token Size**

**Objective**: Verify minimal claims keep token size under Firebase limit

**Steps**:
1. Login as any user
2. Open browser DevTools → Application tab → IndexedDB → `firebaseLocalStorageDb`
3. Find user's ID token (base64 encoded string)
4. Copy token and decode at https://jwt.io
5. Check "Payload" section size

**Expected**:
- ✅ Minimal claims format: ~60-80 bytes
  ```json
  {
    "org": "org123abc",
    "r": "hr-manager",
    "v": 1,
    "iat": 1729785600000
  }
  ```
- ✅ Total token size: ~200-300 bytes (well under 1000 byte limit)
- ✅ 93% buffer remaining for future fields

**Compare to Old Format** (if available):
- ❌ Old format with permissions array: ~200-400 bytes
  ```json
  {
    "role": "hr-manager",
    "organizationId": "org123abc",
    "permissions": [
      "warnings:create",
      "warnings:read",
      "warnings:update",
      "warnings:delete",
      "employees:read",
      "employees:update"
    ],
    "lastUpdated": 1729785600000
  }
  ```

---

### **Test 2: Login Performance**

**Objective**: Verify no performance regression with new architecture

**Steps**:
1. Clear browser cache
2. Open Network tab in DevTools
3. Login as user
4. Measure:
   - Time to first Firestore query
   - Time to user profile loaded
   - Time to dashboard rendered

**Expected**:
- ✅ No significant performance difference vs old implementation
- ✅ Firestore query remains primary bottleneck (not claims processing)
- ✅ AuthContext processes claims in <5ms

---

## Security Testing

### **Test 1: Inactive User Access Prevention**

**Steps**:
1. Deactivate user account (set `isActive: false` in Firestore)
2. Attempt login with deactivated user

**Expected**:
- ✅ Login blocked with message: "Your account has been deactivated. Please contact support."

---

### **Test 2: Stale Token Attack Prevention**

**Steps**:
1. User has valid token with `role: hr-manager`, `v: 1`
2. Admin changes role to `hod-manager`, increments `v: 2`
3. User makes API request **WITHOUT refreshing token**

**Expected**:
- ✅ Backend detects stale token (v1 vs v2)
- ✅ Request rejected: `failed-precondition: Token is stale`
- ✅ User forced to refresh token before proceeding

---

### **Test 3: Missing Claims Attack Prevention**

**Steps**:
1. Attacker manually removes custom claims
2. Attacker attempts to access protected resources

**Expected**:
- ✅ Frontend detects missing claims
- ✅ Auto-refresh triggered
- ✅ If refresh fails, user redirected to login

---

## Monitoring & Observability

### **Firebase Functions Logs**

**Key Logs to Monitor**:

1. **User Creation Success**:
   ```
   ✅ [CREATE USER] Created Firestore user document: {uid}
   ✅ [CREATE USER] Set minimal custom claims for {uid}: {claims}
   ```

2. **User Creation Rollback** (error condition):
   ```
   ❌ [CREATE USER] Failed to create Firestore document, rolling back Auth user
   ```

3. **Claims Refresh**:
   ```
   ✅ [CUSTOM CLAIMS] Minimal claims refreshed for {uid}: {claims}
   ```

4. **Staleness Detection** (backend):
   ```
   ⚠️ [AUTH MIDDLEWARE] Stale token detected for {uid}: v1 vs v2
   ```

5. **Permission Update**:
   ```
   ✅ [PERMISSIONS] Updating permissions for {uid}: v1 → v2
   🔒 [PERMISSIONS] Revoked all tokens for {uid} for immediate effect
   ```

### **Browser Console Logs**

**Key Logs to Monitor**:

1. **Login Success**:
   ```
   ✅ [AUTH] Custom claims found (role: hr-manager, version: 1)
   ✅ [AUTH] User authenticated: {uid}
   ```

2. **Missing Claims Auto-Refresh**:
   ```
   ⚠️ [AUTH] Missing custom claims, auto-refreshing...
   ✅ [AUTH] Claims refreshed and token updated
   ```

3. **Staleness Detection** (frontend):
   ```
   ⚠️ [AUTH] Stale token detected (v1 vs v2), refreshing...
   ✅ [AUTH] Token refreshed from v1 to v2
   ```

4. **Inactive User**:
   ```
   ⚠️ [AUTH] User account is inactive
   ```

---

## Rollback Plan (Emergency)

If critical issues discovered in production:

### **Option 1: Revert Backend Functions**

```bash
# List recent deployments
firebase functions:log

# Revert to previous deployment (if needed)
# Note: Firebase doesn't support automatic rollback, must redeploy old code
git checkout <previous-commit-hash>
cd functions
npm run build
firebase deploy --only functions
```

### **Option 2: Disable Staleness Detection**

**Frontend** (`AuthContext.tsx` lines 268-287):
```typescript
// Temporarily disable staleness check by commenting out:
// if (isStale) {
//   // staleness detection code
// }
```

**Backend** (`authorizationMiddleware.ts` lines 71-83):
```typescript
// Temporarily disable backend staleness check:
// if (tokenVersion < firestoreVersion) {
//   // backend staleness detection
// }
```

### **Option 3: Emergency Claims Refresh**

Run bulk claims refresh for all organizations:

```javascript
// List of all organization IDs
const orgIds = ['org1', 'org2', 'org3', ...];

const functions = firebase.functions();
const refreshOrg = functions.httpsCallable('refreshOrganizationUserClaims');

for (const orgId of orgIds) {
  await refreshOrg({ organizationId: orgId });
  console.log(`Refreshed: ${orgId}`);
}
```

---

## Success Criteria

✅ **All test scenarios pass without errors**

✅ **No user complaints about login issues**

✅ **Audit logs populated correctly**

✅ **Performance metrics within acceptable range** (<5% regression)

✅ **Security tests confirm enhanced protection**

✅ **Firebase Functions logs show expected behavior**

✅ **Browser console logs match expected patterns**

---

## Known Issues & Limitations

### **1. Claims Refresh Latency**

- **Issue**: Claims refresh can take 1-2 seconds
- **Impact**: User might see brief loading state
- **Mitigation**: Show loading indicator during refresh

### **2. Token Revocation Propagation**

- **Issue**: Revoked tokens can remain valid for up to 1 hour (Firebase limitation)
- **Impact**: User might still have access briefly after revocation
- **Mitigation**: Backend always checks Firestore (defense-in-depth)

### **3. Audit Log Storage**

- **Issue**: Large number of permission changes = many audit logs
- **Impact**: Firestore costs increase
- **Mitigation**: Consider archiving old audit logs after 90 days

---

## Contact & Support

**For Issues or Questions**:
- Check Firebase Functions logs first
- Check browser console logs
- Review this testing guide
- Check `BEST_PRACTICE_AUTH_IMPLEMENTATION.md` for architecture details

**Emergency Contact**:
- Review Rollback Plan section above
- Contact system administrator

---

**Last Updated**: 2025-10-23 (Session 36 Continuation)

**Status**: ✅ **ALL CHANGES DEPLOYED TO PRODUCTION**
