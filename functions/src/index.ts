// functions/src/index.ts
// Main Firebase Functions entry point
import { 
  createOrganizationAdmin, 
  createOrganizationUsers, 
  resetUserPassword 
} from './Auth/userCreationService';

// 🎯 ADD AUDIO CLEANUP FUNCTIONS
import {
  cleanupExpiredAudio,
  manualAudioCleanup,
  getCleanupStats,
  getGlobalAudioStats,
  previewAudioCleanup
} from './audioCleanup';

// 🔗 ADD TEMPORARY DOWNLOAD FUNCTIONS
export { generateTemporaryDownloadLink, downloadTempFile, validateTemporaryToken, revokeTemporaryToken, cleanupExpiredTokens } from './temporaryDownload';

// Export all cloud functions
export {
  // User/Auth functions
  createOrganizationAdmin,
  createOrganizationUsers,
  resetUserPassword,
  
  // Audio cleanup functions
  cleanupExpiredAudio,
  manualAudioCleanup,
  getCleanupStats,
  getGlobalAudioStats,
  previewAudioCleanup
};