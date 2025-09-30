// frontend/src/types/core.ts
// 🏆 CORE FOUNDATION TYPES - Essential shared types for the entire system
// Version: 2.2 - ENHANCED: Built on existing core.ts with counselling support
// 🔧 CRITICAL FIX: Added 'counselling' to WarningLevel type without losing functionality
// ✅ Preserves all existing interfaces and functionality

// ============================================
// CORE ENUMS & UNIONS - ENHANCED
// ============================================

export type UserRoleId = 'super-user' | 'business-owner' | 'hr-manager' | 'hod-manager';
export type IndustryType = 'manufacturing' | 'retail' | 'healthcare' | 'security' | 'mining';
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

// ============================================
// ORGANIZATION - Enhanced with Sector Integration - PRESERVED
// ============================================

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
  };
  customization: {
    enablePhotoCapture: boolean;
    enableWhatsAppDelivery: boolean;
    enablePrintDelivery: boolean;
  };
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
  managerId?: string;
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
  managerId?: string;
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