// frontend/src/components/warnings/v2/wizardTypesV2.ts
//
// V2 wizard: 5 working phases + 1 intro overview (6 phase slots total).
// The user-facing "Step X of 5" framing skips the overview.
//
// V2 reuses ALL types from V1's wizardTypes.ts — only the phase enum and
// metadata are new. State shape, save handler, validation rules, and the
// Firestore schema are unchanged.

import {
  Sparkles,
  ClipboardList,
  FileText,
  MessageSquare,
  PenTool,
  Send,
} from 'lucide-react';

// Re-export V1 types so V2 components have a single import surface.
export type {
  Employee,
  Category,
  FormData,
  SignatureData,
  ActionCommitment,
  UnifiedWarningWizardProps,
} from '../enhanced/wizardTypes';

export enum PhaseV2 {
  OVERVIEW = 0,
  SETUP = 1,
  INCIDENT = 2,
  CONVERSATION = 3,
  SIGN_AND_SAVE = 4,
  DELIVERY = 5,
}

export const TOTAL_PHASES_V2 = 6;

// User-facing step count (excludes the intro overview).
export const VISIBLE_STEPS_V2 = 5;

export const PHASE_INFO_V2 = [
  {
    title: "What's ahead",
    icon: Sparkles,
    guidance: "A quick scan of the 5 steps you'll work through. No surprises.",
  },
  {
    title: 'Setup',
    icon: ClipboardList,
    guidance: 'Pick the employee and the misconduct category. Active warnings and the recommended level appear here.',
  },
  {
    title: 'What Happened',
    icon: FileText,
    guidance: 'Document the facts: when, where, what happened, and any evidence.',
  },
  {
    title: 'The Conversation',
    icon: MessageSquare,
    guidance: "Capture the employee's response, the expected standard, and the improvement plan in one place.",
  },
  {
    title: 'Sign & Save',
    icon: PenTool,
    guidance: 'Review everything, read the script aloud, preview the PDF, and capture signatures. Tapping Save writes the warning.',
  },
  {
    title: 'Deliver',
    icon: Send,
    guidance: 'Choose how the warning reaches the employee.',
  },
];
