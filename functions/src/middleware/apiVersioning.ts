// functions/src/middleware/apiVersioning.ts
// API Versioning Middleware for Cloud Functions
// Provides consistent versioning across all Cloud Functions

import { HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

/**
 * Current API version
 * Increment when making breaking changes
 */
export const CURRENT_API_VERSION = '1.0.0';

/**
 * API version metadata
 */
export interface ApiVersion {
  version: string;
  releaseDate: string;
  deprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  breaking: boolean;
}

/**
 * Version registry - tracks all API versions
 */
export const API_VERSIONS: Record<string, ApiVersion> = {
  '1.0.0': {
    version: '1.0.0',
    releaseDate: '2025-10-02',
    deprecated: false,
    breaking: false
  }
};

/**
 * Standard API response wrapper with versioning
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
 * Wraps Cloud Function responses with version metadata
 */
export function createVersionedResponse<T>(
  functionName: string,
  data: T,
  options: {
    success?: boolean;
    version?: string;
    deprecated?: boolean;
    deprecationWarning?: string;
  } = {}
): VersionedApiResponse<T> {
  const version = options.version || CURRENT_API_VERSION;
  const versionInfo = API_VERSIONS[version];

  return {
    success: options.success !== false,
    data,
    metadata: {
      version,
      timestamp: Date.now(),
      functionName,
      deprecated: options.deprecated || versionInfo?.deprecated || false,
      deprecationWarning: options.deprecationWarning || versionInfo?.deprecationDate
        ? `This API version will be deprecated on ${versionInfo.deprecationDate}`
        : undefined
    }
  };
}

/**
 * Wraps Cloud Function errors with version metadata
 */
export function createVersionedError(
  functionName: string,
  code: string,
  message: string,
  details?: any,
  options: {
    version?: string;
  } = {}
): VersionedApiResponse {
  const version = options.version || CURRENT_API_VERSION;

  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    metadata: {
      version,
      timestamp: Date.now(),
      functionName
    }
  };
}

/**
 * Middleware to check API version compatibility
 */
export function checkApiVersion(request: CallableRequest, functionName: string): void {
  // Get requested version from client (if provided)
  const requestedVersion = request.data?.apiVersion as string | undefined;

  // If client specifies version, validate it
  if (requestedVersion) {
    const versionInfo = API_VERSIONS[requestedVersion];

    if (!versionInfo) {
      logger.warn(`⚠️ [API VERSION] Unknown version requested: ${requestedVersion} for ${functionName}`);
      throw new HttpsError(
        'failed-precondition',
        `API version ${requestedVersion} is not supported. Current version: ${CURRENT_API_VERSION}`
      );
    }

    // Check if version is deprecated
    if (versionInfo.deprecated) {
      logger.warn(
        `⚠️ [API VERSION] Deprecated version ${requestedVersion} used for ${functionName}. ` +
        `Sunset date: ${versionInfo.sunsetDate || 'TBD'}`
      );
    }

    // Check if version has reached sunset date
    if (versionInfo.sunsetDate) {
      const sunsetDate = new Date(versionInfo.sunsetDate);
      if (new Date() > sunsetDate) {
        throw new HttpsError(
          'failed-precondition',
          `API version ${requestedVersion} has been sunset. Please upgrade to ${CURRENT_API_VERSION}`
        );
      }
    }
  }

  logger.info(`📡 [API VERSION] ${functionName} called with version: ${requestedVersion || CURRENT_API_VERSION}`);
}

/**
 * Wrapper for Cloud Functions that automatically adds versioning
 */
export function versionedFunction<TRequest = any, TResponse = any>(
  functionName: string,
  handler: (request: CallableRequest<TRequest>) => Promise<TResponse>
) {
  return async (request: CallableRequest<TRequest>): Promise<VersionedApiResponse<TResponse>> => {
    try {
      // Check API version compatibility
      checkApiVersion(request, functionName);

      // Execute the actual function
      const result = await handler(request);

      // Wrap response with version metadata
      return createVersionedResponse(functionName, result);

    } catch (error) {
      logger.error(`❌ [${functionName}] Error:`, error);

      // Handle HttpsError
      if (error instanceof HttpsError) {
        throw error;
      }

      // Wrap unexpected errors with version metadata
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', errorMessage);
    }
  };
}

/**
 * Log API usage statistics for monitoring
 */
export function logApiUsage(
  functionName: string,
  version: string,
  userId?: string,
  organizationId?: string
): void {
  logger.info('📊 [API USAGE]', {
    function: functionName,
    version,
    userId,
    organizationId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get version compatibility info
 */
export function getVersionInfo(version: string = CURRENT_API_VERSION): ApiVersion | null {
  return API_VERSIONS[version] || null;
}

/**
 * Check if a specific version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  const versionInfo = API_VERSIONS[version];
  return versionInfo?.deprecated || false;
}

/**
 * Get all supported versions
 */
export function getSupportedVersions(): string[] {
  return Object.keys(API_VERSIONS).filter(v => {
    const info = API_VERSIONS[v];
    // Filter out sunset versions
    if (info.sunsetDate) {
      return new Date() <= new Date(info.sunsetDate);
    }
    return true;
  });
}
