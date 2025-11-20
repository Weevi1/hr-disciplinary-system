// frontend/src/types/core.ts
// 🏆 CORE FOUNDATION TYPES - Essential shared types for the entire system
// Version: 2.2 - ENHANCED: Built on existing core.ts with counselling support
// 🔧 CRITICAL FIX: Added 'counselling' to WarningLevel type without losing functionality
// ✅ Preserves all existing interfaces and functionality

// ============================================
// CORE ENUMS & UNIONS - ENHANCED
// ============================================

export type UserRoleId = 'super-user' | 'executive-management' | 'hr-manager' | 'hod-manager';
// Industry type - accepts any string to support 90+ industry categories
export type IndustryType = string;
export type DeliveryMethod = 'email' | 'whatsapp' | 'printed';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

// 🔧 ENHANCED: Added 'counselling' as first level in progressive discipline
export type WarningLevel = 
  | 'counselling'      // ✅ ADDED: Entry level for minor issues
  | 'verbal'           // Verbal warning
  | 'first_written'    // First written warning
  | 'second_written'   // Second written warning
  | 'final_written'    // Final written warning
  | 'suspension'       // Suspension with/without pay
  | 'dismissal';       // Termination

export type WarningStatus = 'issued' | 'delivered' | 'acknowledged';
export type ContractType = 'permanent' | 'contract' | 'temporary';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type EscalationCondition = 'repeat_offense' | 'time_based' | 'severity_based';
export type SALegalType = 'minor_misconduct' | 'serious_misconduct' | 'gross_misconduct';

// ============================================
// USER & AUTHENTICATION - PRESERVED
// ============================================

// HOD Dashboard Feature Permissions
// Allows HR to control which features each HOD manager can access
export interface HODPermissions {
  canIssueWarnings: boolean;        // Access to Issue Warning button
  canBookHRMeetings: boolean;       // Access to Book HR Meeting button
  canReportAbsences: boolean;       // Access to Report Absence button
  canRecordCounselling: boolean;    // Access to Counselling button
}

export interface User {
  uid: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  departmentIds?: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions: Permission[];
  claimsVersion?: number; // For detecting stale JWT tokens (increments on role/permission changes)
  updatedAt?: string;     // Track last permission/role change timestamp
  mustChangePassword?: boolean; // Flag for users with temp123 password who must change it on first login
  passwordChangedAt?: string;   // Timestamp of last password change
  hasSeenWelcome?: boolean; // Flag for first-time login welcome message
  hodPermissions?: HODPermissions; // Feature toggles for HOD managers (controlled by HR)
}

export interface UserRole {
  id: UserRoleId;
  name: string;
  description: string;
  level: number;
}

export interface Permission {
  resource: string;
  actions: string[];
  scope: 'global' | 'organization' | 'department' | 'self';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: string;
  value: any;
}

// Minimal Custom Claims for JWT Token (Firebase has 1000 byte limit)
// This is what's stored in the Firebase Auth token for fast offline validation
// Full permissions are stored in Firestore and checked server-side
export interface MinimalCustomClaims {
  org: string;      // Organization ID (shortened key to save bytes)
  r: UserRoleId;    // Role ID (shortened key)
  v: number;        // Claims version (for staleness detection)
  iat: number;      // Issued at timestamp
  res?: string;     // Reseller ID (only for reseller users)
}

// ============================================
// ORGANIZATION - Enhanced with Sector Integration - PRESERVED
// ============================================

// 📄 PDF SECTION CONFIGURATION - Individual section settings
// Defines structure and content for each PDF section with drag-and-drop reordering
export interface PDFSectionConfig {
  id: string;                        // Unique section ID (e.g., 'employee-info', 'incident-details')
  type: 'standard' | 'custom';       // Standard = built-in, Custom = user-created
  name: string;                      // Display name (e.g., 'Employee Information')
  enabled: boolean;                  // Show/hide section in PDF
  order: number;                     // Display order (0-based, supports drag-drop reordering)

  // Section Content (supports {{placeholder}} custom fields)
  content: {
    heading: string;                 // Section heading text (e.g., 'Employee Information')
    body?: string;                   // Main text content (supports {{employee.firstName}}, etc.)
    bulletPoints?: string[];         // Optional list items (each can have {{placeholders}})

    // 🆕 SUBSECTIONS SUPPORT - For structured multi-part sections (Employee Rights, Consequences, etc.)
    // Enables grouping related content with subsection titles and content blocks
    // Used by v1.1.0 rendering methods to maintain beautiful styling while allowing text editing
    subsections?: Array<{
      title: string;                 // Subsection title (e.g., "Your Rights:", "What Happens Next:")
      content: string | string[];    // String for paragraph, array for bullet points
    }>;

    tableData?: {                    // Optional table structure
      headers: string[];
      rows: string[][];              // Each cell can have {{placeholders}}
    };
  };

