// frontend/src/services/warning/ReviewTracker.ts
//
// Review-tracking surface extracted from WarningService.ts in Phase 2 Tier 3A.
// Operates on `organizations/{orgId}/warnings/{id}` documents — pure CRUD on
// review-status fields, no internal coupling to other WarningService methods.
//
// WarningService.ts proxies the public methods through for backward
// compatibility with the 60+ external importers.

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import Logger from '../../utils/logger';
import type { Warning } from './types';

export class ReviewTracker {
  /**
   * 🔄 Get warnings that need review (HR action required).
   * Returns warnings with review dates that are due, overdue, or in progress.
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

      return snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          issueDate: data.issueDate?.toDate() || new Date(),
          expiryDate: data.expiryDate?.toDate() || new Date(),
          incidentDate: data.incidentDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewDate: data.reviewDate?.toDate() || undefined,
          reviewCompletedDate: data.reviewCompletedDate?.toDate() || undefined,
          autoSatisfiedDate: data.autoSatisfiedDate?.toDate() || undefined,
          reviewLastChecked: data.reviewLastChecked?.toDate() || undefined,
        } as Warning;
      });
    } catch (error) {
      Logger.error('❌ [REVIEW] Error getting warnings needing review:', error);
      throw error;
    }
  }

  /**
   * 🔄 Update review status. Updates review tracking fields for a warning.
   */
  static async updateReviewStatus(
    warningId: string,
    organizationId: string,
    statusData: {
      reviewStatus?: string;
      reviewCompletedDate?: Date;
      reviewCompletedBy?: string;
      reviewCompletedByName?: string;
      reviewHODFeedback?: string;
      reviewHRNotes?: string;
      reviewOutcome?: string;
      reviewNextSteps?: string;
      autoSatisfiedDate?: Date;
      escalatedToWarningId?: string;
      reviewLastChecked?: Date;
    }
  ): Promise<void> {
    try {
      const warningRef = doc(db, `organizations/${organizationId}/warnings`, warningId);

      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      // Convert dates to Timestamps; pass-through for primitives
      if (statusData.reviewStatus) {
        updateData.reviewStatus = statusData.reviewStatus;
      }
      if (statusData.reviewCompletedDate) {
        updateData.reviewCompletedDate = Timestamp.fromDate(statusData.reviewCompletedDate);
      }
      if (statusData.reviewCompletedBy) {
        updateData.reviewCompletedBy = statusData.reviewCompletedBy;
      }
      if (statusData.reviewCompletedByName) {
        updateData.reviewCompletedByName = statusData.reviewCompletedByName;
      }
      if (statusData.reviewHODFeedback !== undefined) {
        updateData.reviewHODFeedback = statusData.reviewHODFeedback;
      }
      if (statusData.reviewHRNotes !== undefined) {
        updateData.reviewHRNotes = statusData.reviewHRNotes;
      }
      if (statusData.reviewOutcome) {
        updateData.reviewOutcome = statusData.reviewOutcome;
      }
      if (statusData.reviewNextSteps !== undefined) {
        updateData.reviewNextSteps = statusData.reviewNextSteps;
      }
      if (statusData.autoSatisfiedDate) {
        updateData.autoSatisfiedDate = Timestamp.fromDate(statusData.autoSatisfiedDate);
      }
      if (statusData.escalatedToWarningId) {
        updateData.escalatedToWarningId = statusData.escalatedToWarningId;
      }
      if (statusData.reviewLastChecked) {
        updateData.reviewLastChecked = Timestamp.fromDate(statusData.reviewLastChecked);
      }

      await updateDoc(warningRef, updateData);

      Logger.info('✅ [REVIEW] Review status updated', { warningId, statusData });
    } catch (error) {
      Logger.error('❌ [REVIEW] Error updating review status:', error);
      throw error;
    }
  }

  /**
   * ✅ Mark review as satisfactory.
   * Quick method for HR to complete a review positively.
   */
  static async markReviewSatisfactory(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    hrNotes?: string
  ): Promise<void> {
    try {
      await this.updateReviewStatus(warningId, organizationId, {
        reviewStatus: 'completed_satisfactory',
        reviewCompletedDate: new Date(),
        reviewCompletedBy: hrUserId,
        reviewCompletedByName: hrUserName,
        reviewHRNotes: hrNotes || '',
        reviewOutcome: 'satisfactory',
        reviewLastChecked: new Date(),
      });

      Logger.info('✅ [REVIEW] Review marked satisfactory', { warningId });
    } catch (error) {
      Logger.error('❌ [REVIEW] Error marking review satisfactory:', error);
      throw error;
    }
  }

  /**
   * ⚠️ Mark review as unsatisfactory. Requires feedback and next steps.
   */
  static async markReviewUnsatisfactory(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    feedback: string,
    nextSteps: string
  ): Promise<void> {
    try {
      await this.updateReviewStatus(warningId, organizationId, {
        reviewStatus: 'completed_unsatisfactory',
        reviewCompletedDate: new Date(),
        reviewCompletedBy: hrUserId,
        reviewCompletedByName: hrUserName,
        reviewHRNotes: feedback,
        reviewOutcome: 'unsatisfactory',
        reviewNextSteps: nextSteps,
        reviewLastChecked: new Date(),
      });

      Logger.info('⚠️ [REVIEW] Review marked unsatisfactory', { warningId });
    } catch (error) {
      Logger.error('❌ [REVIEW] Error marking review unsatisfactory:', error);
      throw error;
    }
  }

  /**
   * 📊 Get review statistics for dashboard.
   * Returns counts of warnings by review status.
   */
  static async getReviewStatistics(organizationId: string): Promise<{
    pending: number;
    dueSoon: number;
    overdue: number;
    inProgress: number;
    completedSatisfactory: number;
    completedUnsatisfactory: number;
    autoSatisfied: number;
    escalated: number;
  }> {
    try {
      const warningsRef = collection(db, `organizations/${organizationId}/warnings`);
      const q = query(warningsRef, where('reviewDate', '!=', null));

      const snapshot = await getDocs(q);

      const stats = {
        pending: 0,
        dueSoon: 0,
        overdue: 0,
        inProgress: 0,
        completedSatisfactory: 0,
        completedUnsatisfactory: 0,
        autoSatisfied: 0,
        escalated: 0,
      };

      snapshot.docs.forEach(d => {
        const data = d.data();
        const status = data.reviewStatus || 'pending';

        switch (status) {
          case 'pending':
            stats.pending++;
            break;
          case 'due_soon':
            stats.dueSoon++;
            break;
          case 'overdue':
            stats.overdue++;
            break;
          case 'in_progress':
            stats.inProgress++;
            break;
          case 'completed_satisfactory':
            stats.completedSatisfactory++;
            break;
          case 'completed_unsatisfactory':
            stats.completedUnsatisfactory++;
            break;
          case 'auto_satisfied':
            stats.autoSatisfied++;
            break;
          case 'escalated':
            stats.escalated++;
            break;
        }
      });

      Logger.info('📊 [REVIEW] Review statistics calculated', { organizationId, stats });
      return stats;
    } catch (error) {
      Logger.error('❌ [REVIEW] Error getting review statistics:', error);
      throw error;
    }
  }
}
