// frontend/src/services/pdf/sections/complianceSections.ts
//
// Consequences / Legal Compliance / Additional Notes section renderers.
// Extracted from PDFGenerationService in Phase 2 Tier 3B step 5d. Bodies
// are byte-identical to the originals — internal `this.X` helper refs
// are replaced with direct imports from `../utils`.

import type { PDFSectionConfig } from '../../../types/core';
import type { WarningPDFData } from '../../PDFGenerationService';
import Logger from '../../../utils/logger';
import { checkPageOverflow, replacePlaceholders, wrapText } from '../utils';

/**
 * Consequences Section — STANDALONE RED WARNING BOX (template-driven, no
 * hardcoded fallback). Renders custom body and bulletPoints from the
 * supplied sectionConfig; `{{placeholders}}` are replaced via
 * {@link replacePlaceholders}. Heading defaults to a two-line LRA-style
 * warning text if config omits it.
 */
export function addConsequencesSection(
  doc: any,
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number,
  sectionConfig?: PDFSectionConfig
): number {
  // ⚠️ REQUIRE section config - no hardcoded fallback
  if (!sectionConfig?.content) {
    Logger.warn('⚠️ No section config provided for Consequences section, skipping');
    return startY;
  }

  // Validate content exists
  const hasContent = sectionConfig.content.body ||
                     (sectionConfig.content.bulletPoints && sectionConfig.content.bulletPoints.length > 0);

  if (!hasContent) {
    Logger.warn('⚠️ Consequences section config has no body or bulletPoints, skipping');
    return startY;
  }

  // 📋 SECTION HEADER - Use custom heading from config
  const sectionHeading = sectionConfig.content.heading || 'WARNING: CONSEQUENCES IF EMPLOYEE\nDOES NOT CHANGE BEHAVIOUR';

  // 🔥 CALCULATE REQUIRED HEIGHT DYNAMICALLY based on actual content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let totalLines = 0;

  // Count lines in body
  if (sectionConfig.content.body) {
    const processedBody = replacePlaceholders(sectionConfig.content.body, data);
    const bodyLines = wrapText(doc, processedBody, pageWidth - (margin * 2) - 15);
    totalLines += bodyLines.length;
  }

  // Count lines in bullet points
  if (sectionConfig.content.bulletPoints && sectionConfig.content.bulletPoints.length > 0) {
    sectionConfig.content.bulletPoints.forEach((bullet: string) => {
      const processedBullet = replacePlaceholders(bullet, data);
      const bulletLines = wrapText(doc, processedBullet, pageWidth - (margin * 2) - 15);
      totalLines += bulletLines.length;
    });
  }

  // Calculate box height: 8mm top padding + (lines * 5mm spacing) + 8mm bottom padding
  const sectionHeight = 8 + (totalLines * 5) + 8;
  const headerHeight = sectionHeading.split('\n').length * 5;
  const requiredHeight = headerHeight + sectionHeight + 15;

  // Check if we have enough space
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Render header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);

  // Handle multi-line headings (split on \n)
  const headingLines = sectionHeading.split('\n');
  headingLines.forEach((line, index) => {
    doc.text(line, margin, startY + (index * 5));
  });

  // 🎨 RED WARNING BOX - DYNAMIC HEIGHT
  doc.setFillColor(254, 226, 226); // Light red #FEE2E2
  doc.setDrawColor(239, 68, 68); // Red border #EF4444
  doc.setLineWidth(0.5);
  doc.rect(margin, startY + headerHeight + 3, pageWidth - (margin * 2), sectionHeight, 'FD');

  // Warning text styling
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29); // Dark red text for readability

  let textY = startY + headerHeight + 11; // Top padding inside box

  Logger.debug('📝 Rendering Consequences with custom content from sectionConfig');

  // Render body paragraph if provided
  if (sectionConfig.content.body) {
    const processedBody = replacePlaceholders(sectionConfig.content.body, data);
    const bodyLines = wrapText(doc, processedBody, pageWidth - (margin * 2) - 15);
    bodyLines.forEach(line => {
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        textY += 3; // Half spacing for empty lines
      } else {
        doc.text(line, margin + 5, textY);
        textY += 5;
      }
    });
  }

  // Render bullet points if provided
  if (sectionConfig.content.bulletPoints && sectionConfig.content.bulletPoints.length > 0) {
    sectionConfig.content.bulletPoints.forEach((bullet: string) => {
      const processedBullet = replacePlaceholders(bullet, data);
      const bulletLines = wrapText(doc, processedBullet, pageWidth - (margin * 2) - 15);
      bulletLines.forEach(line => {
        // Skip empty lines but preserve spacing
        if (line.trim() === '') {
          textY += 3; // Half spacing for empty lines
        } else {
          doc.text(line, margin + 5, textY);
          textY += 5;
        }
      });
    });
  }

  return startY + headerHeight + sectionHeight + 15;
}

/**
 * Legal Compliance Section — framework label, compliance status, and a
 * bullet list of legal requirements. Returns early if no legalCompliance
 * data is supplied.
 */
export function addLegalComplianceSection(
  doc: any,
  legalCompliance: WarningPDFData['legalCompliance'],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  if (!legalCompliance) return startY;

  // Check if we have enough space (need about 30mm)
  startY = checkPageOverflow(doc, startY, 30, pageHeight, bottomMargin);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('LEGAL COMPLIANCE', margin, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let legalY = startY + 8;

  doc.text(`Framework: ${legalCompliance.framework}`, margin, legalY);
  legalY += 5;

  doc.text(`Compliance Status: ${legalCompliance.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`, margin, legalY);
  legalY += 5;

  if (legalCompliance.requirements.length > 0) {
    doc.text('Legal Requirements:', margin, legalY);
    legalY += 4;

    legalCompliance.requirements.forEach(req => {
      doc.text(`• ${req}`, margin + 3, legalY);
      legalY += 4;
    });
  }

  return legalY + 5;
}

/**
 * Additional Notes Section — free-form notes paragraph with word wrap.
 */
export function addAdditionalNotesSection(
  doc: any,
  notes: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate height based on text length
  const notesLines = wrapText(doc, notes, pageWidth - margin * 2);
  const requiredHeight = 15 + (notesLines.length * 4);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('ADDITIONAL NOTES', margin, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let notesY = startY + 8;
  notesLines.forEach(line => {
    doc.text(line, margin, notesY);
    notesY += 4;
  });

  return notesY + 5;
}
