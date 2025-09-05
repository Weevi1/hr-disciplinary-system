// frontend/src/components/common/Logo.tsx
// 🎨 Reusable Logo Component - Lightweight SVG Version
// ✅ Multiple sizes, optimized for performance

import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  small: 'w-8 h-6',    // 32x24px - for navbar, small icons
  medium: 'w-12 h-9',  // 48x36px - for cards, medium UI
  large: 'w-20 h-15',  // 80x60px - for login, headers
  xlarge: 'w-32 h-24'  // 128x96px - for splash, main branding
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  className = '', 
  showText = false 
}) => {
  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Logo */}
      <svg 
        className={`${sizeClass} flex-shrink-0`}
        viewBox="0 0 200 150" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="File Logo"
      >
        {/* Background folder shapes */}
        <g fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-700">
          {/* Back folder */}
          <path d="M15 25 L15 120 Q15 130 25 130 L145 130 Q155 130 155 120 L155 25 Q155 15 145 15 L35 15 Q25 15 25 25 Z" 
                fill="currentColor" className="text-slate-100" opacity="0.9"/>
          
          {/* Middle folder */}
          <path d="M45 35 L185 35 Q195 35 195 45 L195 125 Q195 135 185 135 L65 135 Q55 135 55 125 L55 45 Q55 35 65 35 Z" 
                fill="currentColor" className="text-slate-50" opacity="0.95"/>
          
          {/* Front folder tab */}
          <path d="M55 35 L55 25 Q55 15 65 15 L105 15 Q115 15 115 25 L115 35" 
                fill="none"/>
        </g>
        
        {/* "File" text */}
        <text 
          x="100" 
          y="80" 
          textAnchor="middle" 
          className="text-gray-800 font-bold font-mono"
          fontSize="24"
        >
          &lt; File &gt;
        </text>
        
        {/* Subtle highlight effects */}
        <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" className="text-blue-500">
          <path d="M25 25 L135 25"/>
          <path d="M65 45 L175 45"/>
        </g>
      </svg>

      {/* Optional text */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">&lt;File&gt;</span>
          <span className="text-xs text-gray-600">by Fifo</span>
        </div>
      )}
    </div>
  );
};