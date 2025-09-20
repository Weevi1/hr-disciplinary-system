// frontend/src/components/common/SkeletonLoader.tsx
// 🎨 SKELETON LOADING COMPONENTS FOR PROGRESSIVE DASHBOARD LOADING
// ✅ Provides smooth loading states while data loads in background

import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

// Base skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = false }) => (
  <div
    className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
  />
);

// Card skeleton for dashboard sections
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </div>
);

// List skeleton for employee lists, warnings, etc
export const SkeletonList: React.FC<{
  items?: number;
  className?: string;
  showHeader?: boolean;
}> = ({
  items = 3,
  className = '',
  showHeader = true
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
    {showHeader && (
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="animate-pulse">
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
    )}

    <div className="divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="px-6 py-4">
          <div className="animate-pulse flex items-center space-x-4">
            <Skeleton className="h-10 w-10" rounded />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Stats skeleton for metrics
export const SkeletonStats: React.FC<{
  stats?: number;
  className?: string;
}> = ({
  stats = 4,
  className = ''
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: stats }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

// Chart skeleton for analytics
export const SkeletonChart: React.FC<{
  height?: string;
  className?: string;
}> = ({
  height = 'h-64',
  className = ''
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <div className="animate-pulse">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Chart area */}
      <div className={`${height} bg-gray-100 rounded flex items-end justify-center space-x-2 p-4`}>
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={index}
            className="w-8 bg-gray-200"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// Table skeleton
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
    {/* Table header */}
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <div className="animate-pulse grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-24" />
        ))}
      </div>
    </div>

    {/* Table rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="animate-pulse grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Composite dashboard skeleton
export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Stats row */}
    <SkeletonStats />

    {/* Main content grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonList items={5} />
    </div>

    {/* Additional content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export default {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonStats,
  SkeletonChart,
  SkeletonTable,
  SkeletonDashboard
};