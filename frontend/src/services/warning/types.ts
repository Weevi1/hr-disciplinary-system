// frontend/src/services/warning/types.ts
//
// Type definitions for the warning service surface. Extracted from
// WarningService.ts in Phase 2 Tier 3A so the implementation files
// (`EscalationEngine.ts`, `ReviewTracker.ts`, `WarningService.ts`) can
// share them without forming a cycle. WarningService.ts re-exports
// everything from here for back-compat with the 60+ external importers
// that historically imported these types from `@/services/WarningService`.

import type { WarningLevel, UniversalCategory } from '../UniversalCategories';
import type { Warning, WarningCategory } from '../../types/core';
import type { AudioRecordingData } from '../../types/warning';

// Re-exports so callers can pull everything from this one module.
// WarningCategory unified to the canonical types/core.ts shape in Phase 2 Tier 3D step 7.
export type { WarningLevel, UniversalCategory, Warning, AudioRecordingData, WarningCategory };

export type DeliveryMethod = 'email' | 'whatsapp' | 'print' | 'hand_delivery';

export interface EmployeeWithContext {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  deliveryPreference: 'email' | 'whatsapp' | 'print';
  recentWarnings: { count: number };
  riskIndicators: { highRisk: boolean; reasons: string[] };
}

export interface EnhancedWarningFormData {
  // Employee and category
  employeeId: string;
  categoryId: string;

  // Timing
  issueDate: string;
  incidentDate: string;
  incidentTime: string;

  // Content
  incidentLocation: string;
  incidentDescription: string;
  additionalNotes?: string;

  // Progressive discipline
  level: WarningLevel;
  validityPeriod: 3 | 6 | 12;
  escalationReason?: string;

  // Audio recording
  audioRecording?: AudioRecordingData;
}

/**
 * 🔥 CRITICAL: Simplified warning summary for PDF generation
 * Stores only essential fields to avoid Firestore document size limits.
 * Full Warning objects with nested audio/signatures can exceed 1MB limit.
 */
export interface SimplifiedWarningSummary {
  id: string;
  level: WarningLevel;
  category: string;
  description: string;
  issueDate: Date | string; // Support both Date and ISO string
  incidentDate: Date | string;
  employeeName?: string;
  employeeNumber?: string;
}

export interface EscalationRecommendation {
  // Core recommendation
  suggestedLevel: WarningLevel;
  recommendedLevel: string;
  reason: string;

  // HR Intervention System
  requiresHRIntervention: boolean;
  interventionReason?: string;
  interventionLevel?: 'urgent' | 'standard';

  // Context — simplified summaries instead of full Warning objects (Firestore size limits)
  activeWarnings: SimplifiedWarningSummary[];
  escalationPath: WarningLevel[];
  isEscalation: boolean;

  // LRA Compliance
  category: string;
  categoryId: string;
  legalBasis: string;
  legalRequirements: string[];

  // Progressive discipline context
  warningCount: number; // Total active warnings across all categories
  categoryWarningCount?: number; // Warnings in this specific category
  nextExpiryDate: Date;
  examples: string[];
  explanation: string;
  previousWarnings: SimplifiedWarningSummary[];
}
