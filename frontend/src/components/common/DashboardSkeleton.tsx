// frontend/src/components/common/DashboardSkeleton.tsx
// Skeleton UI components for progressive loading
// Shows immediately while dashboard data loads in background

import React from 'react';

/**
 * Full dashboard skeleton - shows complete loading state
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div
        className="h-24 rounded-lg"
        style={{ backgroundColor: 'var(--color-muted)' }}
      ></div>

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Content skeleton */}
      <div
        className="h-96 rounded-lg"
        style={{ backgroundColor: 'var(--color-muted)' }}
      ></div>
    </div>
  );
};

/**
 * Metric card skeleton - single card loading state
 */
export const MetricCardSkeleton: React.FC = () => (
  <div
    className="h-32 rounded-lg animate-pulse"
    style={{
      backgroundColor: 'var(--color-muted)',
      border: '1px solid var(--color-border)'
    }}
  >
    <div className="p-4 space-y-3">
      <div
        className="h-4 w-1/3 rounded"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
      <div
        className="h-8 w-2/3 rounded"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
    </div>
  </div>
);

/**
 * Table skeleton - for employee/warning lists
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3 animate-pulse">
    {/* Header */}
    <div
      className="h-12 rounded-lg"
      style={{ backgroundColor: 'var(--color-muted)' }}
    ></div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="h-16 rounded-lg"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
    ))}
  </div>
);

/**
 * Card skeleton - generic card loading state
 */
export const CardSkeleton: React.FC = () => (
  <div
    className="rounded-2xl p-6 animate-pulse"
    style={{
      backgroundColor: 'var(--color-card-background)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--color-card-border)'
    }}
  >
    <div
      className="h-6 rounded w-1/3 mb-4"
      style={{ backgroundColor: 'var(--color-muted)' }}
    ></div>
    <div className="space-y-2">
      <div
        className="h-4 rounded w-full"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
      <div
        className="h-4 rounded w-3/4"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
    </div>
  </div>
);

/**
 * List skeleton - for simple lists
 */
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full"
          style={{ backgroundColor: 'var(--color-muted)' }}
        ></div>
        <div className="flex-1 space-y-2">
          <div
            className="h-4 rounded w-2/3"
            style={{ backgroundColor: 'var(--color-subtle)' }}
          ></div>
          <div
            className="h-3 rounded w-1/2"
            style={{ backgroundColor: 'var(--color-subtle)' }}
          ></div>
        </div>
      </div>
    ))}
  </div>
);
