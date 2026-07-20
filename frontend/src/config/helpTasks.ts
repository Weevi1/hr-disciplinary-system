// config/helpTasks.ts - "How do I…" content for the Help & Support modal.
// Each task names the real screens/buttons. Tasks are filtered per viewer:
// by role, by org feature toggle (featureKey), and by HOD permission.

import type { HODPermissions } from '../types/core';
import type { HelpRoleId } from './roleContent';
import type { OrgFeatureKey } from '../constants/orgFeatures';

export const SUPPORT_EMAIL = 'riaan@fifo.systems';

export interface HelpTask {
  id: string;
  question: string;
  steps: string[];
  roles: HelpRoleId[];
  featureKey?: OrgFeatureKey;
  hodPermission?: keyof HODPermissions;
}

const MANAGER_ROLES: HelpRoleId[] = ['hod-manager', 'department-manager'];
const HR_ROLES: HelpRoleId[] = ['hr-manager', 'executive-management'];

export const HELP_TASKS: HelpTask[] = [
  {
    id: 'issue-warning',
    question: 'How do I issue a warning?',
    steps: [
      'On your dashboard, press the "Issue Warning" button.',
      'The wizard walks you through 5 steps: pick the employee and category, describe the incident, record the conversation, sign, and deliver.',
      'First time? The wizard\'s opening screen offers a practice run — nothing is saved or sent.'
    ],
    roles: [...MANAGER_ROLES, ...HR_ROLES],
    hodPermission: 'canIssueWarnings'
  },
  {
    id: 'deliver-warning',
    question: 'How is a warning delivered to the employee?',
    steps: [
      'The final wizard step offers four methods: Email, WhatsApp, Printed copy, or QR code.',
      'Each method records its own proof of delivery — the delivery explainer on that step describes what counts as proof.',
      'Undelivered warnings appear under Urgent Tasks on the HR dashboard until delivery is completed.'
    ],
    roles: [...MANAGER_ROLES, ...HR_ROLES],
    hodPermission: 'canIssueWarnings'
  },
  {
    id: 'employee-response',
    question: 'How does the employee respond or appeal?',
    steps: [
      'Every delivered warning includes a secure link where the employee can view the PDF, submit their written response, or lodge a formal appeal.',
      'Appeals notify HR by email and appear in the warnings review screen for a decision.'
    ],
    roles: [...MANAGER_ROLES, ...HR_ROLES]
  },
  {
    id: 'review-appeal',
    question: 'How do I review an appeal?',
    steps: [
      'Open the warnings review screen from your dashboard and select the warning marked as appealed.',
      'The review shows the employee\'s grounds, statement, and any evidence — with guidance on what each ground means legally.',
      'You can uphold the warning, reduce its level, or overturn it. HR must respond within 5 working days of the appeal.'
    ],
    roles: HR_ROLES
  },
  {
    id: 'add-employees',
    question: 'How do I add employees?',
    steps: [
      'Open the Employees tab on your dashboard.',
      'Add employees one at a time with "Add Employee", or import your whole staff list at once from a CSV file.',
      'Each employee can then be assigned a department and manager.'
    ],
    roles: HR_ROLES
  },
  {
    id: 'departments',
    question: 'How do I set up departments and managers?',
    steps: [
      'Open the Departments tab to create departments (e.g. Sales, Operations, Admin).',
      'Use the Managers tab to promote employees to manager and assign team members to them.',
      'Managers only see and act on their own team.'
    ],
    roles: HR_ROLES
  },
  {
    id: 'categories',
    question: 'What are warning categories and where do I change them?',
    steps: [
      'Categories (e.g. Late Attendance, Insubordination) define the escalation path each warning follows — counselling, verbal, written, final.',
      'Your organization starts with SA-compliant defaults. Contact your provider to customize them, including the pre-filled "expected standards" text per category.'
    ],
    roles: HR_ROLES
  },
  {
    id: 'report-absence',
    question: 'How do I report an absence?',
    steps: [
      'On your dashboard, press "Report Absence".',
      'Pick the employee, the absence type, and the date — HR reviews all reports from their side.'
    ],
    roles: MANAGER_ROLES,
    featureKey: 'reportAbsence',
    hodPermission: 'canReportAbsences'
  },
  {
    id: 'book-hr-meeting',
    question: 'How do I book an HR meeting?',
    steps: [
      'On your dashboard, press "Book HR Meeting".',
      'Describe what you need to discuss — HR sees the request and schedules from their side.'
    ],
    roles: MANAGER_ROLES,
    featureKey: 'hrMeetings',
    hodPermission: 'canBookHRMeetings'
  },
  {
    id: 'recognition',
    question: 'How do I record employee recognition?',
    steps: [
      'On your dashboard, press "Recognition" to record positive feedback for a team member.',
      'Recognition entries balance the disciplinary record and are visible to HR.'
    ],
    roles: MANAGER_ROLES,
    featureKey: 'recognition',
    hodPermission: 'canRecordCounselling'
  },
  {
    id: 'historical-warnings',
    question: 'How do I capture old paper warnings?',
    steps: [
      'On the HR dashboard\'s Warnings tab, press "Capture Historical Warnings".',
      'Enter warnings issued before you started using the system so escalation recommendations account for them.',
      'This entry is available for a limited period after your organization is created.'
    ],
    roles: HR_ROLES,
    featureKey: 'historicalWarnings'
  },
  {
    id: 'review-followups',
    question: 'What are review follow-ups?',
    steps: [
      'When a warning includes a review date, a follow-up appears on the HR dashboard automatically.',
      'Use it to check whether the employee met the agreed improvement commitments and record the outcome.'
    ],
    roles: HR_ROLES,
    featureKey: 'reviewFollowups'
  },
  {
    id: 'reset-password',
    question: 'How do I change my password?',
    steps: [
      'Open your profile menu (top right) and choose "Reset Password".',
      'If you are still using a temporary password, change it now.'
    ],
    roles: ['super-user', 'reseller', ...HR_ROLES, ...MANAGER_ROLES]
  },
  {
    id: 'deploy-client',
    question: 'How do I deploy a new client organization?',
    steps: [
      'From your reseller dashboard, press "Deploy Client".',
      'The wizard collects the subscription, company details, and admin account — a one-time admin password is shown at the end.',
      'Manage the client afterwards from My Clients (branding, categories, features).'
    ],
    roles: ['reseller', 'super-user']
  }
];
