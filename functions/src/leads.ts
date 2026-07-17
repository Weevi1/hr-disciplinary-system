// functions/src/leads.ts
// Public demo-request (lead capture) endpoint for the marketing landing page.
// Writes a lead document and notifies Riaan by email. No auth — protected by
// per-IP rate limiting, a honeypot field, and strict input validation.

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { sendEmail } from './email/sendgridService';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = getFirestore();

const LEAD_NOTIFICATION_EMAIL = 'riaan@fifo.systems';
const MAX_REQUESTS_PER_IP_PER_HOUR = 5;
const MAX_FIELD_LENGTH = 200;

const ALLOWED_ORIGINS = [
  'https://file.fifo.systems',
  'https://hr-disciplinary-system.web.app',
  'http://localhost:3003',
  'http://localhost:5173',
];

function setCorsHeaders(res: any, origin?: string): void {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

function cleanField(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim().substring(0, maxLength);
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Per-IP rolling-hour rate limit backed by Firestore. Returns true if allowed. */
async function checkIpRateLimit(ip: string): Promise<boolean> {
  // Hash the IP — we only need it for throttling, not as stored PII
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
  const ref = db.collection('leadRateLimits').doc(ipHash);
  const snap = await ref.get();
  const data = snap.data();

  const windowStartMs = data?.windowStart?.toDate?.().getTime() ?? 0;
  const inWindow = Date.now() - windowStartMs < 60 * 60 * 1000;

  if (inWindow && (data?.count ?? 0) >= MAX_REQUESTS_PER_IP_PER_HOUR) {
    return false;
  }

  await ref.set(
    inWindow
      ? { count: FieldValue.increment(1) }
      : { count: 1, windowStart: Timestamp.now() },
    { merge: true }
  );
  return true;
}

export const submitDemoRequest = onRequest(
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

    try {
      const { name, company, email, phone, employeeCount, message, website } = req.body || {};

      // Honeypot: real users never fill the hidden "website" field.
      // Pretend success so bots don't learn they were filtered.
      if (website) {
        logger.info('Lead honeypot triggered — dropping submission');
        res.status(200).json({ success: true });
        return;
      }

      const lead = {
        name: cleanField(name),
        company: cleanField(company),
        email: cleanField(email),
        phone: cleanField(phone, 30),
        employeeCount: cleanField(String(employeeCount ?? ''), 20),
        message: cleanField(message, 1000),
      };

      if (!lead.name || !lead.company || !lead.email) {
        res.status(400).json({ error: 'Name, company and email are required' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
        res.status(400).json({ error: 'Please provide a valid email address' });
        return;
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
      if (!(await checkIpRateLimit(ip))) {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
      }

      const leadDoc = await db.collection('leads').add({
        ...lead,
        source: 'landing-page',
        status: 'new',
        createdAt: Timestamp.now(),
      });

      // Notify Riaan — best-effort; the lead is already stored
      const emailed = await sendEmail({
        to: LEAD_NOTIFICATION_EMAIL,
        replyTo: lead.email,
        subject: `🎯 New demo request: ${lead.company}`,
        html: `
          <h2>New demo request from the File landing page</h2>
          <table cellpadding="6" style="border-collapse:collapse">
            <tr><td><strong>Name</strong></td><td>${escapeHtml(lead.name)}</td></tr>
            <tr><td><strong>Company</strong></td><td>${escapeHtml(lead.company)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeHtml(lead.email)}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${escapeHtml(lead.phone || '—')}</td></tr>
            <tr><td><strong>Employees</strong></td><td>${escapeHtml(lead.employeeCount || '—')}</td></tr>
            <tr><td><strong>Message</strong></td><td>${escapeHtml(lead.message || '—')}</td></tr>
          </table>
          <p>Lead ID: ${leadDoc.id}</p>
        `,
      });

      if (!emailed) {
        logger.error(`Lead ${leadDoc.id} stored but notification email failed`);
      }

      logger.info(`New lead captured: ${leadDoc.id} (${lead.company})`);
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Failed to process demo request:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again or email riaan@fifo.systems.' });
    }
  }
);
