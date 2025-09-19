// frontend/src/components/employees/EmployeeStats.tsx
import React from 'react';
import { calculateEmployeeStats } from '../../types';
import type { Employee } from '../../types';

interface EmployeeStatsProps {
  employees: Employee[];
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({ employees }) => {
  const stats = calculateEmployeeStats(employees);

  const statCards = [
    { value: stats.total, label: 'Total Employees', color: 'blue', icon: '👥' },
    { value: stats.active, label: 'Active', color: 'green', icon: '✅' },
    { value: stats.inactive, label: 'Archived', color: 'gray', icon: '📁' },
    { value: stats.onProbation, label: 'On Probation', color: 'yellow', icon: '⏳' },
    { value: stats.withActiveWarnings, label: 'With Warnings', color: 'red', icon: '⚠️' }
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="text-xl mb-1">{stat.icon}</div>
          <div className={`text-xl font-bold text-${stat.color}-600 mb-1`}>
            {stat.value}
          </div>
          <div className="text-xs text-gray-600 font-medium leading-tight">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
