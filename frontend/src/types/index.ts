// frontend/src/types/index.ts
// 🏆 CENTRAL TYPE EXPORT HUB - UPDATED
// ✅ Part 2B: Unified type exports - no more conflicts
// ✅ All WarningLevel types now come from core.ts
// ✅ Service types properly integrated

// ============================================
// CORE FOUNDATION TYPES
// ============================================
export * from './core';

// ============================================
// EMPLOYEE MANAGEMENT SYSTEM
// ============================================
export * from './employee';

// ============================================
// ORGANIZATION & SECTOR SYSTEM
// ============================================
export * from './organization';

// ============================================
// SIGNATURE SYSTEM
// ============================================
export * from './signature';

// ============================================
// MEETING & ABSENCE SYSTEMS
// ============================================
export * from './meetings';
export * from './absences';

// ============================================
// WARNING WIZARD TYPES
// ============================================
export * from './warningWizard';

// ============================================
// CORE TYPE RE-EXPORTS (Primary Source)
// ============================================

// Core foundational types - these are the PRIMARY source
export type {
  User,
  UserRole,
  UserRoleId,
  Organization,
  Employee,
  EmployeeFormData,
  Warning,
  WarningCategory,
  WarningLevel,           // ✅ This now includes 'counselling'
  DeliveryMethod,
  SeverityLevel,
  WarningStatus,
  ContractType,
  EscalationCondition,
  SALegalType
} from './core';

// ============================================
// SERVICE TYPE RE-EXPORTS (Secondary Source)
// ============================================

// Warning service types - these complement the core types
export type {
  // Employee context types
  EmployeeWithContext,
  
  // Form data types
  WarningFormData,
  EnhancedWarningFormData,
  
  // Audio recording types
  AudioRecordingData,
  AudioUploadRequest,
  AudioUploadResponse,
  OrganizationAudioSettings,
  
  // Evidence and witness types
  EvidenceItem,
  WitnessInfo,
  
  // Escalation and discipline types
  WarningEscalation,
  DisciplinaryRecord,
  EscalationRecommendation,
  
  // Summary and validation types
  ActiveWarningsSummary,
  WarningValidation
} from '../services/WarningService';

// ============================================
// ORGANIZATION & SECTOR TYPES
// ============================================
export type {
  Sector,
  DisciplinaryCategory,
  DocumentTemplate,
  LegalRequirement,
  EscalationRule,
  DeliveryConfiguration,
  OrganizationSectorConfig
} from './organization';

// ============================================
// SIGNATURE TYPES
// ============================================
export type {
  SignatureData,
  SignatureCollection,
  SignatureValidationResult,
  SignatureCanvasProps
} from './signature';

// ============================================
// EMPLOYEE PERMISSION TYPES
// ============================================
export type {
  EmployeePermissions,
  EmployeeStats,
  EmployeeFilters
} from './employee';

// ============================================
// WIZARD TYPES
// ============================================
export type {
  WizardStepConfig,
  WizardProgress,
  EnhancedWarningFormProps,
  WizardHeaderProps,
  WizardProgressProps,
  WizardNavigationProps,
  IncidentDetailsStepProps,
  LegalReviewStepProps,
  DeliveryCompletionStepProps
} from './warningWizard';

// ============================================
// CONVENIENCE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================

// Legacy aliases - these point to the unified types
export type WarningLevelType = WarningLevel;
export type WarningCategoryType = WarningCategory;
export type EmployeeType = Employee;
export type OrganizationType = Organization;

// Service aliases
export type Recommendation = EscalationRecommendation;
export type EmployeeContext = EmployeeWithContext;
export type FormData = EnhancedWarningFormData;