// Unified Loading State Component
// Consistent loading indicator across all dashboard tabs

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <Loader2 className={`${iconSizes[size]} animate-spin text-blue-600`} />
      <span className="ml-2 text-sm text-gray-600">
        {message}
      </span>
    </div>
  );
};