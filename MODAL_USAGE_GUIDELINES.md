# Modal Usage Guidelines
## HR Disciplinary System - Modal Best Practices

**Version:** 1.0
**Last Updated:** 2025-10-08
**Status:** Week 2-3 Implementation

---

## 📋 Table of Contents

1. [When to Use Which Modal System](#when-to-use-which-modal-system)
2. [Standard Modal Pattern (Recommended)](#standard-modal-pattern-recommended)
3. [UnifiedModal Pattern (For Wizards)](#unifiedmodal-pattern-for-wizards)
4. [Accessibility Requirements](#accessibility-requirements)
5. [Scroll Strategy Best Practices](#scroll-strategy-best-practices)
6. [Code Examples](#code-examples)

---

## When to Use Which Modal System

### Decision Tree

```
Is this a multi-step wizard with variable-length content?
├─ YES → Use UnifiedModal (absolute positioning, natural scroll)
└─ NO  → Use Standard Pattern (fixed positioning, content scroll)
    ├─ Single-screen form/dialog?
    │  └─ Use Standard Pattern
    ├─ Detail view (read-only)?
    │  └─ Use Standard Pattern
    ├─ Confirmation dialog?
    │  └─ Use Standard Pattern
    └─ Complex nested interactions?
       └─ Use Standard Pattern with proper z-index
```

### Quick Reference Table

| Use Case | Pattern | Example |
|----------|---------|---------|
| **Multi-step wizard** | UnifiedModal | Warning Creation Wizard |
| **Single form** | Standard | Employee Form, Promotion Modal |
| **Detail viewer** | Standard | Warning Details, PDF Viewer |
| **Confirmation** | Standard | Archive Modal, Delete Confirmation |
| **Upload/Import** | Standard | Employee Import, File Upload |
| **Selection** | Standard | Delivery Method Selection |

---

## Standard Modal Pattern (Recommended)

### When to Use
- Single-screen dialogs
- Forms that fit in one view
- Confirmation dialogs
- Detail views
- Any non-wizard modal

### Structure

```tsx
import React from 'react';
import { usePreventBodyScroll } from '@/hooks/usePreventBodyScroll';
import { useModalDialog } from '@/hooks/useFocusTrap';
import { Z_INDEX } from '@/constants/zIndex';
import { X } from 'lucide-react';

interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // ... other props
}

export const MyModal: React.FC<MyModalProps> = ({
  isOpen,
  onClose,
  title,
}) => {
  // 1. Prevent body scroll
  usePreventBodyScroll(isOpen);

  // 2. Set up focus trap and ARIA
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'modal-title',
    descriptionId: 'modal-description',
  });

  if (!isOpen) return null;

  return (
    // 3. Overlay with proper z-index
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 4. Modal container */}
      <div
        ref={containerRef}
        {...ariaProps}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* 5. Fixed Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6. Scrollable Content */}
        <div
          id="modal-description"
          className="flex-1 overflow-y-auto p-6 min-h-0"
        >
          {/* Your content here - can be very long */}
          <p>Modal content...</p>
        </div>

        {/* 7. Fixed Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Key Points

**✅ DO:**
- Use `flex flex-col` on container
- Use `flex-shrink-0` on header and footer
- Use `flex-1 overflow-y-auto min-h-0` on content
- Include `usePreventBodyScroll(isOpen)`
- Include `useModalDialog()` for accessibility
- Use `Z_INDEX.modal` for base modals
- Use `Z_INDEX.modalNested1` for nested modals

**❌ DON'T:**
- Apply `overflow-y-auto` to the entire modal container
- Use `max-h-[90vh]` without `flex flex-col` structure
- Forget `min-h-0` on content area (causes flex issues)
- Hardcode z-index values (use constants)

---

## UnifiedModal Pattern (For Wizards)

### When to Use
- Multi-step wizards with step navigation
- Variable-length content that may be very long
- Forms that need natural document flow

### Usage

```tsx
import React, { useState } from 'react';
import { UnifiedModal } from '@/components/common/UnifiedModal';

export const MyWizard = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Multi-Step Wizard"
      subtitle="Complete all steps"
      currentStep={currentStep}
      totalSteps={3}
      primaryAction={{
        label: 'Next',
        onClick: () => setCurrentStep(currentStep + 1),
      }}
      secondaryAction={{
        label: 'Back',
        onClick: () => setCurrentStep(currentStep - 1),
      }}
    >
      {/* Step content */}
      {currentStep === 0 && <Step1 />}
      {currentStep === 1 && <Step2 />}
      {currentStep === 2 && <Step3 />}
    </UnifiedModal>
  );
};
```

### Key Features
- Uses absolute positioning (not fixed)
- Allows natural page scroll
- Built-in step navigation
- Mobile-optimized (full-screen on mobile)
- Already includes body scroll prevention
- Already includes ARIA labels

---

## Accessibility Requirements

### Minimum Requirements (WCAG 2.1 AA)

**1. Keyboard Navigation**
- ✅ Focus trap within modal
- ✅ Escape key closes modal
- ✅ Tab/Shift+Tab cycles through focusable elements
- ✅ Focus returns to trigger on close

**2. ARIA Attributes**
```tsx
<div
  ref={containerRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <div id="modal-description">Modal content description</div>
</div>
```

**3. Screen Reader Support**
- Modal title announced when opened
- Close button has `aria-label="Close modal"`
- Form fields have proper labels
- Error messages associated with fields

**4. Visual Focus Indicators**
```css
/* Ensure visible focus indicators */
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Using the Accessibility Hooks

**Simple Approach:**
```tsx
import { useModalDialog } from '@/hooks/useFocusTrap';

const { containerRef, ariaProps } = useModalDialog({
  isOpen,
  onClose,
  titleId: 'modal-title',
});

return <div ref={containerRef} {...ariaProps}>...</div>;
```

**Advanced Approach:**
```tsx
import { useFocusTrap } from '@/hooks/useFocusTrap';

const modalRef = useFocusTrap({
  isActive: isOpen,
  onEscape: onClose,
  autoFocus: true,
  returnFocus: true,
});

return (
  <div
    ref={modalRef}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    ...
  </div>
);
```

---

## Scroll Strategy Best Practices

### ✅ Recommended: Content-Only Scroll

**Why:**
- Header remains visible (context preserved)
- Footer always accessible (actions visible)
- Better UX on mobile
- Consistent with modern modal patterns

**Structure:**
```tsx
<div className="max-h-[90vh] flex flex-col">
  <div className="flex-shrink-0">Header (always visible)</div>
  <div className="flex-1 overflow-y-auto min-h-0">
    Scrollable content
  </div>
  <div className="flex-shrink-0">Footer (always visible)</div>
</div>
```

### ❌ Avoid: Entire Modal Scroll

**Why:**
- Header scrolls out of view (context lost)
- Footer may be hidden below fold
- Inconsistent experience
- Poor mobile UX

**Anti-pattern:**
```tsx
{/* ❌ DON'T DO THIS */}
<div className="max-h-[90vh] overflow-y-auto">
  <div>Header</div>
  <div>Content</div>
  <div>Footer</div>
</div>
```

---

## Code Examples

### Example 1: Simple Confirmation Modal

```tsx
export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  usePreventBodyScroll(isOpen);
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'confirm-title',
    descriptionId: 'confirm-message',
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
    >
      <div
        ref={containerRef}
        {...ariaProps}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h2 id="confirm-title" className="text-xl font-semibold mb-4">
            {title}
          </h2>
          <p id="confirm-message" className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Example 2: Form Modal with Validation

```tsx
export const FormModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});

  usePreventBodyScroll(isOpen);
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'form-title',
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
    >
      <div
        ref={containerRef}
        {...ariaProps}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Fixed Header */}
        <div className="p-6 border-b flex-shrink-0">
          <h2 id="form-title" className="text-xl font-semibold">Create User</h2>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-600 mt-1">
                  {errors.name}
                </p>
              )}
            </div>
            {/* More fields... */}
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="p-6 border-t flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Example 3: Nested Modal (Detail View from List)

