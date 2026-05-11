// frontend/src/services/pdf/versions/v1_2_0.ts
//
// 🆕🆕🆕 VERSION 1.2.0 — CURRENT PDF GENERATOR 🆕🆕🆕
//
// Defining feature: dynamic section rendering driven by
// `customSettings.sections[]`. Standard sections (PreviousDisciplinary,
// Consequences, EmployeeRights, etc.) route to v1.1.0's beautiful
// hardcoded renderers; custom sections fall through to the dynamic
// renderer (`pdf/dynamic/DynamicSectionRenderer.ts`).
//
// ⚠️ NOT YET FROZEN — when v1.3.0 ships, do not modify this method;
// create v1.3.0 instead.
//
// Extracted from PDFGenerationService in Phase 2 Tier 3B step 7. The body
// is byte-identical to the original — only `this.X` references swapped
// for direct imports of the same implementations.
//
// 🐛 PRE-EXISTING BUG PRESERVED: the `if (data.appealDetails)` branch near
// the end calls a method `addAppealReportSection` that does not exist on
// PDFGenerationService and never has. The original had a TS2339 error
// there. We replicate the runtime behavior (throws when fired) via a
// local stub. Appeals are normally rendered via the dynamic section
// routing above, so this branch is effectively dead code — but it's
// preserved exactly to avoid changing v1.2.0's observable behavior.

import Logger from '../../../utils/logger';
import { globalDeviceCapabilities } from '../../../utils/deviceDetection';
import type { WarningPDFData } from '../../PDFGenerationService';
import { generateSimplifiedPDF } from '../SimplifiedPDFGenerator';
import { convertSignatureToPNG } from '../signatureConverter';
import {
  prepareLogoForPDF,
  addOrganizationHeader,
} from '../pageUtils/headers';
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
} from '../sections/correctiveSections';
import { addEmployeeRightsSection } from '../sections/employeeRightsSection';
import {
  addSignaturesSection,
  addAppealHistorySection,
  addDocumentFooter,
  addContinuationHeaders,
} from '../sections/signatureSections';
import { addSecurityWatermark, addOverturnedWatermark } from '../watermarks';
import { renderDynamicSection } from '../dynamic/DynamicSectionRenderer';

// Pre-existing bug stub — see file header for context.
async function addAppealReportSection(..._args: any[]): Promise<void> {
  throw new Error('addAppealReportSection is not implemented (pre-existing bug in v1.2.0)');
}

/**
 * Generate a v1.2.0 warning PDF. Currently the CURRENT version — not yet
 * frozen. Reads `customSettings.sections[]` for dynamic section ordering and
 * customisation; falls back to a hardcoded section sequence when sections
 * are absent.
 */
