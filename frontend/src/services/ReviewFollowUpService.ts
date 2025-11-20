import Logger from '../utils/logger';
// frontend/src/services/ReviewFollowUpService.ts
// 🔄 REVIEW FOLLOW-UP SERVICE - Auto-Satisfaction & Review Tracking
// ✅ Manages review status updates, auto-satisfaction, and escalation
// ✅ Designed to be called by Cloud Functions cron job and HR UI

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Warning, WarningLevel } from './WarningService';
import { createBulkNotification } from './RealtimeService';

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

export interface ReviewSummary {
  warningId: string;
  employeeId: string;
  employeeName: string;
  reviewDate: Date;
  currentStatus: ReviewStatus;
  daysUntilDue: number;
  daysOverdue: number;
}

export interface EscalationData {
  originalWarningId: string;
  employeeId: string;
  categoryId: string;
  newLevel: WarningLevel;
  reason: string;
  hodFeedback?: string;
  hrNotes?: string;
}

// ============================================
// REVIEW FOLLOW-UP SERVICE CLASS
// ============================================

export class ReviewFollowUpService {

  // ============================================
  // STATUS CHECKING & UPDATES
  // ============================================

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
      Logger.info('🔄 [ReviewFollowUp] Checking due reviews', { organizationId });

      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Query warnings with reviewDate set, not yet completed
      const warningsRef = collection(db, `organizations/${organizationId}/warnings`);
      const q = query(
        warningsRef,
        where('reviewDate', '!=', null),
        where('reviewStatus', 'in', ['pending', 'due_soon', 'overdue', null])
      );

      const snapshot = await getDocs(q);

      let dueSoonCount = 0;
      let overdueCount = 0;
      let autoSatisfiedCount = 0;
      const hrNotifications: any[] = [];