```tsx
export const ParentModal = ({ isOpen, onClose }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  usePreventBodyScroll(isOpen);
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'parent-title',
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Parent Modal - z-9000 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{ zIndex: Z_INDEX.modal }}
      >
        <div ref={containerRef} {...ariaProps} className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="p-6 border-b flex-shrink-0">
            <h2 id="parent-title">Item List</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <button onClick={() => setShowDetailModal(true)}>
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modal - z-9010 */}
      {showDetailModal && (
        <NestedDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </>
  );
};

const NestedDetailModal = ({ isOpen, onClose }) => {
  usePreventBodyScroll(isOpen);
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'detail-title',
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modalNested1 }} // Higher z-index!
    >
      <div ref={containerRef} {...ariaProps} className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6">
          <h2 id="detail-title">Item Details</h2>
          {/* Content */}
        </div>
      </div>
    </div>
  );
};
```

---

## Common Pitfalls to Avoid

### 1. Missing `min-h-0` on Content

**Problem:**
```tsx
{/* ❌ Content won't scroll properly */}
<div className="flex-1 overflow-y-auto">
  Content
</div>
```

**Solution:**
```tsx
{/* ✅ Content scrolls correctly */}
<div className="flex-1 overflow-y-auto min-h-0">
  Content
</div>
```

