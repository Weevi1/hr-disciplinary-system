// Theme Context for managing application themes
// Supports light, dark, and branded themes with localStorage persistence

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useOrganization } from './OrganizationContext';
import {
  ThemeName,
  ThemeColors,
  lightTheme,
  darkTheme,
  generateBrandedTheme,
  applyTheme
} from '../config/themes';

interface ThemeContextValue {
  currentTheme: ThemeName;
  themeColors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'hr-system-theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Organization might not be available for super-users and resellers
  let organization = null;
  try {
    const orgContext = useOrganization();
    organization = orgContext.organization;
  } catch (e) {
    // Organization context not available - that's ok for super-users and resellers
  }
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light');
  const [themeColors, setThemeColors] = useState<ThemeColors>(lightTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
    if (savedTheme && ['light', 'dark', 'branded'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }
    setIsLoading(false);
  }, []);

  // Get the appropriate theme colors based on current theme selection
  const getThemeColors = useCallback((themeName: ThemeName): ThemeColors => {
    switch (themeName) {
      case 'dark':
        return darkTheme;
      case 'branded':
        // Use organization colors if available, otherwise fall back to light theme
        if (organization?.branding) {
          const { primaryColor, secondaryColor, accentColor } = organization.branding;
          return generateBrandedTheme(
            primaryColor || '#3b82f6',
            secondaryColor || '#6366f1',
            accentColor || '#10b981'
          );
        }
        return lightTheme;
      case 'light':
      default:
        return lightTheme;
    }
  }, [organization]);

  // Apply theme whenever it changes
  useEffect(() => {
    const colors = getThemeColors(currentTheme);
    setThemeColors(colors);
    applyTheme(colors);

    // Save theme preference
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    // Add theme class to body for Tailwind dark mode support
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme, getThemeColors]);

  // Function to set a specific theme
  const setTheme = useCallback((theme: ThemeName) => {
    setCurrentTheme(theme);
  }, []);

  // Function to cycle through themes
  const toggleTheme = useCallback(() => {
    setCurrentTheme(prev => {
      // Cycle: light -> dark -> branded -> light
      switch (prev) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'branded';
        case 'branded':
          return 'light';
        default:
          return 'light';
      }
    });
  }, []);

  const value: ThemeContextValue = {
    currentTheme,
    themeColors,
    setTheme,
    toggleTheme,
    isLoading
  };

  // Add a smooth transition class to the body
  useEffect(() => {
    if (!isLoading) {
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }
  }, [isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to check if dark mode is active
export const useIsDarkMode = (): boolean => {
  const { currentTheme } = useTheme();
  return currentTheme === 'dark';
};

// Hook to check if branded theme is active
export const useIsBrandedTheme = (): boolean => {
  const { currentTheme } = useTheme();
  return currentTheme === 'branded';
};