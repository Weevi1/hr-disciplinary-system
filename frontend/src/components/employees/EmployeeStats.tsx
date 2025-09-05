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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        >
          <div className="text-4xl mb-3">{stat.icon}</div>
          <div className={`text-3xl font-bold text-${stat.color}-600 mb-2`}>
            {stat.value}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
