// frontend/src/services/pdf/versions/v1_1_0.ts
//
// 🔒🔒🔒 VERSION 1.1.0 — FROZEN PDF GENERATOR 🔒🔒🔒
//
// ⚠️ DO NOT MODIFY THE BODY OF generateWarningPDF_v1_1_0.
//
// Used to regenerate all warnings created BETWEEN 2025-10-14 and 2025-10-15.
// Any change to the rendering sequence or to any helper it transitively calls
// will cause historical warnings to regenerate differently, breaking the
// legal-compliance contract.
//
// Defining feature: Previous Disciplinary Action format is
//   "N) Date: ... | Incident: <description> | Level: ..."
// (the v1.0.0 format shows "Offense: <category>" instead).
//
// Also: supports `customSettings` for per-organization styling (font,
// margins, page size, watermark, footer text) — Phase 6 templating.
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
import { addPreviousDisciplinaryActionSection } from '../sections/disciplinaryHistorySections';
import {
  addConsequencesSection,
  addLegalComplianceSection,
  addAdditionalNotesSection,
} from '../sections/complianceSections';
import {
  addEmployeeStatementSection,
  addExpectedBehaviorSection,
  addFactsLeadingToDecisionSection,
  addImprovementCommitmentsSection,
  addReviewDateSection,
  addInterventionDetailsSection,
} from '../sections/correctiveSections';
import { addEmployeeRightsSection } from '../sections/employeeRightsSection';
import {
  addSignaturesSection,
  addDeliverySection,
  addAppealHistorySection,
  addDocumentFooter,
  addContinuationHeaders,
} from '../sections/signatureSections';
import { addSecurityWatermark, addOverturnedWatermark } from '../watermarks';

/**
 * Generate a v1.1.0 warning PDF. FROZEN — see file header.
 *
 * @param customSettings - Optional per-organization PDF template settings
 *                        (font/margins/watermark/footer overrides)
 */
