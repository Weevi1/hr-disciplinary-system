import Logger from '../utils/logger';

// src/config/features.ts
// Feature flags for gradual rollout of new functionality

export interface FeatureFlags {
  useNestedDataStructure: boolean;
  enableDualWrite: boolean;
  useCollectionGroupQueries: boolean;
  enableEmployeeSummaryStats: boolean;
  useIndexCollections: boolean;
}

// Feature flags configuration
const FEATURE_FLAGS: FeatureFlags = {
  // Enable nested employee-centric data structure
  useNestedDataStructure: import.meta.env.VITE_USE_NESTED_STRUCTURE === 'true',

  // Enable dual-write to both flat and nested collections during migration
  enableDualWrite: false, // Temporarily disabled due to Firestore path issues

  // Enable collection group queries for organization-wide data
  useCollectionGroupQueries: import.meta.env.VITE_USE_COLLECTION_GROUP === 'true',

  // Enable employee summary statistics documents
  enableEmployeeSummaryStats: import.meta.env.VITE_ENABLE_SUMMARY_STATS === 'true',

  // Enable index collections for fast dashboard queries
  useIndexCollections: import.meta.env.VITE_USE_INDEX_COLLECTIONS === 'true'
};

/**
 * Get feature flag value
 */
export function getFeatureFlag(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Check if nested data structure should be used
 */
export function useNestedStructure(): boolean {
  return getFeatureFlag('useNestedDataStructure');
}

/**
 * Check if dual write mode is enabled
 */
export function isDualWriteEnabled(): boolean {
  return getFeatureFlag('enableDualWrite');
}

/**
 * Check if collection group queries should be used
 */
export function useCollectionGroup(): boolean {
  return getFeatureFlag('useCollectionGroupQueries');
}

/**
 * Check if employee summary stats are enabled
 */
export function useSummaryStats(): boolean {
  return getFeatureFlag('enableEmployeeSummaryStats');
}

/**
 * Check if index collections should be used
 */
export function useIndexes(): boolean {
  return getFeatureFlag('useIndexCollections');
}

/**
 * Get all feature flags for debugging
 */
export function getAllFeatureFlags(): FeatureFlags {
  return { ...FEATURE_FLAGS };
}

/**
 * Log current feature flag configuration
 */
export function logFeatureFlags(): void {
  Logger.debug('🚩 Feature Flags Configuration:', FEATURE_FLAGS);
}

// Development environment defaults (for .env.development)
export const DEVELOPMENT_DEFAULTS = {
  VITE_USE_NESTED_STRUCTURE: 'false',
  VITE_ENABLE_DUAL_WRITE: 'false',
  VITE_USE_COLLECTION_GROUP: 'false',
  VITE_ENABLE_SUMMARY_STATS: 'false',
  VITE_USE_INDEX_COLLECTIONS: 'false'
};

// Production rollout environment variables (for .env.production)
export const PRODUCTION_ROLLOUT = {
  VITE_USE_NESTED_STRUCTURE: 'true',
  VITE_ENABLE_DUAL_WRITE: 'true',
  VITE_USE_COLLECTION_GROUP: 'true',
  VITE_ENABLE_SUMMARY_STATS: 'true',
  VITE_USE_INDEX_COLLECTIONS: 'true'
};