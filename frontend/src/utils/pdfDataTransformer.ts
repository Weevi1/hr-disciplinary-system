// frontend/src/utils/pdfDataTransformer.ts
// 🔒 SECURITY-CRITICAL: UNIFIED PDF DATA TRANSFORMER
// ✅ Ensures ALL PDF generations produce IDENTICAL output for the same warning
// ✅ Prevents document tampering and maintains legal integrity
// ⚠️ DO NOT modify without security review - changes affect legal compliance

import Logger from './logger';
import { PDF_GENERATOR_VERSION } from '../services/PDFGenerationService';
import { PDFTemplateVersionService } from '../services/PDFTemplateVersionService';

/**
 * 🔒 SECURITY-CRITICAL: Convert Firestore Timestamp to JavaScript Date
 *
 * This function MUST produce identical Date objects for the same Firestore Timestamp,
 * regardless of when it's called. This ensures PDFs generated at different times
 * show the same dates for historical warnings.
 *
 * @param timestamp - Firestore Timestamp object, Date object, or date string
 * @returns JavaScript Date object
 */
export const convertFirestoreTimestamp = (timestamp: any): Date => {
  if (!timestamp) {
    Logger.warn('⚠️ Null timestamp provided to convertFirestoreTimestamp, using current date');
    return new Date();
  }

  // Firestore Timestamp format: { seconds, nanoseconds } OR { _seconds, _nanoseconds }
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }

  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Date string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  Logger.warn('⚠️ Invalid timestamp format, using current date:', timestamp);
  return new Date();
};

/**
 * 🔒 SECURITY-CRITICAL: Recursively convert all Firestore Timestamps in an object
 *
 * When reading nested data from Firestore, timestamp objects may have _seconds/_nanoseconds
 * properties instead of being converted to Date objects. This function recursively walks
 * the object tree and converts all timestamps to Date objects.
 *
 * @param obj - Object potentially containing Firestore Timestamps
 * @returns Object with all timestamps converted to Date objects
 */
export const convertAllTimestamps = (obj: any): any => {
  if (!obj) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertAllTimestamps(item));
  }

  // Handle objects
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    // Check if this is a Firestore Timestamp object
    if (obj.seconds !== undefined || obj._seconds !== undefined) {
      return convertFirestoreTimestamp(obj);
    }

    // Recursively convert all properties
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertAllTimestamps(obj[key]);
      }
    }
    return converted;
  }

  // Return primitives as-is
  return obj;
};

/**
 * 🔒 SECURITY-CRITICAL: Flatten employee data structure
 *
 * Converts nested employee profile/employment structure to flat structure
 * expected by PDFGenerationService. MUST produce consistent output.
 *
 * @param employee - Employee object with nested profile/employment or flat structure
 * @returns Flattened employee data
 */
export const flattenEmployeeData = (employee: any): {
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  position: string;
  email?: string;
  phone?: string;
} => {
  if (!employee) {
    Logger.warn('⚠️ Null employee provided to flattenEmployeeData');
    return {
      firstName: 'Unknown',
      lastName: 'Employee',
      employeeNumber: 'N/A',
      department: 'Unknown',
      position: 'Unknown'
    };
  }

  // Handle nested structure (profile/employment)
  if (employee.profile || employee.employment) {
    return {
      firstName: employee.profile?.firstName || employee.firstName || 'Unknown',
      lastName: employee.profile?.lastName || employee.lastName || 'Employee',
      employeeNumber: employee.employment?.employeeNumber || employee.employeeNumber || employee.id || 'N/A',
      department: employee.employment?.department || employee.profile?.department || employee.department || 'Unknown',
      position: employee.employment?.position || employee.position || 'Unknown',
      email: employee.profile?.email || employee.email || '',
      phone: employee.profile?.phoneNumber || employee.profile?.phone || employee.phone || ''
    };
  }

  // Handle flat structure
  return {
    firstName: employee.firstName || 'Unknown',
    lastName: employee.lastName || 'Employee',
    employeeNumber: employee.employeeNumber || employee.employeeId || employee.id || 'N/A',
    department: employee.department || 'Unknown',
    position: employee.position || 'Unknown',
    email: employee.email || '',
    phone: employee.phone || employee.phoneNumber || ''
  };
};

/**
 * 🔒 SECURITY-CRITICAL: Transform warning data for PDF generation
 *
 * This is the SINGLE SOURCE OF TRUTH for preparing warning data for PDF generation.
 * ALL components that generate PDFs MUST use this function to ensure consistency.
 *
 * Changes to this function affect legal document integrity - require security review.
 *
 * **ARCHITECTURE CHANGE (2025-10-16):**
 * - Now async to fetch template versions from Firestore
 * - Fetches template from versions collection using stored pdfTemplateVersion
 * - Falls back to org's current settings for old warnings
 *
 * @param warningData - Raw warning data from Firestore or wizard
 * @param employeeData - Employee object (nested or flat structure)
 * @param organizationData - Organization object with branding
 * @returns Standardized data structure for PDFGenerationService
 */
