import Logger from '../utils/logger';

// frontend/src/config/apiVersion.ts
// API Version Configuration for Cloud Functions
// Matches backend API versioning system

/**
 * Current API version expected by this frontend build
 * Should match CURRENT_API_VERSION in functions/src/middleware/apiVersioning.ts
 */
export const CURRENT_API_VERSION = '1.0.0';

/**
 * Minimum supported API version
 * Frontend will warn/error if backend is older than this
 */
export const MINIMUM_API_VERSION = '1.0.0';

/**
 * API version metadata interface
 * Matches backend VersionedApiResponse structure
 */
export interface VersionedApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    version: string;
    timestamp: number;
    functionName: string;
    deprecated?: boolean;
    deprecationWarning?: string;
  };
}

/**
 * Check if API version is compatible
 */
export function isVersionCompatible(apiVersion: string): boolean {
  // Simple semantic version comparison
  const [apiMajor] = apiVersion.split('.').map(Number);
  const [minMajor] = MINIMUM_API_VERSION.split('.').map(Number);

  return apiMajor >= minMajor;
}

/**
 * Handle deprecation warnings from API
 */
export function handleDeprecationWarning(
  functionName: string,
  metadata: VersionedApiResponse['metadata']
): void {
  if (metadata.deprecated && metadata.deprecationWarning) {
    Logger.warn(
      `⚠️ [API DEPRECATION] ${functionName} - ${metadata.deprecationWarning}\n` +
      `Please upgrade to avoid service disruption.`
    );
  }
}
