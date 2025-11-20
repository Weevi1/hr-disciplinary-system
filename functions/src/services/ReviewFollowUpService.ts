// functions/src/services/ReviewFollowUpService.ts
// 🔄 BACKEND REVIEW FOLLOW-UP SERVICE
// ✅ Firebase Admin SDK version for Cloud Functions
// ✅ Manages review status updates, auto-satisfaction, and escalation

import {
  getFirestore,
  Timestamp
} from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const db = getFirestore();

// ============================================
// TYPES & INTERFACES
// ============================================

export type ReviewStatus =
  | 'pending'
  | 'due_soon'
  | 'overdue'
  | 'in_progress'
  | 'completed_satisfactory'
  | 'completed_unsatisfactory'
  | 'auto_satisfied'
  | 'escalated';

export interface ReviewUpdateData {
  reviewStatus: ReviewStatus;
  reviewCompletedDate?: Timestamp;
  reviewCompletedBy?: string;
  reviewCompletedByName?: string;
  reviewHODFeedback?: string;
  reviewHRNotes?: string;
  reviewOutcome?: 'satisfactory' | 'some_concerns' | 'unsatisfactory';
  reviewNextSteps?: string;
  autoSatisfiedDate?: Timestamp;
  escalatedToWarningId?: string;
  reviewLastChecked?: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationData {
  type: string;
  warningId: string;
  employeeName: string;
  reviewDate: Date;
  daysOverdue?: number;
}

// ============================================
// REVIEW FOLLOW-UP SERVICE CLASS
// ============================================

export class ReviewFollowUpService {