### 2. Forgetting Body Scroll Prevention

**Problem:**
```tsx
{/* ❌ Background scrolls while modal is open */}
export const MyModal = ({ isOpen, onClose }) => {
  // Missing usePreventBodyScroll!
  return <div>...</div>;
};
```

**Solution:**
```tsx
{/* ✅ Background scroll prevented */}
export const MyModal = ({ isOpen, onClose }) => {
  usePreventBodyScroll(isOpen);
  return <div>...</div>;
};
```

### 3. Hardcoded Z-Index Values

**Problem:**
```tsx
{/* ❌ Magic numbers, potential conflicts */}
<div className="z-50">...</div>
<div style={{ zIndex: 9999 }}>...</div>
```

**Solution:**
```tsx
{/* ✅ Using constants */}
import { Z_INDEX } from '@/constants/zIndex';
<div style={{ zIndex: Z_INDEX.modal }}>...</div>
```

### 4. Missing Accessibility Attributes

**Problem:**
```tsx
{/* ❌ Screen readers won't recognize as modal */}
<div className="fixed inset-0">
  <div>Modal content</div>
</div>
```

**Solution:**
```tsx
{/* ✅ Proper ARIA attributes */}
<div className="fixed inset-0">
  <div
    ref={containerRef}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <h2 id="modal-title">Modal Title</h2>
    Modal content
  </div>
</div>
```

---

## Checklist for New Modals

When creating a new modal, ensure:

- [ ] Uses `usePreventBodyScroll(isOpen)`
- [ ] Uses `useModalDialog()` or `useFocusTrap()`
- [ ] Uses `Z_INDEX` constants (not hardcoded values)
- [ ] Has `role="dialog"` and `aria-modal="true"`
- [ ] Has `aria-labelledby` pointing to title element
- [ ] Header uses `flex-shrink-0`
- [ ] Content uses `flex-1 overflow-y-auto min-h-0`
- [ ] Footer uses `flex-shrink-0`
- [ ] Close button has `aria-label`
- [ ] Escape key closes modal
- [ ] Focus returns to trigger on close
- [ ] Works on mobile (responsive)
- [ ] Tested with keyboard navigation
- [ ] Tested with screen reader

---

## Resources

### Files
- `frontend/src/hooks/usePreventBodyScroll.ts` - Body scroll prevention
- `frontend/src/hooks/useFocusTrap.ts` - Focus trap and accessibility
- `frontend/src/constants/zIndex.ts` - Z-index constants
- `frontend/src/components/common/UnifiedModal.tsx` - Wizard modal component

### Documentation
- `MODAL_AUDIT_REPORT.md` - Original audit findings
- `MODAL_FIXES_IMPLEMENTATION.md` - Week 1 implementation summary
- `MODAL_USAGE_GUIDELINES.md` - This document

### WCAG Guidelines
- [WCAG 2.1 Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [ARIA Practices - Dialog](https://www.w3.org/WAI/ARIA/apg/example-index/dialog-modal/dialog.html)

---

**Version History:**
- v1.0 (2025-10-08) - Initial guidelines (Week 2-3 implementation)