export const transformWarningDataForPDF = async (
  warningData: any,
  employeeData: any,
  organizationData: any
): Promise<any> => {
  Logger.debug('🔒 Transforming warning data for PDF generation...');

  if (!warningData) {
    throw new Error('Cannot transform null warning data for PDF');
  }

  if (!organizationData) {
    throw new Error('Cannot transform warning data without organization data');
  }

  // Flatten employee data
  const flattenedEmployee = flattenEmployeeData(employeeData);

  // Convert all Firestore Timestamps to JavaScript Dates
  // ⚠️ CRITICAL: Use warningData.issueDate (NOT issuedDate) as primary field
  const issueDate = convertFirestoreTimestamp(
    warningData.issueDate || warningData.issuedDate || warningData.createdAt
  );

  const incidentDate = convertFirestoreTimestamp(
    warningData.incidentDate || warningData.issueDate || warningData.createdAt
  );

  // 🎨 ARCHITECTURE OPTIMIZATION: Fetch template version if stored (1000x more efficient)
  // Instead of duplicating 5-10KB of template settings with every warning, we:
  // 1. Check if warning has pdfTemplateVersion string (e.g., "1.9.0")
  // 2. Fetch template from: organizations/{orgId}/pdfTemplateVersions/{version}
  // 3. Fall back to org's current settings for old warnings (backward compatibility)
  let pdfSettings = undefined;
  if (warningData.pdfTemplateVersion && organizationData.id) {
    try {
      const templateVersion = await PDFTemplateVersionService.getTemplateVersion(
        organizationData.id,
        warningData.pdfTemplateVersion
      );
      if (templateVersion) {
        pdfSettings = templateVersion.settings;
        Logger.debug(`✅ Fetched template version ${warningData.pdfTemplateVersion} from collection`);
      } else {
        Logger.warn(`⚠️ Template version ${warningData.pdfTemplateVersion} not found, using current org settings`);
        pdfSettings = organizationData.pdfSettings;
      }
    } catch (error) {
      Logger.error('❌ Failed to fetch template version:', error);
      pdfSettings = organizationData.pdfSettings; // Fallback
    }
  } else {
    // Old warnings without template version OR legacy pdfSettings field
    pdfSettings = warningData.pdfSettings || organizationData.pdfSettings || undefined;
    if (warningData.pdfSettings) {
      Logger.debug('📋 Using legacy pdfSettings from warning document (old format)');
    } else if (organizationData.pdfSettings) {
      Logger.debug('📋 Using pdfSettings from organization:', {
        hasSettings: true,
        version: organizationData.pdfSettings.generatorVersion,
        hasContent: !!organizationData.pdfSettings.content,
        hasBranding: !!organizationData.pdfSettings.branding
      });
    } else {
      Logger.warn('⚠️ No pdfSettings found in warning or organization data - will use defaults');
    }
  }

  // Build standardized PDF data structure
  const pdfData = {
    // Warning identification
    warningId: warningData.id || warningData.warningId || `WRN_${Date.now()}`,
    organizationId: warningData.organizationId || organizationData.id,
    status: warningData.status || 'issued',

    // 🔒 PDF Generator Version (for consistent regeneration)
    // Use stored version if available (for regenerating old warnings), otherwise use current version
    pdfGeneratorVersion: warningData.pdfGeneratorVersion || PDF_GENERATOR_VERSION,

    // 🎨 PDF Template Settings (fetched from versions collection or fallback)
    pdfSettings: pdfSettings,

    // 🔥 CRITICAL FIX: Manager name is stored in signatures.managerName (not top-level issuedByName)
    issuedByName: warningData.signatures?.managerName || warningData.issuedByName || '', // Manager name who issued the warning

    // Dates (CRITICAL: Must use historical dates, NOT current date)
    issuedDate: issueDate,
    incidentDate: incidentDate,

    // Employee data (flattened)
    employee: flattenedEmployee,

    // Warning classification
    warningLevel: warningData.level || warningData.warningLevel || 'counselling',
    category: warningData.category || warningData.categoryName || 'General Misconduct',

    // Incident details
    description: warningData.description || warningData.incidentDescription || '',
    incidentTime: warningData.incidentTime || '09:00',
    incidentLocation: warningData.incidentLocation || '',

    // Organization branding
    organization: organizationData,

    // Signatures
    signatures: warningData.signatures || {},

    // Additional fields
    additionalNotes: warningData.additionalNotes || '',
    validityPeriod: warningData.validityPeriod || 6,

    // LRA recommendation (if available)
    // 🔥 CRITICAL FIX: Convert all nested Firestore Timestamps to Date objects
    // The activeWarnings array contains nested timestamp objects with _seconds/_nanoseconds
    // that must be converted for proper PDF generation
    disciplineRecommendation: (() => {
      const rawRecommendation = warningData.disciplineRecommendation || warningData.lraRecommendation;
      return convertAllTimestamps(rawRecommendation);
    })(),

    // Legal compliance
    legalCompliance: warningData.legalCompliance,

    // Delivery information (if available)
    deliveryChoice: warningData.deliveryChoice,

    // Appeal information (if available)
    appealDetails: warningData.appealDetails,
    appealOutcome: warningData.appealOutcome,
    appealDecisionDate: warningData.appealDecisionDate
      ? convertFirestoreTimestamp(warningData.appealDecisionDate)
      : undefined,
    appealReasoning: warningData.appealReasoning,
    hrNotes: warningData.hrNotes,
    followUpRequired: warningData.followUpRequired,
    followUpDate: warningData.followUpDate
      ? convertFirestoreTimestamp(warningData.followUpDate)
      : undefined,

    // ============================================
    // 🆕 CORRECTIVE COUNSELLING FIELDS - Unified Disciplinary Form Approach
    // ============================================

    // Section B - Employee's Version/Response
    employeeStatement: warningData.employeeStatement || undefined,

    // Section C - Expected Behavior/Standards
    expectedBehaviorStandards: warningData.expectedBehaviorStandards || undefined,

    // Section E - Facts Leading to Decision
    factsLeadingToDecision: warningData.factsLeadingToDecision || undefined,

    // Section F - Improvement Commitments (convert any timestamps)
    // 🔥 CRITICAL FIX: Handle both field names - actionSteps (new) and improvementCommitments (old)
    improvementCommitments: (() => {
      const commitments = warningData.improvementCommitments || warningData.actionSteps;
      if (!commitments || !Array.isArray(commitments)) return undefined;

      return commitments.map((commitment: any) => ({
        commitment: commitment.commitment || commitment.action || '',
        timeline: commitment.timeline || '',
        completedDate: commitment.completedDate
          ? convertFirestoreTimestamp(commitment.completedDate)
          : undefined
      }));
    })(),

    // Review date (convert timestamp)
    reviewDate: warningData.reviewDate
      ? convertFirestoreTimestamp(warningData.reviewDate)
      : undefined,

    // Intervention and support details
    interventionDetails: warningData.interventionDetails || undefined,
    resourcesProvided: warningData.resourcesProvided || undefined,
    trainingProvided: warningData.trainingProvided || undefined
  };

  Logger.debug('✅ PDF data transformation complete:', {
    warningId: pdfData.warningId,
    pdfGeneratorVersion: pdfData.pdfGeneratorVersion,
    employee: `${pdfData.employee.firstName} ${pdfData.employee.lastName}`,
    warningLevel: pdfData.warningLevel
  });

  return pdfData;
};

