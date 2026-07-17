// frontend/src/utils/phone.ts
// Shared South African phone-number helpers.
//
// `formatPhoneNumber` was originally defined inline in
// hooks/employees/useEmployeeImport.ts and is now centralised here so the
// warning wizard's WhatsApp delivery can reuse the exact same normalisation.

/**
 * Normalise a South African phone number to international E.164-style format.
 * Handles multiple input formats:
 * - 0825254011  (local with leading 0)              → +27825254011
 * - 825254011   (leading zero stripped by Excel)    → +27825254011
 * - 27825254011 (country code without +)            → +27825254011
 * - +27825254011 (already formatted)                → +27825254011
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // If it starts with 0, replace with +27
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1);
  }
  // If it starts with 27 (but not +27), add the +
  else if (cleaned.startsWith('27') && !cleaned.startsWith('+27')) {
    cleaned = '+' + cleaned;
  }
  // If it doesn't start with + or 27, assume it's local and add +27
  // This handles the Excel/Google Sheets edge case where leading zeros are
  // stripped (825254011 → +27825254011)
  else if (!cleaned.startsWith('+') && !cleaned.startsWith('27')) {
    cleaned = '+27' + cleaned;
  }

  return cleaned;
};

/**
 * Produce a digits-only number suitable for a wa.me / WhatsApp click-to-chat
 * URL (no +, no spaces), e.g. "+27 82 555 1234" → "27825551234".
 */
export const toWhatsAppNumber = (phone: string): string => {
  return formatPhoneNumber(phone).replace(/[^\d]/g, '');
};

/**
 * Loose validity check for a normalised international number (10–15 digits).
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return /^\+\d{10,15}$/.test(formatPhoneNumber(phone));
};
