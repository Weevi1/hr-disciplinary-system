"use strict";
// functions/src/temporaryDownload.ts
// 🔗 FIREBASE CLOUD FUNCTIONS FOR TEMPORARY PDF DOWNLOAD LINKS
// ✅ Generates secure time-limited download links with JWT tokens
// ✅ Validates user authentication and permissions
// ✅ Stores and manages temporary file access
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredTokens = exports.revokeTemporaryToken = exports.validateTemporaryToken = exports.downloadTempFile = exports.generateTemporaryDownloadLink = void 0;
const admin = __importStar(require("firebase-admin"));
const jwt = __importStar(require("jsonwebtoken"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
// Signing secret for temporary-download JWTs. Sourced via firebase-functions params
// (set TEMP_LINK_SECRET in functions/.env). No insecure hardcoded fallback — see getJWTSecret.
const tempLinkSecret = (0, params_1.defineString)('TEMP_LINK_SECRET');
// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const storage = admin.storage();
// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Generate JWT secret from Firebase project config
 */
function getJWTSecret() {
    // Use Firebase project ID and a secret from environment.
    // Fail closed: no predictable default — TEMP_LINK_SECRET must be configured.
    const projectId = process.env.GCLOUD_PROJECT;
    const secretSuffix = tempLinkSecret.value();
    if (!secretSuffix) {
        throw new Error('TEMP_LINK_SECRET is not configured — set it in functions/.env');
    }
    return `${projectId}-${secretSuffix}`;
}
/**
 * Verify user authentication
 */
async function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new https_1.HttpsError('unauthenticated', 'Missing or invalid authorization header');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        return await admin.auth().verifyIdToken(idToken);
    }
    catch (_a) {
        throw new https_1.HttpsError('unauthenticated', 'Invalid authentication token');
    }
}
/**
 * Store temporary file in Firebase Storage
 */
async function storeTemporaryFile(fileData, filename, tokenId) {
    try {
        // Convert base64 to buffer
        const buffer = Buffer.from(fileData, 'base64');
        // Create storage path
        const storagePath = `temp-downloads/${tokenId}/${filename}`;
        const file = storage.bucket().file(storagePath);
        // Upload with metadata
        await file.save(buffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    tokenId,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + (60 * 60 * 1000)).toISOString() // 1 hour
                }
            }
        });
        return storagePath;
    }
    catch (error) {
        console.error('❌ File storage failed:', error);
        throw new https_1.HttpsError('internal', 'Failed to store temporary file');
    }
}
// v2 onRequest options shared by the CORS-enabled callable surfaces.
// v2 native CORS handles OPTIONS preflight + headers; no manual res.set() needed.
const HTTP_OPTS = { region: 'us-central1', cors: true, invoker: 'public' };
// ============================================
// CLOUD FUNCTIONS
// ============================================
/**
 * Generate temporary download link with token
 */
