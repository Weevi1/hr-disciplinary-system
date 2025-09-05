// frontend/src/types/sectors.ts
// 🏆 COMPLETE SECTOR TEMPLATES - Industry-Specific Disciplinary Categories
// Manufacturing, Retail, Healthcare, Security, and Mining sectors

import type { Sector, DisciplinaryCategory, SectorEscalationRule } from './organization';
import type { SeverityLevel, WarningLevel, EscalationCondition } from './core';

// ============================================
// MANUFACTURING SECTOR
// ============================================

export const getManufacturingSectorTemplate = (): Sector => ({
  id: 'manufacturing',
  name: 'Manufacturing',
  description: 'Heavy industry, production, and manufacturing environments',
  icon: '🏭',
  color: '#059669',
  categories: [
    {
      id: 'safety_violation',
      name: 'Safety Violation',
      description: 'Failure to follow safety protocols',
      severity: 'high' as SeverityLevel,
      sectorId: 'manufacturing',
      escalationPath: [
        {
          level: 1,
          action: 'verbal' as WarningLevel,
          label: 'Safety Coaching',
          timeframeDays: 30,
          requiresHRApproval: false,
          documentationRequired: ['incident_report', 'safety_checklist']
        },
        {
          level: 2,
          action: 'first_written' as WarningLevel,
          label: 'Written Warning + Retraining',
          timeframeDays: 90,
          requiresHRApproval: true,
          documentationRequired: ['training_certificate', 'safety_assessment']
        }
      ],
      requiredDocuments: ['safety_report', 'witness_statement'],
      commonInSector: true,
      exampleIncidents: [
        'Not wearing required PPE',
        'Operating machinery without authorization',
        'Ignoring lockout/tagout procedures'
      ]
    },
    {
      id: 'equipment_misuse',
      name: 'Equipment Misuse',
      description: 'Improper use or damage to company equipment',
      severity: 'medium' as SeverityLevel,
      sectorId: 'manufacturing',
      escalationPath: [
        {
          level: 1,
          action: 'verbal' as WarningLevel,
          label: 'Equipment Training Review',
          timeframeDays: 30,
          requiresHRApproval: false,
          documentationRequired: ['equipment_assessment', 'training_record']
        }
      ],
      requiredDocuments: ['damage_report', 'maintenance_log'],
      commonInSector: true,
      exampleIncidents: [
        'Using equipment for unauthorized purposes',
        'Failure to perform routine maintenance',
        'Damaging equipment through negligence'
      ]
    }
  ],
  escalationRules: [],
  complianceNotes: 'Must comply with OHSA regulations and company safety standards'
});

// ============================================
// RETAIL SECTOR
// ============================================

export const getRetailSectorTemplate = (): Sector => ({
  id: 'retail',
  name: 'Retail',
  description: 'Customer service, sales, and retail environments',
  icon: '🛍️',
  color: '#dc2626',
  categories: [
    {
      id: 'customer_service',
      name: 'Poor Customer Service',
      description: 'Failure to meet customer service standards',
      severity: 'medium' as SeverityLevel,
      sectorId: 'retail',
      escalationPath: [
        {
          level: 1,
          action: 'verbal' as WarningLevel,
          label: 'Customer Service Coaching',
          timeframeDays: 30,
          requiresHRApproval: false,
          documentationRequired: ['customer_feedback', 'coaching_notes']
        }
      ],
      requiredDocuments: ['customer_complaint', 'manager_observation'],
      commonInSector: true,
      exampleIncidents: [
        'Rude behavior to customers',
        'Failure to assist customers promptly',
        'Not following return policy'
      ]
    },
    {
      id: 'cash_handling',
      name: 'Cash Handling Issues',
      description: 'Errors or misconduct in cash handling procedures',
      severity: 'high' as SeverityLevel,
      sectorId: 'retail',
      escalationPath: [
        {
          level: 1,
          action: 'first_written' as WarningLevel,
          label: 'Cash Handling Review',
          timeframeDays: 60,
          requiresHRApproval: true,
          documentationRequired: ['cash_audit', 'training_certificate']
        },
        {
          level: 2,
          action: 'final_written' as WarningLevel,
          label: 'Final Warning + Supervision',
          timeframeDays: 180,
          requiresHRApproval: true,
          documentationRequired: ['detailed_audit', 'supervision_plan']
        }
      ],
      requiredDocuments: ['till_report', 'cctv_review'],
      commonInSector: true,
      exampleIncidents: [
        'Till shortages',
        'Failure to follow cash procedures',
        'Unauthorized discounts'
      ]
    }
  ],
  escalationRules: [],
  complianceNotes: 'Must maintain professional customer service standards and accurate cash handling'
});

