// frontend/src/services/pdf/versions/v1_0_0.ts
//
// 🔒🔒🔒 VERSION 1.0.0 — FROZEN LEGACY PDF GENERATOR 🔒🔒🔒
//
// ⚠️ DO NOT MODIFY THE BODY OF generateWarningPDF_v1_0_0.
//
// Used to regenerate all warnings created BEFORE 2025-10-14. Any change to
// the rendering sequence or to any helper it transitively calls will cause
// historical warnings to regenerate differently, breaking the legal-compliance
// contract.
//
// Defining feature: Previous Disciplinary Action format is
//   "N) Date: ... | Offense: <category> | Level: ..."
// (the v1.1.0+ format shows "Incident" instead of "Offense").
//
// Extracted from PDFGenerationService in Phase 2 Tier 3B step 7. The body
// is byte-identical to the original — only the `this.X` references have
// been swapped for direct imports of the same implementations.

import Logger from '../../../utils/logger';
import { globalDeviceCapabilities, getPerformanceLimits } from '../../../utils/deviceDetection';
import type { WarningPDFData } from '../../PDFGenerationService';
import { generateSimplifiedPDF } from '../SimplifiedPDFGenerator';
import { convertSignatureToPNG } from '../signatureConverter';
import { addOrganizationHeader } from '../pageUtils/headers';
import { addDocumentTitle } from '../pageUtils/documentTitle';
import {
  addEmployeeSection,
  addWarningDetailsSection,
  addIncidentDetailsSection,
} from '../sections/baseInfoSections';
import { addPreviousDisciplinaryActionSection_v1_0_0 } from '../sections/disciplinaryHistorySections';
import {
  addConsequencesSection,
  addLegalComplianceSection,
  addAdditionalNotesSection,
} from '../sections/complianceSections';
import { addEmployeeRightsSection } from '../sections/employeeRightsSection';
import {
  addSignaturesSection,
  addDeliverySection,
  addAppealHistorySection,
  addDocumentFooter,
} from '../sections/signatureSections';
import { addSecurityWatermark, addOverturnedWatermark } from '../watermarks';

/**
 * Generate a v1.0.0 warning PDF. FROZEN — see file header.
 */
export async function generateWarningPDF_v1_0_0(data: WarningPDFData): Promise<Blob> {
  try {
    // Same implementation as v1.1.0, but with different Previous Action format
    const capabilities = globalDeviceCapabilities || { isLegacyDevice: false };
    const _limits = getPerformanceLimits(capabilities);

    if (capabilities.isLegacyDevice) {
      Logger.warn('🚨 Legacy device detected - using simplified PDF generation');
      return generateSimplifiedPDF(data);
    }

    // 🔄 Convert SVG signatures to PNG for PDF embedding
    if (data.signatures) {
      if (data.signatures.manager) {
        data.signatures.manager = await convertSignatureToPNG(data.signatures.manager);
      }
      if (data.signatures.employee) {
        data.signatures.employee = await convertSignatureToPNG(data.signatures.employee);
      }
      if ((data.signatures as any).witness) {
        (data.signatures as any).witness = await convertSignatureToPNG((data.signatures as any).witness);
      }
    }

    const startTime = Date.now();
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    doc.setFont('helvetica', 'normal');

    let currentY = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const bottomMargin = 40;

    // Build PDF with all sections (same as v1.1.0)
    currentY = addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin);
    currentY = addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    currentY = addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);
    currentY = addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    currentY = addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

    // 🔒 VERSION 1.0.0 DIFFERENCE: Use old Previous Action format
    if (data.disciplineRecommendation) {
      currentY = addPreviousDisciplinaryActionSection_v1_0_0(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
      currentY = addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    if (data.legalCompliance) {
      currentY = addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    if (data.additionalNotes) {
      currentY = addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    currentY = addEmployeeRightsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    currentY = addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin, data.issuedDate, data.issuedByName);

    if (data.deliveryChoice) {
      currentY = addDeliverySection(doc, data.deliveryChoice, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    if (data.appealDetails || data.appealOutcome) {
      currentY = addAppealHistorySection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    addDocumentFooter(doc, data, pageWidth);
    addSecurityWatermark(doc, pageWidth);

    if (data.status === 'overturned') {
      addOverturnedWatermark(doc, pageWidth);
    }

    const pdfBlob = doc.output('blob');
    const endTime = Date.now();

    Logger.debug('✅ v1.0.0 PDF generated:', {
      warningId: data.warningId,
      version: '1.0.0',
      size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
      time: `${endTime - startTime}ms`
    });

    return pdfBlob;

  } catch (error) {
    Logger.error('❌ v1.0.0 PDF generation failed:', error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
