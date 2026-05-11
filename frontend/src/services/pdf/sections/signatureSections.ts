// frontend/src/services/pdf/sections/signatureSections.ts
//
// End-of-document section renderers: Signatures, Delivery, Appeal History,
// and Document Footer. Extracted from PDFGenerationService in Phase 2
// Tier 3B step 5e. Bodies are byte-identical to the originals.
//
// Note on `(signatures as any).witness` casts: the canonical
// WarningPDFData.signatures shape only includes `manager` + `employee`,
// but the witness path is dynamic at runtime (added via a separate flow).
// The original used the same cast — preserving exactly.

import type { WarningPDFData } from '../../PDFGenerationService';
import Logger from '../../../utils/logger';
import { checkPageOverflow, formatDate } from '../utils';

/**
 * Signatures Section — manager + employee signature boxes side-by-side,
 * optional witness signature below. Renders SVG-converted-to-PNG signature
 * images with preserved aspect ratio, or empty signature lines if absent.
 * Includes electronic-signature notation below each box.
 */
export function addSignaturesSection(
  doc: any,
  signatures: WarningPDFData['signatures'],
  employee: WarningPDFData['employee'],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number,
  issuedDate?: Date,
  managerName?: string
): number {
  // Increased space requirement (was 50mm, now 70mm total for electronic signature notation)
  startY = checkPageOverflow(doc, startY, 70, pageHeight, bottomMargin);

  // Add spacing before signatures section
  startY += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('SIGNATURES', margin, startY);
  startY += 7;

  const signatureBoxWidth = (pageWidth - margin * 3) / 2;
  const signatureBoxHeight = 45; // Box height for signature area only

  // === MANAGER SIGNATURE COLUMN ===
  // Label above box (not inside)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Manager Signature:', margin, startY);

  // Draw signature box
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.setTextColor(0, 0, 0);
  doc.rect(margin, startY + 3, signatureBoxWidth, signatureBoxHeight);

  if (signatures?.manager) {
    try {
      // 🎨 ASPECT RATIO PRESERVED: Get actual image properties from jsPDF
      const maxWidth = signatureBoxWidth - 16; // 8mm padding on each side
      const maxHeight = 35; // Maximum height for signature PNG

      // Get image properties from jsPDF (which can read the base64 data)
      const imgProps = doc.getImageProperties(signatures.manager);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const aspectRatio = imgWidth / imgHeight;

      // Scale to fit within max dimensions while preserving aspect ratio
      let finalWidth = maxWidth;
      let finalHeight = maxWidth / aspectRatio;

      // If height exceeds maximum, scale based on height instead
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }

      // Center signature horizontally within the box, position vertically from top
      const xOffset = (signatureBoxWidth - finalWidth) / 2;
      const yOffset = 5; // 5mm from top of box

      // Add image with calculated dimensions that preserve aspect ratio
      doc.addImage(signatures.manager, 'PNG', margin + xOffset, startY + 3 + yOffset, finalWidth, finalHeight);

      // Manager name and date BELOW the box
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const managerNameText = managerName ? managerName : '_____________________';
      doc.text(`Manager Name: ${managerNameText}`, margin + 2, startY + signatureBoxHeight + 7);
      doc.text(`Date: ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Electronically signed by ${managerNameText} on ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 15);
      doc.setTextColor(0, 0, 0);
    } catch (error) {
      Logger.warn('Failed to embed manager signature image:', error)
      // Fallback to text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('✓ Digitally Signed', margin + 5, startY + 25);
      const managerNameText = managerName ? managerName : '_____________________';
      doc.text(`Manager Name: ${managerNameText}`, margin + 2, startY + signatureBoxHeight + 7);
      doc.text(`Date: ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Electronically signed by ${managerNameText} on ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 15);
      doc.setTextColor(0, 0, 0);
    }
  } else {
    // Empty signature line
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('_____________________', margin + 5, startY + 30);
    const managerNameText = managerName ? managerName : '_____________________';
    doc.text(`Manager Name: ${managerNameText}`, margin + 2, startY + signatureBoxHeight + 7);
    doc.text('Date: ___________', margin + 2, startY + signatureBoxHeight + 11);
  }

  // === EMPLOYEE SIGNATURE COLUMN ===
  const employeeBoxX = margin + signatureBoxWidth + 10;

  // Label above box (not inside) - with employee name on second line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Employee Signature:', employeeBoxX, startY);

  // Draw signature box
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.setTextColor(0, 0, 0);
  doc.rect(employeeBoxX, startY + 3, signatureBoxWidth, signatureBoxHeight);

  if (signatures?.employee) {
    try {
      // 🎨 ASPECT RATIO PRESERVED: Get actual image properties from jsPDF
      const maxWidth = signatureBoxWidth - 16; // 8mm padding on each side
      const maxHeight = 35; // Maximum height for signature PNG

      // Get image properties from jsPDF (which can read the base64 data)
      const imgProps = doc.getImageProperties(signatures.employee);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const aspectRatio = imgWidth / imgHeight;

      // Scale to fit within max dimensions while preserving aspect ratio
      let finalWidth = maxWidth;
      let finalHeight = maxWidth / aspectRatio;

      // If height exceeds maximum, scale based on height instead
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }

      // Center signature horizontally within the box, position vertically from top
      const xOffset = (signatureBoxWidth - finalWidth) / 2;
      const yOffset = 5; // 5mm from top of box

      // Add image with calculated dimensions that preserve aspect ratio
      doc.addImage(signatures.employee, 'PNG', employeeBoxX + xOffset, startY + 3 + yOffset, finalWidth, finalHeight);

      // Employee name and date BELOW the box
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${employee.firstName} ${employee.lastName}`, employeeBoxX + 2, startY + signatureBoxHeight + 7);
      doc.text(`Date: ${formatDate(issuedDate || new Date())}`, employeeBoxX + 2, startY + signatureBoxHeight + 11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Electronically signed by ${employee.firstName} ${employee.lastName} on ${formatDate(issuedDate || new Date())}`, employeeBoxX + 2, startY + signatureBoxHeight + 15);
      doc.setTextColor(0, 0, 0);
    } catch (error) {
      Logger.warn('Failed to embed employee signature image:', error)
      // Fallback to text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('✓ Digitally Signed', employeeBoxX + 5, startY + 25);
      doc.text(`${employee.firstName} ${employee.lastName}`, employeeBoxX + 2, startY + signatureBoxHeight + 7);
      doc.text(`Date: ${formatDate(issuedDate || new Date())}`, employeeBoxX + 2, startY + signatureBoxHeight + 11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Electronically signed by ${employee.firstName} ${employee.lastName} on ${formatDate(issuedDate || new Date())}`, employeeBoxX + 2, startY + signatureBoxHeight + 15);
      doc.setTextColor(0, 0, 0);
    }
  } else {
    // Empty signature line
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('_____________________', employeeBoxX + 5, startY + 30);
    doc.text(`${employee.firstName} ${employee.lastName}`, employeeBoxX + 2, startY + signatureBoxHeight + 7);
    doc.text('Date: ___________', employeeBoxX + 2, startY + signatureBoxHeight + 11);
  }

  // === WITNESS SIGNATURE (if present) ===
  // Note: `witness` isn't in the canonical signatures type — runtime field
  // added via a separate flow. The cast preserves the original behavior.
  const sigsAny = signatures as any;
  if (sigsAny?.witness) {
    // Add spacing before witness signature
    startY += signatureBoxHeight + 18; // Below manager/employee signatures

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Witness Signature:', margin, startY);

    // Draw witness signature box (full width)
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.setTextColor(0, 0, 0);
    doc.rect(margin, startY + 3, signatureBoxWidth, signatureBoxHeight);

    try {
      // 🎨 ASPECT RATIO PRESERVED: Get actual image properties from jsPDF
      const maxWidth = signatureBoxWidth - 16; // 8mm padding on each side
      const maxHeight = 35; // Maximum height for signature PNG

      // Get image properties from jsPDF (which can read the base64 data)
      const imgProps = doc.getImageProperties(sigsAny.witness);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const aspectRatio = imgWidth / imgHeight;

      // Scale to fit within max dimensions while preserving aspect ratio
      let finalWidth = maxWidth;
      let finalHeight = maxWidth / aspectRatio;

      // If height exceeds maximum, scale based on height instead
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }

      // Center signature horizontally within the box, position vertically from top
      const xOffset = (signatureBoxWidth - finalWidth) / 2;
      const yOffset = 5; // 5mm from top of box

      // Add witness signature image with watermark
      doc.addImage(sigsAny.witness, 'PNG', margin + xOffset, startY + 3 + yOffset, finalWidth, finalHeight);

      // Witness name and date BELOW the box
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const witnessName = sigsAny.witnessName || '_____________________';
      doc.text(`Witness Name: ${witnessName}`, margin + 2, startY + signatureBoxHeight + 7);
      doc.text(`Date: ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Electronically signed by ${witnessName} on ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 15);
      doc.setTextColor(0, 0, 0);
    } catch (error) {
      Logger.warn('Failed to embed witness signature image:', error)
      // Fallback to text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('✓ Digitally Signed (Witness)', margin + 5, startY + 25);
      const witnessName = sigsAny.witnessName || '_____________________';
      doc.text(`Witness Name: ${witnessName}`, margin + 2, startY + signatureBoxHeight + 7);
      doc.text(`Date: ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Electronically signed by ${witnessName} on ${formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 15);
      doc.setTextColor(0, 0, 0);
    }

    return startY + signatureBoxHeight + 12;
  }

  return startY + signatureBoxHeight + 12;
}

/**
 * Delivery Information Section — method, date, and authorizing user.
 * Returns early if `delivery` is undefined.
 */
export function addDeliverySection(
  doc: any,
  delivery: WarningPDFData['deliveryChoice'],
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  if (!delivery) return startY;

  // Check if we have enough space (need about 20mm)
  startY = checkPageOverflow(doc, startY, 20, pageHeight, bottomMargin);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 51, 51);
  doc.text('DELIVERY INFORMATION', margin, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let deliveryY = startY + 6;

  doc.text(`Delivery Method: ${delivery.method.toUpperCase()}`, margin, deliveryY);
  deliveryY += 4;

  doc.text(`Delivery Date: ${formatDate(delivery.timestamp)}`, margin, deliveryY);
  deliveryY += 4;

  doc.text(`Authorized by: ${delivery.chosenBy}`, margin, deliveryY);

  return deliveryY + 8;
}

/**
 * Appeal History Section — employee submission + HR decision. Uses
 * data.appealDetails (employee fields) and data.appeal* (HR fields).
 * Coloured outcome badge: green=overturned, red=upheld, orange=modified/reduced.
 * Highlighted amber follow-up box when followUpRequired is true.
 */
export function addAppealHistorySection(
  doc: any,
  data: WarningPDFData,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Check if we have enough space (need about 40mm for appeal section)
  startY = checkPageOverflow(doc, startY, 40, pageHeight, bottomMargin);

  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 45, 145); // Purple color for appeal section
  doc.text('APPEAL HISTORY', margin, startY);

  let currentY = startY + 6;

  // Employee Appeal Section
  if (data.appealDetails) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Employee Appeal Submission', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (data.appealDetails.submittedAt) {
      doc.text(`Submitted: ${formatDate(data.appealDetails.submittedAt)}`, margin, currentY);
      currentY += 4;
    }

    if (data.appealDetails.submittedBy) {
      doc.text(`Submitted by: ${data.appealDetails.submittedBy}`, margin, currentY);
      currentY += 4;
    }

    if (data.appealDetails.grounds) {
      doc.setFont('helvetica', 'bold');
      doc.text('Grounds for Appeal:', margin, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');

      const groundsLines = doc.splitTextToSize(data.appealDetails.grounds, pageWidth - margin * 2 - 5);
      doc.text(groundsLines, margin + 5, currentY);
      currentY += groundsLines.length * 4 + 2;
    }

    if (data.appealDetails.details) {
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Details:', margin, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');

      const detailsLines = doc.splitTextToSize(data.appealDetails.details, pageWidth - margin * 2 - 5);
      doc.text(detailsLines, margin + 5, currentY);
      currentY += detailsLines.length * 4 + 2;
    }

    if (data.appealDetails.requestedOutcome) {
      doc.setFont('helvetica', 'bold');
      doc.text('Requested Outcome:', margin, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');

      const outcomeLines = doc.splitTextToSize(data.appealDetails.requestedOutcome, pageWidth - margin * 2 - 5);
      doc.text(outcomeLines, margin + 5, currentY);
      currentY += outcomeLines.length * 4 + 4;
    }
  }

  // HR Decision Section
  if (data.appealOutcome) {
    // Check if we need a new page for HR decision
    currentY = checkPageOverflow(doc, currentY, 30, pageHeight, bottomMargin);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('HR Decision', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (data.appealDecisionDate) {
      doc.text(`Decision Date: ${formatDate(data.appealDecisionDate)}`, margin, currentY);
      currentY += 4;
    }

    // Outcome with colored badge
    doc.setFont('helvetica', 'bold');
    doc.text('Outcome: ', margin, currentY);

    const outcomeText = data.appealOutcome === 'overturned' ? 'WARNING OVERTURNED' :
                        data.appealOutcome === 'upheld' ? 'APPEAL DENIED - WARNING STANDS' :
                        data.appealOutcome === 'modified' ? 'WARNING MODIFIED' :
                        data.appealOutcome === 'reduced' ? 'WARNING REDUCED' :
                        (data.appealOutcome as string).toUpperCase();

    // Set color based on outcome
    if (data.appealOutcome === 'overturned') {
      doc.setTextColor(34, 139, 34); // Green for overturned
    } else if (data.appealOutcome === 'upheld') {
      doc.setTextColor(178, 34, 34); // Red for upheld
    } else {
      doc.setTextColor(255, 140, 0); // Orange for modified/reduced
    }

    doc.text(outcomeText, margin + 20, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 5;

    if (data.appealReasoning) {
      doc.setFont('helvetica', 'bold');
      doc.text('HR Reasoning:', margin, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');

      const reasoningLines = doc.splitTextToSize(data.appealReasoning, pageWidth - margin * 2 - 5);
      doc.text(reasoningLines, margin + 5, currentY);
      currentY += reasoningLines.length * 4 + 2;
    }

    if (data.hrNotes) {
      doc.setFont('helvetica', 'bold');
      doc.text('HR Notes:', margin, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');

      const notesLines = doc.splitTextToSize(data.hrNotes, pageWidth - margin * 2 - 5);
      doc.text(notesLines, margin + 5, currentY);
      currentY += notesLines.length * 4 + 2;
    }

    if (data.followUpRequired) {
      // Highlighted follow-up box
      doc.setDrawColor(255, 193, 7);
      doc.setFillColor(255, 248, 220);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 10, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 69, 19);
      const followUpText = data.followUpDate
        ? `⚠ Follow-up Required by ${formatDate(data.followUpDate)}`
        : '⚠ Follow-up Required';
      doc.text(followUpText, margin + 2, currentY + 6);
      doc.setTextColor(0, 0, 0);
      currentY += 12;
    }
  }

  return currentY + 8;
}

/**
 * Document Footer — multi-page aware. On all pages except the last,
 * adds Manager/Employee initials (italic if digitally signed, blank lines
 * otherwise). LRA Section 188 legal notice, confidentiality notice
 * (customisable), and centred page numbers (optional).
 */
export function addDocumentFooter(
  doc: any,
  data: WarningPDFData,
  pageWidth: number,
  footerSettings?: { footerText?: string; showPageNumbers?: boolean }
): void {
  const pageHeight = doc.internal.pageSize.height;
  const totalPages = doc.getNumberOfPages();

  // Use custom footer text or default
  const customFooterText = footerSettings?.footerText || '';
  const showPageNumbers = footerSettings?.showPageNumbers !== false; // default true

  // Generate initials from names
  const managerInitials = data.issuedByName
    ? data.issuedByName.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('')
    : '';
  const employeeInitials = `${data.employee.firstName.charAt(0)}${data.employee.lastName.charAt(0)}`.toUpperCase();

  // Add footer to each page
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Initial lines on all pages except the last (which has full signatures)
    if (i < totalPages) {
      const initialsY = pageHeight - 30;
      const initialsX = pageWidth - 20; // right-aligned
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);

      // If digitally signed, show initials; otherwise show blank lines
      if (data.signatures?.manager && managerInitials) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Manager: ${managerInitials}`, initialsX - 55, initialsY);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('Manager: ______', initialsX - 55, initialsY);
      }

      if (data.signatures?.employee) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Employee: ${employeeInitials}`, initialsX - 20, initialsY);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('Employee: ______', initialsX - 20, initialsY);
      }
    }

    // Footer line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);

    const legalText = 'This document has been generated electronically and constitutes an official warning as per LRA Section 188.';
    const legalWidth = doc.getTextWidth(legalText);
    const legalX = (pageWidth - legalWidth) / 2;
    doc.text(legalText, legalX, pageHeight - 20);

    // Confidentiality notice (custom or default)
    const confText = customFooterText || 'CONFIDENTIAL DOCUMENT - For authorized personnel only';
    const confWidth = doc.getTextWidth(confText);
    const confX = (pageWidth - confWidth) / 2;
    doc.text(confText, confX, pageHeight - 15);

    // Page number (centered) — conditional
    if (showPageNumbers) {
      const pageText = `Page ${i} of ${totalPages}`;
      const pageWidth_text = doc.getTextWidth(pageText);
      const pageX = (pageWidth - pageWidth_text) / 2;
      doc.text(pageText, pageX, pageHeight - 10);
    }
  }
}

/**
 * Add continuation headers to all pages after page 1. Called as a
 * post-processing step before the document footer/watermarks.
 * Format: `OrgName — Warning: EmployeeName — Page X of Y`
 */
export function addContinuationHeaders(doc: any, data: WarningPDFData): void {
  const totalPages = doc.getNumberOfPages();
  if (totalPages <= 1) return;

  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const employeeName = `${data.employee.firstName} ${data.employee.lastName}`;
  const orgName = data.organization.name || '';

  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);

    // Header text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);

    const headerLeft = `${orgName} — Warning: ${employeeName}`;
    doc.text(headerLeft, margin, 10);

    const headerRight = `Page ${i} of ${totalPages}`;
    doc.text(headerRight, pageWidth - margin, 10, { align: 'right' });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  }
}
