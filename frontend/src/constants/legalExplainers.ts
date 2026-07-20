// legalExplainers.ts - Plain-language help copy for the legally dense moments:
// warning levels / progressive discipline, and proof-of-service per delivery method.
// Consumed by ExplainerPanel call sites in the warning wizard and appeal review.

export const PROGRESSIVE_DISCIPLINE_SUMMARY =
  'South African labour law (LRA Section 188 and Schedule 8) expects discipline to be corrective before it is punitive: ' +
  'employees should normally get escalating warnings — and a real chance to improve — before dismissal is considered. ' +
  'Skipping steps without a serious reason is the most common way a warning fails at the CCMA.';

export const WARNING_LEVEL_EXPLAINERS: Record<string, string> = {
  counselling:
    'Counselling is a formal, documented discussion — not yet a warning. It shows the employee was made aware of the standard and given help to meet it.',
  verbal:
    'A verbal warning is the first formal disciplinary step for minor misconduct. It is still recorded in writing so there is proof it happened.',
  first_written:
    'A first written warning applies when counselling or a verbal warning has not worked, or the misconduct is too serious to start lower. It stays on record for its validity period.',
  second_written:
    'A second written warning signals repeated misconduct of the same kind. It puts the employee on clear notice that the next step is a final warning.',
  final_written:
    'A final written warning is the last step before dismissal. If the misconduct recurs while it is valid, a fair dismissal process can follow.',
  dismissal:
    'Dismissal ends the employment relationship and must be both substantively and procedurally fair. It normally requires a disciplinary hearing — do not issue it from this wizard without HR involvement.'
};

export const DELIVERY_PROOF_EXPLAINERS: { method: string; label: string; proof: string }[] = [
  {
    method: 'email',
    label: 'Email',
    proof: 'The system records when the email was sent and to which address. Keep any bounce or read notifications — together they prove the employee received the document.'
  },
  {
    method: 'whatsapp',
    label: 'WhatsApp',
    proof: 'You confirm sending manually, and can screenshot the delivered/read ticks as proof. The employee also gets a durable link to view and respond to the warning.'
  },
  {
    method: 'printed',
    label: 'Printed / hand delivery',
    proof: 'The strongest proof: the employee signs for the printed copy on collection. If they refuse to sign, note the refusal with a witness — refusal does not invalidate the warning.'
  },
  {
    method: 'qr',
    label: 'QR code',
    proof: 'The employee scans a code and downloads the PDF on their own device; the access is logged. Useful when the employee is present but email/WhatsApp are unavailable.'
  }
];
