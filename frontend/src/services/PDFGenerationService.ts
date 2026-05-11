import Logger from '../utils/logger';
// frontend/src/services/PDFGenerationService.ts
// 🏆 REBUILT PDF GENERATION SERVICE - PERFECTLY MATCHED TO WARNING WIZARD DATA
// ✅ Built for your actual collected fields: incidentDate, incidentTime, incidentLocation, etc.
// ✅ Professional LRA-compliant document generation with proper formatting
// ✅ Supports signatures, recommendations, and all your form data
// ✅ RESILIENT to incomplete data states
// 🚨 MEMORY OPTIMIZED for 2012-era devices with <1GB RAM
// 🔒 VERSIONED PDF GENERATION - Legal compliance through consistent regeneration
// ✅ SVG SIGNATURE SUPPORT - Converts to PNG for PDF embedding

import { globalDeviceCapabilities, getPerformanceLimits } from '../utils/deviceDetection';
import { PDFPlaceholderService } from './PDFPlaceholderService';
import type { PDFSectionConfig } from '../types/core';

/**
 * 🔒 PDF GENERATOR VERSION HISTORY - SECURITY CRITICAL
 *
 * ⚠️⚠️⚠️ CRITICAL WARNING: NEVER MODIFY EXISTING VERSION METHODS ⚠️⚠️⚠️
 *
 * Each version MUST remain FROZEN to ensure legal compliance.
 * Old warnings MUST regenerate identically to their original PDF.
 * Modifying frozen versions breaks legal document integrity and could
 * invalidate historical warnings in court proceedings.
 *
 * 🚫 DO NOT:
 * - Modify generateWarningPDF_v1_0_0() method
 * - Modify addPreviousDisciplinaryActionSection_v1_0_0() method
 * - Modify generateWarningPDF_v1_1_0() method (once it becomes frozen)
 * - Change any logic in frozen version methods
 * - "Fix bugs" in frozen versions (create new version instead)
 *
 * ✅ HOW TO ADD A NEW VERSION:
 * 1. Increment PDF_GENERATOR_VERSION below (e.g., 1.1.0 → 1.2.0)
 * 2. Create new method: generateWarningPDF_v1_2_0()
 * 3. Create new Previous Action method if format changed: addPreviousDisciplinaryActionSection_v1_2_0()
 * 4. Add case to switch statement in generateWarningPDF()
 * 5. Update version history below with change details
 * 6. Mark previous version (v1.1.0) as FROZEN in its comments
 * 7. Update CLAUDE.md with new version information
 * 8. Test thoroughly before deploying
 *
 * VERSION HISTORY:
 * - v1.0.0 (2025-10-14): Initial versioned release [FROZEN]
 *   - A4 formatting with professional layout
 *   - Employee rights section
 *   - Signature aspect ratio preservation
 *   - Previous Action shows: Date | Offense | Level
 *   - ⚠️ DO NOT MODIFY - Used by all warnings created before 2025-10-14
 *
 * - v1.1.0 (2025-10-14): Previous Action format change [FROZEN]
 *   - Changed: Previous Action now shows: Date | Incident Description | Level
 *   - Reason: Offense is redundant (already filtered), incident gives context
 *   - ⚠️ DO NOT MODIFY - Used by warnings created 2025-10-14 to 2025-10-15
 *
 * - v1.2.0 (2025-10-15): Dynamic Section Rendering [CURRENT]
 *   - NEW: Reads section configurations from customSettings.sections[]
 *   - NEW: Dynamic section rendering with drag-and-drop reordering
 *   - NEW: {{placeholder}} replacement for custom fields
 *   - NEW: Per-section styling overrides
 *   - NEW: Support for bullet points, tables, and rich content
 *   - Used by: All warnings created from 2025-10-15 onwards
 *
 * VERSIONING RULES (Semantic Versioning):
 * - MAJOR (X.0.0): Breaking changes to PDF structure (page layout, sections)
 * - MINOR (0.X.0): Content changes (field additions, formatting tweaks, text changes)
 * - PATCH (0.0.X): Bug fixes that don't affect visible output (code refactoring only)
 *
 * LEGAL COMPLIANCE:
 * This versioning system ensures warnings can be regenerated identically years
 * later for appeals, audits, or legal proceedings. Breaking this system could
 * result in documents being challenged in court.
 */
export const PDF_GENERATOR_VERSION = '1.2.0';

// Dynamic import for jsPDF - reduces main bundle by 43%
// jsPDF will be loaded on-demand when PDF generation is needed

