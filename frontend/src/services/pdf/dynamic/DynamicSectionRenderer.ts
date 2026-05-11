// frontend/src/services/pdf/dynamic/DynamicSectionRenderer.ts
//
// v1.2.0+ dynamic section renderer. Reads a PDFSectionConfig and renders
// heading + body + bulletPoints + tableData according to its `styling`
// overrides. Used by the v1.2.0 dispatcher's template path. Extracted
// from PDFGenerationService in Phase 2 Tier 3B step 5f.

import type { WarningPDFData } from '../../PDFGenerationService';
import { PDFPlaceholderService } from '../../PDFPlaceholderService';
import { checkPageOverflow, hexToRGB, wrapText } from '../utils';

/**
 * Render a `PDFSectionConfig` dynamically with placeholder replacement.
 * This is the v1.2.0+ template path's core renderer. Honours per-section
 * styling overrides (font sizes, colours, indent, spacing) falling back to
 * `defaultSettings.styling.*`. Skips disabled sections.
 */
export function renderDynamicSection(
  doc: any,
  section: any, // PDFSectionConfig type
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number,
  defaultSettings: any
): number {
  // Skip disabled sections
  if (!section.enabled) {
    return startY;
  }

  // Estimate section height (rough calculation)
  const estimatedHeight = 30 + (section.content.bulletPoints?.length || 0) * 7;
  startY = checkPageOverflow(doc, startY, estimatedHeight, pageHeight, bottomMargin);

  // === SECTION HEADING ===
  const headingFontSize = section.styling?.headingFontSize || defaultSettings.styling.fontSize + 1 || 12;
  const headingColor = section.styling?.headingColor || defaultSettings.styling.sectionHeaderColor || '#333333';

  doc.setFontSize(headingFontSize);
  doc.setFont('helvetica', 'bold');

  // Parse hex color to RGB
  const headingRGB = hexToRGB(headingColor);
  doc.setTextColor(headingRGB.r, headingRGB.g, headingRGB.b);

  // Replace placeholders in heading
  const heading = PDFPlaceholderService.replacePlaceholders(section.content.heading, data);
  doc.text(heading, margin, startY);

  let currentY = startY + (section.styling?.spacingBefore || 8);

  // === SECTION BODY TEXT ===
  if (section.content.body) {
    const bodyFontSize = section.styling?.bodyFontSize || defaultSettings.styling.fontSize || 11;
    const bodyColor = section.styling?.bodyColor || defaultSettings.styling.bodyTextColor || '#000000';

    doc.setFontSize(bodyFontSize);
    doc.setFont('helvetica', 'normal');

    const bodyRGB = hexToRGB(bodyColor);
    doc.setTextColor(bodyRGB.r, bodyRGB.g, bodyRGB.b);

    // Replace placeholders in body
    const body = PDFPlaceholderService.replacePlaceholders(section.content.body, data);

    // Wrap text to fit page width
    const sectionWidth = pageWidth - margin * 2 - (section.styling?.indent || 0);
    const bodyLines = wrapText(doc, body, sectionWidth);

    bodyLines.forEach((line: string) => {
      // Check for page overflow on each line
      currentY = checkPageOverflow(doc, currentY, 6, pageHeight, bottomMargin);
      doc.text(line, margin + (section.styling?.indent || 0), currentY);
      currentY += 5;
    });

    currentY += 3; // Extra spacing after body
  }

  // === BULLET POINTS ===
  if (section.content.bulletPoints && section.content.bulletPoints.length > 0) {
    const bodyFontSize = section.styling?.bodyFontSize || defaultSettings.styling.fontSize || 11;
    doc.setFontSize(bodyFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const bulletPoints = PDFPlaceholderService.replacePlaceholdersInArray(
      section.content.bulletPoints,
      data
    );

    bulletPoints.forEach((point: string) => {
      // Check for page overflow
      currentY = checkPageOverflow(doc, currentY, 10, pageHeight, bottomMargin);

      // Wrap bullet point text
      const bulletText = `• ${point}`;
      const sectionWidth = pageWidth - margin * 2 - (section.styling?.indent || 0) - 5;
      const lines = wrapText(doc, bulletText, sectionWidth);

      lines.forEach((line: string, index: number) => {
        currentY = checkPageOverflow(doc, currentY, 5, pageHeight, bottomMargin);
        const indent = index === 0 ? 0 : 5; // Indent continuation lines
        doc.text(line, margin + (section.styling?.indent || 0) + indent, currentY);
        currentY += 5;
      });

      currentY += 1; // Small gap between bullets
    });

    currentY += 2; // Extra spacing after bullets
  }

  // === TABLE DATA ===
  if (section.content.tableData) {
    currentY = renderTableSection(
      doc,
      section.content.tableData,
      data,
      currentY,
      pageWidth,
      margin,
      pageHeight,
      bottomMargin,
      section.styling
    );
  }

  // Add spacing after section
  currentY += (section.styling?.spacingAfter || 5);

  return currentY;
}

/**
 * Render a table — header row with underline + body rows. Cell text supports
 * `{{placeholder}}` replacement. Equal column widths derived from the table
 * header count.
 */
export function renderTableSection(
  doc: any,
  tableData: { headers: string[]; rows: string[][] },
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number,
  _styling: any
): number {
  let currentY = startY;
  const colWidth = (pageWidth - margin * 2) / tableData.headers.length;

  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  tableData.headers.forEach((header, index) => {
    const x = margin + (index * colWidth);
    doc.text(header, x, currentY);
  });

  currentY += 6;

  // Draw header line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // Table rows
  doc.setFont('helvetica', 'normal');

  tableData.rows.forEach(row => {
    currentY = checkPageOverflow(doc, currentY, 8, pageHeight, bottomMargin);

    row.forEach((cell, index) => {
      const x = margin + (index * colWidth);
      // Replace placeholders in cell content
      const cellText = PDFPlaceholderService.replacePlaceholders(cell, data);
      doc.text(cellText, x, currentY);
    });

    currentY += 6;
  });

  return currentY + 3;
}
