// ThemedCard - Theme-aware card component that respects all themes
// 🚀 OPTIMIZED: React.memo + useMemo for style calculations + useCallback for handlers
import React, { useMemo, useCallback } from 'react';

export interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedCard = React.memo<ThemedCardProps>(({
  children,
  className = '',
  style,
  hover = false,
  padding = 'md',
  shadow = 'md',
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadowVar = {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)'
  };

  // 🚀 MEMOIZED: Style calculation only runs when dependencies change
  const cardStyle: React.CSSProperties = useMemo(() => ({
    backgroundColor: 'var(--color-card-background)',
    border: '1px solid var(--color-card-border)',
    boxShadow: shadowVar[shadow],
    transition: 'all 0.2s ease',
    ...style
  }), [shadow, style]);

  // 🚀 MEMOIZED: Hover handlers only recreated when dependencies change
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = shadowVar.lg;
    }
  }, [hover]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = shadowVar[shadow];
    }
  }, [hover, shadow]);

  return (
    <div
      className={`rounded-lg ${paddingClasses[padding]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
});

// Display name for React DevTools
ThemedCard.displayName = 'ThemedCard';

// ThemedSectionHeader - Unified section header component
export interface ThemedSectionHeaderProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedSectionHeader = React.memo<ThemedSectionHeaderProps>(({
  icon: Icon,
  title,
  subtitle,
  rightContent,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </div>
  );
});

// Display name for React DevTools
ThemedSectionHeader.displayName = 'ThemedSectionHeader';

// ThemedFormInput - Unified form input component
export interface ThemedFormInputProps {
  type?: 'text' | 'email' | 'date' | 'time' | 'textarea' | 'select';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedFormInput = React.memo<ThemedFormInputProps>(({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  required = false,
  disabled = false,
  options,
  className = ''
}) => {
  // 🚀 MEMOIZED: Style calculation only runs when error state changes
  const inputStyle: React.CSSProperties = useMemo(() => ({
    backgroundColor: error ? 'var(--color-alert-error-bg)' : 'var(--color-input-background)',
    borderColor: error ? 'var(--color-alert-error-border)' : 'var(--color-input-border)',
    color: 'var(--color-text)'
  }), [error]);

  // 🚀 MEMOIZED: Change handler only recreated when onChange changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const renderInput = () => {
    const commonProps = {
      value,
      onChange: handleChange,
      placeholder,
      disabled,
      className: `w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
      style: inputStyle
    };

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps as any}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm min-h-[88px] resize-vertical ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      );
    }

    if (type === 'select' && options) {
      return (
        <select {...commonProps as any}>
          <option value="">{placeholder || `Select ${label.toLowerCase()}...`}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    return <input {...commonProps as any} type={type} />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {Icon && <Icon className="w-3 h-3 inline mr-1" />}
        {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </label>
      {renderInput()}
      {error && (
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
});

// Display name for React DevTools
ThemedFormInput.displayName = 'ThemedFormInput';

// ThemedBadge component for status indicators
export interface ThemedBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedBadge = React.memo<ThemedBadgeProps>(({
  children,
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  // 🚀 MEMOIZED: Expensive style calculation only runs when variant changes
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-badge-primary)',
          color: 'var(--color-badge-primary-text)'
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-badge-success)',
          color: 'var(--color-badge-success-text)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-badge-warning)',
          color: 'var(--color-badge-warning-text)'
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-badge-error)',
          color: 'var(--color-badge-error-text)'
        };
      default:
        return {
          backgroundColor: 'var(--color-badge-default)',
          color: 'var(--color-badge-default-text)'
        };
    }
  }, [variant]);

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full ${className}`}
      style={variantStyles}
    >
      {children}
    </span>
  );
});

// Display name for React DevTools
ThemedBadge.displayName = 'ThemedBadge';

// ThemedAlert component for notifications
export interface ThemedAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
  onClose?: () => void;
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedAlert = React.memo<ThemedAlertProps>(({
  children,
  variant = 'info',
  className = '',
  onClose
}) => {
  // 🚀 MEMOIZED: Expensive style calculation only runs when variant changes
  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--color-alert-success-bg)',
          borderColor: 'var(--color-alert-success-border)',
          color: 'var(--color-alert-success-text)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-alert-warning-bg)',
          borderColor: 'var(--color-alert-warning-border)',
          color: 'var(--color-alert-warning-text)'
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-alert-error-bg)',
          borderColor: 'var(--color-alert-error-border)',
          color: 'var(--color-alert-error-text)'
        };
      default:
        return {
          backgroundColor: 'var(--color-alert-info-bg)',
          borderColor: 'var(--color-alert-info-border)',
          color: 'var(--color-alert-info-text)'
        };
    }
  }, [variant]);

  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        borderColor: variantStyles.borderColor,
        color: variantStyles.color
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-lg leading-none opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: variantStyles.color }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
});

// Display name for React DevTools
ThemedAlert.displayName = 'ThemedAlert';