// frontend/src/services/versionedApi.ts
// Versioned API wrapper for Cloud Functions calls
// Automatically includes version info and handles versioned responses

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import {
  CURRENT_API_VERSION,
  isVersionCompatible,
  handleDeprecationWarning,
  type VersionedApiResponse
} from '@/config/apiVersion';
import { logError } from '@/config/sentry';

/**
 * Call a Cloud Function with automatic API versioning
 *
 * @param functionName - Name of the Cloud Function
 * @param data - Data to send to the function
 * @param options - Optional configuration
 * @returns The unwrapped response data
 *
 * @example
 * const userData = await callVersionedFunction('getUserClaims', {});
 */
export async function callVersionedFunction<TData = any, TResult = any>(
  functionName: string,
  data: TData = {} as TData,
  options: {
    timeout?: number;
    region?: string;
  } = {}
): Promise<TResult> {
  try {
    const functions = getFunctions(undefined, options.region);

    // Set timeout if specified
    if (options.timeout) {
      functions.customDomain = null; // Reset any custom domain
    }

    const callable = httpsCallable<any, VersionedApiResponse<TResult>>(
      functions,
      functionName
    );

    // Add API version to request
    const requestData = {
      ...data,
      apiVersion: CURRENT_API_VERSION
    };

    // Call the function
    const result: HttpsCallableResult<VersionedApiResponse<TResult>> = await callable(requestData);
    const response = result.data;

    // Check if response has version metadata
    if (response.metadata) {
      // Verify API version compatibility
      if (!isVersionCompatible(response.metadata.version)) {
        const errorMsg = `API version mismatch: Backend ${response.metadata.version}, Frontend expects ${CURRENT_API_VERSION}`;
        console.error(errorMsg);
        logError(new Error(errorMsg), {
          component: 'versionedApi',
          functionName,
          backendVersion: response.metadata.version,
          frontendVersion: CURRENT_API_VERSION
        });
      }

      // Handle deprecation warnings
      handleDeprecationWarning(functionName, response.metadata);
    }

    // Check for errors in response
    if (!response.success && response.error) {
      throw new Error(response.error.message || 'Function call failed');
    }

    // Return unwrapped data
    return response.data as TResult;

  } catch (error) {
    console.error(`❌ [API] ${functionName} failed:`, error);

    // Log to Sentry
    logError(error as Error, {
      component: 'versionedApi',
      functionName,
      requestData: data
    });

    throw error;
  }
}

/**
 * Get API version information from backend
 * Used for compatibility checks and monitoring
 */
export async function getApiVersion(): Promise<{
  current: string;
  supported: string[];
  compatible: boolean;
}> {
  try {
    const versionInfo = await callVersionedFunction<{}, {
      current: string;
      supported: string[];
      versions: Record<string, any>;
      compatibility: {
        minimumVersion: string;
        recommendedVersion: string;
      };
    }>('getApiVersionInfo');

    const compatible = isVersionCompatible(versionInfo.current);

    return {
      current: versionInfo.current,
      supported: versionInfo.supported,
      compatible
    };

  } catch (error) {
    console.error('Failed to get API version info:', error);
    return {
      current: 'unknown',
      supported: [],
      compatible: false
    };
  }
}

/**
 * Check API compatibility on app startup
 * Logs warnings if versions are mismatched
 */
export async function checkApiCompatibility(): Promise<boolean> {
  try {
    const versionInfo = await getApiVersion();

    if (!versionInfo.compatible) {
      console.error(
        `⚠️ API VERSION MISMATCH!\n` +
        `Backend: ${versionInfo.current}\n` +
        `Frontend: ${CURRENT_API_VERSION}\n` +
        `Please update the application.`
      );
      return false;
    }

    if (versionInfo.current !== CURRENT_API_VERSION) {
      console.warn(
        `ℹ️ API versions differ:\n` +
        `Backend: ${versionInfo.current}\n` +
        `Frontend: ${CURRENT_API_VERSION}\n` +
        `Application will work but consider updating.`
      );
    }

    console.log(`✅ API Version: ${versionInfo.current} (compatible)`);
    return true;

  } catch (error) {
    console.warn('Could not verify API compatibility:', error);
    return true; // Don't block app if version check fails
  }
}
