// frontend/src/components/warnings/v2/phases/WizardOverviewPhase.tsx
//
// Intro screen for the V2 warning wizard. Removes the "I don't know what's
// coming" anxiety by laying out the 5 steps with rough timing, then
// announcing the audio recording and signature requirements before they
// happen mid-flow.

import React from 'react';
import {
  ClipboardList,
  FileText,
  MessageSquare,
  PenTool,
  Send,
  Mic,
  PenLine,
  ScrollText,
  Clock,
} from 'lucide-react';

interface WizardOverviewPhaseProps {
  isAudioEnabled: boolean;
}

const steps = [
  { num: 1, label: 'Setup', icon: ClipboardList, desc: 'Pick the employee and the misconduct category.' },
  { num: 2, label: 'What happened', icon: FileText, desc: 'Document the facts and attach any evidence.' },
  { num: 3, label: 'The conversation', icon: MessageSquare, desc: "Capture the employee's response, expected standards, and the improvement plan." },
  { num: 4, label: 'Sign & save', icon: PenTool, desc: 'Read the script aloud, preview the PDF, capture signatures.' },
  { num: 5, label: 'Deliver', icon: Send, desc: 'Choose how the warning reaches the employee.' },
];

export const WizardOverviewPhase: React.FC<WizardOverviewPhaseProps> = ({ isAudioEnabled }) => (
  <div className="space-y-5">
    {/* Time + step count summary */}
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-primary-light)' }}
    >
      <Clock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          5 steps, around 4 minutes
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          You can step back at any time to adjust earlier answers.
        </p>
      </div>
    </div>

    {/* The 5 steps */}
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        What you'll do
      </p>
      <ol className="space-y-2">
        {steps.map(({ num, label, icon: Icon, desc }) => (
          <li
            key={num}
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              borderColor: 'var(--color-border-light)',
              backgroundColor: 'var(--color-card-background)',
            }}
          >
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
            >
              {num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {label}
                </p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>

    {/* Important notices before they happen mid-flow */}
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Before you continue
      </p>
      <ul className="space-y-2">
        {isAudioEnabled && (
          <li
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)' }}
          >
            <Mic className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
            <div className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
              <strong>Audio recording starts when you continue.</strong> The discussion is recorded
              for compliance. You'll see a red recording indicator in the header.
            </div>
          </li>
        )}
        <li
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-alert-info-bg)' }}
        >
          <PenLine className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-alert-info-text)' }} />
          <div className="text-xs" style={{ color: 'var(--color-alert-info-text)' }}>
            <strong>Two or three signatures required.</strong> Manager signs, then employee (or a
            witness if the employee refuses). A signature pad opens when you tap each slot.
          </div>
        </li>
        <li
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-alert-info-bg)' }}
        >
          <ScrollText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-alert-info-text)' }} />
          <div className="text-xs" style={{ color: 'var(--color-alert-info-text)' }}>
            <strong>You'll preview the full PDF before signing.</strong> Nothing is saved until you
            tap Save Warning on Step 4.
          </div>
        </li>
      </ul>
    </div>
  </div>
);
