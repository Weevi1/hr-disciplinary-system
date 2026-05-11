// frontend/src/services/pdf/AppealReportGenerator.ts
//
// Standalone PDF generator for the Appeal Decision Report — a focused
// document showing only the appeal process and decision, not the original
// warning. Independent of the version-dispatched `generateWarningPDF`
// pipeline (which renders the warning itself).
//
// Extracted from PDFGenerationService.ts in Phase 2 Tier 3B (first move).
// Body is verbatim from the source; only the `this.formatDate` calls were
// retargeted to import `formatDate` from `./utils`.
//
// Used by: components/warnings/modals/WarningDetailsModal.tsx
// PDFGenerationService.generateAppealReportPDF is kept as a thin proxy for
// any callers that haven't been migrated yet.

import Logger from '../../utils/logger';
import { formatDate } from './utils';

export interface AppealReportData {
  warningId: string;
  employee: { firstName: string; lastName: string; employeeNumber: string; department: string; position: string };
  category: string;
  warningLevel: string;
  issueDate: Date;
  organization: { name: string; branding?: any };
  appealDetails?: {
    grounds?: string;
    details?: string;
    requestedOutcome?: string;
    submittedAt?: Date;
    submittedBy?: string;
  };
  appealOutcome?: 'upheld' | 'overturned' | 'modified' | 'reduced';
  appealDecisionDate?: Date;
  appealReasoning?: string;
  hrNotes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

/**
 * 📋 APPEAL REPORT GENERATOR — Standalone appeal decision document.
 */
export async function generateAppealReportPDF(data: AppealReportData): Promise<Blob> {
  try {
    Logger.debug('📋 Generating Appeal Report PDF...');

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let currentY = 20;

    // Header with organization branding (use blue by default)
    doc.setFillColor(37, 99, 235); // Blue (#2563eb)
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('APPEAL DECISION REPORT', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(data.organization.name, pageWidth / 2, 28, { align: 'center' });

    currentY = 50;

    // Document Information Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 35, 3, 3, 'FD');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Warning Reference', margin + 5, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Warning ID: ${data.warningId}`, margin + 5, currentY + 13);
    doc.text(`Employee: ${data.employee.firstName} ${data.employee.lastName} (${data.employee.employeeNumber})`, margin + 5, currentY + 18);
    doc.text(`Department: ${data.employee.department}`, margin + 5, currentY + 23);
    doc.text(`Warning Level: ${data.warningLevel}`, margin + 5, currentY + 28);
    doc.text(`Original Issue Date: ${formatDate(data.issueDate)}`, pageWidth - margin - 60, currentY + 13);
    doc.text(`Category: ${data.category}`, pageWidth - margin - 60, currentY + 18);

    currentY += 43;

    // === APPEAL SUBMISSION SECTION ===
    if (data.appealDetails) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 45, 145); // Purple
      doc.text('1. APPEAL SUBMISSION', margin, currentY);
      currentY += 8;

      // Submission date box
      doc.setFillColor(245, 243, 255);
      doc.setDrawColor(167, 139, 250);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 2, 2, 'FD');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Submitted: ${data.appealDetails.submittedAt ? formatDate(data.appealDetails.submittedAt) : 'N/A'}`, margin + 5, currentY + 5);
      doc.text(`By: ${data.appealDetails.submittedBy || 'Employee'}`, margin + 5, currentY + 9);
      currentY += 15;

      // Grounds for appeal
      if (data.appealDetails.grounds) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Grounds for Appeal:', margin, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const groundsLines = doc.splitTextToSize(data.appealDetails.grounds, pageWidth - margin * 2 - 10);
        doc.text(groundsLines, margin + 5, currentY);
        currentY += groundsLines.length * 4 + 5;
      }

      // Additional details
      if (data.appealDetails.details) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Additional Details:', margin, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const detailsLines = doc.splitTextToSize(data.appealDetails.details, pageWidth - margin * 2 - 10);
        doc.text(detailsLines, margin + 5, currentY);
        currentY += detailsLines.length * 4 + 5;
      }

      // Requested outcome
      if (data.appealDetails.requestedOutcome) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Requested Outcome:', margin, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const outcomeLines = doc.splitTextToSize(data.appealDetails.requestedOutcome, pageWidth - margin * 2 - 10);
        doc.text(outcomeLines, margin + 5, currentY);
        currentY += outcomeLines.length * 4 + 8;
      }
    }

    // === HR DECISION SECTION ===
    if (data.appealOutcome) {
      // Check page overflow
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 45, 145);
      doc.text('2. HR DECISION', margin, currentY);
      currentY += 8;

      // Decision date box
      doc.setFillColor(245, 243, 255);
      doc.setDrawColor(167, 139, 250);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 8, 2, 2, 'FD');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Decision Date: ${data.appealDecisionDate ? formatDate(data.appealDecisionDate) : 'Pending'}`, margin + 5, currentY + 5);
      currentY += 12;