  // Per-Section Styling Overrides
  styling?: {
    headingFontSize?: number;        // Override heading font (default: use template settings)
    bodyFontSize?: number;           // Override body font (default: use template settings)
    headingColor?: string;           // Override heading color (HEX)
    backgroundColor?: string;        // Section background color (HEX)
    borderColor?: string;            // Section border color (HEX)
    spacingBefore?: number;          // Space before section (mm)
    spacingAfter?: number;           // Space after section (mm)
    indent?: number;                 // Content indentation (mm)
  };

  // Section Metadata
  description?: string;              // Purpose/usage description
  isLocked?: boolean;                // Prevent editing (for critical legal sections)
  requiredFields?: string[];         // Required {{placeholders}} that must exist in content

  createdAt?: Date | string;         // When section was created
  createdBy?: string;                // SuperAdmin UID who created section
  updatedAt?: Date | string;         // Last modification
  updatedBy?: string;                // SuperAdmin UID who last updated
}

// 📄 PDF TEMPLATE SETTINGS - Per-Organization PDF Customization
// Allows SuperAdmin to customize PDF generation per organization with visual editor
export interface PDFTemplateSettings {
  // Version Control
  generatorVersion: string;          // e.g., '1.1.0', '1.2.0' - PDF generation version
  templateId?: string;               // Links to custom template if exists
  lastUpdated: Date | string;        // Last modification timestamp
  updatedBy: string;                 // SuperAdmin UID who last updated

  // Visual Styling Configuration
  styling: {
    // Colors
    headerBackground: string;        // HEX color for header (e.g., '#3B82F6')
    sectionHeaderColor: string;      // Section title color
    bodyTextColor: string;           // Main text color
    borderColor: string;             // Border/divider color
    useBrandColors: boolean;         // Use organization's branding.primaryColor?

    // Typography
    fontSize: number;                // Base font size (10-12pt)
    fontFamily: 'Helvetica' | 'Times' | 'Arial';
    lineHeight: number;              // Line spacing multiplier (1.0-2.0)

    // Layout
    pageSize: 'A4' | 'Letter';       // Paper size
    margins: {
      top: number;                   // mm
      bottom: number;                // mm
      left: number;                  // mm
      right: number;                 // mm
    };
  };

  // Content Configuration
  content: {
    // Logo & Branding
    showLogo: boolean;               // Display company logo in header?
    logoPosition: 'top-left' | 'top-center' | 'top-right';
    logoMaxHeight: number;           // Logo max height in mm (10-30)

    // Section Visibility (Enable/Disable sections)
    enabledSections: string[];       // e.g., ['employee-info', 'incident', 'rights', 'signatures']

    // Watermarks
    showWatermark: boolean;          // Display diagonal watermark?
    watermarkText: string;           // Watermark text (e.g., 'CONFIDENTIAL')
    watermarkOpacity: number;        // Opacity 0-1 (0.1 = 10% opacity)

    // Footer Customization
    footerText: string;              // Footer text (default: "Confidential & Privileged")
    showPageNumbers: boolean;        // Display page numbers?

    // Legal Text Version
    legalTextVersion: 'south-africa-lra' | 'custom';
    customLegalText?: string;        // Custom legal text if legalTextVersion = 'custom'
  };

  // Feature Flags (Toggle PDF sections)
  features: {
    enablePreviousWarnings: boolean;  // Show previous disciplinary action section?
    enableConsequences: boolean;      // Show consequences section?
    enableEmployeeRights: boolean;    // Show employee rights section (LRA)?
    enableAppealSection: boolean;     // Show appeal history section?
    enableSignatures: boolean;        // Show signature section?
  };

  // 🆕 SECTION CONFIGURATION - Enhanced Section Editor
  // Array of section configs with full CRUD + drag-drop reordering
  // Replaces legacy enabledSections string[] with rich section objects
  sections?: PDFSectionConfig[];      // Section configurations (order matters!)

  // Version History (Audit Trail)
  versionHistory: Array<{
    version: string;                 // Version number (e.g., '1.1.0')
    activatedAt: Date | string;      // When version was activated
    activatedBy: string;             // SuperAdmin UID
    previousVersion?: string;        // Previous version (e.g., '1.0.0')
    reason?: string;                 // Reason for upgrade/change
    changes?: string[];              // List of changes made
  }>;