export async function generateWarningPDF_v1_2_0(data: WarningPDFData, customSettings?: any): Promise<Blob> {
  try {
    // 🚨 Memory check for legacy devices
    const capabilities = globalDeviceCapabilities || { isLegacyDevice: false };
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

    // 🎨 Merge custom settings with defaults
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
      },
      sections: undefined as any // Will be populated from customSettings
    };

    // 🔍 DEBUG: Log what customSettings we received
    console.log('🎨 PDF TEMPLATE DEBUG - customSettings received:', {
      hasCustomSettings: !!customSettings,
      customSettingsKeys: customSettings ? Object.keys(customSettings) : 'none',
      hasSections: !!customSettings?.sections,
      sectionsCount: customSettings?.sections?.length || 0,
      sectionIds: customSettings?.sections?.map((s: any) => s.id) || [],
      generatorVersion: customSettings?.generatorVersion || 'not set'
    });

    const settings = customSettings ? {
      styling: { ...defaultSettings.styling, ...(customSettings.styling || {}) },
      content: { ...defaultSettings.content, ...(customSettings.content || {}) },
      sections: customSettings.sections || defaultSettings.sections
    } : defaultSettings;

    // 🔍 DEBUG: Log the final merged settings
    console.log('🎨 PDF TEMPLATE DEBUG - final settings:', {
      usedCustomSettings: !!customSettings,
      finalSectionCount: settings.sections?.length || 0,
      finalSectionIds: settings.sections?.map((s: any) => s.id) || [],
      headerColor: settings.styling.headerBackground,
      organization: data.organization?.name
    });

    Logger.debug('🎨 v1.2.0: Using dynamic section rendering with', {
      sectionCount: settings.sections?.length || 0,
      organization: data.organization?.name
    });

    const startTime = Date.now();

    // 🚀 Dynamic import jsPDF
    const { default: jsPDF } = await import('jspdf');

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: settings.styling.pageSize.toLowerCase(),
      compress: true
    });

    doc.setFont(settings.styling.fontFamily, 'normal');

    // Setup layout parameters
    let currentY = settings.styling.margins.top;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = settings.styling.margins.left;
    const bottomMargin = settings.styling.margins.bottom + 20;

    // === CORE SECTIONS (Always rendered) ===

    // 1. Organization Header
    Logger.debug('🏢 Adding organization header...');
    // Pre-process logo: fetch, resize to PDF-friendly dimensions, convert to PNG data URL
    const rawLogoUrl = data.organization?.branding?.logo;
    let processedLogo: string | undefined;
    if (rawLogoUrl) {
      try {
        processedLogo = await prepareLogoForPDF(rawLogoUrl);
        Logger.debug('✅ Logo pre-processed for PDF embedding');
      } catch (error) {
        Logger.warn('⚠️ Failed to pre-process logo, will skip:', error);
      }
    }
    currentY = addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin, {
      headerLayout: settings.content?.headerLayout || 'banner',
      logoMaxHeight: settings.content?.logoMaxHeight || 20,
      processedLogo,
    });

    // 2. Document Title
    Logger.debug('📝 Adding document title...');
    currentY = addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

    // 3. Employee Information
    Logger.debug('👤 Adding employee section...');
    currentY = addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);

    // 4. Warning Details
    Logger.debug('⚠️ Adding warning details section...');
    currentY = addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

    // 5. Incident Details
    Logger.debug('📋 Adding incident details section...');
    currentY = addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

    // === DYNAMIC SECTIONS (From configuration) ===
    // 🎨 INTELLIGENT SECTION ROUTING: Uses v1.1.0 methods for standard sections,
    // dynamic renderer only for custom sections. This preserves the beautiful
    // professional appearance of v1.1.0 while enabling full customization.

    if (settings.sections && settings.sections.length > 0) {
      Logger.debug(`🎨 Rendering ${settings.sections.length} configured sections with intelligent routing...`);

      // Sort sections by order
      const sortedSections = [...settings.sections].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      // Render each enabled section
      for (const section of sortedSections) {
        if (!section.enabled) {
          Logger.debug(`  - Skipping (disabled): ${section.name}`);
          continue;
        }

        // ⏭️ SKIP SIGNATURES SECTION - it's rendered separately as a core section
        if (section.id === 'signatures') {
          Logger.debug(`  - Skipping signatures section (rendered separately as core section)`);
          continue;
        }

        // 🎨 ROUTE STANDARD SECTIONS TO v1.1.0 METHODS (beautiful appearance)
        // These are the professionally formatted sections from v1.1.0
        if (section.type === 'standard') {
          Logger.debug(`  - Rendering standard section: ${section.name} (using v1.1.0 method)`);

          switch (section.id) {
            case 'previous-disciplinary-actions':
              if (data.disciplineRecommendation) {
                currentY = addPreviousDisciplinaryActionSection(
                  doc,
                  data.disciplineRecommendation,
                  currentY,
                  pageWidth,
                  margin,
                  pageHeight,
                  bottomMargin,
                  section  // 🆕 PASS SECTION CONFIG: Enables custom heading/body
                );
              }
              break;

            case 'consequences-section':
              currentY = addConsequencesSection(
                doc,
                data,
                currentY,
                pageWidth,
                margin,
                pageHeight,
                bottomMargin,
                section  // 🆕 PASS SECTION CONFIG: Enables custom content (body/bulletPoints)
              );
              break;

            case 'employee-rights-lra':
              currentY = addEmployeeRightsSection(
                doc,
                data,
                currentY,
                pageWidth,
                margin,
                pageHeight,
                bottomMargin,
                section  // 🆕 PASS SECTION CONFIG: Enables custom subsections (Your Rights, What Happens Next, etc.)
              );
              break;

            case 'appeal-history':
              if (data.appealDetails || data.appealOutcome) {
                currentY = addAppealHistorySection(
                  doc,
                  data,
                  currentY,
                  pageWidth,
                  margin,
                  pageHeight,
                  bottomMargin
                );
              }
              break;

            // 🆕 CORRECTIVE DISCUSSION SECTIONS (Session 48)
            case 'employee-statement':
              if (data.employeeStatement) {
                Logger.debug('💬 Rendering employee statement section...');
                currentY = addEmployeeStatementSection(doc, data.employeeStatement, currentY, pageWidth, margin, pageHeight, bottomMargin);
              }
              break;

            case 'expected-behavior-standards':
              if (data.expectedBehaviorStandards) {
                Logger.debug('📊 Rendering expected behavior section...');
                currentY = addExpectedBehaviorSection(doc, data.expectedBehaviorStandards, currentY, pageWidth, margin, pageHeight, bottomMargin);
              }
              break;

            case 'facts-leading-to-decision':
              if (data.factsLeadingToDecision) {
                Logger.debug('⚖️ Rendering facts leading to decision section...');
                currentY = addFactsLeadingToDecisionSection(doc, data.factsLeadingToDecision, currentY, pageWidth, margin, pageHeight, bottomMargin);
              }
              break;

            case 'improvement-commitments':
              if (data.improvementCommitments && data.improvementCommitments.length > 0) {
                Logger.debug('✅ Rendering improvement commitments section...');
                currentY = addImprovementCommitmentsSection(doc, data.improvementCommitments, currentY, pageWidth, margin, pageHeight, bottomMargin);
              }
              break;

            case 'review-date':
              if (data.reviewDate) {
                Logger.debug('📅 Rendering review date section...');
                currentY = addReviewDateSection(doc, data.reviewDate, currentY, pageWidth, margin, pageHeight, bottomMargin);
              }
              break;

            default:
              Logger.warn(`Unknown standard section: ${section.id}, using dynamic renderer`);
              currentY = renderDynamicSection(
                doc,
                section,
                data,
                currentY,
                pageWidth,
                margin,
                pageHeight,
                bottomMargin,
                settings
              );
              break;
          }
        } else {
          // 🆕 CUSTOM SECTIONS: Use dynamic renderer
          Logger.debug(`  - Rendering custom section: ${section.name} (using dynamic renderer)`);
          currentY = renderDynamicSection(
            doc,
            section,
            data,
            currentY,
            pageWidth,
            margin,
            pageHeight,
            bottomMargin,
            settings
          );
        }
      }

      Logger.success(`✅ All sections rendered successfully`);
    } else {
      Logger.warn('⚠️ No sections configured, using fallback rendering');

      // Fallback: Render all standard sections when no configuration provided
      if (data.disciplineRecommendation) {
        currentY = addPreviousDisciplinaryActionSection(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
        currentY = addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      // Corrective discussion sections
      if (data.employeeStatement) {
        currentY = addEmployeeStatementSection(doc, data.employeeStatement, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }
      if (data.expectedBehaviorStandards) {
        currentY = addExpectedBehaviorSection(doc, data.expectedBehaviorStandards, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }
      if (data.factsLeadingToDecision) {
        currentY = addFactsLeadingToDecisionSection(doc, data.factsLeadingToDecision, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }
      if (data.improvementCommitments && data.improvementCommitments.length > 0) {
        currentY = addImprovementCommitmentsSection(doc, data.improvementCommitments, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }
      if (data.reviewDate) {
        currentY = addReviewDateSection(doc, data.reviewDate, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      if (data.legalCompliance) {
        currentY = addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      if (data.additionalNotes) {
        currentY = addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      currentY = addEmployeeRightsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    // === CORE SECTIONS (Always rendered) ===

    // 9. Signatures Section
    Logger.debug('✍️ Adding signatures section...');
    currentY = addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin, data.issuedDate, data.issuedByName);

    // 10. Appeal Report (if applicable)
    // ⚠️ PRE-EXISTING BUG: see file header. The original called
    // `this.addAppealReportSection` which never existed on the class.
    // Preserved exactly via local stub that throws if invoked. The branch
    // is effectively dead because appeal-history is normally routed via
    // the section loop above.
    if (data.appealDetails) {
      Logger.debug('📋 Adding appeal report...');
      await addAppealReportSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
    }

    // 10.6. Continuation headers on page 2+
    addContinuationHeaders(doc, data);

    // 11. Footer
    Logger.debug('🦶 Adding document footer...');
    addDocumentFooter(doc, data, pageWidth, {
      footerText: settings.content.footerText,
      showPageNumbers: settings.content.showPageNumbers,
    });

    // 12. Security watermark
    if (settings.content.showWatermark) {
      Logger.debug('🛡️ Adding security watermark...');
      addSecurityWatermark(doc, pageWidth, {
        watermarkText: settings.content.watermarkText,
        watermarkOpacity: settings.content.watermarkOpacity,
      });
    }

    // 13. "OVERTURNED" watermark if applicable
    if (data.status === 'overturned') {
      Logger.debug('🚫 Adding OVERTURNED watermark...');
      addOverturnedWatermark(doc, pageWidth);
    }

    // Generate and return blob
    const pdfBlob = doc.output('blob');
    const endTime = Date.now();

    Logger.success('✅ v1.2.0 PDF generated successfully:', {
      warningId: data.warningId,
      employee: `${data.employee.firstName} ${data.employee.lastName}`,
      sectionsRendered: settings.sections?.filter((s: any) => s.enabled).length || 0,
      size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
      time: `${endTime - startTime}ms`
    });

    return pdfBlob;

  } catch (error) {
    Logger.error('❌ v1.2.0 PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
