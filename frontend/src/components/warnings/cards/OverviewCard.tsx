// frontend/src/components/warnings/OverviewCard.tsx
// 🏆 MAIN WARNINGS OVERVIEW COMPONENT
// Perfectly integrates with BusinessDashboard styling and patterns

import React from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  TrendingUp, 
  FileText, 
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useWarningsStats } from '@/hooks/useWarningsStats';
import WarningsStatsCard from './StatsCard';

interface WarningsOverviewCardProps {
  userRole: 'executive-management' | 'hr-manager';
  variant?: 'executive' | 'detailed' | 'compact';
  gradientColors?: string;
  showHeader?: boolean;
}

export const WarningsOverviewCard: React.FC<WarningsOverviewCardProps> = ({
  userRole,
  variant = 'detailed',
  gradientColors = 'from-red-500 to-orange-600',
  showHeader = true
}) => {
  const { stats, loading, error, refreshStats } = useWarningsStats();

  const getRoleIcon = () => {
    return userRole === 'executive-management' ? Shield : AlertTriangle;
  };

  const getRoleColor = () => {
    return userRole === 'executive-management' ? 'text-purple-600' : 'text-emerald-600';
  };

  const getHeaderTitle = () => {
    return userRole === 'executive-management' 
      ? 'Warnings Overview' 
      : 'Warnings Management';
  };

  const getHeaderSubtitle = () => {
    return userRole === 'executive-management'
      ? 'Executive summary of disciplinary actions'
      : 'Active warnings requiring review and management';
  };

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${getRoleColor()} flex items-center gap-2`}>
              {React.createElement(getRoleIcon(), { className: 'w-5 h-5' })}
              Warnings
            </h3>
            <button
              onClick={refreshStats}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <WarningsStatsCard
            title="Active"
            value={stats.activeWarnings}
            subtitle="Current warnings"
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100"
            isLoading={loading}
          />
          
          <WarningsStatsCard
            title="High Risk"
            value={stats.highRisk}
            subtitle="Require attention"
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-red-100"
            isLoading={loading}
            pulse={stats.highRisk > 0}
          />
        </div>

        {/* Quick actions removed - use WarningManagement for full interface */}
      </div>
    );
  }

  // Executive variant for business owners
  if (variant === 'executive') {
    return (
      <div className="space-y-3">
        {showHeader && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold ${getRoleColor()} flex items-center gap-2`}>
                  {React.createElement(getRoleIcon(), { className: 'w-4 h-4' })}
                  {getHeaderTitle()}
                </h3>
                <p className="text-gray-600 text-xs mt-0.5">{getHeaderSubtitle()}</p>
              </div>
              <button
                onClick={refreshStats}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Failed to load warnings data</span>
            </div>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        )}

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <WarningsStatsCard
            title="Total Warnings"
            value={stats.totalWarnings}
            subtitle="All time"
            icon={FileText}
            color="text-gray-700"
            bgColor="bg-gray-100"
            isLoading={loading}
          />
          
          <WarningsStatsCard
            title="Active"
            value={stats.activeWarnings}
            subtitle="Currently valid"
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-100"
            isLoading={loading}
          />
          
          <WarningsStatsCard
            title="High Risk"
            value={stats.highRisk}
            subtitle="Final warnings"
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-red-100"
            isLoading={loading}
            pulse={stats.highRisk > 0}
          />

          <WarningsStatsCard
            title="This Month"
            value={stats.recentActivity.monthCount}
            subtitle="Recent activity"
            icon={TrendingUp}
            color="text-blue-600"
            bgColor="bg-blue-100"
            isLoading={loading}
          />
        </div>

        {/* Level Breakdown for Executive View */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Warning Level Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.byLevel.verbal}</div>
              <div className="text-xs text-gray-600">Verbal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.byLevel.first_written}</div>
              <div className="text-xs text-gray-600">1st Written</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.byLevel.second_written}</div>
              <div className="text-xs text-gray-600">2nd Written</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.byLevel.final_written}</div>
              <div className="text-xs text-gray-600">Final</div>
            </div>
          </div>
        </div>

        {/* Quick actions removed - use WarningManagement for full interface */}
      </div>
    );
  }

  // Detailed variant for HR managers (default)
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${getRoleColor()} flex items-center gap-2 mb-1`}>
              {React.createElement(getRoleIcon(), { className: 'w-6 h-6' })}
              {getHeaderTitle()}
            </h3>
            <p className="text-gray-600 text-sm">{getHeaderSubtitle()}</p>
          </div>
          <button
            onClick={refreshStats}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Failed to load warnings data</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Priority Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <WarningsStatsCard
          title="Pending Review"
          value={stats.pendingReview}
          subtitle="Require immediate attention"
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
          isLoading={loading}
          pulse={stats.pendingReview > 0}
        />
        
        <WarningsStatsCard
          title="High Risk"
          value={stats.highRisk}
          subtitle="Final warnings"
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-100"
          isLoading={loading}
          pulse={stats.highRisk > 0}
        />

        <WarningsStatsCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          subtitle="Within 30 days"
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          isLoading={loading}
        />

        <WarningsStatsCard
          title="Active Total"
          value={stats.activeWarnings}
          subtitle="Currently valid"
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
          isLoading={loading}
        />
      </div>

      {/* Warning Level Breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Warning Level Distribution
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-xl font-bold text-green-600">{stats.byLevel.verbal}</div>
            <div className="text-xs text-gray-600 mt-1">Verbal</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-xl font-bold text-yellow-600">{stats.byLevel.first_written}</div>
            <div className="text-xs text-gray-600 mt-1">1st Written</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-xl font-bold text-orange-600">{stats.byLevel.second_written}</div>
            <div className="text-xs text-gray-600 mt-1">2nd Written</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-xl font-bold text-red-600">{stats.byLevel.final_written}</div>
            <div className="text-xs text-gray-600 mt-1">Final</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Recent Activity
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">{stats.recentActivity.todayCount}</div>
            <div className="text-sm text-blue-600">Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">{stats.recentActivity.weekCount}</div>
            <div className="text-sm text-blue-600">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">{stats.recentActivity.monthCount}</div>
            <div className="text-sm text-blue-600">This Month</div>
          </div>
        </div>
      </div>

      {/* Quick actions removed - use WarningManagement for full interface */}
    </div>
  );
};

export default WarningsOverviewCard;