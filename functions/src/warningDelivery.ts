// functions/src/warningDelivery.ts
// Cloud Function for automated warning email delivery with PDF attachment
// Best practices: double-send guard, delivery audit trail, partial failure handling

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import {
  sendWarningDeliveryEmail,
  sendWarningDeliveryHRNotification,
} from './email/sendgridService';
import type { WarningDeliveryData, WarningDeliveryHRNotificationData } from './email/sendgridService';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const storage = getStorage();

const TOKEN_LENGTH = 32; // 32 bytes = 64 hex chars
const DEFAULT_EXPIRY_DAYS = 30;

function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Look up HR manager emails for an organization
 * Same pattern as employeeResponse.ts getHREmails
 */
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

/**
 * Generate or retrieve an existing response token for the warning
 * Reuses the pattern from employeeResponse.ts generateResponseToken
 */
async function getOrCreateResponseToken(
  warningId: string,
  organizationId: string,
  warningData: any,
  createdByUid: string
): Promise<{ tokenId: string; responseUrl: string }> {
  // Check if a valid token already exists
  const existingTokens = await db.collection('responseTokens')
    .where('warningId', '==', warningId)
    .where('organizationId', '==', organizationId)
    .where('isRevoked', '==', false)
    .get();

  for (const tokenDoc of existingTokens.docs) {
    const tokenData = tokenDoc.data();
    if (tokenData.expiresAt.toDate() > new Date()) {
      return {
        tokenId: tokenDoc.id,
        responseUrl: `https://file.fifo.systems/respond/${tokenDoc.id}`,
      };
    }
  }

  // Get organization name
  const orgDoc = await db.collection('organizations').doc(organizationId).get();
  const orgName = orgDoc.data()?.name || 'Your Organization';

  // Generate new token
  const tokenId = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

  const tokenData = {
    warningId,
    organizationId,
    employeeId: warningData.employeeId || '',
    warningSummary: {
      employeeName: warningData.employeeName || 'Unknown',
      level: warningData.level || 'unknown',
      category: warningData.categoryName || warningData.category || 'General',
      issueDate: warningData.issueDate || Timestamp.now(),
      description: warningData.incidentDescription || warningData.description || '',
      organizationName: orgName,
    },
    createdAt: Timestamp.now(),
    createdBy: createdByUid,
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
  logger.info(`Response token generated for warning delivery: ${warningId} -> ${tokenId}`);

  return {
    tokenId,
    responseUrl: `https://file.fifo.systems/respond/${tokenId}`,
  };
}

// ============================================
// MAIN CLOUD FUNCTION
// ============================================

export const deliverWarningByEmail = onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    // Verify authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const {
      warningId,
      organizationId,
      employeeEmail,
      pdfFilename,
      alternativeEmail,
    } = request.data;

    if (!warningId || !organizationId) {
      throw new HttpsError('invalid-argument', 'warningId and organizationId are required');
    }

    const isAlternativeEmail = !!alternativeEmail;
    const targetEmail = isAlternativeEmail ? alternativeEmail : employeeEmail;

    try {
      // Get warning document
      const warningDoc = await db
        .collection('organizations').doc(organizationId)
        .collection('warnings').doc(warningId)
        .get();

      if (!warningDoc.exists) {
        throw new HttpsError('not-found', 'Warning not found');
      }

      const warningData = warningDoc.data()!;

      // ============================
      // A. DOUBLE-SEND PREVENTION
      // ============================
      const existingHistory = warningData.deliveryHistory || [];
      const alreadySent = existingHistory.some(
        (e: any) => e.method === 'email' && e.status === 'delivered'
      );
      if (alreadySent) {
        throw new HttpsError('already-exists', 'Warning already delivered via email');
      }

      // Get organization name
      const orgDoc = await db.collection('organizations').doc(organizationId).get();
      const orgName = orgDoc.data()?.name || 'Your Organization';

      const employeeName = warningData.employeeName || 'Employee';
      const warningLevel = warningData.level || 'unknown';
      const warningCategory = warningData.categoryName || warningData.category || 'General';
      const issueDate = warningData.issueDate || new Date().toISOString().split('T')[0];
      const issuedByName = warningData.issuedByName || request.auth.token.name || 'Manager';

      // ============================
      // MANUAL PATH (alternative email - just notify HR)
      // ============================
      if (isAlternativeEmail) {
        const hrEmails = await getHREmails(organizationId);

        const hrNotificationData: WarningDeliveryHRNotificationData = {
          employeeName,
          employeeEmail: employeeEmail || 'Not on record',
          warningLevel,
          warningCategory,
          issueDate,
          organizationName: orgName,
          issuedByName,
          deliveryType: 'manual_requested',
          alternativeEmail,
        };

        let hrNotified = false;
        if (hrEmails.length > 0) {
          try {
            hrNotified = await sendWarningDeliveryHRNotification(hrEmails, hrNotificationData);
          } catch (hrError) {
            logger.warn('HR notification failed for manual delivery:', hrError);
          }
        }

        // Record in delivery history
        const historyEntry = {
          method: 'email',
          email: alternativeEmail,
          timestamp: Timestamp.now(),
          status: 'manual_requested',
          attemptedBy: request.auth.uid,
          attemptedByName: issuedByName,
          type: 'manual_requested',
          hrNotified,
        };

        await warningDoc.ref.update({
          deliveryHistory: FieldValue.arrayUnion(historyEntry),
          deliveryStatus: 'manual_requested',
          deliveryMethod: 'email',
          updatedAt: Timestamp.now(),
        });

        return {
          success: true,
          deliveryType: 'manual_requested',
          hrNotified,
        };
      }

      // ============================
      // AUTOMATED PATH (send to employee)
      // ============================
      if (!targetEmail) {
        throw new HttpsError('invalid-argument', 'Employee email is required for automated delivery');
      }

      if (!pdfFilename) {
        throw new HttpsError('invalid-argument', 'PDF filename is required for automated delivery');
      }

      // Download PDF from Storage
      const storagePath = `warnings/${organizationId}/${warningId}/pdfs/${pdfFilename}`;
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'PDF file not found in storage. Please generate the PDF first.');
      }

      const [pdfBuffer] = await file.download();
      const pdfBase64 = pdfBuffer.toString('base64');

      // Generate response token for the email
      const { responseUrl } = await getOrCreateResponseToken(
        warningId,
        organizationId,
        warningData,
        request.auth.uid
      );

      // ============================
      // B. SEND EMPLOYEE EMAIL (CRITICAL)
      // ============================
      const deliveryData: WarningDeliveryData = {
        employeeName,
        warningLevel,
        warningCategory,
        issueDate,
        organizationName: orgName,
        issuedByName,
        responseUrl,
      };

      const emailSent = await sendWarningDeliveryEmail(
        targetEmail,
        deliveryData,
        pdfBase64,
        pdfFilename
      );

      if (!emailSent) {
        // Record failure in audit trail
        const failedEntry = {
          method: 'email',
          email: targetEmail,
          timestamp: Timestamp.now(),
          status: 'failed',
          attemptedBy: request.auth.uid,
          attemptedByName: issuedByName,
          type: 'automated',
          error: 'SendGrid delivery failed',
        };

        await warningDoc.ref.update({
          deliveryHistory: FieldValue.arrayUnion(failedEntry),
          deliveryStatus: 'failed',
          deliveryMethod: 'email',
          updatedAt: Timestamp.now(),
        });

        return { success: false, error: 'Email delivery failed. Please try again.' };
      }

      // ============================
      // C. NOTIFY HR (BEST-EFFORT)
      // ============================
      const hrEmails = await getHREmails(organizationId);
      let hrNotified = false;

      if (hrEmails.length > 0) {
        try {
          const hrNotificationData: WarningDeliveryHRNotificationData = {
            employeeName,
            employeeEmail: targetEmail,
            warningLevel,
            warningCategory,
            issueDate,
            organizationName: orgName,
            issuedByName,
            deliveryType: 'automated',
          };
          hrNotified = await sendWarningDeliveryHRNotification(hrEmails, hrNotificationData);
        } catch (hrError) {
          logger.warn('HR notification failed (non-critical):', hrError);
        }
      }

      // ============================
      // D. RECORD SUCCESS IN AUDIT TRAIL
      // ============================
      const successEntry = {
        method: 'email',
        email: targetEmail,
        timestamp: Timestamp.now(),
        status: 'delivered',
        attemptedBy: request.auth.uid,
        attemptedByName: issuedByName,
        type: 'automated',
        responseUrl,
        hrNotified,
      };

      await warningDoc.ref.update({
        deliveryHistory: FieldValue.arrayUnion(successEntry),
        deliveryStatus: 'delivered',
        deliveryMethod: 'email',
        updatedAt: Timestamp.now(),
      });

      logger.info(`Warning ${warningId} delivered via email to ${targetEmail}`);

      return {
        success: true,
        deliveryType: 'automated',
        email: targetEmail,
        responseUrl,
        hrNotified,
      };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Failed to deliver warning by email:', error);
      throw new HttpsError('internal', 'Failed to deliver warning by email');
    }
  }
);
