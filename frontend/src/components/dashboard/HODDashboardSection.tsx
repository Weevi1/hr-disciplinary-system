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
  BookOpen // NEW: Corrective Counselling icon
} from 'lucide-react';

// Import enhanced warning wizard (now includes audio consent)
import { EnhancedWarningWizard } from '../warnings/enhanced/EnhancedWarningWizard';

// Import corrective counselling modal
import { CorrectiveCounselling } from '../counselling/CorrectiveCounselling';
import { CounsellingFollowUp } from '../counselling/CounsellingFollowUp';

// Import hooks and services
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { API } from '../../api';
import { DataServiceV2 } from '../../services/DataServiceV2';

// Import employee management
import { EmployeeManagement } from '../employees/EmployeeManagement';

// Import skeleton components for progressive loading
import { SkeletonCard, SkeletonStats } from '../common/SkeletonLoader';

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
    isReady
  } = useDashboardData({ role: 'hod' });

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
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedFollowUpSession, setSelectedFollowUpSession] = useState<any>(null);

  // Final Warnings Watch List State
  const [finalWarningEmployees, setFinalWarningEmployees] = useState<any[]>([]);
  const [loadingFinalWarnings, setLoadingFinalWarnings] = useState(false);
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
      console.log('✅ [HOD] Context ready:', {
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

    console.log('🎯 Opening warning wizard with integrated audio consent...');

    // 🚀 OPTIMIZED: Data is already loaded via useDashboardData hook
    // Check if data is ready from unified hook
    if (isReady && employees.length > 0 && categories.length > 0) {
      setShowWarningWizard(true);
    } else {
      console.error('❌ Cannot open wizard: data not ready', {
        isReady,
        employees: employees.length,
        categories: categories.length,
        loading: dashboardLoading.overall
      });
    }
  }, [canCreateWarnings, isReady, employees.length, categories.length, dashboardLoading]);

  // Audio consent handling is now integrated into the wizard

  const handleWarningWizardComplete = useCallback(() => {
    console.log('✅ Warning wizard completed');
    setShowWarningWizard(false);
  }, []);

  const handleWarningWizardCancel = useCallback(() => {
    console.log('❌ Warning wizard cancelled');
    setShowWarningWizard(false);
  }, []);

  const handleOpenCorrectiveCounselling = useCallback(() => {
    console.log('📋 Opening corrective counselling modal');
    setShowCorrectiveCounselling(true);
  }, []);

  const handleCorrectiveCounsellingClose = useCallback(() => {
    console.log('❌ Corrective counselling modal closed');
    setShowCorrectiveCounselling(false);
  }, []);


  // ============================================
  // COUNSELLING FOLLOW-UP HANDLERS
  // ============================================

  const handleOpenFollowUp = useCallback((session: any) => {
    console.log('📅 Opening follow-up for session:', session.id);
    setSelectedFollowUpSession(session);
    setShowFollowUpModal(true);
  }, []);

  const handleFollowUpClose = useCallback(() => {
    console.log('❌ Follow-up modal closed');
    setShowFollowUpModal(false);
    setSelectedFollowUpSession(null);
  }, []);

  const handleFollowUpComplete = useCallback(() => {
    console.log('✅ Follow-up completed');
    setShowFollowUpModal(false);
    setSelectedFollowUpSession(null);
    // Refresh follow-ups data would happen automatically via the hook
  }, []);

  // ============================================
  // FINAL WARNINGS WATCH LIST
  // ============================================

  const fetchFinalWarningEmployees = useCallback(async () => {
    if (!organization?.id || loadingFinalWarnings) return;

    setLoadingFinalWarnings(true);
    try {
      const warnings = await API.warnings.getActiveWarnings(organization.id);

      // Filter for final written warnings and group by employee
      const finalWarnings = warnings.filter((warning: any) => warning.level === 'final_written');
      const employeesWithFinal = finalWarnings.reduce((acc: any[], warning: any) => {
        const existing = acc.find(emp => emp.employeeId === warning.employeeId);
        if (existing) {
          existing.warnings.push(warning);
        } else {
          const employee = employees.find(emp => emp.id === warning.employeeId);
          if (employee) {
            acc.push({
              ...employee,
              employeeId: warning.employeeId,
              warnings: [warning],
              latestFinalWarning: warning
            });
          }
        }
        return acc;
      }, []);

      // Sort by most recent final warning
      employeesWithFinal.sort((a, b) =>
        new Date(b.latestFinalWarning.issueDate).getTime() -
        new Date(a.latestFinalWarning.issueDate).getTime()
      );

      setFinalWarningEmployees(employeesWithFinal);
    } catch (error) {
      console.error('Failed to fetch final warning employees:', error);
    } finally {
      setLoadingFinalWarnings(false);
    }
  }, [organization?.id, employees, loadingFinalWarnings]);

  // Fetch final warning employees when dashboard loads
  useEffect(() => {
    if (isReady && employees.length > 0) {
      fetchFinalWarningEmployees();
    }
  }, [isReady, employees.length, fetchFinalWarningEmployees]);

  // ============================================
  // TOOL ACTIONS CONFIGURATION
  // ============================================
  
  // 🎯 UPDATED: Issue Warning action now shows consent modal
  const toolActions = [
    {
      id: 'create-warning',
      title: 'Issue Warning',
      icon: AlertTriangle,
      color: 'orange',
      action: handleIssueWarning, // Updated to show consent modal
      enabled: canCreateWarnings(),
      hasAudioRecording: true // NEW: Flag for audio recording
    },
    {
      id: 'book-hr-meeting',
      title: 'HR Meeting',
      icon: MessageCircle,
      color: 'purple',
      action: () => navigate('/book-hr-meeting'),
      enabled: true,
      hasAudioRecording: false
    },
    {
      id: 'report-absence',
      title: 'Report Absence',
      icon: UserX,
      color: 'red',
      action: () => navigate('/report-absence'),
      enabled: true,
      hasAudioRecording: false
    },
    {
      id: 'corrective-counselling',
      title: 'Counselling',
      icon: BookOpen,
      color: 'blue',
      action: handleOpenCorrectiveCounselling,
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
        {/* --- Compact Section Header --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">HOD Dashboard</h3>
            <div className="text-sm text-gray-500">Department management tools</div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
            Head of Department
          </span>
        </div>

        {/* 🎯 Compact Audio Notice */}
        {canCreateWarnings() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-900 font-medium">Warning processes include audio recording</span>
              <span className="text-xs text-blue-700">(consent required)</span>
            </div>
          </div>
        )}

        {/* --- Compact Tools Grid --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {toolActions.map((tool) => (
            <button 
              key={tool.id} 
              onClick={tool.action}
              disabled={tool.id === 'create-warning' && (dashboardLoading.overall || dashboardLoading.employees)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 ${getToolButtonColorClasses(tool.color)} ${
                (dashboardLoading.overall || dashboardLoading.employees) && tool.id === 'create-warning' ? 'opacity-50 cursor-not-allowed' : ''
              } hover:shadow-md`}
            >
              <tool.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tool.title}</span>
              {tool.hasAudioRecording && <Mic className="w-3 h-3 opacity-60" />}
              {(dashboardLoading.overall || dashboardLoading.employees) && tool.id === 'create-warning' && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              )}
            </button>
          ))}
        </div>

        {/* --- Follow-up Section --- */}
        {followUpCounts.total > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-orange-600" />
              Follow-ups Due ({followUpCounts.due})
            </h4>
            <div className="space-y-2">
              {dueFollowUps.slice(0, 3).map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleOpenFollowUp(session)}
                  className="w-full text-left p-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all text-sm"
                >
                  <div className="font-medium text-gray-900">{session.employeeName}</div>
                  <div className="text-xs text-gray-600">{session.sessionType}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- 🚨 Final Warnings Watch List --- */}
        {finalWarningEmployees.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-sm p-4">
            <h4 className="text-sm font-semibold text-red-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Final Warnings Watch List ({finalWarningEmployees.length})
              <span className="px-2 py-0.5 bg-red-200 text-red-700 text-xs rounded-full animate-pulse">
                MONITOR CLOSELY
              </span>
            </h4>
            <div className="space-y-2">
              {finalWarningEmployees.slice(0, 4).map((employee) => {
                const daysSince = Math.floor(
                  (Date.now() - new Date(employee.latestFinalWarning.issueDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={employee.employeeId}
                    className="w-full p-3 bg-white border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-red-900">{employee.name}</div>
                        <div className="text-xs text-red-700">
                          {employee.latestFinalWarning.category} • {daysSince} days ago
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ Next offense requires HR intervention
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-red-800 bg-red-100 px-2 py-1 rounded">
                          {employee.warnings.length} warning{employee.warnings.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {finalWarningEmployees.length > 4 && (
                <div className="text-xs text-red-600 text-center py-2">
                  +{finalWarningEmployees.length - 4} more employees with final warnings
                </div>
              )}
            </div>
            <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
              💡 <strong>Tip:</strong> Monitor these employees closely. Any new offenses will trigger urgent HR intervention alerts.
            </div>
          </div>
        )}

        {loadingFinalWarnings && (
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <span className="text-sm text-gray-600">Loading final warnings watch list...</span>
            </div>
          </div>
        )}

        {/* --- Team Overview --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <button 
            onClick={() => setShowEmployeeManagement(true)}
            className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-900">Team Members</span>
            </div>
            <span className="text-lg font-bold text-emerald-600">
              {dashboardLoading.employees ? (
                <div className="animate-pulse h-6 w-8 bg-emerald-200 rounded"></div>
              ) : (
                employees.length
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Audio consent is now integrated into the wizard as first step */}

      {/* Enhanced Warning Wizard - Conditional rendering with stable props */}
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

      {/* Corrective Counselling Modal */}
      {showCorrectiveCounselling && (
        <CorrectiveCounselling onClose={handleCorrectiveCounsellingClose} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
              <button
                onClick={() => setShowEmployeeManagement(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto">
              <EmployeeManagement />
            </div>
          </div>
        </div>
      )}

    </>
  );
});

HODDashboardSection.displayName = 'HODDashboardSection';

