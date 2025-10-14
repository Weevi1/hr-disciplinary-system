// ManagerStats.tsx
// 📊 MANAGER STATISTICS DASHBOARD
// Displays key metrics about managers in the organization

import React from 'react';
import { Users, UserCheck, Building2, TrendingUp } from 'lucide-react';
import { ManagerStats as ManagerStatsType } from '../../services/ManagerService';

interface ManagerStatsProps {
  stats: ManagerStatsType | null;
  loading?: boolean;
}

export const ManagerStats: React.FC<ManagerStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Managers',
      value: stats.totalManagers,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600'
    },
    {
      label: 'HR Managers',
      value: stats.hrManagers,
      icon: UserCheck,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600'
    },
    {
      label: 'HOD Managers',
      value: stats.hodManagers,
      icon: Building2,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Employees Under Management',
      value: stats.totalEmployeesUnderManagement,
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} border border-${stat.color}-200 rounded-lg p-4`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stat.textColor}`}>
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                {stat.value}
              </p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.iconColor} opacity-70`} />
          </div>
        </div>
      ))}
    </div>
  );
};
