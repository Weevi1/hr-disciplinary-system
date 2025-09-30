// frontend/src/components/dashboard/HRDashboardSection.tsx
// 🚀 ENHANCED HR DASHBOARD - Desktop Optimized with SuperUser Design System
// ✅ Integrates with existing WarningsReviewDashboard
// ✅ Enhanced data integration and employee overview
// 🖥️ Optimized for desktop HR workflow

import React, { memo, useState } from 'react';
import { Bell, UserX, MessageCircle, AlertTriangle, RefreshCw, Clock, Archive, Settings, BookOpen, Users, TrendingUp, Shield, Building2, Plus, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHRReportsData } from '../../hooks/dashboard/useHRReportsData';
import { useEnhancedHRDashboard } from '../../hooks/dashboard/useEnhancedHRDashboard';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { useHistoricalWarningCountdown } from '../../hooks/useHistoricalWarningCountdown';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CategoryManagement } from '../admin/CategoryManagement';
import { DepartmentManagement } from '../admin/DepartmentManagement';
import WarningsReviewDashboard from '../warnings/ReviewDashboard';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { ManualWarningEntry } from '../warnings/ManualWarningEntry';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import { ThemedTabNavigation, TabItem } from '../common/ThemedTabNavigation';
import { ThemedStatusCard } from '../common/ThemedStatusCard';
import { UnifiedModal } from '../common/UnifiedModal';

// Import enhanced delivery system
import { EnhancedDeliveryWorkflow } from '../hr/EnhancedDeliveryWorkflow';

interface HRDashboardSectionProps {
  className?: string;
  isMobile?: boolean;
}

