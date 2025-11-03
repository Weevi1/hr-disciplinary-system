// frontend/src/services/ClaimsValidationService.ts
// Background claims validation service (non-blocking)
// Validates user claims without blocking the login flow

import Logger from '../utils/logger';
import type { User as FirebaseUser } from 'firebase/auth';

export class ClaimsValidationService {
  private static validationQueue = new Set<string>();

  /**
   * Validate claims in background (non-blocking)
   * Logs issues but doesn't block user flow
   * This is called during login but doesn't await completion
   */
  static async validateInBackground(firebaseUser: FirebaseUser): Promise<void> {
    const uid = firebaseUser.uid;

    // Prevent duplicate validations
    if (this.validationQueue.has(uid)) {
      Logger.debug(`⏭️ [CLAIMS] Validation already in progress for user ${uid}`);
      return;
    }

    this.validationQueue.add(uid);

    try {
      const idTokenResult = await firebaseUser.getIdTokenResult();
      const claims = idTokenResult.claims as any;

      const hasClaims = claims.r || claims.role;
      const claimsVersion = claims.v || 0;

      // Log issues but don't block
      if (!hasClaims) {
        Logger.warn('⚠️ [CLAIMS] Missing claims detected, will auto-refresh on next login');
        Logger.warn('⚠️ [CLAIMS] User can still proceed - Firestore is source of truth');
        // Schedule refresh for next session
        this.scheduleRefresh(uid);
      } else {
        Logger.success(`✅ [CLAIMS] Valid claims found for user ${uid} (version ${claimsVersion})`);
      }

      // Note: Staleness check would require Firestore query
      // Skipped to avoid blocking - Firestore Security Rules are primary enforcement

    } catch (error) {
      Logger.error('❌ [CLAIMS] Background validation failed:', error);
      // Don't throw - this is non-blocking validation
    } finally {
      this.validationQueue.delete(uid);
    }
  }

  /**
   * Schedule claims refresh for next login
   * Stores flag in localStorage to trigger refresh on next auth
   */
  private static scheduleRefresh(uid: string): void {
    try {
      localStorage.setItem(`claims_refresh_${uid}`, Date.now().toString());
      Logger.debug(`📅 [CLAIMS] Scheduled refresh for user ${uid}`);
    } catch (error) {
      Logger.warn('⚠️ [CLAIMS] Failed to schedule refresh:', error);
    }
  }

  /**
   * Check if claims should be refreshed on this login
   * Called at start of auth flow to handle scheduled refreshes
   */
  static shouldRefresh(uid: string): boolean {
    try {
      const scheduled = localStorage.getItem(`claims_refresh_${uid}`);
      if (scheduled) {
        const scheduledTime = parseInt(scheduled, 10);
        const ageMs = Date.now() - scheduledTime;

        // Only refresh if scheduled within last 7 days
        if (ageMs < 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(`claims_refresh_${uid}`);
          Logger.info(`🔄 [CLAIMS] Executing scheduled refresh for user ${uid}`);
          return true;
        } else {
          // Scheduled refresh expired, remove it
          localStorage.removeItem(`claims_refresh_${uid}`);
        }
      }
    } catch (error) {
      Logger.warn('⚠️ [CLAIMS] Failed to check refresh schedule:', error);
    }
    return false;
  }

  /**
   * Force refresh claims for a user (call manually if needed)
   * This is async but can be called without awaiting
   */
  static async forceRefresh(firebaseUser: FirebaseUser): Promise<void> {
    try {
      Logger.info(`🔄 [CLAIMS] Force refreshing token for user ${firebaseUser.uid}`);
      await firebaseUser.getIdToken(true); // Force token refresh
      Logger.success(`✅ [CLAIMS] Token refreshed successfully`);
    } catch (error) {
      Logger.error('❌ [CLAIMS] Force refresh failed:', error);
      throw error;
    }
  }
}
