// frontend/src/types/counselling.ts
// 📋 CORRECTIVE COUNSELLING TYPES
// ✅ Complete type definitions for preventive discipline system

export type CounsellingType = 'training' | 'coaching' | 'behavioral';
export type CounsellingStatus = 'completed' | 'follow_up_pending' | 'escalated' | 'improvement_noted';

// 🎯 Main Corrective Counselling Record
export interface CorrectiveCounselling {
  id: string;
  organizationId: string;
  
  // Participants
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  department?: string;
  
  // Content Details
  category: string; // Links to disciplinary categories
  categoryId?: string;
  counsellingType: CounsellingType;
  issueDescription: string;
  interventionDetails: string;
  trainingProvided?: string;
  resourcesProvided?: string[];
  
  // Promises to Perform (P2P) - includes timeline within each promise
  promisesToPerform: PromiseToPerform[];
  improvementTimeline: string; // Legacy field - now handled within promises
  followUpDate: string; // ISO date string
  
  // Signatures & Acknowledgment
  managerSignature: string;
  employeeSignature?: string;
  employeeAcknowledged: boolean;
  employeeComments?: string;
  
  // Status Tracking
  status: CounsellingStatus;
  improvementNoted: boolean;
  followUpCompleted: boolean;
  escalationRequired: boolean;
  
  // Timestamps
  dateCreated: string;
  dateCompleted?: string;
  followUpDate: string;
  lastUpdated: string;
  
  // Metadata
  createdBy: string;
  updatedBy?: string;
  documentVersion: number;
}

// 🎯 Promise to Perform Structure
export interface PromiseToPerform {
  id: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  evidence?: string;
  notes?: string;
}

// 🎯 Follow-up Record
export interface CounsellingFollowUp {
  id: string;
  counsellingId: string;
  followUpDate: string;
  improvementObserved: boolean;
  improvementDetails?: string;
  additionalConcerns?: string;
  nextAction: 'continue_monitoring' | 'additional_training' | 'formal_warning' | 'no_further_action';
  nextActionDate?: string;
  managerNotes: string;
  employeeFeedback?: string;
  createdBy: string;
  createdDate: string;
}

// 🎯 Counselling Summary (for dashboards)
export interface CounsellingSummary {
  employeeId: string;
  employeeName: string;
  totalSessions: number;
  lastSessionDate: string;
  pendingFollowUps: number;
  improvementTrend: 'improving' | 'stable' | 'declining' | 'no_data';
  commonCategories: string[];
  escalationRisk: 'low' | 'medium' | 'high';
}

// 🎯 Form Data Types (for UI components)
export interface CounsellingFormData {
  employeeId: string;
  category: string;
  counsellingType: CounsellingType;
  issueDescription: string;
  interventionDetails: string;
  trainingProvided: string;
  resourcesProvided: string[];
  promisesToPerform: Omit<PromiseToPerform, 'id' | 'completed' | 'completedDate'>[];
  followUpDate: string;
  employeeComments: string;
}

// 🎯 Validation Rules
export interface CounsellingValidationRules {
  issueDescription: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  interventionDetails: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  promisesToPerform: {
    minItems: number;
    maxItems: number;
    required: boolean;
  };
  followUpDate: {
    minDays: number; // minimum days from today
    maxDays: number; // maximum days from today
    required: boolean;
  };
}

// 🎯 Default Validation Rules
export const DEFAULT_COUNSELLING_VALIDATION: CounsellingValidationRules = {
  issueDescription: {
    minLength: 20,
    maxLength: 500,
    required: true
  },
  interventionDetails: {
    minLength: 30,
    maxLength: 1000,
    required: true
  },
  promisesToPerform: {
    minItems: 1,
    maxItems: 5,
    required: true
  },
  followUpDate: {
    minDays: 3,
    maxDays: 90,
    required: true
  }
};

// 🎯 Counselling Type Definitions
export const COUNSELLING_TYPES: Array<{
  id: CounsellingType;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    id: 'training',
    label: 'Training & Development',
    description: 'Skills training, knowledge sharing, and competency development',
    icon: '📚',
    color: 'blue'
  },
  {
    id: 'coaching',
    label: 'Performance Coaching',
    description: 'Performance improvement, goal setting, and mentoring',
    icon: '🎯',
    color: 'green'
  },
  {
    id: 'behavioral',
    label: 'Behavioral Discussion',
    description: 'Conduct, attitude, and workplace behavior guidance',
    icon: '🤝',
    color: 'purple'
  }
];

// 🎯 Export utility functions
export const getCounsellingTypeInfo = (type: CounsellingType) => {
  return COUNSELLING_TYPES.find(t => t.id === type) || COUNSELLING_TYPES[0];
};

export const formatCounsellingStatus = (status: CounsellingStatus): string => {
  const statusMap: Record<CounsellingStatus, string> = {
    completed: 'Completed',
    follow_up_pending: 'Follow-up Pending',
    escalated: 'Escalated',
    improvement_noted: 'Improvement Noted'
  };
  return statusMap[status] || status;
};

export const calculateDaysUntilFollowUp = (followUpDate: string): number => {
  const followUp = new Date(followUpDate);
  const today = new Date();
  const diffTime = followUp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};