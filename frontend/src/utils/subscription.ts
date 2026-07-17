// frontend/src/utils/subscription.ts
// Subscription/trial state helpers — single source of truth for whether an
// organization is operational. Mirrors the Firestore rules logic
// (orgOperational in config/firestore.rules): rules enforce, this drives UX.

import type { Organization } from '../types/core';

/** Parse trialEndsAt regardless of storage shape (Firestore Timestamp, ISO string, Date). */
export const getTrialEndDate = (org: Organization | null): Date | null => {
  const raw = org?.trialEndsAt as { toDate?: () => Date } | string | Date | null | undefined;
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw.toDate === 'function') return raw.toDate();
  return null;
};

export const isTrialExpired = (org: Organization | null): boolean => {
  if (org?.subscriptionStatus !== 'trial') return false;
  const ends = getTrialEndDate(org);
  return ends !== null && ends.getTime() < Date.now();
};

/** Whole days remaining on a trial (0 = expires today). Null if not an active trial. */
export const getTrialDaysLeft = (org: Organization | null): number | null => {
  if (org?.subscriptionStatus !== 'trial') return null;
  const ends = getTrialEndDate(org);
  if (!ends) return null;
  return Math.max(0, Math.ceil((ends.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
};

export type OrgAccessState = 'ok' | 'suspended' | 'trial_expired';

/**
 * Whether members of this org may use the app. Demo orgs are governed by
 * their own lifecycle (isDemo) and are always 'ok' here.
 */
export const getOrgAccessState = (org: Organization | null): OrgAccessState => {
  if (!org || org.isDemo) return 'ok';
  if (org.subscriptionStatus === 'suspended') return 'suspended';
  if (isTrialExpired(org)) return 'trial_expired';
  return 'ok';
};
