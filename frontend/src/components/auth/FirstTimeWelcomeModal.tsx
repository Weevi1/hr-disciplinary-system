// frontend/src/components/auth/FirstTimeWelcomeModal.tsx
// Award-winning first-time login welcome modal with role-specific guidance
// 🎨 Modern design with gradients, animations, and polished interactions
// ✨ Inspired by Linear, Stripe, Vercel, and Notion's onboarding experiences

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  Shield,
  Briefcase,
  Users,
  Globe,
  CheckCircle,
  ArrowRight,
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
  BookOpen,
  X
} from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
import { UserRoleId, HODPermissions } from '../../types/core';

interface FirstTimeWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: UserRoleId;
  onConfirm: () => void;
  hodPermissions?: HODPermissions; // Optional: For HOD managers to show dynamic features
}

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface RoleContent {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: FeatureItem[];
  primaryColor: string;
  bgColor: string;
}

const getRoleContent = (role: UserRoleId, hodPermissions?: HODPermissions): RoleContent => {
  switch (role) {
    case 'super-user':
      return {
        icon: <Shield className="w-12 h-12" />,
        title: 'Super Administrator',
        subtitle: 'System-Wide Access',
        description: 'You have complete administrative control over the entire HR Disciplinary System. Manage organizations, configure global settings, and access powerful analytics.',
        features: [
          {
            icon: <Building2 className="w-5 h-5" />,
            title: 'Organization Management',
            description: 'Manage all organizations and resellers across the platform'
          },
          {
            icon: <Settings className="w-5 h-5" />,
            title: 'System Configuration',
            description: 'Configure system-wide settings and platform parameters'
          },
          {
            icon: <BarChart3 className="w-5 h-5" />,
            title: 'Global Analytics',
            description: 'Access comprehensive analytics and reports across all organizations'
          }
        ],
        primaryColor: '#8b5cf6',
        bgColor: '#f5f3ff'
      };

    case 'reseller':
      return {
        icon: <Globe className="w-12 h-12" />,
        title: 'Reseller Partner',
        subtitle: 'Client Management',
        description: 'Deploy and manage client organizations while earning monthly commission on their subscriptions. Build and grow your portfolio with powerful management tools.',
        features: [
          {
            icon: <UserPlus className="w-5 h-5" />,
            title: 'Deploy Organizations',
            description: 'Create and configure new client organizations in minutes'
          },
          {
            icon: <Building2 className="w-5 h-5" />,
            title: 'Client Portfolio',
            description: 'Manage and monitor all your client organizations in one place'
          },
          {
            icon: <TrendingUp className="w-5 h-5" />,
            title: 'Commission Tracking',
            description: 'Track your earnings and commission in real-time'
          }
        ],
        primaryColor: '#3b82f6',
        bgColor: '#eff6ff'
      };

    case 'executive-management':
      return {
        icon: <Briefcase className="w-12 h-12" />,
        title: 'Executive Management',
        subtitle: 'Executive Dashboard',
        description: 'Complete oversight of your organization\'s disciplinary processes and compliance. Access powerful insights and manage your entire workforce.',
        features: [
          {
            icon: <BarChart3 className="w-5 h-5" />,
            title: 'Executive Metrics',
            description: 'View organization-wide trends, patterns, and compliance data'
          },
          {
            icon: <Users className="w-5 h-5" />,
            title: 'Department Management',
            description: 'Manage departments, teams, and organizational structure'
          },
          {
            icon: <Settings className="w-5 h-5" />,
            title: 'Policy Configuration',
            description: 'Configure disciplinary policies, categories, and branding'
          }
        ],
        primaryColor: '#6366f1',
        bgColor: '#eef2ff'
      };

    case 'hr-manager':
      return {
        icon: <ClipboardList className="w-12 h-12" />,
        title: 'HR Manager',
        subtitle: 'HR Operations & Compliance',
        description: 'Manage employee disciplinary processes, warnings, and maintain legal compliance. Your central hub for all HR operations and employee lifecycle management.',
        features: [
          {
            icon: <FileText className="w-5 h-5" />,
            title: 'Warning Management',
            description: 'Issue, track, and manage warnings and counselling sessions'
          },
          {
            icon: <Users className="w-5 h-5" />,
            title: 'Employee Lifecycle',
            description: 'Manage employee records, profiles, and complete lifecycle'
          },
          {
            icon: <AlertCircle className="w-5 h-5" />,
            title: 'Compliance Tracking',
            description: 'Review absence reports, HR meetings, and compliance metrics'
          }
        ],
        primaryColor: '#10b981',
        bgColor: '#ecfdf5'
      };

    case 'hod-manager': {
      // Default each permission individually (handles partial/empty hodPermissions objects)
      const permissions = {
        canIssueWarnings: hodPermissions?.canIssueWarnings ?? true,
        canBookHRMeetings: hodPermissions?.canBookHRMeetings ?? true,
        canReportAbsences: hodPermissions?.canReportAbsences ?? true,
        canRecordCounselling: hodPermissions?.canRecordCounselling ?? true
      };

      // Build dynamic features array based on HOD permissions
      const features: FeatureItem[] = [
        {
          icon: <Users className="w-5 h-5" />,
          title: 'Team Overview',
          description: 'View all team members and their disciplinary records'
        }
      ];

      // Add permission-based features
      if (permissions.canIssueWarnings) {
        features.push({
          icon: <FileText className="w-5 h-5" />,
          title: 'Issue Warnings',
          description: 'Create and issue warnings to team members'
        });
      }

      if (permissions.canBookHRMeetings) {
        features.push({
          icon: <MessageSquare className="w-5 h-5" />,
          title: 'HR Meetings',
          description: 'Request HR meetings and document team issues'
        });
      }

      if (permissions.canReportAbsences) {
        features.push({
          icon: <UserX className="w-5 h-5" />,
          title: 'Absence Reporting',
          description: 'Report employee absences to HR'
        });
      }

      if (permissions.canRecordCounselling) {
        features.push({
          icon: <Sparkles className="w-5 h-5" />,
          title: 'Recognition',
          description: 'Recognize and reward team member achievements'
        });
      }

      return {
        icon: <Users className="w-12 h-12" />,
        title: 'Department Manager',
        subtitle: 'Team Management',
        description: 'Manage your team members and handle day-to-day disciplinary matters. Keep your department running smoothly with streamlined reporting tools.',
        features,
        primaryColor: '#14b8a6',
        bgColor: '#f0fdfa'
      };
    }

    case 'department-manager': {
      // Default each permission individually (handles partial/empty hodPermissions objects)
      const permissions = {
        canIssueWarnings: hodPermissions?.canIssueWarnings ?? true,
        canBookHRMeetings: hodPermissions?.canBookHRMeetings ?? true,
        canReportAbsences: hodPermissions?.canReportAbsences ?? true,
        canRecordCounselling: hodPermissions?.canRecordCounselling ?? true
      };

      // Build dynamic features array based on department manager permissions
      const features: FeatureItem[] = [
        {
          icon: <Users className="w-5 h-5" />,
          title: 'Team Overview',
          description: 'View all team members and their disciplinary records'
        }
      ];

      // Add permission-based features (uses same hodPermissions)
      if (permissions.canIssueWarnings) {
        features.push({
          icon: <FileText className="w-5 h-5" />,
          title: 'Issue Warnings',
          description: 'Create and issue warnings to team members'
        });
      }

      if (permissions.canBookHRMeetings) {
        features.push({
          icon: <MessageSquare className="w-5 h-5" />,
          title: 'HR Meetings',
          description: 'Request HR meetings and document team issues'
        });
      }

      if (permissions.canReportAbsences) {
        features.push({
          icon: <UserX className="w-5 h-5" />,
          title: 'Absence Reporting',
          description: 'Report employee absences to HR'
        });
      }

      if (permissions.canRecordCounselling) {
        features.push({
          icon: <Sparkles className="w-5 h-5" />,
          title: 'Recognition',
          description: 'Recognize and reward team member achievements'
        });
      }

      return {
        icon: <Users className="w-12 h-12" />,
        title: 'Department Manager',
        subtitle: 'Team Management',
        description: 'Manage your team members and handle day-to-day disciplinary matters. Keep your department running smoothly with streamlined reporting tools.',
        features,
        primaryColor: '#14b8a6',
        bgColor: '#f0fdfa'
      };
    }

    default:
      return {
        icon: <Briefcase className="w-12 h-12" />,
        title: 'Welcome',
        subtitle: 'Getting Started',
        description: 'Welcome to the HR Disciplinary System.',
        features: [
          {
            icon: <CheckCircle className="w-5 h-5" />,
            title: 'Dashboard Access',
            description: 'Access your personalized dashboard'
          }
        ],
        primaryColor: '#6b7280',
        bgColor: '#f9fafb'
      };
  }
};

