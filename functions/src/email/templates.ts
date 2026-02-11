// functions/src/email/templates.ts
// HTML email templates for File by FIFO notifications
// All templates use inline styles for email client compatibility

const BRAND_COLOR = '#2563eb';
const BRAND_BG = '#f8fafc';

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND_BG};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_BG};padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">File by FIFO</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:12px;">HR Disciplinary Management</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background-color:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">This is an automated notification from File by FIFO.</p>
            <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">FIFO Solutions (Pty) Ltd &bull; file.fifo.systems</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Appeal notification template - sent to HR managers when an appeal is submitted
 */
export function appealNotificationTemplate(data: {
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
}): string {
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px;">Appeal Submitted</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
      An employee has submitted a formal appeal against a disciplinary warning. Please review within <strong>5 working days</strong> as per company policy.
    </p>

    <!-- Urgency Banner -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px 16px;">
          <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">Decision Required by: ${data.decisionDeadline}</p>
        </td>
      </tr>
    </table>

    <!-- Employee & Warning Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:16px;">
          <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 8px;font-weight:600;">Warning Details</p>
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color:#64748b;font-size:13px;width:40%;">Employee:</td>
              <td style="color:#1e293b;font-size:13px;font-weight:600;">${data.employeeName} (${data.employeeNumber})</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Warning Level:</td>
              <td style="color:#1e293b;font-size:13px;font-weight:600;">${formatLevel(data.warningLevel)}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Category:</td>
              <td style="color:#1e293b;font-size:13px;">${data.warningCategory}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Organization:</td>
              <td style="color:#1e293b;font-size:13px;">${data.organizationName}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Appeal Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#fffbeb;border-radius:6px;border:1px solid #fcd34d;">
      <tr>
        <td style="padding:16px;">
          <p style="color:#92400e;font-size:11px;text-transform:uppercase;margin:0 0 8px;font-weight:600;">Appeal Information</p>
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color:#78716c;font-size:13px;width:40%;">Grounds:</td>
              <td style="color:#1c1917;font-size:13px;font-weight:600;">${formatGrounds(data.appealGrounds)}</td>
            </tr>
            <tr>
              <td style="color:#78716c;font-size:13px;vertical-align:top;">Details:</td>
              <td style="color:#1c1917;font-size:13px;">${data.appealDetails}</td>
            </tr>
            <tr>
              <td style="color:#78716c;font-size:13px;vertical-align:top;">Requested Outcome:</td>
              <td style="color:#1c1917;font-size:13px;">${data.requestedOutcome}</td>
            </tr>
            <tr>
              <td style="color:#78716c;font-size:13px;">Submitted:</td>
              <td style="color:#1c1917;font-size:13px;">${data.submittedAt}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="https://file.fifo.systems/dashboard" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;">
            Review Appeal in Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;
  return baseLayout(content);
}

/**
 * Response notification template - sent to HR when employee submits via public link
 */
export function responseNotificationTemplate(data: {
  employeeName: string;
  employeeNumber: string;
  warningLevel: string;
  warningCategory: string;
  responseType: 'response' | 'appeal';
  submittedAt: string;
  organizationName: string;
  warningId: string;
  dashboardUrl: string;
}): string {
  const typeLabel = data.responseType === 'appeal' ? 'Formal Appeal' : 'Written Response';
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px;">Employee ${typeLabel} Received</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
      ${data.employeeName} has submitted a ${typeLabel.toLowerCase()} regarding their disciplinary warning via the employee response link.
    </p>

    <!-- Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:16px;">
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color:#64748b;font-size:13px;width:40%;">Employee:</td>
              <td style="color:#1e293b;font-size:13px;font-weight:600;">${data.employeeName} (${data.employeeNumber})</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Warning Level:</td>
              <td style="color:#1e293b;font-size:13px;">${formatLevel(data.warningLevel)}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Category:</td>
              <td style="color:#1e293b;font-size:13px;">${data.warningCategory}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;">Submitted:</td>
              <td style="color:#1e293b;font-size:13px;">${data.submittedAt}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${data.responseType === 'appeal' ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px 16px;">
          <p style="color:#92400e;font-size:13px;margin:0;">This is a formal appeal. Please review and respond within <strong>5 working days</strong>.</p>
        </td>
      </tr>
    </table>` : ''}

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${data.dashboardUrl}" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600;">
            View in Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;
  return baseLayout(content);
}

/**
 * Response confirmation template - sent to employee after submitting response/appeal
 */
export function responseConfirmationTemplate(data: {
  employeeName: string;
  warningLevel: string;
  warningCategory: string;
  responseType: 'response' | 'appeal';
  submittedAt: string;
  organizationName: string;
}): string {
  const typeLabel = data.responseType === 'appeal' ? 'appeal' : 'response';
  const content = `
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px;">${data.responseType === 'appeal' ? 'Appeal' : 'Response'} Received</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Dear ${data.employeeName},<br><br>
      Your ${typeLabel} regarding the <strong>${formatLevel(data.warningLevel)}</strong> warning for <strong>${data.warningCategory}</strong> has been received by ${data.organizationName}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f0fdf4;border-radius:6px;border:1px solid #86efac;">
      <tr>
        <td style="padding:16px;">
          <p style="color:#166534;font-size:13px;margin:0 0 8px;font-weight:600;">What happens next?</p>
          <ul style="color:#15803d;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
            ${data.responseType === 'appeal' ? `
            <li>HR will review your appeal within 5 working days</li>
            <li>You may be contacted for additional information</li>
            <li>You will be notified of the appeal outcome</li>
            <li>You have the right to be assisted by a shop steward or colleague</li>
            ` : `
            <li>Your response has been attached to the warning record</li>
            <li>HR has been notified of your submission</li>
            <li>Your response will be considered as part of any future proceedings</li>
            `}
          </ul>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
      Submitted on: ${data.submittedAt}<br>
      This email serves as confirmation of receipt. Please keep it for your records.
    </p>
  `;
  return baseLayout(content);
}

// Helper functions
function formatLevel(level: string): string {
  const map: Record<string, string> = {
    'counselling': 'Counselling',
    'verbal': 'Verbal Warning',
    'first_written': 'Written Warning',
    'second_written': 'Second Written Warning',
    'final_written': 'Final Written Warning',
    'suspension': 'Suspension',
    'dismissal': 'Dismissal',
  };
  return map[level] || level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatGrounds(grounds: string): string {
  const map: Record<string, string> = {
    'procedural_unfair': 'Procedural Unfairness',
    'substantive_unfair': 'Substantive Unfairness',
    'bias_prejudice': 'Bias or Prejudice',
    'insufficient_evidence': 'Insufficient Evidence',
    'inconsistent_treatment': 'Inconsistent Treatment',
    'other': 'Other Grounds',
  };
  return map[grounds] || grounds;
}
