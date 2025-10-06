// frontend/src/components/dashboard/HRDashboardSection.tsx
// 🚀 HR DASHBOARD - UNIFIED WITH BUSINESS OWNER DASHBOARD DESIGN
// ✅ Matches Business Owner Dashboard structure: Greeting → Notifications → Tabs → Quote
// ✅ Permission-based feature visibility
// ✅ Clean, professional, consistent

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  UserX,
  MessageCircle,
  AlertTriangle,
  Shield,
  Users,
  Building2,
  BookOpen,
  Clock,
  FileText,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { useHRReportsData } from '../../hooks/dashboard/useHRReportsData';
import { useHistoricalWarningCountdown } from '../../hooks/useHistoricalWarningCountdown';
import WarningsReviewDashboard from '../warnings/ReviewDashboard';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { ManualWarningEntry } from '../warnings/ManualWarningEntry';
import { DepartmentManagement } from '../admin/DepartmentManagement';
import { EnhancedDeliveryWorkflow } from '../hr/EnhancedDeliveryWorkflow';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import { ThemedStatusCard } from '../common/ThemedStatusCard';
import Logger from '../../utils/logger';

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

interface HRDashboardSectionProps {
  className?: string;
}

export const HRDashboardSection = memo<HRDashboardSectionProps>(({
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization, categories } = useOrganization();
  const isDesktop = useBreakpoint(768);
  const [activeView, setActiveView] = useState<'urgent' | 'warnings' | 'employees' | null>(null);

  // 🚀 UNIFIED DASHBOARD DATA
  const {
    employees,
    warnings,
    metrics,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData,
    isReady
  } = useDashboardData({ role: 'hr' });

  // HR-specific reports data
  const { hrReportsCount, hrCountsLoading, hrCountsError, refreshHRCounts } = useHRReportsData();

  // State management for modals
  const [showManualWarningEntry, setShowManualWarningEntry] = useState(false);
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false);
  const [selectedDeliveryNotification, setSelectedDeliveryNotification] = useState<any>(null);
  const [showDeliveryWorkflow, setShowDeliveryWorkflow] = useState(false);

  // 📅 Historical Warning 60-Day Countdown
  const countdown = useHistoricalWarningCountdown(
    user?.uid,
    organization?.id,
    activeView === 'warnings'
  );

  // 📊 HR METRICS
  const warningStats = {
    totalActive: warnings?.length || 0,
    undelivered: warnings?.filter(w => !w.delivered && w.status !== 'expired')?.length || 0,
    highSeverity: warnings?.filter(w => (w.severity === 'high' || w.category?.severity === 'gross_misconduct') && w.status !== 'expired')?.length || 0
  };

  const employeeStats = {
    totalEmployees: employees?.length || 0,
    activeEmployees: employees?.filter(e => e.isActive !== false)?.length || 0,
    newEmployees: employees?.filter(e => {
      const created = new Date(e.createdAt || e.metadata?.createdAt || 0);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return created > thirtyDaysAgo;
    })?.length || 0
  };

  // Enhanced delivery workflow handlers
  const handleStartDeliveryWorkflow = (notification: any) => {
    setSelectedDeliveryNotification(notification);
    setShowDeliveryWorkflow(true);
  };

  const handleDeliveryComplete = async (notificationId: string, proofData: any) => {
    try {
      Logger.debug('Delivery completed:', { notificationId, proofData });
      setShowDeliveryWorkflow(false);
      setSelectedDeliveryNotification(null);
      refreshData();
    } catch (err) {
      Logger.error('Failed to complete delivery:', err);
    }
  };

  // Mock delivery notifications for demo
  const mockDeliveryNotifications = [
    {
      id: 'delivery_001',
      warningId: 'warn_123',
      employeeName: 'John Smith',
      employeeEmail: 'john.smith@company.com',
      employeePhone: '+27123456789',
      warningLevel: 'Final Written Warning',
      warningCategory: 'Attendance & Punctuality',
      deliveryMethod: 'email' as const,
      priority: 'high' as const,
      status: 'pending' as const,
      contactDetails: { email: 'john.smith@company.com', phone: '+27123456789' },
      createdAt: new Date(),
      createdByName: 'HR Manager'
    }
  ];

  // 📱 MOBILE VIEW
  if (!isDesktop) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* --- 2x2 Grid Layout matching Business Owner Dashboard --- */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => navigate('/hr/absence-reports')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-error), var(--color-error))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <UserX className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Absence Reports</span>
              {hrCountsLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              ) : (
                <span className="text-lg font-bold">{hrReportsCount.absenceReports.unread}</span>
              )}
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => navigate('/hr/meeting-requests')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">HR Meetings</span>
              {hrCountsLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              ) : (
                <span className="text-lg font-bold">{hrReportsCount.hrMeetings.unread}</span>
              )}
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => navigate('/hr/corrective-counselling')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Counselling</span>
              {hrCountsLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              ) : (
                <span className="text-lg font-bold">{hrReportsCount.correctiveCounselling.unread}</span>
              )}
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('warnings')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-warning), var(--color-warning))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Shield className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Active Warnings</span>
              <span className="text-lg font-bold">{warningStats.totalActive}</span>
            </div>
          </ThemedCard>
        </div>

        {/* Tab System - Mobile uses cards for all 3 features */}
        <div className="space-y-3">
          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('urgent')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{ minHeight: '64px', willChange: 'transform' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Urgent Tasks</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('warnings')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{ minHeight: '64px', willChange: 'transform' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Warnings</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('employees')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{ minHeight: '64px', willChange: 'transform' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Employees</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>
        </div>

        {/* Mobile Modals for each view */}
        {activeView === 'urgent' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Urgent Tasks</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="overflow-y-auto p-4">
                <div className="space-y-3">
                  <ThemedCard
                    padding="md"
                    shadow="sm"
                    hover
                    onClick={() => navigate('/hr/absence-reports')}
                    className="cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-error), var(--color-error))',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm" style={{ opacity: 0.8 }}>Absence Reports</div>
                        <div className="text-2xl font-bold">{hrReportsCount.absenceReports.unread}</div>
                      </div>
                      <UserX className="w-8 h-8" style={{ opacity: 0.7 }} />
                    </div>
                  </ThemedCard>

                  <ThemedCard
                    padding="md"
                    shadow="sm"
                    hover
                    onClick={() => navigate('/hr/meeting-requests')}
                    className="cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm" style={{ opacity: 0.8 }}>Meeting Requests</div>
                        <div className="text-2xl font-bold">{hrReportsCount.hrMeetings.unread}</div>
                      </div>
                      <MessageCircle className="w-8 h-8" style={{ opacity: 0.7 }} />
                    </div>
                  </ThemedCard>

                  <ThemedCard
                    padding="md"
                    shadow="sm"
                    hover
                    onClick={() => navigate('/hr/corrective-counselling')}
                    className="cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm" style={{ opacity: 0.8 }}>Counselling</div>
                        <div className="text-2xl font-bold">{hrReportsCount.correctiveCounselling.unread}</div>
                      </div>
                      <BookOpen className="w-8 h-8" style={{ opacity: 0.7 }} />
                    </div>
                  </ThemedCard>
                </div>
              </div>
            </ThemedCard>
          </div>
        )}

        {activeView === 'warnings' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Warnings Overview</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <WarningsReviewDashboard />
              </div>
            </ThemedCard>
          </div>
        )}

        {activeView === 'employees' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Employees</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <EmployeeManagement />
              </div>
            </ThemedCard>
          </div>
        )}
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW - Matching Business Owner Dashboard Structure
  return (
    <div className={`${className}`}>
      {/* 4 Notification Blocks - HR Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <ThemedCard
          padding="sm"
          shadow="lg"
          hover
          onClick={() => navigate('/hr/absence-reports')}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-error), var(--color-error))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <UserX className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Absence Reports</div>
              <div className="text-2xl font-bold">{hrReportsCount.absenceReports.unread}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{hrReportsCount.absenceReports.total} total</div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="lg"
          hover
          onClick={() => navigate('/hr/meeting-requests')}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Meeting Requests</div>
              <div className="text-2xl font-bold">{hrReportsCount.hrMeetings.unread}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{hrReportsCount.hrMeetings.total} total</div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="lg"
          hover
          onClick={() => navigate('/hr/corrective-counselling')}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Counselling</div>
              <div className="text-2xl font-bold">{hrReportsCount.correctiveCounselling.unread}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{hrReportsCount.correctiveCounselling.total} total</div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="lg"
          hover
          onClick={() => setActiveView('warnings')}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-warning), var(--color-warning))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Active Warnings</div>
              <div className="text-2xl font-bold">{warningStats.totalActive}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{warningStats.undelivered} undelivered</div>
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Error Display */}
      {(dashboardError || hrCountsError) && (
        <ThemedAlert variant="error" className="mb-4">
          <div className="text-sm">
            Failed to load dashboard data: {dashboardError || hrCountsError}
          </div>
        </ThemedAlert>
      )}

      {/* Tab Navigation System - Matching Business Owner Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6 px-4">
            {[
              { id: 'urgent', label: 'Urgent Tasks', icon: AlertTriangle, count: hrReportsCount.absenceReports.unread + hrReportsCount.hrMeetings.unread + warningStats.undelivered },
              { id: 'warnings', label: 'Warnings', icon: Shield },
              { id: 'employees', label: 'Employees', icon: Building2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors relative ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Urgent Tasks Tab */}
          {activeView === 'urgent' && (
            <div className="space-y-4">
              {/* Priority Tasks List */}
              <div className="bg-white rounded-lg border border-red-200 shadow-sm">
                <div className="p-4 border-b border-red-100 bg-red-50">
                  <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Urgent Tasks Requiring Immediate Attention
                  </h3>
                  <p className="text-sm text-red-700 mt-1">These items need your immediate review and action</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {/* Unread Absence Reports */}
                  {hrReportsCount.absenceReports.unread > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/hr/absence-reports')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div>
                            <div className="font-semibold text-gray-900">{hrReportsCount.absenceReports.unread} Unread Absence Reports</div>
                            <div className="text-sm text-gray-600">Employees reporting absences requiring approval</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                            {hrReportsCount.absenceReports.unread} pending
                          </span>
                          <UserX className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unread Meeting Requests */}
                  {hrReportsCount.hrMeetings.unread > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/hr/meeting-requests')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <div>
                            <div className="font-semibold text-gray-900">{hrReportsCount.hrMeetings.unread} New Meeting Requests</div>
                            <div className="text-sm text-gray-600">Employees requesting HR consultations</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                            {hrReportsCount.hrMeetings.unread} requests
                          </span>
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Undelivered Warnings */}
                  {warningStats.undelivered > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setActiveView('warnings')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <div>
                            <div className="font-semibold text-gray-900">{warningStats.undelivered} Undelivered Warnings</div>
                            <div className="text-sm text-gray-600">Warning documents pending delivery to employees</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                            Urgent
                          </span>
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* High Severity Cases */}
                  {warningStats.highSeverity > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setActiveView('warnings')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                          <div>
                            <div className="font-semibold text-gray-900">{warningStats.highSeverity} High Priority Cases</div>
                            <div className="text-sm text-gray-600">Final warnings and dismissal cases requiring oversight</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                            Critical
                          </span>
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {hrReportsCount.absenceReports.unread === 0 && hrReportsCount.hrMeetings.unread === 0 && warningStats.undelivered === 0 && warningStats.highSeverity === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="font-medium text-gray-700">All caught up!</div>
                      <div className="text-sm">No urgent tasks requiring immediate attention</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    Today's Activity
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">New Reports</span>
                      <span className="font-medium text-gray-900">{hrReportsCount.absenceReports.unread}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Meetings</span>
                      <span className="font-medium text-gray-900">{hrReportsCount.hrMeetings.unread}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Counselling</span>
                      <span className="font-medium text-gray-900">{hrReportsCount.correctiveCounselling.unread}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Team Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Employees</span>
                      <span className="font-medium text-gray-900">{employeeStats.totalEmployees}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active</span>
                      <span className="font-medium text-green-600">{employeeStats.activeEmployees}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">New This Month</span>
                      <span className="font-medium text-blue-600">{employeeStats.newEmployees}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    Warning Overview
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active</span>
                      <span className="font-medium text-gray-900">{warningStats.totalActive}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Undelivered</span>
                      <span className="font-medium text-orange-600">{warningStats.undelivered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">High Priority</span>
                      <span className="font-medium text-red-600">{warningStats.highSeverity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings Tab */}
          {activeView === 'warnings' && (
            <div className="space-y-4">
              {/* Manual Warning Entry Button with Countdown */}
              {!countdown.isExpired && (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Warnings Management</h3>
                    <p className="text-sm text-gray-600">Digital and historical warning records</p>
                  </div>
                  <ThemedButton
                    variant="outline"
                    size="md"
                    icon={FileText}
                    onClick={() => setShowManualWarningEntry(true)}
                    className={`${
                      countdown.urgencyLevel === 'urgent'
                        ? 'border-red-500 text-red-700 hover:bg-red-50 font-semibold animate-pulse'
                        : countdown.urgencyLevel === 'warning'
                        ? 'border-orange-500 text-orange-700 hover:bg-orange-50 font-semibold'
                        : 'border-amber-500 text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    {countdown.loading ? 'Enter Historical Warning' : countdown.displayText}
                  </ThemedButton>
                </div>
              )}

              {/* Compact Warnings Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{warningStats.undelivered}</div>
                      <div className="text-sm text-orange-700">Undelivered Warnings</div>
                      <div className="text-xs text-orange-600">Require immediate attention</div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{warningStats.highSeverity}</div>
                      <div className="text-sm text-red-700">High Severity</div>
                      <div className="text-xs text-red-600">Final warnings & dismissals</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{warningStats.totalActive}</div>
                      <div className="text-sm text-blue-700">Total Active</div>
                      <div className="text-xs text-blue-600">All current warnings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Warnings Dashboard - Inline */}
              <div className="bg-white rounded-lg border border-gray-200">
                <WarningsReviewDashboard />
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeView === 'employees' && (
            <div className="space-y-4">
              <EmployeeManagement />
            </div>
          )}
        </div>
      </div>

      {/* Manual Warning Entry Modal */}
      {showManualWarningEntry && user && organization && (
        <ManualWarningEntry
          isOpen={showManualWarningEntry}
          onClose={() => setShowManualWarningEntry(false)}
          onSuccess={() => {
            setShowManualWarningEntry(false);
            refreshData();
          }}
          employees={employees || []}
          categories={categories || []}
          currentUserId={user.uid}
          organizationId={organization.id}
        />
      )}

      {/* Department Management Modal */}
      {showDepartmentManagement && organization && (
        <DepartmentManagement
          isOpen={showDepartmentManagement}
          onClose={() => setShowDepartmentManagement(false)}
          organizationId={organization.id}
        />
      )}

      {/* Enhanced Delivery Workflow Modal */}
      {showDeliveryWorkflow && selectedDeliveryNotification && (
        <EnhancedDeliveryWorkflow
          isOpen={showDeliveryWorkflow}
          notification={selectedDeliveryNotification}
          onDeliveryComplete={handleDeliveryComplete}
          onClose={() => {
            setShowDeliveryWorkflow(false);
            setSelectedDeliveryNotification(null);
          }}
        />
      )}
    </div>
  );
});

HRDashboardSection.displayName = 'HRDashboardSection';
