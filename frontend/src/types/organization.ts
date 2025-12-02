// frontend/src/types/organization.ts
// 🏆 COMPLETE ORGANIZATION & SECTOR SYSTEM
// Enhanced with sector integration, document templates, and legal framework

import type {
  Organization as CoreOrganization,
  IndustryType,
  DeliveryMethod,
  WarningLevel,
  SeverityLevel,
  EscalationCondition,
  SALegalType
} from './core';

// ============================================
// RE-EXPORTS FROM CORE
// ============================================

export type Organization = CoreOrganization;
export type { IndustryType, DeliveryMethod, WarningLevel, SeverityLevel, SALegalType };

// ============================================
// SECTOR SYSTEM - Industry-Specific Templates
// ============================================

export interface Sector {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  categories: DisciplinaryCategory[];
  escalationRules: SectorEscalationRule[];
  complianceNotes?: string;
}

export interface DisciplinaryCategory {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  sectorId: string;
  escalationPath: any[];
  requiredDocuments: string[];
  commonInSector: boolean;
  exampleIncidents?: string[];
}

export interface SectorEscalationRule {
  id: string;
  sectorId: string;
  categoryId: string;
  condition: EscalationCondition;
  triggerCount?: number;
  triggerDays?: number;
  fromLevel: string;
  toLevel: string;
  autoEscalate: boolean;
}

// ============================================
// ORGANIZATION SECTOR CONFIGURATION
// ============================================

export interface OrganizationSectorConfig {
  organizationId: string;
  sectorId: string;
  customCategories?: DisciplinaryCategory[];
  customEscalationRules?: SectorEscalationRule[];
  enabledFeatures: {
    autoEscalation: boolean;
    aiRecommendations: boolean;
    sectorCompliance: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DOCUMENT TEMPLATES
// ============================================

export interface DocumentTemplate {
  id: string;
  organizationId: string;
  type: 'warning_letter' | 'email_template' | 'whatsapp_template';
  name: string;
  description: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// PHOTO & DOCUMENT CAPTURE
// ============================================

export interface DocumentCapture {
  id: string;
  organizationId: string;
  employeeId: string;
  managerId: string;
  photo: {
    url: string;
    metadata: PhotoMetadata;
  };
  documentType: string;
  description: string;
  capturedAt: Date;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface PhotoMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  captureMethod: 'upload' | 'camera';
  location?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================
// LEGAL FRAMEWORK (SA Compliance)
// ============================================

export interface LegalRequirement {
  id: string;
  level: WarningLevel;
  category: string;
  requirements: string[];
  mandatoryFields: string[];
  documentation: string[];
  timeframes: {
    notice: number;
    response: number;
    appeal: number;
  };
  ccmaGuidelines: string[];
}

export interface DisciplinaryRecordUpdate {
  warningId: string;
  category: string;
  level: WarningLevel;
  issueDate: Date;
  expiryDate?: Date;
}

export interface EscalationValidation {
  isValid: boolean;
  reasons: string[];
  suggestedLevel?: WarningLevel;
}

// ============================================
// ENHANCED WARNING CATEGORY
// ============================================

export interface WarningCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  escalationPath?: WarningLevel[];
  requiredDocuments: string[];
  charges?: string[];
  isActive: boolean;
  saLegalType?: SALegalType;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  sectorId?: string;
  commonInSector?: boolean;
  exampleIncidents?: string[];
  investigationQuestions?: string[];
  usage: number;
  lastUsed?: string;
  tags?: string[];
}

// ============================================
// ESCALATION RULES (Enhanced)
// ============================================

export interface EscalationRule {
  id: string;
  scope?: 'sector' | 'organization';
  scopeId?: string;
  sectorId?: string;
  organizationId?: string;
  categoryId: string;
  condition?: EscalationCondition;
  triggerCount?: number;
  triggerDays?: number;
  fromLevel: string;
  toLevel: string;
  timeframeDays?: number;
  autoEscalate: boolean;
  conditions?: Array<{
    type: string;
    value: any;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationEscalationRule {
  id: string;
  organizationId: string;
  categoryId: string;
  fromLevel: string;
  toLevel: string;
  timeframeDays: number;
  autoEscalate: boolean;
  conditions: Array<{
    type: string;
    value: any;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// DELIVERY SYSTEM ENHANCEMENTS
// ============================================

export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface DeliveryConfiguration {
  organizationId: string;
  allowedMethods: DeliveryMethod[];
  defaultMethod: DeliveryMethod;
  employeeChoiceEnabled: boolean;
  email: {
    enabled: boolean;
    fromAddress: string;
    replyToAddress: string;
    templateId?: string;
  };
  whatsapp: {
    enabled: boolean;
    businessAccountId: string;
    templateIds: string[];
    consentRequired: boolean;
  };
  print: {
    enabled: boolean;
    adminName: string;
    adminEmail: string;
    printerLocation: string;
    requiresSignedReceipt: boolean;
  };
}

// ============================================
// UTILITY FUNCTIONS - Single definitions only
// ============================================

export const generateOrganizationId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `org_${timestamp}_${random}`;
};

export const createOrganizationConfig = (formData: any, sectorId?: string): Organization => {
  const now = new Date();
  const orgId = generateOrganizationId();
  
  return {
    id: orgId,
    name: formData.name,
    industry: formData.industry,
    sectorId: sectorId,
    branding: {
      logo: formData.logo || null,
      primaryColor: formData.primaryColor || '#3b82f6',
      secondaryColor: formData.secondaryColor || '#1e40af',
      companyName: formData.name,
      domain: formData.domain || ''
    },
    settings: {
      timezone: formData.timezone || 'Africa/Johannesburg',
      currency: formData.currency || 'ZAR',
      language: formData.language || 'en',
      defaultDeliveryMethod: formData.defaultDeliveryMethod || 'email',
      allowEmployeeChoice: formData.allowEmployeeChoice ?? true,
      requireSignatures: formData.requireSignatures ?? true
    },
    customization: {
      enablePhotoCapture: formData.enablePhotoCapture ?? true,
      enableWhatsAppDelivery: formData.enableWhatsAppDelivery ?? true,
      enablePrintDelivery: formData.enablePrintDelivery ?? true,
      enableAudioRecording: formData.enableAudioRecording ?? true
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
};

export const validateOrganizationConfig = (config: Partial<Organization>): string[] => {
  const errors: string[] = [];
  
  if (!config.name?.trim()) {
    errors.push('Organization name is required');
  }
  
  if (!config.industry) {
    errors.push('Industry selection is required');
  }
  
  if (!config.branding?.companyName?.trim()) {
    errors.push('Company name is required');
  }
  
  if (!config.settings?.timezone) {
    errors.push('Timezone is required');
  }
  
  if (!config.settings?.defaultDeliveryMethod) {
    errors.push('Default delivery method is required');
  }
  
  return errors;
};
