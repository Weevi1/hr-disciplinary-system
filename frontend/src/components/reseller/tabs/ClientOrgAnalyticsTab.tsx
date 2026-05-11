// frontend/src/components/reseller/tabs/ClientOrgAnalyticsTab.tsx
//
// Analytics tab of ClientOrganizationManager. Extracted in Phase 2 Tier
// 3D step 5. Shows active-warning + employee-count cards plus a couple
// of conditional recommendations.

import React from 'react';
import { AlertCircle, Users, Target } from 'lucide-react';

interface ClientOrgStats {
  activeWarnings: number;
  totalWarnings: number;
  totalEmployees: number;
  totalCategories: number;
}

interface ClientOrgAnalyticsTabProps {
  stats: ClientOrgStats;
}

export const ClientOrgAnalyticsTab: React.FC<ClientOrgAnalyticsTabProps> = ({ stats }) => (
  <div className="p-6">
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
      <p className="text-sm text-gray-600">Insights and metrics for this client organization</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Active Warnings Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Active Warnings</h4>
          <AlertCircle className="w-5 h-5 text-orange-500" />
        </div>
        <div className="text-3xl font-bold text-orange-600">{stats.activeWarnings}</div>
        <p className="text-sm text-gray-600 mt-2">
          Out of {stats.totalWarnings} total warnings
        </p>
      </div>

      {/* Employee Count Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Total Employees</h4>
          <Users className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</div>
        <p className="text-sm text-gray-600 mt-2">
          Managed workforce
        </p>
      </div>
    </div>

    <div className="mt-8">
      <h4 className="font-semibold text-gray-900 mb-4">Quick Recommendations</h4>
      <div className="space-y-3">
        {stats.activeWarnings > 5 && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-orange-900">High Active Warnings</h5>
              <p className="text-sm text-orange-700">Consider reviewing and resolving active warnings to improve workforce management.</p>
            </div>
          </div>
        )}

        {stats.totalCategories < 5 && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Target className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">Limited Warning Categories</h5>
              <p className="text-sm text-blue-700">Consider adding more specific warning categories to improve HR management granularity.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
