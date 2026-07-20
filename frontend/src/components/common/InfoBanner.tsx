// InfoBanner.tsx - Shared contextual guidance box (info / tip / warning)
// Generalized from the warning wizard's PhaseGuidance so guidance looks
// consistent across the app. PhaseGuidance now delegates here.
import React from 'react';
import { Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface InfoBannerProps {
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
  icon?: LucideIcon;
  title?: string;
  className?: string;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  children,
  variant = 'info',
  icon,
  title,
  className = ''
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
  const Icon = icon || Info;

  return (
    <div
      className={`p-4 rounded-lg mb-4 ${className}`}
      style={{
        backgroundColor: style.bg,
        borderLeft: `3px solid ${style.border}`
      }}
    >
      <div className="flex items-start gap-2">
        <Icon
          className="w-4 h-4 mt-0.5 flex-shrink-0"
          style={{ color: style.border }}
        />
        <div
          className="text-sm"
          style={{ color: style.text }}
        >
          {title && (
            <p className="font-semibold mb-1">{title}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoBanner;
