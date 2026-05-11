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
import { convertSVGToPNG, isSignatureSVG } from '../utils/signatureSVG';

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
   * 🔄 SIGNATURE FORMAT CONVERTER
   * Converts SVG signatures to PNG for PDF embedding
   * jsPDF doesn't support SVG natively, so we convert on-the-fly
   */
  private async convertSignatureToPNG(signature: string): Promise<string> {
    if (!signature) return signature;

    // If already PNG or other format, return as-is
    if (!isSignatureSVG(signature)) {
      return signature;
    }

    try {
      // Convert SVG to PNG using canvas rendering
      const pngSignature = await convertSVGToPNG(signature, 600, 300);
      return pngSignature;
    } catch (error) {
      Logger.error('Failed to convert SVG signature to PNG for PDF:', error);
      // Return original signature (will likely fail in PDF, but better than nothing)
      return signature;
    }
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
   * 🔒🔒🔒 VERSION 1.0.0 - FROZEN LEGACY VERSION 🔒🔒🔒
   *
   * ⚠️ CRITICAL WARNING: DO NOT MODIFY THIS METHOD ⚠️
   *
   * This method is FROZEN and must remain unchanged. It is used to regenerate
   * all warnings created before 2025-10-14. Any changes to this method will
   * cause historical warnings to regenerate differently, breaking legal compliance.
   *
   * Format:
   * - Previous Action shows: Date | Offense (Category) | Level
   *
   * If you need to fix bugs or make changes:
   * 1. DO NOT modify this method
   * 2. Create a new version (e.g., v1.2.0)
   * 3. Copy this method to the new version
   * 4. Make changes in the new version only
   * 5. Update PDF_GENERATOR_VERSION constant
   *
   * Used by: All warnings with pdfGeneratorVersion = '1.0.0'
   * Created: 2025-10-14
   * Status: FROZEN - DO NOT MODIFY
   */
  private static async generateWarningPDF_v1_0_0(data: WarningPDFData): Promise<Blob> {
    try {
      // Same implementation as v1.1.0, but with different Previous Action format
      const capabilities = globalDeviceCapabilities || { isLegacyDevice: false };
      const limits = getPerformanceLimits(capabilities);

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
      currentY = this.addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin);
      currentY = this.addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      currentY = this.addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);
      currentY = this.addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      currentY = this.addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

      // 🔒 VERSION 1.0.0 DIFFERENCE: Use old Previous Action format
      if (data.disciplineRecommendation) {
        currentY = this.addPreviousDisciplinaryActionSection_v1_0_0(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
        currentY = this.addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      if (data.legalCompliance) {
        currentY = this.addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      if (data.additionalNotes) {
        currentY = this.addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      currentY = this.addEmployeeRightsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      currentY = this.addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin, data.issuedDate, data.issuedByName);

      if (data.deliveryChoice) {
        currentY = this.addDeliverySection(doc, data.deliveryChoice, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      if (data.appealDetails || data.appealOutcome) {
        currentY = this.addAppealHistorySection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      this.addDocumentFooter(doc, data, pageWidth);
      this.addSecurityWatermark(doc, pageWidth);

      if (data.status === 'overturned') {
        this.addOverturnedWatermark(doc, pageWidth);
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

  /**
   * 🔒🔒🔒 VERSION 1.1.0 - FROZEN VERSION 🔒🔒🔒
   *
   * ⚠️ CRITICAL WARNING: DO NOT MODIFY THIS METHOD ⚠️
   *
   * This method is FROZEN and must remain unchanged. It is used to regenerate
   * all warnings created between 2025-10-14 and 2025-10-15. Any changes to this
   * method will cause historical warnings to regenerate differently, breaking
   * legal compliance.
   *
   * Format:
   * - Previous Action shows: Date | Incident Description | Level
   * - Supports customSettings for per-organization styling
   *
   * Used by: All warnings with pdfGeneratorVersion = '1.1.0'
   * Created: 2025-10-14
   * Frozen: 2025-10-15
   * Status: FROZEN
   *
   * @param customSettings - Optional per-organization PDF template settings (Phase 6)
   */
  private static async generateWarningPDF_v1_1_0(data: WarningPDFData, customSettings?: any): Promise<Blob> {
    try {
      // 🚨 Memory check for legacy devices
      const capabilities = globalDeviceCapabilities || { isLegacyDevice: false };
      const limits = getPerformanceLimits(capabilities);

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
      currentY = this.addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin);
      Logger.success(4172)
      
      // 2. Document Title with Draft Indicator
      Logger.debug('📝 Adding document title...')
      currentY = this.addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(4459)
      
      // 3. Employee Information Section (Resilient)
      Logger.debug('👤 Adding employee section...')
      currentY = this.addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(4759)
      
      // 4. Warning Details Section (Resilient)
      Logger.debug('⚠️ Adding warning details section...')
      currentY = this.addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(5060)
      
      // 5. Incident Details Section (Resilient to Empty Fields)
      Logger.debug('📋 Adding incident details section...')
      currentY = this.addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success(5387)

      // 5.1. Corrective Counselling Sections (Unified Warning/Counselling Approach)
      // Section B: Employee's Statement
      if (data.employeeStatement) {
        Logger.debug('💬 Adding employee statement section...')
        currentY = this.addEmployeeStatementSection(doc, data.employeeStatement, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Employee statement section added')
      }

      // Section C: Expected Behavior & Standards
      if (data.expectedBehaviorStandards) {
        Logger.debug('📊 Adding expected behavior section...')
        currentY = this.addExpectedBehaviorSection(doc, data.expectedBehaviorStandards, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Expected behavior section added')
      }

      // Section E: Facts Leading to Decision
      if (data.factsLeadingToDecision) {
        Logger.debug('⚖️ Adding facts leading to decision section...')
        currentY = this.addFactsLeadingToDecisionSection(doc, data.factsLeadingToDecision, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Facts leading to decision section added')
      }

      // 6. Previous Disciplinary Action + Consequences (if available)
      if (data.disciplineRecommendation) {
        Logger.debug('📋 Adding previous disciplinary action section...')
        currentY = this.addPreviousDisciplinaryActionSection(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Previous disciplinary action section added')

        Logger.debug('⚠️ Adding consequences section...')
        currentY = this.addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Consequences section added')
      } else {
        Logger.debug('⏭️ Skipping progressive discipline sections (no data)');
      }
      
      // 7. Legal Compliance Section
      if (data.legalCompliance) {
        Logger.debug('⚖️ Adding legal compliance section...')
        currentY = this.addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success(6262)
      } else {
        Logger.debug('⏭️ Skipping legal compliance section (no data)');
      }
      
      // 8. Additional Notes Section
      if (data.additionalNotes) {
        Logger.debug('📝 Adding additional notes section...')
        currentY = this.addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success(6716)
      } else {
        Logger.debug('⏭️ Skipping additional notes section (no data)');
      }

      // 8.1. More Corrective Counselling Sections
      // Section F: Improvement Commitments
      if (data.improvementCommitments && data.improvementCommitments.length > 0) {
        Logger.debug('✅ Adding improvement commitments section...')
        currentY = this.addImprovementCommitmentsSection(doc, data.improvementCommitments, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Improvement commitments section added')
      }

      // Review Date and Auto-Satisfaction Clause
      if (data.reviewDate) {
        Logger.debug('📅 Adding review date and auto-satisfaction clause section...')
        currentY = this.addReviewDateSection(doc, data.reviewDate, currentY, pageWidth, margin, pageHeight, bottomMargin, data.warningLevel);
        Logger.success('✅ Review date and auto-satisfaction clause section added')
      }

      // Intervention Details
      if (data.interventionDetails) {
        Logger.debug('🎓 Adding intervention details section...')
        currentY = this.addInterventionDetailsSection(doc, data.interventionDetails, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Intervention details section added')
      }

      // 8.5. Employee Rights and Next Steps Section - LRA Compliant
      Logger.debug('⚖️ Adding employee rights and next steps section...')
      currentY = this.addEmployeeRightsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      Logger.success('✅ Employee rights section added')

      // 9. Signatures Section - Always add, even if no digital signatures
      Logger.debug('✍️ Adding signatures section...')
      currentY = this.addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin, data.issuedDate, data.issuedByName);
      Logger.success(7166)
      
      // 10. Delivery Information (if available)
      if (data.deliveryChoice) {
        Logger.debug('📮 Adding delivery section...')
        currentY = this.addDeliverySection(doc, data.deliveryChoice, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success(7512)
      } else {
        Logger.debug('⏭️ Skipping delivery section (no data)');
      }

      // 10.5. Appeal History Section (if appeal was submitted or decided)
      if (data.appealDetails || data.appealOutcome) {
        Logger.debug('⚖️ Adding appeal history section...')
        currentY = this.addAppealHistorySection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
        Logger.success('✅ Appeal history section added')
      } else {
        Logger.debug('⏭️ Skipping appeal history section (no data)');
      }

      // 10.6. Continuation headers on page 2+
      this.addContinuationHeaders(doc, data);

      // 11. Footer
      Logger.debug('🦶 Adding document footer...')
      this.addDocumentFooter(doc, data, pageWidth);
      Logger.success(7804)
      
      // 12. Security features
      Logger.debug('🛡️ Adding security watermark...')
      this.addSecurityWatermark(doc, pageWidth);
      Logger.success(7997)

      // 13. Add "OVERTURNED" watermark if warning was overturned
      if (data.status === 'overturned') {
        Logger.debug('🚫 Adding OVERTURNED watermark...')
        this.addOverturnedWatermark(doc, pageWidth);
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
  // SECTION BUILDERS - RESILIENT VERSIONS
  // ============================================

  /**
   * Pre-process a logo URL into a PNG data URL sized for PDF embedding.
   * Handles remote URLs, data URLs, and any image format the browser supports.
   * Returns a PNG data URL that jsPDF can reliably render.
   */
  private static async prepareLogoForPDF(
    logoSrc: string,
    maxWidth = 800,
    maxHeight = 400
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load logo image'));
      img.src = logoSrc;
    });
  }

  /**
   * Add logo to PDF preserving aspect ratio within max bounds.
   * Returns actual rendered { width, height } in mm.
   */
  private static addLogoWithAspectRatio(
    doc: any,
    logo: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const imgProps = doc.getImageProperties(logo);
    const imgWidth = imgProps.width;
    const imgHeight = imgProps.height;
    const aspectRatio = imgWidth / imgHeight;

    let finalWidth = maxWidth;
    let finalHeight = maxWidth / aspectRatio;

    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = maxHeight * aspectRatio;
    }

    doc.addImage(logo, 'PNG', x, y, finalWidth, finalHeight);
    return { width: finalWidth, height: finalHeight };
  }

  /**
   * Organization Header with Branding — supports 3 configurable layouts.
   *
   * When called without headerSettings (v1.0.0 / v1.1.0 frozen callers),
   * defaults to 'banner' layout to preserve backward compatibility.
   */
  private static addOrganizationHeader(
    doc: any,
    organization: WarningPDFData['organization'],
    startY: number,
    pageWidth: number,
    margin: number,
    headerSettings?: {
      headerLayout?: 'stacked' | 'classic' | 'banner';
      logoMaxHeight?: number;
      processedLogo?: string; // Pre-processed PNG data URL ready for jsPDF
    }
  ): number {
    const layout = headerSettings?.headerLayout || 'banner';
    const logoMaxHeight = headerSettings?.logoMaxHeight || 20;
    const headerColor = this.parseColor(organization.branding?.colors?.primary) || { r: 59, g: 130, b: 246 };
    const companyName = organization.branding?.companyName || organization.name || 'Organization Name';
    const contentWidth = pageWidth - margin * 2;

    // Use pre-processed logo (PNG data URL) if available
    if (headerSettings?.processedLogo) {
      organization = {
        ...organization,
        branding: { ...organization.branding, logo: headerSettings.processedLogo }
      };
    }

    // Build contact details — collapse multi-line addresses into single line
    const details: string[] = [];
    if (organization.address) {
      // Replace newlines/carriage returns with ", " for compact single-line display
      const flatAddress = organization.address.replace(/[\r\n]+/g, ', ').replace(/,\s*,/g, ',').trim();
      if (flatAddress) details.push(flatAddress);
    }
    if (organization.phone) details.push(`Tel: ${organization.phone}`);
    if (organization.email) details.push(`Email: ${organization.email}`);
    if (organization.branding?.website) details.push(organization.branding.website);
    const detailsLine = details.join(' | ');
    const regLine = organization.registrationNumber ? `Registration: ${organization.registrationNumber}` : '';

    if (layout === 'stacked') {
      return this.addStackedHeader(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
    } else if (layout === 'classic') {
      return this.addClassicHeader(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
    } else {
      return this.addBannerHeader(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
    }
  }

  /**
   * Layout A: "Stacked" — logo centered above name, white background, colored divider
   */
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
    let currentY = startY;
    const centerX = pageWidth / 2;

    // Logo: centered, aspect-ratio aware
    if (organization.branding?.logo) {
      try {
        const maxLogoWidth = contentWidth * 0.4; // Max 40% of content width
        const imgProps = doc.getImageProperties(organization.branding.logo);
        const aspectRatio = imgProps.width / imgProps.height;

        let finalWidth = maxLogoWidth;
        let finalHeight = maxLogoWidth / aspectRatio;
        if (finalHeight > logoMaxHeight) {
          finalHeight = logoMaxHeight;
          finalWidth = logoMaxHeight * aspectRatio;
        }

        const logoX = centerX - finalWidth / 2;
        doc.addImage(organization.branding.logo, 'PNG', logoX, currentY, finalWidth, finalHeight);
        currentY += finalHeight + 4;
      } catch (error) {
        Logger.warn('Failed to add organization logo to stacked header:', error);
      }
    }

    // Company name — centered, brand color
    doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, centerX, currentY, { align: 'center' });
    currentY += 6;

    // Contact details — centered, gray, with word-wrap for long lines
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lineHeight = 4; // mm per line
    if (detailsLine) {
      const wrappedDetails = doc.splitTextToSize(detailsLine, contentWidth);
      doc.text(wrappedDetails, centerX, currentY, { align: 'center' });
      currentY += wrappedDetails.length * lineHeight;
    }
    if (regLine) {
      doc.text(regLine, centerX, currentY, { align: 'center' });
      currentY += lineHeight;
    }

    // Colored divider line (1mm)
    currentY += 2;
    doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b);
    doc.setLineWidth(1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    doc.setTextColor(0, 0, 0);
    return currentY;
  }

  /**
   * Layout B: "Classic Letterhead" — logo left, text right, colored divider
   */
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
    let logoEndX = margin;
    let logoHeight = 0;

    // Logo: left-aligned, aspect-ratio aware
    if (organization.branding?.logo) {
      try {
        const maxLogoWidth = contentWidth * 0.25; // Max 25% of content width
        const dims = this.addLogoWithAspectRatio(
          doc, organization.branding.logo,
          margin, startY,
          maxLogoWidth, logoMaxHeight
        );
        logoEndX = margin + dims.width + 6; // 6mm gap between logo and text
        logoHeight = dims.height;
      } catch (error) {
        Logger.warn('Failed to add organization logo to classic header:', error);
      }
    }

    // Text block — right of logo
    let textY = startY + 5;

    doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, logoEndX, textY);
    textY += 6;

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const textAreaWidth = pageWidth - margin - logoEndX; // available width for text
    if (detailsLine) {
      const wrappedDetails = doc.splitTextToSize(detailsLine, textAreaWidth);
      doc.text(wrappedDetails, logoEndX, textY);
      textY += wrappedDetails.length * 4;
    }
    if (regLine) {
      doc.text(regLine, logoEndX, textY);
      textY += 4;
    }

    // Dynamic height = max(logo height, text block height) + padding
    const textBlockHeight = textY - startY;
    let currentY = startY + Math.max(logoHeight, textBlockHeight) + 3;

    // Colored divider line (1mm)
    doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b);
    doc.setLineWidth(1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    doc.setTextColor(0, 0, 0);
    return currentY;
  }

  /**
   * Layout C: "Banner" — colored background band (matches original/frozen behavior)
   */
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
    _contentWidth: number,
    logoMaxHeight: number
  ): number {
    // Calculate band height dynamically based on content
    const bandPadding = 5; // mm padding top & bottom
    const nameY = bandPadding + 10; // company name baseline
    let detailY = nameY + 8; // details start below name
    const detailLineHeight = 4;

    // Pre-calculate detail line count for band height
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const detailMaxWidth = pageWidth - margin * 2;
    const wrappedDetails = detailsLine ? doc.splitTextToSize(detailsLine, detailMaxWidth) : [];
    const detailLines = wrappedDetails.length || 0;

    let bandHeight = detailY + (detailLines * detailLineHeight);
    if (regLine) bandHeight += detailLineHeight;
    bandHeight += bandPadding; // bottom padding

    // Colored background band
    doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
    doc.rect(0, 0, pageWidth, bandHeight, 'F');

    let logoWidth = 0;
    if (organization.branding?.logo) {
      try {
        const maxLogoWidth = 40;
        const logoY = bandPadding + 2;
        const dims = this.addLogoWithAspectRatio(
          doc, organization.branding.logo,
          margin, logoY,
          maxLogoWidth, Math.min(logoMaxHeight, 20)
        );
        logoWidth = dims.width;
      } catch (error) {
        Logger.warn('Failed to add organization logo to banner header:', error);
        logoWidth = 0;
      }
    }

    // Company name — white text on colored band
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, margin + logoWidth + (logoWidth > 0 ? 10 : 0), nameY);

    // Details — white text, word-wrapped
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (wrappedDetails.length > 0) {
      doc.text(wrappedDetails, margin, detailY);
      detailY += wrappedDetails.length * detailLineHeight;
    }
    if (regLine) {
      doc.text(regLine, margin, detailY);
    }

    doc.setTextColor(0, 0, 0);
    return bandHeight + 10; // 10mm gap below band
  }
  
  /**
   * Document Title Section - WITH DRAFT INDICATOR
   */
  private static addDocumentTitle(
    doc: any, 
    data: WarningPDFData, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 30mm)
    startY = this.checkPageOverflow(doc, startY, 30, pageHeight, bottomMargin);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');

    const title = this.getWarningLevelTitle(data.warningLevel);
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;

    startY += 4; // Breathing room above title (18pt text ascends ~5mm from baseline)
    doc.text(title, titleX, startY);
    startY += 4; // Tighter gap below title to underline

    // ✨ VALIDITY PERIOD DISPLAY - Prominent display below title
    if (data.validityPeriod && data.expiryDate) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100); // Gray text

      const expiryDateFormatted = this.formatDate(data.expiryDate);
      const validityText = `Valid for ${data.validityPeriod} months | Expires: ${expiryDateFormatted}`;
      const validityWidth = doc.getTextWidth(validityText);
      const validityX = (pageWidth - validityWidth) / 2;
      doc.text(validityText, validityX, startY);
      startY += 5; // Extra spacing after validity

      // Reset to black for rest of document
      doc.setTextColor(0, 0, 0);
    }

    // Check if this is a draft (missing employee or category)
    const isDraft = data.employee?.firstName === 'Employee' ||
                   data.category === 'Category Not Selected' ||
                   !data.description?.trim();

    if (isDraft) {
      doc.setFontSize(12);
      doc.setTextColor(200, 50, 50);
      const draftText = '[DRAFT - INCOMPLETE DATA]';
      const draftWidth = doc.getTextWidth(draftText);
      const draftX = (pageWidth - draftWidth) / 2;
      doc.text(draftText, draftX, startY + 1);
      startY += 6; // Extra space for draft indicator
    }

    // Underline (below everything)
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, startY + 2, pageWidth - margin, startY + 2);
    
    // Document ID and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const docInfo = `Document ID: ${data.warningId} | Issue Date: ${this.formatDate(data.issuedDate)}`;
    const infoWidth = doc.getTextWidth(docInfo);
    const infoX = (pageWidth - infoWidth) / 2;
    doc.text(docInfo, infoX, startY + 8);
    startY += 10;

    // 📋 CODE OF CONDUCT REFERENCE - If organization has one configured
    if (data.organization?.settings?.codeOfConductReference) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80); // Dark gray
      const codeRef = `Issued in terms of: ${data.organization.settings.codeOfConductReference}`;
      const codeRefWidth = doc.getTextWidth(codeRef);
      const codeRefX = (pageWidth - codeRefWidth) / 2;
      doc.text(codeRef, codeRefX, startY + 5);
      startY += 5;
      doc.setTextColor(0, 0, 0); // Reset to black
    }

    return startY + 10;
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
   * Employee Rights and Next Steps Section
   * LRA-compliant information about employee rights, appeal process, and next steps
   *
   * 🎨 EDITABLE CONTENT SYSTEM (v1.2.0+):
   * - REQUIRES sectionConfig parameter with custom subsections
   * - Renders subsections from sectionConfig.content.subsections
   * - Maintains ALL v1.1.0 styling: colors, fonts, spacing, backgrounds, borders
   * - Supports {{placeholder}} replacement in custom text (e.g., {{validityPeriod}})
   * - NO HARDCODED FALLBACK - section config is mandatory
   *
   * @param sectionConfig - PDFSectionConfig with custom subsections (REQUIRED)
   */
  private static addEmployeeRightsSection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    sectionConfig?: PDFSectionConfig  // Optional parameter for backward compatibility
  ): number {
    // ⚠️ REQUIRE section config - no hardcoded fallback
    if (!sectionConfig?.content?.subsections || sectionConfig.content.subsections.length === 0) {
      Logger.warn('⚠️ No subsections in Employee Rights config, skipping');
      return startY;
    }

    // Ensure section fits on page (need about 110mm for full section)
    startY = this.checkPageOverflow(doc, startY, 110, pageHeight, bottomMargin);

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
        subsection.content.forEach((item) => {
          const processedItem = this.replacePlaceholders(item, data);
          const itemLines = this.wrapText(doc, processedItem, sectionWidth - 20);
          currentY += itemLines.length * 5; // Line spacing
          currentY += 2.5; // Spacing between bullet points
        });
      } else {
        // PARAGRAPH
        const processedContent = this.replacePlaceholders(subsection.content, data);
        const contentLines = this.wrapText(doc, processedContent, sectionWidth - 20);
        currentY += contentLines.length * 5;
      }

      // Spacing after subsection (except last one)
      if (index < sectionConfig.content.subsections.length - 1) {
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
        subsection.content.forEach((item) => {
          const processedItem = this.replacePlaceholders(item, data);

          // Wrap text and render
          const itemLines = this.wrapText(doc, processedItem, sectionWidth - 20);
          itemLines.forEach(line => {
            doc.text(line, contentMargin, currentY);
            currentY += 5; // Line spacing
          });
          currentY += 2.5; // Spacing between bullet points
        });
      } else {
        // PARAGRAPH: Render as single paragraph
        const processedContent = this.replacePlaceholders(subsection.content, data);

        const contentLines = this.wrapText(doc, processedContent, sectionWidth - 20);
        contentLines.forEach(line => {
          doc.text(line, contentMargin, currentY);
          currentY += 5;
        });
      }

      // Spacing after subsection (except last one)
      if (index < sectionConfig.content.subsections.length - 1) {
        currentY += 3.5;
      }
    });

    currentY += 8; // Bottom padding inside box
    return currentY + 5; // Return with small spacing after section
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
  // ============================================

  /**
   * 🆕 DYNAMIC SECTION RENDERER
   *
   * Renders a PDFSectionConfig dynamically with placeholder replacement.
   * This is the core renderer for v1.2.0+ that enables full section customization.
   *
   * @param doc - jsPDF document instance
   * @param section - Section configuration with content and styling
   * @param data - Warning data for placeholder replacement
   * @param startY - Current Y position
   * @param pageWidth - Page width in mm
   * @param margin - Left margin in mm
   * @param pageHeight - Page height in mm
   * @param bottomMargin - Bottom margin in mm
   * @param defaultSettings - Default styling settings
   * @returns New Y position after rendering
   */
  private static renderDynamicSection(
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
    startY = this.checkPageOverflow(doc, startY, estimatedHeight, pageHeight, bottomMargin);

    // === SECTION HEADING ===
    const headingFontSize = section.styling?.headingFontSize || defaultSettings.styling.fontSize + 1 || 12;
    const headingColor = section.styling?.headingColor || defaultSettings.styling.sectionHeaderColor || '#333333';

    doc.setFontSize(headingFontSize);
    doc.setFont('helvetica', 'bold');

    // Parse hex color to RGB
    const headingRGB = this.hexToRGB(headingColor);
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

      const bodyRGB = this.hexToRGB(bodyColor);
      doc.setTextColor(bodyRGB.r, bodyRGB.g, bodyRGB.b);

      // Replace placeholders in body
      const body = PDFPlaceholderService.replacePlaceholders(section.content.body, data);

      // Wrap text to fit page width
      const sectionWidth = pageWidth - margin * 2 - (section.styling?.indent || 0);
      const bodyLines = this.wrapText(doc, body, sectionWidth);

      bodyLines.forEach(line => {
        // Check for page overflow on each line
        currentY = this.checkPageOverflow(doc, currentY, 6, pageHeight, bottomMargin);
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

      bulletPoints.forEach(point => {
        // Check for page overflow
        currentY = this.checkPageOverflow(doc, currentY, 10, pageHeight, bottomMargin);

        // Wrap bullet point text
        const bulletText = `• ${point}`;
        const sectionWidth = pageWidth - margin * 2 - (section.styling?.indent || 0) - 5;
        const lines = this.wrapText(doc, bulletText, sectionWidth);

        lines.forEach((line, index) => {
          currentY = this.checkPageOverflow(doc, currentY, 5, pageHeight, bottomMargin);
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
      currentY = this.renderTableSection(
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
   * 🆕 RENDER TABLE SECTION
   *
   * Helper method to render table data from section configs
   */
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
      currentY = this.checkPageOverflow(doc, currentY, 8, pageHeight, bottomMargin);

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