// ============================================
// HEALTHCARE SECTOR
// ============================================

export const getHealthcareSectorTemplate = (): Sector => ({
  id: 'healthcare',
  name: 'Healthcare',
  description: 'Medical facilities, patient care, and healthcare services',
  icon: '🏥',
  color: '#7c3aed',
  categories: [
    {
      id: 'patient_safety',
      name: 'Patient Safety Breach',
      description: 'Actions that compromise patient safety or care standards',
      severity: 'critical' as SeverityLevel,
      sectorId: 'healthcare',
      escalationPath: [
        {
          level: 1,
          action: 'suspension' as WarningLevel,
          label: 'Immediate Suspension + Investigation',
          timeframeDays: 0,
          requiresHRApproval: true,
          requiresSuspension: true,
          documentationRequired: ['incident_report', 'medical_review', 'patient_impact_assessment']
        }
      ],
      requiredDocuments: ['patient_record', 'medical_assessment', 'witness_statement'],
      commonInSector: true,
      exampleIncidents: [
        'Medication administration error',
        'Failure to follow infection control protocols',
        'Patient confidentiality breach'
      ]
    },
    {
      id: 'documentation',
      name: 'Documentation Errors',
      description: 'Failure to maintain accurate patient records',
      severity: 'high' as SeverityLevel,
      sectorId: 'healthcare',
      escalationPath: [
        {
          level: 1,
          action: 'verbal' as WarningLevel,
          label: 'Documentation Training',
          timeframeDays: 30,
          requiresHRApproval: false,
          documentationRequired: ['training_completion', 'audit_review']
        },
        {
          level: 2,
          action: 'first_written' as WarningLevel,
          label: 'Written Warning + Monitoring',
          timeframeDays: 90,
          requiresHRApproval: true,
          documentationRequired: ['documentation_audit', 'improvement_plan']
        }
      ],
      requiredDocuments: ['patient_records', 'audit_findings'],
      commonInSector: true,
      exampleIncidents: [
        'Incomplete patient records',
        'Late documentation entries',
        'Inaccurate vital signs recording'
      ]
    }
  ],
  escalationRules: [],
  complianceNotes: 'Must comply with HPCSA guidelines and patient safety protocols'
});

// ============================================
// SECURITY SECTOR
// ============================================

export const getSecuritySectorTemplate = (): Sector => ({
  id: 'security',
  name: 'Security Services',
  description: 'Security guards, private security, and protection services',
  icon: '🛡️',
  color: '#f59e0b',
  categories: [
    {
      id: 'duty_abandonment',
      name: 'Abandoning Post',
      description: 'Leaving assigned security post without authorization',
      severity: 'high' as SeverityLevel,
      sectorId: 'security',
      escalationPath: [
        {
          level: 1,
          action: 'final_written' as WarningLevel,
          label: 'Final Written Warning',
          timeframeDays: 180,
          requiresHRApproval: true,
          documentationRequired: ['post_log', 'supervisor_report', 'cctv_review']
        },
        {
          level: 2,
          action: 'dismissal' as WarningLevel,
          label: 'Dismissal',
          timeframeDays: 0,
          requiresHRApproval: true,
          documentationRequired: ['disciplinary_hearing_minutes', 'legal_clearance']
        }
      ],
      requiredDocuments: ['incident_report', 'duty_roster', 'supervisor_statement'],
      commonInSector: true,
      exampleIncidents: [
        'Sleeping on duty',
        'Leaving post unattended',
        'Failure to respond to emergency'
      ]
    },
    {
      id: 'uniform_appearance',
      name: 'Uniform & Appearance',
      description: 'Failure to maintain professional appearance standards',
      severity: 'low' as SeverityLevel,
      sectorId: 'security',
      escalationPath: [
        {
          level: 1,
          action: 'verbal' as WarningLevel,
          label: 'Appearance Standards Review',
          timeframeDays: 7,
          requiresHRApproval: false,
          documentationRequired: ['appearance_checklist']
        }
      ],
      requiredDocuments: ['uniform_inspection', 'photo_evidence'],
      commonInSector: true,
      exampleIncidents: [
        'Unkempt uniform',
        'Missing required equipment',
        'Inappropriate grooming'
      ]
    }
  ],
  escalationRules: [],
  complianceNotes: 'Must comply with PSIRA regulations and client security requirements'
});

