// frontend/src/hooks/useModal.ts
// 🎯 CENTRALIZED MODAL HOOK
// ✅ Replaces 109+ duplicate modal state implementations
// ✅ Standardized open/close logic with optional data handling
// ✅ Automatic cleanup and body scroll prevention

import { useState, useCallback } from 'react';
import { usePreventBodyScroll } from './usePreventBodyScroll';

/**
 * Configuration options for useModal
 */
interface UseModalOptions<T = any> {
  /**
   * Whether to prevent body scroll when modal is open
   * @default true
   */
  preventBodyScroll?: boolean;

  /**
   * Callback fired when modal opens
   */
  onOpen?: (data?: T) => void;

  /**
   * Callback fired when modal closes
   */
  onClose?: () => void;

  /**
   * Initial open state
   * @default false
   */
  initialOpen?: boolean;
}

/**
 * Return type for useModal hook
 */
interface UseModalReturn<T = any> {
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;

  /**
   * Data passed when opening the modal
   */
  data: T | null;

  /**
   * Open the modal with optional data
   */
  open: (data?: T) => void;

  /**
   * Close the modal and clear data
   */
  close: () => void;

  /**
   * Toggle the modal open/closed
   */
  toggle: () => void;

  /**
   * Update the modal data without closing
   */
  setData: (data: T | null) => void;
}

/**
 * Hook for managing modal state and behavior
 *
 * @example
 * // Basic usage
 * const modal = useModal();
 * <Button onClick={modal.open}>Open Modal</Button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>...</Modal>
 *
 * @example
 * // With data
 * const editModal = useModal<Employee>();
 * <Button onClick={() => editModal.open(employee)}>Edit</Button>
 * <EmployeeModal
 *   isOpen={editModal.isOpen}
 *   employee={editModal.data}
 *   onClose={editModal.close}
 * />
 *
 * @example
 * // With callbacks
 * const confirmModal = useModal({
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed'),
 *   preventBodyScroll: true
 * });
 */
export function useModal<T = any>(
  options: UseModalOptions<T> = {}
): UseModalReturn<T> {
  const {
    preventBodyScroll = true,
    onOpen,
    onClose,
    initialOpen = false
  } = options;

  // State
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(null);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(preventBodyScroll && isOpen);

  // Open handler
  const open = useCallback((modalData?: T) => {
    setIsOpen(true);
    if (modalData !== undefined) {
      setData(modalData);
    }
    onOpen?.(modalData);
  }, [onOpen]);

  // Close handler
  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    onClose?.();
  }, [onClose]);

  // Toggle handler
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData
  };
}

/**
 * Hook for managing multiple related modals
 * Useful when you have several modals that should not be open simultaneously
 *
 * @example
 * const modals = useModalGroup(['edit', 'delete', 'view']);
 * <Button onClick={() => modals.open('edit', employee)}>Edit</Button>
 * <Button onClick={() => modals.open('delete', employee)}>Delete</Button>
 *
 * <EditModal
 *   isOpen={modals.isOpen('edit')}
 *   employee={modals.getData<Employee>('edit')}
 *   onClose={modals.close}
 * />
 */
export function useModalGroup<T = any>(modalNames: string[]) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  // Prevent body scroll when any modal is open
  usePreventBodyScroll(activeModal !== null);

  const open = useCallback((modalName: string, modalData?: T) => {
    setActiveModal(modalName);
    if (modalData !== undefined) {
      setData(modalData);
    }
  }, []);

  const close = useCallback(() => {
    setActiveModal(null);
    setData(null);
  }, []);

  const isOpen = useCallback((modalName: string) => {
    return activeModal === modalName;
  }, [activeModal]);

  const getData = useCallback(<D = T,>(): D | null => {
    return data as D | null;
  }, [data]);

  return {
    activeModal,
    open,
    close,
    isOpen,
    getData,
    setData
  };
}

export default useModal;
