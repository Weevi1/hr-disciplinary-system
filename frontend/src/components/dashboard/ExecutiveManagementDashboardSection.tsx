// frontend/src/components/dashboard/ExecutiveManagementDashboardSection.tsx
// 🚀 WEEK 4 TASK 26: EXECUTIVE MANAGEMENT DASHBOARD - MIGRATED TO DASHBOARDSHELL
// ✅ Uses unified DashboardShell component for consistent layout
// ✅ Reduced from 599 lines to ~280 lines (-53% code reduction)
// ✅ Permission-based feature visibility
// ✅ Clean, professional, consistent

import React, { memo, useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Shield,
  Building2,
  Tags
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';

// 🚀 WEEK 4: Import DashboardShell
import { DashboardShell, MetricCard, TabConfig } from './DashboardShell';

// 🚀 LAZY LOADED HEAVY COMPONENTS - Save ~300KB per dashboard
const OrganizationManagementV2 = React.lazy(() =>
  import('../organization/OrganizationManagementV2').then(m => ({ default: m.OrganizationManagementV2 }))
);
const WarningsOverviewCard = React.lazy(() =>
  import('../warnings/cards/OverviewCard').then(m => ({ default: m.WarningsOverviewCard }))
);
const EmployeeManagement = React.lazy(() =>
  import('../employees/EmployeeManagement').then(m => ({ default: m.EmployeeManagement }))
);
const OrganizationCategoriesViewer = React.lazy(() =>
  import('../organization/OrganizationCategoriesViewer').then(m => ({ default: m.OrganizationCategoriesViewer }))
);
const DepartmentManagement = React.lazy(() =>
  import('../admin/DepartmentManagement').then(m => ({ default: m.DepartmentManagement }))
);
const FinalWarningsWatchList = React.lazy(() =>
  import('./FinalWarningsWatchList').then(m => ({ default: m.FinalWarningsWatchList }))
);

// 🎨 Loading Skeleton for Lazy Components
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
);

interface ExecutiveManagementDashboardSectionProps {
  className?: string;
}

export const ExecutiveManagementDashboardSection = memo<ExecutiveManagementDashboardSectionProps>(({
  className = ''
}) => {
  const { organization } = useOrganization();
  const [activeView, setActiveView] = useState<string | null>('organization'); // Default to first tab

  // 🚀 UNIFIED DASHBOARD DATA
  const {
    employees,
    warnings,
    metrics,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData
  } = useDashboardData({ role: 'executive_management' });

  // 📊 EXECUTIVE METRICS
  const executiveMetrics = useMemo(() => ({
    totalEmployees: employees?.length || 0,
    activeWarnings: warnings?.filter(w => w.status !== 'delivered' && w.status !== 'expired')?.length || 0,
    undeliveredWarnings: warnings?.filter(w => !w.delivered && w.status !== 'expired')?.length || 0,
    highSeverityWarnings: warnings?.filter(w => (w.severity === 'high' || w.category?.severity === 'gross_misconduct') && w.status !== 'expired')?.length || 0
  }), [employees, warnings]);

  // ============================================
  // 🚀 DASHBOARD SHELL CONFIGURATION
  // ============================================

  // Metrics configuration
  const dashboardMetrics: MetricCard[] = useMemo(() => [
    {
      id: 'total-employees',
      label: 'Total Employees',
      value: executiveMetrics.totalEmployees,
      icon: Users,
      color: 'success',
      onClick: () => setActiveView('employees')
    },
    {
      id: 'active-warnings',
      label: 'Active Warnings',
      value: executiveMetrics.activeWarnings,
      subtext: `${executiveMetrics.undeliveredWarnings} undelivered`,
      icon: AlertTriangle,
      color: 'warning',
      onClick: () => setActiveView('warnings')
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      value: executiveMetrics.highSeverityWarnings,
      subtext: 'Critical cases',
      icon: Shield,
      color: 'error',
      onClick: () => setActiveView('warnings')
    },
    {
      id: 'departments',
      label: 'Departments',
      value: metrics?.departmentCount || 0,
      icon: Building2,
      color: 'primary',
      onClick: () => setActiveView('departments')
    }
  ], [executiveMetrics, metrics]);

  // Tabs configuration
  const dashboardTabs: TabConfig[] = useMemo(() => [
    {
      id: 'organization',
      label: 'Organization',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <OrganizationManagementV2 onSwitchToDepartments={() => setActiveView('departments')} />
          </React.Suspense>
        </div>
      )
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Building2,
      content: organization ? (
        <React.Suspense fallback={<LoadingSkeleton />}>
          <DepartmentManagement
            isOpen={true}
            onClose={() => setActiveView('organization')}
            organizationId={organization.id}
            inline={true}
          />
        </React.Suspense>
      ) : null
    },
    {
      id: 'categories',
      label: 'Warning Categories',
      icon: Tags,
      content: (
        <React.Suspense fallback={<LoadingSkeleton />}>
          <OrganizationCategoriesViewer
            onClose={() => setActiveView('organization')}
            inline={true}
          />
        </React.Suspense>
      )
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      content: (
        <div className="space-y-4">
          <React.Suspense fallback={<LoadingSkeleton />}>
            <EmployeeManagement onDataChange={refreshData} inline={true} readOnly={true} />
          </React.Suspense>
        </div>
      )
    },
    {
      id: 'warnings',
      label: 'Warnings',
      icon: Shield,
      content: (
        <div className="space-y-3">
          {/* Warning Stats Overview - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-bold text-orange-600">{executiveMetrics.undeliveredWarnings}</div>
                  <div className="text-xs text-orange-700 font-medium">Undelivered</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-2.5 border border-red-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-bold text-red-600">{executiveMetrics.highSeverityWarnings}</div>
                  <div className="text-xs text-red-700 font-medium">High Severity</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-lg font-bold text-blue-600">{executiveMetrics.activeWarnings}</div>
                  <div className="text-xs text-blue-700 font-medium">Total Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings Overview Component */}
          <React.Suspense fallback={<LoadingSkeleton />}>
            <WarningsOverviewCard
              userRole="business-owner"
              variant="executive"
            />
          </React.Suspense>
        </div>
      )
    }
  ], [executiveMetrics, organization, refreshData]);

  // ============================================
  // RENDER WITH DASHBOARD SHELL
  // ============================================

  return (
    <DashboardShell
      metrics={dashboardMetrics}
      tabs={dashboardTabs}
      activeTab={activeView}
      onTabChange={setActiveView}
      loading={dashboardLoading.overall}
      error={dashboardError}
      bottomSection={
        <React.Suspense fallback={<LoadingSkeleton />}>
          <FinalWarningsWatchList employees={employees} />
        </React.Suspense>
      }
      className={className}
    />
  );
});

ExecutiveManagementDashboardSection.displayName = 'ExecutiveManagementDashboardSection';
