// frontend/src/services/pdf/utils.ts
//
// Pure utility functions shared by the PDF generator family. Extracted in
// Phase 2 Tier 3B (steps 1 + 2, lowest-risk first moves). PDFGenerationService.ts
// keeps private delegates so existing `this.X` call sites (many inside frozen
// v1.0.0/v1.1.0 methods) don't need to change.

import Logger from '../../utils/logger';
import { getLevelLabel } from '../UniversalCategories';

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

/**
 * Parse a #RRGGBB hex color into {r,g,b}. No # / non-hex returns black.
 */
export function hexToRGB(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Parse a color string (currently only #RRGGBB hex) to RGB. Returns null on
 * missing input or unsupported format. Use this when a default fallback is
 * desired at the call site; use {@link hexToRGB} when input is known-good.
 */
export function parseColor(colorString?: string): { r: number; g: number; b: number } | null {
  if (!colorString) return null;

  if (colorString.startsWith('#')) {
    const hex = colorString.substring(1);
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }

  return null;
}

/**
 * Display label for a warning level (e.g. 'first_written' → 'First Written Warning').
 * Delegates to the central UniversalCategories label table.
 */
export function getWarningLevelDisplay(level: string): string {
  return getLevelLabel(level);
}

/**
 * Document-title form of a warning level (uppercase headings used in the PDF
 * title block). Falls back to 'WARNING NOTICE' for unknown levels.
 */
export function getWarningLevelTitle(level: string): string {
  const titleMap: Record<string, string> = {
    counselling: 'COUNSELLING SESSION RECORD',
    verbal: 'VERBAL WARNING NOTICE',
    first_written: 'WRITTEN WARNING',
    second_written: 'SECOND WRITTEN WARNING',
    final_written: 'FINAL WRITTEN WARNING',
    dismissal: 'CONTACT HR - SERIOUS OFFENCE',
  };

  return titleMap[level] || 'WARNING NOTICE';
}

/**
 * Wrap text to fit within `maxWidth` (in jsPDF units), preserving paragraph
 * breaks and bullet structure. Empty input lines are kept for spacing.
 *
 * `doc` must be a jsPDF instance whose font/size has already been set —
 * `doc.getTextWidth` is used for measurement and depends on current font state.
 */
export function wrapText(doc: any, text: string, maxWidth: number): string[] {
  const allLines: string[] = [];

  // Split on newlines first to preserve paragraph/bullet structure
  const paragraphs = text.split('\n');

  paragraphs.forEach((paragraph) => {
    const trimmedParagraph = paragraph.trim();

    // Empty line - preserve it for spacing
    if (!trimmedParagraph) {
      allLines.push('');
      return;
    }

    const words = trimmedParagraph.split(' ');
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          allLines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      allLines.push(currentLine);
    }
  });

  return allLines;
}

/**
 * Check whether `requiredHeight` units fit on the current page below `currentY`.
 * If not, add a new page and return the top margin (20 by convention used
 * throughout this codebase). Otherwise return `currentY` unchanged.
 */
export function checkPageOverflow(
  doc: any,
  currentY: number,
  requiredHeight: number,
  pageHeight: number,
  bottomMargin: number
): number {
  const maxY = pageHeight - bottomMargin;

  if (currentY + requiredHeight > maxY) {
    Logger.debug(29714);
    doc.addPage();
    return 20; // Top margin on new page
  }

  return currentY;
}
