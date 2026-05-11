// frontend/src/components/warnings/enhanced/phases/WordCountTextareaPhase.tsx
//
// Shared phase shell for the Employee Response and Expected Standards
// phases — both are a single word-count-validated textarea (6-word
// minimum) with optional banners above. Extracted in Phase 2 Tier 3C
// step 7.

import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { ThemedAlert } from '../../../common/ThemedCard';
import { getWordCount } from '../wizardHelpers';

interface WordCountTextareaPhaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minWords?: number;
  /** Render an "optional for {level}" banner above the textarea. */
  optionalNotice?: { levelLabel: string } | null;
  /** Show a pre-filled-from-template badge above the textarea. */
  showTemplateBadge?: boolean;
}

export const WordCountTextareaPhase: React.FC<WordCountTextareaPhaseProps> = ({
  value,
  onChange,
  placeholder,
  minWords = 6,
  optionalNotice = null,
  showTemplateBadge = false,
}) => {
  const wordCount = getWordCount(value);
  const isShort = wordCount > 0 && wordCount < minWords;

  return (
    <div className="space-y-4">
      {optionalNotice && (
        <ThemedAlert variant="info">
          For {optionalNotice.levelLabel} warnings, this section is optional.
        </ThemedAlert>
      )}

      {showTemplateBadge && (
        <div
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit"
          style={{ backgroundColor: 'var(--color-alert-info-bg)', color: 'var(--color-alert-info-text)' }}
        >
          <Info className="w-3 h-3" />
          Pre-filled from category template — edit as needed
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
        style={{
          backgroundColor: isShort ? 'var(--color-alert-error-bg)' : 'var(--color-background)',
          borderColor: isShort ? 'var(--color-alert-error-border)' : 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      />
      <div
        className="flex items-center justify-between text-xs"
        style={{
          color: isShort ? 'var(--color-error)' : 'var(--color-text-secondary)',
        }}
      >
        <span>
          {wordCount}/{minWords} words minimum
        </span>
        {wordCount >= minWords && <CheckCircle className="w-4 h-4 text-green-500" />}
      </div>
    </div>
  );
};
