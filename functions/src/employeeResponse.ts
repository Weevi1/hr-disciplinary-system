// functions/src/employeeResponse.ts
// Cloud Functions for the link-based employee response & appeal system
// Allows employees to respond to warnings via a unique token URL without login

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { sendResponseNotification, sendResponseConfirmation } from './email/sendgridService';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const storage = getStorage();

// ============================================
// CONSTANTS
// ============================================

const TOKEN_LENGTH = 32; // 32 bytes = 64 hex chars
const DEFAULT_EXPIRY_DAYS = 30;
const MAX_VIEWS_PER_HOUR = 20;
const MAX_RESPONSE_LENGTH = 5000;
const MAX_APPEAL_DETAILS_LENGTH = 5000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_ORIGINS = [
  'https://file.fifo.systems',
  'https://hr-disciplinary-system.web.app',
  'http://localhost:3003',
  'http://localhost:5173',
];

// ============================================
// HELPERS
// ============================================

function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

function sanitizeText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') return '';
  // Strip HTML tags
  const stripped = text.replace(/<[^>]*>/g, '');
  return stripped.trim().substring(0, maxLength);
}

function setCorsHeaders(res: any, origin?: string): void {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

async function getHREmails(orgId: string): Promise<string[]> {
  const usersSnapshot = await db.collection('users')
    .where('organizationId', '==', orgId)
    .get();

  const emails: string[] = [];
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const roles = userData.roles || [];
    const role = userData.role || '';
    if (
      role === 'hr-manager' ||
      role === 'executive-management' ||
      roles.includes('hr-manager') ||
      roles.includes('executive-management')
    ) {
      if (userData.email) emails.push(userData.email);
    }
  });
  return emails;
}

// ============================================
// 1. GENERATE RESPONSE TOKEN (Authenticated)
// ============================================

