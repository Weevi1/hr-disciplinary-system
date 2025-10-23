# Best-Practice Authentication & Authorization Implementation Guide

**Date**: 2025-10-23
**Session**: 36 (continued)
**Status**: 🚧 In Progress - Phase 1 Complete

---

## 🎯 Implementation Overview

This guide documents the systematic refactor from the "quick fix" approach to industry best-practice authentication architecture for multi-tenant SaaS with Firebase.

---

## ✅ Phase 1: Type System & Core Infrastructure (COMPLETE)

### Changes Made

**File**: `frontend/src/types/core.ts`

1. **Updated User Interface**:
```typescript
export interface User {
  // ... existing fields ...
  claimsVersion?: number; // For detecting stale JWT tokens
  updatedAt?: string;     // Track last permission/role change
}
```

2. **Added MinimalCustomClaims Interface**:
```typescript
export interface MinimalCustomClaims {
  org: string;      // Organization ID (shortened to save bytes)
  r: UserRoleId;    // Role ID (shortened)
  v: number;        // Claims version (staleness detection)
  iat: number;      // Issued at timestamp
  res?: string;     // Reseller ID (optional)
}
```

**Rationale**:
- **Shortened keys**: `org` instead of `organizationId` saves ~15 bytes per token
- **Minimal data**: Removed permissions array (was 200-400 bytes)
- **Version tracking**: Enables staleness detection
- **Well under 1000 byte limit**: Current size ~60-80 bytes (93% buffer)

3. **Updated createOrganizationUser Function** (COMPLETE):

**File**: `functions/src/createOrganizationUser.ts`

