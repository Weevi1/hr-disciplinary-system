// frontend/src/contexts/BrandingContext.tsx
// White-label branding system for organization customization

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useOrganization } from './OrganizationContext';

interface BrandingColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface BrandingContextValue {
  logo: string | null;
  companyName: string;
  colors: BrandingColors;
  applyBrandingStyles: () => void;
  getBrandedButtonClass: (type: 'primary' | 'secondary' | 'accent') => string;
  getBrandedBadgeStyle: (variant?: 'default' | 'success' | 'warning' | 'error') => React.CSSProperties;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: React.ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const { organization } = useOrganization();

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

  return (
    <BrandingContext.Provider value={brandingValue}>
      {children}
    </BrandingContext.Provider>
  );
};

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