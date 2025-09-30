// frontend/src/types/warningWizard.ts
// 🏆 ENHANCED WARNING WIZARD TYPES - CONFIDENCE LOGIC REMOVED
// ✅ Simplified type definitions without confidence scoring
// ✅ Clean, professional type definitions for the wizard system

import type { 
  EnhancedWarningFormData,
  EmployeeWithContext,
  WarningCategory,
  EscalationRecommendation,
  WarningLevel
} from '../services/WarningService';

// ============================================
// WIZARD CORE TYPES
// ============================================

export enum WizardStep {
  EMPLOYEE_SELECTION = 1,
  CATEGORY_ANALYSIS = 2,
  INCIDENT_DETAILS = 3,
  LEGAL_REVIEW = 4,
  SIGNATURE_COLLECTION = 5,
  DELIVERY_COMPLETION = 6
}

export interface WizardStepConfig {
  title: string;
  subtitle: string;
  icon: string; // Icon name for Lucide React
  color: string; // Tailwind gradient classes
}

export interface WizardProgress {
  currentStep: number; // Generic number instead of conflicting enum
  completedSteps: Set<number>;
  isStepValid: boolean;
  totalSteps: number;
  progressPercentage: number;
}

// ============================================
// WIZARD COMPONENT PROPS
// ============================================

export interface EnhancedWarningFormProps {
  onComplete?: () => void;
  onCancel?: () => void;
  preSelectedEmployeeId?: string;
  preSelectedCategoryId?: string;
}

export interface WizardHeaderProps {
  timeSpent: number;
  estimatedTimeRemaining: number;
  showDebugger: boolean;
  onToggleDebugger: () => void;
  onCancel: () => void;
}

export interface WizardProgressProps {
  currentStep: number; // Generic number instead of enum
  completedSteps: Set<number>;
  isStepValid: boolean;
  timeSpent: number;
  estimatedTimeRemaining: number;
  onStepClick: (step: number) => void;
}

export interface WizardNavigationProps {
  currentStep: number;
  isStepValid: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onProceedToSignatures: () => void;
}

// ============================================
// STEP COMPONENT PROPS
// ============================================

export interface EmployeeSelectionStepProps {
  employees: EmployeeWithContext[];
  selectedEmployee: EmployeeWithContext | null;
  formData: EnhancedWarningFormData;
  onEmployeeSelect: (employeeId: string) => void;
}

export interface CategoryAnalysisStepProps {
  categories: WarningCategory[];
  selectedCategory: WarningCategory | null;
  smartSuggestions: string[];
  isAnalyzing: boolean;
  onCategorySelect: (categoryId: string) => void;
}

export interface IncidentDetailsStepProps {
  formData: EnhancedWarningFormData;
  smartSuggestions: string[];
  updateFormData: (updates: Partial<EnhancedWarningFormData>) => void;
}

export interface LegalReviewStepProps {
  disciplineRecommendation: EscalationRecommendation | null;
  formData: EnhancedWarningFormData;
  updateFormData: (updates: Partial<EnhancedWarningFormData>) => void;
  isAnalyzing: boolean;
}

export interface SignatureCollectionStepProps {
  selectedEmployee: EmployeeWithContext | null;
  warningDataForFlow: WarningDataForFlow;
  onSignaturesComplete: (signatures: SignatureCollection) => void;
}

export interface DeliveryCompletionStepProps {
  selectedEmployee: EmployeeWithContext | null;
  warningDataForFlow: WarningDataForFlow;
  organization: any; // From OrganizationContext
  onComplete?: () => void;
}

// ============================================
// WIZARD FLOW DATA TYPES
// ============================================

export interface WarningDataForFlow {
  id: string;
  employeeId: string;
  categoryId: string;
  
  // Employee context
  employee: EmployeeWithContext;
  category: WarningCategory;
  
  // Timing
  issueDate: Date;
  expiryDate: Date;
  incidentDate: Date;
  incidentTime: string;
  
  // Content
  incidentLocation: string;
  incidentDescription: string;
  additionalNotes?: string;
  
  // Progressive discipline
  level: WarningLevel;
  validityPeriod: 3 | 6 | 12;
  disciplineRecommendation: EscalationRecommendation | null;
  escalationReason?: string;
  legalRequirements?: string[];
  
  // Administrative
  issuedBy: string;
  deliveryMethod?: string;
  
  // Signatures
  signatures?: SignatureCollection;
}

export interface SignatureCollection {
  manager: string | null;
  employee: string | null;
  witnesses?: string[];
  timestamp: string;
  managerName: string;
  employeeName: string;
  isFinalized: boolean;
}

// ============================================
// CATEGORY SUGGESTION TYPES
// ============================================

export interface CategorySuggestion {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relevanceScore: number;
  reasons: string[];
  examples: string[];
}

