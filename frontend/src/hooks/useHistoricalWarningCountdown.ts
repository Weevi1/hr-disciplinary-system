// frontend/src/hooks/useHistoricalWarningCountdown.ts
// 📅 60-Day Countdown Hook for Historical Warning Entry Feature
// Tracks first access and calculates remaining days

import { useState, useEffect } from 'react';
import { DatabaseShardingService } from '../services/DatabaseShardingService';
import Logger from '../utils/logger';

interface HistoricalWarningCountdown {
  daysRemaining: number | null;
  isExpired: boolean;
  isActive: boolean;
  loading: boolean;
  urgencyLevel: 'normal' | 'warning' | 'urgent' | 'expired';
  displayText: string;
}

interface FeatureAccess {
  firstAccessedAt: Date;
  expiresAt: Date;
}

const COUNTDOWN_DAYS = 60;

/**
 * Hook to manage 60-day countdown for historical warning entry feature
 *
 * @param userId - Current user ID
 * @param organizationId - Current organization ID
 * @param isWarningsTabActive - Whether warnings tab is currently active
 * @returns Countdown state and display information
 */
export const useHistoricalWarningCountdown = (
  userId: string | undefined,
  organizationId: string | undefined,
  isWarningsTabActive: boolean
): HistoricalWarningCountdown => {
  const [loading, setLoading] = useState(true);
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Initialize or load feature access data
  useEffect(() => {
    const initializeFeatureAccess = async () => {
      if (!userId || !organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load user document
        const userData = await DatabaseShardingService.getDocument(
          organizationId,
          'users',
          userId
        );

        if (!userData) {
          Logger.error('User document not found for countdown feature');
          setLoading(false);
          return;
        }
        const existingAccess = userData?.features?.historicalWarningEntry;

        if (existingAccess?.firstAccessedAt) {
          // Feature already accessed - load existing data
          const firstAccessed = existingAccess.firstAccessedAt.toDate
            ? existingAccess.firstAccessedAt.toDate()
            : new Date(existingAccess.firstAccessedAt);

          const expires = existingAccess.expiresAt.toDate
            ? existingAccess.expiresAt.toDate()
            : new Date(existingAccess.expiresAt);

          setFeatureAccess({
            firstAccessedAt: firstAccessed,
            expiresAt: expires
          });

          Logger.debug('📅 Historical warning countdown loaded', {
            firstAccessed,
            expires,
            daysRemaining: Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          });
        } else if (isWarningsTabActive) {
          // First access - record timestamp
          const now = new Date();
          const expiresAt = new Date(now.getTime() + COUNTDOWN_DAYS * 24 * 60 * 60 * 1000);

          const featureData = {
            'features.historicalWarningEntry': {
              firstAccessedAt: now,
              expiresAt: expiresAt
            }
          };

          await DatabaseShardingService.updateDocument(
            organizationId,
            'users',
            userId,
            featureData
          );

          setFeatureAccess({
            firstAccessedAt: now,
            expiresAt: expiresAt
          });

          Logger.info('📅 Historical warning countdown started', {
            userId,
            expiresAt,
            daysRemaining: COUNTDOWN_DAYS
          });
        }
      } catch (error) {
        Logger.error('Failed to initialize historical warning countdown:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeFeatureAccess();
  }, [userId, organizationId, isWarningsTabActive]);

  // Calculate days remaining in real-time
  useEffect(() => {
    if (!featureAccess) {
      setDaysRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const expiresTime = featureAccess.expiresAt.getTime();
      const msRemaining = expiresTime - now;
      const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));

      setDaysRemaining(Math.max(0, days));
    };

    // Calculate immediately
    calculateRemaining();

    // Update every hour
    const interval = setInterval(calculateRemaining, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [featureAccess]);

  // Determine urgency level and display text
  const getUrgencyData = (): { level: HistoricalWarningCountdown['urgencyLevel'], text: string } => {
    if (daysRemaining === null || !featureAccess) {
      return { level: 'normal', text: 'Capture Historical Warnings' };
    }

    if (daysRemaining === 0) {
      return { level: 'urgent', text: 'Capture Historical Warnings (Last day!)' };
    }

    if (daysRemaining === 1) {
      return { level: 'urgent', text: 'Capture Historical Warnings (1 day left!)' };
    }

    if (daysRemaining <= 7) {
      return { level: 'warning', text: `Capture Historical Warnings (${daysRemaining} days left - Hurry!)` };
    }

    if (daysRemaining <= 14) {
      return { level: 'warning', text: `Capture Historical Warnings (${daysRemaining} days left)` };
    }

    return { level: 'normal', text: `Capture Historical Warnings (${daysRemaining} days left)` };
  };

  const { level: urgencyLevel, text: displayText } = getUrgencyData();
  const isExpired = daysRemaining !== null && daysRemaining <= 0;
  const isActive = !isExpired && featureAccess !== null;

  return {
    daysRemaining,
    isExpired,
    isActive,
    loading,
    urgencyLevel,
    displayText
  };
};

export default useHistoricalWarningCountdown;