// Phase 2 Tier 3B: extracted modules. Imports kept at module load so the
// proxies below resolve without circulars (the moved code does not import
// back into this file).
import { generateAppealReportPDF as _generateAppealReportPDF, type AppealReportData } from './pdf/AppealReportGenerator';
import {
  addSecurityWatermark as _addSecurityWatermarkImpl,
  addOverturnedWatermark as _addOverturnedWatermarkImpl,
} from './pdf/watermarks';
import {
  generateSimplifiedPDF as _generateSimplifiedPDFImpl,
  generatePlainTextPDF as _generatePlainTextPDFImpl,
} from './pdf/SimplifiedPDFGenerator';
import {
  addEmployeeStatementSection as _addEmployeeStatementSectionImpl,
  addExpectedBehaviorSection as _addExpectedBehaviorSectionImpl,
  addFactsLeadingToDecisionSection as _addFactsLeadingToDecisionSectionImpl,
  addImprovementCommitmentsSection as _addImprovementCommitmentsSectionImpl,
  addReviewDateSection as _addReviewDateSectionImpl,
  addInterventionDetailsSection as _addInterventionDetailsSectionImpl,
} from './pdf/sections/correctiveSections';
import {
  addEmployeeSection as _addEmployeeSectionImpl,
  addWarningDetailsSection as _addWarningDetailsSectionImpl,
  addIncidentDetailsSection as _addIncidentDetailsSectionImpl,
} from './pdf/sections/baseInfoSections';
import {
  addPreviousDisciplinaryActionSection as _addPreviousDisciplinaryActionSectionImpl,
  addPreviousDisciplinaryActionSection_v1_0_0 as _addPreviousDisciplinaryActionSection_v1_0_0_Impl,
} from './pdf/sections/disciplinaryHistorySections';
import {
  addConsequencesSection as _addConsequencesSectionImpl,
  addLegalComplianceSection as _addLegalComplianceSectionImpl,
  addAdditionalNotesSection as _addAdditionalNotesSectionImpl,
} from './pdf/sections/complianceSections';
import {
  addSignaturesSection as _addSignaturesSectionImpl,
  addDeliverySection as _addDeliverySectionImpl,
  addAppealHistorySection as _addAppealHistorySectionImpl,
  addDocumentFooter as _addDocumentFooterImpl,
  addContinuationHeaders as _addContinuationHeadersImpl,
} from './pdf/sections/signatureSections';
import { addEmployeeRightsSection as _addEmployeeRightsSectionImpl } from './pdf/sections/employeeRightsSection';
import {
  renderDynamicSection as _renderDynamicSectionImpl,
  renderTableSection as _renderTableSectionImpl,
} from './pdf/dynamic/DynamicSectionRenderer';
import {
  prepareLogoForPDF as _prepareLogoForPDFImpl,
  addLogoWithAspectRatio as _addLogoWithAspectRatioImpl,
  addOrganizationHeader as _addOrganizationHeaderImpl,
  addStackedHeader as _addStackedHeaderImpl,
  addClassicHeader as _addClassicHeaderImpl,
  addBannerHeader as _addBannerHeaderImpl,
} from './pdf/pageUtils/headers';
import { addDocumentTitle as _addDocumentTitleImpl } from './pdf/pageUtils/documentTitle';
import { convertSignatureToPNG as _convertSignatureToPNGImpl } from './pdf/signatureConverter';
import { generateWarningPDF_v1_0_0 as _generateWarningPDF_v1_0_0_Impl } from './pdf/versions/v1_0_0';
import { generateWarningPDF_v1_1_0 as _generateWarningPDF_v1_1_0_Impl } from './pdf/versions/v1_1_0';
import { replacePlaceholders as _replacePlaceholdersImpl } from './pdf/utils';
import { calculateIncidentSectionHeight as _calculateIncidentSectionHeightImpl } from './pdf/utils';
import {
  formatDate as _formatDateImpl,
  hexToRGB as _hexToRGBImpl,
  parseColor as _parseColorImpl,
  getWarningLevelDisplay as _getWarningLevelDisplayImpl,
  getWarningLevelTitle as _getWarningLevelTitleImpl,
  wrapText as _wrapTextImpl,
  checkPageOverflow as _checkPageOverflowImpl,
} from './pdf/utils';

// ============================================
// INTERFACES MATCHING YOUR WARNING WIZARD DATA
// ============================================

export interface WarningPDFData {
  // Core identifiers
  warningId: string;
  issuedDate: Date;
  organizationId?: string;
  status?: string; // Warning status (e.g., 'issued', 'overturned', 'expired')
  issuedByName?: string; // Manager name who issued the warning

