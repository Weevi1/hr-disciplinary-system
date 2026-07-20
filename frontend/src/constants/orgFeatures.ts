// frontend/src/constants/orgFeatures.ts
// Per-organization feature toggles — single source of truth for keys, labels, and UI metadata.
// Managed by super-users (SuperAdminDashboard) and resellers (ClientOrganizationManager);
// consumed by tenant dashboards and route guards.

import { UserX, MessageSquare, Award, FileText, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Organization, OrgFeatureKey } from '../types/core';

export type { OrgFeatureKey };

export interface OrgFeatureConfig {
  key: OrgFeatureKey;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const ORG_FEATURES: OrgFeatureConfig[] = [
  {
    key: 'reportAbsence',
    label: 'Absence Reporting',
    description: 'Manager "Report Absence" action and HR absence-report review',
    icon: UserX,
    color: 'red'
  },
  {
    key: 'hrMeetings',
    label: 'HR Meetings',
    description: 'Manager HR-meeting booking and HR meeting-request review',
    icon: MessageSquare,
    color: 'green'
  },
  {
    key: 'recognition',
    label: 'Employee Recognition',
    description: 'Manager "Recognition" quick action for positive feedback entries',
    icon: Award,
    color: 'blue'
  },
  {
    key: 'historicalWarnings',
    label: 'Historical Warning Capture',
    description: 'HR "Capture Historical Warnings" entry for pre-system paper warnings',
    icon: FileText,
    color: 'orange'
  },
  {
    key: 'reviewFollowups',
    label: 'Review Follow-ups',
    description: 'HR review follow-up tab and metric card',
    icon: Clock,
    color: 'blue'
  }
];

export const DEFAULT_ORG_FEATURES: Record<OrgFeatureKey, boolean> = {
  reportAbsence: true,
  hrMeetings: true,
  recognition: true,
  historicalWarnings: true,
  reviewFollowups: true
};

// Absent org, absent field, or absent key ⇒ enabled — existing orgs need no migration.
// Only an explicit false disables a feature.
export function isOrgFeatureEnabled(
  org: Pick<Organization, 'features'> | null | undefined,
  key: OrgFeatureKey
): boolean {
  return org?.features?.[key] !== false;
}
