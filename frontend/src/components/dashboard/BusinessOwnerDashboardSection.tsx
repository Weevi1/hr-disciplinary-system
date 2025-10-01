// frontend/src/components/dashboard/BusinessOwnerDashboardSection.tsx
// 👑 BUSINESS OWNER DASHBOARD - UNIFIED WITH HR DASHBOARD DESIGN
// ✅ Matches HR Dashboard structure: Greeting → Notifications → Tabs → Quote
// ✅ Permission-based feature visibility
// ✅ Clean, professional, consistent

import React, { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Building2,
  Users,
  Shield,
  AlertTriangle,
  Tags,
  DollarSign,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { OrganizationManagementV2 } from '../organization/OrganizationManagementV2';
import { WarningsOverviewCard } from '../warnings/cards/OverviewCard';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { OrganizationCategoriesViewer } from '../organization/OrganizationCategoriesViewer';
import { DepartmentManagement } from '../admin/DepartmentManagement';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import { ThemedStatusCard } from '../common/ThemedStatusCard';

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

interface BusinessOwnerDashboardSectionProps {
  className?: string;
}

const inspirationalQuotes = [
  { text: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "The growth and development of people is the highest calling of leadership.", author: "Harvey S. Firestone" },
  { text: "Great leaders don't set out to be a leader... They set out to make a difference.", author: "Jeremy Bravo" },
  { text: "A good leader takes a little more than his share of the blame, a little less than his share of the credit.", author: "Arnold H. Glasow" },
  { text: "The task of leadership is not to put greatness into people, but to elicit it, for the greatness is there already.", author: "John Buchan" },
  { text: "People buy into the leader before they buy into the vision.", author: "John Maxwell" },
  { text: "Leadership is about making others better as a result of your presence and making sure that impact lasts in your absence.", author: "Sheryl Sandberg" }
];

export const BusinessOwnerDashboardSection = memo<BusinessOwnerDashboardSectionProps>(({
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const isDesktop = useBreakpoint(768);
  const [activeView, setActiveView] = useState<'organization' | 'departments' | 'categories' | 'employees' | 'warnings' | null>(null);

  // 🚀 UNIFIED DASHBOARD DATA
  const {
    employees,
    warnings,
    metrics,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData,
    isReady
  } = useDashboardData({ role: 'business_owner' });

  // 📊 EXECUTIVE METRICS
  const executiveMetrics = {
    totalEmployees: employees?.length || 0,
    activeWarnings: warnings?.filter(w => w.status !== 'delivered' && w.status !== 'expired')?.length || 0,
    undeliveredWarnings: warnings?.filter(w => !w.delivered && w.status !== 'expired')?.length || 0,
    highSeverityWarnings: warnings?.filter(w => (w.severity === 'high' || w.category?.severity === 'gross_misconduct') && w.status !== 'expired')?.length || 0
  };

  // Random quote selection (consistent per session)
  const [dailyQuote] = useState(() => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);

  // 📱 MOBILE VIEW
  if (!isDesktop) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* --- 2x2 Grid Layout matching HOD Dashboard --- */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('employees')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-success), var(--color-success))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Users className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Total Employees</span>
              <span className="text-lg font-bold">{executiveMetrics.totalEmployees}</span>
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
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Active Warnings</span>
              <span className="text-lg font-bold">{executiveMetrics.activeWarnings}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('warnings')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-error), var(--color-error))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Shield className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">High Priority</span>
              <span className="text-lg font-bold">{executiveMetrics.highSeverityWarnings}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('departments')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
              color: 'var(--color-text-inverse)',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Building2 className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Departments</span>
              <span className="text-lg font-bold">{metrics?.departmentCount || 0}</span>
            </div>
          </ThemedCard>
        </div>

        {/* Tab System - Mobile uses cards for all 5 features */}
        <div className="space-y-3">
          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('organization')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{ minHeight: '64px', willChange: 'transform' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Organization</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('departments')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{ minHeight: '64px', willChange: 'transform' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Departments</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('categories')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{ minHeight: '64px', willChange: 'transform' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tags className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Warning Categories</span>
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
                <Users className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Employees</span>
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
                <Shield className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Warnings</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>
        </div>

        {/* Mobile Modals for each view */}
        {activeView === 'organization' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Organization</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="overflow-y-auto p-4">
                <OrganizationManagementV2 />
              </div>
            </ThemedCard>
          </div>
        )}

        {activeView === 'departments' && organization && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Departments</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="overflow-y-auto">
                <DepartmentManagement isOpen={true} onClose={() => setActiveView(null)} organizationId={organization.id} inline={true} />
              </div>
            </ThemedCard>
          </div>
        )}

        {activeView === 'categories' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Warning Categories</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="overflow-y-auto p-4">
                <OrganizationCategoriesViewer onClose={() => setActiveView(null)} inline={true} />
              </div>
            </ThemedCard>
          </div>
        )}

        {activeView === 'employees' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Employees</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="overflow-y-auto">
                <EmployeeManagement />
              </div>
            </ThemedCard>
          </div>
        )}

        {activeView === 'warnings' && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
            <ThemedCard padding="none" className="max-w-7xl w-full max-h-[90vh] overflow-hidden" shadow="xl">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Warnings Overview</h2>
                <ThemedButton variant="ghost" size="sm" onClick={() => setActiveView(null)}>×</ThemedButton>
              </div>
              <div className="overflow-y-auto p-4">
                <WarningsOverviewCard userRole="business-owner" variant="executive" />
              </div>
            </ThemedCard>
          </div>
        )}
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW - Matching HR Dashboard Structure
  return (
    <div className={`${className}`}>
      {/* 4 Notification Blocks - Executive Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <ThemedCard
          padding="sm"
          shadow="lg"
          hover
          onClick={() => setActiveView('employees')}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-success), var(--color-success))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Total Employees</div>
              <div className="text-2xl font-bold">{executiveMetrics.totalEmployees}</div>
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
            <AlertTriangle className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Active Warnings</div>
              <div className="text-2xl font-bold">{executiveMetrics.activeWarnings}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.8 }}>{executiveMetrics.undeliveredWarnings} undelivered</div>
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
            background: 'linear-gradient(135deg, var(--color-error), var(--color-error))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>High Priority</div>
              <div className="text-2xl font-bold">{executiveMetrics.highSeverityWarnings}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.8 }}>Critical cases</div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="lg"
          hover
          onClick={() => setActiveView('departments')}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
            color: 'var(--color-text-inverse)',
            minHeight: '80px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ opacity: 0.8 }}>Departments</div>
              <div className="text-2xl font-bold">{metrics?.departmentCount || 0}</div>
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Error Display */}
      {dashboardError && (
        <ThemedAlert variant="error" className="mb-4">
          <div className="text-sm">
            Failed to load dashboard data: {dashboardError}
          </div>
        </ThemedAlert>
      )}

      {/* Tab Navigation System - Matching HR Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6 px-4">
            {[
              { id: 'organization', label: 'Organization', icon: Building2 },
              { id: 'departments', label: 'Departments', icon: Building2 },
              { id: 'categories', label: 'Warning Categories', icon: Tags },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'warnings', label: 'Warnings', icon: Shield }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Organization Tab */}
          {activeView === 'organization' && (
            <div className="space-y-4">
              <OrganizationManagementV2 />
            </div>
          )}

          {/* Departments Tab */}
          {activeView === 'departments' && organization && (
            <DepartmentManagement
              isOpen={true}
              onClose={() => setActiveView('organization')}
              organizationId={organization.id}
              inline={true}
            />
          )}

          {/* Categories Tab */}
          {activeView === 'categories' && (
            <OrganizationCategoriesViewer
              onClose={() => setActiveView('organization')}
              inline={true}
            />
          )}

          {/* Employees Tab */}
          {activeView === 'employees' && (
            <div className="space-y-4">
              <EmployeeManagement />
            </div>
          )}

          {/* Warnings Tab */}
          {activeView === 'warnings' && (
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
              <WarningsOverviewCard
                userRole="business-owner"
                variant="executive"
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
});

BusinessOwnerDashboardSection.displayName = 'BusinessOwnerDashboardSection';