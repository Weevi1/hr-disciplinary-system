// functions/src/middleware/authorizationMiddleware.ts
// Defense-in-depth authorization middleware
// ALWAYS checks Firestore for current permissions (don't trust JWT claims alone)

import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

export interface AuthContext {
  uid: string;
  organizationId: string;
  role: string;
  claimsVersion: number;
  userData: any;
}

export class AuthorizationMiddleware {
  /**
   * Validate user has specific permission (checks Firestore, not just JWT)
   * Defense-in-depth: Don't trust JWT claims alone
   *
   * @param request - Firebase callable request
   * @param requiredPermission - Permission in format 'resource:action' (e.g., 'warnings:create')
   * @returns AuthContext with validated user data
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

    // Quick check: JWT organization (fast, offline)
    const orgFromClaims = claims.org || claims.organizationId;
    if (!orgFromClaims) {
      logger.error(`No organization in token for user ${uid}`);
      throw new HttpsError('permission-denied', 'No organization in token');
    }

    // ALWAYS check Firestore for current permissions (source of truth)
    const db = getFirestore();
    let userDoc;

    try {
      userDoc = await db
        .collection(`organizations/${orgFromClaims}/users`)
        .doc(uid)
        .get();
    } catch (error) {
      logger.error(`Failed to fetch user document for ${uid}:`, error);
      throw new HttpsError('internal', 'Failed to load user profile');
    }

    if (!userDoc.exists) {
      logger.error(`User document not found: ${uid} in org ${orgFromClaims}`);
      throw new HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();

    // Check if user is active (critical security check)
    if (!userData?.isActive) {
      logger.warn(`Inactive user attempted action: ${uid}`);
      throw new HttpsError('permission-denied', 'Account is inactive');
    }

    // STALENESS DETECTION: Check if token is out of sync with Firestore
    const tokenVersion = claims.v || 0;
    const firestoreVersion = userData.claimsVersion || 1;

    if (tokenVersion < firestoreVersion) {
      logger.warn(
        `Stale token detected for ${uid}: v${tokenVersion} vs v${firestoreVersion}`
      );
      throw new HttpsError(
        'failed-precondition',
        `Token is stale (v${tokenVersion} vs v${firestoreVersion}). Please refresh your session.`
      );
    }

    // Parse required permission
    const [resource, action] = requiredPermission.split(':');

    if (!resource || !action) {
      throw new HttpsError('invalid-argument', 'Invalid permission format. Use "resource:action"');
    }

    // Check specific permission in Firestore data
    const hasPermission = userData.permissions?.some(
      (p: any) => p.resource === resource && p.actions.includes(action)
    );

    if (!hasPermission) {
      logger.warn(
        `Permission denied: ${uid} lacks ${requiredPermission} (role: ${userData.role?.id || userData.role})`
      );
      throw new HttpsError('permission-denied', `Missing permission: ${requiredPermission}`);
    }

    // All checks passed - return validated auth context
    logger.debug(`✅ Permission validated: ${uid} has ${requiredPermission}`);

    return {
      uid,
      organizationId: orgFromClaims,
      role: userData.role?.id || userData.role,
      claimsVersion: firestoreVersion,
      userData
    };
  }

  /**
   * Validate user has one of multiple roles
   *
   * @param request - Firebase callable request
   * @param allowedRoles - Array of allowed role IDs
   * @returns AuthContext with validated user data
   */
  static async validateRole(
    request: CallableRequest,
    allowedRoles: string[]
  ): Promise<AuthContext> {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, token } = request.auth;
    const claims = token as any;

    const orgFromClaims = claims.org || claims.organizationId;
    if (!orgFromClaims) {
      throw new HttpsError('permission-denied', 'No organization in token');
    }

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db
      .collection(`organizations/${orgFromClaims}/users`)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();

    // Check if user is active
    if (!userData?.isActive) {
      throw new HttpsError('permission-denied', 'Account is inactive');
    }

    // Check role
    const userRole = userData.role?.id || userData.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Role check failed: ${userRole} not in [${allowedRoles.join(', ')}]`);
      throw new HttpsError(
        'permission-denied',
        `Insufficient role. Required: ${allowedRoles.join(' or ')}`
      );
    }

    logger.debug(`✅ Role validated: ${uid} is ${userRole}`);

    return {
      uid,
      organizationId: orgFromClaims,
      role: userRole,
      claimsVersion: userData.claimsVersion || 1,
      userData
    };
  }

  /**
   * Validate user belongs to organization
   * Lightweight check - doesn't validate permissions
   *
   * @param request - Firebase callable request
   * @param organizationId - Organization ID to check
   * @returns AuthContext with basic user data
   */
  static async validateOrganizationMember(
    request: CallableRequest,
    organizationId: string
  ): Promise<AuthContext> {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid, token } = request.auth;
    const claims = token as any;

    // Quick check: JWT organization matches
    const orgFromClaims = claims.org || claims.organizationId;
    if (orgFromClaims !== organizationId && orgFromClaims !== 'SYSTEM') {
      logger.warn(`Org mismatch: ${orgFromClaims} vs ${organizationId}`);
      throw new HttpsError('permission-denied', 'Organization mismatch');
    }

    // Get user data from Firestore
    const db = getFirestore();
    const userDoc = await db
      .collection(`organizations/${organizationId}/users`)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found in organization');
    }

    const userData = userDoc.data();

    // Check if user is active
    if (!userData?.isActive) {
      throw new HttpsError('permission-denied', 'Account is inactive');
    }

    return {
      uid,
      organizationId,
      role: userData.role?.id || userData.role,
      claimsVersion: userData.claimsVersion || 1,
      userData
    };
  }
}
