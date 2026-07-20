// EmptyState.tsx - Shared instructive empty state for lists and dashboards.
// Prefer telling the user how the screen gets populated ("Managers submit these
// from their dashboard…") over a bare "No X found".
import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: { label: string; onClick: () => void };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false
}) => {
  const ActionIcon = action?.icon;

  return (
    <div className={`text-center ${compact ? 'py-8 px-4' : 'py-12 px-6'}`}>
      <Icon
        className={`${compact ? 'w-8 h-8 mb-3' : 'w-10 h-10 mb-4'} mx-auto`}
        style={{ color: 'var(--color-text-tertiary, #9ca3af)' }}
      />
      <h3
        className={`${compact ? 'text-md' : 'text-lg'} font-semibold mb-1`}
        style={{ color: 'var(--color-text, #111827)' }}
      >
        {title}
      </h3>
      <div
        className="text-sm mb-4 max-w-md mx-auto"
        style={{ color: 'var(--color-text-secondary, #4b5563)' }}
      >
        {description}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white shadow-md transition-all"
          style={{ backgroundColor: 'var(--color-primary, #4f46e5)' }}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
      {secondaryAction && (
        <div className={action ? 'mt-3' : ''}>
          <button
            onClick={secondaryAction.onClick}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--color-primary, #2563eb)' }}
          >
            {secondaryAction.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
