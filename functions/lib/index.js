"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveWarningsServerSide = exports.getServerTime = exports.getApiVersionInfo = exports.initializeSuperUser = exports.getSuperUserInfo = exports.manageSuperUser = exports.updateUserPermissions = exports.refreshOrganizationUserClaims = exports.getUserClaims = exports.refreshUserClaims = exports.createPortalSession = exports.processMonthlyCommissions = exports.stripeWebhook = exports.createCheckoutSession = exports.previewAudioCleanup = exports.getGlobalAudioStats = exports.getCleanupStats = exports.manualAudioCleanup = exports.cleanupExpiredAudio = exports.createOrganizationUser = exports.createResellerUser = exports.resetUserPassword = exports.createOrganizationUsers = exports.createOrganizationAdmin = exports.cleanupExpiredTokens = exports.revokeTemporaryToken = exports.validateTemporaryToken = exports.downloadTempFile = exports.generateTemporaryDownloadLink = void 0;
// functions/src/index.ts
// Main Firebase Functions entry point
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
// 💰 ADD BILLING FUNCTIONS
const billing_1 = require("./billing");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return billing_1.createCheckoutSession; } });
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return billing_1.stripeWebhook; } });
Object.defineProperty(exports, "processMonthlyCommissions", { enumerable: true, get: function () { return billing_1.processMonthlyCommissions; } });
Object.defineProperty(exports, "createPortalSession", { enumerable: true, get: function () { return billing_1.createPortalSession; } });
// 🔐 ADD CUSTOM CLAIMS FUNCTIONS
const customClaims_1 = require("./customClaims");
Object.defineProperty(exports, "refreshUserClaims", { enumerable: true, get: function () { return customClaims_1.refreshUserClaims; } });
Object.defineProperty(exports, "getUserClaims", { enumerable: true, get: function () { return customClaims_1.getUserClaims; } });
Object.defineProperty(exports, "refreshOrganizationUserClaims", { enumerable: true, get: function () { return customClaims_1.refreshOrganizationUserClaims; } });
// 🔒 ADD SUPER USER MANAGEMENT FUNCTIONS
const superUserManagement_1 = require("./superUserManagement");
Object.defineProperty(exports, "manageSuperUser", { enumerable: true, get: function () { return superUserManagement_1.manageSuperUser; } });
Object.defineProperty(exports, "getSuperUserInfo", { enumerable: true, get: function () { return superUserManagement_1.getSuperUserInfo; } });
Object.defineProperty(exports, "initializeSuperUser", { enumerable: true, get: function () { return superUserManagement_1.initializeSuperUser; } });
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
//# sourceMappingURL=index.js.map