export async function generateWarningPDF_v1_1_0(data: WarningPDFData, customSettings?: any): Promise<Blob> {
  try {
    // 🚨 Memory check for legacy devices
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

    // 🎨 PHASE 6: Merge custom settings with defaults
    const defaultSettings = {
      styling: {
        headerBackground: '#3B82F6',
        sectionHeaderColor: '#333333',
        bodyTextColor: '#000000',
        borderColor: '#C8C8C8',
        fontSize: 11,
        fontFamily: 'helvetica',
        lineHeight: 1.4,
        pageSize: 'A4',
        margins: { top: 20, bottom: 20, left: 20, right: 20 }
      },
      content: {
        showWatermark: true,
        watermarkText: 'CONFIDENTIAL',
        watermarkOpacity: 0.1,
        footerText: 'Confidential & Privileged',
        showPageNumbers: true
      }
    };

    // Merge custom settings with defaults (custom settings take precedence)
    const settings = customSettings ? {
      styling: { ...defaultSettings.styling, ...(customSettings.styling || {}) },
      content: { ...defaultSettings.content, ...(customSettings.content || {}) }
    } : defaultSettings;

    if (customSettings) {
      Logger.debug('🎨 Using custom PDF template settings:', {
        organization: data.organization?.name,
        headerColor: settings.styling.headerBackground,
        fontSize: settings.styling.fontSize,
        watermark: settings.content.watermarkText
      });
    }

    Logger.debug(2688)
    Logger.debug('📊 Input data validation:', {
      hasEmployee: !!data.employee,
      hasOrganization: !!data.organization,
      hasIncidentData: !!(data.description || data.incidentLocation),
      employeeName: data.employee ? `${data.employee.firstName} ${data.employee.lastName}` : 'Missing',
      organizationName: data.organization?.name || 'Missing',
      warningLevel: data.warningLevel,
      category: data.category
    });

    const startTime = Date.now();

    // 🚀 PERFORMANCE: Dynamic import jsPDF to reduce main bundle by 43%
    Logger.debug(3310)
    const { default: jsPDF } = await import('jspdf');

    Logger.debug(3436)
    // 🎨 Use custom page size from settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: settings.styling.pageSize.toLowerCase(), // 'a4' or 'letter'
      compress: true
    });

    Logger.success(3579)
    // 🎨 Use custom font from settings
    doc.setFont(settings.styling.fontFamily, 'normal');

    // 🎨 Use custom margins from settings
    let currentY = settings.styling.margins.top;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = settings.styling.margins.left;
    const bottomMargin = settings.styling.margins.bottom + 20; // Space for footer

    Logger.debug(3950)

    // 1. Organization Header
    Logger.debug('🏢 Adding organization header...')
    currentY = addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin);
    Logger.success(4172)

    // 2. Document Title with Draft Indicator
    Logger.debug('📝 Adding document title...')
    currentY = addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    Logger.success(4459)

    // 3. Employee Information Section (Resilient)
    Logger.debug('👤 Adding employee section...')
    currentY = addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);
    Logger.success(4759)

    // 4. Warning Details Section (Resilient)
    Logger.debug('⚠️ Adding warning details section...')
    currentY = addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    Logger.success(5060)

    // 5. Incident Details Section (Resilient to Empty Fields)
    Logger.debug('📋 Adding incident details section...')
    currentY = addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    Logger.success(5387)

    // 5.1. Corrective Counselling Sections (Unified Warning/Counselling Approach)
    // Section B: Employee's Statement
    if (data.employeeStatement) {
      Logger.debug('💬 Adding employee statement section...')
      currentY = addEmployeeStatementSection(doc, data.employeeStatement, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Employee statement section added')
    }

    // Section C: Expected Behavior & Standards
    if (data.expectedBehaviorStandards) {
      Logger.debug('📊 Adding expected behavior section...')
      currentY = addExpectedBehaviorSection(doc, data.expectedBehaviorStandards, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Expected behavior section added')
    }

    // Section E: Facts Leading to Decision
    if (data.factsLeadingToDecision) {
      Logger.debug('⚖️ Adding facts leading to decision section...')
      currentY = addFactsLeadingToDecisionSection(doc, data.factsLeadingToDecision, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Facts leading to decision section added')
    }

    // 6. Previous Disciplinary Action + Consequences (if available)
    if (data.disciplineRecommendation) {
      Logger.debug('📋 Adding previous disciplinary action section...')
      currentY = addPreviousDisciplinaryActionSection(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Previous disciplinary action section added')

      Logger.debug('⚠️ Adding consequences section...')
      currentY = addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Consequences section added')
    } else {
      Logger.debug('⏭️ Skipping progressive discipline sections (no data)');
    }

    // 7. Legal Compliance Section
    if (data.legalCompliance) {
      Logger.debug('⚖️ Adding legal compliance section...')
      currentY = addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(6262)
    } else {
      Logger.debug('⏭️ Skipping legal compliance section (no data)');
    }

    // 8. Additional Notes Section
    if (data.additionalNotes) {
      Logger.debug('📝 Adding additional notes section...')
      currentY = addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(6716)
    } else {
      Logger.debug('⏭️ Skipping additional notes section (no data)');
    }

    // 8.1. More Corrective Counselling Sections
    // Section F: Improvement Commitments
    if (data.improvementCommitments && data.improvementCommitments.length > 0) {
      Logger.debug('✅ Adding improvement commitments section...')
      currentY = addImprovementCommitmentsSection(doc, data.improvementCommitments, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Improvement commitments section added')
    }

    // Review Date and Auto-Satisfaction Clause
    if (data.reviewDate) {
      Logger.debug('📅 Adding review date and auto-satisfaction clause section...')
      currentY = addReviewDateSection(doc, data.reviewDate, currentY, pageWidth, margin, pageHeight, bottomMargin, data.warningLevel);
      Logger.success('✅ Review date and auto-satisfaction clause section added')
    }

    // Intervention Details
    if (data.interventionDetails) {
      Logger.debug('🎓 Adding intervention details section...')
      currentY = addInterventionDetailsSection(doc, data.interventionDetails, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Intervention details section added')
    }

    // 8.5. Employee Rights and Next Steps Section - LRA Compliant
    Logger.debug('⚖️ Adding employee rights and next steps section...')
    currentY = addEmployeeRightsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    Logger.success('✅ Employee rights section added')

    // 9. Signatures Section - Always add, even if no digital signatures
    Logger.debug('✍️ Adding signatures section...')
    currentY = addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin, data.issuedDate, data.issuedByName);
    Logger.success(7166)

    // 10. Delivery Information (if available)
    if (data.deliveryChoice) {
      Logger.debug('📮 Adding delivery section...')
      currentY = addDeliverySection(doc, data.deliveryChoice, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(7512)
    } else {
      Logger.debug('⏭️ Skipping delivery section (no data)');
    }

    // 10.5. Appeal History Section (if appeal was submitted or decided)
    if (data.appealDetails || data.appealOutcome) {
      Logger.debug('⚖️ Adding appeal history section...')
      currentY = addAppealHistorySection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Appeal history section added')
    } else {
      Logger.debug('⏭️ Skipping appeal history section (no data)');
    }

    // 10.6. Continuation headers on page 2+
    addContinuationHeaders(doc, data);

    // 11. Footer
    Logger.debug('🦶 Adding document footer...')
    addDocumentFooter(doc, data, pageWidth);
    Logger.success(7804)

    // 12. Security features
    Logger.debug('🛡️ Adding security watermark...')
    addSecurityWatermark(doc, pageWidth);
    Logger.success(7997)

    // 13. Add "OVERTURNED" watermark if warning was overturned
    if (data.status === 'overturned') {
      Logger.debug('🚫 Adding OVERTURNED watermark...')
      addOverturnedWatermark(doc, pageWidth);
      Logger.success('✅ OVERTURNED watermark added to all pages')
    }

    // Generate and return blob
    Logger.debug('🔄 Generating PDF blob...')
    const pdfBlob = doc.output('blob');
    const endTime = Date.now();

    Logger.debug('✅ Resilient PDF generated successfully:', {
      warningId: data.warningId,
      employee: `${data.employee.firstName} ${data.employee.lastName}`,
      size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
      time: `${endTime - startTime}ms`
    });

    return pdfBlob;

  } catch (error) {
    Logger.error('❌ PDF generation failed:', error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
