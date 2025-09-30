// Theme Selector Component
// Provides UI for switching between light, dark, and branded themes

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface ThemeOption {
  value: 'light' | 'dark' | 'branded';
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const { organization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="w-4 h-4" />,
      description: 'Clean and bright'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className="w-4 h-4" />,
      description: 'Easy on the eyes'
    },
    {
      value: 'branded',
      label: 'Branded',
      icon: <Palette className="w-4 h-4" />,
      description: organization?.name ? `${organization.name} colors` : 'Organization colors'
    }
  ];

  const currentOption = themeOptions.find(option => option.value === currentTheme) || themeOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = (theme: 'light' | 'dark' | 'branded') => {
    setTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border
                   bg-[var(--color-card-background)] text-[var(--color-text)]
                   border-[var(--color-border)] hover:border-[var(--color-border-secondary)]
                   transition-all duration-200 hover:shadow-sm"
        aria-label="Select theme"
      >
        <span className="text-[var(--color-primary)]">{currentOption.icon}</span>
        <span className="hidden sm:inline">{currentOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-56 rounded-lg shadow-lg
                        bg-[var(--color-card-background)] border border-[var(--color-border)]
                        overflow-hidden z-50 animate-fade-in">
          <div className="p-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeSelect(option.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md
                           transition-all duration-150
                           ${currentTheme === option.value
                             ? 'bg-[var(--color-primary)] text-white'
                             : 'hover:bg-[var(--color-background-secondary)] text-[var(--color-text)]'
                           }`}
              >
                <span className={currentTheme === option.value ? 'text-white' : 'text-[var(--color-primary)]'}>
                  {option.icon}
                </span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className={`text-xs ${
                    currentTheme === option.value
                      ? 'text-white/80'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}>
                    {option.description}
                  </div>
                </div>
                {currentTheme === option.value && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for mobile
export const ThemeSelectorCompact: React.FC = () => {
  const { currentTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'branded':
        return <Palette className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--color-card-background)] text-[var(--color-primary)]
                 border border-[var(--color-border)] hover:border-[var(--color-border-secondary)]
                 transition-all duration-200 hover:shadow-sm"
      aria-label={`Current theme: ${currentTheme}. Click to switch.`}
    >
      {getIcon()}
    </button>
  );
};