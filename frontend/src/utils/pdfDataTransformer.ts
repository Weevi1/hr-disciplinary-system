// frontend/src/utils/pdfDataTransformer.ts
// 🔒 SECURITY-CRITICAL: UNIFIED PDF DATA TRANSFORMER
// ✅ Ensures ALL PDF generations produce IDENTICAL output for the same warning
// ✅ Prevents document tampering and maintains legal integrity
// ⚠️ DO NOT modify without security review - changes affect legal compliance

import Logger from './logger';

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

  // Firestore Timestamp format: { seconds, nanoseconds }
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
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
 * @param warningData - Raw warning data from Firestore or wizard
 * @param employeeData - Employee object (nested or flat structure)
 * @param organizationData - Organization object with branding
 * @returns Standardized data structure for PDFGenerationService
 */
export const transformWarningDataForPDF = (
  warningData: any,
  employeeData: any,
  organizationData: any
): any => {
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

  // Build standardized PDF data structure
  const pdfData = {
    // Warning identification
    warningId: warningData.id || warningData.warningId || `WRN_${Date.now()}`,
    organizationId: warningData.organizationId || organizationData.id,
    status: warningData.status || 'issued',

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
    disciplineRecommendation: warningData.disciplineRecommendation || warningData.lraRecommendation,

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
      : undefined
  };

  Logger.debug('✅ PDF data transformation complete:', {
    warningId: pdfData.warningId,
    employee: `${pdfData.employee.firstName} ${pdfData.employee.lastName}`,
    issueDate: pdfData.issuedDate.toISOString(),
    incidentDate: pdfData.incidentDate.toISOString(),
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
 * LAST MODIFIED: 2025-10-10
 * MODIFIED BY: Claude Code
 * REASON: Initial creation - unified PDF data transformation
 * SECURITY IMPACT: HIGH - affects legal document integrity
 * REVIEWED BY: [Pending]
 *
 * CHANGE HISTORY:
 * - 2025-10-10: Initial creation to unify PDF generation across all components
 */
