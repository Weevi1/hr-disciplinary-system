// frontend/src/components/warnings/WarningsStatsCard.tsx
// 🏆 INDIVIDUAL WARNINGS STATISTICS CARDS
// Matches the exact styling and animation patterns from BusinessDashboard.tsx

import React from 'react';
import type { LucideProps } from 'lucide-react';

interface WarningsStatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<LucideProps>;
  color: string; // Tailwind color classes like 'text-red-600'
  bgColor: string; // Background color like 'bg-red-100'
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  isLoading?: boolean;
  onClick?: () => void;
  pulse?: boolean; // For unread counters like in HR dashboard
}

export const WarningsStatsCard: React.FC<WarningsStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  trend,
  isLoading,
  onClick,
  pulse = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-3 border">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
          </div>
          <div className={`w-8 h-8 ${bgColor} rounded-lg animate-pulse`}></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg p-3 border transition-all duration-200 ${
        onClick ? 'hover:shadow-md cursor-pointer hover:border-gray-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${color}`}>
              {value.toLocaleString()}
            </p>
            {pulse && value > 0 && (
              <div className={`w-2 h-2 ${bgColor.replace('bg-', 'bg-')} rounded-full animate-pulse`}></div>
            )}
          </div>
          <p className="text-xs text-gray-500">{subtitle}</p>
          
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );
};

export default WarningsStatsCard;