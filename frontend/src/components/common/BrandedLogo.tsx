// frontend/src/components/common/BrandedLogo.tsx
// White-label logo component that displays organization logo or system logo

import React, { useContext } from 'react';
import { OrganizationContext } from '../../contexts/OrganizationContext';
import { Logo } from './Logo';

interface BrandedLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  showText?: boolean;
  showSystemLogo?: boolean; // Force show system logo (for login screen, etc.)
}

const sizeClasses = {
  small: 'w-8 h-8',      // 32x32px
  medium: 'w-12 h-12',   // 48x48px  
  large: 'w-16 h-16',    // 64x64px
  xlarge: 'w-24 h-24'    // 96x96px
};

export const BrandedLogo: React.FC<BrandedLogoProps> = ({ 
  size = 'medium', 
  className = '', 
  showText = false,
  showSystemLogo = false
}) => {
  // Safely access organization context - it might not exist for super-users
  const organizationContext = useContext(OrganizationContext);
  const organization = organizationContext?.organization || null;

  const sizeClass = sizeClasses[size];
  
  // Use organization logo if available and not forcing system logo
  const hasOrganizationLogo = organization?.branding?.logo && !showSystemLogo;
  const companyName = organization?.branding?.companyName || organization?.name || 'Filing System';

  if (hasOrganizationLogo) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Organization Logo */}
        <img
          src={organization.branding.logo!}
          alt={`${companyName} Logo`}
          className={`${sizeClass} flex-shrink-0 object-contain rounded-md`}
          onError={(e) => {
            console.warn('Organization logo failed to load, falling back to system <File> logo');
            const img = e.target as HTMLImageElement;
            const fallbackDiv = img.nextElementSibling as HTMLElement;
            img.style.display = 'none';
            fallbackDiv?.classList.remove('hidden');
          }}
        />
        
        {/* Fallback system <File> logo (hidden by default) */}
        <div className="hidden">
          <Logo size={size} showText={false} />
        </div>

        {/* Optional company text */}
        {showText && (
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">{companyName}</span>
            <span className="text-xs text-gray-600">by Fifo</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback to system logo
  return <Logo size={size} className={className} showText={showText} />;
};

// Enhanced version with branding colors support
export const BrandedLogoWithColors: React.FC<BrandedLogoProps & { 
  primaryColor?: string;
  secondaryColor?: string; 
}> = ({ 
  primaryColor, 
  secondaryColor, 
  ...props 
}) => {
  // Safely access organization context - it might not exist for super-users/resellers
  const organizationContext = useContext(OrganizationContext);
  const organization = organizationContext?.organization || null;
  
  const colors = {
    primary: primaryColor || organization?.branding?.primaryColor || '#3b82f6',
    secondary: secondaryColor || organization?.branding?.secondaryColor || '#6366f1'
  };

  return (
    <div style={{ color: colors.primary }}>
      <BrandedLogo {...props} />
    </div>
  );
};