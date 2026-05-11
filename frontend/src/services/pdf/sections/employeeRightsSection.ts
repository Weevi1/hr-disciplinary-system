// frontend/src/services/pdf/sections/employeeRightsSection.ts
//
// Employee Rights section renderer — REQUIRES sectionConfig with subsections;
// no hardcoded fallback. Renders LRA-style rights-and-next-steps inside a
// light-blue box with a darker-blue border. Extracted from
// PDFGenerationService in Phase 2 Tier 3B step 5f.

import type { PDFSectionConfig } from '../../../types/core';
import type { WarningPDFData } from '../../PDFGenerationService';
import Logger from '../../../utils/logger';
import { checkPageOverflow, replacePlaceholders, wrapText } from '../utils';

/**
 * Employee Rights and Next Steps Section (v1.2.0+ template-driven).
 *
 * Two-pass renderer: first pass calculates total content height so the
 * background box can be sized to fit, second pass renders the text on top.
 * Supports both paragraph (string) and bullet (string[]) subsection content
 * with `{{placeholder}}` replacement.
 */
export function addEmployeeRightsSection(
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
  if (!sectionConfig?.content?.subsections || sectionConfig.content.subsections.length === 0) {
    Logger.warn('⚠️ No subsections in Employee Rights config, skipping');
    return startY;
  }

  // Ensure section fits on page (need about 110mm for full section)
  startY = checkPageOverflow(doc, startY, 110, pageHeight, bottomMargin);

  // 📋 SECTION HEADER - Use custom heading from config
  const sectionHeading = sectionConfig.content.heading || 'EMPLOYEE RIGHTS AND NEXT STEPS';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text(sectionHeading, margin, startY);

  const sectionWidth = pageWidth - margin * 2;
  const contentMargin = margin + 8; // Indent for content inside box
  const boxStartY = startY + 4; // Where the box starts
  let currentY = startY + 14; // Top padding inside box

  Logger.debug('📝 Rendering Employee Rights with custom content from sectionConfig');

  // 🎯 STEP 1: Calculate content height by simulating rendering
  const contentStartY = currentY;
  sectionConfig.content.subsections.forEach((subsection, index) => {
    // Subsection Title height
    currentY += 0; // Title is at currentY
    currentY += 7; // Spacing after subsection title

    // Subsection Content
    if (Array.isArray(subsection.content)) {
      // BULLET POINTS
      subsection.content.forEach((item: string) => {
        const processedItem = replacePlaceholders(item, data);
        const itemLines = wrapText(doc, processedItem, sectionWidth - 20);
        currentY += itemLines.length * 5; // Line spacing
        currentY += 2.5; // Spacing between bullet points
      });
    } else {
      // PARAGRAPH
      const processedContent = replacePlaceholders(subsection.content, data);
      const contentLines = wrapText(doc, processedContent, sectionWidth - 20);
      currentY += contentLines.length * 5;
    }

    // Spacing after subsection (except last one)
    if (index < sectionConfig.content.subsections!.length - 1) {
      currentY += 3.5;
    }
  });

  currentY += 8; // Bottom padding inside box

  // 🎨 STEP 2: Draw background box with calculated height
  const sectionHeight = currentY - boxStartY;
  doc.setFillColor(239, 246, 255); // Light blue #EFF6FF
  doc.setDrawColor(59, 130, 246); // Blue border #3B82F6
  doc.setLineWidth(0.5);
  doc.rect(margin, boxStartY, sectionWidth, sectionHeight, 'FD'); // Fill and Draw

  // 🖊️ STEP 3: Render actual content on top of the box
  currentY = contentStartY; // Reset to content start position
  sectionConfig.content.subsections.forEach((subsection, index) => {
    // Subsection Title - PRESERVED v1.1.0 STYLING
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Darker blue for subsection headers
    doc.text(subsection.title, contentMargin, currentY);

    // Reset to body text styling
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    currentY += 7; // Spacing after subsection title

    // Subsection Content - Support both string and string[] (bullet points)
    if (Array.isArray(subsection.content)) {
      // BULLET POINTS: Render each item as a bullet
      subsection.content.forEach((item: string) => {
        const processedItem = replacePlaceholders(item, data);

        // Wrap text and render
        const itemLines = wrapText(doc, processedItem, sectionWidth - 20);
        itemLines.forEach((line: string) => {
          doc.text(line, contentMargin, currentY);
          currentY += 5; // Line spacing
        });
        currentY += 2.5; // Spacing between bullet points
      });
    } else {
      // PARAGRAPH: Render as single paragraph
      const processedContent = replacePlaceholders(subsection.content, data);

      const contentLines = wrapText(doc, processedContent, sectionWidth - 20);
      contentLines.forEach((line: string) => {
        doc.text(line, contentMargin, currentY);
        currentY += 5;
      });
    }

    // Spacing after subsection (except last one)
    if (index < sectionConfig.content.subsections!.length - 1) {
      currentY += 3.5;
    }
  });

  currentY += 8; // Bottom padding inside box
  return currentY + 5; // Return with small spacing after section
}