      // Outcome - Large colored badge
      const outcomeText = data.appealOutcome === 'overturned' ? 'APPEAL APPROVED - WARNING OVERTURNED' :
                          data.appealOutcome === 'upheld' ? 'APPEAL DENIED - WARNING STANDS' :
                          data.appealOutcome === 'modified' ? 'APPEAL PARTIALLY APPROVED - WARNING MODIFIED' :
                          data.appealOutcome === 'reduced' ? 'APPEAL PARTIALLY APPROVED - WARNING REDUCED' :
                          data.appealOutcome.toUpperCase();

      // Colored outcome box
      if (data.appealOutcome === 'overturned') {
        doc.setFillColor(34, 197, 94); // Green
      } else if (data.appealOutcome === 'upheld') {
        doc.setFillColor(239, 68, 68); // Red
      } else {
        doc.setFillColor(251, 146, 60); // Orange
      }

      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 15, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(outcomeText, pageWidth / 2, currentY + 10, { align: 'center' });
      currentY += 20;

      // HR Reasoning
      if (data.appealReasoning) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('HR Reasoning:', margin, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const reasoningLines = doc.splitTextToSize(data.appealReasoning, pageWidth - margin * 2 - 10);
        doc.text(reasoningLines, margin + 5, currentY);
        currentY += reasoningLines.length * 4 + 5;
      }

      // HR Notes
      if (data.hrNotes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('HR Notes:', margin, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(data.hrNotes, pageWidth - margin * 2 - 10);
        doc.text(notesLines, margin + 5, currentY);
        currentY += notesLines.length * 4 + 5;
      }

      // Follow-up requirements
      if (data.followUpRequired) {
        doc.setDrawColor(251, 191, 36);
        doc.setFillColor(254, 252, 232);
        doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 2, 2, 'FD');

        doc.setTextColor(146, 64, 14);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const followUpText = data.followUpDate
          ? `⚠ FOLLOW-UP REQUIRED BY: ${formatDate(data.followUpDate)}`
          : '⚠ FOLLOW-UP REQUIRED';
        doc.text(followUpText, margin + 5, currentY + 7);
        currentY += 15;
      }
    }

    // === SIGNATURE SECTION ===
    if (currentY < pageHeight - 80) {
      currentY = pageHeight - 75;
    } else {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('HR Authorization:', margin, currentY);
    currentY += 10;

    // Signature line
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, currentY, margin + 70, currentY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('HR Manager Signature', margin, currentY + 5);

    doc.line(pageWidth - margin - 70, currentY, pageWidth - margin, currentY);
    doc.text('Date', pageWidth - margin - 35, currentY + 5);

    // === FOOTER - Add to all pages ===
    const totalPages = doc.getNumberOfPages();
    const footerY = pageHeight - 25;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);

      const footerText = 'Official Appeal Decision Report - Confidential HR Document';
      doc.text(footerText, pageWidth / 2, footerY + 5, { align: 'center' });

      // Page number (centered)
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 10, { align: 'center' });
    }

    Logger.success('✅ Appeal Report PDF generated');

    return doc.output('blob');
  } catch (error) {
    Logger.error('❌ Failed to generate appeal report:', error);
    console.error('Appeal report generation error details:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw error instanceof Error ? error : new Error('Failed to generate appeal report PDF');
  }
}