  // Employee information (from selectedEmployee)
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    position: string;
    email?: string;
    phone?: string;
  };

  // Warning classification
  warningLevel: string;
  category: string;

  // Incident details (from your formData)
  incidentDate: Date;
  incidentTime: string;
  incidentLocation: string;
  description: string;
  
  // Organization branding
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    registrationNumber?: string;
    branding?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
      logo?: string;
      companyName?: string;
    };
  };
  
  // Optional sections
  signatures?: {
    manager?: string | null;
    employee?: string | null;
  };
  
  additionalNotes?: string;
  validityPeriod?: number;

  // Corrective counselling sections (unified warning/counselling approach)
  employeeStatement?: string; // Section B: Employee's version of events
  expectedBehaviorStandards?: string; // Section C: Required/Expected behavior & standards
  factsLeadingToDecision?: string; // Section E: Facts & reasoning for disciplinary action
  improvementCommitments?: Array<{ // Section F: Action steps & improvement commitments
    commitment: string;
    timeline: string;
  }>;
  reviewDate?: Date; // Follow-up review date
  interventionDetails?: string; // Training/coaching provided

  // AI/LRA recommendation data
  disciplineRecommendation?: {
    suggestedLevel: string;
    reason: string;
    warningCount: number;
    activeWarnings: any[];
    legalRequirements: string[];
  };
  
  // Legal compliance
  legalCompliance?: {
    isCompliant: boolean;
    framework: string;
    requirements: string[];
  };
  
  // Delivery information
  deliveryChoice?: {
    method: string;
    timestamp: Date;
    chosenBy: string;
    contactDetails?: any;
  };

  // Appeal information
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

// ============================================
// MAIN PDF GENERATION SERVICE
// ============================================

export class PDFGenerationService {

  /**
   * 🔄 SIGNATURE FORMAT CONVERTER — delegate. Implementation extracted to
   * `pdf/signatureConverter.ts` in Phase 2 Tier 3B step 7. Kept as an
   * instance method for back-compat with the `new PDFGenerationService()`
   * call sites inside the frozen version methods.
   */
  private async convertSignatureToPNG(signature: string): Promise<string> {
    return _convertSignatureToPNGImpl(signature);
  }

  /**
   * 🎯 MAIN PDF GENERATION METHOD - VERSIONED & RESILIENT
   *
   * This is the entry point for ALL PDF generation in the system.
   * It routes requests to the appropriate versioned handler.
   *
   * HOW VERSIONING WORKS:
   * - New warnings: Use PDF_GENERATOR_VERSION (currently 1.1.0)
   * - Old warnings: Use stored pdfGeneratorVersion from Firestore (e.g., 1.0.0)
   * - This ensures old warnings regenerate identically years later
   *
   * WHEN TO UPDATE ROUTING:
   * When you create a new version (e.g., v1.2.0), add a new case to the
   * switch statement below. DO NOT remove old cases - they must remain
   * forever to support historical warnings.
   *
   * @param data - Warning data to generate PDF from
   * @param requestedVersion - Specific version to use (for regenerating old warnings)
   *                          If not provided, uses PDF_GENERATOR_VERSION (current)
   * @param customSettings - Optional per-organization PDF template settings (Phase 6)
   *                        If not provided, uses default styling
   * @returns PDF blob
   */
  static async generateWarningPDF(
    data: WarningPDFData,
    requestedVersion?: string,
    customSettings?: any
  ): Promise<Blob> {
    // 🔒 VERSION ROUTING: Use requested version or current version
    const version = requestedVersion || PDF_GENERATOR_VERSION;

    Logger.debug('📄 PDF Generation requested:', {
      warningId: data.warningId,
      requestedVersion: requestedVersion || 'current',
      actualVersion: version
    });

    // 🔒 VERSION ROUTING SWITCH
    // ⚠️ NEVER remove cases from this switch statement
    // Each case must remain forever to support historical warnings
    // When adding new versions, add new cases but KEEP all existing ones
    switch (version) {
      case '1.0.0':
        // FROZEN: Used by warnings created before 2025-10-14
        // Note: Frozen versions ignore customSettings to maintain consistency
        return this.generateWarningPDF_v1_0_0(data);

      case '1.1.0':
        // FROZEN: Used by warnings created 2025-10-14 to 2025-10-15
        // Pass customSettings for per-organization PDF customization
        return this.generateWarningPDF_v1_1_0(data, customSettings);

      case '1.2.0':
        // CURRENT: Used by all new warnings (2025-10-15 onwards)
        // Dynamic section rendering with {{placeholder}} support
        return this.generateWarningPDF_v1_2_0(data, customSettings);

      default:
        // Fallback for unknown versions - use current version
        Logger.warn(`⚠️ Unsupported PDF generator version: ${version}, falling back to current`);
        return this.generateWarningPDF_v1_2_0(data, customSettings);
    }
  }

