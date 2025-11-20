// frontend/src/hooks/useBreakpoint.ts
// 🎯 CENTRALIZED BREAKPOINT HOOK
// ✅ Replaces 7+ duplicate implementations across dashboard components
// ✅ Optimized with useCallback to prevent unnecessary re-renders

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for responsive rendering based on screen width
 *
 * @param breakpoint - Minimum width in pixels (e.g., 768 for tablet/desktop)
 * @returns boolean - true if window width is greater than breakpoint
 *
 * @example
 * const isDesktop = useBreakpoint(768);
 * const isLargeScreen = useBreakpoint(1024);
 */
export const useBreakpoint = (breakpoint: number): boolean => {
  const [isAboveBreakpoint, setIsAboveBreakpoint] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > breakpoint
  );

  const handleResize = useCallback(() => {
    setIsAboveBreakpoint(window.innerWidth > breakpoint);
  }, [breakpoint]);

  useEffect(() => {
    // Handle SSR - if window is undefined, skip
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial value
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isAboveBreakpoint;
};

export default useBreakpoint;
