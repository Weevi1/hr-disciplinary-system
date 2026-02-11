// functions/src/email/sendgridService.ts
// SendGrid email service wrapper for File by FIFO
// Handles appeal notifications, response notifications, and confirmation emails

import { logger } from 'firebase-functions';
import { defineString } from 'firebase-functions/params';
import {
  appealNotificationTemplate,
  responseNotificationTemplate,
  responseConfirmationTemplate,
} from './templates';

// SendGrid API key from environment
const sendgridApiKey = defineString('SENDGRID_API_KEY');

const SENDER_EMAIL = 'file@fifo.systems';
const SENDER_NAME = 'File by FIFO';

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface AppealNotificationData {
  employeeName: string;
  employeeNumber: string;
  warningLevel: string;
  warningCategory: string;
  appealGrounds: string;
  appealDetails: string;
  requestedOutcome: string;
  submittedAt: string;
  decisionDeadline: string;
  organizationName: string;
  warningId: string;
}

interface ResponseNotificationData {
  employeeName: string;
  employeeNumber: string;
  warningLevel: string;
  warningCategory: string;
  responseType: 'response' | 'appeal';
  submittedAt: string;
  organizationName: string;
  warningId: string;
  dashboardUrl: string;
}

interface ResponseConfirmationData {
  employeeName: string;
  warningLevel: string;
  warningCategory: string;
  responseType: 'response' | 'appeal';
  submittedAt: string;
  organizationName: string;
}

/**
 * Send an email via SendGrid REST API
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = sendgridApiKey.value();
  if (!apiKey) {
    logger.error('SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
    return false;
  }

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const personalizations = recipients.map(email => ({ to: [{ email }] }));

  const body = {
    personalizations,
    from: { email: SENDER_EMAIL, name: SENDER_NAME },
    subject: payload.subject,
    content: [{ type: 'text/html', value: payload.html }],
    ...(payload.replyTo ? { reply_to: { email: payload.replyTo } } : {}),
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 202 || response.status === 200) {
      logger.info(`Email sent successfully to ${recipients.join(', ')}: ${payload.subject}`);
      return true;
    }

    const errorText = await response.text();
    logger.error(`SendGrid API error (${response.status}): ${errorText}`);
    return false;
  } catch (error) {
    logger.error('Failed to send email via SendGrid:', error);
    return false;
  }
}

/**
 * Send appeal notification email to HR managers
 */
export async function sendAppealNotification(
  hrEmails: string[],
  data: AppealNotificationData
): Promise<boolean> {
  if (hrEmails.length === 0) {
    logger.warn('No HR email addresses provided for appeal notification');
    return false;
  }

  const html = appealNotificationTemplate(data);
  return sendEmail({
    to: hrEmails,
    subject: `Appeal Submitted: ${data.employeeName} - ${data.warningCategory} (${data.warningLevel})`,
    html,
  });
}

/**
 * Send response/appeal notification to HR when submitted via public link
 */
export async function sendResponseNotification(
  hrEmails: string[],
  data: ResponseNotificationData
): Promise<boolean> {
  if (hrEmails.length === 0) {
    logger.warn('No HR email addresses provided for response notification');
    return false;
  }

  const typeLabel = data.responseType === 'appeal' ? 'Appeal' : 'Response';
  const html = responseNotificationTemplate(data);
  return sendEmail({
    to: hrEmails,
    subject: `Employee ${typeLabel} Received: ${data.employeeName} - ${data.warningCategory}`,
    html,
  });
}

/**
 * Send confirmation email to employee after submitting response/appeal
 */
export async function sendResponseConfirmation(
  employeeEmail: string,
  data: ResponseConfirmationData
): Promise<boolean> {
  const typeLabel = data.responseType === 'appeal' ? 'Appeal' : 'Response';
  const html = responseConfirmationTemplate(data);
  return sendEmail({
    to: employeeEmail,
    subject: `${typeLabel} Received - ${data.organizationName}`,
    html,
  });
}
