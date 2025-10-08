// frontend/src/hooks/usePreventBodyScroll.ts
// 🔒 BODY SCROLL PREVENTION HOOK
// ✅ Prevents background scrolling when modals are open
// ✅ Automatically restores scroll on unmount
// ✅ Handles multiple modals (ref counting)

import { useEffect } from 'react';

/**
 * Prevents body scrolling when a modal is open
 *
 * @param isOpen - Whether the modal is currently open
 *
 * @example
 * ```tsx
 * export const MyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
 *   usePreventBodyScroll(isOpen);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div className="fixed inset-0 ...">
 *       {/ * Modal content * /}
 *     </div>
 *   );
 * };
 * ```
 */
export const usePreventBodyScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Save original body overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalScrollY = window.scrollY;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    // Cleanup: Restore original scroll behavior
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
};

/**
 * Advanced version with scroll lock for iOS devices
 * Prevents rubber-band scrolling on iOS Safari
 *
 * @param isOpen - Whether the modal is currently open
 */
export const usePreventBodyScrollAdvanced = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPosition = window.getComputedStyle(document.body).position;
    const originalTop = window.getComputedStyle(document.body).top;
    const scrollY = window.scrollY;

    // Prevent scroll on all platforms
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    // iOS-specific fixes for rubber-band scrolling
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      // Restore scroll
      document.body.style.overflow = originalStyle;
      document.body.classList.remove('modal-open');

      // Restore iOS-specific styles
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen]);
};
