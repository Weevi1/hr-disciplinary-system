// frontend/src/hooks/useWarningsStats.ts
// 🏆 LIVE WARNINGS STATISTICS HOOK
// Follows the exact pattern from HR reports in BusinessDashboard.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API } from '@/api';
import type { Warning } from '../types';

interface WarningsStats {
  totalWarnings: number;
  activeWarnings: number;
  expiredWarnings: number;
  pendingReview: number;
  highRisk: number; // final_written, suspension, dismissal
  expiringSoon: number; // expire within 30 days
  byLevel: {
    verbal: number;
    first_written: number;
    second_written: number;
    final_written: number;
    suspension: number;
    dismissal: number;
  };
  byStatus: {
    draft: number;
    issued: number;
    acknowledged: number;
    appealed: number;
    expired: number;
  };
  recentActivity: {
    todayCount: number;
    weekCount: number;
    monthCount: number;
  };
}

interface UseWarningsStatsReturn {
  stats: WarningsStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const initialStats: WarningsStats = {
  totalWarnings: 0,
  activeWarnings: 0,
  expiredWarnings: 0,
  pendingReview: 0,
  highRisk: 0,
  expiringSoon: 0,
  byLevel: {
    verbal: 0,
    first_written: 0,
    second_written: 0,
    final_written: 0,
    suspension: 0,
    dismissal: 0
  },
  byStatus: {
    draft: 0,
    issued: 0,
    acknowledged: 0,
    appealed: 0,
    expired: 0
  },
  recentActivity: {
    todayCount: 0,
    weekCount: 0,
    monthCount: 0
  }
};

export const useWarningsStats = (): UseWarningsStatsReturn => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WarningsStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const loadWarningsStats = async () => {
  if (!user?.organizationId) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    console.log('🔔 Loading warnings stats for:', user.organizationId);

    // Load all warnings for the organization
    const warnings = await API.warnings.getAll(user.organizationId);
    
    console.log('🔔 Warnings loaded:', warnings.length);

    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calculatedStats: WarningsStats = {
      totalWarnings: warnings.length,
      activeWarnings: 0,
      expiredWarnings: 0,
      pendingReview: 0,
      highRisk: 0,
      expiringSoon: 0,
      byLevel: {
        verbal: 0,
        first_written: 0,
        second_written: 0,
        final_written: 0,
        suspension: 0,
        dismissal: 0
      },
      byStatus: {
        draft: 0,
        issued: 0,
        acknowledged: 0,
        appealed: 0,
        expired: 0
      },
      recentActivity: {
        todayCount: 0,
        weekCount: 0,
        monthCount: 0
      }
    };

    warnings.forEach(warning => {
      // 🎯 FIX: Use centralized date conversion
      const issueDate = DataService.convertDate(warning.issueDate || warning.createdAt);
      const expiryDate = warning.expiryDate ? DataService.convertDate(warning.expiryDate) : null;
      const isActive = expiryDate ? expiryDate > now : true;

      // Active vs expired
      if (isActive) {
        calculatedStats.activeWarnings++;
      } else {
        calculatedStats.expiredWarnings++;
      }

      // High risk (serious warnings)
      if (['final_written', 'suspension', 'dismissal'].includes(warning.level)) {
        calculatedStats.highRisk++;
      }

      // Expiring soon
      if (expiryDate && expiryDate <= thirtyDaysFromNow && expiryDate > now) {
        calculatedStats.expiringSoon++;
      }

      // By level
      if (warning.level in calculatedStats.byLevel) {
        calculatedStats.byLevel[warning.level as keyof typeof calculatedStats.byLevel]++;
      }

      // By status
      if (warning.status && warning.status in calculatedStats.byStatus) {
        calculatedStats.byStatus[warning.status as keyof typeof calculatedStats.byStatus]++;
      }

      // Pending review (drafts or appeals)
      if (warning.status === 'draft' || warning.appealSubmitted) {
        calculatedStats.pendingReview++;
      }

      // Recent activity
      if (issueDate >= today) {
        calculatedStats.recentActivity.todayCount++;
      }
      if (issueDate >= weekAgo) {
        calculatedStats.recentActivity.weekCount++;
      }
      if (issueDate >= monthAgo) {
        calculatedStats.recentActivity.monthCount++;
      }
    });

    setStats(calculatedStats);
    
  } catch (error) {
    console.error('Failed to load warnings stats:', error);
    setError('Failed to load warnings statistics');
  } finally {
    setLoading(false);
  }
};

  const refreshStats = async () => {
    await loadWarningsStats();
  };

  // Initial load and auto-refresh setup (following HR reports pattern)
  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout | null = null;

    if (user?.organizationId) {
      loadWarningsStats();
      
      // Set up interval for refresh every 60 seconds
      interval = setInterval(() => {
        if (isMounted) {
          loadWarningsStats();
        }
      }, 60000);
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user?.organizationId]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
};