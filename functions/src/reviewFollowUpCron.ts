// functions/src/reviewFollowUpCron.ts
// 🔄 REVIEW FOLLOW-UP CRON JOB
// ✅ Daily scheduled function to check due reviews across all organizations
// ✅ Auto-satisfies overdue reviews (7+ days) and sends notifications to HR managers

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { ReviewFollowUpService } from './services/ReviewFollowUpService';

const db = getFirestore();

// ============================================
// SCHEDULED FUNCTION (DAILY CRON)
// ============================================

/**
 * 🕐 Daily Review Follow-Up Check
 * Runs every day at 8:00 AM South African Time (Africa/Johannesburg)
 *
 * Process:
 * 1. Fetches all active organizations
 * 2. For each organization:
 *    - Checks warnings with upcoming/overdue review dates
 *    - Updates review statuses (pending → due_soon → overdue → auto_satisfied)
 *    - Sends notifications to HR managers
 * 3. Logs success/failure statistics
 *
 * Auto-Satisfaction Logic:
 * - Reviews 7+ days overdue → automatically marked as satisfactory
 * - Reviews 1-6 days overdue → marked as overdue (HR gets notification)
 * - Reviews due within 3 days → marked as due_soon (HR gets notification)
 */
export const checkDueReviewsDaily = onSchedule(
  {
    schedule: '0 8 * * *', // Run at 8 AM daily
    timeZone: 'Africa/Johannesburg', // South African timezone
    region: 'us-central1', // Primary server region
    memory: '256MiB',
    timeoutSeconds: 540 // 9 minutes max (allows for large org processing)
  },
  async (event) => {
    const startTime = Date.now();
    logger.info('🕐 Starting daily review follow-up check');

    try {
      // Fetch all organizations
      const orgSnapshot = await db.collection('organizations').get();

      if (orgSnapshot.empty) {
        logger.info('No organizations found - nothing to process');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const results: any[] = [];

      // Process each organization
      for (const orgDoc of orgSnapshot.docs) {
        const orgId = orgDoc.id;
        const orgData = orgDoc.data();
        const orgName = orgData.name || 'Unknown Organization';

        try {
          logger.info(`Processing reviews for organization: ${orgName} (${orgId})`);

          const result = await ReviewFollowUpService.checkDueReviews(orgId);

          successCount++;
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            success: true,
            ...result
          });

          logger.info(`✅ Processed reviews for ${orgName}:`, result);

        } catch (error: any) {
          errorCount++;
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            success: false,
            error: error.message
          });

          logger.error(`❌ Failed to process reviews for ${orgName} (${orgId}):`, error);
        }
      }

      const duration = Date.now() - startTime;
      const summary = {
        totalOrganizations: orgSnapshot.size,
        successCount,
        errorCount,
        processingTime: `${(duration / 1000).toFixed(2)}s`,
        results
      };

      logger.info('✅ Review check complete:', summary);

      // Scheduled functions should not return values
      // Log the summary instead

    } catch (error: any) {
      logger.error('❌ Critical error in review check cron:', error);
      throw error;
    }
  }
);

// ============================================
// MANUAL TEST FUNCTION (CALLABLE)
// ============================================

/**
 * 🧪 Test Review Follow-Up (Manual Trigger)
 * Callable function for testing review follow-up logic
 *
 * Usage:
 * ```typescript
 * const testReviewFollowUp = httpsCallable(functions, 'testReviewFollowUp');
 * const result = await testReviewFollowUp({ organizationId: 'org_123' });
 * ```
 *
 * Auth: Requires authenticated user (preferably HR/Executive Management)
 *
 * @param data - { organizationId: string } - The organization to test
 * @returns Review check results with counts
 */
export const testReviewFollowUp = onCall(
  {
    region: 'us-central1',
    memory: '256MiB'
  },
  async (request) => {
    const { auth, data } = request;

    // Require authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be authenticated to test review follow-up'
      );
    }

    // Validate organizationId
    const organizationId = data.organizationId;
    if (!organizationId || typeof organizationId !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'organizationId is required and must be a string'
      );
    }

    try {
      logger.info(`🧪 Manual review follow-up test triggered by ${auth.uid} for org: ${organizationId}`);

      // Verify organization exists
      const orgDoc = await db.collection('organizations').doc(organizationId).get();
      if (!orgDoc.exists) {
        throw new HttpsError(
          'not-found',
          `Organization ${organizationId} not found`
        );
      }

      // Optional: Verify user has permission for this organization
      // (You can add role checks here if needed)

      const startTime = Date.now();
      const result = await ReviewFollowUpService.checkDueReviews(organizationId);
      const duration = Date.now() - startTime;

      logger.info(`✅ Manual test complete for ${organizationId}:`, result);

      return {
        success: true,
        organizationId,
        organizationName: orgDoc.data()?.name || 'Unknown',
        processingTime: `${(duration / 1000).toFixed(2)}s`,
        ...result
      };

    } catch (error: any) {
      logger.error(`❌ Manual test failed for ${organizationId}:`, error);

      // Re-throw HttpsErrors as-is
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap other errors
      throw new HttpsError(
        'internal',
        `Failed to test review follow-up: ${error.message}`
      );
    }
  }
);

// ============================================
// ADMIN FUNCTION: CHECK ALL ORGANIZATIONS
// ============================================

/**
 * 🔧 Manual Trigger for All Organizations
 * Callable function to manually trigger review check for ALL organizations
 *
 * Auth: Should be restricted to super-users only
 *
 * @returns Results for all organizations
 */
export const manualReviewCheckAll = onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540
  },
  async (request) => {
    const { auth } = request;

    // Require authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'Must be authenticated to trigger manual review check'
      );
    }

    // Verify super-user role
    const userDoc = await db.collection('users').doc(auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'User record not found'
      );
    }

    const userData = userDoc.data();
    const userRole = userData?.role?.id || userData?.role;

    if (userRole !== 'super-user') {
      throw new HttpsError(
        'permission-denied',
        `Manual review check is restricted to super-users only. Current role: ${userRole}`
      );
    }

    logger.info(`🔧 Manual review check (all orgs) triggered by super-user: ${auth.uid}`);

    try {
      const startTime = Date.now();
      const orgSnapshot = await db.collection('organizations').get();

      let successCount = 0;
      let errorCount = 0;
      const results: any[] = [];

      for (const orgDoc of orgSnapshot.docs) {
        const orgId = orgDoc.id;
        const orgName = orgDoc.data().name || 'Unknown';

        try {
          const result = await ReviewFollowUpService.checkDueReviews(orgId);
          successCount++;
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            success: true,
            ...result
          });
        } catch (error: any) {
          errorCount++;
          results.push({
            organizationId: orgId,
            organizationName: orgName,
            success: false,
            error: error.message
          });
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        totalOrganizations: orgSnapshot.size,
        successCount,
        errorCount,
        processingTime: `${(duration / 1000).toFixed(2)}s`,
        results
      };

    } catch (error: any) {
      logger.error('❌ Manual review check failed:', error);
      throw new HttpsError(
        'internal',
        `Manual review check failed: ${error.message}`
      );
    }
  }
);