  // Rollout Control
  autoUpgrade: boolean;              // Auto-upgrade to new versions when released?
  betaFeatures: boolean;             // Enable experimental features?
}

export interface Organization {
  id: string;
  name: string;
  industry: IndustryType;
  sectorId?: string;
  sectorName?: string;
  branding: {
    logo: string | null;
    primaryColor: string;    // Main brand color - buttons, headers, key UI elements
    secondaryColor: string;  // Supporting color - secondary buttons, backgrounds
    accentColor: string;     // Accent color - badges, highlights, notifications
    companyName: string;
    domain: string;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    defaultDeliveryMethod: DeliveryMethod;
    allowEmployeeChoice: boolean;
    requireSignatures: boolean;
    delivery?: {
      allowedMethods: DeliveryMethod[];
      printAdmin: {
        name: string;
        email: string;
      };
    };
    // 📋 Code of Conduct / Disciplinary Code Reference
    codeOfConductReference?: string; // e.g., "Annexure B: Disciplinary Code 2022" or "Company Code of Conduct"
  };
  customization: {
    enablePhotoCapture: boolean;
    enableWhatsAppDelivery: boolean;
    enablePrintDelivery: boolean;
  };

  // 📄 PDF Template Settings - Per-organization PDF customization
  pdfSettings?: PDFTemplateSettings;

  createdAt?: string;
  updatedAt?: string;
}

// Maintain backward compatibility
export type OrganizationConfig = Organization;

// ============================================
// EMPLOYEE SYSTEM - Complete Structure - PRESERVED
// ============================================

export interface EmployeeProfile {
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  department: string;
  position: string;
  startDate: Date;
}

export interface EmploymentDetails {
  startDate: Date;
  endDate?: Date;
  contractType: ContractType;
  probationEndDate?: Date;
  department: string;
  position: string;
  managerIds?: string[]; // 🔧 CHANGED: Multi-manager support (was managerId?: string)
  managerId?: string; // ⚠️ DEPRECATED: Keep for backward compatibility, use managerIds instead
}

export interface DisciplinaryRecord {
  totalWarnings: number;
  activeWarnings: number;
  currentLevel: WarningLevel | 'none'; // ✅ Now supports 'counselling'
  lastWarningDate?: Date;
  warningHistory: WarningHistoryEntry[];
  warningsByCategory: Record<string, number>;
  notes?: string;
}

export interface WarningHistoryEntry {
  id: string;
  warningId?: string;
  category: string;
  level: WarningLevel; // ✅ Now supports 'counselling'
  date?: Date;
  issueDate: Date;
  expiryDate?: Date;
  description?: string;
  issuedBy?: string;
  status?: WarningStatus;
}

export interface DeliveryPreferences {
  preferredMethod: DeliveryMethod;
  whatsappNumber?: string;
  emailAddress?: string;
  allowMultipleMethods: boolean;
  requireReadReceipt: boolean;
  timezone: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  profile: EmployeeProfile;
  employment: EmploymentDetails;
  disciplinaryRecord: DisciplinaryRecord;
  deliveryPreferences: DeliveryPreferences;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Archive lifecycle fields
  archivedAt?: Date | any; // Support both Date and Firestore Timestamp
  archiveReason?: string;
  archivedBy?: string;
  restoredAt?: Date | any;
  restoredBy?: string;
}

export interface EmployeeFormData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  department: string;
  position: string;
  startDate: string;
  contractType: ContractType;
  probationEndDate?: string;
  managerIds?: string[]; // 🔧 CHANGED: Multi-manager support (was managerId?: string)
  managerId?: string; // ⚠️ DEPRECATED: Keep for backward compatibility during transition
  isActive: boolean;
}

// ============================================
// WARNING SYSTEM - Enhanced with Counselling Support - PRESERVED & ENHANCED
// ============================================

export interface Warning {
  id: string;
  organizationId: string;
  employeeId: string;
  categoryId: string;
  level: WarningLevel; // ✅ Now supports 'counselling'
  title: string;
  description: string;
  incidentDate: Date;
  incidentTime?: string;
  incidentLocation?: string;
  additionalNotes?: string;
  issueDate: Date;
  expiryDate: Date;
  validityPeriod?: 3 | 6 | 12;
  issuedBy: string;
  deliveryMethod?: DeliveryMethod;
  deliveryStatus?: DeliveryStatus;
  deliveryDate?: Date;
  signatures?: any; // Will be defined in signature.ts
  followUpActions: string[];
  status: WarningStatus;
  createdAt: string | Date;
  updatedAt: string | Date;

