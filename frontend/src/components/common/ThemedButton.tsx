// ThemedButton - Theme-aware button component that respects all themes
// 🚀 OPTIMIZED: React.memo + useMemo for style calculations + useCallback for handlers
import React, { useMemo, useCallback } from 'react';

export interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedButton = React.memo<ThemedButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  style,
  icon: Icon,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // 🚀 MEMOIZED: Expensive style calculation only runs when variant changes
  const variantStyles = useMemo(() => {
    const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-primary)',
          hoverColor: 'var(--color-primary-hover)'
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-secondary)',
          hoverColor: 'var(--color-secondary-hover)'
        };
      case 'accent':
        return {
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-accent)',
          hoverColor: 'var(--color-accent-hover)'
        };
      case 'ghost':
        return {
          backgroundColor: 'var(--color-btn-ghost)',
          color: 'var(--color-text)',
          border: '1px solid transparent',
          hoverColor: 'var(--color-btn-ghost-hover)'
        };
      case 'outline':
        return {
          backgroundColor: 'var(--color-btn-outline)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-btn-outline-border)',
          hoverColor: 'var(--color-btn-outline-hover)'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-error)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-error)',
          hoverColor: 'var(--color-error)'
        };
      default:
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          border: '1px solid var(--color-primary)',
          hoverColor: 'var(--color-primary-hover)'
        };
    }
    };
    return getVariantStyles(variant);
  }, [variant]);

  // 🚀 MEMOIZED: Hover handlers only recreated when dependencies change
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'ghost' || variant === 'outline') {
      e.currentTarget.style.backgroundColor = variantStyles.hoverColor;
    } else {
      e.currentTarget.style.backgroundColor = variantStyles.hoverColor;
    }
    if (variant === 'danger') {
      e.currentTarget.style.opacity = '0.9';
    }
    onMouseEnter?.(e);
  }, [variant, variantStyles, onMouseEnter]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
    e.currentTarget.style.opacity = '1';
    onMouseLeave?.(e);
  }, [variantStyles, onMouseLeave]);

  return (
    <button
      className={`${sizeClasses[size]} font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        color: variantStyles.color,
        border: variantStyles.border,
        boxShadow: variant !== 'ghost' && variant !== 'outline' ? 'var(--shadow-sm)' : 'none',
        focusRingColor: 'var(--color-primary)',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {Icon && <Icon className="mr-2" />}
      {children}
    </button>
  );
});

// Display name for React DevTools
ThemedButton.displayName = 'ThemedButton';