export const HRDashboardSection = memo<HRDashboardSectionProps>(({ className = '', isMobile = false }) => {
  const navigate = useNavigate();

  // 🚀 UNIFIED DASHBOARD DATA - Parallel loading for HR role
  const {
    employees,
    warnings,
    reports,
    metrics,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData,
    isReady
  } = useDashboardData({ role: 'hr' });

  // Legacy hooks for compatibility during transition
  const { hrReportsCount, hrCountsLoading, hrCountsError, refreshHRCounts, lastUpdated } = useHRReportsData();
  const { canManageCategories } = useMultiRolePermissions();

  // Auth and Organization context for manual warning entry
  const { user } = useAuth();
  const { organization, categories } = useOrganization();

  // Calculate stats from unified data
  const warningStats = {
    totalActive: warnings?.length || 0,
    undelivered: warnings?.filter(w => !w.delivered)?.length || 0,
    highSeverity: warnings?.filter(w => w.severity === 'high' || w.category?.severity === 'gross_misconduct')?.length || 0
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

  // State management
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false);
  const [showManualWarningEntry, setShowManualWarningEntry] = useState(false);
  const [activeView, setActiveView] = useState<'urgent' | 'actions' | 'warnings' | 'employees'>('urgent');
  const [selectedDeliveryNotification, setSelectedDeliveryNotification] = useState<any>(null);
  const [showDeliveryWorkflow, setShowDeliveryWorkflow] = useState(false);

  // 📅 Historical Warning 60-Day Countdown (must be after activeView state)
  const countdown = useHistoricalWarningCountdown(
    user?.uid,
    organization?.id,
    activeView === 'warnings'
  );

  // Enhanced delivery workflow handlers
  const handleStartDeliveryWorkflow = (notification: any) => {
    setSelectedDeliveryNotification(notification);
    setShowDeliveryWorkflow(true);
  };

  const handleDeliveryComplete = async (notificationId: string, proofData: any) => {
    try {
      // Update warning delivery status
      console.log('Delivery completed:', { notificationId, proofData });
      // This would typically call an API to update the delivery status

      // Close workflow
      setShowDeliveryWorkflow(false);
      setSelectedDeliveryNotification(null);

      // Refresh data
      refreshData();
    } catch (err) {
      console.error('Failed to complete delivery:', err);
    }
  };

  // Mock delivery notifications for demo (replace with real data)
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
      contactDetails: {
        email: 'john.smith@company.com',
        phone: '+27123456789'
      },
      createdAt: new Date(),
      createdByName: 'HR Manager'
    },
    {
      id: 'delivery_002',
      warningId: 'warn_124',
      employeeName: 'Jane Doe',
      warningLevel: 'Verbal Warning',
      warningCategory: 'Performance Issues',
      deliveryMethod: 'whatsapp' as const,
      priority: 'normal' as const,
      status: 'pending' as const,
      contactDetails: {
        phone: '+27987654321'
      },
      createdAt: new Date(),
      createdByName: 'Department Manager'
    }
  ];

  // 🎨 MOBILE VIEW
  if (isMobile) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>HR Command Center</h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Employee oversight & disciplinary management</p>
          </div>
          {lastUpdated && (
            <div className="text-right">
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Last updated</span>
              <br />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* 📋 ABSENCE REPORTS CARD */}
          <ThemedCard
            padding="lg"
            shadow="lg"
            hover
            onClick={() => navigate('/hr/absence-reports')}
            className="cursor-pointer relative"
            style={{
              background: 'linear-gradient(to right, var(--color-error), var(--color-error))',
              color: 'var(--color-text-inverse)'
            }}
          >
            {hrCountsLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ opacity: 0.7 }}></div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ opacity: 0.8 }}>Pending Reviews</p>
                <p className="text-2xl font-bold">{hrReportsCount.absenceReports.unread}</p>
                <div className="mt-2 text-sm" style={{ opacity: 0.8 }}>
                  {hrReportsCount.absenceReports.total} total absence reports
                </div>
              </div>
              <UserX className="w-8 h-8" style={{ opacity: 0.7 }} />
            </div>
          </ThemedCard>

          {/* 💬 HR MEETINGS CARD */}
          <ThemedCard
            padding="lg"
            shadow="lg"
            hover
            onClick={() => navigate('/hr/meeting-requests')}
            className="cursor-pointer relative"
            style={{
              background: 'linear-gradient(to right, var(--color-accent), var(--color-accent))',
              color: 'var(--color-text-inverse)'
            }}
          >
            {hrCountsLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ opacity: 0.7 }}></div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ opacity: 0.8 }}>Meeting Requests</p>
                <p className="text-2xl font-bold">{hrReportsCount.hrMeetings.unread}</p>
                <div className="mt-2 text-sm" style={{ opacity: 0.8 }}>
                  {hrReportsCount.hrMeetings.total} total requests
                </div>
              </div>
              <MessageCircle className="w-8 h-8" style={{ opacity: 0.7 }} />
            </div>
          </ThemedCard>

          {/* 📋 CORRECTIVE COUNSELLING CARD */}
          <ThemedCard
            padding="lg"
            shadow="lg"
            hover
            onClick={() => navigate('/hr/corrective-counselling')}
            className="cursor-pointer relative"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-primary))',
              color: 'var(--color-text-inverse)'
            }}
          >
            {hrCountsLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ opacity: 0.7 }}></div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ opacity: 0.8 }}>Counselling Sessions</p>
                <p className="text-2xl font-bold">{hrReportsCount.correctiveCounselling.unread}</p>
                <div className="mt-2 text-sm" style={{ opacity: 0.8 }}>
                  {hrReportsCount.correctiveCounselling.total} total records
                </div>
              </div>
              <BookOpen className="w-8 h-8" style={{ opacity: 0.7 }} />
            </div>
          </ThemedCard>

          {/* ⚠️ WARNINGS OVERVIEW CARD */}
          <ThemedCard
            padding="lg"
            shadow="lg"
            hover
            onClick={() => setActiveView('warnings')}
            className="cursor-pointer"
            style={{
              background: 'linear-gradient(to right, var(--color-warning), var(--color-warning))',
              color: 'var(--color-text-inverse)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ opacity: 0.8 }}>Active Warnings</p>
                <p className="text-2xl font-bold">{warningStats.totalActive}</p>
                <div className="mt-2 text-sm" style={{ opacity: 0.8 }}>
                  {warningStats.undelivered} undelivered, {warningStats.highSeverity} high-severity
                </div>
              </div>
              <Shield className="w-8 h-8" style={{ opacity: 0.7 }} />
            </div>
          </ThemedCard>

          {/* 👥 EMPLOYEE OVERVIEW CARD */}
          <ThemedCard
            padding="lg"
            shadow="lg"
            hover
            onClick={() => setActiveView('employees')}
            className="cursor-pointer"
            style={{
              background: 'linear-gradient(to right, var(--color-info), var(--color-info))',
              color: 'var(--color-text-inverse)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ opacity: 0.8 }}>Employee Network</p>
                <p className="text-2xl font-bold">{employeeStats.totalEmployees}</p>
                <div className="mt-2 text-sm" style={{ opacity: 0.8 }}>
                  {employeeStats.activeEmployees} active, {employeeStats.newEmployees} new this month
                </div>
              </div>
              <Users className="w-8 h-8" style={{ opacity: 0.7 }} />
            </div>
          </ThemedCard>

          {/* 🔧 CATEGORY MANAGEMENT CARD - MOBILE */}
          {canManageCategories && (
            <ThemedCard
              padding="md"
              shadow="sm"
              hover
              onClick={() => setShowCategoryManagement(true)}
              className="cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}>
                    <Settings className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text)' }}>Warning Categories</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Configure categories</div>
                  </div>
                </div>
                <ThemedBadge variant="primary" size="sm">
                  Manage
                </ThemedBadge>
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                Universal & custom category settings
              </div>
            </ThemedCard>
          )}

          {/* 📄 MANUAL WARNING ENTRY CARD - MOBILE */}
          {!countdown.isExpired && (
            <ThemedCard
              padding="md"
              shadow="sm"
              hover
              onClick={() => setShowManualWarningEntry(true)}
              className={`cursor-pointer text-left ${
                countdown.urgencyLevel === 'urgent' ? 'border-2 border-red-500' :
                countdown.urgencyLevel === 'warning' ? 'border-2 border-orange-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    countdown.urgencyLevel === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' :
                    countdown.urgencyLevel === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      countdown.urgencyLevel === 'urgent' ? 'text-red-600 dark:text-red-400' :
                      countdown.urgencyLevel === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                      'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text)' }}>Manual Warning Entry</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {countdown.daysRemaining !== null ? (
                        <span className={
                          countdown.urgencyLevel === 'urgent' ? 'text-red-600 font-semibold' :
                          countdown.urgencyLevel === 'warning' ? 'text-orange-600 font-semibold' :
                          'text-amber-600'
                        }>
                          {countdown.daysRemaining === 0 ? 'Last day!' :
                           countdown.daysRemaining === 1 ? '1 day left!' :
                           countdown.daysRemaining <= 7 ? `${countdown.daysRemaining} days left - Hurry!` :
                           `${countdown.daysRemaining} days left`}
                        </span>
                      ) : 'Enter historical warnings'}
                    </div>
                  </div>
                </div>
                <ThemedBadge
                  variant={
                    countdown.urgencyLevel === 'urgent' ? 'error' :
                    countdown.urgencyLevel === 'warning' ? 'warning' : 'warning'
                  }
                  size="sm"
                >
                  {countdown.urgencyLevel === 'urgent' ? 'Urgent!' : 'Historical'}
                </ThemedBadge>
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                Capture warnings from physical documents
              </div>
            </ThemedCard>
          )}

          {/* 🏢 DEPARTMENT MANAGEMENT CARD - MOBILE */}
          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setShowDepartmentManagement(true)}
            className="cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-accent)', opacity: 0.1 }}>
                  <Building2 className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>Department Management</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage departments</div>
                </div>
              </div>
              <ThemedBadge variant="success" size="sm">
                HR Access
              </ThemedBadge>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Create, edit, and assign department managers
            </div>
          </ThemedCard>
        </div>

        {/* Category Management Modal - Mobile */}
        {showCategoryManagement && (
          <CategoryManagement
            onClose={() => setShowCategoryManagement(false)}
            initialTab="overview"
          />
        )}

        {/* Manual Warning Entry Modal - Mobile & Desktop */}
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

        {/* Department Management Modal - Mobile & Desktop */}
        {showDepartmentManagement && organization && (
          <DepartmentManagement
            isOpen={showDepartmentManagement}
            onClose={() => setShowDepartmentManagement(false)}
            organizationId={organization.id}
          />
        )}

        {/* Enhanced Views - Mobile */}
        {activeView === 'warnings' && (
          <UnifiedModal
            isOpen={true}
            onClose={() => setActiveView('urgent')}
            title="Warnings Overview"
            subtitle="Comprehensive warnings management"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Comprehensive warnings management available on desktop.
              </p>
                <div className="space-y-3">
                  <ThemedStatusCard
                    title="Undelivered"
                    count={warningStats.undelivered}
                    subtitle="Require immediate attention"
                    variant="warning"
                    icon={<AlertTriangle className="w-4 h-4" />}
                    size="sm"
                  />
                  <ThemedStatusCard
                    title="High Priority"
                    count={warningStats.highSeverity}
                    subtitle="Final warnings & dismissals"
                    variant="error"
                    icon={<Shield className="w-4 h-4" />}
                    size="sm"
                  />
                  <ThemedStatusCard
                    title="Total Active"
                    count={warningStats.totalActive}
                    subtitle="All current warnings"
                    variant="info"
                    icon={<FileText className="w-4 h-4" />}
                    size="sm"
                  />
                </div>
            </div>
          </UnifiedModal>
        )}

        {activeView === 'employees' && (
          <UnifiedModal
            isOpen={true}
            onClose={() => setActiveView('urgent')}
            title="Employee Overview"
            subtitle="Employee statistics and management"
            size="sm"
          >
              <div className="p-4 space-y-3">
                <ThemedStatusCard
                  title="Total"
                  count={employeeStats.totalEmployees}
                  subtitle="All employees"
                  variant="info"
                  icon={<Users className="w-4 h-4" />}
                  size="sm"
                />
                <ThemedStatusCard
                  title="Active"
                  count={employeeStats.activeEmployees}
                  subtitle="Currently employed"
                  variant="success"
                  icon={<Users className="w-4 h-4" />}
                  size="sm"
                />
                <ThemedStatusCard
                  title="New"
                  count={employeeStats.newEmployees}
                  subtitle="Last 30 days"
                  variant="info"
                  icon={<Plus className="w-4 h-4" />}
                  size="sm"
                />
              </div>
          </UnifiedModal>
        )}
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW - Compact, Desktop-First Design
  return (
    <div className={`${className}`}>

      {/* Compact Overview Cards - 4 Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        {/* Compact Cards - Better space utilization */}
        <ThemedStatusCard
          title="Absence Reports"
          count={hrReportsCount.absenceReports.unread}
          total={hrReportsCount.absenceReports.total}
          icon={<UserX className="w-4 h-4" />}
          variant="error"
          gradient
          onClick={() => navigate('/hr/absence-reports')}
        />

        <ThemedStatusCard
          title="Meeting Requests"
          count={hrReportsCount.hrMeetings.unread}
          total={hrReportsCount.hrMeetings.total}
          icon={<MessageCircle className="w-4 h-4" />}
          variant="default"
          gradient
          onClick={() => navigate('/hr/meeting-requests')}
        />

        <ThemedStatusCard
          title="Counselling"
          count={hrReportsCount.correctiveCounselling.unread}
          total={hrReportsCount.correctiveCounselling.total}
          icon={<BookOpen className="w-4 h-4" />}
          variant="info"
          gradient
          onClick={() => navigate('/hr/corrective-counselling')}
        />

        <ThemedStatusCard
          title="Active Warnings"
          count={warningStats.totalActive}
          subtitle={`${warningStats.undelivered} undelivered`}
          icon={<Shield className="w-4 h-4" />}
          variant="warning"
          gradient
          onClick={() => setActiveView('warnings')}
        />
      </div>

      {/* Error Display */}
      {(hrCountsError || dashboardError) && (
        <ThemedAlert variant="error" className="mb-4">
          <div className="text-sm">
            Failed to load HR data: {hrCountsError || dashboardError}
          </div>
        </ThemedAlert>
      )}

      {/* Task-Oriented Tab Navigation */}
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
                {tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Compact Tab Content */}
        <div className="p-4">
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
                  
                  {/* Undelivered Warnings - Enhanced */}
                  {warningStats.undelivered > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <div>
                            <div className="font-semibold text-gray-900">{warningStats.undelivered} Undelivered Warnings</div>
                            <div className="text-sm text-gray-600">Warning documents pending delivery to employees</div>
                          </div>
                        </div>
                        <ThemedBadge variant="warning" size="sm">
                          Urgent
                        </ThemedBadge>
                      </div>

                      {/* Quick Action Buttons for Sample Deliveries */}
                      <div className="space-y-2">
                        {mockDeliveryNotifications.slice(0, 2).map((notification) => (
                          <div key={notification.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded text-xs ${
                                notification.deliveryMethod === 'email' ? 'bg-blue-100 text-blue-700' :
                                notification.deliveryMethod === 'whatsapp' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {notification.deliveryMethod === 'email' ? '📧' :
                                 notification.deliveryMethod === 'whatsapp' ? '📱' : '🖨️'}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{notification.employeeName}</div>
                                <div className="text-xs text-gray-500">{notification.warningLevel}</div>
                              </div>
                            </div>
                            <ThemedButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartDeliveryWorkflow(notification)}
                            >
                              Start Delivery
                            </ThemedButton>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <ThemedButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveView('warnings')}
                          className="w-full text-orange-700 hover:text-orange-800"
                        >
                          View All Undelivered Warnings
                        </ThemedButton>
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

          {/* Warnings Tab Content */}
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
          

          {/* Employees Tab Content */}
          {activeView === 'employees' && (
            <div className="space-y-4">
              <EmployeeManagement />
            </div>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Warning Categories Management</h2>
              <button
                onClick={() => setShowCategoryManagement(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <CategoryManagement onClose={() => setShowCategoryManagement(false)} />
            </div>
          </div>
        </div>
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