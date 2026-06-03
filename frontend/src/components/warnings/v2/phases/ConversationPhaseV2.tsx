// frontend/src/components/warnings/v2/phases/ConversationPhaseV2.tsx
//
// V2 Conversation phase. Merges V1 Phases 3 (Employee Response), 4
// (Expected Standards), and 5 (Improvement Plan) into one scrollable
// screen with clear section dividers. Sections (A) and (C) grey out with
// an explanatory caption when the warning level doesn't require
// commitments (Final Written, dismissal) — they don't vanish, so managers
// don't experience inconsistent wizard length.

import React from 'react';
import { MessageSquare, Target, TrendingUp, Lock } from 'lucide-react';
import { WordCountTextareaPhase } from '../../enhanced/phases/WordCountTextareaPhase';
import { ImprovementPlanPhase } from '../../enhanced/phases/ImprovementPlanPhase';
import type { Category, FormData, ActionCommitment } from '../wizardTypesV2';

interface ConversationPhaseV2Props {
  levelInfo: { label: string; color: string; requiresCommitments: boolean };
  // Section A: Employee's response
  employeeStatement: string;
  setEmployeeStatement: (value: string) => void;
  // Section B: Expected standards
  expectedBehavior: string;
  setExpectedBehavior: (value: string) => void;
  selectedCategory: Category | undefined;
  // Section C: Improvement plan
  actionCommitments: ActionCommitment[];
  setActionCommitments: (commitments: ActionCommitment[]) => void;
  reviewDate: string;
  setReviewDate: (date: string) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

interface SectionShellProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  letter: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  disabledCaption?: string;
  children: React.ReactNode;
}

const SectionShell: React.FC<SectionShellProps> = ({
  icon: Icon,
  letter,
  title,
  subtitle,
  disabled,
  disabledCaption,
  children,
}) => (
  <div>
    <div className="flex items-center gap-3 mb-3">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-primary)',
          color: 'white',
        }}
      >
        {letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-primary)' }}
          />
          <h4
            className="text-sm font-semibold"
            style={{ color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
          >
            {title}
          </h4>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      </div>
    </div>
    {disabled && disabledCaption ? (
      <div
        className="rounded-lg border-dashed border p-4 flex items-center gap-2"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {disabledCaption}
        </p>
      </div>
    ) : (
      <div>{children}</div>
    )}
  </div>
);

export const ConversationPhaseV2: React.FC<ConversationPhaseV2Props> = ({
  levelInfo,
  employeeStatement,
  setEmployeeStatement,
  expectedBehavior,
  setExpectedBehavior,
  selectedCategory,
  actionCommitments,
  setActionCommitments,
  reviewDate,
  setReviewDate,
  formData,
  setFormData,
}) => {
  const greyOutAandC = !levelInfo.requiresCommitments;
  const disabledCaption = `Not required for ${levelInfo.label} warnings — skip ahead to the expected standard below.`;

  return (
    <div className="space-y-6 divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
      {/* === Section A: Employee's response === */}
      <SectionShell
        icon={MessageSquare}
        letter="A"
        title="Employee's response"
        subtitle="What did the employee say when you discussed the incident?"
        disabled={greyOutAandC}
        disabledCaption={disabledCaption}
      >
        <WordCountTextareaPhase
          value={employeeStatement}
          onChange={setEmployeeStatement}
          placeholder="Record the employee's response to the incident discussion..."
        />
      </SectionShell>

      {/* === Section B: Expected standards === */}
      <div className="pt-5">
        <SectionShell
          icon={Target}
          letter="B"
          title="Expected standard"
          subtitle="What behavior, performance, or conduct is expected going forward?"
        >
          <WordCountTextareaPhase
            value={expectedBehavior}
            onChange={setExpectedBehavior}
            placeholder="Document the expected behavior, performance, or conduct standards..."
            showTemplateBadge={
              !!selectedCategory?.expectedStandardsTemplate &&
              expectedBehavior === selectedCategory.expectedStandardsTemplate
            }
          />
        </SectionShell>
      </div>

      {/* === Section C: Improvement plan === */}
      <div className="pt-5">
        <SectionShell
          icon={TrendingUp}
          letter="C"
          title="Improvement plan"
          subtitle="Specific commitments with timelines and a follow-up review date."
          disabled={greyOutAandC}
          disabledCaption={disabledCaption}
        >
          <ImprovementPlanPhase
            levelInfo={levelInfo}
            actionCommitments={actionCommitments}
            setActionCommitments={setActionCommitments}
            reviewDate={reviewDate}
            setReviewDate={setReviewDate}
            formData={formData}
            setFormData={setFormData}
          />
        </SectionShell>
      </div>
    </div>
  );
};