  // 📄 HISTORICAL ENTRY TRACKING - For warnings created outside the system
  isHistoricalEntry?: boolean;        // Flag indicating manual entry from physical document
  enteredBy?: string;                 // User ID who entered the historical warning
  enteredAt?: Date;                   // Timestamp when warning was entered into system
  hasPhysicalCopy?: boolean;          // Confirmation that physical signed document exists
  physicalCopyLocation?: string;      // Where physical copy is stored (e.g., "Filing Cabinet A3")
  historicalNotes?: string;           // Additional context about the historical entry

  // 🎨 PDF TEMPLATE SNAPSHOT - Organization's template settings at time of warning creation
  // This ensures warnings can regenerate with the exact styling they had originally
  pdfGeneratorVersion?: string;       // Global code version (e.g., '1.1.0') - routes to correct handler
  pdfSettings?: PDFTemplateSettings;  // Snapshot of org's template configuration at creation time

  // ============================================
  // 🆕 CORRECTIVE COUNSELLING FIELDS - Unified Disciplinary Form Approach
  // Matches client template sections (B, C, E, F) for comprehensive corrective action
  // ============================================

  /**
   * Section B - Employee's Version/Response
   * Employee's side of the story, their perspective on the incident
   */
  employeeStatement?: string;

  /**
   * Section C - Expected Behavior/Standards (Corrective Guidance)
   * Clear explanation of the required/expected behavior, performance, conduct, or standards
   * What the employee should be doing instead of the misconduct
   */
  expectedBehaviorStandards?: string;

  /**
   * Section E - Facts Leading to Decision Taken
   * Detailed reasoning and evidence that led to the disciplinary decision
   * Legal/HR justification for the action level chosen
   */
  factsLeadingToDecision?: string;

  /**
   * Section F - Action Steps/Improvement Commitments
   * Specific commitments from the employee to improve conduct/performance
   * Each commitment has a timeline and optional completion tracking
   */
  improvementCommitments?: Array<{
    commitment: string;        // What the employee commits to do
    timeline: string;          // When this commitment should be completed by
    completedDate?: any;       // Firestore Timestamp when commitment was completed
  }>;

  /**
   * Follow-up/Review Date
   * Scheduled date to review progress on improvement commitments
   * Often 30-90 days after warning issuance
   */
  reviewDate?: any;            // Firestore Timestamp for review meeting

  /**
   * Intervention Details
   * Training, coaching, or support provided to help employee improve
   * Examples: "One-on-one coaching sessions", "Time management training"
   */
  interventionDetails?: string;

  /**
   * Resources Provided
   * Tools, materials, or resources given to support improvement
   * Examples: ["Training manual", "Mentorship program", "Performance checklist"]
   */
  resourcesProvided?: string[];

  /**
   * Training Provided
   * Specific training sessions or courses completed
   * Examples: ["Customer service workshop", "Safety procedures refresher"]
   */
  trainingProvided?: string[];

  // ============================================
  // 🔄 REVIEW FOLLOW-UP TRACKING - Auto-Satisfaction System
  // ============================================

  /**
   * Review Status
   * Tracks the current state of the review process
   * - pending: Review date is in the future
   * - due_soon: Review date is within 3 days
   * - overdue: Review date has passed, but within 7-day grace period
   * - in_progress: HR has started the review process
   * - completed_satisfactory: Employee met improvement commitments
   * - completed_unsatisfactory: Employee did not meet commitments (requires escalation)
   * - auto_satisfied: Automatically marked satisfactory after 7 days overdue
   * - escalated: Unsatisfactory review resulted in new warning
   */
  reviewStatus?: 'pending' | 'due_soon' | 'overdue' | 'in_progress' | 'completed_satisfactory' | 'completed_unsatisfactory' | 'auto_satisfied' | 'escalated';

  /**
   * Review Completion Date
   * Timestamp when HR completed the review
   */
  reviewCompletedDate?: any; // Firestore Timestamp

  /**
   * Review Completed By
   * User ID of the HR manager who completed the review
   */
  reviewCompletedBy?: string;

  /**
   * Review Completed By Name
   * Full name of the HR manager for display purposes
   */
  reviewCompletedByName?: string;

  /**
   * Review HOD Feedback
   * Verbal feedback from the employee's direct manager (HOD) about progress
   * This is gathered by HR during the review process
   */
  reviewHODFeedback?: string;

