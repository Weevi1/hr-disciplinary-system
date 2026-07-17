"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDemoOrganization = exports.resetDemoOrganization = exports.createDemoProspectLogin = exports.deployDemoOrganization = exports.cleanupExpiredResponseTokens = exports.revokeResponseToken = exports.uploadResponseEvidence = exports.submitEmployeeAppeal = exports.submitEmployeeResponse = exports.getWarningPDFForResponse = exports.getWarningForResponse = exports.generateResponseToken = exports.notifyHRPrintedCollection = exports.deliverWarningByEmail = exports.notifyHROnAppeal = exports.manualReviewCheckAll = exports.testReviewFollowUp = exports.checkDueReviewsDaily = exports.getActiveWarningsServerSide = exports.getServerTime = exports.getApiVersionInfo = exports.updateUserPermissions = exports.refreshOrganizationUserClaims = exports.getUserClaims = exports.refreshUserClaims = exports.previewAudioCleanup = exports.getGlobalAudioStats = exports.getCleanupStats = exports.manualAudioCleanup = exports.cleanupExpiredAudio = exports.createOrganizationUser = exports.createResellerUser = exports.resetUserPassword = exports.createOrganizationUsers = exports.createOrganizationAdmin = exports.submitDemoRequest = exports.cleanupExpiredTokens = exports.revokeTemporaryToken = exports.validateTemporaryToken = exports.downloadTempFile = exports.generateTemporaryDownloadLink = void 0;
// functions/src/index.ts
// Main Firebase Functions entry point
const v2_1 = require("firebase-functions/v2");
// Conservative defaults applied to every function unless overridden inline.
// Keeps Cloud Run CPU reservation low (us-central1 quota pressure) and caps
// runaway scaling. Per-function `cpu` / `memory` / `maxInstances` overrides
// in individual function definitions take precedence.
(0, v2_1.setGlobalOptions)({
    region: 'us-central1',
    cpu: 0.5,
    maxInstances: 10,
    memory: '256MiB',
});
const userCreationService_1 = require("./Auth/userCreationService");
Object.defineProperty(exports, "createOrganizationAdmin", { enumerable: true, get: function () { return userCreationService_1.createOrganizationAdmin; } });
Object.defineProperty(exports, "createOrganizationUsers", { enumerable: true, get: function () { return userCreationService_1.createOrganizationUsers; } });
Object.defineProperty(exports, "resetUserPassword", { enumerable: true, get: function () { return userCreationService_1.resetUserPassword; } });
Object.defineProperty(exports, "createResellerUser", { enumerable: true, get: function () { return userCreationService_1.createResellerUser; } });
// 🎯 ADD AUDIO CLEANUP FUNCTIONS
const audioCleanup_1 = require("./audioCleanup");
Object.defineProperty(exports, "cleanupExpiredAudio", { enumerable: true, get: function () { return audioCleanup_1.cleanupExpiredAudio; } });
Object.defineProperty(exports, "manualAudioCleanup", { enumerable: true, get: function () { return audioCleanup_1.manualAudioCleanup; } });
Object.defineProperty(exports, "getCleanupStats", { enumerable: true, get: function () { return audioCleanup_1.getCleanupStats; } });
Object.defineProperty(exports, "getGlobalAudioStats", { enumerable: true, get: function () { return audioCleanup_1.getGlobalAudioStats; } });
Object.defineProperty(exports, "previewAudioCleanup", { enumerable: true, get: function () { return audioCleanup_1.previewAudioCleanup; } });
// 🔗 ADD TEMPORARY DOWNLOAD FUNCTIONS
var temporaryDownload_1 = require("./temporaryDownload");
Object.defineProperty(exports, "generateTemporaryDownloadLink", { enumerable: true, get: function () { return temporaryDownload_1.generateTemporaryDownloadLink; } });
Object.defineProperty(exports, "downloadTempFile", { enumerable: true, get: function () { return temporaryDownload_1.downloadTempFile; } });
Object.defineProperty(exports, "validateTemporaryToken", { enumerable: true, get: function () { return temporaryDownload_1.validateTemporaryToken; } });
Object.defineProperty(exports, "revokeTemporaryToken", { enumerable: true, get: function () { return temporaryDownload_1.revokeTemporaryToken; } });
Object.defineProperty(exports, "cleanupExpiredTokens", { enumerable: true, get: function () { return temporaryDownload_1.cleanupExpiredTokens; } });
// 🎯 LEAD CAPTURE (public demo-request form on the landing page)
var leads_1 = require("./leads");
Object.defineProperty(exports, "submitDemoRequest", { enumerable: true, get: function () { return leads_1.submitDemoRequest; } });
// 🔐 ADD CUSTOM CLAIMS FUNCTIONS
const customClaims_1 = require("./customClaims");
Object.defineProperty(exports, "refreshUserClaims", { enumerable: true, get: function () { return customClaims_1.refreshUserClaims; } });
Object.defineProperty(exports, "getUserClaims", { enumerable: true, get: function () { return customClaims_1.getUserClaims; } });
Object.defineProperty(exports, "refreshOrganizationUserClaims", { enumerable: true, get: function () { return customClaims_1.refreshOrganizationUserClaims; } });
// 👥 ADD ORGANIZATION USER CREATION
const createOrganizationUser_1 = require("./createOrganizationUser");
Object.defineProperty(exports, "createOrganizationUser", { enumerable: true, get: function () { return createOrganizationUser_1.createOrganizationUser; } });
// 🔐 ADD PERMISSION MANAGEMENT
const updateUserPermissions_1 = require("./updateUserPermissions");
Object.defineProperty(exports, "updateUserPermissions", { enumerable: true, get: function () { return updateUserPermissions_1.updateUserPermissions; } });
// 📡 ADD API VERSIONING
const versionInfo_1 = require("./api/versionInfo");
Object.defineProperty(exports, "getApiVersionInfo", { enumerable: true, get: function () { return versionInfo_1.getApiVersionInfo; } });
// ⏰ ADD TIME SERVICE (fraud-proof server time)
const timeService_1 = require("./timeService");
Object.defineProperty(exports, "getServerTime", { enumerable: true, get: function () { return timeService_1.getServerTime; } });
Object.defineProperty(exports, "getActiveWarningsServerSide", { enumerable: true, get: function () { return timeService_1.getActiveWarningsServerSide; } });
// 🔄 ADD REVIEW FOLLOW-UP CRON FUNCTIONS
const reviewFollowUpCron_1 = require("./reviewFollowUpCron");
Object.defineProperty(exports, "checkDueReviewsDaily", { enumerable: true, get: function () { return reviewFollowUpCron_1.checkDueReviewsDaily; } });
Object.defineProperty(exports, "testReviewFollowUp", { enumerable: true, get: function () { return reviewFollowUpCron_1.testReviewFollowUp; } });
Object.defineProperty(exports, "manualReviewCheckAll", { enumerable: true, get: function () { return reviewFollowUpCron_1.manualReviewCheckAll; } });
// 📧 ADD HR NOTIFICATION ON APPEAL
const notifyHROnAppeal_1 = require("./notifyHROnAppeal");
Object.defineProperty(exports, "notifyHROnAppeal", { enumerable: true, get: function () { return notifyHROnAppeal_1.notifyHROnAppeal; } });
// 📧 ADD WARNING DELIVERY
const warningDelivery_1 = require("./warningDelivery");
Object.defineProperty(exports, "deliverWarningByEmail", { enumerable: true, get: function () { return warningDelivery_1.deliverWarningByEmail; } });
Object.defineProperty(exports, "notifyHRPrintedCollection", { enumerable: true, get: function () { return warningDelivery_1.notifyHRPrintedCollection; } });
// 🔗 ADD EMPLOYEE RESPONSE SYSTEM
const employeeResponse_1 = require("./employeeResponse");
Object.defineProperty(exports, "generateResponseToken", { enumerable: true, get: function () { return employeeResponse_1.generateResponseToken; } });
Object.defineProperty(exports, "getWarningForResponse", { enumerable: true, get: function () { return employeeResponse_1.getWarningForResponse; } });
Object.defineProperty(exports, "getWarningPDFForResponse", { enumerable: true, get: function () { return employeeResponse_1.getWarningPDFForResponse; } });
Object.defineProperty(exports, "submitEmployeeResponse", { enumerable: true, get: function () { return employeeResponse_1.submitEmployeeResponse; } });
Object.defineProperty(exports, "submitEmployeeAppeal", { enumerable: true, get: function () { return employeeResponse_1.submitEmployeeAppeal; } });
Object.defineProperty(exports, "uploadResponseEvidence", { enumerable: true, get: function () { return employeeResponse_1.uploadResponseEvidence; } });
Object.defineProperty(exports, "revokeResponseToken", { enumerable: true, get: function () { return employeeResponse_1.revokeResponseToken; } });
Object.defineProperty(exports, "cleanupExpiredResponseTokens", { enumerable: true, get: function () { return employeeResponse_1.cleanupExpiredResponseTokens; } });
// 🧪 ADD RESELLER DEMO MANAGEMENT
const demoManagement_1 = require("./Reseller/demoManagement");
Object.defineProperty(exports, "deployDemoOrganization", { enumerable: true, get: function () { return demoManagement_1.deployDemoOrganization; } });
Object.defineProperty(exports, "createDemoProspectLogin", { enumerable: true, get: function () { return demoManagement_1.createDemoProspectLogin; } });
Object.defineProperty(exports, "resetDemoOrganization", { enumerable: true, get: function () { return demoManagement_1.resetDemoOrganization; } });
Object.defineProperty(exports, "deleteDemoOrganization", { enumerable: true, get: function () { return demoManagement_1.deleteDemoOrganization; } });
//# sourceMappingURL=index.js.map