  /**
   * 🔒 VERSION 1.0.0 — FROZEN delegate. Implementation moved verbatim to
   * `pdf/versions/v1_0_0.ts` in Phase 2 Tier 3B step 7. The body there is
   * byte-identical to the original; only `this.X` helper calls were swapped
   * for direct imports of the same impls.
   */
  private static async generateWarningPDF_v1_0_0(data: WarningPDFData): Promise<Blob> {
    return _generateWarningPDF_v1_0_0_Impl(data);
  }

  /**
   * 🔒 VERSION 1.1.0 — FROZEN delegate. Implementation moved verbatim to
   * `pdf/versions/v1_1_0.ts` in Phase 2 Tier 3B step 7. Body is byte-identical
   * to the original; only `this.X` helper calls were swapped for direct
   * imports of the same impls. Accepts optional `customSettings` for
   * per-organization styling (Phase 6).
   */
  private static async generateWarningPDF_v1_1_0(data: WarningPDFData, customSettings?: any): Promise<Blob> {
    return _generateWarningPDF_v1_1_0_Impl(data, customSettings);
  }

  /**
   * Replace placeholders in text with actual data — delegate. Implementation
   * extracted to `pdf/utils.ts` in Phase 2 Tier 3B step 5d.
   */
  private static replacePlaceholders(text: string, data: WarningPDFData): string {
    return _replacePlaceholdersImpl(text, data);
  }

  /**
   * 🆕🆕🆕 VERSION 1.2.0 - DYNAMIC SECTION RENDERING 🆕🆕🆕
   *
   * ✨ NEW FEATURES:
   * - Reads section configurations from customSettings.sections[]
   * - Renders sections dynamically in specified order
   * - Replaces {{placeholders}} with actual warning data
   * - Supports custom fields, bullet points, and tables
   * - Per-section styling overrides
   *
   * ⚠️ WHEN THIS VERSION IS FROZEN:
   * Once v1.3.0 is released, this method must NOT be modified.
   * Create v1.3.0 instead with your changes.
   *
   * Format:
   * - Dynamic sections based on customSettings.sections[] configuration
   * - Keeps core sections: org header, title, employee info, incident details, signatures
   * - Custom sections rendered between incident details and signatures
   *
   * Used by: All warnings created with pdfGeneratorVersion = '1.2.0' onwards
   * Created: 2025-10-15
   * Status: CURRENT
   *
   * @param data - Warning data
   * @param customSettings - Organization's PDF template settings with sections[] array
   */
  private static async generateWarningPDF_v1_2_0(data: WarningPDFData, customSettings?: any): Promise<Blob> {
    try {
      // 🚨 Memory check for legacy devices
      const capabilities = globalDeviceCapabilities || { isLegacyDevice: false };
      if (capabilities.isLegacyDevice) {
        Logger.warn('🚨 Legacy device detected - using simplified PDF generation');
        return this.generateSimplifiedPDF(data);
      }

      // 🔄 Convert SVG signatures to PNG for PDF embedding
      if (data.signatures) {
        const service = new PDFGenerationService();
        if (data.signatures.manager) {
          data.signatures.manager = await service.convertSignatureToPNG(data.signatures.manager);
        }
        if (data.signatures.employee) {
          data.signatures.employee = await service.convertSignatureToPNG(data.signatures.employee);
        }
        if ((data.signatures as any).witness) {
          (data.signatures as any).witness = await service.convertSignatureToPNG((data.signatures as any).witness);
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
        sections: undefined // Will be populated from customSettings
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
          processedLogo = await this.prepareLogoForPDF(rawLogoUrl);
          Logger.debug('✅ Logo pre-processed for PDF embedding');
        } catch (error) {
          Logger.warn('⚠️ Failed to pre-process logo, will skip:', error);
        }
      }
      currentY = this.addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin, {
        headerLayout: settings.content?.headerLayout || 'banner',
        logoMaxHeight: settings.content?.logoMaxHeight || 20,
        processedLogo,
      });

      // 2. Document Title
      Logger.debug('📝 Adding document title...');
      currentY = this.addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

      // 3. Employee Information
      Logger.debug('👤 Adding employee section...');
      currentY = this.addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);

      // 4. Warning Details
      Logger.debug('⚠️ Adding warning details section...');
      currentY = this.addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

      // 5. Incident Details
      Logger.debug('📋 Adding incident details section...');
      currentY = this.addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

      // === DYNAMIC SECTIONS (From configuration) ===
      // 🎨 INTELLIGENT SECTION ROUTING: Uses v1.1.0 methods for standard sections,
      // dynamic renderer only for custom sections. This preserves the beautiful
      // professional appearance of v1.1.0 while enabling full customization.

