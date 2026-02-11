// frontend/src/components/dashboard/HODDashboardSection.tsx
// 🎯 SIMPLE HOD DASHBOARD - NO TABS
// ✅ Direct access to all manager tools
// ✅ Metric cards + Quick action buttons + Team members
// ✅ Mobile-first design for managers on the go

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  MessageCircle,
  UserX,
  Users,
  Calendar,
  ChevronRight,
  Award
} from 'lucide-react';

// 🚀 LAZY LOADED HEAVY COMPONENTS
const EnhancedWarningWizard = React.lazy(() =>
  import('../warnings/enhanced/UnifiedWarningWizard').then(m => ({ default: m.UnifiedWarningWizard }))
);
const UnifiedBookHRMeeting = React.lazy(() =>
  import('../meetings/UnifiedBookHRMeeting').then(m => ({ default: m.UnifiedBookHRMeeting }))
);
const UnifiedReportAbsence = React.lazy(() =>
  import('../absences/UnifiedReportAbsence').then(m => ({ default: m.UnifiedReportAbsence }))
);
const RecognitionEntry = React.lazy(() =>
  import('../recognition/RecognitionEntry').then(m => ({ default: m.RecognitionEntry }))
);
const EmployeeManagement = React.lazy(() =>
  import('../employees/EmployeeManagement').then(m => ({ default: m.EmployeeManagement }))
);
const FinalWarningsWatchList = React.lazy(() =>
  import('./FinalWarningsWatchList').then(m => ({ default: m.FinalWarningsWatchList }))
);

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { QuotesSection } from './QuotesSection';
import { API } from '../../api';
import Logger from '../../utils/logger';

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

interface HODDashboardSectionProps {
  className?: string;
}