exports.generateTemporaryDownloadLink = (0, https_1.onRequest)(HTTP_OPTS, async (req, res) => {
    console.log('🔧 Function called, method:', req.method, 'origin:', req.headers.origin);
    try {
        // Only allow POST requests (cors: true handles OPTIONS preflight already)
        if (req.method !== 'POST') {
            res.status(405).json({ error: { message: 'Method not allowed' } });
            return;
        }
        // Verify authentication
        const decodedToken = await verifyAuth(req);
        // Parse request data
        const requestData = req.body.data;
        if (!requestData || !requestData.filename || !requestData.fileData || !requestData.tokenId) {
            res.status(400).json({
                error: { message: 'Missing required fields: filename, fileData, tokenId' }
            });
            return;
        }
        // Store temporary file
        const storagePath = await storeTemporaryFile(requestData.fileData, requestData.filename, requestData.tokenId);
        // Create JWT token
        const expiryTime = Date.now() + (requestData.expiryHours * 60 * 60 * 1000);
        const tokenPayload = {
            sub: decodedToken.uid,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(expiryTime / 1000),
            aud: 'hr-disciplinary-system',
            iss: 'hr-temp-download-service',
            filename: requestData.filename,
            employeeId: requestData.employeeId,
            warningId: requestData.warningId,
            organizationId: requestData.organizationId,
            tokenId: requestData.tokenId,
            fileStoragePath: storagePath
        };
        const jwtToken = jwt.sign(tokenPayload, getJWTSecret());
        // Store token metadata in Firestore
        await db.collection('temporaryDownloadTokens').doc(requestData.tokenId).set({
            tokenId: requestData.tokenId,
            userId: decodedToken.uid,
            filename: requestData.filename,
            employeeId: requestData.employeeId || null,
            warningId: requestData.warningId || null,
            organizationId: requestData.organizationId || null,
            fileStoragePath: storagePath,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(expiryTime),
            isRevoked: false,
            downloadCount: 0,
            lastAccessed: null
        });
        // Generate download URL
        const downloadUrl = `${req.protocol}://${req.get('host')}/downloadTempFile?token=${jwtToken}`;
        const response = {
            downloadUrl,
            tokenId: requestData.tokenId,
            expiresAt: new Date(expiryTime).toISOString(),
            filename: requestData.filename
        };
        res.status(200).json({ data: response });
    }
    catch (error) {
        console.error('❌ Generate temporary link error:', error);
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).json({
                error: { message: error.message }
            });
            return;
        }
        res.status(500).json({
            error: { message: 'Internal server error' }
        });
    }
});
/**
 * Download temporary file using JWT token
 */
exports.downloadTempFile = (0, https_1.onRequest)(HTTP_OPTS, async (req, res) => {
    try {
        // Get token from query parameters
        const token = req.query.token;
        if (!token) {
            res.status(400).json({ error: 'Missing token parameter' });
            return;
        }
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, getJWTSecret());
        }
        catch (_a) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        // Check if token is revoked
        const tokenDoc = await db.collection('temporaryDownloadTokens').doc(decoded.tokenId).get();
        if (!tokenDoc.exists) {
            res.status(404).json({ error: 'Token not found' });
            return;
        }
        const tokenData = tokenDoc.data();
        if (tokenData.isRevoked) {
            res.status(403).json({ error: 'Token has been revoked' });
            return;
        }
        // Check if token has expired
        if (Date.now() > decoded.exp * 1000) {
            res.status(401).json({ error: 'Token has expired' });
            return;
        }
        // Get file from storage
        const file = storage.bucket().file(decoded.fileStoragePath);
        try {
            const [exists] = await file.exists();
            if (!exists) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            // Update access tracking
            await db.collection('temporaryDownloadTokens').doc(decoded.tokenId).update({
                downloadCount: admin.firestore.FieldValue.increment(1),
                lastAccessed: admin.firestore.FieldValue.serverTimestamp()
            });
            // Set response headers
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${decoded.filename}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            // Stream file to response
            const stream = file.createReadStream();
            stream.pipe(res);
            // Don't return anything after streaming starts
            return;
        }
        catch (error) {
            console.error('❌ File download error:', error);
            res.status(500).json({ error: 'File download failed' });
            return;
        }
    }
    catch (error) {
        console.error('❌ Download handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
/**
 * Validate temporary token (without downloading)
 */
exports.validateTemporaryToken = (0, https_1.onRequest)(HTTP_OPTS, async (req, res) => {
    var _a;
    console.log('🔧 ValidateToken called, method:', req.method, 'origin:', req.headers.origin);
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: { message: 'Method not allowed' } });
            return;
        }
        const { token } = req.body.data;
        if (!token) {
            res.status(400).json({
                error: { message: 'Missing token' }
            });
            return;
        }
        try {
            const decoded = jwt.verify(token, getJWTSecret());
            // Check if token exists and is not revoked
            const tokenDoc = await db.collection('temporaryDownloadTokens').doc(decoded.tokenId).get();
            const isValid = tokenDoc.exists &&
                !((_a = tokenDoc.data()) === null || _a === void 0 ? void 0 : _a.isRevoked) &&
                Date.now() < decoded.exp * 1000;
            res.status(200).json({
                data: {
                    valid: isValid,
                    expiresAt: isValid ? new Date(decoded.exp * 1000).toISOString() : null
                }
            });
            return;
        }
        catch (_b) {
            res.status(200).json({ data: { valid: false } });
            return;
        }
    }
    catch (error) {
        console.error('❌ Token validation error:', error);
        res.status(500).json({
            error: { message: 'Internal server error' }
        });
    }
});
/**
 * Revoke temporary token
 */
