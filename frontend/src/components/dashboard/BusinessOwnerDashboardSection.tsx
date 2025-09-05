// frontend/src/components/dashboard/BusinessOwnerDashboardSection.tsx
// 👑 BUSINESS OWNER SPECIFIC DASHBOARD SECTION
// ✅ Executive overview, organization management, strategic metrics

import React, { memo } from 'react';
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
  Clock
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { OrganizationManagement } from '../organization/OrganizationManagement';
import { WarningsOverviewCard } from '../warnings/cards/OverviewCard';

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
    }
  ];

  const featuredActions = executiveActions.filter(action => action.featured);
  const regularActions = executiveActions.filter(action => !action.featured);

  // 📊 MOCK EXECUTIVE METRICS (replace with real data)
  const executiveMetrics = {
    totalEmployees: 156,
    monthlyGrowth: 12.5,
    complianceScore: 94,
    activeWarnings: 8,
    pendingReviews: 23,
    costPerEmployee: 4250
  };

  // 🎨 COLOR MAPPING
  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'from-purple-50 to-indigo-50 border-purple-200 text-purple-600',
      green: 'from-green-50 to-emerald-50 border-green-200 text-green-600',
      blue: 'from-blue-50 to-cyan-50 border-blue-200 text-blue-600',
      red: 'from-red-50 to-pink-50 border-red-200 text-red-600',
      indigo: 'from-indigo-50 to-violet-50 border-indigo-200 text-indigo-600',
      orange: 'from-orange-50 to-amber-50 border-orange-200 text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };

  // 📱 MOBILE VIEW
  if (isMobile) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 👑 EXECUTIVE HEADER */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Executive Dashboard
            </h3>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
              Business Owner
            </span>
          </div>
          <p className="text-purple-100 text-sm">
            {organization?.name || 'Your Organization'} • Strategic Overview
          </p>
        </div>

        {/* 📊 KEY METRICS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{executiveMetrics.totalEmployees}</div>
            <div className="text-sm text-gray-600">Total Employees</div>
            <div className="text-xs text-green-600 font-medium mt-1">
              +{executiveMetrics.monthlyGrowth}% this month
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{executiveMetrics.complianceScore}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
            <div className="text-xs text-green-600 font-medium mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Excellent
            </div>
          </div>
        </div>

        {/* 🌟 FEATURED ACTIONS */}
        <div className="grid grid-cols-1 gap-3">
          {featuredActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`p-4 bg-gradient-to-r ${getColorClasses(action.color)} border rounded-xl hover:shadow-md transition-all text-left`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/70 rounded-lg">
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{action.title}</div>
                  <div className="text-sm text-gray-600">{action.description}</div>
                </div>
                <div className="text-xs bg-white/80 text-gray-700 px-2 py-1 rounded-full font-medium">
                  Executive
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ⚠️ WARNINGS OVERVIEW MOBILE */}
        <WarningsOverviewCard
          userRole="business-owner"
          variant="compact"
          gradientColors="from-purple-500 to-indigo-600"
        />
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW
  return (
    <div className={`space-y-8 ${className}`}>
      {/* 👑 EXECUTIVE OVERVIEW */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8" />
              Executive Dashboard
            </h2>
            <p className="text-purple-100 text-lg">
              {organization?.name || 'Your Organization'} • Strategic Command Center
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-purple-200 mb-1">Your Role</div>
            <div className="text-xl font-bold">Business Owner</div>
          </div>
        </div>

        {/* 📊 EXECUTIVE METRICS ROW */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{executiveMetrics.totalEmployees}</div>
            <div className="text-purple-200 text-sm">Employees</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">+{executiveMetrics.monthlyGrowth}%</div>
            <div className="text-purple-200 text-sm">Growth</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{executiveMetrics.complianceScore}%</div>
            <div className="text-purple-200 text-sm">Compliance</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{executiveMetrics.activeWarnings}</div>
            <div className="text-purple-200 text-sm">Warnings</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{executiveMetrics.pendingReviews}</div>
            <div className="text-purple-200 text-sm">Reviews</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">${executiveMetrics.costPerEmployee}</div>
            <div className="text-purple-200 text-sm">Cost/Employee</div>
          </div>
        </div>
      </div>

      {/* 🏢 ORGANIZATION MANAGEMENT */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-purple-600 flex items-center gap-2 mb-6">
          <Building2 className="w-6 h-6" />
          Organization Management
        </h3>
        <OrganizationManagement />
      </div>

      {/* 🎯 EXECUTIVE ACTIONS & WARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 👑 EXECUTIVE ACTIONS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-indigo-600 flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6" />
            Executive Functions
          </h3>

          <div className="space-y-4">
            {/* Featured Actions */}
            {featuredActions.map((action) => (
              <button 
                key={action.id}
                className={`group w-full bg-gradient-to-r ${getColorClasses(action.color)} border rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left`}
                onClick={action.action}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/70 rounded-lg group-hover:bg-white transition-colors">
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{action.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{action.description}</p>
                  </div>
                  <div className="text-xs bg-white/80 text-gray-700 px-2 py-1 rounded-full font-medium">
                    Executive
                  </div>
                </div>
              </button>
            ))}

            {/* Regular Actions */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {regularActions.map((action) => (
                <button 
                  key={action.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all text-left group"
                  onClick={action.action}
                >
                  <action.icon className={`w-5 h-5 text-${action.color}-600 group-hover:scale-110 transition-transform`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{action.title}</div>
                    <div className="text-xs text-gray-600">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ⚠️ WARNINGS OVERVIEW */}
        <WarningsOverviewCard
          userRole="business-owner"
          variant="executive"
          gradientColors="from-purple-500 to-indigo-600"
        />
      </div>
    </div>
  );
});

BusinessOwnerDashboardSection.displayName = 'BusinessOwnerDashboardSection';