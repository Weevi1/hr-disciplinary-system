// frontend/src/utils/saLocale.ts
// South African localization utilities

export const SA_LOCALE = 'en-ZA';
export const SA_TIMEZONE = 'Africa/Johannesburg';
export const SA_CURRENCY = 'ZAR';

/**
 * Format currency for South African market
 * @param amountInCents - Amount in cents (e.g., 29900 for R299.00)
 * @returns Formatted currency string (e.g., "R299.00")
 */
export const formatSACurrency = (amountInCents: number): string => {
  return `R${(amountInCents / 100).toLocaleString(SA_LOCALE, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format date for South African locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatSADate = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString(SA_LOCALE, options);
};

/**
 * Format time for South African locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export const formatSATime = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString(SA_LOCALE, options);
};

/**
 * Format datetime for South African locale with timezone
 * @param date - Date to format
 * @param timezone - Timezone (defaults to South Africa)
 * @returns Formatted datetime string
 */
export const formatSADateTime = (
  date: Date | string,
  timezone: string = SA_TIMEZONE
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString(SA_LOCALE, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get current South African time
 * @returns Current date in South African timezone
 */
export const getCurrentSATime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SA_TIMEZONE }));
};

/**
 * Common date format options for South African context
 */
export const SA_DATE_FORMATS = {
  short: { year: 'numeric', month: 'short', day: 'numeric' } as const,
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const,
  compact: { weekday: 'long', month: 'short', day: 'numeric' } as const,
  timeOnly: { hour: '2-digit', minute: '2-digit', hour12: true } as const,
  dateTime: { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  } as const,
} satisfies Record<string, Intl.DateTimeFormatOptions>;

/**
 * Default organization settings for South African companies
 */
export const DEFAULT_SA_ORG_SETTINGS = {
  timezone: SA_TIMEZONE,
  currency: SA_CURRENCY,
  locale: SA_LOCALE,
  dateFormat: 'DD/MM/YYYY', // Common SA date format
  language: 'en'
} as const;