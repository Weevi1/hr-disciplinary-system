// useSwipeNavigation.ts - Touch gesture navigation for mobile wizards
// Priority 2: Mobile-First - Swipe navigation between phases

import { useRef, useCallback, useEffect } from 'react';

interface SwipeNavigationOptions {
  /**
   * Callback for swipe left (next)
   */
  onSwipeLeft?: () => void;

  /**
   * Callback for swipe right (previous)
   */
  onSwipeRight?: () => void;

  /**
   * Minimum swipe distance to trigger (px). Default: 50
   */
  threshold?: number;

  /**
   * Maximum time for swipe gesture (ms). Default: 300
   */
  maxTime?: number;

  /**
   * Whether swipe is enabled. Default: true
   */
  enabled?: boolean;

  /**
   * Whether to allow swipe left. Default: true
   */
  allowLeft?: boolean;

  /**
   * Whether to allow swipe right. Default: true
   */
  allowRight?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

export function useSwipeNavigation<T extends HTMLElement = HTMLDivElement>(
  options: SwipeNavigationOptions = {}
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    maxTime = 300,
    enabled = true,
    allowLeft = true,
    allowRight = true
  } = options;

  const containerRef = useRef<T>(null);
  const touchStateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isTracking: true
    };
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStateRef.current.isTracking) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStateRef.current.startX;
    const deltaY = touch.clientY - touchStateRef.current.startY;

    // If vertical scroll is more prominent, stop tracking horizontal swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
      touchStateRef.current.isTracking = false;
    }
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStateRef.current.isTracking) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStateRef.current.startX;
    const deltaY = touch.clientY - touchStateRef.current.startY;
    const deltaTime = Date.now() - touchStateRef.current.startTime;

    // Reset tracking
    touchStateRef.current.isTracking = false;

    // Check if it's a valid horizontal swipe
    if (
      Math.abs(deltaX) >= threshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
      deltaTime <= maxTime
    ) {
      if (deltaX < 0 && allowLeft && onSwipeLeft) {
        // Swipe left → next
        onSwipeLeft();
      } else if (deltaX > 0 && allowRight && onSwipeRight) {
        // Swipe right → previous
        onSwipeRight();
      }
    }
  }, [enabled, threshold, maxTime, allowLeft, allowRight, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return containerRef;
}

export default useSwipeNavigation;
