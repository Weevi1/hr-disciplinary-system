// functions/src/index.ts
// Main Firebase Functions entry point
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

// 💰 ADD BILLING FUNCTIONS
import {
  createCheckoutSession,
  stripeWebhook,
  processMonthlyCommissions,
  createPortalSession
} from './billing';

// 🔐 ADD CUSTOM CLAIMS FUNCTIONS
import {
  refreshUserClaims,
  getUserClaims,
  refreshOrganizationUserClaims
} from './customClaims';

// 🔒 ADD SUPER USER MANAGEMENT FUNCTIONS
import {
  manageSuperUser,
  getSuperUserInfo,
  initializeSuperUser
} from './superUserManagement';

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
import { deliverWarningByEmail } from './warningDelivery';

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

  // Billing & subscription functions
  createCheckoutSession,
  stripeWebhook,
  processMonthlyCommissions,
  createPortalSession,

  // Custom claims & sharded auth functions
  refreshUserClaims,
  getUserClaims,
  refreshOrganizationUserClaims,

  // Permission management functions
  updateUserPermissions,

  // Super-user management functions
  manageSuperUser,
  getSuperUserInfo,
  initializeSuperUser,

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

  // Employee response system
  generateResponseToken,
  getWarningForResponse,
  getWarningPDFForResponse,
  submitEmployeeResponse,
  submitEmployeeAppeal,
  uploadResponseEvidence,
  revokeResponseToken,
  cleanupExpiredResponseTokens
};