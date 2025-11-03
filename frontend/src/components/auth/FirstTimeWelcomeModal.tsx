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

    case 'business-owner':
      return {
        icon: <Briefcase className="w-12 h-12" />,
        title: 'Business Owner',
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
      // Build dynamic features array based on HOD permissions
      const features: FeatureItem[] = [
        {
          icon: <Users className="w-5 h-5" />,
          title: 'Team Overview',
          description: 'View all team members and their disciplinary records'
        }
      ];

      // Add permission-based features
      if (hodPermissions?.canIssueWarnings) {
        features.push({
          icon: <FileText className="w-5 h-5" />,
          title: 'Issue Warnings',
          description: 'Create and issue warnings to team members'
        });
      }

      if (hodPermissions?.canBookHRMeetings) {
        features.push({
          icon: <MessageSquare className="w-5 h-5" />,
          title: 'HR Meetings',
          description: 'Request HR meetings and document team issues'
        });
      }

      if (hodPermissions?.canReportAbsences) {
        features.push({
          icon: <UserX className="w-5 h-5" />,
          title: 'Absence Reporting',
          description: 'Report employee absences to HR'
        });
      }

      if (hodPermissions?.canRecordCounselling) {
        features.push({
          icon: <BookOpen className="w-5 h-5" />,
          title: 'Record Counselling',
          description: 'Document counselling sessions with team members'
        });
      }

      // Build dynamic description based on enabled features
      const enabledCount = hodPermissions
        ? Object.values(hodPermissions).filter(Boolean).length
        : 4;

      let description = 'Manage your team members and handle day-to-day disciplinary matters. ';

      if (enabledCount === 0) {
        description = 'View your team members and their disciplinary records. Your HR manager can enable additional features for you.';
      } else if (enabledCount === 1 && hodPermissions?.canIssueWarnings) {
        description = 'Issue warnings to your team members and manage disciplinary matters. Additional features can be enabled by your HR manager.';
      } else if (enabledCount <= 2) {
        description = 'Manage your team members with selected disciplinary tools. Additional features can be enabled by your HR manager.';
      } else {
        description = 'Manage your team members and handle day-to-day disciplinary matters. Keep your department running smoothly with streamlined reporting tools.';
      }

      return {
        icon: <Users className="w-12 h-12" />,
        title: 'Department Manager',
        subtitle: 'Team Management',
        description,
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
      size={isMobile ? "sm" : "md"}
      className="first-time-welcome-modal"
      hideHeader={true}
    >
      {/* Solid Color Hero Header - Fixed at top, no scroll */}
      <div
        className={`relative overflow-hidden flex-shrink-0 ${isMobile ? 'px-4 pt-3 pb-2' : 'px-8 pt-8 pb-6'}`}
        style={{ backgroundColor: roleContent.bgColor }}
      >
          {isMobile ? (
            /* Compact Mobile Header - Horizontal Layout */
            <div
              className="flex items-center gap-3 transition-all duration-500"
              style={{
                opacity: isAnimated ? 1 : 0,
                transform: isAnimated ? 'translateY(0)' : 'translateY(10px)'
              }}
            >
              {/* Icon - Smaller, Left-aligned */}
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg shadow-md flex-shrink-0"
                style={{
                  backgroundColor: 'white',
                  color: roleContent.primaryColor
                }}
              >
                {React.cloneElement(roleContent.icon as React.ReactElement, {
                  className: 'w-6 h-6'
                })}
              </div>

              {/* Text - Left-aligned, Compact */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-base font-bold tracking-tight truncate"
                  style={{ color: roleContent.primaryColor }}
                >
                  Welcome, {userName}! 👋
                </h2>
                <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                  <span className="font-semibold truncate">{roleContent.title}</span>
                  <span className="text-gray-400">•</span>
                  <span className="truncate">{roleContent.subtitle}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Header - Original Centered Layout */
            <>
              {/* Icon - Centered */}
              <div className="flex justify-center mb-6">
                <div
                  className="flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg"
                  style={{
                    backgroundColor: 'white',
                    color: roleContent.primaryColor
                  }}
                >
                  {roleContent.icon}
                </div>
              </div>

              {/* Welcome message - Centered */}
              <div
                className="text-center space-y-2 transition-all duration-500"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? 'translateY(0)' : 'translateY(10px)'
                }}
              >
                <h2
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: roleContent.primaryColor }}
                >
                  Welcome, {userName}! 👋
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2 text-gray-700">
                  <span className="text-lg font-semibold">{roleContent.title}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-base">{roleContent.subtitle}</span>
                </div>
              </div>
            </>
          )}
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto" style={{
        backgroundColor: 'var(--color-card-background)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className={`${isMobile ? 'px-4 pt-4 pb-4 space-y-4' : 'px-8 pt-6 pb-6 space-y-6'}`}>
          {/* Description */}
          <div
            className="transition-all duration-500 delay-100"
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <p className={`${isMobile ? 'text-sm' : 'text-base'} leading-relaxed`} style={{ color: 'var(--color-text-secondary)' }}>
              {roleContent.description}
            </p>
          </div>

          {/* Features Grid */}
          <div
            className="transition-all duration-500 delay-200"
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <h3
              className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-wider ${isMobile ? 'mb-2' : 'mb-4'}`}
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              What You Can Do
            </h3>
            <div className={`grid ${isMobile ? 'gap-2' : 'gap-3'}`}>
              {(() => {
                const visibleFeatures = isMobile && !showAllFeatures
                  ? roleContent.features.slice(0, 2)
                  : roleContent.features;
                const hiddenCount = roleContent.features.length - 2;

                return (
                  <>
                    {visibleFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className={`group relative rounded-xl ${isMobile ? 'p-3' : 'p-4'} border transition-all duration-200 cursor-default hover:shadow-md`}
                        style={{
                          backgroundColor: 'var(--color-background)',
                          borderColor: 'var(--color-border)',
                          transitionDelay: `${300 + index * 75}ms`
                        }}
                      >
                        <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
                          <div
                            className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all`}
                            style={{ backgroundColor: roleContent.primaryColor }}
                          >
                            {React.cloneElement(feature.icon as React.ReactElement, {
                              className: isMobile ? 'w-4 h-4' : 'w-5 h-5'
                            })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'} mb-0.5`}
                              style={{ color: 'var(--color-text)' }}
                            >
                              {feature.title}
                            </h4>
                            <p
                              className={`${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show More/Less Button for Mobile */}
                    {isMobile && roleContent.features.length > 2 && (
                      <button
                        onClick={() => setShowAllFeatures(!showAllFeatures)}
                        className="w-full py-2.5 px-3 rounded-lg border-2 border-dashed transition-all duration-200 hover:border-solid hover:shadow-sm"
                        style={{
                          borderColor: roleContent.primaryColor,
                          color: roleContent.primaryColor,
                          backgroundColor: showAllFeatures ? 'var(--color-background)' : 'transparent'
                        }}
                      >
                        <span className="text-xs font-semibold">
                          {showAllFeatures ? '▲ Show Less' : `▼ Show ${hiddenCount} More Feature${hiddenCount > 1 ? 's' : ''}`}
                        </span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Security Notice */}
          <div
            className="transition-all duration-500 delay-500"
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <div
              className={`border-2 rounded-xl ${isMobile ? 'p-3' : 'p-4'} shadow-sm`}
              style={{
                backgroundColor: 'var(--color-alert-warning-bg)',
                borderColor: 'var(--color-alert-warning-border)'
              }}
            >
              <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <div
                  className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center text-white shadow-md`}
                  style={{ backgroundColor: 'var(--color-warning)' }}
                >
                  <Key className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-bold ${isMobile ? 'mb-0.5 text-xs' : 'mb-1 text-sm'} flex items-center gap-2 flex-wrap`}
                    style={{ color: 'var(--color-alert-warning-text)' }}
                  >
                    Important: Change Your Password
                    {!isMobile && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'var(--color-badge-warning)',
                          color: 'var(--color-badge-warning-text)'
                        }}
                      >
                        Action Required
                      </span>
                    )}
                  </h4>
                  <p
                    className={`${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}
                    style={{ color: 'var(--color-alert-warning-text)' }}
                  >
                    {isMobile ? (
                      <>Change your default password (<span className="font-mono font-bold">temp123</span>) from the profile menu.</>
                    ) : (
                      <>
                        If you're using the temporary password <span className="font-mono font-bold bg-orange-100 px-1.5 py-0.5 rounded">temp123</span>,
                        please change it immediately for security. Click your profile icon in the top right and select
                        <span className="font-semibold"> "Reset Password"</span>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkboxes */}
          <div
            className={`border-t ${isMobile ? 'pt-3 space-y-3' : 'pt-4 space-y-2.5'} transition-all duration-500 delay-600`}
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateY(0)' : 'translateY(10px)',
              borderColor: 'var(--color-border)'
            }}
          >
            <label className={`flex items-center ${isMobile ? 'gap-3 py-1' : 'gap-2.5'} cursor-pointer group`}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded border-2 border-gray-300 focus:ring-2 focus:ring-offset-2 cursor-pointer transition-all`}
                style={{
                  color: roleContent.primaryColor,
                  accentColor: roleContent.primaryColor
                }}
              />
              <span
                className={`${isMobile ? 'text-sm' : 'text-sm'} leading-snug group-hover:opacity-100 transition-opacity flex-1`}
                style={{ color: 'var(--color-text-secondary)', opacity: 0.9 }}
              >
                I understand my role and responsibilities, and I'll change my password if needed.
              </span>
            </label>

            <label className={`flex items-center ${isMobile ? 'gap-3 py-1' : 'gap-2.5'} cursor-pointer group`}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} rounded border-2 border-gray-300 focus:ring-2 focus:ring-offset-2 cursor-pointer transition-all`}
                style={{
                  color: roleContent.primaryColor,
                  accentColor: roleContent.primaryColor
                }}
              />
              <span
                className={`${isMobile ? 'text-sm' : 'text-sm'} leading-snug group-hover:opacity-100 transition-opacity flex-1`}
                style={{ color: 'var(--color-text-secondary)', opacity: 0.9 }}
              >
                Don't show this welcome message again
              </span>
            </label>
          </div>

          {/* Action Button */}
          <div
            className={`flex justify-end ${isMobile ? 'pt-3' : 'pt-4'} transition-all duration-500 delay-700`}
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <button
              onClick={handleConfirm}
              disabled={!acknowledged}
              className={`flex items-center justify-center gap-2 ${isMobile ? 'w-full px-6 py-3' : 'px-6 py-2.5'} rounded-lg font-semibold transition-all ${isMobile ? 'text-base' : 'text-sm'} transform active:scale-95`}
              style={{
                backgroundColor: acknowledged ? roleContent.primaryColor : 'var(--color-muted)',
                color: acknowledged ? 'white' : 'var(--color-text-tertiary)',
                cursor: acknowledged ? 'pointer' : 'not-allowed',
                boxShadow: acknowledged ? 'var(--shadow-lg)' : 'none',
                transform: acknowledged ? 'scale(1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (acknowledged) {
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (acknowledged) {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
};
