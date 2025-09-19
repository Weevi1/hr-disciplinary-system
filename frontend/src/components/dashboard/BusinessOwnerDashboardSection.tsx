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
import { OrganizationManagementV2 } from '../organization/OrganizationManagementV2';
import { WarningsOverviewCard } from '../warnings/cards/OverviewCard';
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { CategoryManagement } from '../admin/CategoryManagement';

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
      orange: 'from-orange-50 to-amber-50 border-orange-200 text-orange-600',
      violet: 'from-violet-50 to-purple-50 border-violet-200 text-violet-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };

  // 📱 MOBILE VIEW - V2 Design Language
  if (isMobile) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 👑 EXECUTIVE HEADER - Enhanced V2 */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Crown className="w-8 h-8" />
                Executive Command Center
              </h3>
              <div className="flex flex-col items-end">
                <span className="text-xs bg-white/30 backdrop-blur px-4 py-2 rounded-full font-semibold mb-2">
                  Business Owner
                </span>
                <span className="text-xs text-purple-200">
                  Strategic Overview
                </span>
              </div>
            </div>
            <p className="text-purple-100 text-lg font-medium">
              {organization?.name || 'Your Organization'}
            </p>
          </div>
        </div>

        {/* 📊 KEY METRICS - Enhanced V2 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-6 h-6 text-emerald-600" />
                <div className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                  +{executiveMetrics.monthlyGrowth}%
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{executiveMetrics.totalEmployees}</div>
              <div className="text-sm font-medium text-emerald-600">Total Employees</div>
              <div className="text-xs text-gray-600 mt-2">Growth this month</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  A+
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{executiveMetrics.complianceScore}%</div>
              <div className="text-sm font-medium text-blue-600">Compliance Score</div>
              <div className="text-xs text-gray-600 mt-2 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Excellent Rating
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 FEATURED ACTIONS - Enhanced V2 */}
        <div className="grid grid-cols-1 gap-4">
          {featuredActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl group-hover:from-purple-200 group-hover:to-indigo-200 transition-all duration-200">
                    <action.icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-lg mb-1">{action.title}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{action.description}</div>
                  </div>
                  <div className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
                    Executive
                  </div>
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

  // 🖥️ DESKTOP VIEW - Enhanced V2 Design Language  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 👑 EXECUTIVE HEADER - Enhanced V2 */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Crown className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Executive Command Center</h2>
                <div className="text-purple-200 text-sm font-medium mt-1">
                  {organization?.name || 'Your Organization'} • Strategic Overview
                </div>
              </div>
            </div>
            <div className="text-xs bg-white/30 backdrop-blur px-4 py-2 rounded-full font-semibold">
              Business Owner Access
            </div>
          </div>
        </div>
      </div>

      {/* 📊 EXECUTIVE METRICS - Enhanced V2 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <Users className="w-5 h-5 mx-auto mb-2 text-emerald-100" />
          <div className="text-2xl font-bold">{executiveMetrics.totalEmployees}</div>
          <div className="text-xs text-emerald-100 font-medium">Employees</div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 text-teal-100" />
          <div className="text-2xl font-bold">+{executiveMetrics.monthlyGrowth}%</div>
          <div className="text-xs text-teal-100 font-medium">Growth</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <Shield className="w-5 h-5 mx-auto mb-2 text-blue-100" />
          <div className="text-2xl font-bold">{executiveMetrics.complianceScore}%</div>
          <div className="text-xs text-blue-100 font-medium">Compliance</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-orange-100" />
          <div className="text-2xl font-bold">{executiveMetrics.activeWarnings}</div>
          <div className="text-xs text-orange-100 font-medium">Warnings</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-100" />
          <div className="text-2xl font-bold">{executiveMetrics.pendingReviews}</div>
          <div className="text-xs text-indigo-100 font-medium">Reviews</div>
        </div>
        <div className="bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <DollarSign className="w-5 h-5 mx-auto mb-2 text-slate-100" />
          <div className="text-2xl font-bold">${executiveMetrics.costPerEmployee}</div>
          <div className="text-xs text-slate-100 font-medium">Cost/Employee</div>
        </div>
      </div>

      {/* 🎯 EXECUTIVE ACTIONS - Horizontal Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {featuredActions.map((action) => (
          <button 
            key={action.id}
            className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden"
            onClick={action.action}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl group-hover:from-purple-200 group-hover:to-indigo-200 transition-all duration-300">
                  <action.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                  Executive
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">{action.title}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 📊 MAIN CONTENT SECTIONS - 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 🏢 ORGANIZATION HUB - Full Width Section */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="p-8 pb-6 border-b border-slate-200/50">
              <h3 className="text-2xl font-bold text-purple-700 flex items-center gap-4">
                <Building2 className="w-8 h-8" />
                Organization Hub
              </h3>
              <p className="text-slate-600 mt-2">Manage your organization settings and structure</p>
            </div>
            <div className="p-8">
              <OrganizationManagementV2 />
            </div>
          </div>
        </div>

        {/* ⚠️ WARNINGS & INSIGHTS - Full Width Section */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-xl border border-red-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="p-8 pb-6 border-b border-red-200/50">
              <h3 className="text-2xl font-bold text-red-700 flex items-center gap-4">
                <AlertTriangle className="w-8 h-8" />
                Warning Overview & Insights
              </h3>
              <p className="text-red-600 mt-2">Monitor disciplinary actions and organizational health</p>
            </div>
            <div className="p-8">
              <WarningsOverviewCard
                userRole="business-owner"
                variant="executive"
                gradientColors="from-red-500 to-orange-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 QUICK ACTIONS - Horizontal Strip */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-indigo-700 flex items-center gap-3">
              <Settings className="w-6 h-6" />
              Quick Actions
            </h3>
            <p className="text-indigo-600 text-sm mt-1">Frequently used management tools</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {regularActions.map((action) => (
            <button 
              key={action.id}
              className="flex flex-col items-center gap-3 p-4 bg-white/80 backdrop-blur rounded-xl hover:bg-white hover:shadow-md transition-all text-center group duration-200 border border-indigo-100"
              onClick={action.action}
            >
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg group-hover:from-indigo-200 group-hover:to-purple-200 transition-all duration-200">
                <action.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{action.title}</div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Employee Management Modal - Portal to body to ensure proper z-index */}
      {showEmployeeManagement && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Employee Management</h2>
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
        </div>,
        document.body
      )}

      {/* Category Management Modal - Let the component handle its own modal */}
      {showCategoryManagement && (
        <CategoryManagement
          onClose={() => setShowCategoryManagement(false)}
        />
      )}
    </div>
  );
});

BusinessOwnerDashboardSection.displayName = 'BusinessOwnerDashboardSection';