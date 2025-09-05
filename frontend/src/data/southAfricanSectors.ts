// ===================================
// SOUTH AFRICAN INDUSTRY SECTORS
// Complete sector definitions with disciplinary categories
// ===================================

import { Sector } from '../types';

export const SOUTH_AFRICAN_SECTORS: Sector[] = [
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production facilities, assembly lines, quality control',
    icon: '🏭',
    color: '#3b82f6',
    complianceNotes: 'Must comply with Occupational Health and Safety Act (OHSA)',
    categories: [
      {
        id: 'safety-violation',
        name: 'Safety Protocol Violation',
        description: 'Failure to follow safety procedures or wear PPE',
        severity: 'high',
        sectorId: 'manufacturing',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'verbal',
            label: 'Verbal Warning',
            timeframeDays: 30,
            requiresHRApproval: false,
            documentationRequired: ['safety_checklist', 'witness_statement']
          },
          {
            level: 2,
            action: 'first_written',
            label: 'First Written Warning',
            timeframeDays: 60,
            requiresHRApproval: true,
            documentationRequired: ['incident_report', 'safety_training_record']
          },
          {
            level: 3,
            action: 'final_written',
            label: 'Final Written Warning',
            timeframeDays: 90,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing_notes', 'safety_assessment']
          },
          {
            level: 4,
            action: 'dismissal',
            label: 'Dismissal',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing', 'safety_officer_report']
          }
        ],
        requiredDocuments: ['incident_report', 'safety_checklist', 'witness_statements'],
        exampleIncidents: [
          'Not wearing safety goggles in production area',
          'Operating machinery without safety guards',
          'Ignoring lockout/tagout procedures'
        ]
      },
      {
        id: 'quality-breach',
        name: 'Quality Control Breach',
        description: 'Failure to maintain quality standards',
        severity: 'medium',
        sectorId: 'manufacturing',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'verbal',
            label: 'Verbal Counseling',
            timeframeDays: 30,
            requiresHRApproval: false,
            documentationRequired: ['quality_report', 'training_record']
          },
          {
            level: 2,
            action: 'first_written',
            label: 'Written Warning',
            timeframeDays: 60,
            requiresHRApproval: true,
            documentationRequired: ['quality_audit', 'corrective_action_plan']
          },
          {
            level: 3,
            action: 'final_written',
            label: 'Final Warning',
            timeframeDays: 90,
            requiresHRApproval: true,
            documentationRequired: ['performance_improvement_plan']
          }
        ],
        requiredDocuments: ['quality_report', 'defect_analysis', 'batch_records']
      }
    ],
    escalationRules: [
      {
        id: 'manufacturing-safety-critical',
        sectorId: 'manufacturing',
        categoryId: 'safety-violation',
        condition: 'severity_based',
        fromLevel: 'any',
        toLevel: 'final_written',
        autoEscalate: true
      }
    ]
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Customer service, sales floor, inventory management',
    icon: '🛒',
    color: '#10b981',
    complianceNotes: 'Must comply with Consumer Protection Act and Labour Relations Act',
    categories: [
      {
        id: 'customer-service',
        name: 'Customer Service Violation',
        description: 'Poor customer interaction or service standards',
        severity: 'medium',
        sectorId: 'retail',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'verbal',
            label: 'Coaching Session',
            timeframeDays: 30,
            requiresHRApproval: false,
            documentationRequired: ['customer_complaint', 'coaching_notes']
          },
          {
            level: 2,
            action: 'first_written',
            label: 'Written Warning',
            timeframeDays: 60,
            requiresHRApproval: true,
            documentationRequired: ['service_training_plan', 'manager_observation']
          },
          {
            level: 3,
            action: 'final_written',
            label: 'Final Warning',
            timeframeDays: 90,
            requiresHRApproval: true,
            documentationRequired: ['performance_review', 'customer_feedback']
          }
        ],
        requiredDocuments: ['customer_complaint', 'incident_report', 'witness_statement'],
        exampleIncidents: [
          'Rude behavior towards customers',
          'Refusing to assist customers',
          'Inappropriate language in customer area'
        ]
      },
      {
        id: 'cash-handling',
        name: 'Cash Handling Irregularity',
        description: 'Discrepancies in cash management or till procedures',
        severity: 'high',
        sectorId: 'retail',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'first_written',
            label: 'Written Warning',
            timeframeDays: 30,
            requiresHRApproval: true,
            documentationRequired: ['cash_audit', 'cctv_review', 'training_record']
          },
          {
            level: 2,
            action: 'final_written',
            label: 'Final Warning',
            timeframeDays: 60,
            requiresHRApproval: true,
            documentationRequired: ['forensic_audit', 'disciplinary_hearing']
          },
          {
            level: 3,
            action: 'dismissal',
            label: 'Dismissal',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing', 'police_report']
          }
        ],
        requiredDocuments: ['till_report', 'cctv_footage', 'cash_count_sheet']
      }
    ],
    escalationRules: [
      {
        id: 'retail-cash-handling',
        sectorId: 'retail',
        categoryId: 'cash-handling',
        condition: 'severity_based',
        fromLevel: 'any',
        toLevel: 'first_written',
        autoEscalate: true
      }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Patient care, medical procedures, clinical protocols',
    icon: '🏥',
    color: '#ef4444',
    complianceNotes: 'Must comply with Health Professions Council (HPCSA) guidelines',
    categories: [
      {
        id: 'patient-safety',
        name: 'Patient Safety Incident',
        description: 'Actions that compromise patient safety or care quality',
        severity: 'critical',
        sectorId: 'healthcare',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'suspension',
            label: 'Immediate Suspension',
            timeframeDays: 0,
            requiresHRApproval: true,
            requiresSuspension: true,
            documentationRequired: ['incident_report', 'clinical_review', 'risk_assessment']
          },
          {
            level: 2,
            action: 'dismissal',
            label: 'Dismissal',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing', 'professional_body_report']
          }
        ],
        requiredDocuments: ['clinical_incident_report', 'patient_statement', 'medical_review'],
        exampleIncidents: [
          'Medication errors',
          'Negligent patient care',
          'Breach of sterile protocols'
        ]
      },
      {
        id: 'confidentiality-breach',
        name: 'Patient Confidentiality Breach',
        description: 'Unauthorized disclosure of patient information',
        severity: 'high',
        sectorId: 'healthcare',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'first_written',
            label: 'Written Warning',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['breach_report', 'privacy_training']
          },
          {
            level: 2,
            action: 'final_written',
            label: 'Final Warning',
            timeframeDays: 30,
            requiresHRApproval: true,
            documentationRequired: ['compliance_review']
          },
          {
            level: 3,
            action: 'dismissal',
            label: 'Dismissal',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing', 'regulatory_report']
          }
        ],
        requiredDocuments: ['breach_assessment', 'it_audit', 'patient_notification']
      }
    ],
    escalationRules: [
      {
        id: 'healthcare-patient-safety',
        sectorId: 'healthcare',
        categoryId: 'patient-safety',
        condition: 'severity_based',
        fromLevel: 'any',
        toLevel: 'suspension',
        autoEscalate: true
      }
    ]
  },
  {
    id: 'security',
    name: 'Private Security',
    description: 'Access control, incident management, patrol duties',
    icon: '🛡️',
    color: '#f59e0b',
    complianceNotes: 'Must comply with Private Security Industry Regulation Act (PSIRA)',
    categories: [
      {
        id: 'security-breach',
        name: 'Security Protocol Breach',
        description: 'Failure to follow security procedures',
        severity: 'critical',
        sectorId: 'security',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'suspension',
            label: 'Suspension & Investigation',
            timeframeDays: 0,
            requiresHRApproval: true,
            requiresSuspension: true,
            documentationRequired: ['incident_report', 'security_audit', 'psira_notification']
          },
          {
            level: 2,
            action: 'dismissal',
            label: 'Dismissal',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing', 'psira_report']
          }
        ],
        requiredDocuments: ['security_log', 'cctv_evidence', 'client_report'],
        exampleIncidents: [
          'Sleeping on duty',
          'Abandoning post',
          'Unauthorized access granted'
        ]
      },
      {
        id: 'uniform-violation',
        name: 'Uniform & Equipment Violation',
        description: 'Not wearing proper uniform or equipment',
        severity: 'low',
        sectorId: 'security',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'verbal',
            label: 'Verbal Warning',
            timeframeDays: 30,
            requiresHRApproval: false,
            documentationRequired: ['inspection_report']
          },
          {
            level: 2,
            action: 'first_written',
            label: 'Written Warning',
            timeframeDays: 60,
            requiresHRApproval: true,
            documentationRequired: ['photo_evidence']
          },
          {
            level: 3,
            action: 'final_written',
            label: 'Final Warning',
            timeframeDays: 90,
            requiresHRApproval: true,
            documentationRequired: ['compliance_check']
          }
        ],
        requiredDocuments: ['uniform_inspection', 'photo_evidence']
      }
    ],
    escalationRules: [
      {
        id: 'security-post-abandonment',
        sectorId: 'security',
        categoryId: 'security-breach',
        condition: 'severity_based',
        fromLevel: 'any',
        toLevel: 'dismissal',
        autoEscalate: true
      }
    ]
  },
  {
    id: 'mining',
    name: 'Mining',
    description: 'Underground operations, mineral extraction, safety critical',
    icon: '⛏️',
    color: '#78716c',
    complianceNotes: 'Must comply with Mine Health and Safety Act (MHSA)',
    categories: [
      {
        id: 'mine-safety',
        name: 'Mine Safety Violation',
        description: 'Breach of underground safety protocols',
        severity: 'critical',
        sectorId: 'mining',
        commonInSector: true,
        escalationPath: [
          {
            level: 1,
            action: 'suspension',
            label: 'Immediate Suspension',
            timeframeDays: 0,
            requiresHRApproval: true,
            requiresSuspension: true,
            documentationRequired: ['safety_incident_report', 'mine_manager_report']
          },
          {
            level: 2,
            action: 'dismissal',
            label: 'Dismissal',
            timeframeDays: 0,
            requiresHRApproval: true,
            documentationRequired: ['disciplinary_hearing', 'dmr_notification']
          }
        ],
        requiredDocuments: ['safety_report', 'underground_log', 'supervisor_statement'],
        exampleIncidents: [
          'Working without safety equipment underground',
          'Ignoring gas detection warnings',
          'Unauthorized entry to restricted areas'
        ]
      }
    ],
    escalationRules: [
      {
        id: 'mining-safety-critical',
        sectorId: 'mining',
        categoryId: 'mine-safety',
        condition: 'severity_based',
        fromLevel: 'any',
        toLevel: 'suspension',
        autoEscalate: true
      }
    ]
  }
];