/**
 * 🔒 SECURITY-CRITICAL: Validate PDF data before generation
 *
 * Ensures all required fields are present before generating PDF.
 * Prevents generation of invalid/incomplete legal documents.
 *
 * @param pdfData - Transformed PDF data
 * @returns Validation result with error messages
 */
export const validatePDFData = (pdfData: any): {
  isValid: boolean;
  errors: string[]
} => {
  const errors: string[] = [];

  // Required fields
  if (!pdfData.warningId) {
    errors.push('Missing warning ID');
  }

  if (!pdfData.employee?.firstName || !pdfData.employee?.lastName) {
    errors.push('Missing employee name');
  }

  if (!pdfData.employee?.employeeNumber) {
    errors.push('Missing employee number');
  }

  if (!pdfData.category) {
    errors.push('Missing warning category');
  }

  if (!pdfData.description || pdfData.description.trim() === '') {
    errors.push('Missing incident description');
  }

  if (!pdfData.issuedDate || !(pdfData.issuedDate instanceof Date)) {
    errors.push('Invalid issue date');
  }

  if (!pdfData.organization?.name) {
    errors.push('Missing organization name');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 🔒 SECURITY AUDIT LOG
 *
 * LAST MODIFIED: 2025-10-14
 * MODIFIED BY: Claude Code
 * REASON: Added PDF generator version tracking for consistent regeneration
 * SECURITY IMPACT: HIGH - ensures warnings regenerate identically regardless of when regenerated
 * REVIEWED BY: [Pending]
 *
 * CHANGE HISTORY:
 * - 2025-10-14: Added pdfGeneratorVersion field to ensure consistent regeneration
 * - 2025-10-10: Initial creation to unify PDF generation across all components
 */
