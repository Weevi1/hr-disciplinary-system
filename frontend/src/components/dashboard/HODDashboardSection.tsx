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
  Mic,
  ChevronRight,
  Shield,
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
import { ThemedCard } from '../common/ThemedCard';
import { QuotesSection } from './QuotesSection';
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

    // 🔍 DEBUG: Log category state
    Logger.debug('🎯 Issue Warning clicked:', {
      contextCategories: contextCategories?.length || 0,
      orgContextCategories: orgContextCategories?.length || 0,
      finalCategories: categories.length,
      categoriesList: categories.map((c: any) => c.name || c.title)
    });

    if (categories.length === 0) {
      alert('No warning categories found. Please contact your system administrator.');
      return;
    }
    setShowWarningWizard(true);
  }, [canCreateWarnings, isReady, employees.length, categories.length, dashboardLoading, contextCategories, orgContextCategories, categories]);

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Quick Action Buttons - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {hodPermissions.canIssueWarnings && canCreateWarnings() && (
            <ThemedCard
              hover
              padding="sm"
              className="cursor-pointer transition-all duration-200 active:scale-95"
              onClick={handleIssueWarning}
              style={{
                background: 'linear-gradient(135deg, var(--color-warning), var(--color-warning))',
                color: 'var(--color-text-inverse)',
                minHeight: '90px'
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1.5 text-center h-full py-2">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-5 h-5" />
                  <Mic className="w-3.5 h-3.5 opacity-80" />
                </div>
                <span className="font-semibold text-xs leading-tight">Issue Warning</span>
              </div>
            </ThemedCard>
          )}

          {hodPermissions.canBookHRMeetings && (
            <ThemedCard
              hover
              padding="sm"
              className="cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => setShowBookHRMeeting(true)}
              style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))',
                color: 'var(--color-text-inverse)',
                minHeight: '90px'
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1.5 text-center h-full py-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-xs leading-tight">HR Meeting</span>
              </div>
            </ThemedCard>
          )}

          {hodPermissions.canReportAbsences && (
            <ThemedCard
              hover
              padding="sm"
              className="cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => setShowReportAbsence(true)}
              style={{
                background: 'linear-gradient(135deg, var(--color-error), var(--color-error))',
                color: 'var(--color-text-inverse)',
                minHeight: '90px'
              }}
            >
              <div className="flex flex-col items-center justify-center gap-1.5 text-center h-full py-2">
                <UserX className="w-5 h-5" />
                <span className="font-semibold text-xs leading-tight">Report Absence</span>
              </div>
            </ThemedCard>
          )}

          {/* Recognition Entry Button */}
          <ThemedCard
            hover
            padding="sm"
            className="cursor-pointer transition-all duration-200 active:scale-95"
            onClick={() => setShowRecognitionEntry(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              minHeight: '90px'
            }}
          >
            <div className="flex flex-col items-center justify-center gap-1 text-center h-full py-2">
              <Award className="w-5 h-5" />
              <span className="font-semibold text-xs leading-tight">Recognition</span>
              <span className="text-[10px] opacity-75 font-medium mt-0.5 px-2 py-0.5 bg-white/20 rounded">
                Under Development
              </span>
            </div>
          </ThemedCard>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-3">
          {/* Team Members */}
          <ThemedCard
            hover
            padding="md"
            className="cursor-pointer transition-all duration-200 active:scale-95"
            onClick={() => setShowEmployeeManagement(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Team Members</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          {/* Follow-ups */}
          {followUpCounts.total > 0 && (
            <ThemedCard
              hover
              padding="md"
              className="cursor-pointer transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Follow-ups</span>
                </div>
                <div className="flex items-center gap-2">
                  {followUpCounts.overdue > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                      {followUpCounts.overdue}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              </div>
            </ThemedCard>
          )}
        </div>

        {/* Daily Inspiration */}
        <QuotesSection />

        {/* Final Warnings Watch List */}
        <React.Suspense fallback={null}>
          <FinalWarningsWatchList employees={employees} />
        </React.Suspense>
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