// Animation keyframes for entrance
const fadeInUp = {
  initial: { opacity: 0, transform: 'translateY(20px)' },
  animate: { opacity: 1, transform: 'translateY(0px)' }
};

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  onClose,
  userName,
  userRole,
  onConfirm,
  hodPermissions
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const roleContent = getRoleContent(userRole, hodPermissions);

  // Mobile breakpoint detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger animation on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimated(true), 50);
    } else {
      setIsAnimated(false);
    }
  }, [isOpen]);

  // Handle Enter key to submit
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && acknowledged && isOpen) {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [acknowledged, isOpen]);

  const handleConfirm = () => {
    if (dontShowAgain) {
      onConfirm();
    }
    onClose();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing until acknowledged
      title=""
      size="sm"
      className="first-time-welcome-modal"
      hideHeader={true}
    >
      {/* Professional Compact Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: roleContent.primaryColor,
              opacity: 0.12
            }}
          >
            <div style={{ color: roleContent.primaryColor }}>
              {React.cloneElement(roleContent.icon as React.ReactElement, {
                className: 'w-5 h-5'
              })}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-0.5">
              Welcome, {userName}!
            </h2>
            <p className="text-sm text-gray-500">
              {roleContent.title}
            </p>
          </div>
        </div>

        {/* Key Features - Compact List */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
            Your Capabilities
          </h3>
          <div className="space-y-2">
            {roleContent.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5 text-sm text-gray-700">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: roleContent.primaryColor }}
                />
                <span className="leading-tight">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Password Notice - Compact */}
        <div className="flex items-start gap-2.5 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <Key className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-orange-900 leading-relaxed">
              <strong className="font-semibold">Change your password:</strong> If using temporary password <code className="px-1.5 py-0.5 bg-orange-100 rounded text-[10px] font-mono font-medium">temp123</code>, update it via <span className="font-medium">Profile → Reset Password</span>
            </p>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="space-y-2.5 pt-3 border-t border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0 transition-all"
              style={{
                accentColor: roleContent.primaryColor
              }}
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I understand my role and will change my password if needed
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0 transition-all"
              style={{
                accentColor: roleContent.primaryColor
              }}
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              Don't show this message again
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button
            onClick={handleConfirm}
            disabled={!acknowledged}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:shadow-none"
            style={{
              backgroundColor: acknowledged ? roleContent.primaryColor : '#e5e7eb',
              color: acknowledged ? 'white' : '#9ca3af',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
              opacity: acknowledged ? 1 : 0.6
            }}
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
