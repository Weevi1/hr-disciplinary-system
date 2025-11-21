// PhaseGuidance.tsx - Contextual guidance box for each phase
import React from 'react';
import { Info } from 'lucide-react';

interface PhaseGuidanceProps {
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
}

export const PhaseGuidance: React.FC<PhaseGuidanceProps> = ({
  children,
  variant = 'info'
}) => {
  const styles = {
    info: {
      bg: 'var(--color-alert-info-bg)',
      text: 'var(--color-alert-info-text)',
      border: 'var(--color-primary)'
    },
    tip: {
      bg: 'var(--color-alert-success-bg)',
      text: 'var(--color-alert-success-text)',
      border: '#10b981'
    },
    warning: {
      bg: 'var(--color-alert-warning-bg)',
      text: 'var(--color-alert-warning-text)',
      border: '#f59e0b'
    }
  };

  const style = styles[variant];

  return (
    <div
      className="p-4 rounded-lg mb-4"
      style={{
        backgroundColor: style.bg,
        borderLeft: `3px solid ${style.border}`
      }}
    >
      <div className="flex items-start gap-2">
        <Info
          className="w-4 h-4 mt-0.5 flex-shrink-0"
          style={{ color: style.border }}
        />
        <div
          className="text-sm"
          style={{ color: style.text }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PhaseGuidance;