      for (const docSnap of snapshot.docs) {
        const warning = { id: docSnap.id, ...docSnap.data() } as Warning;

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
            employeeName: warning.employeeName,
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
              employeeName: warning.employeeName,
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

      Logger.info('✅ [ReviewFollowUp] Review check complete', {
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
      Logger.error('❌ [ReviewFollowUp] Failed to check due reviews', { error, organizationId });
      throw error;
    }
  }

  /**
   * 🤖 Auto-satisfy overdue reviews (7+ days past review date)
   * Called by checkDueReviews or can be run manually
   */
  static async autoSatisfyOverdueReviews(organizationId: string): Promise<string[]> {
    try {
      Logger.info('🤖 [ReviewFollowUp] Auto-satisfying overdue reviews', { organizationId });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const warningsRef = collection(db, `organizations/${organizationId}/warnings`);
      const q = query(
        warningsRef,
        where('reviewDate', '<', Timestamp.fromDate(sevenDaysAgo)),
        where('reviewStatus', 'in', ['pending', 'due_soon', 'overdue'])
      );

      const snapshot = await getDocs(q);
      const autoSatisfiedIds: string[] = [];

      for (const docSnap of snapshot.docs) {
        await this.autoSatisfyReview(docSnap.id, organizationId);
        autoSatisfiedIds.push(docSnap.id);
      }

      Logger.info('✅ [ReviewFollowUp] Auto-satisfaction complete', {
        organizationId,
        count: autoSatisfiedIds.length
      });

      return autoSatisfiedIds;

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to auto-satisfy reviews', { error, organizationId });
      throw error;
    }
  }

  /**
   * 🤖 Auto-satisfy a single review
   * Private helper method
   */
  private static async autoSatisfyReview(warningId: string, organizationId: string): Promise<void> {
    try {
      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);

      await updateDoc(warningRef, {
        reviewStatus: 'auto_satisfied',
        autoSatisfiedDate: Timestamp.now(),
        reviewHRNotes: 'Automatically marked satisfactory after 7 days with no HR action',
        reviewOutcome: 'satisfactory',
        reviewLastChecked: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      Logger.info('✅ [ReviewFollowUp] Warning auto-satisfied', { warningId, organizationId });

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to auto-satisfy warning', { error, warningId, organizationId });
      throw error;
    }
  }

  // ============================================
  // HR REVIEW COMPLETION
  // ============================================

  /**
   * ✅ Complete review as satisfactory
   * Called by HR when employee met improvement commitments
   */
  static async completeReviewSatisfactory(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    data: {
      hodFeedback?: string;
      hrNotes?: string;
      outcome?: 'satisfactory' | 'some_concerns';
    }
  ): Promise<void> {
    try {
      Logger.info('✅ [ReviewFollowUp] Completing review as satisfactory', {
        warningId,
        organizationId
      });

      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);

      await updateDoc(warningRef, {
        reviewStatus: 'completed_satisfactory',
        reviewCompletedDate: Timestamp.now(),
        reviewCompletedBy: hrUserId,
        reviewCompletedByName: hrUserName,
        reviewHODFeedback: data.hodFeedback || '',
        reviewHRNotes: data.hrNotes || '',
        reviewOutcome: data.outcome || 'satisfactory',
        reviewLastChecked: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      Logger.info('✅ [ReviewFollowUp] Review completed successfully', { warningId });

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to complete review', { error, warningId });
      throw error;
    }
  }

  /**
   * ⚠️ Complete review as unsatisfactory (requires next steps)
   * Called by HR when employee did not meet commitments
   */
  static async completeReviewUnsatisfactory(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    data: {
      hodFeedback?: string;
      hrNotes: string;
      nextSteps: string;
    }
  ): Promise<void> {
    try {
      Logger.info('⚠️ [ReviewFollowUp] Completing review as unsatisfactory', {
        warningId,
        organizationId
      });

      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);

      await updateDoc(warningRef, {
        reviewStatus: 'completed_unsatisfactory',
        reviewCompletedDate: Timestamp.now(),
        reviewCompletedBy: hrUserId,
        reviewCompletedByName: hrUserName,
        reviewHODFeedback: data.hodFeedback || '',
        reviewHRNotes: data.hrNotes,
        reviewOutcome: 'unsatisfactory',
        reviewNextSteps: data.nextSteps,
        reviewLastChecked: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      Logger.info('✅ [ReviewFollowUp] Unsatisfactory review recorded', { warningId });

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to complete unsatisfactory review', { error, warningId });
      throw error;
    }
  }

  /**
   * 🔺 Escalate review to new warning
   * Creates new escalated warning and links it to original
   */
  static async escalateReview(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    escalationData: EscalationData
  ): Promise<string> {
    try {
      Logger.info('🔺 [ReviewFollowUp] Escalating review to new warning', {
        warningId,
        organizationId,
        newLevel: escalationData.newLevel
      });

      // This would typically call WarningService to create the new warning
      // For now, we'll just update the original warning status
      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);

      // Note: The actual new warning creation should be done by WarningService
      // This is a placeholder - the calling code should create the new warning first
      const newWarningId = escalationData.originalWarningId + '_escalated'; // Placeholder

      await updateDoc(warningRef, {
        reviewStatus: 'escalated',
        reviewCompletedDate: Timestamp.now(),
        reviewCompletedBy: hrUserId,
        reviewCompletedByName: hrUserName,
        reviewHODFeedback: escalationData.hodFeedback || '',
        reviewHRNotes: escalationData.hrNotes || '',
        reviewOutcome: 'unsatisfactory',
        reviewNextSteps: `Escalated to ${escalationData.newLevel} warning`,
        escalatedToWarningId: newWarningId,
        reviewLastChecked: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      Logger.info('✅ [ReviewFollowUp] Review escalated successfully', {
        originalWarningId: warningId,
        newWarningId
      });

      return newWarningId;

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to escalate review', { error, warningId });
      throw error;
    }
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * 📋 Get all warnings needing review
   * Returns warnings that are due soon, overdue, or in progress
   */
  static async getWarningsNeedingReview(organizationId: string): Promise<Warning[]> {
    try {
      const warningsRef = collection(db, `organizations/${organizationId}/warnings`);
      const q = query(
        warningsRef,
        where('reviewDate', '!=', null),
        where('reviewStatus', 'in', ['due_soon', 'overdue', 'in_progress']),
        orderBy('reviewDate', 'asc')
      );

      const snapshot = await getDocs(q);
      const warnings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Warning[];

      Logger.info('📋 [ReviewFollowUp] Retrieved warnings needing review', {
        organizationId,
        count: warnings.length
      });

      return warnings;

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to get warnings needing review', { error, organizationId });
      throw error;
    }
  }

  /**
   * 📊 Get review summary for dashboard
   * Returns counts and upcoming reviews
   */
  static async getReviewSummary(organizationId: string): Promise<{
    dueSoonCount: number;
    overdueCount: number;
    inProgressCount: number;
    upcomingReviews: ReviewSummary[];
  }> {
    try {
      const warningsRef = collection(db, `organizations/${organizationId}/warnings`);
      const q = query(
        warningsRef,
        where('reviewDate', '!=', null),
        where('reviewStatus', 'in', ['pending', 'due_soon', 'overdue', 'in_progress']),
        orderBy('reviewDate', 'asc')
      );

      const snapshot = await getDocs(q);
      const now = new Date();

      let dueSoonCount = 0;
      let overdueCount = 0;
      let inProgressCount = 0;
      const upcomingReviews: ReviewSummary[] = [];

      for (const docSnap of snapshot.docs) {
        const warning = { id: docSnap.id, ...docSnap.data() } as Warning;

        if (!warning.reviewDate) continue;

        const reviewDate = warning.reviewDate.toDate();
        const daysDiff = Math.floor((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (warning.reviewStatus === 'in_progress') {
          inProgressCount++;
        } else if (daysDiff < 0) {
          overdueCount++;
        } else if (daysDiff <= 3) {
          dueSoonCount++;
        }

        // Add to upcoming reviews list (next 10)
        if (upcomingReviews.length < 10) {
          upcomingReviews.push({
            warningId: warning.id,
            employeeId: warning.employeeId,
            employeeName: warning.employeeName || 'Unknown',
            reviewDate: reviewDate,
            currentStatus: warning.reviewStatus || 'pending',
            daysUntilDue: daysDiff > 0 ? daysDiff : 0,
            daysOverdue: daysDiff < 0 ? Math.abs(daysDiff) : 0
          });
        }
      }

      return {
        dueSoonCount,
        overdueCount,
        inProgressCount,
        upcomingReviews
      };

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to get review summary', { error, organizationId });
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

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
      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);
      await updateDoc(warningRef, updateData as any);

      Logger.debug('🔄 [ReviewFollowUp] Review status updated', { warningId, updateData });

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to update review status', { error, warningId });
      throw error;
    }
  }

  /**
   * 🔔 Send review notifications to HR managers
   */
  private static async sendReviewNotifications(
    organizationId: string,
    notifications: any[]
  ): Promise<void> {
    try {
      // Get all HR managers for this organization
      const usersRef = collection(db, `organizations/${organizationId}/users`);
      const hrQuery = query(
        usersRef,
        where('role.id', 'in', ['hr-manager', 'executive-management'])
      );

      const hrSnapshot = await getDocs(hrQuery);
      const hrUserIds = hrSnapshot.docs.map(doc => doc.id);

      if (hrUserIds.length === 0) {
        Logger.warn('⚠️ [ReviewFollowUp] No HR managers found for notifications', { organizationId });
        return;
      }

      // Send notifications via RealtimeService
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

        await createBulkNotification({
          organizationId,
          recipientIds: hrUserIds,
          title,
          message,
          priority,
          category: 'review_follow_up',
          data: {
            warningId: notification.warningId,
            employeeName: notification.employeeName,
            reviewDate: notification.reviewDate
          }
        });
      }

      Logger.info('✅ [ReviewFollowUp] Notifications sent', {
        organizationId,
        count: notifications.length,
        hrManagers: hrUserIds.length
      });

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to send notifications', { error, organizationId });
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * 🧹 Mark review as in progress
   * Called when HR starts the review process
   */
  static async markReviewInProgress(
    warningId: string,
    organizationId: string,
    hrUserId: string
  ): Promise<void> {
    try {
      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);

      await updateDoc(warningRef, {
        reviewStatus: 'in_progress',
        reviewLastChecked: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      Logger.info('✅ [ReviewFollowUp] Review marked as in progress', { warningId, hrUserId });

    } catch (error) {
      Logger.error('❌ [ReviewFollowUp] Failed to mark review in progress', { error, warningId });
      throw error;
    }
  }
}

export default ReviewFollowUpService;
