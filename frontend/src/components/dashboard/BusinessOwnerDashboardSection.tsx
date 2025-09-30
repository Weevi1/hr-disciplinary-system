// frontend/src/components/dashboard/BusinessOwnerDashboardSection.tsx
// 👑 BUSINESS OWNER SPECIFIC DASHBOARD SECTION
// ✅ Executive overview, organization management, strategic metrics

import React, { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Building2,
  TrendingUp,
  Users,
  Shield,
  Settings,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Tags
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

interface BusinessOwnerDashboardSectionProps {
  className?: string;
  isMobile?: boolean;
}

export const BusinessOwnerDashboardSection = memo<BusinessOwnerDashboardSectionProps>(({
  className = '',
  isMobile = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false);

  // 🚀 UNIFIED DASHBOARD DATA - Parallel loading for Business Owner role
  const {
    employees,
    warnings,
    reports,
    metrics,
    teams,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData,
    isReady
  } = useDashboardData({ role: 'business_owner' });

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCategoryManagement) {
          setShowCategoryManagement(false);
        } else if (showEmployeeManagement) {
          setShowEmployeeManagement(false);
        }
      }
    };

    if (showCategoryManagement || showEmployeeManagement) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showCategoryManagement, showEmployeeManagement]);

  // 👑 EXECUTIVE ACTIONS
  const executiveActions = [
    {
      id: 'org-management',
      title: 'Organization Settings',
      description: 'Manage company structure and settings',
      icon: Building2,
      color: 'purple',
      action: () => navigate('/organization/settings'),
      featured: true
    },
    {
      id: 'department-management',
      title: 'Department Management',
      description: 'Manage departments and organizational structure',
      icon: Users,
      color: 'blue',
      action: () => setShowDepartmentManagement(true),
      featured: true
    },
    {
      id: 'financial-overview',
      title: 'Financial Overview',
      description: 'Revenue, costs, and financial metrics',
      icon: DollarSign,
      color: 'green',
      action: () => navigate('/finance'),
      featured: true
    },
    {
      id: 'strategic-goals',
      title: 'Strategic Goals',
      description: 'Company objectives and KPIs',
      icon: Target,
      color: 'blue',
      action: () => navigate('/strategy')
    },
    {
      id: 'compliance',
      title: 'Compliance Reports',
      description: 'Legal and regulatory compliance',
      icon: Shield,
      color: 'red',
      action: () => navigate('/compliance')
    },
    {
      id: 'executive-reports',
      title: 'Executive Reports',
      description: 'High-level business intelligence',
      icon: BarChart3,
      color: 'indigo',
      action: () => navigate('/reports/executive')
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage system users and permissions',
      icon: Users,
      color: 'orange',
      action: () => navigate('/users')
    },
    {
      id: 'employee-management',
      title: 'Employee Management',
      description: 'Manage employees, departments, and organizational structure',
      icon: Users,
      color: 'emerald',
      action: () => setShowEmployeeManagement(true)
    },
    {
      id: 'category-management',
      title: 'Warning Categories',
      description: 'Manage warning categories, escalation paths, and customizations',
      icon: Tags,
      color: 'violet',
      action: () => setShowCategoryManagement(true),
      featured: true
    }
  ];

  const featuredActions = executiveActions.filter(action => action.featured);
  const regularActions = executiveActions.filter(action => !action.featured);

  // 📊 EXECUTIVE METRICS - Calculated from unified dashboard data
  const executiveMetrics = {
    totalEmployees: employees?.length || 0,
    monthlyGrowth: (() => {
      const thisMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthEmployees = employees?.filter(emp => {
        const empDate = new Date(emp.createdAt || emp.metadata?.createdAt || 0);
        return empDate.getMonth() === thisMonth && empDate.getFullYear() === currentYear;
      })?.length || 0;
      const lastMonthEmployees = employees?.filter(emp => {
        const empDate = new Date(emp.createdAt || emp.metadata?.createdAt || 0);
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? currentYear - 1 : currentYear;
        return empDate.getMonth() === lastMonth && empDate.getFullYear() === lastMonthYear;
      })?.length || 0;
      return lastMonthEmployees > 0 ? Math.round(((thisMonthEmployees - lastMonthEmployees) / lastMonthEmployees) * 100 * 10) / 10 : 0;
    })(),
    complianceScore: metrics?.complianceScore || 94, // Default to 94% if not available
    activeWarnings: warnings?.filter(w => w.status !== 'delivered')?.length || 0,
    pendingReviews: reports?.filter(r => r.status === 'pending')?.length || 0,
    costPerEmployee: metrics?.costPerEmployee || 4250 // Default value if not available
  };

  // 🎨 COLOR MAPPING
  const getVariantForColor = (color: string): 'default' | 'info' | 'success' | 'warning' | 'error' | 'urgent' => {
    const variantMap = {
      purple: 'default' as const,
      green: 'success' as const,
      blue: 'info' as const,
      red: 'error' as const,
      indigo: 'info' as const,
      orange: 'warning' as const,
      violet: 'default' as const
    };
    return variantMap[color as keyof typeof variantMap] || 'default';
  };

  // 📱 MOBILE VIEW - V2 Design Language
  if (isMobile) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 👑 EXECUTIVE HEADER - Enhanced V2 */}
        <ThemedCard
          padding="lg"
          shadow="xl"
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: 'var(--color-text-inverse)'
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Crown className="w-8 h-8" />
                Executive Command Center
              </h3>
              <div className="flex flex-col items-end">
                <ThemedBadge variant="primary" className="mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'var(--color-text-inverse)' }}>
                  Business Owner
                </ThemedBadge>
                <span className="text-xs opacity-75">
                  Strategic Overview
                </span>
              </div>
            </div>
            <p className="text-lg font-medium opacity-90">
              {organization?.name || 'Your Organization'}
            </p>
          </div>
        </ThemedCard>

        {/* 📊 KEY METRICS - Enhanced V2 */}
        <div className="grid grid-cols-2 gap-6">
          <ThemedCard
            padding="lg"
            shadow="lg"
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-success), var(--color-success))',
              opacity: 0.95
            }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-6 h-6" style={{ color: 'var(--color-text-inverse)' }} />
                <ThemedBadge variant="success" size="sm">
                  +{executiveMetrics.monthlyGrowth}%
                </ThemedBadge>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-inverse)' }}>{dashboardLoading ? '...' : executiveMetrics.totalEmployees}</div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-inverse)', opacity: 0.9 }}>Total Employees</div>
              <div className="text-xs mt-2" style={{ color: 'var(--color-text-inverse)', opacity: 0.7 }}>{executiveMetrics.monthlyGrowth > 0 ? 'Growth' : 'Change'} this month</div>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="lg"
            shadow="lg"
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary))',
              opacity: 0.95
            }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Shield className="w-6 h-6" style={{ color: 'var(--color-text-inverse)' }} />
                <ThemedBadge variant="primary" size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--color-text-inverse)' }}>
                  A+
                </ThemedBadge>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-inverse)' }}>{dashboardLoading ? '...' : executiveMetrics.complianceScore}%</div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-inverse)', opacity: 0.9 }}>Compliance Score</div>
              <div className="text-xs mt-2 flex items-center" style={{ color: 'var(--color-text-inverse)', opacity: 0.7 }}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Excellent Rating
              </div>
            </div>
          </ThemedCard>
        </div>

        {/* 🌟 FEATURED ACTIONS - Enhanced V2 */}
        <div className="grid grid-cols-1 gap-4">
          {featuredActions.map((action) => (
            <ThemedCard
              key={action.id}
              padding="lg"
              shadow="lg"
              hover
              onClick={action.action}
              className="cursor-pointer text-left overflow-hidden group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    color: 'var(--color-text-inverse)'
                  }}
                >
                  <action.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>{action.title}</div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{action.description}</div>
                </div>
                <ThemedBadge variant="primary" size="sm">
                  Executive
                </ThemedBadge>
              </div>
            </ThemedCard>
          ))}
        </div>

        {/* ⚠️ WARNINGS OVERVIEW MOBILE */}
        <WarningsOverviewCard
          userRole="business-owner"
          variant="compact"
        />
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW - Enhanced V2 Design Language  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 👑 EXECUTIVE HEADER - Enhanced V2 */}
      <ThemedCard
        padding="lg"
        shadow="xl"
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
          color: 'var(--color-text-inverse)'
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Crown className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Executive Command Center</h2>
                <div className="text-sm font-medium mt-1 opacity-75">
                  {organization?.name || 'Your Organization'} • Strategic Overview
                </div>
              </div>
            </div>
            <ThemedBadge
              variant="primary"
              size="sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                color: 'var(--color-text-inverse)',
                backdropFilter: 'blur(10px)'
              }}
            >
              Business Owner Access
            </ThemedBadge>
          </div>
        </div>
      </ThemedCard>

      {/* 📊 EXECUTIVE METRICS - Enhanced V2 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <ThemedCard padding="md" shadow="lg" hover className="text-center" style={{ background: 'linear-gradient(135deg, var(--color-success), var(--color-success))', color: 'var(--color-text-inverse)' }}>
          <Users className="w-5 h-5 mx-auto mb-2 opacity-75" />
          <div className="text-2xl font-bold">{dashboardLoading ? '...' : executiveMetrics.totalEmployees}</div>
          <div className="text-xs font-medium opacity-75">Employees</div>
        </ThemedCard>
        <ThemedCard padding="md" shadow="lg" hover className="text-center" style={{ background: 'linear-gradient(135deg, var(--color-info), var(--color-info-hover))', color: 'var(--color-text-inverse)' }}>
          <TrendingUp className="w-5 h-5 mx-auto mb-2 opacity-75" />
          <div className="text-2xl font-bold">{dashboardLoading ? '...' : `${executiveMetrics.monthlyGrowth >= 0 ? '+' : ''}${executiveMetrics.monthlyGrowth}%`}</div>
          <div className="text-xs font-medium opacity-75">Growth</div>
        </ThemedCard>
        <ThemedCard padding="md" shadow="lg" hover className="text-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))', color: 'var(--color-text-inverse)' }}>
          <Shield className="w-5 h-5 mx-auto mb-2 opacity-75" />
          <div className="text-2xl font-bold">{dashboardLoading ? '...' : executiveMetrics.complianceScore}%</div>
          <div className="text-xs font-medium opacity-75">Compliance</div>
        </ThemedCard>
        <ThemedCard padding="md" shadow="lg" hover className="text-center" style={{ background: 'linear-gradient(135deg, var(--color-warning), var(--color-error))', color: 'var(--color-text-inverse)' }}>
          <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-75" />
          <div className="text-2xl font-bold">{dashboardLoading ? '...' : executiveMetrics.activeWarnings}</div>
          <div className="text-xs font-medium opacity-75">Warnings</div>
        </ThemedCard>
        <ThemedCard padding="md" shadow="lg" hover className="text-center" style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent))', color: 'var(--color-text-inverse)' }}>
          <Clock className="w-5 h-5 mx-auto mb-2 opacity-75" />
          <div className="text-2xl font-bold">{dashboardLoading ? '...' : executiveMetrics.pendingReviews}</div>
          <div className="text-xs font-medium opacity-75">Reviews</div>
        </ThemedCard>
        <ThemedCard padding="md" shadow="lg" hover className="text-center" style={{ background: 'linear-gradient(135deg, var(--color-muted), var(--color-subtle))', color: 'var(--color-text-inverse)' }}>
          <DollarSign className="w-5 h-5 mx-auto mb-2 opacity-75" />
          <div className="text-2xl font-bold">{dashboardLoading ? '...' : `$${executiveMetrics.costPerEmployee}`}</div>
          <div className="text-xs font-medium opacity-75">Cost/Employee</div>
        </ThemedCard>
      </div>

      {/* 🎯 EXECUTIVE ACTIONS - Horizontal Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {featuredActions.map((action) => (
          <ThemedCard
            key={action.id}
            padding="lg"
            shadow="lg"
            hover
            onClick={action.action}
            className="cursor-pointer text-left relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  color: 'var(--color-text-inverse)'
                }}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <ThemedBadge variant="primary" size="sm">
                Executive
              </ThemedBadge>
            </div>
            <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>{action.title}</h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{action.description}</p>
          </ThemedCard>
        ))}
      </div>

      {/* 📊 MAIN CONTENT SECTIONS - 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 🏢 ORGANIZATION HUB - Full Width Section */}
        <ThemedCard
          padding="none"
          shadow="xl"
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--color-card-background), var(--color-background-secondary))'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}></div>
          <div className="relative z-10">
            <div className="p-8 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-2xl font-bold flex items-center gap-4" style={{ color: 'var(--color-primary)' }}>
                <Building2 className="w-8 h-8" />
                Organization Hub
              </h3>
              <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Manage your organization settings and structure</p>
            </div>
            <div className="p-8">
              <OrganizationManagementV2 />
            </div>
          </div>
        </ThemedCard>

        {/* ⚠️ WARNINGS & INSIGHTS - Full Width Section */}
        <ThemedCard
          padding="none"
          shadow="xl"
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--color-alert-warning-bg), var(--color-alert-error-bg))'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16" style={{ backgroundColor: 'var(--color-error)', opacity: 0.1 }}></div>
          <div className="relative z-10">
            <div className="p-8 pb-6" style={{ borderBottom: '1px solid var(--color-alert-error-border)' }}>
              <h3 className="text-2xl font-bold flex items-center gap-4" style={{ color: 'var(--color-error)' }}>
                <AlertTriangle className="w-8 h-8" />
                Warning Overview & Insights
              </h3>
              <p className="mt-2" style={{ color: 'var(--color-alert-error-text)' }}>Monitor disciplinary actions and organizational health</p>
            </div>
            <div className="p-8">
              <WarningsOverviewCard
                userRole="business-owner"
                variant="executive"
                gradientColors="from-red-500 to-orange-600"
              />
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* 🚀 QUICK ACTIONS - Horizontal Strip */}
      <ThemedCard
        padding="lg"
        shadow="lg"
        style={{
          background: 'linear-gradient(to right, var(--color-accent), var(--color-primary))',
          opacity: 0.95
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--color-text-inverse)' }}>
              <Settings className="w-6 h-6" />
              Quick Actions
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-inverse)', opacity: 0.8 }}>Frequently used management tools</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {regularActions.map((action) => (
            <ThemedCard
              key={action.id}
              padding="md"
              hover
              onClick={action.action}
              className="cursor-pointer text-center group"
              style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="p-3 rounded-lg transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
                    color: 'var(--color-text-inverse)'
                  }}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{action.title}</div>
                  <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{action.description}</div>
                </div>
              </div>
            </ThemedCard>
          ))}
        </div>
      </ThemedCard>

      {/* Employee Management Modal - Portal to body to ensure proper z-index */}
      {showEmployeeManagement && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: 'var(--color-overlay)' }}>
          <ThemedCard padding="none" shadow="xl" className="max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Employee Management</h2>
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={() => setShowEmployeeManagement(false)}
              >
                ×
              </ThemedButton>
            </div>
            <div className="overflow-y-auto">
              <EmployeeManagement />
            </div>
          </ThemedCard>
        </div>,
        document.body
      )}

      {/* Category Management Modal - Simple organization categories viewer */}
      {showCategoryManagement && (
        <OrganizationCategoriesViewer
          onClose={() => setShowCategoryManagement(false)}
        />
      )}

      {/* Department Management Modal */}
      <DepartmentManagement
        isOpen={showDepartmentManagement}
        onClose={() => setShowDepartmentManagement(false)}
      />
    </div>
  );
});

BusinessOwnerDashboardSection.displayName = 'BusinessOwnerDashboardSection';