// frontend/src/hooks/useFocusTrap.ts
// ♿ FOCUS TRAP HOOK FOR MODAL ACCESSIBILITY
// ✅ Traps focus within modal (WCAG 2.1 AA compliant)
// ✅ Returns focus to trigger element on close
// ✅ Handles Tab/Shift+Tab navigation
// ✅ Supports Escape key to close

import { useEffect, useRef, useCallback } from 'react';

interface UseFocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  isActive: boolean;

  /**
   * Callback when Escape key is pressed
   */
  onEscape?: () => void;

  /**
   * Whether to auto-focus the first focusable element on mount
   * @default true
   */
  autoFocus?: boolean;

  /**
   * Whether to return focus to the trigger element on unmount
   * @default true
   */
  returnFocus?: boolean;
}

/**
 * Hook to trap focus within a modal for accessibility
 *
 * @example
 * ```tsx
 * export const MyModal = ({ isOpen, onClose }) => {
 *   const modalRef = useFocusTrap({
 *     isActive: isOpen,
 *     onEscape: onClose,
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       {/ * Modal content * /}
 *     </div>
 *   );
 * };
 * ```
 */
export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions
) => {
  const {
    isActive,
    onEscape,
    autoFocus = true,
    returnFocus = true,
  } = options;

  const containerRef = useRef<T>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within the container
   */
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      focusableSelectors
    );

    return Array.from(elements).filter((el) => {
      // Filter out hidden elements
      return (
        el.offsetParent !== null &&
        !el.hasAttribute('hidden') &&
        el.getAttribute('aria-hidden') !== 'true'
      );
    });
  }, []);

  /**
   * Handle Tab key navigation
   */
  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab (backward)
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab (forward)
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [getFocusableElements]
  );

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;

      // Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Tab key
      if (event.key === 'Tab') {
        handleTabKey(event);
      }
    },
    [isActive, onEscape, handleTabKey]
  );

  /**
   * Set up focus trap when modal opens
   */
  useEffect(() => {
    if (!isActive) return;

    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Auto-focus first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          focusableElements[0].focus();
        }, 10);
      }
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previously focused element
      if (returnFocus && previouslyFocusedElement.current) {
        // Small delay to ensure modal is fully closed
        setTimeout(() => {
          previouslyFocusedElement.current?.focus();
        }, 10);
      }
    };
  }, [isActive, autoFocus, returnFocus, getFocusableElements, handleKeyDown]);

  return containerRef;
};

/**
 * Helper hook for modal dialogs (combines focus trap with common ARIA attributes)
 *
 * @example
 * ```tsx
 * export const MyModal = ({ isOpen, onClose, title }) => {
 *   const modalRef = useModalDialog({
 *     isOpen,
 *     onClose,
 *     titleId: 'modal-title',
 *   });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={modalRef.containerRef} {...modalRef.ariaProps}>
 *       <h2 id="modal-title">{title}</h2>
 *       {/ * Modal content * /}
 *     </div>
 *   );
 * };
 * ```
 */
export const useModalDialog = (options: {
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  descriptionId?: string;
  autoFocus?: boolean;
  returnFocus?: boolean;
}) => {
  const containerRef = useFocusTrap({
    isActive: options.isOpen,
    onEscape: options.onClose,
    autoFocus: options.autoFocus,
    returnFocus: options.returnFocus,
  });

  const ariaProps = {
    role: 'dialog' as const,
    'aria-modal': true,
    ...(options.titleId && { 'aria-labelledby': options.titleId }),
    ...(options.descriptionId && { 'aria-describedby': options.descriptionId }),
  };

  return {
    containerRef,
    ariaProps,
  };
};