export interface SmartSuggestion {
  id: string;
  type: 'incident_description' | 'legal_requirement' | 'best_practice' | 'warning';
  text: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface CategorySuggestions {
  exampleIncidents: string[];
  legalRequirements: string[];
  bestPractices: string[];
  commonMistakes: string[];
}

// ============================================
// PROGRESSIVE DISCIPLINE TYPES
// ============================================

export interface ProgressiveDisciplineContext {
  employeeId: string;
  categoryId: string;
  currentLevel: WarningLevel | 'none';
  activeWarningsCount: number;
  lastWarningDate?: Date;
  escalationReason: string;
  legalRequirements: string[];
  recommendedLevel: WarningLevel;
  canEscalate: boolean;
  mustEscalate: boolean;
}

// ============================================
// WIZARD ANALYTICS TYPES - NO CONFIDENCE
// ============================================

export interface WizardAnalytics {
  sessionId: string;
  organizationId: string;
  userId: string;
  
  // Timing analytics
  totalTimeSpent: number;
  timePerStep: Record<number, number>; // Changed from WizardStep to number
  
  // Completion analytics
  completed: boolean;
  abandonedAtStep?: number; // Changed from WizardStep to number
  
  // User behavior
  stepsRevisited: number[]; // Changed from WizardStep[] to number[]
  errorsEncountered: string[];
  validationIssues: string[];
  
  // AI usage
  aiRecommendationAccepted: boolean;
  suggestedLevelUsed: boolean;
  smartSuggestionsUsed: number;
  
  // Performance metrics
  loadTime: number;
  apiResponseTimes: Record<string, number>;
  
  // Outcome
  finalWarningLevel: WarningLevel;
  deliveryMethodChosen: string;
  
  // Timestamps
  startedAt: string;
  completedAt?: string;
}

// ============================================
// WIZARD STATE MANAGEMENT
// ============================================

export interface WizardState {
  // Current state
  currentStep: number;
  completedSteps: Set<number>;
  isStepValid: boolean;
  
  // Selected data
  selectedEmployee: EmployeeWithContext | null;
  selectedCategory: WarningCategory | null;
  
  // Form data
  formData: EnhancedWarningFormData;
  signatures: SignatureCollection | null;
  
  // AI recommendations - NO CONFIDENCE
  disciplineRecommendation: EscalationRecommendation | null;
  smartSuggestions: string[];
  
  // Status flags
  isAnalyzing: boolean;
  isSubmitting: boolean;
  isNavigating: boolean;
  
  // Navigation
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  
  // Validation
  validationErrors: string[];
  validationWarnings: string[];
}

// ============================================
// WIZARD ACTIONS
// ============================================

export interface WizardActions {
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Data updates
  selectEmployee: (employee: EmployeeWithContext) => void;
  selectCategory: (category: WarningCategory) => void;
  updateFormData: (updates: Partial<EnhancedWarningFormData>) => void;
  updateSignatures: (signatures: SignatureCollection) => void;
  
  // Escalation interactions
  acceptRecommendation: (recommendation: EscalationRecommendation) => void;
  
  // Completion
  completeWizard: () => void;
  cancelWizard: () => void;
}

// ============================================
// DELIVERY PREFERENCES
// ============================================

export interface DeliveryPreferences {
  method: 'email' | 'whatsapp' | 'print' | 'hand_delivery';
  immediateDelivery: boolean;
  scheduleDate?: Date;
  includeAttachments: boolean;
  requireReadReceipt: boolean;
  sendCopyToManager: boolean;
  sendCopyToHR: boolean;
}

// ============================================
// WIZARD CONFIGURATION
// ============================================

export interface WizardConfiguration {
  // Step configuration
  enabledSteps: number[];
  skipOptionalSteps: boolean;
  autoAdvanceSteps: boolean;
  
  // AI features - NO CONFIDENCE
  enableSmartSuggestions: boolean;
  enableAutoRecommendations: boolean;
  enableRealTimeValidation: boolean;
  
  // Legal compliance
  enforceSignatures: boolean;
  requireManagerApproval: boolean;
  enableAuditTrail: boolean;
  
  // UI preferences
  showDebugger: boolean;
  enableFullScreen: boolean;
  showProgressBar: boolean;
  
  // Organization settings
  organizationId: string;
  companyName: string;
  legalJurisdiction: string;
  
  // Validation rules
  strictValidation: boolean;
  allowIncompleteData: boolean;
  requireAllFields: boolean;
}

// ============================================
// ERROR HANDLING
// ============================================

export interface WizardError {
  code: string;
  message: string;
  step?: number;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  recoverable: boolean;
  timestamp: Date;
}

export interface WizardValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: WizardError[];
  warnings: WizardError[];
  missingFields: string[];
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
  // Core service types
  EnhancedWarningFormData,
  EmployeeWithContext,
  WarningCategory,
  EscalationRecommendation,
  WarningLevel
} from '../services/WarningService';