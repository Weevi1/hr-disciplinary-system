// frontend/src/components/common/Logo.tsx
// 🎨 Reusable Logo Component - Using Actual Logo Images
// ✅ Multiple sizes, optimized for performance with proper image assets

import React from 'react';
import logo64 from '../../assets/images/logo/logo-64.png';
import logo128 from '../../assets/images/logo/logo-128.png';
import logo256 from '../../assets/images/logo/logo-256.png';
import Logger from '../../utils/logger';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  showText?: boolean;
}

const sizeConfig = {
  small: { 
    src: logo64, 
    className: 'w-8 h-6',    // 32x24px - for navbar, small icons
    width: 32, 
    height: 26 
  },
  medium: { 
    src: logo128, 
    className: 'w-12 h-9',   // 48x36px - for cards, medium UI  
    width: 48, 
    height: 39 
  },
  large: { 
    src: logo128, 
    className: 'w-20 h-16',  // 80x64px - for login, headers
    width: 80, 
    height: 64 
  },
  xlarge: { 
    src: logo256, 
    className: 'w-32 h-26', // 128x103px - for splash, main branding
    width: 128, 
    height: 103 
  }
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  className = '', 
  showText = false 
}) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Actual Logo Image */}
      <img
        src={config.src}
        alt="File Logo"
        className={`${config.className} flex-shrink-0 object-contain`}
        width={config.width}
        height={config.height}
        loading="lazy"
        onError={(e) => {
          Logger.warn('Logo image failed to load, using fallback');
          const img = e.target as HTMLImageElement;
          const fallbackDiv = img.nextElementSibling as HTMLElement;
          img.style.display = 'none';
          fallbackDiv?.classList.remove('hidden');
        }}
      />

      {/* Fallback text (only shows if image fails to load) */}
      <div className="hidden text-center">
        <span className="font-bold text-gray-800 text-lg">&lt;File&gt;</span>
      </div>

      {/* "by Fifo" always shows when showText is true */}
      {showText && (
        <span className="text-xs text-gray-600 mt-2">by Fifo</span>
      )}
    </div>
  );
};