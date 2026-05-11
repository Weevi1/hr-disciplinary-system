// frontend/src/services/pdf/sections/disciplinaryHistorySections.ts
//
// Previous-Disciplinary-Action section renderers. The v1.0.0 variant is
// FROZEN per the legal-compliance contract in PDFGenerationService.ts —
// its format ("Offense" field) is byte-identical to the original.
// Extracted in Phase 2 Tier 3B step 5c.

import type { PDFSectionConfig } from '../../../types/core';
import type { WarningPDFData } from '../../PDFGenerationService';
import Logger from '../../../utils/logger';
import { checkPageOverflow, formatDate, getWarningLevelDisplay } from '../utils';

/**
 * Previous Disciplinary Action — numbered list of active prior warnings.
 * Supports v1.2.0 template customisation: optional sectionConfig may
 * override the section heading. List format itself is FIXED for
 * consistency across all v1.1.0+ warnings.
 *
 * Per-warning format: "N) Date: ... | Incident: ... | Level: ..."
 */
export function addPreviousDisciplinaryActionSection(
  doc: any,
  recommendation: WarningPDFData['disciplineRecommendation'],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number,
  sectionConfig?: PDFSectionConfig
): number {
  if (!recommendation) {
    Logger.warn('⚠️ No recommendation data provided to addPreviousDisciplinaryActionSection');
    return startY;
  }

  // 🔥 CRITICAL FIX: Support both field names (activeWarnings and previousWarnings)
  // Firestore may store the data as either field name depending on when the warning was created
  const warnings = recommendation.activeWarnings || (recommendation as any).previousWarnings || [];

  // 📋 PRE-CALCULATE HEIGHT - Must calculate BEFORE rendering to avoid orphaned headings
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let contentHeight = 8; // Top padding
  const boxWidth = pageWidth - (margin * 2) - 10; // Box width minus padding
  const lineHeight = 5;

  if (warnings && warnings.length > 0) {
    warnings.forEach((warning: any, index: number) => {
      const warningDate = formatDate(warning.issuedDate || warning.issueDate || new Date());
      const description = warning.description || warning.incidentDescription || 'No description available';
      const level = getWarningLevelDisplay(warning.level || warning.warningLevel || 'verbal');

      const line = `${index + 1}) Date: ${warningDate} | Incident: ${description} | Level: ${level}`;
      const wrappedLines = doc.splitTextToSize(line, boxWidth);
      contentHeight += wrappedLines.length * lineHeight + 2; // Add spacing between warnings
    });
  } else {
    contentHeight += lineHeight;
  }

  contentHeight += 4; // Bottom padding
  const warningHeight = contentHeight;
  const totalHeight = 28 + warningHeight;

  // 🔥 CHECK PAGE OVERFLOW BEFORE RENDERING HEADING - Keeps heading and content together
  startY = checkPageOverflow(doc, startY, totalHeight, pageHeight, bottomMargin);

  // 📋 SECTION HEADER - Render AFTER page overflow check
  const sectionHeading = sectionConfig?.content?.heading || 'PREVIOUS DISCIPLINARY ACTION (Still Valid on File)';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text(sectionHeading, margin, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Gray box for section - DYNAMIC HEIGHT
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.setLineWidth(0.3);
  doc.rect(margin, startY + 4, pageWidth - (margin * 2), warningHeight, 'FD');

  let listY = startY + 12;

  // Display warnings with text wrapping
  if (warnings && warnings.length > 0) {
    warnings.forEach((warning: any, index: number) => {
      const warningDate = formatDate(warning.issuedDate || warning.issueDate || new Date());
      const description = warning.description || warning.incidentDescription || 'No description available';
      const level = getWarningLevelDisplay(warning.level || warning.warningLevel || 'verbal');

      const line = `${index + 1}) Date: ${warningDate} | Incident: ${description} | Level: ${level}`;
      const wrappedLines = doc.splitTextToSize(line, boxWidth);

      wrappedLines.forEach((wrappedLine: string) => {
        doc.text(wrappedLine, margin + 5, listY);
        listY += lineHeight;
      });
      listY += 2; // Extra spacing between warnings
    });
  } else {
    // No previous warnings
    doc.text('No previous disciplinary action on file', margin + 5, listY);
  }

  return startY + warningHeight + 12;
}

/**
 * 🔒🔒🔒 VERSION 1.0.0 - Previous Disciplinary Action Section (FROZEN) 🔒🔒🔒
 *
 * ⚠️ CRITICAL: do not modify the bodies of this function. Legal-compliance
 * contract requires byte-identical regeneration for v1.0.0 warnings.
 *
 * Format: "N) Date: ... | Offense: <category> | Level: ..." — note the
 * "Offense" field shows the warning CATEGORY (not the incident description),
 * which is the differentiator from the v1.1.0+ format.
 */
export function addPreviousDisciplinaryActionSection_v1_0_0(
  doc: any,
  recommendation: WarningPDFData['disciplineRecommendation'],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  if (!recommendation) return startY;

  // Calculate height dynamically based on number of warnings
  const baseHeight = 28;
  const warningCount = recommendation.activeWarnings?.length || 0;
  const warningHeight = warningCount > 0 ? warningCount * 6 + 20 : 20;
  const totalHeight = baseHeight + warningHeight;

  startY = checkPageOverflow(doc, startY, totalHeight, pageHeight, bottomMargin);

  // Section title - REDUCED FONT SIZE for A4
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('PREVIOUS DISCIPLINARY ACTION (Still Valid on File)', margin, startY);

  // Gray box for section - INCREASED PADDING
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.setLineWidth(0.3);
  doc.rect(margin, startY + 4, pageWidth - (margin * 2), warningHeight, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let listY = startY + 12;

  // Display warnings in numbered format - INCREASED LINE SPACING
  // 🔒 v1.0.0 FORMAT: Shows "Offense" (category) instead of incident description
  if (recommendation.activeWarnings && recommendation.activeWarnings.length > 0) {
    recommendation.activeWarnings.forEach((warning: any, index: number) => {
      const warningDate = formatDate(warning.issuedDate || warning.issueDate || new Date());
      const category = warning.category || warning.categoryName || 'General Misconduct';
      const level = getWarningLevelDisplay(warning.level || warning.warningLevel || 'verbal');

      const line = `${index + 1}) Date: ${warningDate} | Offense: ${category} | Level: ${level}`;
      doc.text(line, margin + 5, listY);
      listY += 6;
    });
  } else {
    // No previous warnings
    doc.text('No previous disciplinary action on file', margin + 5, listY);
  }

  return startY + warningHeight + 12;
}
