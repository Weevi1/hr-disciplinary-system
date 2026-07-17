// functions/src/index.ts
// Main Firebase Functions entry point
import { setGlobalOptions } from 'firebase-functions/v2';

// Conservative defaults applied to every function unless overridden inline.
// Keeps Cloud Run CPU reservation low (us-central1 quota pressure) and caps
// runaway scaling. Per-function `cpu` / `memory` / `maxInstances` overrides
// in individual function definitions take precedence.
setGlobalOptions({
  region: 'us-central1',
  cpu: 0.5,
  maxInstances: 10,
  memory: '256MiB',
});

import {
  createOrganizationAdmin,
  createOrganizationUsers,
  resetUserPassword,
  createResellerUser
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

// 🔐 ADD CUSTOM CLAIMS FUNCTIONS
import {
  refreshUserClaims,
  getUserClaims,
  refreshOrganizationUserClaims
} from './customClaims';

// 👥 ADD ORGANIZATION USER CREATION
import { createOrganizationUser } from './createOrganizationUser';

// 🔐 ADD PERMISSION MANAGEMENT
import { updateUserPermissions } from './updateUserPermissions';

// 📡 ADD API VERSIONING
import { getApiVersionInfo } from './api/versionInfo';

// ⏰ ADD TIME SERVICE (fraud-proof server time)
import { getServerTime, getActiveWarningsServerSide } from './timeService';

// 🔄 ADD REVIEW FOLLOW-UP CRON FUNCTIONS
import {
  checkDueReviewsDaily,
  testReviewFollowUp,
  manualReviewCheckAll
} from './reviewFollowUpCron';

// 📧 ADD HR NOTIFICATION ON APPEAL
import { notifyHROnAppeal } from './notifyHROnAppeal';

// 📧 ADD WARNING DELIVERY
import { deliverWarningByEmail, notifyHRPrintedCollection } from './warningDelivery';

// 🔗 ADD EMPLOYEE RESPONSE SYSTEM
import {
  generateResponseToken,
  getWarningForResponse,
  getWarningPDFForResponse,
  submitEmployeeResponse,
  submitEmployeeAppeal,
  uploadResponseEvidence,
  revokeResponseToken,
  cleanupExpiredResponseTokens
} from './employeeResponse';

// 🧪 ADD RESELLER DEMO MANAGEMENT
import {
  deployDemoOrganization,
  createDemoProspectLogin,
  resetDemoOrganization,
  deleteDemoOrganization
} from './Reseller/demoManagement';

// Export all cloud functions
export {
  // User/Auth functions
  createOrganizationAdmin,
  createOrganizationUsers,
  resetUserPassword,
  createResellerUser,
  createOrganizationUser,

  // Audio cleanup functions
  cleanupExpiredAudio,
  manualAudioCleanup,
  getCleanupStats,
  getGlobalAudioStats,
  previewAudioCleanup,

  // Custom claims & sharded auth functions
  refreshUserClaims,
  getUserClaims,
  refreshOrganizationUserClaims,

  // Permission management functions
  updateUserPermissions,

  // API versioning
  getApiVersionInfo,

  // Time service (fraud-proof timestamps)
  getServerTime,
  getActiveWarningsServerSide,

  // Review follow-up cron functions
  checkDueReviewsDaily,
  testReviewFollowUp,
  manualReviewCheckAll,

  // Email notification functions
  notifyHROnAppeal,
  deliverWarningByEmail,
  notifyHRPrintedCollection,

  // Employee response system
  generateResponseToken,
  getWarningForResponse,
  getWarningPDFForResponse,
  submitEmployeeResponse,
  submitEmployeeAppeal,
  uploadResponseEvidence,
  revokeResponseToken,
  cleanupExpiredResponseTokens,

  // Reseller demo management
  deployDemoOrganization,
  createDemoProspectLogin,
  resetDemoOrganization,
  deleteDemoOrganization
};