  /**
   * Review HR Notes
   * HR manager's notes and observations during the review
   * Internal notes for audit trail and future reference
   */
  reviewHRNotes?: string;

  /**
   * Review Outcome
   * Final assessment of employee's progress
   * - satisfactory: Employee met improvement commitments
   * - some_concerns: Showing improvement but needs continued monitoring
   * - unsatisfactory: Did not meet commitments, requires escalation
   */
  reviewOutcome?: 'satisfactory' | 'some_concerns' | 'unsatisfactory';

  /**
   * Review Next Steps
   * Action taken if review was unsatisfactory
   * Examples: "Escalated to Final Warning", "Extended improvement period by 30 days"
   */
  reviewNextSteps?: string;

  /**
   * Auto-Satisfied Date
   * Timestamp when the warning was automatically marked satisfactory
   * Set after 7 days past review date with no HR action
   */
  autoSatisfiedDate?: any; // Firestore Timestamp

  /**
   * Escalated To Warning ID
   * Link to the new warning created if this review resulted in escalation
   * Maintains audit trail of progressive discipline
   */
  escalatedToWarningId?: string;

  /**
   * Review Last Checked
   * Timestamp of last automated review status check
   * Used by cron job to track processing
   */
  reviewLastChecked?: any; // Firestore Timestamp
}

export interface WarningCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  escalationPath?: WarningLevel[]; // ✅ Now supports 'counselling'
  requiredDocuments: string[];
  charges?: string[];
  isActive: boolean;
  saLegalType?: SALegalType;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// RECOGNITION TYPES
// ============================================

export type RecognitionType =
  | 'exceptional_performance'
  | 'going_above_beyond'
  | 'innovation'
  | 'teamwork'
  | 'leadership'
  | 'customer_service'
  | 'safety_excellence'
  | 'continuous_improvement'
  | 'mentorship'
  | 'problem_solving';

export type RecognitionRewardType =
  | 'verbal_praise'
  | 'certificate'
  | 'monetary_bonus'
  | 'gift_voucher'
  | 'extra_leave_day'
  | 'public_recognition'
  | 'career_development'
  | 'none';

export interface Recognition {
  id: string;
  organizationId: string;

  // Employee Information
  employeeId: string;
  employeeName: string;
  employeePhotoUrl?: string;
  employeeRole?: string;
  departmentId?: string;
  departmentName?: string;

  // Recognition Details
  recognitionType: RecognitionType;
  achievementTitle: string;
  achievementDescription: string;
  businessImpact?: string;
  skillsDemonstrated?: string[];

  // Recognition Given
  rewardsGiven?: RecognitionRewardType[];
  monetaryAmount?: number;

  // Manager Information
  recognizedBy: string;           // Manager UID
  recognizedByName: string;       // Manager full name
  recognizedByRole?: string;      // Manager role for context

  // Timestamps
  recognitionDate: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;

  // Additional Context
  witnessedBy?: string[];         // UIDs of witnesses (other managers)
  isPublic: boolean;              // Whether to share in company-wide announcements
  notes?: string;                 // Private notes for HR

  // Certificate Generation
  certificateUrl?: string;        // PDF certificate URL if generated
  certificateGeneratedAt?: Date | string;
}

// ============================================
// CONTEXT TYPES - PRESERVED
// ============================================

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

export interface OrganizationContextType {
  organization: Organization | null;
  employees: Employee[];
  warnings: Warning[];
  warningCategories: WarningCategory[];
  loading: boolean;
  error: string | null;
  loadEmployees: () => Promise<void>;
  loadWarnings: () => Promise<void>;
  loadWarningCategories: () => Promise<void>;
}

// ============================================
// UTILITY TYPES - PRESERVED
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface EntityTimestamps {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ============================================
// LEGACY COMPATIBILITY - PRESERVED
// ============================================

export interface EmployeeLegacyMapping {
  // Legacy: employeeCode -> New: profile.employeeNumber
  // Legacy: firstName -> New: profile.firstName
  // Legacy: phone -> New: profile.phoneNumber
  // Legacy: warningCount -> New: disciplinaryRecord.activeWarnings
  // Legacy: lastWarningDate -> New: disciplinaryRecord.lastWarningDate
}

// ============================================
// RE-EXPORTS FOR CONVENIENCE - PRESERVED
// ============================================

export type Action = string;
export type { DeliveryStatus as DeliveryStatusType };

// Re-export the enhanced WarningLevel for backward compatibility
export { WarningLevel as UnifiedWarningLevel };