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
import { CategoryManagement } from '../admin/CategoryManagement';
import WarningsReviewDashboard from '../warnings/ReviewDashboard';
import { EmployeeManagement } from '../employees/EmployeeManagement';

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
  const [activeView, setActiveView] = useState<'urgent' | 'actions' | 'warnings' | 'employees'>('urgent');

  // 🎨 MOBILE VIEW
  if (isMobile) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Command Center</h1>
            <p className="text-gray-600 mt-1">Employee oversight & disciplinary management</p>
          </div>
          {lastUpdated && (
            <div className="text-right">
              <span className="text-xs text-gray-500">Last updated</span>
              <br />
              <span className="text-sm font-medium text-gray-700">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* 📋 ABSENCE REPORTS CARD */}
          <div 
            onClick={() => navigate('/hr/absence-reports')}
            className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white cursor-pointer hover:from-red-600 hover:to-red-700 transition-all relative"
          >
            {hrCountsLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-red-200 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Pending Reviews</p>
                <p className="text-2xl font-bold">{hrReportsCount.absenceReports.unread}</p>
                <div className="mt-2 text-sm text-red-100">
                  {hrReportsCount.absenceReports.total} total absence reports
                </div>
              </div>
              <UserX className="w-8 h-8 text-red-200" />
            </div>
          </div>

          {/* 💬 HR MEETINGS CARD */}
          <div
            onClick={() => navigate('/hr/meeting-requests')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all relative"
          >
            {hrCountsLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-purple-200 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Meeting Requests</p>
                <p className="text-2xl font-bold">{hrReportsCount.hrMeetings.unread}</p>
                <div className="mt-2 text-sm text-purple-100">
                  {hrReportsCount.hrMeetings.total} total requests
                </div>
              </div>
              <MessageCircle className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          {/* 📋 CORRECTIVE COUNSELLING CARD */}
          <div
            onClick={() => navigate('/hr/corrective-counselling')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all relative"
          >
            {hrCountsLoading && (
              <div className="absolute top-4 right-4">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Counselling Sessions</p>
                <p className="text-2xl font-bold">{hrReportsCount.correctiveCounselling.unread}</p>
                <div className="mt-2 text-sm text-blue-100">
                  {hrReportsCount.correctiveCounselling.total} total records
                </div>
              </div>
              <BookOpen className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          {/* ⚠️ WARNINGS OVERVIEW CARD */}
          <div
            onClick={() => setActiveView('warnings')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Warnings</p>
                <p className="text-2xl font-bold">{warningStats.totalActive}</p>
                <div className="mt-2 text-sm text-orange-100">
                  {warningStats.undelivered} undelivered, {warningStats.highSeverity} high-severity
                </div>
              </div>
              <Shield className="w-8 h-8 text-orange-200" />
            </div>
          </div>

          {/* 👥 EMPLOYEE OVERVIEW CARD */}
          <div
            onClick={() => setActiveView('employees')}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white cursor-pointer hover:from-indigo-600 hover:to-indigo-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Employee Network</p>
                <p className="text-2xl font-bold">{employeeStats.totalEmployees}</p>
                <div className="mt-2 text-sm text-indigo-100">
                  {employeeStats.activeEmployees} active, {employeeStats.newEmployees} new this month
                </div>
              </div>
              <Users className="w-8 h-8 text-indigo-200" />
            </div>
          </div>

          {/* 🔧 CATEGORY MANAGEMENT CARD - MOBILE */}
          {canManageCategories && (
            <button
              onClick={() => setShowCategoryManagement(true)}
              className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Warning Categories</div>
                    <div className="text-sm text-gray-600">Configure categories</div>
                  </div>
                </div>
                <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Manage
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Universal & custom category settings
              </div>
            </button>
          )}
        </div>

        {/* Category Management Modal - Mobile */}
        {showCategoryManagement && (
          <CategoryManagement
            onClose={() => setShowCategoryManagement(false)}
            initialTab="overview"
          />
        )}

        {/* Enhanced Views - Mobile */}
        {activeView === 'warnings' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">Warnings</h2>
                <button onClick={() => setActiveView('urgent')} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">Comprehensive warnings management available on desktop.</p>
                <div className="space-y-3">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">{warningStats.undelivered} Undelivered</p>
                    <p className="text-xs text-orange-700">Require immediate attention</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-900">{warningStats.highSeverity} High Priority</p>
                    <p className="text-xs text-red-700">Final warnings & dismissals</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">{warningStats.totalActive} Total Active</p>
                    <p className="text-xs text-blue-700">All current warnings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'employees' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">Employees</h2>
                <button onClick={() => setActiveView('urgent')} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{employeeStats.totalEmployees} Total</p>
                  <p className="text-xs text-blue-700">All employees</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-900">{employeeStats.activeEmployees} Active</p>
                  <p className="text-xs text-green-700">Currently employed</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-indigo-900">{employeeStats.newEmployees} New</p>
                  <p className="text-xs text-indigo-700">Last 30 days</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW - Compact, Desktop-First Design
  return (
    <div className={`${className}`}>
      {/* Compact Header - Single Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">HR Dashboard</h1>
          <div className="text-sm text-gray-500">Employee oversight & disciplinary management</div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <button
            onClick={() => {
              refreshData();
              refreshHRCounts();
            }}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            disabled={dashboardLoading || hrCountsLoading}
          >
            <RefreshCw className={`w-3 h-3 ${(dashboardLoading || hrCountsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>

        </div>
      </div>

      {/* Compact Overview Cards - 4 Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        {/* Compact Cards - Better space utilization */}
        <div 
          onClick={() => navigate('/hr/absence-reports')}
          className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white cursor-pointer hover:from-red-600 hover:to-red-700 transition-all shadow hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-4 h-4" />
                <p className="text-sm font-medium text-red-100">Absence Reports</p>
              </div>
              <p className="text-2xl font-bold">{hrReportsCount.absenceReports.unread}</p>
              <p className="text-xs text-red-200">of {hrReportsCount.absenceReports.total} total</p>
            </div>
            {hrCountsLoading && <div className="w-3 h-3 border border-red-200 border-t-white rounded-full animate-spin"></div>}
          </div>
        </div>

        <div
          onClick={() => navigate('/hr/meeting-requests')}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all shadow hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4" />
                <p className="text-sm font-medium text-purple-100">Meeting Requests</p>
              </div>
              <p className="text-2xl font-bold">{hrReportsCount.hrMeetings.unread}</p>
              <p className="text-xs text-purple-200">of {hrReportsCount.hrMeetings.total} total</p>
            </div>
            {hrCountsLoading && <div className="w-3 h-3 border border-purple-200 border-t-white rounded-full animate-spin"></div>}
          </div>
        </div>

        <div
          onClick={() => navigate('/hr/corrective-counselling')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all shadow hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4" />
                <p className="text-sm font-medium text-blue-100">Counselling</p>
              </div>
              <p className="text-2xl font-bold">{hrReportsCount.correctiveCounselling.unread}</p>
              <p className="text-xs text-blue-200">of {hrReportsCount.correctiveCounselling.total} total</p>
            </div>
            {hrCountsLoading && <div className="w-3 h-3 border border-blue-200 border-t-white rounded-full animate-spin"></div>}
          </div>
        </div>

        <div
          onClick={() => setActiveView('warnings')}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all shadow hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4" />
                <p className="text-sm font-medium text-orange-100">Active Warnings</p>
              </div>
              <p className="text-2xl font-bold">{warningStats.totalActive}</p>
              <p className="text-xs text-orange-200">{warningStats.undelivered} undelivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(hrCountsError || dashboardError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="text-red-700 text-sm">
            Failed to load HR data: {hrCountsError || dashboardError}
          </div>
        </div>
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
                            {warningStats.undelivered} undelivered
                          </span>
                          <Shield className="w-4 h-4 text-gray-400" />
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

          {/* Warnings Tab Content */}
          {activeView === 'warnings' && (
            <div className="space-y-4">
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
    </div>
  );
});