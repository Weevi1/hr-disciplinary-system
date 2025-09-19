import Logger from '../../utils/logger';
// frontend/src/hooks/counselling/useCounsellingFollowUps.ts
// 📅 COUNSELLING FOLLOW-UP HOOK
// Manages follow-up notifications and due reviews

import { useState, useEffect } from 'react';
import { CounsellingService } from '../../services/CounsellingService';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import type { CorrectiveCounselling } from '../../types/counselling';

export interface FollowUpCounts {
  overdue: number;
  dueSoon: number; // Due within 3 days
  total: number;
}

export const useCounsellingFollowUps = () => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  
  const [dueFollowUps, setDueFollowUps] = useState<CorrectiveCounselling[]>([]);
  const [counts, setCounts] = useState<FollowUpCounts>({ overdue: 0, dueSoon: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowUps = async () => {
    if (!user?.id || !organization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      Logger.debug('📅 Loading due follow-ups for manager:', user.id)
      
      const followUps = await CounsellingService.getDueFollowUps(user.id, organization.id);
      setDueFollowUps(followUps);
      
      // Calculate counts
      const now = new Date();
      let overdue = 0;
      let dueSoon = 0;
      
      followUps.forEach(session => {
        if (session.followUpDate) {
          const followUpDate = new Date(session.followUpDate);
          const daysDiff = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 0) {
            overdue++;
          } else if (daysDiff <= 3) {
            dueSoon++;
          }
        }
      });
      
      setCounts({
        overdue,
        dueSoon,
        total: followUps.length
      });
      
      console.log('✅ Follow-ups loaded:', {
        total: followUps.length,
        overdue,
        dueSoon
      });
      
    } catch (err) {
      Logger.error('❌ Error loading follow-ups:', err)
      setError('Failed to load follow-up data');
      setDueFollowUps([]);
      setCounts({ overdue: 0, dueSoon: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, [user?.id, organization?.id]);

  return {
    dueFollowUps,
    counts,
    loading,
    error,
    refresh: loadFollowUps
  };
};