export const generateResponseToken = onCall(
  { region: 'us-central1', memory: '256MiB' },
  async (request) => {
    // Verify authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { warningId, organizationId } = request.data;
    if (!warningId || !organizationId) {
      throw new HttpsError('invalid-argument', 'warningId and organizationId are required');
    }

    try {
      // Get warning data for the summary snapshot
      const warningDoc = await db
        .collection('organizations').doc(organizationId)
        .collection('warnings').doc(warningId)
        .get();

      if (!warningDoc.exists) {
        throw new HttpsError('not-found', 'Warning not found');
      }

      const warningData = warningDoc.data()!;

      // Check if a valid token already exists for this warning
      const existingTokens = await db.collection('responseTokens')
        .where('warningId', '==', warningId)
        .where('organizationId', '==', organizationId)
        .where('isRevoked', '==', false)
        .get();

      // Return existing valid token if one exists and hasn't expired
      for (const tokenDoc of existingTokens.docs) {
        const tokenData = tokenDoc.data();
        if (tokenData.expiresAt.toDate() > new Date()) {
          const responseUrl = `https://file.fifo.systems/respond/${tokenDoc.id}`;
          return {
            tokenId: tokenDoc.id,
            responseUrl,
            expiresAt: tokenData.expiresAt.toDate().toISOString(),
            existing: true,
          };
        }
      }

      // Get organization name
      const orgDoc = await db.collection('organizations').doc(organizationId).get();
      const orgName = orgDoc.data()?.name || 'Your Organization';

      // Generate new token
      const tokenId = generateToken();
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

      const tokenData = {
        warningId,
        organizationId,
        employeeId: warningData.employeeId || '',
        warningSummary: {
          employeeName: warningData.employeeName || 'Unknown',
          level: warningData.level || 'unknown',
          category: warningData.category || 'General',
          issueDate: warningData.issueDate || Timestamp.now(),
          description: warningData.description || '',
          organizationName: orgName,
        },
        createdAt: Timestamp.now(),
        createdBy: request.auth.uid,
        expiresAt: Timestamp.fromDate(expiresAt),
        isRevoked: false,
        hasResponse: false,
        responseSubmittedAt: null,
        hasAppeal: false,
        appealSubmittedAt: null,
        accessCount: 0,
        lastAccessedAt: null,
      };

      await db.collection('responseTokens').doc(tokenId).set(tokenData);

      const responseUrl = `https://file.fifo.systems/respond/${tokenId}`;
      logger.info(`Response token generated for warning ${warningId}: ${tokenId}`);

      return {
        tokenId,
        responseUrl,
        expiresAt: expiresAt.toISOString(),
        existing: false,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Failed to generate response token:', error);
      throw new HttpsError('internal', 'Failed to generate response link');
    }
  }
);

// ============================================
// 2. GET WARNING FOR RESPONSE (Public)
// ============================================

export const getWarningForResponse = onRequest(
  { region: 'us-central1', memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCorsHeaders(res, req.headers.origin as string);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    try {
      const tokenDoc = await db.collection('responseTokens').doc(token).get();
      if (!tokenDoc.exists) {
        res.status(404).json({ error: 'Invalid response link' });
        return;
      }

      const tokenData = tokenDoc.data()!;

      // Check if revoked
      if (tokenData.isRevoked) {
        res.status(410).json({ error: 'This response link has been revoked' });
        return;
      }

      // Check if expired
      if (tokenData.expiresAt.toDate() < new Date()) {
        res.status(410).json({ error: 'This response link has expired' });
        return;
      }

      // Rate limiting: max views per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (
        tokenData.lastAccessedAt &&
        tokenData.lastAccessedAt.toDate() > oneHourAgo &&
        tokenData.accessCount > MAX_VIEWS_PER_HOUR
      ) {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
      }

      // Update access count
      await tokenDoc.ref.update({
        accessCount: FieldValue.increment(1),
        lastAccessedAt: Timestamp.now(),
      });

      // Check if a PDF exists for this warning
      let pdfAvailable = false;
      try {
        const warningDoc = await db
          .collection('organizations').doc(tokenData.organizationId)
          .collection('warnings').doc(tokenData.warningId)
          .get();
        if (warningDoc.exists) {
          const warningData = warningDoc.data()!;
          pdfAvailable = Boolean(warningData.pdfGenerated && warningData.pdfFilename);
        }
      } catch (_err) {
        // Non-critical: PDF check failure shouldn't block the response
      }

      // Return warning summary (no sensitive data)
      res.status(200).json({
        warningSummary: tokenData.warningSummary,
        expiresAt: tokenData.expiresAt.toDate().toISOString(),
        hasResponse: tokenData.hasResponse || false,
        hasAppeal: tokenData.hasAppeal || false,
        pdfAvailable,
      });
    } catch (error) {
      logger.error('Failed to get warning for response:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ============================================
// 2b. GET WARNING PDF FOR RESPONSE (Public)
// ============================================

export const getWarningPDFForResponse = onRequest(
  { region: 'us-central1', memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCorsHeaders(res, req.headers.origin as string);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    try {
      // Validate token
      const tokenDoc = await db.collection('responseTokens').doc(token).get();
      if (!tokenDoc.exists) {
        res.status(404).json({ error: 'Invalid response link' });
        return;
      }

      const tokenData = tokenDoc.data()!;

      if (tokenData.isRevoked) {
        res.status(410).json({ error: 'This response link has been revoked' });
        return;
      }

      if (tokenData.expiresAt.toDate() < new Date()) {
        res.status(410).json({ error: 'This response link has expired' });
        return;
      }

      // Get the warning document to find the PDF
      const warningDoc = await db
        .collection('organizations').doc(tokenData.organizationId)
        .collection('warnings').doc(tokenData.warningId)
        .get();

      if (!warningDoc.exists) {
        res.status(404).json({ error: 'Warning not found' });
        return;
      }

      const warningData = warningDoc.data()!;

      if (!warningData.pdfGenerated || !warningData.pdfFilename) {
        res.status(404).json({ error: 'No PDF document available for this warning' });
        return;
      }

      // Generate a signed URL for the PDF in Firebase Storage
      const storagePath = `warnings/${tokenData.organizationId}/${tokenData.warningId}/pdfs/${warningData.pdfFilename}`;
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      // Check file exists
      const [exists] = await file.exists();
      if (!exists) {
        res.status(404).json({ error: 'PDF file not found in storage' });
        return;
      }

      // Generate signed URL valid for 1 hour
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      logger.info(`PDF signed URL generated for warning ${tokenData.warningId}`);
      res.status(200).json({
        url: signedUrl,
        filename: warningData.pdfFilename,
      });
    } catch (error) {
      logger.error('Failed to get warning PDF:', error);
      res.status(500).json({ error: 'Failed to retrieve PDF document' });
    }
  }
);

// ============================================
// 3. SUBMIT EMPLOYEE RESPONSE (Public)
// ============================================

export const submitEmployeeResponse = onRequest(
  { region: 'us-central1', memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCorsHeaders(res, req.headers.origin as string);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { token, responseText, employeeEmail } = req.body;

    if (!token || !responseText) {
      res.status(400).json({ error: 'Token and response text are required' });
      return;
    }

    try {
      const tokenDoc = await db.collection('responseTokens').doc(token).get();
      if (!tokenDoc.exists) {
        res.status(404).json({ error: 'Invalid response link' });
        return;
      }

      const tokenData = tokenDoc.data()!;

      if (tokenData.isRevoked) {
        res.status(410).json({ error: 'This response link has been revoked' });
        return;
      }

      if (tokenData.expiresAt.toDate() < new Date()) {
        res.status(410).json({ error: 'This response link has expired' });
        return;
      }

      if (tokenData.hasResponse) {
        res.status(409).json({ error: 'A response has already been submitted' });
        return;
      }

      const sanitizedResponse = sanitizeText(responseText, MAX_RESPONSE_LENGTH);
      if (!sanitizedResponse) {
        res.status(400).json({ error: 'Response text cannot be empty' });
        return;
      }

      // Update the warning with the employee's response
      const warningRef = db
        .collection('organizations').doc(tokenData.organizationId)
        .collection('warnings').doc(tokenData.warningId);

      await warningRef.update({
        employeeStatement: sanitizedResponse,
        employeeStatementSubmittedAt: Timestamp.now(),
        employeeStatementVia: 'response-link',
      });

      // Mark token as having a response
      await tokenDoc.ref.update({
        hasResponse: true,
        responseSubmittedAt: Timestamp.now(),
      });

      // Notify HR
      const hrEmails = await getHREmails(tokenData.organizationId);
      if (hrEmails.length > 0) {
        await sendResponseNotification(hrEmails, {
          employeeName: tokenData.warningSummary?.employeeName || 'Employee',
          employeeNumber: '',
          warningLevel: tokenData.warningSummary?.level || 'unknown',
          warningCategory: tokenData.warningSummary?.category || 'General',
          responseType: 'response',
          submittedAt: new Date().toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
          organizationName: tokenData.warningSummary?.organizationName || 'Your Organization',
          warningId: tokenData.warningId,
          dashboardUrl: 'https://file.fifo.systems/dashboard',
        });
      }

      // Send confirmation email to employee if provided
      if (employeeEmail) {
        await sendResponseConfirmation(employeeEmail, {
          employeeName: tokenData.warningSummary?.employeeName || 'Employee',
          warningLevel: tokenData.warningSummary?.level || 'unknown',
          warningCategory: tokenData.warningSummary?.category || 'General',
          responseType: 'response',
          submittedAt: new Date().toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
          organizationName: tokenData.warningSummary?.organizationName || 'Your Organization',
        });
      }

      logger.info(`Employee response submitted for warning ${tokenData.warningId}`);
      res.status(200).json({ success: true, message: 'Response submitted successfully' });
    } catch (error) {
      logger.error('Failed to submit employee response:', error);
      res.status(500).json({ error: 'Failed to submit response' });
    }
  }
);

// ============================================
// 4. SUBMIT EMPLOYEE APPEAL (Public)
// ============================================

export const submitEmployeeAppeal = onRequest(
  { region: 'us-central1', memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    setCorsHeaders(res, req.headers.origin as string);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { token, grounds, details, requestedOutcome, evidenceUrls, employeeEmail } = req.body;

    if (!token || !grounds || !details || !requestedOutcome) {
      res.status(400).json({ error: 'Token, grounds, details, and requestedOutcome are required' });
      return;
    }

    try {
      const tokenDoc = await db.collection('responseTokens').doc(token).get();
      if (!tokenDoc.exists) {
        res.status(404).json({ error: 'Invalid response link' });
        return;
      }

      const tokenData = tokenDoc.data()!;

      if (tokenData.isRevoked) {
        res.status(410).json({ error: 'This response link has been revoked' });
        return;
      }

      if (tokenData.expiresAt.toDate() < new Date()) {
        res.status(410).json({ error: 'This response link has expired' });
        return;
      }

      if (tokenData.hasAppeal) {
        res.status(409).json({ error: 'An appeal has already been submitted' });
        return;
      }

      const sanitizedDetails = sanitizeText(details, MAX_APPEAL_DETAILS_LENGTH);
      const sanitizedOutcome = sanitizeText(requestedOutcome, MAX_RESPONSE_LENGTH);
      const sanitizedGrounds = sanitizeText(grounds, 200);

      // Build evidence items array from uploaded URLs
      // Strip query params before checking extension (signed/token URLs have ?alt=media&token=...)
      const evidenceItems = Array.isArray(evidenceUrls)
        ? evidenceUrls.map((url: string, i: number) => {
            const pathOnly = url.split('?')[0];
            const isPhoto = /\.(jpg|jpeg|png|webp|heic)$/i.test(pathOnly);
            return {
              id: `ev_appeal_${Date.now()}_${i}`,
              type: isPhoto ? 'photo' : 'document',
              url,
              description: `Appeal evidence ${i + 1}`,
              capturedAt: new Date(),
              captureMethod: 'upload',
            };
          })
        : [];

      // Update the warning with appeal data
      const warningRef = db
        .collection('organizations').doc(tokenData.organizationId)
        .collection('warnings').doc(tokenData.warningId);

      await warningRef.update({
        appealSubmitted: true,
        appealDate: Timestamp.now(),
        status: 'appealed',
        appealDetails: {
          grounds: sanitizedGrounds,
          details: sanitizedDetails,
          requestedOutcome: sanitizedOutcome,
          submittedAt: Timestamp.now(),
          submittedBy: tokenData.warningSummary?.employeeName || 'Employee (via link)',
          submittedVia: 'response-link',
          ...(evidenceItems.length > 0 ? { evidenceItems } : {}),
        },
      });

      // Mark token as having an appeal
      await tokenDoc.ref.update({
        hasAppeal: true,
        appealSubmittedAt: Timestamp.now(),
      });

      // HR notification is handled by the notifyHROnAppeal Firestore trigger
      // which fires when appealSubmitted flips to true

      // Send confirmation to employee if email provided
      if (employeeEmail) {
        await sendResponseConfirmation(employeeEmail, {
          employeeName: tokenData.warningSummary?.employeeName || 'Employee',
          warningLevel: tokenData.warningSummary?.level || 'unknown',
          warningCategory: tokenData.warningSummary?.category || 'General',
          responseType: 'appeal',
          submittedAt: new Date().toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
          organizationName: tokenData.warningSummary?.organizationName || 'Your Organization',
        });
      }

      logger.info(`Employee appeal submitted for warning ${tokenData.warningId}`);
      res.status(200).json({ success: true, message: 'Appeal submitted successfully' });
    } catch (error) {
      logger.error('Failed to submit employee appeal:', error);
      res.status(500).json({ error: 'Failed to submit appeal' });
    }
  }
);

// ============================================
// 5. UPLOAD RESPONSE EVIDENCE (Public)
// ============================================

export const uploadResponseEvidence = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    invoker: 'public',
  },
  async (req, res) => {
    setCorsHeaders(res, req.headers.origin as string);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Get token and file data from the request
      const token = req.body.token || req.query.token;
      const fileBase64 = req.body.file; // base64-encoded file data
      const fileName = req.body.fileName;
      const mimeType = req.body.mimeType;

      if (!token || !fileBase64 || !fileName || !mimeType) {
        res.status(400).json({ error: 'Token, file, fileName, and mimeType are required' });
        return;
      }

      // Validate token
      const tokenDoc = await db.collection('responseTokens').doc(token).get();
      if (!tokenDoc.exists) {
        res.status(404).json({ error: 'Invalid response link' });
        return;
      }

      const tokenData = tokenDoc.data()!;
      if (tokenData.isRevoked || tokenData.expiresAt.toDate() < new Date()) {
        res.status(410).json({ error: 'Response link is expired or revoked' });
        return;
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        res.status(400).json({ error: 'Unsupported file type' });
        return;
      }

      // Decode and validate size
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      if (fileBuffer.length > MAX_FILE_SIZE) {
        res.status(400).json({ error: `File too large. Maximum ${MAX_FILE_SIZE / (1024 * 1024)}MB.` });
        return;
      }

      // Upload to Storage
      const randomId = crypto.randomBytes(8).toString('hex');
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `response-evidence/${tokenData.organizationId}/${tokenData.warningId}/${randomId}_${cleanFileName}`;
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            organizationId: tokenData.organizationId,
            warningId: tokenData.warningId,
            token: token.substring(0, 8) + '...', // Partial token for audit
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Generate a download token for Firebase Storage URL (non-expiring, controlled by security rules)
      const downloadToken = crypto.randomUUID();
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      });
      const encodedPath = encodeURIComponent(storagePath);
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

      logger.info(`Evidence uploaded for warning ${tokenData.warningId}: ${storagePath}`);
      res.status(200).json({
        success: true,
        url: downloadUrl,
        storagePath,
      });
    } catch (error) {
      logger.error('Failed to upload response evidence:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

// ============================================
// 6. REVOKE RESPONSE TOKEN (Authenticated)
// ============================================

export const revokeResponseToken = onCall(
  { region: 'us-central1', memory: '256MiB' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { tokenId } = request.data;
    if (!tokenId) {
      throw new HttpsError('invalid-argument', 'tokenId is required');
    }

    try {
      const tokenDoc = await db.collection('responseTokens').doc(tokenId).get();
      if (!tokenDoc.exists) {
        throw new HttpsError('not-found', 'Token not found');
      }

      await tokenDoc.ref.update({
        isRevoked: true,
        revokedAt: Timestamp.now(),
        revokedBy: request.auth.uid,
      });

      logger.info(`Response token revoked: ${tokenId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Failed to revoke token:', error);
      throw new HttpsError('internal', 'Failed to revoke token');
    }
  }
);

// ============================================
// 7. CLEANUP EXPIRED TOKENS (Scheduled)
// ============================================

export const cleanupExpiredResponseTokens = onSchedule(
  {
    schedule: '0 2 * * *', // Run at 2 AM daily
    timeZone: 'Africa/Johannesburg',
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    logger.info('Starting expired response token cleanup');

    try {
      const now = Timestamp.now();
      const expiredTokens = await db.collection('responseTokens')
        .where('expiresAt', '<', now)
        .limit(500)
        .get();

      if (expiredTokens.empty) {
        logger.info('No expired tokens to clean up');
        return;
      }

      const batch = db.batch();
      let deletedCount = 0;

      for (const doc of expiredTokens.docs) {
        batch.delete(doc.ref);
        deletedCount++;
      }

      await batch.commit();
      logger.info(`Cleaned up ${deletedCount} expired response tokens`);

      // Also clean up response evidence for expired tokens
      const bucket = storage.bucket();
      for (const doc of expiredTokens.docs) {
        const tokenData = doc.data();
        const prefix = `response-evidence/${tokenData.organizationId}/${tokenData.warningId}/`;
        try {
          const [files] = await bucket.getFiles({ prefix });
          for (const file of files) {
            await file.delete().catch(() => {});
          }
        } catch (_err) {
          // Non-critical: evidence cleanup failure
        }
      }
    } catch (error) {
      logger.error('Failed to clean up expired tokens:', error);
    }
  }
);
