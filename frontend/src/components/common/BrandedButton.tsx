// frontend/src/components/common/BrandedButton.tsx
// Button component that automatically uses organization branding

import React from 'react';
import { useBranding } from '../../contexts/BrandingContext';

interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const BrandedButton: React.FC<BrandedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const { colors, getBrandedButtonClass } = useBranding();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: '0.5rem',
      fontWeight: '500',
      transition: 'all 0.2s ease-in-out',
      border: 'none',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.6 : 1,
      outline: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    } as React.CSSProperties;

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primaryColor,
          color: 'white',
          boxShadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondaryColor,
          color: 'white',
          boxShadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: colors.accentColor,
          color: 'white',
          boxShadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          color: colors.primaryColor,
          border: `1px solid ${colors.primaryColor}`,
          boxShadow: 'none'
        };
      default:
        return baseStyle;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    const button = e.currentTarget;
    
    switch (variant) {
      case 'primary':
        button.style.backgroundColor = adjustBrightness(colors.primaryColor, -10);
        break;
      case 'secondary':
        button.style.backgroundColor = adjustBrightness(colors.secondaryColor, -10);
        break;
      case 'accent':
        button.style.backgroundColor = adjustBrightness(colors.accentColor, -10);
        break;
      case 'outline':
        button.style.backgroundColor = colors.primaryColor;
        button.style.color = 'white';
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    const button = e.currentTarget;
    const originalStyle = getButtonStyle();
    
    button.style.backgroundColor = originalStyle.backgroundColor || '';
    button.style.color = originalStyle.color || '';
  };

  return (
    <button
      {...props}
      className={`${sizeClasses[size]} ${className}`}
      style={getButtonStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
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