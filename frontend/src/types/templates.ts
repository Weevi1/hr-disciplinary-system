// frontend/src/types/templates.ts
// 🏆 DOCUMENT TEMPLATES & LEGAL FRAMEWORK
// Email, WhatsApp, and print templates with SA legal compliance

import type { DocumentTemplate, LegalRequirement } from './organization';
import type { WarningLevel } from './core';

// ============================================
// DEFAULT DOCUMENT TEMPLATES
// ============================================

export const createDefaultTemplates = (organizationId: string): DocumentTemplate[] => [
  {
    id: `${organizationId}_email_warning`,
    organizationId,
    type: 'email_template',
    name: 'Standard Warning Email',
    description: 'Default email template for warning delivery',
    content: `Dear {{employee_name}},

This email serves as formal notification of a {{warning_level}} warning issued on {{incident_date}} regarding {{category_name}}.

Incident Details:
- Date: {{incident_date}}
- Time: {{incident_time}}
- Location: {{incident_location}}
- Description: {{incident_description}}

{{#if witnesses}}
Witnesses Present:
{{#each witnesses}}
- {{name}}
{{/each}}
{{/if}}

This warning will remain active for {{warning_duration}} and will be considered in any future disciplinary actions.

You have the right to respond to this warning within 48 hours and to be represented during any disciplinary proceedings.

Regards,
{{manager_name}}
{{organization_name}}`,
    variables: [
      'employee_name',
      'warning_level',
      'incident_date',
      'incident_time',
      'incident_location',
      'incident_description',
      'witnesses',
      'warning_duration',
      'manager_name',
      'organization_name'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `${organizationId}_whatsapp_warning`,
    organizationId,
    type: 'whatsapp_template',
    name: 'WhatsApp Warning Notification',
    description: 'Concise WhatsApp template for warning notifications',
    content: `🚨 FORMAL WARNING NOTICE

Dear {{employee_name}},

You have received a {{warning_level}} warning dated {{incident_date}} for {{category_name}}.

📄 Full details have been sent via email.
⏰ You have 48 hours to respond.
📞 Contact HR for questions: {{hr_contact}}

{{organization_name}}`,
    variables: [
      'employee_name',
      'warning_level',
      'incident_date',
      'category_name',
      'hr_contact',
      'organization_name'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `${organizationId}_print_warning`,
    organizationId,
    type: 'warning_letter',
    name: 'Formal Warning Letter',
    description: 'Official printed warning letter template',
    content: `{{organization_name}}
{{organization_address}}

Date: {{issue_date}}

FORMAL WARNING NOTICE

Employee: {{employee_name}}
Employee Number: {{employee_number}}
Department: {{department}}
Position: {{position}}

Dear {{employee_name}},

This letter serves as formal notification of a {{warning_level}} warning for {{category_name}}.

INCIDENT DETAILS:
Date: {{incident_date}}
Time: {{incident_time}}
Location: {{incident_location}}

DESCRIPTION OF INCIDENT:
{{incident_description}}

{{#if witnesses}}
WITNESSES:
{{#each witnesses}}
- {{name}} ({{type}})
{{/each}}
{{/if}}

DISCIPLINARY ACTION:
This {{warning_level}} warning will remain active on your disciplinary record for {{warning_duration}}.

EMPLOYEE RIGHTS:
- You have the right to respond to this warning in writing within 48 hours
- You have the right to representation during disciplinary proceedings
- You have the right to appeal this decision through our grievance procedure

CONSEQUENCES:
Further misconduct may result in more severe disciplinary action, up to and including dismissal.

Manager Signature: _________________________ Date: _________
{{manager_name}}
{{manager_title}}

Employee Acknowledgment: _________________________ Date: _________
{{employee_name}}

Note: Signing acknowledges receipt only, not agreement with the content.`,
    variables: [
      'organization_name',
      'organization_address',
      'issue_date',
      'employee_name',
      'employee_number',
      'department',
      'position',
      'warning_level',
      'category_name',
      'incident_date',
      'incident_time',
      'incident_location',
      'incident_description',
      'witnesses',
      'warning_duration',
      'manager_name',
      'manager_title'
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ============================================
// SOUTH AFRICAN LEGAL REQUIREMENTS
// ============================================

export const getSALegalRequirements = (): LegalRequirement[] => [
  {
    id: 'verbal_warning_sa',
    level: 'verbal',
    category: 'all',
    requirements: [
      'Must be documented in writing',
      'Employee must be informed of the nature of misconduct',
      'Employee must be given opportunity to respond',
      'Warning must specify improvement required'
    ],
    mandatoryFields: [
      'employee_name',
      'incident_description',
      'manager_signature',
      'date_issued'
    ],
    documentation: [
      'Verbal warning record',
      'Employee response (if any)',
      'Witness statements (if applicable)'
    ],
    timeframes: {
      notice: 0, // Immediate for verbal warnings
      response: 48, // 48 hours to respond
      appeal: 168 // 7 days to appeal
    },
    ccmaGuidelines: [
      'Ensure progressive discipline is followed',
      'Document all verbal warnings for future reference',
      'Provide clear expectations for improvement'
    ]
  },
  {
    id: 'first_written_sa',
    level: 'first_written',
    category: 'all',
    requirements: [
      'Must be in writing',
      'Must specify the misconduct',
      'Must indicate consequences of repetition',
      'Must provide opportunity for employee response',
      'Must be signed by authorized manager'
    ],
    mandatoryFields: [
      'employee_name',
      'employee_number',
      'incident_description',
      'warning_level',
      'manager_signature',
      'date_issued',
      'expiry_date'
    ],
    documentation: [
      'Written warning letter',
      'Employee acknowledgment',
      'Supporting evidence',
      'Previous warnings (if any)'
    ],
    timeframes: {
      notice: 48, // 48 hours notice before disciplinary meeting
      response: 72, // 72 hours to respond in writing
      appeal: 168 // 7 days to lodge appeal
    },
    ccmaGuidelines: [
      'Follow progressive discipline',
      'Ensure proportionality',
      'Consider employee circumstances',
      'Maintain proper records'
    ]
  },
  {
    id: 'final_written_sa',
    level: 'final_written',
    category: 'all',
    requirements: [
      'Must follow progressive discipline',
      'Must be formally documented',
      'Must indicate that dismissal may follow',
      'Must provide right to representation',
      'Must follow proper procedures'
    ],
    mandatoryFields: [
      'employee_name',
      'employee_number',
      'incident_description',
      'previous_warnings',
      'warning_level',
      'manager_signature',
      'hr_signature',
      'date_issued',
      'expiry_date'
    ],
    documentation: [
      'Final written warning letter',
      'Disciplinary hearing minutes',
      'Employee representation details',
      'All previous warnings',
      'Supporting evidence'
    ],
    timeframes: {
      notice: 168, // 7 days notice for disciplinary hearing
      response: 168, // 7 days to respond
      appeal: 168 // 7 days to appeal
    },
    ccmaGuidelines: [
      'Conduct formal disciplinary hearing',
      'Allow employee representation',
      'Consider all mitigating factors',
      'Ensure procedural fairness'
    ]
  },
  {
    id: 'suspension_sa',
    level: 'suspension',
    category: 'serious_misconduct',
    requirements: [
      'Must be for serious misconduct',
      'Must be precautionary or disciplinary',
      'Must be with or without pay (specify)',
      'Must indicate duration',
      'Must follow proper authorization'
    ],
    mandatoryFields: [
      'employee_name',
      'employee_number',
      'suspension_reason',
      'suspension_type',
      'suspension_duration',
      'pay_status',
      'authorized_by',
      'date_effective'
    ],
    documentation: [
      'Suspension letter',
      'Investigation report',
      'Incident report',
      'Manager authorization',
      'HR approval'
    ],
    timeframes: {
      notice: 24, // 24 hours notice for suspension
      response: 72, // 72 hours to respond
      appeal: 168 // 7 days to appeal
    },
    ccmaGuidelines: [
      'Suspension must be justified',
      'Consider operational requirements',
      'Ensure proper investigation',
      'Review suspension regularly'
    ]
  },
  {
    id: 'dismissal_sa',
    level: 'dismissal',
    category: 'gross_misconduct',
    requirements: [
      'Must follow full disciplinary process',
      'Must be for gross misconduct or repeated misconduct',
      'Must conduct formal disciplinary hearing',
      'Must provide right to representation',
      'Must consider all alternatives'
    ],
    mandatoryFields: [
      'employee_name',
      'employee_number',
      'dismissal_reason',
      'disciplinary_hearing_date',
      'employee_representation',
      'dismissal_type',
      'notice_period',
      'final_pay_details',
      'authorized_by'
    ],
    documentation: [
      'Dismissal letter',
      'Disciplinary hearing transcript',
      'All evidence presented',
      'Employee response',
      'Mitigating factors considered',
      'Appeal rights notice'
    ],
    timeframes: {
      notice: 168, // 7 days notice for hearing
      response: 168, // 7 days to respond
      appeal: 168 // 7 days to appeal
    },
    ccmaGuidelines: [
      'Ensure substantive and procedural fairness',
      'Consider all alternatives to dismissal',
      'Provide detailed reasons',
      'Allow proper representation',
      'Consider employee circumstances'
    ]
  }
];

// ============================================
// TEMPLATE RENDERING UTILITIES
// ============================================

export const renderTemplate = (
  template: DocumentTemplate,
  variables: Record<string, any>
): string => {
  let rendered = template.content;
  
  // Simple template rendering (replace with proper template engine in production)
  template.variables.forEach(variable => {
    const value = variables[variable] || `[${variable}]`;
    const regex = new RegExp(`{{${variable}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });
  
  // Handle conditional blocks (simplified)
  // {{#if condition}}...{{/if}}
  const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  rendered = rendered.replace(ifRegex, (match, condition, content) => {
    return variables[condition] ? content : '';
  });
  
  // Handle each loops (simplified)
  // {{#each array}}...{{/each}}
  const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
  rendered = rendered.replace(eachRegex, (match, arrayName, itemTemplate) => {
    const array = variables[arrayName];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemContent = itemTemplate;
      // Replace {{name}}, {{type}}, etc. with item properties
      Object.keys(item).forEach(key => {
        const itemRegex = new RegExp(`{{${key}}}`, 'g');
        itemContent = itemContent.replace(itemRegex, item[key]);
      });
      return itemContent;
    }).join('');
  });
  
  return rendered;
};

export const validateTemplateVariables = (
  template: DocumentTemplate,
  variables: Record<string, any>
): { isValid: boolean; missingVariables: string[] } => {
  const missingVariables = template.variables.filter(
    variable => !variables.hasOwnProperty(variable)
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
};

export const getLegalRequirement = (level: WarningLevel): LegalRequirement | null => {
  const requirements = getSALegalRequirements();
  return requirements.find(req => req.level === level) || null;
};
