import Logger from '../../utils/logger';
// frontend/src/hooks/dashboard/useHRReportsData.ts
// 🔧 FIXED: Prevents infinite loops and Firebase errors
// ✅ Stable dependencies and proper cleanup

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useMultiRolePermissions } from '../useMultiRolePermissions';
import { onSnapshot, query, where, collection, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🎯 TYPES
interface HRReportsCount {
  absenceReports: {
    unread: number;
    total: number;
  };
  hrMeetings: {
    unread: number;
    total: number;
  };
  correctiveCounselling: {
    unread: number;
    total: number;
  };
}

interface HRReportsData {
  hrReportsCount: HRReportsCount;
  hrCountsLoading: boolean;
  hrCountsError: string | null;
  refreshHRCounts: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useHRReportsData = (): HRReportsData => {
  const { user } = useAuth();
  const { canManageHR } = useMultiRolePermissions();
  
  // 🎯 STATE MANAGEMENT
  const [hrReportsCount, setHrReportsCount] = useState<HRReportsCount>({
    absenceReports: { unread: 0, total: 0 },
    hrMeetings: { unread: 0, total: 0 },
    correctiveCounselling: { unread: 0, total: 0 }
  });
  const [hrCountsLoading, setHrCountsLoading] = useState(true);
  const [hrCountsError, setHrCountsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 🎯 REFS FOR CLEANUP & PREVENTING LOOPS
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const isMountedRef = useRef(true);
  const hasInitialized = useRef(false);

  // 🔄 MANUAL REFRESH FUNCTION
  const refreshHRCounts = useCallback(async () => {
    if (!user?.organizationId || !canManageHR()) return;
    
    Logger.debug('🔄 Manual refresh of HR counts triggered')
    setHrCountsError(null);
    setLastUpdated(new Date());
  }, [user?.organizationId, canManageHR]);

  // 🎯 MAIN EFFECT - STABLE DEPENDENCIES ONLY
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return;
    
    isMountedRef.current = true;
    
    if (!canManageHR() || !user?.organizationId) {
      setHrCountsLoading(false);
      hasInitialized.current = true;
      return;
    }

    Logger.debug('🚀 Initializing real-time HR data listeners')
    setHrCountsLoading(true);
    setHrCountsError(null);

    // Clear any existing listeners
    unsubscribeRefs.current.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        Logger.warn('⚠️ Error unsubscribing:', error)
      }
    });
    unsubscribeRefs.current = [];

    try {
      // 📋 ABSENCE REPORTS LISTENER (SHARDED)
      Logger.debug('🔔 Setting up absence reports listener')
      const absenceQuery = query(
        collection(db, `organizations/${user.organizationId}/reports`),
        orderBy('absenceDate', 'desc')
      );

      const absenceUnsubscribe = onSnapshot(
        absenceQuery,
        (snapshot) => {
          if (!isMountedRef.current) return;

          const reports = snapshot.docs
            .filter(doc => doc.id !== '_metadata') // Exclude metadata documents
            .map(doc => ({ id: doc.id, ...doc.data() }));
          const unreadCount = reports.filter(report => !report.hrReviewed).length;

          setHrReportsCount(prev => ({
            ...prev,
            absenceReports: {
              unread: unreadCount,
              total: reports.length
            }
          }));

          setLastUpdated(new Date());
          Logger.debug(`🔔 Absence reports updated: ${unreadCount} unread of ${reports.length} total`)
        },
        (error) => {
          Logger.error('❌ Absence reports listener error:', error)
          if (isMountedRef.current) {
            setHrCountsError('Failed to load absence reports');
          }
        }
      );

      unsubscribeRefs.current.push(absenceUnsubscribe);

      // 💬 HR MEETINGS LISTENER (SHARDED)
      Logger.debug('🔔 Setting up HR meetings listener')
      const meetingsQuery = query(
        collection(db, `organizations/${user.organizationId}/meetings`),
        orderBy('createdAt', 'desc')
      );

      const meetingsUnsubscribe = onSnapshot(
        meetingsQuery,
        (snapshot) => {
          if (!isMountedRef.current) return;

          const meetings = snapshot.docs
            .filter(doc => doc.id !== '_metadata') // Exclude metadata documents
            .map(doc => ({ id: doc.id, ...doc.data() }));
          const pendingCount = meetings.filter(meeting => meeting.status === 'pending').length;

          setHrReportsCount(prev => ({
            ...prev,
            hrMeetings: {
              unread: pendingCount,
              total: meetings.length
            }
          }));

          setLastUpdated(new Date());
          Logger.debug(`🔔 HR meetings updated: ${pendingCount} pending of ${meetings.length} total`)
        },
        (error) => {
          Logger.error('❌ HR meetings listener error:', error)
          if (isMountedRef.current) {
            setHrCountsError('Failed to load HR meetings');
          }
        }
      );

      unsubscribeRefs.current.push(meetingsUnsubscribe);

      // 📋 CORRECTIVE COUNSELLING LISTENER (SHARDED)
      Logger.debug('🔔 Setting up corrective counselling listener')
      const counsellingQuery = query(
        collection(db, `organizations/${user.organizationId}/corrective_counselling`),
        orderBy('dateCreated', 'desc')
      );

      const counsellingUnsubscribe = onSnapshot(
        counsellingQuery,
        (snapshot) => {
          if (!isMountedRef.current) return;

          const records = snapshot.docs
            .filter(doc => doc.id !== '_metadata') // Exclude metadata documents
            .map(doc => ({ id: doc.id, ...doc.data() }));
          const recentCount = records.filter(record => {
            // Consider records from the last 7 days as "unread"
            const recordDate = new Date(record.dateCreated);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return recordDate > weekAgo && !record.hrReviewed;
          }).length;

          setHrReportsCount(prev => ({
            ...prev,
            correctiveCounselling: {
              unread: recentCount,
              total: records.length
            }
          }));

          setLastUpdated(new Date());
          Logger.debug(`🔔 Corrective counselling updated: ${recentCount} recent of ${records.length} total`)
        },
        (error) => {
          Logger.error('❌ Corrective counselling listener error:', error)
          if (isMountedRef.current) {
            setHrCountsError('Failed to load counselling records');
          }
        }
      );

      unsubscribeRefs.current.push(counsellingUnsubscribe);

      // Set loading to false after short delay
      setTimeout(() => {
        if (isMountedRef.current) {
          setHrCountsLoading(false);
        }
      }, 1000);

    } catch (error) {
      Logger.error('❌ Error setting up listeners:', error)
      setHrCountsError('Failed to initialize real-time data');
      setHrCountsLoading(false);
    }

    hasInitialized.current = true;

    // ⚠️ CLEANUP FUNCTION
    return () => {
      Logger.debug('🧹 Cleaning up HR data listeners')
      isMountedRef.current = false;
      
      unsubscribeRefs.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          Logger.warn('⚠️ Error during cleanup:', error)
        }
      });
      unsubscribeRefs.current = [];
      hasInitialized.current = false;
    };
  }, []); // 🔥 EMPTY DEPENDENCY ARRAY - RUNS ONCE ONLY

  // 🎯 SEPARATE EFFECT FOR ROLE/ORG CHANGES
  useEffect(() => {
    if (!canManageHR() || !user?.organizationId) {
      // Reset state when permissions change
      setHrReportsCount({
        absenceReports: { unread: 0, total: 0 },
        hrMeetings: { unread: 0, total: 0 }
      });
      setHrCountsLoading(false);
      setHrCountsError(null);
      setLastUpdated(null);
      
      // Force re-initialization on next render if needed
      hasInitialized.current = false;
    }
  }, [canManageHR(), user?.organizationId]);

  return {
    hrReportsCount,
    hrCountsLoading,
    hrCountsError,
    refreshHRCounts,
    lastUpdated
  };
};