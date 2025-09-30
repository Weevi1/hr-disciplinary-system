// frontend/src/components/dashboard/BusinessOwnerDashboardSection.tsx
// 👑 BUSINESS OWNER DASHBOARD - UNIFIED WITH HR DASHBOARD DESIGN
// ✅ Matches HR Dashboard structure: Greeting → Notifications → Tabs → Quote
// ✅ Permission-based feature visibility
// ✅ Clean, professional, consistent

import React, { memo, useState } from 'react';
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

// Import unified dashboard styles
import './dashboard-cards.css';

interface BusinessOwnerDashboardSectionProps {
  className?: string;
  isMobile?: boolean;
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
  className = '',
  isMobile = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [activeView, setActiveView] = useState<'organization' | 'departments' | 'categories' | 'employees' | 'warnings'>('organization');

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
  if (isMobile) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Notification Blocks */}
        <div className="grid grid-cols-1 gap-3">
          <ThemedStatusCard
            title="Total Employees"
            count={executiveMetrics.totalEmployees}
            icon={<Users className="w-4 h-4" />}
            variant="success"
            gradient
            onClick={() => setActiveView('employees')}
          />

          <ThemedStatusCard
            title="Active Warnings"
            count={executiveMetrics.activeWarnings}
            subtitle={`${executiveMetrics.undeliveredWarnings} undelivered`}
            icon={<AlertTriangle className="w-4 h-4" />}
            variant="warning"
            gradient
            onClick={() => setActiveView('warnings')}
          />

          <ThemedStatusCard
            title="High Priority Cases"
            count={executiveMetrics.highSeverityWarnings}
            subtitle="Require oversight"
            icon={<Shield className="w-4 h-4" />}
            variant="error"
            gradient
            onClick={() => setActiveView('warnings')}
          />
        </div>

        {/* Tab System - Mobile uses cards instead */}
        <div className="space-y-3">
          <ThemedCard padding="md" shadow="sm" hover onClick={() => setActiveView('organization')} className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Organization Management</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard padding="md" shadow="sm" hover onClick={() => setActiveView('employees')} className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Employee Management</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard padding="md" shadow="sm" hover onClick={() => navigate('/users')} className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>User Management</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>
        </div>
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW - Matching HR Dashboard Structure
  return (
    <div className={`${className}`}>
      {/* 4 Notification Blocks - Executive Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <ThemedStatusCard
          title="Total Employees"
          count={executiveMetrics.totalEmployees}
          icon={<Users className="w-4 h-4" />}
          variant="success"
          gradient
          onClick={() => setActiveView('employees')}
        />

        <ThemedStatusCard
          title="Active Warnings"
          count={executiveMetrics.activeWarnings}
          subtitle={`${executiveMetrics.undeliveredWarnings} undelivered`}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="warning"
          gradient
          onClick={() => setActiveView('warnings')}
        />

        <ThemedStatusCard
          title="High Priority"
          count={executiveMetrics.highSeverityWarnings}
          subtitle="Critical cases"
          icon={<Shield className="w-4 h-4" />}
          variant="error"
          gradient
          onClick={() => setActiveView('warnings')}
        />

        <ThemedStatusCard
          title="Departments"
          count={metrics?.departmentCount || 0}
          icon={<Building2 className="w-4 h-4" />}
          variant="default"
          gradient
          onClick={() => setActiveView('departments')}
        />
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

      {/* Inspirational Quote - Matching HR Dashboard Bottom Section */}
      <ThemedCard padding="lg" className="mt-6 border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
        <div className="flex items-start gap-4">
          <Crown className="w-8 h-8 mt-1" style={{ color: 'var(--color-primary)', opacity: 0.3 }} />
          <div>
            <p className="text-base italic mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              "{dailyQuote.text}"
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
              — {dailyQuote.author}
            </p>
          </div>
        </div>
      </ThemedCard>
    </div>
  );
});

BusinessOwnerDashboardSection.displayName = 'BusinessOwnerDashboardSection';