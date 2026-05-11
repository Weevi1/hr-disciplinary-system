// frontend/src/components/warnings/reviewDashboardHelpers.ts
//
// Pure helpers for ReviewDashboard. Extracted in Phase 2 Tier 3D step 3.
// Zero behaviour change — pure relocation.

import type { Warning } from '../../types/warning';

/** Coerce any value to a display string. Prevents React Error #31 from object children. */
export const safeRenderText = (value: any, fallback: string = 'Unknown'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') {
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`;
    return fallback;
  }
  return String(value);
};

/** Convert a Firestore Timestamp / Date / ISO string to a Date. Returns `new Date()` on falsy input. */
export const convertFirestoreTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

/**
 * Check if a warning is still within its appeal period.
 * Appeal period is 30 days from issue date (not delivery date).
 */
export const isWithinAppealPeriod = (warning: Warning): boolean => {
  if (!warning.issueDate) return false;

  const issueDate = convertFirestoreTimestampToDate(warning.issueDate);

  const appealDeadline = new Date(issueDate);
  appealDeadline.setDate(appealDeadline.getDate() + 30);

  const now = new Date();
  return now <= appealDeadline;
};
