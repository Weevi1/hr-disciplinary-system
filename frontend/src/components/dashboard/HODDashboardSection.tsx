// frontend/src/components/dashboard/HODDashboardSection.tsx
// ✨ PREMIUM HOD DASHBOARD SECTION WITH AUDIO CONSENT INTEGRATION
// ✅ Shows mandatory audio consent modal before opening warning wizard
// ✅ Updated "Issue Warning" button with audio notification
// ✅ Cannot bypass audio recording requirement
// 🔥 FIXED: Categories loading issue - now properly loads categories when needed

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  MessageCircle,
  UserX,
  Users,
  TrendingUp,
  Calendar,
  Target,
  ChevronRight,
  Mic, // NEW: Audio recording icon
  BookOpen, // NEW: Corrective Counselling icon
  RefreshCw // NEW: Refresh button for cache issues
} from 'lucide-react';

// Import enhanced warning wizard (now includes audio consent)
import { EnhancedWarningWizard } from '../warnings/enhanced/EnhancedWarningWizard';

// Import unified modal components
import { UnifiedCorrectiveCounselling } from '../counselling/UnifiedCorrectiveCounselling';
import { UnifiedBookHRMeeting } from '../meetings/UnifiedBookHRMeeting';
import { UnifiedReportAbsence } from '../absences/UnifiedReportAbsence';
import { CounsellingFollowUp } from '../counselling/CounsellingFollowUp';

// Import hooks and services
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { API } from '../../api';
import { DataServiceV2 } from '../../services/DataServiceV2';
import { NestedDataService } from '../../services/NestedDataService';
import { useNestedStructure, useCollectionGroup, useIndexes } from '../../config/features';
import Logger from '../../utils/logger';

// Import employee management
import { EmployeeManagement } from '../employees/EmployeeManagement';

// Import skeleton components for progressive loading
import { SkeletonCard, SkeletonStats } from '../common/SkeletonLoader';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';

// Import reusable watch list
import { FinalWarningsWatchList } from './FinalWarningsWatchList';

// --- A Reusable Breakpoint Hook (for responsive rendering) ---
const useBreakpoint = (breakpoint: number) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);
  const handleResize = useCallback(() => setIsDesktop(window.innerWidth > breakpoint), [breakpoint]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isDesktop;
};

interface HODDashboardSectionProps {
  className?: string;
}

interface ToolAction {
  id: string;
  title: string;
  icon: any;
  color: string;
  action: () => void;
  enabled: boolean;
  hasAudioRecording: boolean;
  showCount?: boolean;
  count?: number;
}

