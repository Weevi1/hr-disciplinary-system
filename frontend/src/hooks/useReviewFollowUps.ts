// frontend/src/hooks/useReviewFollowUps.ts
// Hook for fetching and managing corrective action review follow-ups

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../auth/AuthContext';
import type { Warning } from '../services/WarningService';
import type { Employee } from '../types/employee';

export interface WarningWithReview extends Warning {
  // Review metadata
  reviewStatus: 'pending' | 'overdue' | 'auto-satisfied' | 'completed';
  daysUntilReview?: number;
  daysSinceReview?: number;

  // Employee details
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    position: string;
    photoUrl?: string;
  };

  // Manager details
  managerName?: string;

  // Review outcome (if completed)
  reviewOutcome?: 'satisfactory' | 'some_concerns' | 'unsatisfactory';
  hodFeedback?: string;
  hrNotes?: string;
  nextSteps?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

interface UseReviewFollowUpsReturn {
  warnings: WarningWithReview[];
  dueSoon: WarningWithReview[];
  overdue: WarningWithReview[];
  completed: WarningWithReview[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateReview: (warningId: string, reviewData: {
    reviewOutcome: 'satisfactory' | 'some_concerns' | 'unsatisfactory';
    hodFeedback?: string;
    hrNotes?: string;
    nextSteps?: string;
    reviewedBy: string;
  }) => Promise<void>;
}

export const useReviewFollowUps = (): UseReviewFollowUpsReturn => {
  const { organization } = useAuth();
  const [warnings, setWarnings] = useState<WarningWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateReviewStatus = useCallback((warning: Warning): {
    status: 'pending' | 'overdue' | 'auto-satisfied' | 'completed';
    daysUntilReview?: number;
    daysSinceReview?: number;
  } => {
    // If review outcome already recorded, it's completed
    if ((warning as any).reviewOutcome) {
      return { status: 'completed' };
    }

    // If no review date, treat as pending
    if (!warning.reviewDate) {
      return { status: 'pending' };
    }

    // Convert Firestore Timestamp to Date
    const reviewDate = warning.reviewDate instanceof Timestamp
      ? warning.reviewDate.toDate()
      : new Date(warning.reviewDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);

    const diffTime = reviewDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Auto-satisfied: 7+ days past review date with no action
    if (diffDays < -7) {
      return {
        status: 'auto-satisfied',
        daysSinceReview: Math.abs(diffDays)
      };
    }

    // Overdue: past review date but within 7 days
    if (diffDays < 0) {
      return {
        status: 'overdue',
        daysSinceReview: Math.abs(diffDays)
      };
    }

    // Due soon: within 7 days
    if (diffDays <= 7) {
      return {
        status: 'pending',
        daysUntilReview: diffDays
      };
    }

    // Future review
    return {
      status: 'pending',
      daysUntilReview: diffDays
    };
  }, []);

  const fetchWarningsWithReviews = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch warnings with review dates
      const warningsRef = collection(db, `organizations/${organization.id}/warnings`);
      const q = query(
        warningsRef,
        where('reviewDate', '!=', null),
        orderBy('reviewDate', 'asc')
      );

      const snapshot = await getDocs(q);

      // Fetch all employees for lookups
      const employeesRef = collection(db, `organizations/${organization.id}/employees`);
      const employeesSnapshot = await getDocs(employeesRef);
      const employeesMap = new Map<string, Employee>();
      employeesSnapshot.forEach(doc => {
        employeesMap.set(doc.id, { id: doc.id, ...doc.data() } as Employee);
      });

      // Process warnings with review metadata
      const warningsWithReviews: WarningWithReview[] = [];

      snapshot.forEach(doc => {
        const warning = { id: doc.id, ...doc.data() } as Warning;
        const employee = employeesMap.get(warning.employeeId);
        const reviewMeta = calculateReviewStatus(warning);

        warningsWithReviews.push({
          ...warning,
          reviewStatus: reviewMeta.status,
          daysUntilReview: reviewMeta.daysUntilReview,
          daysSinceReview: reviewMeta.daysSinceReview,
          employee: employee ? {
            id: employee.id,
            firstName: employee.profile.firstName,
            lastName: employee.profile.lastName,
            employeeNumber: employee.profile.employeeNumber,
            department: employee.employment.department,
            position: employee.employment.position,
            photoUrl: (employee as any).photoUrl
          } : undefined
        });
      });

      setWarnings(warningsWithReviews);
    } catch (err) {
      console.error('Error fetching review follow-ups:', err);
      setError('Failed to load review follow-ups');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, calculateReviewStatus]);

  const updateReview = useCallback(async (
    warningId: string,
    reviewData: {
      reviewOutcome: 'satisfactory' | 'some_concerns' | 'unsatisfactory';
      hodFeedback?: string;
      hrNotes?: string;
      nextSteps?: string;
      reviewedBy: string;
    }
  ) => {
    if (!organization?.id) return;

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const warningRef = doc(db, `organizations/${organization.id}/warnings`, warningId);

      await updateDoc(warningRef, {
        ...reviewData,
        reviewedAt: Timestamp.now(),
        reviewStatus: 'completed'
      });

      // Refresh warnings list
      await fetchWarningsWithReviews();
    } catch (err) {
      console.error('Error updating review:', err);
      throw new Error('Failed to update review');
    }
  }, [organization?.id, fetchWarningsWithReviews]);

  useEffect(() => {
    fetchWarningsWithReviews();
  }, [fetchWarningsWithReviews]);

  // Filter warnings by status
  const dueSoon = warnings.filter(w =>
    w.reviewStatus === 'pending' &&
    w.daysUntilReview !== undefined &&
    w.daysUntilReview <= 7
  );

  const overdue = warnings.filter(w => w.reviewStatus === 'overdue');

  const completed = warnings.filter(w =>
    w.reviewStatus === 'completed' ||
    w.reviewStatus === 'auto-satisfied'
  );

  return {
    warnings,
    dueSoon,
    overdue,
    completed,
    loading,
    error,
    refresh: fetchWarningsWithReviews,
    updateReview
  };
};
