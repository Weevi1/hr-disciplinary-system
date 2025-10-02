// functions/src/api/versionInfo.ts
// API Version Information Endpoint
// Returns current API version and compatibility info

import { onCall } from 'firebase-functions/v2/https';
import {
  CURRENT_API_VERSION,
  API_VERSIONS,
  getSupportedVersions,
  createVersionedResponse
} from '../middleware/apiVersioning';

/**
 * Public endpoint to get API version information
 * No authentication required - helps clients check compatibility
 */
export const getApiVersionInfo = onCall(async (request) => {
  const supportedVersions = getSupportedVersions();

  const versionInfo = {
    current: CURRENT_API_VERSION,
    supported: supportedVersions,
    versions: API_VERSIONS,
    compatibility: {
      minimumVersion: '1.0.0',
      recommendedVersion: CURRENT_API_VERSION
    },
    documentation: 'https://docs.hr-disciplinary-system.com/api/versioning'
  };

  return createVersionedResponse('getApiVersionInfo', versionInfo);
});