      if (settings.sections && settings.sections.length > 0) {
        Logger.debug(`🎨 Rendering ${settings.sections.length} configured sections with intelligent routing...`);

        // Sort sections by order
        const sortedSections = [...settings.sections].sort((a, b) => (a.order || 0) - (b.order || 0));

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
                  currentY = this.addPreviousDisciplinaryActionSection(
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
                currentY = this.addConsequencesSection(
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
                currentY = this.addEmployeeRightsSection(
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
                  currentY = this.addAppealHistorySection(
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
                  currentY = this.addEmployeeStatementSection(doc, data.employeeStatement, currentY, pageWidth, margin, pageHeight, bottomMargin);
                }
                break;

              case 'expected-behavior-standards':
                if (data.expectedBehaviorStandards) {
                  Logger.debug('📊 Rendering expected behavior section...');
                  currentY = this.addExpectedBehaviorSection(doc, data.expectedBehaviorStandards, currentY, pageWidth, margin, pageHeight, bottomMargin);
                }
                break;

              case 'facts-leading-to-decision':
                if (data.factsLeadingToDecision) {
                  Logger.debug('⚖️ Rendering facts leading to decision section...');
                  currentY = this.addFactsLeadingToDecisionSection(doc, data.factsLeadingToDecision, currentY, pageWidth, margin, pageHeight, bottomMargin);
                }
                break;

              case 'improvement-commitments':
                if (data.improvementCommitments && data.improvementCommitments.length > 0) {
                  Logger.debug('✅ Rendering improvement commitments section...');
                  currentY = this.addImprovementCommitmentsSection(doc, data.improvementCommitments, currentY, pageWidth, margin, pageHeight, bottomMargin);
                }
                break;

              case 'review-date':
                if (data.reviewDate) {
                  Logger.debug('📅 Rendering review date section...');
                  currentY = this.addReviewDateSection(doc, data.reviewDate, currentY, pageWidth, margin, pageHeight, bottomMargin);
                }
                break;

              default:
                Logger.warn(`Unknown standard section: ${section.id}, using dynamic renderer`);
                currentY = this.renderDynamicSection(
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
            currentY = this.renderDynamicSection(
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
          currentY = this.addPreviousDisciplinaryActionSection(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
          currentY = this.addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }

        // Corrective discussion sections
        if (data.employeeStatement) {
          currentY = this.addEmployeeStatementSection(doc, data.employeeStatement, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }
        if (data.expectedBehaviorStandards) {
          currentY = this.addExpectedBehaviorSection(doc, data.expectedBehaviorStandards, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }
        if (data.factsLeadingToDecision) {
          currentY = this.addFactsLeadingToDecisionSection(doc, data.factsLeadingToDecision, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }
        if (data.improvementCommitments && data.improvementCommitments.length > 0) {
          currentY = this.addImprovementCommitmentsSection(doc, data.improvementCommitments, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }
        if (data.reviewDate) {
          currentY = this.addReviewDateSection(doc, data.reviewDate, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }

        if (data.legalCompliance) {
          currentY = this.addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }

        if (data.additionalNotes) {
          currentY = this.addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
        }

        currentY = this.addEmployeeRightsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      // === CORE SECTIONS (Always rendered) ===

      // 9. Signatures Section
      Logger.debug('✍️ Adding signatures section...');
      currentY = this.addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin, data.issuedDate, data.issuedByName);

      // 10. Appeal Report (if applicable)
      if (data.appealDetails) {
        Logger.debug('📋 Adding appeal report...');
        await this.addAppealReportSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      // 10.6. Continuation headers on page 2+
      this.addContinuationHeaders(doc, data);

      // 11. Footer
      Logger.debug('🦶 Adding document footer...');
      this.addDocumentFooter(doc, data, pageWidth, {
        footerText: settings.content.footerText,
        showPageNumbers: settings.content.showPageNumbers,
      });

      // 12. Security watermark
      if (settings.content.showWatermark) {
        Logger.debug('🛡️ Adding security watermark...');
        this.addSecurityWatermark(doc, pageWidth, {
          watermarkText: settings.content.watermarkText,
          watermarkOpacity: settings.content.watermarkOpacity,
        });
      }

      // 13. "OVERTURNED" watermark if applicable
      if (data.status === 'overturned') {
        Logger.debug('🚫 Adding OVERTURNED watermark...');
        this.addOverturnedWatermark(doc, pageWidth);
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

  // ============================================
  // PAGE UTILITIES (logo, headers, document title)
  // Implementations extracted to pdf/pageUtils/* in Phase 2 Tier 3B step 6.
  // Class delegates preserve `this.X(...)` call sites inside frozen v1.0.0/
  // v1.1.0/v1.2.0 version methods.
  // ============================================

  /** Prepare a logo URL into a PNG data URL for jsPDF embedding — delegate. */
  private static async prepareLogoForPDF(
    logoSrc: string,
    maxWidth = 800,
    maxHeight = 400
  ): Promise<string> {
    return _prepareLogoForPDFImpl(logoSrc, maxWidth, maxHeight);
  }

  /** Add a logo preserving aspect ratio — delegate. Returns rendered {w,h} in mm. */
  private static addLogoWithAspectRatio(
    doc: any,
    logo: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    return _addLogoWithAspectRatioImpl(doc, logo, x, y, maxWidth, maxHeight);
  }

  /** Organization Header — dispatches to one of 3 layouts — delegate. */
  private static addOrganizationHeader(
    doc: any,
    organization: WarningPDFData['organization'],
    startY: number,
    pageWidth: number,
    margin: number,
    headerSettings?: {
      headerLayout?: 'stacked' | 'classic' | 'banner';
      logoMaxHeight?: number;
      processedLogo?: string;
    }
  ): number {
    return _addOrganizationHeaderImpl(doc, organization, startY, pageWidth, margin, headerSettings);
  }

  /** Layout A: Stacked header — delegate. */
  private static addStackedHeader(
    doc: any,
    organization: WarningPDFData['organization'],
    companyName: string,
    detailsLine: string,
    regLine: string,
    headerColor: { r: number; g: number; b: number },
    startY: number,
    pageWidth: number,
    margin: number,
    contentWidth: number,
    logoMaxHeight: number
  ): number {
    return _addStackedHeaderImpl(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
  }

  /** Layout B: Classic Letterhead — delegate. */
  private static addClassicHeader(
    doc: any,
    organization: WarningPDFData['organization'],
    companyName: string,
    detailsLine: string,
    regLine: string,
    headerColor: { r: number; g: number; b: number },
    startY: number,
    pageWidth: number,
    margin: number,
    contentWidth: number,
    logoMaxHeight: number
  ): number {
    return _addClassicHeaderImpl(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
  }

  /** Layout C: Banner (default, matches frozen v1.0.0/v1.1.0 output) — delegate. */
  private static addBannerHeader(
    doc: any,
    organization: WarningPDFData['organization'],
    companyName: string,
    detailsLine: string,
    regLine: string,
    headerColor: { r: number; g: number; b: number },
    startY: number,
    pageWidth: number,
    margin: number,
    contentWidth: number,
    logoMaxHeight: number
  ): number {
    return _addBannerHeaderImpl(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
  }

  /** Document Title block (title + validity + draft indicator + doc ID) — delegate. */
  private static addDocumentTitle(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addDocumentTitleImpl(doc, data, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  // ============================================
  // BASE INFO SECTIONS (Employee, Warning Details, Incident Details)
  // Implementations extracted to pdf/sections/baseInfoSections.ts in
  // Phase 2 Tier 3B step 5b. Delegates preserve internal call sites.
  // ============================================

  /** Employee Information Section — delegate. */
  private static addEmployeeSection(
    doc: any,
    employee: WarningPDFData['employee'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addEmployeeSectionImpl(doc, employee, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Warning Details Section — delegate. */
  private static addWarningDetailsSection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addWarningDetailsSectionImpl(doc, data, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Incident Details Section — delegate. */
  private static addIncidentDetailsSection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addIncidentDetailsSectionImpl(doc, data, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  // ============================================
  // DISCIPLINARY HISTORY SECTIONS
  // Implementations extracted to pdf/sections/disciplinaryHistorySections.ts
  // in Phase 2 Tier 3B step 5c. The v1_0_0 variant is FROZEN and must
  // remain byte-identical to its original — the delegate guarantees that.
  // ============================================

  /** Previous Disciplinary Action Section (v1.1.0+ format: shows Incident) — delegate. */
  private static addPreviousDisciplinaryActionSection(
    doc: any,
    recommendation: WarningPDFData['disciplineRecommendation'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    sectionConfig?: PDFSectionConfig
  ): number {
    return _addPreviousDisciplinaryActionSectionImpl(
      doc, recommendation, startY, pageWidth, margin, pageHeight, bottomMargin, sectionConfig
    );
  }

  /** 🔒 FROZEN v1.0.0 Previous Disciplinary Action (shows Offense=category) — delegate. */
  private static addPreviousDisciplinaryActionSection_v1_0_0(
    doc: any,
    recommendation: WarningPDFData['disciplineRecommendation'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addPreviousDisciplinaryActionSection_v1_0_0_Impl(
      doc, recommendation, startY, pageWidth, margin, pageHeight, bottomMargin
    );
  }

  // ============================================
  // COMPLIANCE SECTIONS (Consequences, Legal, Notes)
  // Implementations extracted to pdf/sections/complianceSections.ts in
  // Phase 2 Tier 3B step 5d.
  // ============================================

  /** Consequences Section (template-driven red warning box) — delegate. */
  private static addConsequencesSection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    sectionConfig?: PDFSectionConfig
  ): number {
    return _addConsequencesSectionImpl(
      doc, data, startY, pageWidth, margin, pageHeight, bottomMargin, sectionConfig
    );
  }

  /** Legal Compliance Section — delegate. */
  private static addLegalComplianceSection(
    doc: any,
    legalCompliance: WarningPDFData['legalCompliance'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addLegalComplianceSectionImpl(doc, legalCompliance, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Additional Notes Section — delegate. */
  private static addAdditionalNotesSection(
    doc: any,
    notes: string,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addAdditionalNotesSectionImpl(doc, notes, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  // ============================================
  // CORRECTIVE DISCUSSION SECTIONS (B, C, E, F)
  // Implementations extracted to pdf/sections/correctiveSections.ts in
  // Phase 2 Tier 3B step 5. Delegates preserve `this.X(...)` call sites
  // inside frozen v1.0.0/v1.1.0/v1.2.0 methods.
  // ============================================

  /** Section B: Employee's Version of Events — delegate. */
  private static addEmployeeStatementSection(
    doc: any,
    statement: string,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addEmployeeStatementSectionImpl(doc, statement, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Section C: Required/Expected Behavior & Standards — delegate. */
  private static addExpectedBehaviorSection(
    doc: any,
    standards: string,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addExpectedBehaviorSectionImpl(doc, standards, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Section E: Facts & Reasoning for Disciplinary Action — delegate. */
  private static addFactsLeadingToDecisionSection(
    doc: any,
    facts: string,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addFactsLeadingToDecisionSectionImpl(doc, facts, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Section F: Action Steps & Improvement Commitments — delegate. */
  private static addImprovementCommitmentsSection(
    doc: any,
    commitments: Array<{ commitment: string; timeline: string }>,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addImprovementCommitmentsSectionImpl(doc, commitments, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Review Date and Auto-Satisfaction Clause — delegate. */
  private static addReviewDateSection(
    doc: any,
    reviewDate: Date,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    warningLevel?: string
  ): number {
    return _addReviewDateSectionImpl(doc, reviewDate, startY, pageWidth, margin, pageHeight, bottomMargin, warningLevel);
  }

  /** Training/Coaching Provided — delegate. */
  private static addInterventionDetailsSection(
    doc: any,
    interventionDetails: string,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addInterventionDetailsSectionImpl(doc, interventionDetails, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /**
   * Employee Rights and Next Steps Section — delegate. Implementation
   * extracted to `pdf/sections/employeeRightsSection.ts` in Phase 2 Tier 3B
   * step 5f. REQUIRES sectionConfig with subsections.
   */
  private static addEmployeeRightsSection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    sectionConfig?: PDFSectionConfig
  ): number {
    return _addEmployeeRightsSectionImpl(
      doc, data, startY, pageWidth, margin, pageHeight, bottomMargin, sectionConfig
    );
  }

  // ============================================
  // END-OF-DOCUMENT SECTIONS (Signatures, Delivery, Appeal, Footer,
  // Continuation Headers). Implementations extracted to
  // pdf/sections/signatureSections.ts in Phase 2 Tier 3B step 5e.
  // ============================================

  /** Signatures Section (manager + employee + optional witness) — delegate. */
  private static addSignaturesSection(
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
    return _addSignaturesSectionImpl(
      doc, signatures, employee, startY, pageWidth, margin, pageHeight, bottomMargin, issuedDate, managerName
    );
  }

  /** Delivery Information Section — delegate. */
  private static addDeliverySection(
    doc: any,
    delivery: WarningPDFData['deliveryChoice'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addDeliverySectionImpl(doc, delivery, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Appeal History Section (employee submission + HR decision) — delegate. */
  private static addAppealHistorySection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _addAppealHistorySectionImpl(doc, data, startY, pageWidth, margin, pageHeight, bottomMargin);
  }

  /** Document Footer (LRA notice + page numbers + initials) — delegate. */
  private static addDocumentFooter(
    doc: any,
    data: WarningPDFData,
    pageWidth: number,
    footerSettings?: { footerText?: string; showPageNumbers?: boolean }
  ): void {
    _addDocumentFooterImpl(doc, data, pageWidth, footerSettings);
  }

  /** Continuation headers on pages 2..N — delegate. */
  private static addContinuationHeaders(doc: any, data: WarningPDFData): void {
    _addContinuationHeadersImpl(doc, data);
  }

  /**
   * Security Watermark - Multi-page aware.
   * Implementation extracted to `pdf/watermarks.ts` in Phase 2 Tier 3B step 3;
   * this delegate preserves the `this.addSecurityWatermark(...)` call sites
   * inside frozen v1.0.0/v1.1.0 methods.
   */
  private static addSecurityWatermark(
    doc: any, pageWidth: number,
    watermarkSettings?: { watermarkText?: string; watermarkOpacity?: number }
  ): void {
    _addSecurityWatermarkImpl(doc, pageWidth, watermarkSettings);
  }

  /**
   * OVERTURNED Watermark - delegate (see addSecurityWatermark for context).
   */
  private static addOverturnedWatermark(doc: any, pageWidth: number): void {
    _addOverturnedWatermarkImpl(doc, pageWidth);
  }

  /**
   * 📋 Appeal Decision Report — Thin proxy. Implementation lives in
   * `services/pdf/AppealReportGenerator.ts` since Phase 2 Tier 3B (first move).
   * Kept here for back-compat with callers that haven't migrated to the new
   * import path.
   */
  static async generateAppealReportPDF(data: AppealReportData): Promise<Blob> {
    return _generateAppealReportPDF(data);
  }

  // ============================================
  // PAGE MANAGEMENT UTILITIES
  // ============================================
  
  /**
   * Check if content will fit on current page, add new page if needed
   */
  private static checkPageOverflow(
    doc: any,
    currentY: number,
    requiredHeight: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    return _checkPageOverflowImpl(doc, currentY, requiredHeight, pageHeight, bottomMargin);
  }

  // ============================================
  // 🆕 DYNAMIC SECTION RENDERER - v1.2.0+
  // Implementations extracted to pdf/dynamic/DynamicSectionRenderer.ts in
  // Phase 2 Tier 3B step 5f.
  // ============================================

  /** Dynamic section renderer (template-driven, supports body/bullets/tables) — delegate. */
  private static renderDynamicSection(
    doc: any,
    section: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    defaultSettings: any
  ): number {
    return _renderDynamicSectionImpl(
      doc, section, data, startY, pageWidth, margin, pageHeight, bottomMargin, defaultSettings
    );
  }

  /** Table renderer used inside renderDynamicSection — delegate. */
  private static renderTableSection(
    doc: any,
    tableData: { headers: string[]; rows: string[][] },
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    styling: any
  ): number {
    return _renderTableSectionImpl(
      doc, tableData, data, startY, pageWidth, margin, pageHeight, bottomMargin, styling
    );
  }

  /**
   * 🆕 HEX TO RGB CONVERTER
   *
   * Convert hex color to RGB values for jsPDF
   */
  private static hexToRGB(hex: string): { r: number; g: number; b: number } {
    return _hexToRGBImpl(hex);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get warning level display name
   */
  private static getWarningLevelDisplay(level: string): string {
    return _getWarningLevelDisplayImpl(level);
  }

  /**
   * Get warning level document title
   */
  private static getWarningLevelTitle(level: string): string {
    return _getWarningLevelTitleImpl(level);
  }
  
  /**
   * Format date consistently. Implementation extracted to `pdf/utils.ts` in
   * Phase 2 Tier 3B; this delegate keeps the 28 internal `this.formatDate`
   * call sites (many inside frozen v1.0.0/v1.1.0 methods) working unchanged.
   */
  private static formatDate(date: Date | any): string {
    return _formatDateImpl(date);
  }
  
  /**
   * Wrap text to fit within specified width
   * 🔥 HANDLES NEWLINES: Preserves paragraph structure and bullet points
   */
  private static wrapText(doc: any, text: string, maxWidth: number): string[] {
    return _wrapTextImpl(doc, text, maxWidth);
  }
  
  /**
   * Calculate incident section height — delegate. Implementation extracted to
   * `pdf/utils.ts` in Phase 2 Tier 3B step 5b.
   */
  private static calculateIncidentSectionHeight(
    doc: any,
    data: WarningPDFData,
    pageWidth: number,
    margin: number
  ): number {
    return _calculateIncidentSectionHeightImpl(doc, data, pageWidth, margin);
  }
  
  /**
   * Parse color string to RGB
   */
  private static parseColor(colorString?: string): { r: number; g: number; b: number } | null {
    return _parseColorImpl(colorString);
  }

  /**
   * 🚨 SIMPLIFIED PDF GENERATION FOR 2012-ERA DEVICES — delegate.
   * Implementation extracted to `pdf/SimplifiedPDFGenerator.ts` in Phase 2
   * Tier 3B step 4; preserves the `this.generateSimplifiedPDF(...)` call sites
   * inside frozen v1.0.0/v1.1.0/v1.2.0 methods.
   */
  static async generateSimplifiedPDF(data: WarningPDFData): Promise<Blob> {
    return _generateSimplifiedPDFImpl(data);
  }

  /**
   * 🚨 PLAIN TEXT PDF FALLBACK — delegate. See {@link generateSimplifiedPDF}.
   */
  static async generatePlainTextPDF(data: WarningPDFData): Promise<Blob> {
    return _generatePlainTextPDFImpl(data);
  }
}