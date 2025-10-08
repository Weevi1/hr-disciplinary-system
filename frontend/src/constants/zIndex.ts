// frontend/src/constants/zIndex.ts
// 🎯 Z-INDEX SCALE - STANDARDIZED LAYERING SYSTEM
// ✅ Prevents z-index conflicts across the application
// ✅ Clear hierarchy for overlays, modals, and UI elements

/**
 * Standardized z-index values for the HR Disciplinary System
 *
 * Usage:
 * ```tsx
 * import { Z_INDEX } from '@/constants/zIndex';
 *
 * <div style={{ zIndex: Z_INDEX.modal }}>...</div>
 * ```
 */
export const Z_INDEX = {
  // ============================================
  // BASE LAYERS (0-999)
  // ============================================
  base: 0,
  aboveBase: 1,

  // ============================================
  // UI ELEMENTS (1000-8999)
  // ============================================
  dropdown: 1000,
  sticky: 1100,
  fixedHeader: 1200,
  sidePanel: 1300,

  // ============================================
  // OVERLAY LAYERS (9000-9999)
  // ============================================
  overlay: 9000,

  // Modal System - Base Level
  modalBackdrop: 9000,
  modal: 9000,

  // Modal System - Nested Modals (Level 1)
  // Used when a modal opens on top of another modal
  // Example: WarningDetailsModal → AudioModal
  modalNested1Backdrop: 9010,
  modalNested1: 9010,

  // Modal System - Nested Modals (Level 2)
  // Used for modals opened from nested modals
  // Example: WarningDetailsModal → SignatureModal → IndividualSignatureModal
  modalNested2Backdrop: 9020,
  modalNested2: 9020,

  // Modal System - Nested Modals (Level 3)
  // Rarely needed, but available for deep nesting
  modalNested3Backdrop: 9030,
  modalNested3: 9030,

  // ============================================
  // NOTIFICATION LAYERS (9100-9199)
  // ============================================
  toast: 9100,
  notification: 9110,
  alert: 9120,

  // ============================================
  // UTILITY LAYERS (9200-9999)
  // ============================================
  tooltip: 9200,
  popover: 9210,
  contextMenu: 9220,

  // Maximum z-index (use sparingly)
  maximum: 9999,
} as const;

/**
 * Helper type for z-index values
 */
export type ZIndexValue = typeof Z_INDEX[keyof typeof Z_INDEX];

/**
 * Helper function to get z-index for nested modals
 *
 * @param nestingLevel - 0 for base modal, 1 for first nested, 2 for second nested, etc.
 * @returns Appropriate z-index value
 *
 * @example
 * ```tsx
 * const zIndex = getModalZIndex(0); // 9000 - base modal
 * const zIndex = getModalZIndex(1); // 9010 - nested modal
 * ```
 */
export const getModalZIndex = (nestingLevel: number = 0): number => {
  switch (nestingLevel) {
    case 0:
      return Z_INDEX.modal;
    case 1:
      return Z_INDEX.modalNested1;
    case 2:
      return Z_INDEX.modalNested2;
    case 3:
      return Z_INDEX.modalNested3;
    default:
      // For extremely deep nesting (shouldn't happen), add 10 per level
      return Z_INDEX.modalNested3 + ((nestingLevel - 3) * 10);
  }
};

/**
 * Helper function to create inline style with z-index
 *
 * @example
 * ```tsx
 * <div style={createZIndexStyle(Z_INDEX.modal)}>...</div>
 * ```
 */
export const createZIndexStyle = (zIndex: number): React.CSSProperties => ({
  zIndex
});