export const HODDashboardSection = memo<HODDashboardSectionProps>(({ className = '' }) => {
  const { user } = useAuth();
  const { organization, categories: orgContextCategories } = useOrganization();
  const { canCreateWarnings } = useMultiRolePermissions();

  const {
    categories: contextCategories,
    employees: dashboardEmployees,
    warnings: dashboardWarnings,
    followUps: dueFollowUps,
    loading: dashboardLoading,
    isReady,
    refreshData
  } = useDashboardData({ role: 'hod' });

  const [showWarningWizard, setShowWarningWizard] = useState(false);
  const [showBookHRMeeting, setShowBookHRMeeting] = useState(false);
  const [showReportAbsence, setShowReportAbsence] = useState(false);
  const [showRecognitionEntry, setShowRecognitionEntry] = useState(false);
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);

  const employees = dashboardEmployees || [];
  // 🔧 FIX: Use orgContextCategories as fallback if contextCategories is empty
  const categories = contextCategories && contextCategories.length > 0
    ? contextCategories
    : (orgContextCategories || []);

  const hodPermissions = user?.hodPermissions || {
    canIssueWarnings: true,
    canBookHRMeetings: true,
    canReportAbsences: true
  };

  const followUpCounts = useMemo(() => ({
    total: dueFollowUps?.length || 0,
    overdue: dueFollowUps?.filter((f: any) => new Date(f.dueDate) < new Date()).length || 0
  }), [dueFollowUps]);

  const currentManagerName = useMemo(() => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Manager';
  }, [user?.firstName, user?.lastName]);

  const organizationName = useMemo(() => organization?.name || 'Your Organization', [organization?.name]);

  const handleIssueWarning = useCallback(async () => {
    if (!canCreateWarnings()) return;
    if (!isReady || dashboardLoading.overall) {
      Logger.warn('Please wait for data to load...');
      return;
    }
    if (employees.length === 0) {
      alert('You have no team members assigned. Please contact HR to have employees assigned to your team.');
      return;
    }

    if (categories.length === 0) {
      alert('No warning categories found. Please contact your system administrator.');
      return;
    }

    // 🚀 Quick staleness check — single doc read, near-instant
    if (organization?.id) {
      const isStale = await API.warnings.isWarningsDataStale(organization.id);
      if (isStale) {
        Logger.debug('🔄 Warnings data stale — refreshing before opening wizard');
        refreshData();
      }
    }

    setShowWarningWizard(true);
  }, [canCreateWarnings, isReady, employees.length, categories.length, dashboardLoading, organization?.id, refreshData]);

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Quick Action Buttons - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {hodPermissions.canIssueWarnings && canCreateWarnings() && (
            <button
              type="button"
              onClick={handleIssueWarning}
              className="relative overflow-hidden transition-all duration-200 active:scale-[0.97] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30"
              style={{
                backgroundColor: 'var(--dash-btn-issue-warning, var(--color-warning))',
                color: 'white',
                borderRadius: 'var(--dash-btn-radius, 12px)',
                minHeight: '100px',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" style={{ borderRadius: 'inherit' }} />
              <div className="relative flex flex-col items-center justify-center gap-2 px-3 py-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm leading-tight">Issue Warning</span>
              </div>
            </button>
          )}

          {hodPermissions.canBookHRMeetings && (
            <button
              type="button"
              onClick={() => setShowBookHRMeeting(true)}
              className="relative overflow-hidden transition-all duration-200 active:scale-[0.97] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30"
              style={{
                backgroundColor: 'var(--dash-btn-hr-meeting, var(--color-accent))',
                color: 'white',
                borderRadius: 'var(--dash-btn-radius, 12px)',
                minHeight: '100px',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" style={{ borderRadius: 'inherit' }} />
              <div className="relative flex flex-col items-center justify-center gap-2 px-3 py-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm leading-tight">HR Meeting</span>
              </div>
            </button>
          )}

          {hodPermissions.canReportAbsences && (
            <button
              type="button"
              onClick={() => setShowReportAbsence(true)}
              className="relative overflow-hidden transition-all duration-200 active:scale-[0.97] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30"
              style={{
                backgroundColor: 'var(--dash-btn-report-absence, var(--color-error))',
                color: 'white',
                borderRadius: 'var(--dash-btn-radius, 12px)',
                minHeight: '100px',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" style={{ borderRadius: 'inherit' }} />
              <div className="relative flex flex-col items-center justify-center gap-2 px-3 py-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm leading-tight">Report Absence</span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRecognitionEntry(true)}
            className="relative overflow-hidden transition-all duration-200 active:scale-[0.97] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30"
            style={{
              backgroundColor: 'var(--dash-btn-recognition, #10b981)',
              color: 'white',
              borderRadius: 'var(--dash-btn-radius, 12px)',
              minHeight: '100px',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" style={{ borderRadius: 'inherit' }} />
            <div className="relative flex flex-col items-center justify-center gap-2 px-3 py-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm leading-tight">Recognition</span>
            </div>
          </button>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-3">
          {/* Team Members */}
          <button
            type="button"
            onClick={() => setShowEmployeeManagement(true)}
            className="w-full text-left transition-all duration-200 active:scale-[0.98] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--dash-card-team-members, var(--color-card-background))',
              borderRadius: 'var(--dash-btn-radius, 12px)',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              padding: '14px 16px',
              cursor: 'pointer'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.88)), var(--color-primary)'
                }}
              >
                <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Team Members</span>
                  <span
                    className="flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      lineHeight: '1.4'
                    }}
                  >
                    {employees.length}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  View and manage your team
                </p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
          </button>

          {/* Follow-ups */}
          {followUpCounts.total > 0 && (
            <button
              type="button"
              className="w-full text-left transition-all duration-200 active:scale-[0.98] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--dash-card-general, var(--color-card-background))',
                borderRadius: 'var(--dash-btn-radius, 12px)',
                border: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                padding: '14px 16px',
                cursor: 'pointer'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.88)), ${followUpCounts.overdue > 0 ? 'var(--color-error)' : 'var(--color-info)'}`
                  }}
                >
                  <Calendar className="w-5 h-5" style={{ color: followUpCounts.overdue > 0 ? 'var(--color-error)' : 'var(--color-info)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Follow-ups</span>
                    <span
                      className="flex-shrink-0"
                      style={{
                        backgroundColor: followUpCounts.overdue > 0 ? 'var(--color-error)' : 'var(--color-info)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        lineHeight: '1.4'
                      }}
                    >
                      {followUpCounts.total}
                    </span>
                    {followUpCounts.overdue > 0 && (
                      <span
                        className="flex-shrink-0"
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          color: 'var(--color-error)',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          lineHeight: '1.4'
                        }}
                      >
                        {followUpCounts.overdue} overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Scheduled check-ins due
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
            </button>
          )}
        </div>

        {/* Final Warnings Watch List */}
        <React.Suspense fallback={null}>
          <FinalWarningsWatchList employees={employees} warnings={dashboardWarnings} />
        </React.Suspense>

        {/* Daily Inspiration - Always last */}
        <QuotesSection />
      </div>

      {/* Modals */}
      {showWarningWizard && (
        <React.Suspense fallback={<LoadingSkeleton />}>
          <EnhancedWarningWizard
            key="enhanced-warning-wizard"
            employees={employees}
            categories={categories}
            currentManagerName={currentManagerName}
            organizationName={organizationName}
            preloadedWarnings={dashboardWarnings}
            onComplete={() => { setShowWarningWizard(false); refreshData(); }}
            onCancel={() => setShowWarningWizard(false)}
          />
        </React.Suspense>
      )}

      {showBookHRMeeting && (
        <React.Suspense fallback={<LoadingSkeleton />}>
          <UnifiedBookHRMeeting
            isOpen={showBookHRMeeting}
            onClose={() => setShowBookHRMeeting(false)}
          />
        </React.Suspense>
      )}

      {showReportAbsence && (
        <React.Suspense fallback={<LoadingSkeleton />}>
          <UnifiedReportAbsence
            isOpen={showReportAbsence}
            onClose={() => setShowReportAbsence(false)}
          />
        </React.Suspense>
      )}

      {showRecognitionEntry && (
        <React.Suspense fallback={<LoadingSkeleton />}>
          <RecognitionEntry
            isOpen={showRecognitionEntry}
            onClose={() => setShowRecognitionEntry(false)}
          />
        </React.Suspense>
      )}

      {showEmployeeManagement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Team Members</h2>
              <button
                onClick={() => setShowEmployeeManagement(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <React.Suspense fallback={<LoadingSkeleton />}>
                <EmployeeManagement onDataChange={refreshData} hideFloatingButton />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

HODDashboardSection.displayName = 'HODDashboardSection';