exports.revokeTemporaryToken = (0, https_1.onRequest)(HTTP_OPTS, async (req, res) => {
    console.log('🔧 RevokeToken called, method:', req.method, 'origin:', req.headers.origin);
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: { message: 'Method not allowed' } });
            return;
        }
        // Verify authentication
        const decodedToken = await verifyAuth(req);
        const { tokenId } = req.body.data;
        if (!tokenId) {
            res.status(400).json({
                error: { message: 'Missing tokenId' }
            });
            return;
        }
        // Check if token exists and belongs to user
        const tokenDoc = await db.collection('temporaryDownloadTokens').doc(tokenId).get();
        if (!tokenDoc.exists) {
            res.status(404).json({
                error: { message: 'Token not found' }
            });
            return;
        }
        const tokenData = tokenDoc.data();
        if (tokenData.userId !== decodedToken.uid) {
            res.status(403).json({
                error: { message: 'Unauthorized to revoke this token' }
            });
            return;
        }
        // Revoke token
        await db.collection('temporaryDownloadTokens').doc(tokenId).update({
            isRevoked: true,
            revokedAt: admin.firestore.FieldValue.serverTimestamp(),
            revokedBy: decodedToken.uid
        });
        // Clean up file from storage
        try {
            const file = storage.bucket().file(tokenData.fileStoragePath);
            await file.delete();
        }
        catch (error) {
            console.warn('⚠️ Failed to delete temporary file:', error);
        }
        res.status(200).json({
            data: { revoked: true }
        });
    }
    catch (error) {
        console.error('❌ Token revocation error:', error);
        if (error instanceof https_1.HttpsError) {
            res.status(error.httpErrorCode.status).json({
                error: { message: error.message }
            });
            return;
        }
        res.status(500).json({
            error: { message: 'Internal server error' }
        });
    }
});
/**
 * Cleanup expired tokens and files (scheduled function)
 */
exports.cleanupExpiredTokens = (0, scheduler_1.onSchedule)({ schedule: 'every 6 hours', region: 'us-central1' }, async (_event) => {
    try {
        const now = new Date();
        // Find expired tokens
        const expiredTokensSnapshot = await db
            .collection('temporaryDownloadTokens')
            .where('expiresAt', '<=', now)
            .get();
        console.log(`🧹 Found ${expiredTokensSnapshot.size} expired tokens to clean up`);
        const batch = db.batch();
        const filesToDelete = [];
        expiredTokensSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Mark for deletion
            batch.delete(doc.ref);
            // Add file to cleanup list
            if (data.fileStoragePath) {
                filesToDelete.push(data.fileStoragePath);
            }
        });
        // Delete Firestore records
        await batch.commit();
        // Delete files from storage
        const deletePromises = filesToDelete.map(async (filePath) => {
            try {
                const file = storage.bucket().file(filePath);
                await file.delete();
            }
            catch (error) {
                console.warn(`⚠️ Failed to delete file ${filePath}:`, error);
            }
        });
        await Promise.allSettled(deletePromises);
        console.log(`✅ Cleaned up ${expiredTokensSnapshot.size} expired tokens and files`);
    }
    catch (error) {
        console.error('❌ Cleanup failed:', error);
        // Re-throw to mark the scheduled run as failed (Cloud Scheduler will retry)
        throw error;
    }
});
//# sourceMappingURL=temporaryDownload.js.map