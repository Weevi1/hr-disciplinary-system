// WizardSkeleton.tsx - Skeleton loading states for wizard
// Priority 3: Micro-Interactions - Loading skeletons

import React from 'react';

interface WizardSkeletonProps {
  variant?: 'form' | 'card' | 'list' | 'signature' | 'full';
}

export const WizardSkeleton: React.FC<WizardSkeletonProps> = ({
  variant = 'form'
}) => {
  switch (variant) {
    case 'form':
      return (
        <div className="space-y-4 animate-pulse">
          {/* Label */}
          <div className="wizard-skeleton wizard-skeleton-text w-24 h-4" />
          {/* Input */}
          <div className="wizard-skeleton h-11 rounded-lg" />
          {/* Label */}
          <div className="wizard-skeleton wizard-skeleton-text w-32 h-4 mt-4" />
          {/* Textarea */}
          <div className="wizard-skeleton h-24 rounded-lg" />
          {/* Helper text */}
          <div className="wizard-skeleton wizard-skeleton-text w-48 h-3" />
        </div>
      );

    case 'card':
      return (
        <div className="space-y-3 animate-pulse">
          <div className="wizard-skeleton wizard-skeleton-card" />
          <div className="wizard-skeleton wizard-skeleton-card" />
        </div>
      );

    case 'list':
      return (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border-light)' }}>
              <div className="wizard-skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="wizard-skeleton h-4 w-3/4" />
                <div className="wizard-skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'signature':
      return (
        <div className="animate-pulse">
          <div className="wizard-skeleton h-4 w-32 mb-2" />
          <div
            className="wizard-skeleton rounded-lg"
            style={{ height: '120px' }}
          />
          <div className="flex gap-2 mt-2">
            <div className="wizard-skeleton h-9 w-20 rounded-md" />
            <div className="wizard-skeleton h-9 w-20 rounded-md" />
          </div>
        </div>
      );

    case 'full':
      return (
        <div className="space-y-6 animate-pulse p-4">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <div className="wizard-skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <div className="wizard-skeleton h-5 w-40 mb-1" />
              <div className="wizard-skeleton h-3 w-24" />
            </div>
          </div>

          {/* Progress bar skeleton */}
          <div className="wizard-skeleton h-1.5 rounded-full" />

          {/* Guidance box skeleton */}
          <div className="wizard-skeleton h-16 rounded-lg" />

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="wizard-skeleton h-4 w-24" />
            <div className="wizard-skeleton h-11 rounded-lg" />
            <div className="wizard-skeleton h-4 w-32 mt-4" />
            <div className="wizard-skeleton h-24 rounded-lg" />
          </div>

          {/* Navigation skeleton */}
          <div className="flex justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="wizard-skeleton h-10 w-24 rounded-lg" />
            <div className="wizard-skeleton h-10 w-28 rounded-lg" />
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default WizardSkeleton;