export const HODDashboardSection = memo<HODDashboardSectionProps>(({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const { canCreateWarnings, canManageEmployees } = useMultiRolePermissions();

  // 🚀 UNIFIED: Replace scattered hooks with single dashboard data hook
  const {
    categories: contextCategories,
    employees: dashboardEmployees,
    followUps: dueFollowUps,
    loading: dashboardLoading,
    error: dashboardError,
    isReady,
    refreshData
  } = useDashboardData({ role: 'hod' });

  // Note: Removed automatic refresh loop - if manager has 0 employees, that's a valid state

  // Create followUpCounts from dueFollowUps for compatibility
  const followUpCounts = {
    total: dueFollowUps?.length || 0,
    overdue: dueFollowUps?.filter((f: any) => new Date(f.dueDate) < new Date()).length || 0,
    dueSoon: dueFollowUps?.filter((f: any) => {
      const dueDate = new Date(f.dueDate);
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= threeDaysFromNow;
    }).length || 0
  };

  const isDesktop = useBreakpoint(768);

  // ============================================
  // NEW: AUDIO CONSENT & WIZARD STATE
  // ============================================
  
  const [showWarningWizard, setShowWarningWizard] = useState(false);

  const [showCorrectiveCounselling, setShowCorrectiveCounselling] = useState(false);
  const [showBookHRMeeting, setShowBookHRMeeting] = useState(false);
  const [showReportAbsence, setShowReportAbsence] = useState(false);
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedFollowUpSession, setSelectedFollowUpSession] = useState<any>(null);
  // 🚀 OPTIMIZED: Use data from unified dashboard hook instead of local state
  const employees = dashboardEmployees || [];
  const categories = contextCategories || [];

  // 🎯 PRODUCTION: Minimal debug logging only when needed

  // 🔥 PERFORMANCE: Memoize computed props to prevent wizard unmount/remount
  const currentManagerName = useMemo(() => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Manager';
  }, [user?.firstName, user?.lastName]);

  const organizationName = useMemo(() => {
    return organization?.name || 'Your Organization';
  }, [organization?.name]);

  // 🔧 ULTRA-STABLE: Prevent ANY prop changes that could cause remount
  const stableWizardProps = useMemo(() => {
    if (employees.length === 0 || categories.length === 0) {
      return null; // Don't render wizard until we have data
    }

    return {
      employees,
      categories,
      currentManagerName,
      organizationName,
      key: `wizard-${organization?.id}-${employees.length}-${categories.length}` // Stable key
    };
  }, [employees.length, categories.length, currentManagerName, organizationName, organization?.id]);

  // 🚀 OPTIMIZED: Data loading now handled by unified dashboard hook
  // Employee and category data transformations moved to useDashboardData hook

  // 🎯 PRODUCTION DEBUG: Only log when context is ready
  useEffect(() => {
    if (!orgLoading && contextCategories && contextCategories.length > 0) {
      Logger.debug('✅ [HOD] Context ready:', {
        organization: organization?.name,
        categories: contextCategories.length,
        employees: employees.length
      });
    }
  }, [orgLoading, contextCategories, organization, employees]);

  // 🚀 OPTIMIZED: Data loading now handled automatically by useDashboardData hook

  // 🎯 PROFESSIONAL GRADE: No fallback categories function - organization context only

  // ============================================
  // AUDIO CONSENT & WIZARD HANDLERS
  // ============================================

  const handleIssueWarning = useCallback(async () => {
    if (!canCreateWarnings()) return;

    Logger.debug('🎯 Opening warning wizard with integrated audio consent...');

    // 🚀 OPTIMIZED: Data is already loaded via useDashboardData hook
    // Check if data is ready from unified hook
    if (!isReady || dashboardLoading.overall) {
      Logger.warn('⚠️ Please wait for data to load...');
      return;
    }

    if (categories.length === 0) {
      Logger.error('❌ No warning categories configured');
      alert('Cannot issue warning: No warning categories are configured for this organization.');
      return;
    }

    if (employees.length === 0) {
      // Check if user is actually an HOD manager (not HR/Business Owner viewing HOD dashboard)
      // Note: user.role can be an object {id: 'hr-manager', name: 'HR Manager'} or a string
      const actualUserRoleId = typeof user?.role === 'object' && user.role?.id
        ? user.role.id
        : (user?.role || '');

      const isActualHOD = actualUserRoleId === 'hod' ||
                         actualUserRoleId === 'hod-manager' ||
                         actualUserRoleId === 'department-manager';

      if (isActualHOD) {
        Logger.warn('⚠️ No team members assigned');
        alert('You have no team members assigned to you as a manager.\n\nAs a Department Manager, you can only issue warnings to employees who report directly to you.\n\nPlease contact HR to have employees assigned to your team, or switch to the HR Dashboard view if you have HR permissions.');
      } else {
        Logger.warn('⚠️ No employees in organization');
        alert('There are no employees in your organization.\n\nPlease add employees before issuing warnings.');
      }
      return;
    }

    setShowWarningWizard(true);
  }, [canCreateWarnings, isReady, employees.length, categories.length, dashboardLoading]);

  // Audio consent handling is now integrated into the wizard

  const handleWarningWizardComplete = useCallback(() => {
    Logger.debug('✅ Warning wizard completed');
    setShowWarningWizard(false);
  }, []);

  const handleWarningWizardCancel = useCallback(() => {
    Logger.debug('❌ Warning wizard cancelled');
    setShowWarningWizard(false);
  }, []);

  const handleOpenCorrectiveCounselling = useCallback(() => {
    Logger.debug('📋 Opening corrective counselling modal');
    setShowCorrectiveCounselling(true);
  }, []);

  const handleCorrectiveCounsellingClose = useCallback(() => {
    Logger.debug('❌ Corrective counselling modal closed');
    setShowCorrectiveCounselling(false);
  }, []);

  const handleOpenBookHRMeeting = useCallback(() => {
    Logger.debug('📅 Opening book HR meeting modal');
    setShowBookHRMeeting(true);
  }, []);

  const handleBookHRMeetingClose = useCallback(() => {
    Logger.debug('❌ Book HR meeting modal closed');
    setShowBookHRMeeting(false);
  }, []);

  const handleOpenReportAbsence = useCallback(() => {
    Logger.debug('🚫 Opening report absence modal');
    setShowReportAbsence(true);
  }, []);

  const handleReportAbsenceClose = useCallback(() => {
    Logger.debug('❌ Report absence modal closed');
    setShowReportAbsence(false);
  }, []);


  // ============================================
  // COUNSELLING FOLLOW-UP HANDLERS
  // ============================================

  const handleOpenFollowUp = useCallback((session: any) => {
    Logger.debug('📅 Opening follow-up for session:', session.id);
    setSelectedFollowUpSession(session);
    setShowFollowUpModal(true);
  }, []);

  const handleFollowUpClose = useCallback(() => {
    Logger.debug('❌ Follow-up modal closed');
    setShowFollowUpModal(false);
    setSelectedFollowUpSession(null);
  }, []);

  const handleFollowUpComplete = useCallback(() => {
    Logger.debug('✅ Follow-up completed');
    setShowFollowUpModal(false);
    setSelectedFollowUpSession(null);
    // Refresh follow-ups data would happen automatically via the hook
  }, []);


  // ============================================
  // TOOL ACTIONS CONFIGURATION
  // ============================================
  
  // 🎯 UNIFIED: All tool actions now use consistent modal system
  const toolActions: ToolAction[] = [
    {
      id: 'create-warning',
      title: 'Issue Warning',
      icon: AlertTriangle,
      color: 'orange',
      action: handleIssueWarning, // Modal system with audio consent
      enabled: canCreateWarnings(),
      hasAudioRecording: true // NEW: Flag for audio recording
    },
    {
      id: 'book-hr-meeting',
      title: 'HR Meeting',
      icon: MessageCircle,
      color: 'purple',
      action: handleOpenBookHRMeeting, // Updated to use modal
      enabled: true,
      hasAudioRecording: false
    },
    {
      id: 'report-absence',
      title: 'Report Absence',
      icon: UserX,
      color: 'red',
      action: handleOpenReportAbsence, // Updated to use modal
      enabled: true,
      hasAudioRecording: false
    },
    {
      id: 'corrective-counselling',
      title: 'Counselling',
      icon: BookOpen,
      color: 'blue',
      action: handleOpenCorrectiveCounselling, // Already using modal
      enabled: true,
      hasAudioRecording: false
    },
  ].filter(action => action.enabled);

  const managementActions = [
    {
      id: 'team-performance',
      title: 'Team Performance',
      description: 'Review department performance metrics',
      icon: TrendingUp,
      color: 'green',
      action: () => navigate('/team/performance'),
      enabled: canManageEmployees()
    },
    {
      id: 'schedule-review',
      title: 'Schedule Reviews',
      description: 'Plan performance reviews for team members',
      icon: Calendar,
      color: 'blue',
      action: () => navigate('/reviews/schedule'),
      enabled: canManageEmployees()
    },
    {
      id: 'team-goals',
      title: 'Team Goals',
      description: 'Set and track overall department objectives',
      icon: Target,
      color: 'indigo',
      action: () => navigate('/goals'),
      enabled: canManageEmployees()
    }
  ].filter(action => action.enabled);

  // 🎨 SuperUser design system gradient colors for tool buttons
  const getToolButtonColorClasses = (color: string) => {
    const colorMap = {
      orange: 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      purple: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      red: 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
      indigo: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };
  
  const cardClasses = "bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100";

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <>
      <div className={`space-y-4 ${className}`}>


        {/* --- Mobile-Optimized Compact Tools Grid --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {toolActions.map((tool) => (
            <ThemedCard
              key={tool.id}
              hover
              padding="sm"
              className="cursor-pointer transition-all duration-200 active:scale-95"
              onClick={tool.action}
              style={{
                opacity: (dashboardLoading.overall || dashboardLoading.employees) && tool.id === 'create-warning' ? 0.5 : 1,
                background: tool.color === 'orange' ? 'linear-gradient(135deg, var(--color-warning), var(--color-warning))' :
                           tool.color === 'purple' ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent))' :
                           tool.color === 'red' ? 'linear-gradient(135deg, var(--color-error), var(--color-error))' :
                           tool.color === 'blue' ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary))' :
                           'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                color: 'var(--color-text-inverse)',
                minHeight: '80px', // Ensure consistent mobile touch targets
                willChange: 'transform'
              }}
            >
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="flex items-center gap-1">
                  <tool.icon className="w-5 h-5" />
                  {tool.hasAudioRecording && <Mic className="w-3.5 h-3.5 opacity-80" />}
                </div>
                <span className="font-medium text-xs text-center leading-tight">{tool.title}</span>
                {(dashboardLoading.overall || dashboardLoading.employees) && tool.id === 'create-warning' && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                )}
              </div>
            </ThemedCard>
          ))}
        </div>

        {/* --- Mobile-Optimized Team Members Button (Full Width) --- */}
        <ThemedCard
          hover
          padding="none"
          className="mb-3 cursor-pointer transition-all duration-200 overflow-hidden active:scale-[0.98]"
          onClick={() => setShowEmployeeManagement(true)}
          style={{
            background: 'linear-gradient(135deg, var(--color-success), var(--color-success))',
            color: 'var(--color-text-inverse)',
            minHeight: '64px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span className="font-medium text-sm">Team Members</span>
            </div>
            <div className="flex items-center gap-2">
              {dashboardLoading.employees ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <span className="text-2xl font-bold">{employees.length}</span>
              )}
              <ChevronRight className="w-4 h-4 opacity-60" />
            </div>
          </div>
        </ThemedCard>

        {/* --- Mobile-Optimized Follow-up Section --- */}
        {followUpCounts.total > 0 && (
          <ThemedCard padding="sm">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--color-text)' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
              Follow-ups Due ({followUpCounts.due})
            </h4>
            <div className="space-y-1">
              {dueFollowUps.slice(0, 3).map((session) => (
                <ThemedButton
                  key={session.id}
                  variant="ghost"
                  onClick={() => handleOpenFollowUp(session)}
                  className="w-full text-left p-2 text-sm"
                >
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>{session.employeeName}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{session.sessionType}</div>
                </ThemedButton>
              ))}
            </div>
          </ThemedCard>
        )}

        {/* --- 🚨 Final Warnings Watch List (Only for assigned employees) --- */}
        <FinalWarningsWatchList employees={employees} />
      </div>

      {/* Audio consent is now integrated into the wizard as first step */}

      {/* Warning Wizard */}
      {showWarningWizard && (
        <EnhancedWarningWizard
          key="enhanced-warning-wizard"
          employees={employees}
          categories={categories}
          currentManagerName={currentManagerName}
          organizationName={organizationName}
          onComplete={handleWarningWizardComplete}
          onCancel={handleWarningWizardCancel}
        />
      )}

      {/* Unified Modal Components */}

      {/* Corrective Counselling Modal */}
      {showCorrectiveCounselling && (
        <UnifiedCorrectiveCounselling
          isOpen={showCorrectiveCounselling}
          onClose={handleCorrectiveCounsellingClose}
        />
      )}

      {/* Book HR Meeting Modal */}
      {showBookHRMeeting && (
        <UnifiedBookHRMeeting
          isOpen={showBookHRMeeting}
          onClose={handleBookHRMeetingClose}
        />
      )}

      {/* Report Absence Modal */}
      {showReportAbsence && (
        <UnifiedReportAbsence
          isOpen={showReportAbsence}
          onClose={handleReportAbsenceClose}
        />
      )}

      {/* Counselling Follow-up Modal */}
      {showFollowUpModal && selectedFollowUpSession && (
        <CounsellingFollowUp 
          counsellingSession={selectedFollowUpSession}
          onClose={handleFollowUpClose}
          onComplete={handleFollowUpComplete}
        />
      )}

      {/* Employee Management Modal */}
      {showEmployeeManagement && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
          <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] flex flex-col" shadow="xl">
            <div className="flex items-center justify-between p-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Team Management</h2>
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={() => setShowEmployeeManagement(false)}
              >
                ×
              </ThemedButton>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              <EmployeeManagement />
            </div>
          </ThemedCard>
        </div>
      )}

    </>
  );
});

HODDashboardSection.displayName = 'HODDashboardSection';