// ============================================
// MINING SECTOR
// ============================================

export const getMiningSectorTemplate = (): Sector => ({
  id: 'mining',
  name: 'Mining',
  description: 'Mining operations, underground work, and mineral extraction',
  icon: '⛏️',
  color: '#92400e',
  categories: [
    {
      id: 'safety_critical',
      name: 'Critical Safety Violation',
      description: 'Life-threatening safety violations in mining operations',
      severity: 'critical' as SeverityLevel,
      sectorId: 'mining',
      escalationPath: [
        {
          level: 1,
          action: 'suspension' as WarningLevel,
          label: 'Immediate Suspension + Safety Review',
          timeframeDays: 0,
          requiresHRApproval: true,
          requiresSuspension: true,
          documentationRequired: ['safety_incident_report', 'mine_safety_assessment', 'dmr_notification']
        }
      ],
      requiredDocuments: ['safety_violation_report', 'witness_statements', 'safety_officer_assessment'],
      commonInSector: true,
      exampleIncidents: [
        'Entering unsupported areas',
        'Bypassing gas detection systems',
        'Working without required safety equipment'
      ]
    }
  ],
  escalationRules: [],
  complianceNotes: 'Must comply with Mine Health and Safety Act and DMR regulations'
});

// ============================================
// SECTOR TEMPLATE REGISTRY
// ============================================

export const getSectorTemplates = (): Sector[] => [
  getManufacturingSectorTemplate(),
  getRetailSectorTemplate(),
  getHealthcareSectorTemplate(),
  getSecuritySectorTemplate(),
  getMiningSectorTemplate()
];

export const getSectorTemplate = (sectorId: string): Sector | null => {
  const templates = getSectorTemplates();
  return templates.find(template => template.id === sectorId) || null;
};

// ============================================
// COMPLIANCE & VALIDATION HELPERS
// ============================================

export const validateSectorCompliance = (
  categoryId: string,
  sectorId: string,
  proposedLevel: WarningLevel
): { isValid: boolean; reasons: string[]; suggestedLevel?: WarningLevel } => {
  const sector = getSectorTemplate(sectorId);
  
  if (!sector) {
    return {
      isValid: false,
      reasons: ['Invalid sector specified'],
      suggestedLevel: undefined
    };
  }
  
  const category = sector.categories.find(cat => cat.id === categoryId);
  
  if (!category) {
    return {
      isValid: true,
      reasons: ['Category not sector-specific, standard escalation applies']
    };
  }
  
  const allowedLevels = category.escalationPath.map(path => path.action);
  
  if (!allowedLevels.includes(proposedLevel)) {
    return {
      isValid: false,
      reasons: [
        `Level "${proposedLevel}" not allowed for this category in ${sector.name} sector`,
        `Allowed levels: ${allowedLevels.join(', ')}`
      ],
      suggestedLevel: allowedLevels[0]
    };
  }
  
  return {
    isValid: true,
    reasons: ['Complies with sector-specific guidelines']
  };
};
