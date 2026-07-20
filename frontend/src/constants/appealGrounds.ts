// appealGrounds.ts - Shared appeal-ground definitions.
// Single source of truth for the public employee respond page (employee-facing
// description) and the HR AppealReviewModal (hrGuidance: what HR should check
// when evaluating an appeal on this ground).

export interface AppealGround {
  value: string;
  label: string;
  description: string;
  hrGuidance: string;
}

export const APPEAL_GROUNDS: AppealGround[] = [
  {
    value: 'procedural_unfair',
    label: 'Procedural Unfairness',
    description: 'The disciplinary process was not followed correctly',
    hrGuidance: 'Check: was the employee told what the allegation was, given a genuine chance to respond before the decision, and was your own disciplinary procedure and the category’s escalation path followed? (LRA Schedule 8, Item 4 — fair procedure)'
  },
  {
    value: 'substantive_unfair',
    label: 'Substantive Unfairness',
    description: 'The warning was not justified by the facts',
    hrGuidance: 'Check: does the evidence actually establish the misconduct, was the rule valid and known to the employee, and is the warning level proportionate to the offence? (LRA Schedule 8, Item 7 — fair reason)'
  },
  {
    value: 'bias_prejudice',
    label: 'Bias or Prejudice',
    description: 'The decision was influenced by bias or unfair treatment',
    hrGuidance: 'Check: did the manager who issued the warning have a personal conflict with the employee, and is there a pattern of this employee being singled out? Consider having someone uninvolved review the facts.'
  },
  {
    value: 'insufficient_evidence',
    label: 'Insufficient Evidence',
    description: 'Not enough evidence to support the warning',
    hrGuidance: 'Check: review the evidence attached to the warning. A warning must rest on facts you could defend at the CCMA — first-hand accounts, documents, or records, not rumour or assumption.'
  },
  {
    value: 'inconsistent_treatment',
    label: 'Inconsistent Treatment',
    description: 'Others were treated differently for similar conduct',
    hrGuidance: 'Check: search past warnings for similar incidents by other employees. Comparable misconduct should attract comparable discipline unless there is a defensible distinguishing reason. (Consistency is a Schedule 8 fairness factor.)'
  },
  {
    value: 'other',
    label: 'Other Grounds',
    description: 'Different reason (explain in details below)',
    hrGuidance: 'Read the employee’s details carefully and decide which fairness question it raises — procedure, substance, consistency, or something personal. If in doubt, treat it with the same seriousness as a named ground.'
  }
];

export const APPEAL_GROUNDS_MAP: Record<string, AppealGround> = Object.fromEntries(
  APPEAL_GROUNDS.map(g => [g.value, g])
);
