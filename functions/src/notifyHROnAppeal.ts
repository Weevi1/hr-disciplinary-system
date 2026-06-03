// functions/src/notifyHROnAppeal.ts
// Firestore trigger: notifies HR managers via email when an appeal is submitted

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { sendAppealNotification } from './email/sendgridService';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

/**
 * Calculate 5 working days from a given date (skips weekends)
 */
function addWorkingDays(startDate: Date, days: number): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Firestore trigger: fires when a warning document is updated
 * Checks if appealSubmitted flipped to true and sends HR notification
 */
export const notifyHROnAppeal = onDocumentUpdated(
  {
    document: 'organizations/{orgId}/warnings/{warningId}',
    region: 'us-central1',
    memory: '256MiB',
  },
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) {
      logger.warn('Missing document data in trigger event');
      return;
    }

    // Only trigger when appealSubmitted flips to true
    if (beforeData.appealSubmitted === true || afterData.appealSubmitted !== true) {
      return;
    }

    const orgId = event.params.orgId;
    const warningId = event.params.warningId;
    logger.info(`Appeal submitted for warning ${warningId} in org ${orgId}`);

    try {
      // Get organization name
      const orgDoc = await db.collection('organizations').doc(orgId).get();
      const orgName = orgDoc.data()?.name || 'Your Organization';

      // Skip appeal notifications for demo organizations — their only users are
      // temporary prospect logins with fake @demo.local-style emails.
      if (orgDoc.data()?.isDemo === true) {
        logger.info(`⏭️  Skipping HR appeal notification for demo org ${orgId}`);
        return;
      }

      // Find HR managers and executive management in this organization.
      // Read the sharded per-org user collection (source of truth) and filter in
      // code: the sharded `role` field is stored inconsistently — sometimes a
      // string, sometimes an object { id } — so a Firestore `role.id` where-clause
      // would silently miss string-role users. Org user collections are small.
      const usersSnapshot = await db.collection(`organizations/${orgId}/users`).get();

      const HR_ROLES = ['hr-manager', 'executive-management'];
      const hrEmails: string[] = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        // Skip prospect logins that might have been created in a demo that was
        // subsequently promoted, or any user flagged as demo-only.
        if (userData.isDemoProspect === true) return;

        const roleId = typeof userData.role === 'string' ? userData.role : userData.role?.id;
        const roles: string[] = userData.roles || [];
        if (HR_ROLES.includes(roleId) || roles.some((r: string) => HR_ROLES.includes(r))) {
          if (userData.email) {
            hrEmails.push(userData.email);
          }
        }
      });

      if (hrEmails.length === 0) {
        logger.warn(`No HR managers found for org ${orgId} - cannot send appeal notification`);
        return;
      }

      // Extract appeal details
      const appealDetails = afterData.appealDetails || {};
      const submittedAt = appealDetails.submittedAt?.toDate?.()
        ? appealDetails.submittedAt.toDate()
        : new Date();

      const decisionDeadline = addWorkingDays(submittedAt, 5);

      await sendAppealNotification(hrEmails, {
        employeeName: afterData.employeeName || 'Unknown Employee',
        employeeNumber: afterData.employeeNumber || 'N/A',
        warningLevel: afterData.level || 'unknown',
        warningCategory: afterData.category || 'General',
        appealGrounds: appealDetails.grounds || 'Not specified',
        appealDetails: appealDetails.details || appealDetails.additionalDetails || 'No details provided',
        requestedOutcome: appealDetails.requestedOutcome || 'Not specified',
        submittedAt: submittedAt.toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        decisionDeadline: decisionDeadline.toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        organizationName: orgName,
        warningId: warningId,
      });

      logger.info(`Appeal notification sent to ${hrEmails.length} HR manager(s) for warning ${warningId}`);
    } catch (error) {
      logger.error('Failed to send appeal notification:', error);
    }
  }
);
