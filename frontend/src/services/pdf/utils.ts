// frontend/src/services/pdf/utils.ts
//
// Pure utility functions shared by the PDF generator family. Extracted in
// Phase 2 Tier 3B (first move, lowest-risk). PDFGenerationService.ts keeps a
// private `formatDate` that delegates here so the 28 existing `this.formatDate`
// call sites (many inside frozen v1.0.0/v1.1.0 methods) don't need to change.

/**
 * Format date consistently for PDF rendering.
 * Handles Firestore Timestamps, Date objects, ISO strings, and numbers.
 * Output: en-ZA long form (e.g. "11 May 2026").
 */
export function formatDate(date: Date | any): string {
  let dateObj: Date;

  if (!date) {
    dateObj = new Date();
  } else if (date.seconds !== undefined) {
    // Firestore Timestamp: { seconds, nanoseconds }
    dateObj = new Date(date.seconds * 1000);
  } else if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = new Date();
  }

  return dateObj.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