**Key Improvements**:
- ✅ Minimal custom claims format
- ✅ Claims version initialization (starts at 1)
- ✅ Error handling with rollback
- ✅ Graceful claims failure (logs warning, doesn't block user creation)

```typescript
// Initialize claims version
const initialClaimsVersion = 1;
const extendedUserData = {
  ...userData,
  claimsVersion: initialClaimsVersion,
  updatedAt: new Date().toISOString()
};

// Firestore with error handling
try {
  await userDocRef.set(extendedUserData);
} catch (firestoreError) {
  // ROLLBACK: Delete Auth user if Firestore fails
  await auth.deleteUser(userRecord.uid);
  throw new HttpsError('internal', 'Failed to create user profile');
}

// Minimal custom claims
const customClaims = {
  org: organizationId,
  r: role,
  v: initialClaimsVersion,
  iat: Date.now()
};

try {
  await auth.setCustomUserClaims(userRecord.uid, customClaims);
} catch (claimsError) {
  // Log but don't throw - can be fixed with refreshUserClaims
  logger.error(`Failed to set claims`, claimsError);
}
```

---

## 🚧 Phase 2: Backend Functions Update (PENDING)

### Remaining Backend Functions to Update

#### 1. `createOrganizationAdmin`
**File**: `functions/src/Auth/userCreationService.ts` (lines 151-169)

**Required Changes**:
```typescript
// Add claims version to user profile
const userProfile = {
  // ... existing fields ...
  claimsVersion: 1,
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

// Use minimal claims format
const customClaims = {
  org: organizationId,
  r: role,
  v: 1,
  iat: Date.now()
};

// Add error handling with rollback
try {
  await admin.firestore()...
} catch (error) {
  await admin.auth().deleteUser(userRecord.uid);
  throw error;
}
```

#### 2. `createOrganizationUsers` (Bulk Creation)
**File**: `functions/src/Auth/userCreationService.ts` (lines 304-316)

**Required Changes**:
- Same pattern as above for each user in loop
- Track rollback on partial failures
- Return detailed success/failure array

#### 3. `createResellerUser`
**File**: `functions/src/Auth/userCreationService.ts` (lines 486-501)

**Required Changes**:
```typescript
const customClaims = {
  r: 'reseller',  // No org field for resellers
  res: resellerId,
  v: 1,
  iat: Date.now()
};
```

#### 4. `refreshUserClaims`
**File**: `functions/src/customClaims.ts` (lines 80-89)

**Critical Update Needed**:
```typescript
// BEFORE (current - too large):
const customClaims: UserClaims = {
  role: userData.role?.id || userData.role,
  organizationId: organizationId,
  permissions: userData.permissions ? Object.keys(userData.permissions) : [], // ❌ Can be 200-400 bytes!
  lastUpdated: Date.now()
};

// AFTER (minimal):
const customClaims = {
  org: organizationId,
  r: userData.role?.id || userData.role,
  v: userData.claimsVersion || 1,
  iat: Date.now()
};
```

---

## 🚧 Phase 3: Frontend AuthContext (PENDING)

### Required Changes to AuthContext.tsx

**File**: `frontend/src/auth/AuthContext.tsx`

**Current Implementation Analysis Needed**:
1. Does it check JWT custom claims OR Firestore?
2. How does it handle users with no claims?
3. Does it refresh tokens when needed?

**Recommended Implementation**:

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setUserData(null);
      return;
    }

    try {
      // 1. Get JWT token (fast, offline)
      const tokenResult = await firebaseUser.getIdTokenResult();
      const claims = tokenResult.claims as MinimalCustomClaims;

      // 2. Quick validation: Check if claims exist
      if (!claims.org || !claims.r) {
        logger.warn('User has no custom claims, calling refreshUserClaims');
        // Auto-fix: Call refreshUserClaims cloud function
        await functions.httpsCallable('refreshUserClaims')();
        // Force token refresh
        await firebaseUser.getIdToken(true);
        return; // Re-run auth check with new token
      }

      // 3. Get Firestore data (source of truth for permissions)
      const userDoc = await firestore
        .collection(`organizations/${claims.org}/users`)
        .doc(firebaseUser.uid)
        .get();

      if (!userDoc.exists) {
        throw new Error('User document not found');
      }

      const firestoreData = userDoc.data();

      // 4. Check if user is still active
      if (!firestoreData.isActive) {
        await auth.signOut();
        throw new Error('Account has been deactivated');
      }

      // 5. STALENESS DETECTION: Check if token is out of sync
      if (claims.v !== firestoreData.claimsVersion) {
        logger.warn(`Token stale: v${claims.v} vs v${firestoreData.claimsVersion}, refreshing`);
        // Force token refresh
        await firebaseUser.getIdToken(true);
        // Re-run auth check
        return;
      }

      // 6. All checks passed - set user data
      setUser(firebaseUser);
      setUserData(firestoreData);

    } catch (error) {
      logger.error('Auth state change error:', error);
      setError(error.message);
      await auth.signOut();
    }
  });

  return unsubscribe;
}, []);
```

**Key Features**:
- ✅ Auto-fix missing claims
- ✅ Staleness detection via version number
- ✅ Inactive user handling
- ✅ Automatic token refresh
- ✅ Graceful error handling

---

## 🚧 Phase 4: Permission Update Utility (PENDING)

### Create New Utility Function

**File**: `functions/src/updateUserPermissions.ts` (NEW FILE)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface UpdatePermissionsRequest {
  targetUserId: string;
  newRole?: string;
  newPermissions?: string[];
  revokeTokens?: boolean; // Immediate revocation for security
}

export const updateUserPermissions = onCall<UpdatePermissionsRequest>(
  { region: 'us-central1', cors: true },
  async (request) => {
    const { targetUserId, newRole, newPermissions, revokeTokens = false } = request.data;

    // 1. Permission check: Only business owners can update permissions
    const callerDoc = await firestore.doc(`organizations/${orgId}/users/${request.auth.uid}`).get();
    const callerRole = callerDoc.data()?.role?.id || callerDoc.data()?.role;

    if (callerRole !== 'business-owner' && callerRole !== 'super-user') {
      throw new HttpsError('permission-denied', 'Insufficient permissions');
    }

    const auth = getAuth();
    const db = getFirestore();

    // 2. Get current user data
    const userDoc = await db.collection(`organizations/${orgId}/users`).doc(targetUserId).get();
    const currentData = userDoc.data();
    const currentVersion = currentData.claimsVersion || 1;

    // 3. Increment claims version
    const newVersion = currentVersion + 1;

    // 4. Update Firestore (source of truth)
    const updates: any = {
      claimsVersion: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: request.auth.uid
    };

    if (newRole) updates.role = newRole;
    if (newPermissions) updates.permissions = newPermissions;

    await db.collection(`organizations/${orgId}/users`).doc(targetUserId).update(updates);

    // 5. Update custom claims
    const customClaims = {
      org: currentData.organizationId,
      r: newRole || currentData.role?.id || currentData.role,
      v: newVersion,
      iat: Date.now()
    };

    await auth.setCustomUserClaims(targetUserId, customClaims);

    // 6. Optional: Revoke old tokens immediately (extra security)
    if (revokeTokens) {
      await auth.revokeRefreshTokens(targetUserId);
      logger.info(`Revoked all tokens for ${targetUserId} for immediate effect`);
    }

    logger.info(`Updated permissions for ${targetUserId}, version ${currentVersion} → ${newVersion}`);

    return {
      success: true,
      newVersion,
      message: 'Permissions updated successfully'
    };
  }
);
```

**Usage from Frontend**:
```typescript
// When Business Owner changes a user's role
const result = await functions.httpsCallable('updateUserPermissions')({
  targetUserId: 'user123',
  newRole: 'hr-manager',
  revokeTokens: true // Force immediate logout
});
```

---

## 🚧 Phase 5: Backend Authorization Middleware (PENDING)

### Create Defense-in-Depth Middleware

**File**: `functions/src/middleware/authorizationMiddleware.ts` (NEW FILE)

