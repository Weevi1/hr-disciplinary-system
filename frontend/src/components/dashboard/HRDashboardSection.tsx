// frontend/src/components/dashboard/HRDashboardSection.tsx
// 🚀 ENHANCED HR DASHBOARD - Desktop Optimized
// ✅ Integrates with existing WarningsReviewDashboard
// ✅ Enhanced data integration and employee overview
// 🖥️ Optimized for desktop HR workflow

import React, { memo, useState } from 'react';
import { Bell, UserX, MessageCircle, AlertTriangle, RefreshCw, Clock, Archive, Settings, BookOpen, Users, TrendingUp, Shield, Building2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHRReportsData } from '../../hooks/dashboard/useHRReportsData';
import { useEnhancedHRDashboard } from '../../hooks/dashboard/useEnhancedHRDashboard';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { WarningsOverviewCard } from '../warnings/cards/OverviewCard';
import { CategoryManagement } from '../admin/CategoryManagement';
import WarningsReviewDashboard from '../warnings/ReviewDashboard';

interface HRDashboardSectionProps {
  className?: string;
  isMobile?: boolean;
}

export const HRDashboardSection = memo<HRDashboardSectionProps>(({ className = '', isMobile = false }) => {
  const navigate = useNavigate();
  const { hrReportsCount, hrCountsLoading, hrCountsError, refreshHRCounts, lastUpdated } = useHRReportsData();
  const { canManageCategories } = useMultiRolePermissions();
  
  // Enhanced dashboard data
  const { 
    warningStats, 
    employeeStats, 
    reportStats, 
    trendData, 
    isLoading: enhancedLoading, 
    error: enhancedError,
    refreshAllData 
  } = useEnhancedHRDashboard();
  
  // State management
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'warnings' | 'employees'>('overview');

  // 🎨 MOBILE VIEW
  if (isMobile) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            HR Review Dashboard
          </h3>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {/* 📋 ABSENCE REPORTS CARD */}
          <button
            onClick={() => navigate('/hr/absence-reports')}
            className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left relative"
          >
            {hrCountsLoading && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Absence Reports</div>
                  <div className="text-sm text-gray-600">Review employee absences</div>
                </div>
              </div>
              {hrReportsCount.absenceReports.unread > 0 && (
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {hrReportsCount.absenceReports.unread}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {hrReportsCount.absenceReports.total} total reports
            </div>
          </button>

          {/* 💬 HR MEETINGS CARD */}
          <button
            onClick={() => navigate('/hr/meeting-requests')}
            className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left relative"
          >
            {hrCountsLoading && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">HR Meetings</div>
                  <div className="text-sm text-gray-600">Schedule & manage meetings</div>
                </div>
              </div>
              {hrReportsCount.hrMeetings.unread > 0 && (
                <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {hrReportsCount.hrMeetings.unread}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {hrReportsCount.hrMeetings.total} total requests
            </div>
          </button>

          {/* 📋 CORRECTIVE COUNSELLING CARD */}
          <button
            onClick={() => navigate('/hr/corrective-counselling')}
            className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left relative"
          >
            {hrCountsLoading && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Counselling Records</div>
                  <div className="text-sm text-gray-600">Review preventive interventions</div>
                </div>
              </div>
              {hrReportsCount.correctiveCounselling.unread > 0 && (
                <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {hrReportsCount.correctiveCounselling.unread}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {hrReportsCount.correctiveCounselling.total} total records
            </div>
          </button>

          {/* ⚠️ WARNINGS OVERVIEW CARD */}
          <button
            onClick={() => setActiveView('warnings')}
            className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Warnings Management</div>
                  <div className="text-sm text-gray-600">
                    {warningStats.undelivered} undelivered, {warningStats.highSeverity} high-severity
                  </div>
                </div>
              </div>
              <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {warningStats.totalActive}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total active warnings: {warningStats.totalActive}
            </div>
          </button>

          {/* 👥 EMPLOYEE OVERVIEW CARD */}
          <button
            onClick={() => setActiveView('employees')}
            className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Employee Overview</div>
                  <div className="text-sm text-gray-600">
                    {employeeStats.activeEmployees} active, {employeeStats.newEmployees} new
                  </div>
                </div>
              </div>
              <div className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {employeeStats.totalEmployees}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total employees: {employeeStats.totalEmployees}
            </div>
          </button>

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
                <button onClick={() => setActiveView('overview')} className="p-1 hover:bg-gray-100 rounded">
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
                <button onClick={() => setActiveView('overview')} className="p-1 hover:bg-gray-100 rounded">
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

  // 🖥️ DESKTOP VIEW
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* 📊 HR REVIEW DASHBOARD */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            HR Review Dashboard
          </h3>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={refreshHRCounts}
              className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              disabled={hrCountsLoading}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${hrCountsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {hrCountsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="text-red-700 text-sm font-medium">Failed to load HR data</div>
            <div className="text-red-600 text-xs mt-1">{hrCountsError}</div>
          </div>
        )}
        
        <div className="space-y-4">
          {/* 📋 ABSENCE REPORTS */}
          <button 
            className="group relative bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left w-full"
            onClick={() => navigate('/hr/absence-reports')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Absence Reports</h4>
                  <p className="text-gray-600 text-sm">Review and manage employee absences</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {hrReportsCount.absenceReports.unread > 0 && (
                  <div className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                    {hrReportsCount.absenceReports.unread} unread
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {hrReportsCount.absenceReports.total} total
                </div>
              </div>
            </div>
            {hrCountsLoading && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
              </div>
            )}
          </button>

          {/* 💬 HR MEETINGS */}
          <button 
            className="group relative bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left w-full"
            onClick={() => navigate('/hr/meeting-requests')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">HR Meeting Requests</h4>
                  <p className="text-gray-600 text-sm">Schedule and manage HR meetings</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {hrReportsCount.hrMeetings.unread > 0 && (
                  <div className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                    {hrReportsCount.hrMeetings.unread} pending
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {hrReportsCount.hrMeetings.total} total
                </div>
              </div>
            </div>
            {hrCountsLoading && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            )}
          </button>

          {/* 📋 CORRECTIVE COUNSELLING */}
          <button 
            className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left w-full"
            onClick={() => navigate('/hr/corrective-counselling')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Counselling Records</h4>
                  <p className="text-gray-600 text-sm">Review preventive interventions and training sessions</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {hrReportsCount.correctiveCounselling.unread > 0 && (
                  <div className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                    {hrReportsCount.correctiveCounselling.unread} recent
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {hrReportsCount.correctiveCounselling.total} total
                </div>
              </div>
            </div>
            {hrCountsLoading && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
          </button>

          {/* ⚠️ WARNINGS MANAGEMENT */}
          <button 
            className="group relative bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left w-full"
            onClick={() => setActiveView('warnings')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Warnings Management</h4>
                  <p className="text-gray-600 text-sm">
                    {warningStats.undelivered} undelivered • {warningStats.highSeverity} high-priority
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {warningStats.undelivered > 0 && (
                  <div className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                    {warningStats.undelivered} pending
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {warningStats.totalActive} total active
                </div>
              </div>
            </div>
          </button>

          {/* 👥 EMPLOYEE OVERVIEW */}
          <button 
            className="group relative bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left w-full"
            onClick={() => setActiveView('employees')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">Employee Overview</h4>
                  <p className="text-gray-600 text-sm">
                    {employeeStats.activeEmployees} active • {employeeStats.newEmployees} new this month
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {employeeStats.totalEmployees} total
                </div>
                <div className="text-xs text-gray-500">
                  {Object.keys(employeeStats.departmentBreakdown).length} departments
                </div>
              </div>
            </div>
          </button>

          {/* 🔧 CATEGORY MANAGEMENT - DESKTOP */}
          {canManageCategories && (
            <button 
              className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 text-left w-full"
              onClick={() => setShowCategoryManagement(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">Warning Categories</h4>
                    <p className="text-gray-600 text-sm">Configure universal and custom categories</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    Configure
                  </div>
                  <div className="text-xs text-gray-500">
                    System settings
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ⚠️ WARNINGS OVERVIEW INTEGRATION */}
      <WarningsOverviewCard
        userRole="hr-manager"
        variant="detailed"
        gradientColors="from-emerald-500 to-teal-600"
      />

      {/* Category Management Modal - Desktop */}
      {showCategoryManagement && (
        <CategoryManagement
          onClose={() => setShowCategoryManagement(false)}
          initialTab="overview"
        />
      )}

      {/* Enhanced Views */}
      {activeView === 'warnings' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Warnings Management Center</h2>
              <button 
                onClick={() => setActiveView('overview')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-80px)]">
              <WarningsReviewDashboard 
                onClose={() => setActiveView('overview')}
                canTakeAction={true}
                userRole="hr-manager"
              />
            </div>
          </div>
        </div>
      )}

      {activeView === 'employees' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Employee Overview</h2>
              <button 
                onClick={() => setActiveView('overview')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              {/* Department Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(employeeStats.departmentBreakdown).map(([department, count]) => (
                  <div key={department} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{department}</h3>
                        <p className="text-sm text-gray-600">{count} employees</p>
                      </div>
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Employee Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Employees</p>
                      <p className="text-2xl font-bold text-blue-900">{employeeStats.totalEmployees}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Active</p>
                      <p className="text-2xl font-bold text-green-900">{employeeStats.activeEmployees}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-600 text-sm font-medium">New (30 days)</p>
                      <p className="text-2xl font-bold text-indigo-900">{employeeStats.newEmployees}</p>
                    </div>
                    <Plus className="w-8 h-8 text-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

HRDashboardSection.displayName = 'HRDashboardSection';