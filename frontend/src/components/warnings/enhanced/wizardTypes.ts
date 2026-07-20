// frontend/src/components/warnings/enhanced/wizardTypes.ts
//
// Shared types + constants for UnifiedWarningWizard. Extracted in Phase 2
// Tier 3C step 1. No behavior change — pure relocation from the wizard
// file to enable phase-component extraction in subsequent commits.

import type {
  EmployeeWithContext,
  WarningCategory,
  EnhancedWarningFormData,
} from '@/services/WarningService';
import {
  User,
  FileText,
  Tag,
  MessageSquare,
  Target,
  TrendingUp,
  CheckCircle,
  FileSearch,
  PenTool,
  Send,
} from 'lucide-react';

// ============================================
// TYPE ALIASES
// ============================================

export type Employee = EmployeeWithContext;
export type Category = WarningCategory;
export type FormData = EnhancedWarningFormData;

// ============================================
// LOCAL TYPES
// ============================================

export interface SignatureData {
  manager: string | null;
  employee: string | null;
  witness: string | null;
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
  witnessName?: string;
}

export interface ActionCommitment {
  id: string;
  commitment: string;
  timeline: string;
}

export interface UnifiedWarningWizardProps {
  employees: Employee[];
  categories: Category[];
  currentManagerName: string;
  organizationName: string;
  onComplete: () => void;
  onCancel: () => void;
  preSelectedEmployeeId?: string;
  preSelectedCategoryId?: string;
  isFullScreen?: boolean;
  /** Optional: Preloaded warnings from dashboard, used to skip Cloud Function call for employee history. */
  preloadedWarnings?: any[];
  /** Optional: Skip the overview and start directly in practice/test mode (setup-checklist entry). */
  startInPracticeMode?: boolean;
  /** Optional: Called when a practice run finishes (before onComplete). */
  onPracticeComplete?: () => void;
}

// ============================================
// PHASE ENUM + METADATA
// ============================================

export enum Phase {
  EMPLOYEE_SELECTION = 0,
  CATEGORY_RECOMMENDATION = 1,
  INCIDENT_DETAILS = 2,
  EMPLOYEE_RESPONSE = 3,
  EXPECTED_STANDARDS = 4,
  IMPROVEMENT_PLAN = 5,
  REVIEW_DOCUMENTATION = 6,
  SCRIPT_PDF_REVIEW = 7,
  SIGNATURES = 8,
  DELIVERY = 9,
}

export const PHASE_INFO = [
  { title: 'Employee Selection', icon: User, guidance: 'Who is involved in this incident?' },
  { title: 'Category & Recommendation', icon: Tag, guidance: 'Classify the misconduct and review the system recommendation' },
  { title: 'Incident Details', icon: FileText, guidance: 'Document the facts: when, where, and what happened' },
  { title: "Employee's Response", icon: MessageSquare, guidance: 'What did the employee say when you discussed the incident?' },
  { title: 'Expected Standards', icon: Target, guidance: 'What behavior, performance, or conduct is expected?' },
  { title: 'Improvement Plan', icon: TrendingUp, guidance: 'Record specific commitments with timelines and set follow-up' },
  { title: 'Review Documentation', icon: CheckCircle, guidance: 'Review all information before proceeding to signatures' },
  { title: 'Script & PDF Review', icon: FileSearch, guidance: 'Read the warning script aloud, then review the PDF together' },
  { title: 'Signatures', icon: PenTool, guidance: 'Collect signatures to finalize and save the warning' },
  { title: 'Delivery', icon: Send, guidance: 'Select how the warning will be delivered to the employee' },
];

export const TOTAL_PHASES = 10;
