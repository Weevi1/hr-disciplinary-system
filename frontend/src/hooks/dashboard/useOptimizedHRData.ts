// frontend/src/hooks/dashboard/useOptimizedHRData.ts
// 🚀 OPTIMIZED HR DATA HOOK with Real-time Integration
// ✅ Replaces the original useHRReportsData with advanced features

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useMultiRolePermissions } from '../useMultiRolePermissions';
import { useRealtimeHRReports, useRealtimeHRMeetings } from '../../services/RealtimeService';
import { useNotifications } from '../../services/RealtimeService';

interface OptimizedHRData {
  absenceReports: {
    unread: number;
    total: number;
    recent: any[];
  };
  hrMeetings: {
    unread: number;
    total: number;
    recent: any[];
  };
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export const useOptimizedHRData = (): OptimizedHRData => {
  const { user } = useAuth();
  const { canManageHR } = useMultiRolePermissions();
  const { addNotification } = useNotifications();

  // 🔥 Real-time subscriptions
  const {
    data: absenceReportsData,
    loading: absenceLoading,
    error: absenceError,
    lastUpdated: absenceLastUpdated,
    refresh: refreshAbsence
  } = useRealtimeHRReports(user?.organizationId || '');

  const {
    data: hrMeetingsData,
    loading: meetingsLoading,
    error: meetingsError,
    lastUpdated: meetingsLastUpdated,
    refresh: refreshMeetings
  } = useRealtimeHRMeetings(user?.organizationId || '');

  // 🎯 Previous counts for change detection
  const [prevCounts, setPrevCounts] = useState({ absence: 0, meetings: 0 });

  // 📊 Computed values
  const hrData = useMemo(() => {
    if (!canManageHR() || !user?.organizationId) {
      return {
        absenceReports: { unread: 0, total: 0, recent: [] },
        hrMeetings: { unread: 0, total: 0, recent: [] }
      };
    }

    const absenceUnread = absenceReportsData.filter(report => !report.hrReviewed).length;
    const meetingsUnread = hrMeetingsData.filter(meeting => meeting.status === 'pending').length;

    return {
      absenceReports: {
        unread: absenceUnread,
        total: absenceReportsData.length,
        recent: absenceReportsData.slice(0, 5)
      },
      hrMeetings: {
        unread: meetingsUnread,
        total: hrMeetingsData.length,
        recent: hrMeetingsData.slice(0, 5)
      }
    };
  }, [absenceReportsData, hrMeetingsData, canManageHR, user?.organizationId]);

  // 🔔 Change notifications
  useEffect(() => {
    const currentAbsence = hrData.absenceReports.unread;
    const currentMeetings = hrData.hrMeetings.unread;

    // Notify on new absence reports
    if (prevCounts.absence < currentAbsence) {
      const newCount = currentAbsence - prevCounts.absence;
      addNotification(
        'info',
        'New Absence Reports',
        `${newCount} new absence report${newCount > 1 ? 's' : ''} require${newCount === 1 ? 's' : ''} review`
      );
    }

    // Notify on new HR meetings
    if (prevCounts.meetings < currentMeetings) {
      const newCount = currentMeetings - prevCounts.meetings;
      addNotification(
        'info',
        'New HR Meeting Requests',
        `${newCount} new meeting request${newCount > 1 ? 's' : ''} pending approval`
      );
    }

    setPrevCounts({
      absence: currentAbsence,
      meetings: currentMeetings
    });
  }, [hrData.absenceReports.unread, hrData.hrMeetings.unread, addNotification, prevCounts]);

  // 🔄 Refresh function
  const refresh = useCallback(() => {
    refreshAbsence();
    refreshMeetings();
  }, [refreshAbsence, refreshMeetings]);

  // 📊 Loading and error states
  const loading = absenceLoading || meetingsLoading;
  const error = absenceError?.message || meetingsError?.message || null;
  const lastUpdated = [absenceLastUpdated, meetingsLastUpdated]
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null;

  return {
    ...hrData,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

// 🎯 EXPORT STATEMENT FOR EASY INTEGRATION
// This hook can replace the original useHRReportsData in the existing components
export { useOptimizedHRData as useHRReportsData };