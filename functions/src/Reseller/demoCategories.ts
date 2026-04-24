// functions/src/Reseller/demoCategories.ts
// Minimal backend copy of the universal SA warning categories used to seed
// demo organizations. Mirrors the IDs/names/escalation from the frontend
// source of truth at frontend/src/services/UniversalCategories.ts — we only
// keep what's needed for a demo to be functional. If the prospect converts
// to a paying tenant they go through the real deployment wizard which
// loads the full UNIVERSAL_SA_CATEGORIES dataset.

export interface DemoSeedCategory {
  id: string;
  name: string;
  description: string;
  severity: 'minor' | 'serious' | 'gross_misconduct';
  escalationPath: Array<
    'counselling' | 'verbal' | 'first_written' | 'second_written' | 'final_written' | 'dismissal'
  >;
  color: string;
  isDefault: boolean;
  defaultValidityPeriod: 3 | 6 | 12;
  requiresImmediateAction?: boolean;
}

export const DEMO_SEED_CATEGORIES: DemoSeedCategory[] = [
  {
    id: 'attendance_punctuality',
    name: 'Attendance & Punctuality',
    description: 'Late coming, unauthorized absence, early departure without permission',
    severity: 'minor',
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'],
    color: '#16a34a',
    isDefault: true,
    defaultValidityPeriod: 6
  },
  {
    id: 'performance_issues',
    name: 'Performance Issues',
    description: 'Poor work quality, missed targets, failure to meet performance standards',
    severity: 'minor',
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'],
    color: '#16a34a',
    isDefault: true,
    defaultValidityPeriod: 6
  },
  {
    id: 'insubordination',
    name: 'Insubordination',
    description: 'Wilful refusal to obey a lawful and reasonable instruction',
    severity: 'serious',
    escalationPath: ['verbal', 'first_written', 'final_written'],
    color: '#ea580c',
    isDefault: true,
    defaultValidityPeriod: 12
  },
  {
    id: 'safety_violations',
    name: 'Safety Violations',
    description: 'Breach of workplace safety rules or PPE requirements',
    severity: 'serious',
    escalationPath: ['verbal', 'first_written', 'final_written'],
    color: '#ea580c',
    isDefault: true,
    defaultValidityPeriod: 12
  },
  {
    id: 'harassment',
    name: 'Harassment',
    description: 'Unwelcome conduct creating a hostile or intimidating work environment',
    severity: 'serious',
    escalationPath: ['first_written', 'final_written'],
    color: '#ea580c',
    isDefault: true,
    defaultValidityPeriod: 12
  },
  {
    id: 'dishonesty',
    name: 'Dishonesty',
    description: 'Falsifying records, lying to management, misrepresenting information',
    severity: 'gross_misconduct',
    escalationPath: ['final_written', 'dismissal'],
    color: '#dc2626',
    isDefault: true,
    defaultValidityPeriod: 12,
    requiresImmediateAction: true
  },
  {
    id: 'theft',
    name: 'Theft',
    description: 'Unauthorized taking of company property or funds',
    severity: 'gross_misconduct',
    escalationPath: ['dismissal'],
    color: '#dc2626',
    isDefault: true,
    defaultValidityPeriod: 12,
    requiresImmediateAction: true
  },
  {
    id: 'gross_misconduct',
    name: 'Gross Misconduct',
    description: 'Violence, assault, gross negligence, or conduct justifying summary dismissal',
    severity: 'gross_misconduct',
    escalationPath: ['dismissal'],
    color: '#dc2626',
    isDefault: true,
    defaultValidityPeriod: 12,
    requiresImmediateAction: true
  }
];
