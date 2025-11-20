// frontend/src/contexts/ThemeBrandingContext.tsx
// 🚀 WEEK 4 OPTIMIZATION: Combined Theme + Branding Provider
// Reduces provider nesting from 4 to 3 by merging related functionality

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useOrganization } from './OrganizationContext';
import {
  ThemeName,
  ThemeColors,
  lightTheme,
  darkTheme,
  generateBrandedTheme,
  applyTheme
} from '../config/themes';

// ============================================
// TYPES
// ============================================

interface BrandingColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface ThemeBrandingContextValue {
  // Theme properties
  currentTheme: ThemeName;
  themeColors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  isLoading: boolean;

  // Branding properties
  logo: string | null;
  companyName: string;
  colors: BrandingColors;
  applyBrandingStyles: () => void;
  getBrandedButtonClass: (type: 'primary' | 'secondary' | 'accent') => string;
  getBrandedBadgeStyle: (variant?: 'default' | 'success' | 'warning' | 'error') => React.CSSProperties;
}

const ThemeBrandingContext = createContext<ThemeBrandingContextValue | null>(null);

const THEME_STORAGE_KEY = 'hr-system-theme';

// ============================================
// HOOKS
// ============================================

export const useThemeBranding = () => {
  const context = useContext(ThemeBrandingContext);
  if (!context) {
    throw new Error('useThemeBranding must be used within a ThemeBrandingProvider');
  }
  return context;
};

// Backward compatibility hooks
export const useTheme = () => {
  const { currentTheme, themeColors, setTheme, toggleTheme, isLoading } = useThemeBranding();
  return { currentTheme, themeColors, setTheme, toggleTheme, isLoading };
};

export const useBranding = () => {
  const { logo, companyName, colors, applyBrandingStyles, getBrandedButtonClass, getBrandedBadgeStyle } = useThemeBranding();
  return { logo, companyName, colors, applyBrandingStyles, getBrandedButtonClass, getBrandedBadgeStyle };
};

export const useIsDarkMode = (): boolean => {
  const { currentTheme } = useThemeBranding();
  return currentTheme === 'dark';
};

export const useIsBrandedTheme = (): boolean => {
  const { currentTheme } = useThemeBranding();
  return currentTheme === 'branded';
};

// ============================================
// PROVIDER
// ============================================

interface ThemeBrandingProviderProps {
  children: React.ReactNode;
}

export const ThemeBrandingProvider: React.FC<ThemeBrandingProviderProps> = ({ children }) => {
  // 🚀 OPTIMIZATION: Handle case where OrganizationProvider is not available (super-users, resellers)
  let organization = null;
  try {
    const orgContext = useOrganization();
    organization = orgContext.organization;
  } catch (e) {
    // Organization context not available - that's ok for super-users and resellers
  }

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('light');
  const [themeColors, setThemeColors] = useState<ThemeColors>(lightTheme);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // THEME LOGIC
  // ============================================

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

  // Add a smooth transition class to the body
  useEffect(() => {
    if (!isLoading) {
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }
  }, [isLoading]);

  // ============================================
  // BRANDING LOGIC
  // ============================================

  const brandingValue = useMemo(() => {
    const defaultColors: BrandingColors = {
      primaryColor: '#3b82f6',   // Default blue
      secondaryColor: '#6366f1',  // Default indigo
      accentColor: '#10b981'      // Default emerald
    };

    const colors: BrandingColors = organization?.branding ? {
      primaryColor: organization.branding.primaryColor || defaultColors.primaryColor,
      secondaryColor: organization.branding.secondaryColor || defaultColors.secondaryColor,
      accentColor: organization.branding.accentColor || defaultColors.accentColor,
    } : defaultColors;

    const logo = organization?.branding?.logo || null;
    const companyName = organization?.branding?.companyName || organization?.name || 'HR System';

    const applyBrandingStyles = () => {
      // Dynamically inject CSS custom properties for organization branding
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', colors.primaryColor);
      root.style.setProperty('--brand-secondary', colors.secondaryColor);
      root.style.setProperty('--brand-accent', colors.accentColor);

      // Computed variations for better UI
      root.style.setProperty('--brand-primary-hover', adjustBrightness(colors.primaryColor, -10));
      root.style.setProperty('--brand-primary-light', adjustBrightness(colors.primaryColor, 40));
      root.style.setProperty('--brand-secondary-hover', adjustBrightness(colors.secondaryColor, -10));
      root.style.setProperty('--brand-accent-hover', adjustBrightness(colors.accentColor, -10));
    };

    const getBrandedButtonClass = (type: 'primary' | 'secondary' | 'accent'): string => {
      const baseClass = 'px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

      switch (type) {
        case 'primary':
          return `${baseClass} branded-btn-primary`;
        case 'secondary':
          return `${baseClass} branded-btn-secondary`;
        case 'accent':
          return `${baseClass} branded-btn-accent`;
        default:
          return baseClass;
      }
    };

    const getBrandedBadgeStyle = (variant: 'default' | 'success' | 'warning' | 'error' = 'default'): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'white'
      };

      switch (variant) {
        case 'success':
          return { ...baseStyle, backgroundColor: colors.accentColor };
        case 'warning':
          return { ...baseStyle, backgroundColor: '#f59e0b', color: 'white' };
        case 'error':
          return { ...baseStyle, backgroundColor: '#ef4444', color: 'white' };
        default:
          return { ...baseStyle, backgroundColor: colors.primaryColor };
      }
    };

    return {
      logo,
      companyName,
      colors,
      applyBrandingStyles,
      getBrandedButtonClass,
      getBrandedBadgeStyle
    };
  }, [organization]);

  // Apply branding styles when organization changes
  useEffect(() => {
    brandingValue.applyBrandingStyles();
  }, [brandingValue]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: ThemeBrandingContextValue = {
    // Theme
    currentTheme,
    themeColors,
    setTheme,
    toggleTheme,
    isLoading,

    // Branding
    logo: brandingValue.logo,
    companyName: brandingValue.companyName,
    colors: brandingValue.colors,
    applyBrandingStyles: brandingValue.applyBrandingStyles,
    getBrandedButtonClass: brandingValue.getBrandedButtonClass,
    getBrandedBadgeStyle: brandingValue.getBrandedBadgeStyle
  };

  return (
    <ThemeBrandingContext.Provider value={value}>
      {children}
    </ThemeBrandingContext.Provider>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;

  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;

  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}