```typescript
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface AuthContext {
  uid: string;
  organizationId: string;
  role: string;
  claimsVersion: number;
}

export class AuthorizationMiddleware {
  /**
   * Validate user has specific permission (checks Firestore, not just JWT)
   * Defense-in-depth: Don't trust JWT claims alone
   */
  static async validatePermission(
    request: CallableRequest,
    requiredPermission: string
  ): Promise<AuthContext> {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, token } = request.auth;
    const claims = token as any;

    // Quick check: JWT organization
    if (!claims.org) {
      throw new HttpsError('permission-denied', 'No organization in token');
    }

    // ALWAYS check Firestore for current permissions (source of truth)
    const db = getFirestore();
    const userDoc = await db
      .collection(`organizations/${claims.org}/users`)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();

    // Check if user is active
    if (!userData.isActive) {
      throw new HttpsError('permission-denied', 'Account is inactive');
    }

    // Check if token is stale
    if (claims.v && userData.claimsVersion && claims.v !== userData.claimsVersion) {
      logger.warn(`Stale token detected: v${claims.v} vs v${userData.claimsVersion}`);
      throw new HttpsError('failed-precondition', 'Token is stale, please refresh');
    }

    // Check specific permission
    const hasPermission = userData.permissions?.some(
      (p: any) => p.resource === requiredPermission.split(':')[0] &&
                  p.actions.includes(requiredPermission.split(':')[1])
    );

    if (!hasPermission) {
      logger.error(`Permission denied: ${uid} lacks ${requiredPermission}`);
      throw new HttpsError('permission-denied', `Missing permission: ${requiredPermission}`);
    }

    return {
      uid,
      organizationId: claims.org,
      role: userData.role?.id || userData.role,
      claimsVersion: userData.claimsVersion
    };
  }
}
```

**Usage in Cloud Functions**:
```typescript
export const createWarning = onCall(async (request) => {
  // Validate permission (checks Firestore, not just JWT)
  const authContext = await AuthorizationMiddleware.validatePermission(
    request,
    'warnings:create'
  );

  // authContext is guaranteed to have valid user with permission
  logger.info(`User ${authContext.uid} creating warning in org ${authContext.organizationId}`);

  // Proceed with warning creation...
});
```

---

## 📊 Implementation Status

| Phase | Component | Status | Priority |
|-------|-----------|--------|----------|
| 1 | Type System | ✅ Complete | Critical |
| 1 | createOrganizationUser | ✅ Complete | Critical |
| 2 | createOrganizationAdmin | 🚧 Pending | High |
| 2 | createOrganizationUsers | 🚧 Pending | High |
| 2 | createResellerUser | 🚧 Pending | Medium |
| 2 | refreshUserClaims | 🚧 Pending | Critical |
| 3 | AuthContext Analysis | 🚧 Pending | Critical |
| 3 | AuthContext Update | 🚧 Pending | Critical |
| 4 | Permission Update Utility | 🚧 Pending | High |
| 5 | Authorization Middleware | 🚧 Pending | Medium |
| 6 | Testing & Documentation | 🚧 Pending | High |

---

## 🧪 Testing Checklist (When Complete)

### Scenario 1: New User Creation
- [ ] Create new user via createOrganizationUser
- [ ] Verify Firestore document has claimsVersion: 1
- [ ] Verify JWT token has minimal claims (org, r, v, iat)
- [ ] Verify user can login immediately
- [ ] Verify AuthContext loads user data correctly

### Scenario 2: Permission Change
- [ ] Change user's role via updateUserPermissions
- [ ] Verify claimsVersion incremented in Firestore
- [ ] Verify JWT version incremented
- [ ] Verify AuthContext detects staleness
- [ ] Verify auto-refresh works

### Scenario 3: Stale Token Handling
- [ ] Manually set different version in Firestore
- [ ] Login with old token
- [ ] Verify AuthContext detects mismatch
- [ ] Verify auto-refresh triggered
- [ ] Verify eventual consistency

### Scenario 4: Error Handling
- [ ] Simulate Firestore failure during user creation
- [ ] Verify Auth user is rolled back
- [ ] Simulate claims failure
- [ ] Verify graceful degradation

### Scenario 5: Backend Authorization
- [ ] Call function with valid permission
- [ ] Verify success
- [ ] Call function without permission
- [ ] Verify permission-denied error
- [ ] Call with stale token
- [ ] Verify failed-precondition error

---

## 🎯 Next Steps

1. **Read AuthContext.tsx** to understand current implementation
2. **Complete Phase 2** backend function updates
3. **Update AuthContext** with staleness detection
4. **Create utilities** for permission updates
5. **Test end-to-end** all scenarios
6. **Deploy and monitor** for issues

---

*Document Status: Living document - will be updated as implementation progresses*
*Last Updated: 2025-10-23 - Phase 1 Complete*
