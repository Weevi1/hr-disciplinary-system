// frontend/src/services/pdf/sections/baseInfoSections.ts
//
// Base information section renderers (Employee, Warning Details, Incident
// Details). Extracted from PDFGenerationService in Phase 2 Tier 3B step 5b.
// All bodies are byte-identical to the originals; internal `this.X` helper
// references are replaced with direct imports from `../utils`.

import type { WarningPDFData } from '../../PDFGenerationService';
import {
  checkPageOverflow,
  calculateIncidentSectionHeight,
  formatDate,
  getWarningLevelDisplay,
  wrapText,
} from '../utils';

/**
 * Employee Information Section - resilient to missing data. Shows a soft
 * red highlight + warning text when firstName/lastName are placeholders.
 */
export function addEmployeeSection(
  doc: any,
  employee: WarningPDFData['employee'],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Check if we have enough space (need about 40mm)
  startY = checkPageOverflow(doc, startY, 40, pageHeight, bottomMargin);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('EMPLOYEE INFORMATION', margin, startY);

  // Section box with conditional styling
  const isIncomplete = employee.firstName === 'Employee' || employee.lastName === 'Not Selected';
  if (isIncomplete) {
    doc.setDrawColor(255, 200, 200);
  } else {
    doc.setDrawColor(200, 200, 200);
  }
  doc.setLineWidth(0.3);
  doc.rect(margin, startY + 2, pageWidth - (margin * 2), 25);

  // Add warning if data is incomplete
  if (isIncomplete) {
    doc.setFillColor(255, 245, 245);
    doc.rect(margin + 1, startY + 3, pageWidth - (margin * 2) - 2, 23, 'F');
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (isIncomplete) {
    doc.setTextColor(150, 0, 0);
  } else {
    doc.setTextColor(0, 0, 0);
  }

  const info = [
    `Name: ${employee.firstName} ${employee.lastName}`,
    `Employee ID: ${employee.employeeNumber}`,
    `Position: ${employee.position}`,
    `Department: ${employee.department}`
  ];

  if (employee.email && employee.email !== '') {
    info.push(`Email: ${employee.email}`);
  }

  if (isIncomplete) {
    info.push('⚠️ Complete employee selection in wizard for full details');
  }

  let infoY = startY + 8;
  info.forEach(line => {
    doc.text(line, margin + 3, infoY);
    infoY += 4;
  });

  return startY + 35;
}

/**
 * Warning Details Section - shows level, category, and validity period.
 * Resilient to missing category — soft red highlight + 'General Misconduct'
 * fallback when category is empty/'Not Selected'.
 */
export function addWarningDetailsSection(
  doc: any,
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Check if we have enough space (need about 25mm)
  startY = checkPageOverflow(doc, startY, 25, pageHeight, bottomMargin);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('WARNING DETAILS', margin, startY);

  const isCategoryMissing = data.category === 'Category Not Selected';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (isCategoryMissing) {
    doc.setTextColor(150, 0, 0);
  } else {
    doc.setTextColor(0, 0, 0);
  }

  let detailY = startY + 8;

  doc.text(`Warning Level: ${getWarningLevelDisplay(data.warningLevel)}`, margin, detailY);
  detailY += 5;

  // Use the more reliable category field if available
  const categoryDisplay = data.category && data.category !== 'Unknown' && data.category !== 'Category Not Selected'
    ? data.category
    : 'General Misconduct';

  doc.text(`Category: ${categoryDisplay}`, margin, detailY);
  detailY += 5;

  if (data.validityPeriod) {
    doc.text(`Validity Period: ${data.validityPeriod} months`, margin, detailY);
    detailY += 5;
  }

  return detailY + 5;
}

/**
 * Incident Details Section - resilient to empty fields. Date/time + location
 * + wrapped description, all inside a bordered box. Soft red highlight when
 * description AND location are both empty.
 */
export function addIncidentDetailsSection(
  doc: any,
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate required height dynamically
  const requiredHeight = calculateIncidentSectionHeight(doc, data, pageWidth, margin);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('INCIDENT DETAILS', margin, startY);

  // Check for missing incident data
  const hasDescription = data.description && data.description.trim() !== '';
  const hasLocation = data.incidentLocation && data.incidentLocation.trim() !== '';
  const isIncomplete = !hasDescription && !hasLocation;

  // Section box with conditional styling for incomplete data
  const sectionHeight = calculateIncidentSectionHeight(doc, data, pageWidth, margin);
  if (isIncomplete) {
    doc.setDrawColor(255, 200, 200);
  } else {
    doc.setDrawColor(200, 200, 200);
  }
  doc.setLineWidth(0.3);
  doc.rect(margin, startY + 2, pageWidth - (margin * 2), sectionHeight);

  // Add warning background if data is incomplete
  if (isIncomplete) {
    doc.setFillColor(255, 245, 245);
    doc.rect(margin + 1, startY + 3, pageWidth - (margin * 2) - 2, sectionHeight - 2, 'F');
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let incidentY = startY + 10;

  // Date and Time
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', margin + 3, incidentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(data.incidentDate)} at ${data.incidentTime}`, margin + 30, incidentY);
  incidentY += 6;

  // Location
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Location:', margin + 3, incidentY);
  doc.setFont('helvetica', 'normal');
  const locationText = hasLocation ? data.incidentLocation : 'Not specified';
  doc.text(locationText, margin + 25, incidentY);
  incidentY += 6;

  // Description
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', margin + 3, incidentY);
  incidentY += 5;

  doc.setFont('helvetica', 'normal');
  const descriptionText = hasDescription ? data.description : 'Details to be completed';
  const descriptionLines = wrapText(doc, descriptionText, pageWidth - margin * 2 - 6);
  descriptionLines.forEach(line => {
    doc.text(line, margin + 3, incidentY);
    incidentY += 4;
  });

  return startY + sectionHeight + 10;
}
