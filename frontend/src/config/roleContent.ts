// config/roleContent.ts - Role-specific onboarding/help content.
// Extracted from FirstTimeWelcomeModal so the Help & Support modal can reuse it.
// Icons are LucideIcon references (not JSX) so each consumer controls sizing.

import {
  Shield,
  Briefcase,
  Users,
  Globe,
  CheckCircle,
  Building2,
  FileText,
  TrendingUp,
  UserPlus,
  ClipboardList,
  AlertCircle,
  BarChart3,
  Settings,
  MessageSquare,
  UserX,
  Sparkles
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRoleId, HODPermissions } from '../types/core';

// Legacy role id still present on some user docs
export type HelpRoleId = UserRoleId | 'department-manager';

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface RoleContent {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: FeatureItem[];
  primaryColor: string;
  bgColor: string;
}

const buildManagerContent = (hodPermissions?: HODPermissions): RoleContent => {
  // Default each permission individually (handles partial/empty hodPermissions objects)
  const permissions = {
    canIssueWarnings: hodPermissions?.canIssueWarnings ?? true,
    canBookHRMeetings: hodPermissions?.canBookHRMeetings ?? true,
    canReportAbsences: hodPermissions?.canReportAbsences ?? true,
    canRecordCounselling: hodPermissions?.canRecordCounselling ?? true
  };

  const features: FeatureItem[] = [
    {
      icon: Users,
      title: 'Team Overview',
      description: 'View all team members and their disciplinary records'
    }
  ];

  if (permissions.canIssueWarnings) {
    features.push({
      icon: FileText,
      title: 'Issue Warnings',
      description: 'Create and issue warnings to team members'
    });
  }

  if (permissions.canBookHRMeetings) {
    features.push({
      icon: MessageSquare,
      title: 'HR Meetings',
      description: 'Request HR meetings and document team issues'
    });
  }

  if (permissions.canReportAbsences) {
    features.push({
      icon: UserX,
      title: 'Absence Reporting',
      description: 'Report employee absences to HR'
    });
  }

  if (permissions.canRecordCounselling) {
    features.push({
      icon: Sparkles,
      title: 'Recognition',
      description: 'Recognize and reward team member achievements'
    });
  }

  return {
    icon: Users,
    title: 'Department Manager',
    subtitle: 'Team Management',
    description: 'Manage your team members and handle day-to-day disciplinary matters. Keep your department running smoothly with streamlined reporting tools.',
    features,
    primaryColor: '#14b8a6',
    bgColor: '#f0fdfa'
  };
};

export const getRoleContent = (role: HelpRoleId, hodPermissions?: HODPermissions): RoleContent => {
  switch (role) {
    case 'super-user':
      return {
        icon: Shield,
        title: 'Super Administrator',
        subtitle: 'System-Wide Access',
        description: 'You have complete administrative control over the entire HR Disciplinary System. Manage organizations, configure global settings, and access powerful analytics.',
        features: [
          {
            icon: Building2,
            title: 'Organization Management',
            description: 'Manage all organizations and resellers across the platform'
          },
          {
            icon: Settings,
            title: 'System Configuration',
            description: 'Configure system-wide settings and platform parameters'
          },
          {
            icon: BarChart3,
            title: 'Global Analytics',
            description: 'Access comprehensive analytics and reports across all organizations'
          }
        ],
        primaryColor: '#8b5cf6',
        bgColor: '#f5f3ff'
      };

    case 'reseller':
      return {
        icon: Globe,
        title: 'Reseller Partner',
        subtitle: 'Client Management',
        description: 'Deploy and manage client organizations while earning monthly commission on their subscriptions. Build and grow your portfolio with powerful management tools.',
        features: [
          {
            icon: UserPlus,
            title: 'Deploy Organizations',
            description: 'Create and configure new client organizations in minutes'
          },
          {
            icon: Building2,
            title: 'Client Portfolio',
            description: 'Manage and monitor all your client organizations in one place'
          },
          {
            icon: TrendingUp,
            title: 'Commission Tracking',
            description: 'Track your earnings and commission in real-time'
          }
        ],
        primaryColor: '#3b82f6',
        bgColor: '#eff6ff'
      };

    case 'executive-management':
      return {
        icon: Briefcase,
        title: 'Executive Management',
        subtitle: 'Executive Dashboard',
        description: 'Complete oversight of your organization\'s disciplinary processes and compliance. Access powerful insights and manage your entire workforce.',
        features: [
          {
            icon: BarChart3,
            title: 'Executive Metrics',
            description: 'View organization-wide trends, patterns, and compliance data'
          },
          {
            icon: Users,
            title: 'Department Management',
            description: 'Manage departments, teams, and organizational structure'
          },
          {
            icon: Settings,
            title: 'Policy Configuration',
            description: 'Configure disciplinary policies, categories, and branding'
          }
        ],
        primaryColor: '#6366f1',
        bgColor: '#eef2ff'
      };

    case 'hr-manager':
      return {
        icon: ClipboardList,
        title: 'HR Manager',
        subtitle: 'HR Operations & Compliance',
        description: 'Manage employee disciplinary processes, warnings, and maintain legal compliance. Your central hub for all HR operations and employee lifecycle management.',
        features: [
          {
            icon: FileText,
            title: 'Warning Management',
            description: 'Issue, track, and manage warnings and counselling sessions'
          },
          {
            icon: Users,
            title: 'Employee Lifecycle',
            description: 'Manage employee records, profiles, and complete lifecycle'
          },
          {
            icon: AlertCircle,
            title: 'Compliance Tracking',
            description: 'Review absence reports, HR meetings, and compliance metrics'
          }
        ],
        primaryColor: '#10b981',
        bgColor: '#ecfdf5'
      };

    case 'hod-manager':
    case 'department-manager':
      return buildManagerContent(hodPermissions);

    default:
      return {
        icon: Briefcase,
        title: 'Welcome',
        subtitle: 'Getting Started',
        description: 'Welcome to the HR Disciplinary System.',
        features: [
          {
            icon: CheckCircle,
            title: 'Dashboard Access',
            description: 'Access your personalized dashboard'
          }
        ],
        primaryColor: '#6b7280',
        bgColor: '#f9fafb'
      };
  }
};
