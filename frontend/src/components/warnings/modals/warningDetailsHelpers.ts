// frontend/src/components/warnings/modals/warningDetailsHelpers.ts
//
// Pure helpers + theme system for WarningDetailsModal. Extracted in Phase 2
// Tier 3D step 2. Zero behaviour change — pure relocation.

export interface WarningTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface ActionState {
  type: 'approve' | 'reject' | null;
  loading: boolean;
  reason?: string;
}

/** Coerce any value to a display string. Returns `fallback` for null/undefined or non-primitive types. */
export const safeText = (value: any, fallback: string = 'Not specified'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return fallback;
};

/** Render any date-ish value as an en-ZA short date (e.g. "11 May 2026"). */
export const safeDate = (date: any, fallback: string = 'Not set'): string => {
  if (!date) return fallback;
  try {
    let dateObj: Date;

    // Handle Firestore timestamp format
    if (date.seconds !== undefined) {
      dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return dateObj.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
};

/** Combine a date and a HH:mm time string into "11 May 2026 at 14:30". */
export const safeDateTime = (date: any, time?: string): string => {
  const dateStr = safeDate(date, '');
  if (!dateStr || dateStr === 'Not set') return 'Not specified';
  if (!time) return dateStr;
  return `${dateStr} at ${time}`;
};

/** Convert any date format to ISO date string (YYYY-MM-DD) for `<input type="date">`. */
export const toISODateString = (date: any): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    let dateObj: Date;

    if (date.seconds !== undefined) {
      dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return new Date().toISOString().split('T')[0];
    }

    if (isNaN(dateObj.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    return dateObj.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/** Theme tokens (Tailwind class names) by warning level. Defaults to `verbal` for unknown levels. */
export const getWarningTheme = (level: string, _status: string): WarningTheme => {
  const levelThemes = {
    verbal: {
      primary: 'bg-blue-600',
      secondary: 'bg-blue-50',
      accent: 'text-blue-600',
      background: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    written: {
      primary: 'bg-yellow-600',
      secondary: 'bg-yellow-50',
      accent: 'text-yellow-600',
      background: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-amber-200',
    },
    final: {
      primary: 'bg-red-600',
      secondary: 'bg-red-50',
      accent: 'text-red-600',
      background: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200',
    },
    dismissal: {
      primary: 'bg-red-700',
      secondary: 'bg-red-50',
      accent: 'text-red-700',
      background: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-300',
    },
  };

  return levelThemes[level as keyof typeof levelThemes] || levelThemes.verbal;
};