  /**
   * 🔄 Check all due reviews and update statuses
   * Called by cron job (daily recommended)
   * Updates warnings to: due_soon, overdue, or auto_satisfied
   */
  static async checkDueReviews(organizationId: string): Promise<{
    dueSoon: number;
    overdue: number;
    autoSatisfied: number;
  }> {
    try {
      logger.info('🔄 [ReviewFollowUp] Checking due reviews', { organizationId });

      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Query warnings with reviewDate set, not yet completed
      const warningsRef = db.collection(`organizations/${organizationId}/warnings`);
      const snapshot = await warningsRef
        .where('reviewDate', '!=', null)
        .where('reviewStatus', 'in', ['pending', 'due_soon', 'overdue', null])
        .get();

      let dueSoonCount = 0;
      let overdueCount = 0;
      let autoSatisfiedCount = 0;
      const hrNotifications: NotificationData[] = [];

      for (const docSnap of snapshot.docs) {
        const warning = { id: docSnap.id, ...docSnap.data() } as any;

        if (!warning.reviewDate) continue;

        const reviewDate = warning.reviewDate.toDate();
        const daysDiff = Math.floor((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let newStatus: ReviewStatus | null = null;
        let shouldAutoSatisfy = false;

        // Determine new status
        if (daysDiff <= -7) {
          // 7+ days overdue → auto-satisfy
          shouldAutoSatisfy = true;
          autoSatisfiedCount++;
        } else if (daysDiff < 0) {
          // Overdue but within grace period
          newStatus = 'overdue';
          overdueCount++;
        } else if (daysDiff <= 3) {
          // Due within 3 days
          newStatus = 'due_soon';
          dueSoonCount++;
        } else if (!warning.reviewStatus || warning.reviewStatus === 'pending') {
          // Still pending (more than 3 days away)
          newStatus = 'pending';
        }

        // Update warning if status changed
        if (shouldAutoSatisfy) {
          await this.autoSatisfyReview(warning.id, organizationId);

          // Notify HR of auto-satisfaction
          hrNotifications.push({
            type: 'review_auto_satisfied',
            warningId: warning.id,
            employeeName: warning.employeeName || 'Unknown Employee',
            reviewDate: reviewDate
          });
        } else if (newStatus && newStatus !== warning.reviewStatus) {
          await this.updateReviewStatus(warning.id, organizationId, {
            reviewStatus: newStatus,
            reviewLastChecked: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          // Notify HR of due/overdue reviews
          if (newStatus === 'due_soon' || newStatus === 'overdue') {
            hrNotifications.push({
              type: newStatus === 'due_soon' ? 'review_due_soon' : 'review_overdue',
              warningId: warning.id,
              employeeName: warning.employeeName || 'Unknown Employee',
              reviewDate: reviewDate,
              daysOverdue: newStatus === 'overdue' ? Math.abs(daysDiff) : 0
            });
          }
        }
      }

      // Send bulk notifications to HR managers
      if (hrNotifications.length > 0) {
        await this.sendReviewNotifications(organizationId, hrNotifications);
      }

      logger.info('✅ [ReviewFollowUp] Review check complete', {
        organizationId,
        dueSoon: dueSoonCount,
        overdue: overdueCount,
        autoSatisfied: autoSatisfiedCount
      });

      return {
        dueSoon: dueSoonCount,
        overdue: overdueCount,
        autoSatisfied: autoSatisfiedCount
      };

    } catch (error) {
      logger.error('❌ [ReviewFollowUp] Failed to check due reviews', { error, organizationId });
      throw error;
    }
  }

  /**
   * 🤖 Auto-satisfy a single review
   * Private helper method
   */
  private static async autoSatisfyReview(warningId: string, organizationId: string): Promise<void> {
    try {
      const warningRef = db.doc(`organizations/${organizationId}/warnings/${warningId}`);

      await warningRef.update({
        reviewStatus: 'auto_satisfied',
        autoSatisfiedDate: Timestamp.now(),
        reviewHRNotes: 'Automatically marked satisfactory after 7 days with no HR action',
        reviewOutcome: 'satisfactory',
        reviewLastChecked: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      logger.info('✅ [ReviewFollowUp] Warning auto-satisfied', { warningId, organizationId });

    } catch (error) {
      logger.error('❌ [ReviewFollowUp] Failed to auto-satisfy warning', { error, warningId, organizationId });
      throw error;
    }
  }

  /**
   * 🔄 Update review status
   * Generic status update method
   */
  private static async updateReviewStatus(
    warningId: string,
    organizationId: string,
    updateData: Partial<ReviewUpdateData>
  ): Promise<void> {
    try {
      const warningRef = db.doc(`organizations/${organizationId}/warnings/${warningId}`);
      await warningRef.update(updateData as any);

      logger.info('🔄 [ReviewFollowUp] Review status updated', { warningId, status: updateData.reviewStatus });

    } catch (error) {
      logger.error('❌ [ReviewFollowUp] Failed to update review status', { error, warningId });
      throw error;
    }
  }

  /**
   * 🔔 Send review notifications to HR managers
   */
  private static async sendReviewNotifications(
    organizationId: string,
    notifications: NotificationData[]
  ): Promise<void> {
    try {
      // Get all HR managers for this organization
      const usersRef = db.collection(`organizations/${organizationId}/users`);
      const hrSnapshot = await usersRef
        .where('role.id', 'in', ['hr-manager', 'executive-management'])
        .get();

      const hrUserIds = hrSnapshot.docs.map(doc => doc.id);

      if (hrUserIds.length === 0) {
        logger.warn('⚠️ [ReviewFollowUp] No HR managers found for notifications', { organizationId });
        return;
      }

      // Send notifications - create notification documents
      const notificationsRef = db.collection('notifications');
      const batch = db.batch();

      for (const notification of notifications) {
        let title = '';
        let message = '';
        let priority: 'info' | 'warning' | 'error' = 'info';

        switch (notification.type) {
          case 'review_due_soon':
            title = 'Review Due Soon';
            message = `Warning review for ${notification.employeeName} is due in 3 days`;
            priority = 'info';
            break;
          case 'review_overdue':
            title = 'Review Overdue';
            message = `Warning review for ${notification.employeeName} is ${notification.daysOverdue} days overdue`;
            priority = 'warning';
            break;
          case 'review_auto_satisfied':
            title = 'Review Auto-Satisfied';
            message = `Warning for ${notification.employeeName} was automatically marked satisfactory`;
            priority = 'info';
            break;
        }

        // Create notification for each HR manager
        for (const hrUserId of hrUserIds) {
          const notificationDoc = notificationsRef.doc();
          batch.set(notificationDoc, {
            userId: hrUserId,
            organizationId,
            type: priority,
            title,
            message,
            read: false,
            timestamp: Timestamp.now(),
            category: 'review_follow_up',
            data: {
              warningId: notification.warningId,
              employeeName: notification.employeeName,
              reviewDate: Timestamp.fromDate(notification.reviewDate)
            }
          });
        }
      }

      await batch.commit();

      logger.info('✅ [ReviewFollowUp] Notifications sent', {
        organizationId,
        notificationCount: notifications.length,
        hrManagerCount: hrUserIds.length,
        totalNotifications: notifications.length * hrUserIds.length
      });

    } catch (error) {
      logger.error('❌ [ReviewFollowUp] Failed to send notifications', { error, organizationId });
      // Don't throw - notifications are non-critical
    }
  }
}

export default ReviewFollowUpService;
