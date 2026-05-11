// frontend/src/components/warnings/enhanced/wizardHelpers.ts
//
// Pure helper functions for UnifiedWarningWizard. Extracted in Phase 2
// Tier 3C step 1. No behavior change — pure relocation.

/** Generate a unique id for an ActionCommitment. */
export const generateId = (): string => {
  return `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get current time in South African timezone (Africa/Johannesburg).
 * Format: HH:mm (24-hour).
 */
export const getSouthAfricanTime = (): string => {
  const now = new Date();
  const saTime = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return saTime;
};

/**
 * Get current date in South African timezone.
 * Format: YYYY-MM-DD (ISO-like, suitable for date inputs).
 */
export const getSouthAfricanDate = (): string => {
  const now = new Date();
  const saDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return saDate;
};

/** Count words in a string (split on whitespace, drop empty). */
export const getWordCount = (text: string): number =>
  text.trim().split(/\s+/).filter((w) => w).length;

/**
 * Display metadata for a warning level — label, accent color, and whether
 * the level requires action commitments (counselling through second_written)
 * vs terminal levels (final_written, dismissal) where commitments are
 * optional.
 */
export const getWarningLevelInfo = (level: string): {
  label: string;
  color: string;
  requiresCommitments: boolean;
} => {
  const levelMap: Record<string, { label: string; color: string; requiresCommitments: boolean }> = {
    counselling: { label: 'Counselling', color: '#0ea5e9', requiresCommitments: true },
    verbal: { label: 'Verbal', color: '#f59e0b', requiresCommitments: true },
    first_written: { label: 'Written', color: '#f97316', requiresCommitments: true },
    second_written: { label: 'Second Written', color: '#f97316', requiresCommitments: true },
    final_written: { label: 'Final Written', color: '#ef4444', requiresCommitments: false },
    dismissal: { label: 'Contact HR - Serious Offence', color: '#dc2626', requiresCommitments: false },
  };
  return levelMap[level] || { label: level, color: '#6b7280', requiresCommitments: true };
};
