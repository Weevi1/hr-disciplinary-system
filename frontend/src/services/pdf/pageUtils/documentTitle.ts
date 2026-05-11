// frontend/src/services/pdf/pageUtils/documentTitle.ts
//
// Document title block — large centred warning-level title, optional
// validity-period subtitle, optional [DRAFT] indicator, underline,
// Document ID + issue date, and optional "Issued in terms of" code-of-conduct
// reference. Extracted from PDFGenerationService in Phase 2 Tier 3B step 6.

import type { WarningPDFData } from '../../PDFGenerationService';
import { checkPageOverflow, formatDate, getWarningLevelTitle } from '../utils';

/**
 * Render the Document Title section at the top of a warning PDF.
 * Returns the new Y position for the next section. Handles draft detection,
 * validity period display, and code-of-conduct reference (when configured on
 * the org's settings).
 */
export function addDocumentTitle(
  doc: any,
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Check if we have enough space (need about 30mm)
  startY = checkPageOverflow(doc, startY, 30, pageHeight, bottomMargin);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');

  const title = getWarningLevelTitle(data.warningLevel);
  const titleWidth = doc.getTextWidth(title);
  const titleX = (pageWidth - titleWidth) / 2;

  startY += 4; // Breathing room above title (18pt text ascends ~5mm from baseline)
  doc.text(title, titleX, startY);
  startY += 4; // Tighter gap below title to underline

  // ✨ VALIDITY PERIOD DISPLAY - Prominent display below title
  // Note: `data.expiryDate` is a runtime-added field on some warnings; cast
  // preserves the original behavior (was a pre-existing TS error before this
  // move — eliminated here by typing the lookup explicitly).
  const expiryDate = (data as any).expiryDate;
  if (data.validityPeriod && expiryDate) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100); // Gray text

    const expiryDateFormatted = formatDate(expiryDate);
    const validityText = `Valid for ${data.validityPeriod} months | Expires: ${expiryDateFormatted}`;
    const validityWidth = doc.getTextWidth(validityText);
    const validityX = (pageWidth - validityWidth) / 2;
    doc.text(validityText, validityX, startY);
    startY += 5; // Extra spacing after validity

    // Reset to black for rest of document
    doc.setTextColor(0, 0, 0);
  }

  // Check if this is a draft (missing employee or category)
  const isDraft = data.employee?.firstName === 'Employee' ||
                 data.category === 'Category Not Selected' ||
                 !data.description?.trim();

  if (isDraft) {
    doc.setFontSize(12);
    doc.setTextColor(200, 50, 50);
    const draftText = '[DRAFT - INCOMPLETE DATA]';
    const draftWidth = doc.getTextWidth(draftText);
    const draftX = (pageWidth - draftWidth) / 2;
    doc.text(draftText, draftX, startY + 1);
    startY += 6; // Extra space for draft indicator
  }

  // Underline (below everything)
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, startY + 2, pageWidth - margin, startY + 2);

  // Document ID and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const docInfo = `Document ID: ${data.warningId} | Issue Date: ${formatDate(data.issuedDate)}`;
  const infoWidth = doc.getTextWidth(docInfo);
  const infoX = (pageWidth - infoWidth) / 2;
  doc.text(docInfo, infoX, startY + 8);
  startY += 10;

  // 📋 CODE OF CONDUCT REFERENCE - If organization has one configured
  // Note: `organization.settings.codeOfConductReference` is a runtime-added
  // field; cast preserves the original behavior.
  const orgSettings = (data.organization as any)?.settings;
  if (orgSettings?.codeOfConductReference) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80); // Dark gray
    const codeRef = `Issued in terms of: ${orgSettings.codeOfConductReference}`;
    const codeRefWidth = doc.getTextWidth(codeRef);
    const codeRefX = (pageWidth - codeRefWidth) / 2;
    doc.text(codeRef, codeRefX, startY + 5);
    startY += 5;
    doc.setTextColor(0, 0, 0); // Reset to black
  }

  return startY + 10;
}
