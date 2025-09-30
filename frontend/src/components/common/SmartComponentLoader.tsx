/**
 * 🚀 SMART COMPONENT LOADER
 * Automatically serves optimal components based on device capabilities
 * 2025 devices get premium features, 2012 devices get functional excellence
 */

import React, { Suspense, lazy, ComponentType } from 'react';
import { ProgressiveEnhancement } from '../../utils/progressiveEnhancement';
import { LegacySkeletonDashboard, LegacyLoadingMessage } from './LegacySkeletonLoader';

interface ComponentVariants<T = any> {
  enhanced?: ComponentType<T>;
  standard?: ComponentType<T>;
  simplified: ComponentType<T>; // Always required as fallback
}

interface SmartLoaderProps<T = any> {
  componentType: string;
  variants: ComponentVariants<T>;
  props: T;
  fallbackComponent?: ComponentType<any>;
  loadingComponent?: ComponentType<any>;
}

/**
 * Smart component loader that serves optimal variant based on device capability
 */
export function SmartComponentLoader<T>({
  componentType,
  variants,
  props,
  fallbackComponent,
  loadingComponent
}: SmartLoaderProps<T>) {
  // Determine which component variant to load
  const strategy = ProgressiveEnhancement.getComponentStrategy(componentType);

  // Select component based on strategy
  let ComponentToRender: ComponentType<T>;

  switch (strategy) {
    case 'enhanced':
      ComponentToRender = variants.enhanced || variants.standard || variants.simplified;
      break;
    case 'standard':
      ComponentToRender = variants.standard || variants.simplified;
      break;
    case 'simplified':
    default:
      ComponentToRender = variants.simplified;
      break;
  }

  // Determine loading component based on device capability
  const LoadingComponent = loadingComponent || (() => {
    const features = ProgressiveEnhancement.analyzeCapabilities();

    if (features.performanceTier === 'low') {
      return <LegacyLoadingMessage message="Loading..." />;
    }

    return <LegacySkeletonDashboard />;
  });

  // Render with suspense for code splitting
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ComponentToRender {...props} />
    </Suspense>
  );
}

/**
 * Higher-order component for creating smart-loading components
 */
export function createSmartComponent<T>(
  componentType: string,
  variants: ComponentVariants<T>
) {
  return (props: T) => (
    <SmartComponentLoader
      componentType={componentType}
      variants={variants}
      props={props}
    />
  );
}

/**
 * Hook for conditional feature rendering
 */
export function useProgressiveFeatures() {
  const features = ProgressiveEnhancement.analyzeCapabilities();
  const thresholds = ProgressiveEnhancement.getLoadingThresholds();

  return {
    // Feature flags
    canUseAdvancedAnimations: ProgressiveEnhancement.shouldEnableFeature('advanced-animations'),
    canUseAudioRecording: ProgressiveEnhancement.shouldEnableFeature('audio-recording'),
    canUseBackgroundBlur: ProgressiveEnhancement.shouldEnableFeature('background-blur'),
    canUseVirtualizedLists: ProgressiveEnhancement.shouldEnableFeature('virtualized-lists'),
    canUseOfflineSupport: ProgressiveEnhancement.shouldEnableFeature('offline-support'),

    // Performance thresholds
    employeeListLimit: thresholds.employeeListLimit,
    warningHistoryLimit: thresholds.warningHistoryLimit,
    animationDuration: thresholds.animationDuration,
    debounceDelay: thresholds.debounceDelay,

    // Capability info
    performanceTier: features.performanceTier,
    visualLevel: features.visualLevel,
    interactionLevel: features.interactionLevel,

    // Utility functions
    shouldShowFeature: (feature: string) => ProgressiveEnhancement.shouldEnableFeature(feature),
    getComponentStrategy: (type: string) => ProgressiveEnhancement.getComponentStrategy(type)
  };
}

/**
 * Component for conditionally rendering based on device capabilities
 */
interface ConditionalRenderProps {
  feature?: string;
  performanceTier?: 'high' | 'medium' | 'low';
  visualLevel?: 'premium' | 'standard' | 'simplified';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  feature,
  performanceTier,
  visualLevel,
  fallback = null,
  children
}) => {
  const features = ProgressiveEnhancement.analyzeCapabilities();

  let shouldRender = true;

  if (feature) {
    shouldRender = ProgressiveEnhancement.shouldEnableFeature(feature);
  }

  if (performanceTier && shouldRender) {
    shouldRender = features.performanceTier === performanceTier;
  }

  if (visualLevel && shouldRender) {
    shouldRender = features.visualLevel === visualLevel;
  }

  return shouldRender ? <>{children}</> : <>{fallback}</>;
};

/**
 * Enhanced wrapper that adds progressive enhancement classes
 */
interface EnhancedWrapperProps {
  className?: string;
  children: React.ReactNode;
  enhancementLevel?: 'auto' | 'force-modern' | 'force-legacy';
}

export const EnhancedWrapper: React.FC<EnhancedWrapperProps> = ({
  className = '',
  children,
  enhancementLevel = 'auto'
}) => {
  const progressiveClasses = ProgressiveEnhancement.getCSSClasses();

  let finalClasses = className;

  if (enhancementLevel === 'auto') {
    finalClasses += ' ' + progressiveClasses.join(' ');
  } else if (enhancementLevel === 'force-modern') {
    finalClasses += ' perf-high memory-high visual-premium anim-full';
  } else if (enhancementLevel === 'force-legacy') {
    finalClasses += ' perf-low memory-low visual-simplified anim-minimal legacy-device';
  }

  return (
    <div className={finalClasses.trim()}>
      {children}
    </div>
  );
};

// Pre-configured smart loaders for common components
export const SmartWarningWizard = createSmartComponent('warning-wizard', {
  enhanced: lazy(() => import('../warnings/enhanced/EnhancedWarningWizard').then(m => ({ default: m.EnhancedWarningWizard }))),
  simplified: lazy(() => import('../warnings/SimplifiedWarningWizard').then(m => ({ default: m.SimplifiedWarningWizard })))
});

export const SmartEmployeeManagement = createSmartComponent('employee-management', {
  enhanced: lazy(() => import('../employees/EmployeeManagement')),
  simplified: lazy(() => import('../employees/EmployeeManagement')) // Will use pagination internally
});

export const SmartNavigation = createSmartComponent('navigation', {
  enhanced: lazy(() => import('../../layouts/MainLayout')),
  simplified: lazy(() => import('../../layouts/MainLayout')) // Will use simplified sidebar internally
});