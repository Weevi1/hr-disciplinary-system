import Logger from '../utils/logger';
// frontend/src/services/PDFGenerationService.ts
// 🏆 REBUILT PDF GENERATION SERVICE - PERFECTLY MATCHED TO WARNING WIZARD DATA
// ✅ Built for your actual collected fields: incidentDate, incidentTime, incidentLocation, etc.
// ✅ Professional LRA-compliant document generation with proper formatting
// ✅ Supports signatures, recommendations, and all your form data
// ✅ RESILIENT to incomplete data states
// 🚨 MEMORY OPTIMIZED for 2012-era devices with <1GB RAM
// 🔒 VERSIONED PDF GENERATION - Legal compliance through consistent regeneration

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
   * Replace placeholders in text with actual data
   * Supports: {{validityPeriod}}, {{employee.firstName}}, {{employee.lastName}}, {{issuedDate}}
   *
   * @param text - Text containing placeholders
   * @param data - Warning data
   * @returns Processed text with placeholders replaced
   */
  private static replacePlaceholders(text: string, data: WarningPDFData): string {
    let result = text;

    // Replace validity period
    if (data.validityPeriod) {
      result = result.replace(/\{\{validityPeriod\}\}/g, data.validityPeriod.toString());
    }

    // Replace employee fields
    if (data.employee) {
      result = result.replace(/\{\{employee\.firstName\}\}/g, data.employee.firstName || '');
      result = result.replace(/\{\{employee\.lastName\}\}/g, data.employee.lastName || '');
    }

    // Replace issue date
    if (data.issuedDate) {
      result = result.replace(/\{\{issuedDate\}\}/g, this.formatDate(data.issuedDate));
    }

    return result;
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
        sections: [] // Will be populated from customSettings or defaults
      };

      const settings = customSettings ? {
        styling: { ...defaultSettings.styling, ...(customSettings.styling || {}) },
        content: { ...defaultSettings.content, ...(customSettings.content || {}) },
        sections: customSettings.sections || defaultSettings.sections
      } : defaultSettings;

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
      currentY = this.addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin);

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
        Logger.debug(`🎨 Rendering ${settings.sections.length} sections with intelligent routing...`);

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

        // Fallback: Render standard sections if no configuration provided
        if (data.disciplineRecommendation) {
          currentY = this.addPreviousDisciplinaryActionSection(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
          currentY = this.addConsequencesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
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
      currentY = this.addSignaturesSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);

      // 10. Appeal Report (if applicable)
      if (data.appealDetails) {
        Logger.debug('📋 Adding appeal report...');
        await this.addAppealReportSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      }

      // 11. Footer
      Logger.debug('🦶 Adding document footer...');
      this.addDocumentFooter(doc, data, pageWidth);

      // 12. Security watermark
      if (settings.content.showWatermark) {
        Logger.debug('🛡️ Adding security watermark...');
        this.addSecurityWatermark(doc, pageWidth);
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
   * Organization Header with Branding
   */
  private static addOrganizationHeader(
    doc: any, 
    organization: WarningPDFData['organization'], 
    startY: number, 
    pageWidth: number, 
    margin: number
  ): number {
    const headerColor = this.parseColor(organization.branding?.colors?.primary) || { r: 59, g: 130, b: 246 };
    
    // Header background
    doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    let logoWidth = 0;
    // Add organization logo if available
    if (organization.branding?.logo) {
      try {
        const logoHeight = 20;
        logoWidth = 30; // Approximate width
        doc.addImage(organization.branding.logo, 'PNG', margin, 7, logoWidth, logoHeight);
        Logger.debug('Added organization logo to PDF header');
      } catch (error) {
        Logger.warn('Failed to add organization logo to PDF:', error);
        logoWidth = 0; // Reset if logo fails
      }
    }
    
    // Company name (positioned after logo if present)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const companyName = organization.branding?.companyName || organization.name || 'Organization Name';
    doc.text(companyName, margin + logoWidth + (logoWidth > 0 ? 10 : 0), 15);
    
    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const details = [];
    if (organization.address) details.push(organization.address);
    if (organization.phone) details.push(`Tel: ${organization.phone}`);
    if (organization.email) details.push(`Email: ${organization.email}`);
    
    if (details.length > 0) {
      doc.text(details.join(' | '), margin, 25);
    }
    
    if (organization.registrationNumber) {
      doc.text(`Registration: ${organization.registrationNumber}`, margin, 30);
    }
    
    return 45;
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
    
    doc.text(title, titleX, startY);
    
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
      doc.text(draftText, draftX, startY + 6);
      startY += 6; // Extra space for draft indicator
    }
    
    // Underline
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(titleX, startY + 2, titleX + titleWidth, startY + 2);
    
    // Document ID and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const docInfo = `Document ID: ${data.warningId} | Issue Date: ${this.formatDate(data.issuedDate)}`;
    const infoWidth = doc.getTextWidth(docInfo);
    const infoX = (pageWidth - infoWidth) / 2;
    doc.text(docInfo, infoX, startY + 8);
    
    return startY + 20;
  }
  
  /**
   * Employee Information Section - RESILIENT TO MISSING DATA
   */
  private static addEmployeeSection(
    doc: any, 
    employee: WarningPDFData['employee'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 40mm)
    startY = this.checkPageOverflow(doc, startY, 40, pageHeight, bottomMargin);
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
   * Warning Details Section - RESILIENT TO MISSING CATEGORY
   */
  private static addWarningDetailsSection(
    doc: any, 
    data: WarningPDFData, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 25mm)
    startY = this.checkPageOverflow(doc, startY, 25, pageHeight, bottomMargin);
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
    
    doc.text(`Warning Level: ${this.getWarningLevelDisplay(data.warningLevel)}`, margin, detailY);
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
   * Incident Details Section - RESILIENT TO EMPTY FIELDS
   */
  private static addIncidentDetailsSection(
    doc: any, 
    data: WarningPDFData, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Calculate required height dynamically
    const requiredHeight = this.calculateIncidentSectionHeight(doc, data, pageWidth, margin);
    startY = this.checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('INCIDENT DETAILS', margin, startY);
    
    // Check for missing incident data
    const hasDescription = data.description && data.description.trim() !== '';
    const hasLocation = data.incidentLocation && data.incidentLocation.trim() !== '';
    const isIncomplete = !hasDescription && !hasLocation;
    
    // Section box with conditional styling for incomplete data
    const sectionHeight = this.calculateIncidentSectionHeight(doc, data, pageWidth, margin);
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
    doc.text(`${this.formatDate(data.incidentDate)} at ${data.incidentTime}`, margin + 30, incidentY);
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
    const descriptionLines = this.wrapText(doc, descriptionText, pageWidth - margin * 2 - 6);
    descriptionLines.forEach(line => {
      doc.text(line, margin + 3, incidentY);
      incidentY += 4;
    });
    
    return startY + sectionHeight + 10;
  }
  
  /**
   * Previous Disciplinary Action Section - NUMBERED LIST FORMAT (Template Style)
   * Shows clear numbered list of previous warnings with dates and offenses
   *
   * 🎨 EDITABLE CONTENT SYSTEM (v1.2.0+):
   * - Accepts optional sectionConfig parameter with custom heading/body
   * - Warning list format is FIXED (cannot be customized for consistency)
   * - If custom heading provided: Uses custom heading text
   * - If custom body provided: Shows body text above warning list
   * - If no custom content: Falls back to hardcoded v1.1.0 text
   * - Maintains ALL v1.1.0 styling: gray box, fonts, spacing
   *
   * @param sectionConfig - Optional PDFSectionConfig with custom heading/body
   */
  private static addPreviousDisciplinaryActionSection(
    doc: any,
    recommendation: WarningPDFData['disciplineRecommendation'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number,
    sectionConfig?: PDFSectionConfig  // 🆕 OPTIONAL: Custom content from PDF template settings
  ): number {
    if (!recommendation) {
      Logger.warn('⚠️ No recommendation data provided to addPreviousDisciplinaryActionSection');
      return startY;
    }

    // 🔥 CRITICAL FIX: Support both field names (activeWarnings and previousWarnings)
    // Firestore may store the data as either field name depending on when the warning was created
    const warnings = recommendation.activeWarnings || recommendation.previousWarnings || [];

    // Calculate height dynamically based on number of warnings
    const baseHeight = 28;
    const warningCount = warnings.length;
    const warningHeight = warningCount > 0 ? warningCount * 6 + 20 : 20;
    const totalHeight = baseHeight + warningHeight;

    startY = this.checkPageOverflow(doc, startY, totalHeight, pageHeight, bottomMargin);

    // 📋 SECTION HEADER - Use custom heading if provided, otherwise use v1.1.0 default
    const sectionHeading = sectionConfig?.content?.heading || 'PREVIOUS DISCIPLINARY ACTION (Still Valid on File)';
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(sectionHeading, margin, startY);

    // Gray box for section - INCREASED PADDING
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 248, 248);
    doc.setLineWidth(0.3);
    doc.rect(margin, startY + 4, pageWidth - (margin * 2), warningHeight, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    let listY = startY + 12;

    // Display warnings in numbered format - INCREASED LINE SPACING
    if (warnings && warnings.length > 0) {
      warnings.forEach((warning: any, index: number) => {
        const warningDate = this.formatDate(warning.issuedDate || warning.issueDate || new Date());
        const description = warning.description || warning.incidentDescription || 'No description available';
        const level = this.getWarningLevelDisplay(warning.level || warning.warningLevel || 'verbal');

        // Truncate description if too long (max 60 characters)
        const truncatedDesc = description.length > 60 ? description.substring(0, 57) + '...' : description;

        const line = `${index + 1}) Date: ${warningDate} | Incident: ${truncatedDesc} | Level: ${level}`;
        doc.text(line, margin + 5, listY);
        listY += 6;
      });
    } else {
      // No previous warnings
      doc.text('No previous disciplinary action on file', margin + 5, listY);
    }

    return startY + warningHeight + 12;
  }

  /**
   * 🔒🔒🔒 VERSION 1.0.0 - Previous Disciplinary Action Section (FROZEN) 🔒🔒🔒
   *
   * ⚠️ CRITICAL WARNING: DO NOT MODIFY THIS METHOD ⚠️
   *
   * This is a FROZEN legacy method used by generateWarningPDF_v1_0_0().
   * It must remain unchanged to ensure historical warnings regenerate identically.
   *
   * Format: Date | Offense (Category) | Level
   * Example: "1) Date: 2025-01-15 | Offense: Tardiness | Level: Verbal Warning"
   *
   * DO NOT:
   * - Change the format string on line 865
   * - Modify the field names (Offense, Date, Level)
   * - Change spacing, punctuation, or separators
   * - "Fix" any perceived issues
   *
   * If changes needed: Create new version (v1.2.0) with new method
   *
   * Status: FROZEN - DO NOT MODIFY
   */
  private static addPreviousDisciplinaryActionSection_v1_0_0(
    doc: any,
    recommendation: WarningPDFData['disciplineRecommendation'],
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    if (!recommendation) return startY;

    // Calculate height dynamically based on number of warnings
    const baseHeight = 28;
    const warningCount = recommendation.activeWarnings?.length || 0;
    const warningHeight = warningCount > 0 ? warningCount * 6 + 20 : 20;
    const totalHeight = baseHeight + warningHeight;

    startY = this.checkPageOverflow(doc, startY, totalHeight, pageHeight, bottomMargin);

    // Section title - REDUCED FONT SIZE for A4
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('PREVIOUS DISCIPLINARY ACTION (Still Valid on File)', margin, startY);

    // Gray box for section - INCREASED PADDING
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 248, 248);
    doc.setLineWidth(0.3);
    doc.rect(margin, startY + 4, pageWidth - (margin * 2), warningHeight, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    let listY = startY + 12;

    // Display warnings in numbered format - INCREASED LINE SPACING
    // 🔒 v1.0.0 FORMAT: Shows "Offense" (category) instead of incident description
    if (recommendation.activeWarnings && recommendation.activeWarnings.length > 0) {
      recommendation.activeWarnings.forEach((warning: any, index: number) => {
        const warningDate = this.formatDate(warning.issuedDate || warning.issueDate || new Date());
        const category = warning.category || warning.categoryName || 'General Misconduct';
        const level = this.getWarningLevelDisplay(warning.level || warning.warningLevel || 'verbal');

        const line = `${index + 1}) Date: ${warningDate} | Offense: ${category} | Level: ${level}`;
        doc.text(line, margin + 5, listY);
        listY += 6;
      });
    } else {
      // No previous warnings
      doc.text('No previous disciplinary action on file', margin + 5, listY);
    }

    return startY + warningHeight + 12;
  }

  /**
   * Consequences Section - STANDALONE WARNING BOX (Template Style)
   * Clear prominent section about consequences of continued behavior
   *
   * 🎨 EDITABLE CONTENT SYSTEM (v1.2.0+):
   * - REQUIRES sectionConfig parameter with custom content
   * - Renders body and/or bulletPoints from sectionConfig.content
   * - Maintains ALL v1.1.0 styling: red warning box, fonts, spacing
   * - Supports {{placeholder}} replacement in custom text
   * - NO HARDCODED FALLBACK - section config is mandatory
   *
   * @param sectionConfig - PDFSectionConfig with custom content (REQUIRED)
   */
  private static addConsequencesSection(
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
    if (!sectionConfig?.content) {
      Logger.warn('⚠️ No section config provided for Consequences section, skipping');
      return startY;
    }

    // Validate content exists
    const hasContent = sectionConfig.content.body ||
                       (sectionConfig.content.bulletPoints && sectionConfig.content.bulletPoints.length > 0);

    if (!hasContent) {
      Logger.warn('⚠️ Consequences section config has no body or bulletPoints, skipping');
      return startY;
    }

    // Check if we have enough space (need about 40mm)
    startY = this.checkPageOverflow(doc, startY, 40, pageHeight, bottomMargin);

    // 📋 SECTION HEADER - Use custom heading from config
    const sectionHeading = sectionConfig.content.heading || 'WARNING: CONSEQUENCES IF EMPLOYEE\nDOES NOT CHANGE BEHAVIOUR';
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);

    // Handle multi-line headings (split on \n)
    const headingLines = sectionHeading.split('\n');
    headingLines.forEach((line, index) => {
      doc.text(line, margin, startY + (index * 5));
    });

    const headerHeight = headingLines.length * 5;

    // 🎨 RED WARNING BOX - PRESERVED v1.1.0 STYLING
    const sectionHeight = 30;
    doc.setFillColor(254, 226, 226); // Light red #FEE2E2
    doc.setDrawColor(239, 68, 68); // Red border #EF4444
    doc.setLineWidth(0.5);
    doc.rect(margin, startY + headerHeight + 3, pageWidth - (margin * 2), sectionHeight, 'FD');

    // Warning text styling
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29); // Dark red text for readability

    let textY = startY + headerHeight + 11; // Top padding inside box

    Logger.debug('📝 Rendering Consequences with custom content from sectionConfig');

    // Render body paragraph if provided
    if (sectionConfig.content.body) {
      const processedBody = this.replacePlaceholders(sectionConfig.content.body, data);
      const bodyLines = this.wrapText(doc, processedBody, pageWidth - (margin * 2) - 15);
      bodyLines.forEach(line => {
        doc.text(line, margin + 5, textY);
        textY += 5;
      });
    }

    // Render bullet points if provided
    if (sectionConfig.content.bulletPoints && sectionConfig.content.bulletPoints.length > 0) {
      sectionConfig.content.bulletPoints.forEach((bullet) => {
        const processedBullet = this.replacePlaceholders(bullet, data);
        const bulletLines = this.wrapText(doc, processedBullet, pageWidth - (margin * 2) - 15);
        bulletLines.forEach(line => {
          doc.text(line, margin + 5, textY);
          textY += 5;
        });
      });
    }

    return startY + headerHeight + sectionHeight + 15;
  }
  
  /**
   * Legal Compliance Section
   */
  private static addLegalComplianceSection(
    doc: any, 
    legalCompliance: WarningPDFData['legalCompliance'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    if (!legalCompliance) return startY;
    
    // Check if we have enough space (need about 30mm)
    startY = this.checkPageOverflow(doc, startY, 30, pageHeight, bottomMargin);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('LEGAL COMPLIANCE', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let legalY = startY + 8;
    
    doc.text(`Framework: ${legalCompliance.framework}`, margin, legalY);
    legalY += 5;
    
    doc.text(`Compliance Status: ${legalCompliance.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`, margin, legalY);
    legalY += 5;
    
    if (legalCompliance.requirements.length > 0) {
      doc.text('Legal Requirements:', margin, legalY);
      legalY += 4;
      
      legalCompliance.requirements.forEach(req => {
        doc.text(`• ${req}`, margin + 3, legalY);
        legalY += 4;
      });
    }
    
    return legalY + 5;
  }
  
  /**
   * Additional Notes Section
   */
  private static addAdditionalNotesSection(
    doc: any, 
    notes: string, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Calculate height based on text length
    const notesLines = this.wrapText(doc, notes, pageWidth - margin * 2);
    const requiredHeight = 15 + (notesLines.length * 4);
    startY = this.checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('ADDITIONAL NOTES', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let notesY = startY + 8;
    notesLines.forEach(line => {
      doc.text(line, margin, notesY);
      notesY += 4;
    });
    
    return notesY + 5;
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

    // 🎨 BACKGROUND BOX - PRESERVED v1.1.0 STYLING
    // Light blue background box for entire section - INCREASED HEIGHT and PADDING for A4
    const sectionWidth = pageWidth - margin * 2;
    const sectionHeight = 102; // Further increased height for proper A4 spacing
    doc.setFillColor(239, 246, 255); // Light blue #EFF6FF
    doc.setDrawColor(59, 130, 246); // Blue border #3B82F6
    doc.setLineWidth(0.5);
    doc.rect(margin, startY + 4, sectionWidth, sectionHeight, 'FD'); // Fill and Draw

    let currentY = startY + 14; // Further increased top padding
    const contentMargin = margin + 8; // Further increased indent for content inside box

    Logger.debug('📝 Rendering Employee Rights with custom content from sectionConfig');

    // Iterate through custom subsections
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
    return startY + sectionHeight + 35; // Return with proper spacing after section
  }

  /**
   * Signatures Section - OPTIMIZED LAYOUT WITH LABELS OUTSIDE BOXES
   */
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
    // Increased space requirement (was 50mm, now 65mm total)
    startY = this.checkPageOverflow(doc, startY, 65, pageHeight, bottomMargin);

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
        doc.text(`Date: ${this.formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 11);
      } catch (error) {
        Logger.warn('Failed to embed manager signature image:', error)
        // Fallback to text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('✓ Digitally Signed', margin + 5, startY + 25);
        const managerNameText = managerName ? managerName : '_____________________';
        doc.text(`Manager Name: ${managerNameText}`, margin + 2, startY + signatureBoxHeight + 7);
        doc.text(`Date: ${this.formatDate(issuedDate || new Date())}`, margin + 2, startY + signatureBoxHeight + 11);
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
        doc.text(`Date: ${this.formatDate(issuedDate || new Date())}`, employeeBoxX + 2, startY + signatureBoxHeight + 11);
      } catch (error) {
        Logger.warn('Failed to embed employee signature image:', error)
        // Fallback to text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('✓ Digitally Signed', employeeBoxX + 5, startY + 25);
        doc.text(`${employee.firstName} ${employee.lastName}`, employeeBoxX + 2, startY + signatureBoxHeight + 7);
        doc.text(`Date: ${this.formatDate(issuedDate || new Date())}`, employeeBoxX + 2, startY + signatureBoxHeight + 11);
      }
    } else {
      // Empty signature line
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('_____________________', employeeBoxX + 5, startY + 30);
      doc.text(`${employee.firstName} ${employee.lastName}`, employeeBoxX + 2, startY + signatureBoxHeight + 7);
      doc.text('Date: ___________', employeeBoxX + 2, startY + signatureBoxHeight + 11);
    }

    return startY + signatureBoxHeight + 12;
  }
  
  /**
   * Delivery Information Section
   */
  private static addDeliverySection(
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
    startY = this.checkPageOverflow(doc, startY, 20, pageHeight, bottomMargin);
    
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
    
    doc.text(`Delivery Date: ${this.formatDate(delivery.timestamp)}`, margin, deliveryY);
    deliveryY += 4;
    
    doc.text(`Authorized by: ${delivery.chosenBy}`, margin, deliveryY);
    
    return deliveryY + 8;
  }

  /**
   * Appeal History Section - Shows employee appeal and HR decision
   */
  private static addAppealHistorySection(
    doc: any,
    data: WarningPDFData,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 40mm for appeal section)
    startY = this.checkPageOverflow(doc, startY, 40, pageHeight, bottomMargin);

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
        doc.text(`Submitted: ${this.formatDate(data.appealDetails.submittedAt)}`, margin, currentY);
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
      currentY = this.checkPageOverflow(doc, currentY, 30, pageHeight, bottomMargin);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('HR Decision', margin, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (data.appealDecisionDate) {
        doc.text(`Decision Date: ${this.formatDate(data.appealDecisionDate)}`, margin, currentY);
        currentY += 4;
      }

      // Outcome with colored badge
      doc.setFont('helvetica', 'bold');
      doc.text('Outcome: ', margin, currentY);

      const outcomeText = data.appealOutcome === 'overturned' ? 'WARNING OVERTURNED' :
                          data.appealOutcome === 'upheld' ? 'APPEAL DENIED - WARNING STANDS' :
                          data.appealOutcome === 'modified' ? 'WARNING MODIFIED' :
                          data.appealOutcome === 'reduced' ? 'WARNING REDUCED' :
                          data.appealOutcome.toUpperCase();

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
          ? `⚠ Follow-up Required by ${this.formatDate(data.followUpDate)}`
          : '⚠ Follow-up Required';
        doc.text(followUpText, margin + 2, currentY + 6);
        doc.setTextColor(0, 0, 0);
        currentY += 12;
      }
    }

    return currentY + 8;
  }

  /**
   * Document Footer - Multi-page aware
   */
  private static addDocumentFooter(doc: any, data: WarningPDFData, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const totalPages = doc.getNumberOfPages();
    
    // Add footer to each page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      
      const footerText = 'This document has been generated electronically and constitutes an official warning as per LRA Section 188.';
      const footerWidth = doc.getTextWidth(footerText);
      const footerX = (pageWidth - footerWidth) / 2;
      doc.text(footerText, footerX, pageHeight - 20);
      
      // Confidentiality notice
      const confText = 'CONFIDENTIAL DOCUMENT - For authorized personnel only';
      const confWidth = doc.getTextWidth(confText);
      const confX = (pageWidth - confWidth) / 2;
      doc.text(confText, confX, pageHeight - 15);
      
      // Page number and timestamp
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 50, pageHeight - 10);
    }
  }
  
  /**
   * Security Watermark - Multi-page aware
   */
  private static addSecurityWatermark(doc: any, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const totalPages = doc.getNumberOfPages();
    
    // Add watermark to each page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Save graphics state
      doc.saveGraphicsState();
      
      // Set transparency
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      
      // Watermark text
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      doc.text('OFFICIAL WARNING', centerX, centerY, {
        angle: 45,
        align: 'center'
      });
      
      // Restore graphics state
      doc.restoreGraphicsState();
    }
  }

  /**
   * OVERTURNED Watermark - Applied when warning has been overturned via appeal
   * Adds prominent diagonal red watermark across all pages
   */
  private static addOverturnedWatermark(doc: any, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const totalPages = doc.getNumberOfPages();

    // Add OVERTURNED watermark to each page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Save graphics state
      doc.saveGraphicsState();

      // Set transparency - higher opacity so it's clearly visible
      doc.setGState(new doc.GState({ opacity: 0.35 }));

      // Watermark text - RED color for OVERTURNED status
      doc.setTextColor(255, 0, 0); // Bright red
      doc.setFontSize(60); // Large and prominent
      doc.setFont('helvetica', 'bold');

      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;

      doc.text('OVERTURNED', centerX, centerY, {
        angle: 45,
        align: 'center'
      });

      // Restore graphics state
      doc.restoreGraphicsState();
    }
  }

  /**
   * 📋 APPEAL REPORT GENERATOR - Standalone appeal decision document
   * Generates a focused document showing only appeal process and decision
   */
  static async generateAppealReportPDF(data: {
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
  }): Promise<Blob> {
    try {
      Logger.debug('📋 Generating Appeal Report PDF...');

      // Dynamic import jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
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
      doc.text(`Original Issue Date: ${this.formatDate(data.issueDate)}`, pageWidth - margin - 60, currentY + 13);
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
        doc.text(`Submitted: ${data.appealDetails.submittedAt ? this.formatDate(data.appealDetails.submittedAt) : 'N/A'}`, margin + 5, currentY + 5);
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
        doc.text(`Decision Date: ${data.appealDecisionDate ? this.formatDate(data.appealDecisionDate) : 'Pending'}`, margin + 5, currentY + 5);
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
            ? `⚠ FOLLOW-UP REQUIRED BY: ${this.formatDate(data.followUpDate)}`
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

        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY + 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, footerY + 10);
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
    const maxY = pageHeight - bottomMargin;
    
    if (currentY + requiredHeight > maxY) {
      Logger.debug(29714)
      doc.addPage();
      return 20; // Start new page with top margin
    }
    
    return currentY;
  }
  
  /**
   * Add page header for continuation pages
   */
  private static addPageHeader(doc: any, data: WarningPDFData, pageNumber: number): void {
    const pageWidth = doc.internal.pageSize.width;
    
    // Simple header for continuation pages
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    const headerText = `${data.organization.name} - Warning Document (Continued)`;
    doc.text(headerText, 20, 10);
    
    const pageText = `Page ${pageNumber}`;
    doc.text(pageText, pageWidth - 40, 10);
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 12, pageWidth - 20, 12);
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
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get warning level display name
   */
  private static getWarningLevelDisplay(level: string): string {
    const levelMap: Record<string, string> = {
      'counselling': 'Counselling Session',
      'verbal': 'Verbal Warning',
      'first_written': 'First Written Warning',
      'second_written': 'Second Written Warning',
      'final_written': 'Final Written Warning',
      'suspension': 'Suspension',
      'dismissal': 'Dismissal'
    };
    
    return levelMap[level] || level.replace('_', ' ').toUpperCase();
  }
  
  /**
   * Get warning level document title
   */
  private static getWarningLevelTitle(level: string): string {
    const titleMap: Record<string, string> = {
      'counselling': 'COUNSELLING SESSION RECORD',
      'verbal': 'VERBAL WARNING NOTICE',
      'first_written': 'FIRST WRITTEN WARNING',
      'second_written': 'SECOND WRITTEN WARNING',
      'final_written': 'FINAL WRITTEN WARNING',
      'suspension': 'SUSPENSION NOTICE',
      'dismissal': 'DISMISSAL NOTICE'
    };
    
    return titleMap[level] || 'WARNING NOTICE';
  }
  
  /**
   * Format date consistently
   */
  private static formatDate(date: Date | any): string {
    // Handle Firestore Timestamp format
    let dateObj: Date;

    if (!date) {
      dateObj = new Date();
    } else if (date.seconds !== undefined) {
      // Firestore Timestamp: { seconds, nanoseconds }
      dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date();
    }

    return dateObj.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Wrap text to fit within specified width
   */
  private static wrapText(doc: any, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  /**
   * Calculate incident section height - RESILIENT VERSION
   */
  private static calculateIncidentSectionHeight(
    doc: any, 
    data: WarningPDFData, 
    pageWidth: number, 
    margin: number
  ): number {
    let height = 25; // Base height for date/time and location
    
    // Add height for description (or placeholder text)
    const descriptionText = data.description && data.description.trim() !== '' 
      ? data.description 
      : '[Incident description not provided - complete in wizard]';
    
    const descriptionLines = this.wrapText(doc, descriptionText, pageWidth - margin * 2 - 6);
    height += descriptionLines.length * 4;
    
    // Add extra height for warning message if incomplete
    const hasDescription = data.description && data.description.trim() !== '';
    const hasLocation = data.incidentLocation && data.incidentLocation.trim() !== '';
    const isIncomplete = !hasDescription && !hasLocation;
    
    if (isIncomplete) {
      height += 10; // Space for warning message
    }
    
    return Math.max(height, 45); // Minimum height
  }
  
  /**
   * Parse color string to RGB
   */
  private static parseColor(colorString?: string): { r: number; g: number; b: number } | null {
    if (!colorString) return null;
    
    // Handle hex colors
    if (colorString.startsWith('#')) {
      const hex = colorString.substring(1);
      if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16)
        };
      }
    }
    
    return null;
  }

  /**
   * 🚨 SIMPLIFIED PDF GENERATION FOR 2012-ERA DEVICES
   * Minimal memory usage, no images, simple layout
   */
  static async generateSimplifiedPDF(data: WarningPDFData): Promise<Blob> {
    try {
      Logger.debug('🚨 Generating simplified PDF for legacy device...');

      // Import minimal jsPDF configuration
      const { default: jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Simple layout variables
      let currentY = 20;
      const margin = 15;
      const lineHeight = 6;

      // Basic font only
      doc.setFont('helvetica', 'normal');

      // 1. Simple Header
      doc.setFontSize(16);
      doc.text('DISCIPLINARY WARNING', margin, currentY);
      currentY += lineHeight * 2;

      // 2. Organization (text only)
      doc.setFontSize(12);
      if (data.organization?.name) {
        doc.text(`Organization: ${data.organization.name}`, margin, currentY);
        currentY += lineHeight;
      }

      currentY += lineHeight;

      // 3. Employee Details (simplified)
      doc.setFontSize(11);
      doc.text('EMPLOYEE DETAILS:', margin, currentY);
      currentY += lineHeight;

      doc.setFontSize(10);
      const employeeLines = [
        `Name: ${data.employee.firstName} ${data.employee.lastName}`,
        `Employee ID: ${data.employee.employeeNumber}`,
        `Department: ${data.employee.department}`,
        `Position: ${data.employee.position}`
      ];

      employeeLines.forEach(line => {
        doc.text(line, margin + 5, currentY);
        currentY += lineHeight;
      });

      currentY += lineHeight;

      // 4. Warning Details (simplified)
      doc.setFontSize(11);
      doc.text('WARNING DETAILS:', margin, currentY);
      currentY += lineHeight;

      doc.setFontSize(10);
      const warningLines = [
        `Date: ${data.issuedDate.toLocaleDateString()}`,
        `Category: ${data.category}`,
        `Level: ${data.warningLevel}`,
        `Location: ${data.incidentLocation || 'Not specified'}`
      ];

      warningLines.forEach(line => {
        doc.text(line, margin + 5, currentY);
        currentY += lineHeight;
      });

      currentY += lineHeight;

      // 5. Description (with word wrapping)
      doc.setFontSize(11);
      doc.text('INCIDENT DESCRIPTION:', margin, currentY);
      currentY += lineHeight;

      doc.setFontSize(10);
      const maxWidth = 170; // mm
      const descriptionLines = doc.splitTextToSize(data.description, maxWidth);

      descriptionLines.forEach((line: string) => {
        if (currentY > 270) { // Near bottom of page
          doc.addPage();
          currentY = 20;
        }
        doc.text(line, margin + 5, currentY);
        currentY += lineHeight;
      });

      currentY += lineHeight * 2;

      // 6. Signatures (simple text fields)
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.text('SIGNATURES:', margin, currentY);
      currentY += lineHeight * 2;

      doc.setFontSize(10);

      // Manager signature
      doc.text('Manager: ________________________', margin, currentY);
      currentY += lineHeight;
      doc.text(`Date: ${data.issuedDate.toLocaleDateString()}`, margin, currentY);
      currentY += lineHeight * 3;

      // Employee signature
      doc.text('Employee: _______________________ ', margin, currentY);
      currentY += lineHeight;
      doc.text('Date: _______________', margin, currentY);

      // 7. Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('Generated by HR System - Simplified for mobile device', margin, pageHeight - 10);

      Logger.debug('✅ Simplified PDF generation completed');

      // Force memory cleanup
      const blob = doc.output('blob');

      // Hint for garbage collection on legacy devices
      if (window.gc) {
        setTimeout(() => window.gc(), 100);
      }

      return blob;

    } catch (error) {
      Logger.error('❌ Simplified PDF generation failed:', error);

      // Fallback: Generate even simpler text-based PDF
      return this.generatePlainTextPDF(data);
    }
  }

  /**
   * 🚨 PLAIN TEXT PDF FALLBACK FOR VERY LIMITED DEVICES
   * Absolute minimal PDF for extreme cases
   */
  static async generatePlainTextPDF(data: WarningPDFData): Promise<Blob> {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFontSize(12);
      let currentY = 20;
      const lineHeight = 10;

      const lines = [
        'DISCIPLINARY WARNING',
        '',
        `Employee: ${data.employee.firstName} ${data.employee.lastName}`,
        `Date: ${data.issuedDate.toLocaleDateString()}`,
        `Category: ${data.category}`,
        `Level: ${data.warningLevel}`,
        '',
        'Description:',
        data.description,
        '',
        'This is a simplified version generated for older devices.'
      ];

      lines.forEach(line => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(line, 20, currentY);
        currentY += lineHeight;
      });

      return doc.output('blob');
    } catch (error) {
      Logger.error('❌ Even plain text PDF failed:', error);
      throw new Error('PDF generation not supported on this device');
    }
  }
}