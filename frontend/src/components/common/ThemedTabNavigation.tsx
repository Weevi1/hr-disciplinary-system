// ThemedTabNavigation - Tab navigation component for dashboard sections
// 🚀 OPTIMIZED: React.memo + useMemo for style calculations + useCallback for handlers
import React, { useMemo, useCallback } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface ThemedTabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

// 🚀 MEMOIZED: Prevents re-renders when props haven't changed
export const ThemedTabNavigation = React.memo<ThemedTabNavigationProps>(({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // 🚀 MEMOIZED: Base styles only calculated once
  const baseTabStyles: React.CSSProperties = useMemo(() => ({
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }), []);

  // 🚀 MEMOIZED: Tab styles only recalculated when dependencies change
  const getTabStyles = useCallback((tabId: string): React.CSSProperties => {
    const isActive = tabId === activeTab;

    if (variant === 'minimal') {
      return {
        ...baseTabStyles,
        color: isActive ? 'var(--color-nav-tab-active)' : 'var(--color-nav-tab-inactive)',
        borderBottomColor: isActive ? 'var(--color-nav-tab-active)' : 'transparent',
        backgroundColor: 'transparent'
      };
    }

    return {
      ...baseTabStyles,
      color: isActive ? 'var(--color-nav-tab-active)' : 'var(--color-nav-tab-inactive)',
      borderBottomColor: isActive ? 'var(--color-nav-tab-active)' : 'transparent',
      backgroundColor: isActive ? 'var(--color-background-secondary)' : 'transparent',
      borderRadius: isActive ? '0.5rem 0.5rem 0 0' : '0.5rem 0.5rem 0 0'
    };
  }, [activeTab, variant, baseTabStyles]);

  // 🚀 MEMOIZED: Hover styles only recalculated when variant changes
  const hoverStyles = useMemo((): React.CSSProperties => ({
    color: 'var(--color-nav-tab-hover)',
    backgroundColor: variant === 'minimal' ? 'transparent' : 'var(--color-background-tertiary)'
  }), [variant]);

  // 🚀 MEMOIZED: Event handlers only recreated when dependencies change
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>, tabId: string) => {
    if (tabId !== activeTab) {
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  }, [activeTab, hoverStyles]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>, tabId: string) => {
    if (tabId !== activeTab) {
      Object.assign(e.currentTarget.style, getTabStyles(tabId));
    }
  }, [activeTab, getTabStyles]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = `0 0 0 2px var(--color-focus-ring)`;
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  }, []);

  return (
    <div
      className={`flex border-b ${className}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${sizeClasses[size]} font-medium focus:outline-none`}
          style={getTabStyles(tab.id)}
          onClick={() => onTabChange(tab.id)}
          onMouseEnter={(e) => handleMouseEnter(e, tab.id)}
          onMouseLeave={(e) => handleMouseLeave(e, tab.id)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {tab.icon && (
            <span className="w-4 h-4 flex-shrink-0">
              {tab.icon}
            </span>
          )}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className="rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] text-center"
              style={{
                backgroundColor: tab.id === activeTab ? 'var(--color-badge-primary)' : 'var(--color-badge-default)',
                color: tab.id === activeTab ? 'var(--color-badge-primary-text)' : 'var(--color-badge-default-text)'
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

// Display name for React DevTools
ThemedTabNavigation.displayName = 'ThemedTabNavigation';

export default ThemedTabNavigation;