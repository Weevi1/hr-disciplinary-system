// ExplainerPanel.tsx - Click-toggle inline disclosure for contextual help.
// Deliberately not a hover tooltip: works identically for touch and keyboard,
// needs no portal or z-index, and stays usable on the oldest supported devices.
import React, { useId, useState } from 'react';
import { ChevronDown, HelpCircle, Scale } from 'lucide-react';

interface ExplainerPanelProps {
  label: string;
  children: React.ReactNode;
  variant?: 'info' | 'legal';
  defaultOpen?: boolean;
  className?: string;
}

export const ExplainerPanel: React.FC<ExplainerPanelProps> = ({
  label,
  children,
  variant = 'info',
  defaultOpen = false,
  className = ''
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const Icon = variant === 'legal' ? Scale : HelpCircle;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 text-sm font-medium min-h-[44px] py-2 transition-colors"
        style={{ color: 'var(--color-primary, #2563eb)' }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          id={panelId}
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-alert-info-bg, #eff6ff)',
            color: 'var(--color-alert-info-text, #1e3a8a)',
            borderLeft: '3px solid var(--color-primary, #2563eb)'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default ExplainerPanel;
