/**
 * 🚨 LEGACY SKELETON LOADERS FOR 2012-ERA DEVICES
 * Simplified, lightweight loading states for older devices
 */

import React from 'react';

interface LegacySkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const LegacySkeleton: React.FC<LegacySkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = ''
}) => (
  <div
    className={`bg-gray-200 rounded animate-pulse legacy-simple-layout ${className}`}
    style={{ width, height }}
  />
);

export const LegacySkeletonCard: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 legacy-simple-layout">
    <div className="flex items-center space-x-3 mb-3">
      <LegacySkeleton width="48px" height="48px" className="rounded-full" />
      <div className="flex-1">
        <LegacySkeleton width="60%" height="16px" className="mb-2" />
        <LegacySkeleton width="40%" height="14px" />
      </div>
    </div>
    <LegacySkeleton width="100%" height="12px" className="mb-2" />
    <LegacySkeleton width="80%" height="12px" />
  </div>
);

export const LegacySkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white border border-gray-200 rounded-lg legacy-simple-layout">
    {/* Table Header */}
    <div className="p-4 border-b border-gray-200">
      <div className="flex gap-4">
        <LegacySkeleton width="150px" height="16px" />
        <LegacySkeleton width="120px" height="16px" />
        <LegacySkeleton width="100px" height="16px" />
        <LegacySkeleton width="80px" height="16px" />
      </div>
    </div>

    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex gap-4 items-center">
          <LegacySkeleton width="150px" height="14px" />
          <LegacySkeleton width="120px" height="14px" />
          <LegacySkeleton width="100px" height="14px" />
          <LegacySkeleton width="80px" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

export const LegacySkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 gap-4 legacy-simple-layout">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <LegacySkeleton width="60px" height="14px" />
          <LegacySkeleton width="24px" height="24px" className="rounded" />
        </div>
        <LegacySkeleton width="40px" height="24px" className="mb-1" />
        <LegacySkeleton width="80px" height="12px" />
      </div>
    ))}
  </div>
);

export const LegacySkeletonDashboard: React.FC = () => (
  <div className="space-y-4 legacy-simple-layout">
    {/* Header */}
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LegacySkeleton width="32px" height="32px" className="rounded" />
          <div>
            <LegacySkeleton width="120px" height="18px" className="mb-1" />
            <LegacySkeleton width="80px" height="14px" />
          </div>
        </div>
        <div className="flex gap-2">
          <LegacySkeleton width="80px" height="36px" className="rounded" />
          <LegacySkeleton width="80px" height="36px" className="rounded" />
        </div>
      </div>
    </div>

    {/* Stats */}
    <LegacySkeletonStats />

    {/* Content */}
    <LegacySkeletonTable rows={3} />
  </div>
);

export const LegacySkeletonForm: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 legacy-simple-layout">
    {/* Form Header */}
    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
      <LegacySkeleton width="120px" height="20px" />
      <LegacySkeleton width="24px" height="24px" className="rounded" />
    </div>

    {/* Form Fields */}
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="space-y-2">
        <LegacySkeleton width="100px" height="14px" />
        <LegacySkeleton width="100%" height="40px" className="rounded" />
      </div>
    ))}

    {/* Form Footer */}
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
      <LegacySkeleton width="80px" height="36px" className="rounded" />
      <LegacySkeleton width="80px" height="36px" className="rounded" />
    </div>
  </div>
);

// Loading message component for very slow connections
export const LegacyLoadingMessage: React.FC<{ message?: string }> = ({
  message = "Loading..."
}) => (
  <div className="text-center py-8 legacy-simple-layout">
    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
    <p className="text-gray-600 legacy-text-size">{message}</p>
    <p className="text-xs text-gray-500 mt-2">This may take a moment on slower connections</p>
  </div>
);

// Error boundary for legacy devices
export const LegacyErrorFallback: React.FC<{ error?: string; onRetry?: () => void }> = ({
  error = "Something went wrong",
  onRetry
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center legacy-simple-layout">
    <div className="text-red-600 mb-2">⚠️</div>
    <h3 className="font-medium text-red-800 mb-2 legacy-text-size">Error Loading Content</h3>
    <p className="text-sm text-red-700 mb-4 legacy-text-size">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 legacy-touch-target legacy-text-size"
      >
        Try Again
      </button>
    )}
  </div>
);