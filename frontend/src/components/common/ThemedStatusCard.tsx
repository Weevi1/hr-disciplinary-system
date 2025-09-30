import React from 'react';
import { ThemedCard } from './ThemedCard';

export interface ThemedStatusCardProps {
  title: string;
  count: number;
  total?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'urgent';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

export const ThemedStatusCard: React.FC<ThemedStatusCardProps> = ({
  title,
  count,
  total,
  subtitle,
  icon,
  variant = 'default',
  onClick,
  className = '',
  size = 'md',
  gradient = false
}) => {
  const sizeConfig = {
    sm: {
      padding: 'sm' as const,
      titleSize: 'text-xs',
      countSize: 'text-lg',
      subtitleSize: 'text-xs',
      iconSize: 'w-3 h-3'
    },
    md: {
      padding: 'md' as const,
      titleSize: 'text-sm',
      countSize: 'text-2xl',
      subtitleSize: 'text-xs',
      iconSize: 'w-4 h-4'
    },
    lg: {
      padding: 'lg' as const,
      titleSize: 'text-base',
      countSize: 'text-3xl',
      subtitleSize: 'text-sm',
      iconSize: 'w-5 h-5'
    }
  };

  const config = sizeConfig[size];

  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transition: 'all 0.2s ease-in-out'
    };

    if (gradient) {
      switch (variant) {
        case 'info':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, var(--color-info), var(--color-primary))',
            color: 'var(--color-text-inverse)',
            border: 'none'
          };
        case 'success':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, var(--color-success), var(--color-accent))',
            color: 'var(--color-text-inverse)',
            border: 'none'
          };
        case 'warning':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, var(--color-warning), #f97316)',
            color: 'var(--color-text-inverse)',
            border: 'none'
          };
        case 'error':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, var(--color-error), #dc2626)',
            color: 'var(--color-text-inverse)',
            border: 'none'
          };
        case 'urgent':
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, var(--color-urgent-bg), var(--color-error))',
            color: 'var(--color-urgent-text)',
            borderColor: 'var(--color-urgent-border)'
          };
        default:
          return {
            ...baseStyles,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'var(--color-text-inverse)',
            border: 'none'
          };
      }
    }

    // Non-gradient variants
    switch (variant) {
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: 'var(--color-alert-info-bg)',
          borderColor: 'var(--color-alert-info-border)',
          color: 'var(--color-alert-info-text)'
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: 'var(--color-alert-success-bg)',
          borderColor: 'var(--color-alert-success-border)',
          color: 'var(--color-alert-success-text)'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: 'var(--color-alert-warning-bg)',
          borderColor: 'var(--color-alert-warning-border)',
          color: 'var(--color-alert-warning-text)'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: 'var(--color-alert-error-bg)',
          borderColor: 'var(--color-alert-error-border)',
          color: 'var(--color-alert-error-text)'
        };
      case 'urgent':
        return {
          ...baseStyles,
          backgroundColor: 'var(--color-urgent-bg)',
          borderColor: 'var(--color-urgent-border)',
          color: 'var(--color-urgent-text)'
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: 'var(--color-stat-card-bg)',
          borderColor: 'var(--color-card-border)',
          color: 'var(--color-text)'
        };
    }
  };

  const getHoverStyles = (): React.CSSProperties => {
    if (!onClick) return {};

    return {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-lg)',
      cursor: 'pointer'
    };
  };

  return (
    <ThemedCard
      padding={config.padding}
      hover={!!onClick}
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={getVariantStyles()}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          Object.assign(e.currentTarget.style, getVariantStyles());
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <span className={`${config.iconSize} flex-shrink-0 opacity-90`}>
                {icon}
              </span>
            )}
            <p className={`${config.titleSize} font-medium opacity-90`}>
              {title}
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <p className={`${config.countSize} font-bold`}>
              {count.toLocaleString()}
            </p>
            {total !== undefined && (
              <span className={`${config.subtitleSize} opacity-75`}>
                of {total.toLocaleString()}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`${config.subtitleSize} opacity-75 mt-1`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </ThemedCard>
  );
};

export default ThemedStatusCard;