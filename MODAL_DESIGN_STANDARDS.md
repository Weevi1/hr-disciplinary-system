# HR System Modal Design Standards
## Gold Standard Based on Enhanced Warning Wizard Step 1

*This document establishes the definitive design standards for all modal interfaces in the HR Disciplinary System, using Step 1 of the Enhanced Warning Wizard as the north star.*

---

## 🎯 Design Philosophy

**Core Principle**: Every modal should feel like it was designed by the same person with unwavering attention to mobile optimization, professional aesthetics, and user experience consistency.

**Target Compatibility**: Samsung Galaxy S8+ era devices (2017+) with progressive enhancement for modern devices.

---

## 📐 Layout Architecture

### **1. Full-Screen Modal Structure**

```typescript
interface ModalLayout {
  container: 'fixed inset-0 z-50';           // Full viewport coverage
  backdrop: 'bg-black bg-opacity-50';       // Semi-transparent overlay
  content: 'flex flex-col h-full';          // Flex container for 3-tier layout
  safeArea: 'env(safe-area-inset-*)';       // Modern device support
}
```

### **2. Three-Tier Layout System**

```scss
.modal-container {
  display: flex;
  flex-direction: column;
  height: 100vh;

  .modal-header {
    min-height: 40px;
    flex-shrink: 0;
    background: var(--color-card-background);
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0.75rem; // Mobile-optimized
  }

  .modal-footer {
    flex-shrink: 0;
    background: var(--color-card-background);
  }
}
```

### **3. Responsive Grid Patterns**

```typescript
// Primary pattern for form fields
const ResponsiveGrid = {
  single: 'grid-cols-1',                    // Mobile default
  dual: 'grid-cols-1 md:grid-cols-2',      // Date/time pairs
  triple: 'grid-cols-1 md:grid-cols-3',    // Category selections
  adaptive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' // Progressive
};
```

---

## 🎨 Visual Design System

### **1. Typography Hierarchy**

```css
/* Samsung S8+ Optimized Typography Scale */
.text-h1 { font-size: 1.25rem; font-weight: 600; }      /* 20px - Modal titles */
.text-h2 { font-size: 1.125rem; font-weight: 600; }     /* 18px - Section headers */
.text-h3 { font-size: 1rem; font-weight: 500; }         /* 16px - Subsections */
.text-body { font-size: 0.875rem; font-weight: 400; }   /* 14px - Primary content */
.text-small { font-size: 0.8125rem; font-weight: 400; } /* 13px - Secondary info */
.text-xs { font-size: 0.75rem; font-weight: 400; }      /* 12px - Metadata */

/* Professional font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### **2. Color Theming System**

```typescript
interface ThemeVariables {
  // Primary Brand Colors
  '--color-primary': string;              // Main brand color
  '--color-primary-light': string;        // Lighter variant
  '--color-primary-dark': string;         // Darker variant

  // Text Hierarchy
  '--color-text': string;                 // Primary text
  '--color-text-secondary': string;       // Secondary text
  '--color-text-tertiary': string;        // Tertiary/muted text

  // Surface Colors
  '--color-background': string;           // Page background
  '--color-card-background': string;      // Card/modal background
  '--color-input-background': string;     // Form field background
  '--color-muted': string;               // Subtle backgrounds

  // Interactive States
  '--color-border': string;              // Default borders
  '--color-input-border': string;        // Form field borders
  '--color-hover': string;               // Hover state
  '--color-focus': string;               // Focus state

  // Semantic Colors
  '--color-success': string;             // Success states
  '--color-error': string;               // Error states
  '--color-warning': string;             // Warning states
  '--color-info': string;                // Information

  // Alert System
  '--color-alert-success-bg': string;    // Success alert background
  '--color-alert-success-text': string;  // Success alert text
  '--color-alert-error-bg': string;      // Error alert background
  '--color-alert-error-border': string;  // Error alert border
  '--color-alert-warning-bg': string;    // Warning alert background
  '--color-alert-info-bg': string;       // Info alert background
}
```

### **3. Spacing System**

```css
/* Progressive spacing scale */
.space-xs { gap: 0.375rem; }    /* 6px - Ultra-compact for S8+ */
.space-sm { gap: 0.5rem; }      /* 8px - Tight spacing */
.space-md { gap: 0.75rem; }     /* 12px - Standard spacing */
.space-lg { gap: 1rem; }        /* 16px - Generous spacing */
.space-xl { gap: 1.5rem; }      /* 24px - Section spacing */

/* Card padding system */
.card-padding-sm { padding: 0.75rem; }    /* 12px - Compact cards */
.card-padding-md { padding: 1rem; }       /* 16px - Standard cards */
.card-padding-lg { padding: 1.5rem; }     /* 24px - Spacious cards */
```

---

## 🧩 Component Architecture

### **1. Atomic Design Hierarchy**

```typescript
// ATOMS - Base building blocks
interface BaseAtoms {
  ThemedButton: React.ComponentType<ButtonProps>;
  ThemedInput: React.ComponentType<InputProps>;
  ThemedCard: React.ComponentType<CardProps>;
  ThemedBadge: React.ComponentType<BadgeProps>;
}

// MOLECULES - Simple combinations
interface BaseMolecules {
  ThemedSectionHeader: React.ComponentType<SectionHeaderProps>;
  ThemedFormInput: React.ComponentType<FormInputProps>;
  CustomDatePicker: React.ComponentType<DatePickerProps>;
  SlotMachineSpinner: React.ComponentType<SpinnerProps>;
}

// ORGANISMS - Complex components
interface BaseOrganisms {
  EmployeeSelector: React.ComponentType<EmployeeSelectorProps>;
  CategorySelector: React.ComponentType<CategorySelectorProps>;
  IncidentDetailsForm: React.ComponentType<IncidentFormProps>;
}
```

### **2. ThemedSectionHeader Standard**

```typescript
interface ThemedSectionHeaderProps {
  icon: LucideIcon;                    // Consistent icon system
  title: string;                       // Primary heading
  subtitle?: string;                   // Supporting description
  rightContent?: React.ReactNode;      // Optional badges/actions
  className?: string;                  // Additional styling
  size?: 'sm' | 'md' | 'lg';          // Size variants
}

// Usage example
<ThemedSectionHeader
  icon={User}
  title="Employee Selection"
  subtitle="Choose the employee involved in this incident"
  rightContent={<Badge>{employeeCount}</Badge>}
  size="md"
/>
```

### **3. Unified Form Field Pattern**

```typescript
interface UnifiedFormFieldProps {
  label: string;                       // Field label
  icon?: LucideIcon;                   // Optional icon
  required?: boolean;                  // Required field indicator
  error?: string;                      // Validation error message
  disabled?: boolean;                  // Disabled state
  className?: string;                  // Additional classes
  style?: React.CSSProperties;        // Custom styles
}

// Standard input styling
const unifiedInputClasses = `
  w-full h-11 px-3 py-2 border rounded-lg
  focus:ring-2 focus:ring-purple-500 focus:border-purple-500
  text-sm transition-colors
`;

const unifiedInputStyles = {
  backgroundColor: 'var(--color-input-background)',
  borderColor: 'var(--color-input-border)',
  color: 'var(--color-text)'
};
```

---

## 📱 Mobile Optimization Standards

### **1. Touch Target Requirements**

```css
/* Minimum touch target sizes */
.touch-target-minimal { min-height: 28px; min-width: 28px; }  /* Icon buttons */
.touch-target-standard { min-height: 44px; min-width: 44px; } /* Form fields */
.touch-target-primary { min-height: 48px; min-width: 48px; }  /* Primary actions */

/* Touch feedback */
.touch-feedback {
  transition: transform 0.1s ease, background-color 0.2s ease;
}

.touch-feedback:active {
  transform: scale(0.96);
}
```

### **2. Responsive Breakpoint Strategy**

```typescript
const breakpoints = {
  'xs': '375px',        // Samsung S8+ base width
  'sm': '428px',        // iPhone 12 Pro Max
  'md': '768px',        // Tablet portrait
  'lg': '1024px',       // Tablet landscape
  'xl': '1280px',       // Desktop
};

// Mobile-first media queries
const mobileFirst = {
  base: '',             // Mobile by default
  sm: '@media (min-width: 428px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
};
```

### **3. Progressive Enhancement Patterns**

```typescript
// Modal rendering strategy
const ModalStrategy = {
  mobile: 'full-screen overlay with native app feel',
  tablet: 'centered modal with backdrop',
  desktop: 'optimized modal with hover states'
};

// Feature detection over assumptions
const supportsHover = window.matchMedia('(hover: hover)').matches;
const supportesTouch = 'ontouchstart' in window;
```

---

## ⚡ Interactive Patterns

### **1. State Management Standards**

```typescript
// Validation state interface
interface ValidationState {
  touched: Set<string>;                // Fields user has interacted with
  errors: Record<string, string>;     // Current validation errors
  isValid: boolean;                   // Overall form validity
  isSubmitting: boolean;              // Submission state
}

// Auto-save pattern
interface AutoSaveState {
  isSaving: boolean;                  // Save in progress
  lastSaved: Date | null;             // Last save timestamp
  hasUnsavedChanges: boolean;         // Dirty state tracking
}
```

### **2. Real-time Validation Pattern**

```typescript
const useRealTimeValidation = (formData: any, validators: any) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = useCallback((field: string, value: any) => {
    const validator = validators[field];
    const error = validator ? validator(value) : null;
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  }, [validators]);

  const markTouched = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field));
  }, []);

  return { errors, touched, validateField, markTouched };
};
```

### **3. Loading State Standards**

```typescript
// Loading spinner component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${
    size === 'sm' ? 'h-4 w-4' :
    size === 'md' ? 'h-6 w-6' :
    'h-8 w-8'
  }`} />
);

// Skeleton loading pattern
const SkeletonLoader = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);
```

---

## 🎛️ Button Hierarchy Standards

### **1. Button Types & Usage**

```typescript
interface ButtonHierarchy {
  primary: {
    usage: 'Main actions (Submit, Save, Continue)';
    style: 'solid background with primary color';
    prominence: 'highest';
  };
  secondary: {
    usage: 'Supporting actions (Cancel, Back, Edit)';
    style: 'outlined or subtle background';
    prominence: 'medium';
  };
  ghost: {
    usage: 'Subtle actions (toggles, show/hide)';
    style: 'text-only with hover state';
    prominence: 'low';
  };
  minimal: {
    usage: 'Icon-only controls (close, expand)';
    style: 'icon with minimal background';
    prominence: 'minimal';
  };
}
```

### **2. Button Component Standard**

```typescript
interface ThemedButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'minimal';
  size: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Example usage
<ThemedButton
  variant="primary"
  size="lg"
  icon={CheckCircle}
  iconPosition="left"
  loading={isSubmitting}
  fullWidth
>
  Continue to Next Step
</ThemedButton>
```

---

## 📊 Progress Indication Standards

### **1. Step Progress Component**

```typescript
interface StepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
  currentStep: string;
  variant: 'dots' | 'numbers' | 'rich';
}

// Mobile-optimized progress dots
const ProgressDots = ({ steps, currentStep }: StepProgressProps) => (
  <div className="flex items-center justify-center space-x-2">
    {steps.map((step, index) => (
      <div
        key={step.id}
        className={`w-2 h-2 rounded-full transition-colors ${
          step.status === 'completed' ? 'bg-green-500' :
          step.status === 'current' ? 'bg-blue-500' :
          'bg-gray-300'
        }`}
      />
    ))}
  </div>
);
```

### **2. Progress Bar Pattern**

```typescript
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);
```

---

## 🎭 Animation & Transition Standards

### **1. Smooth Transitions**

```css
/* Standard transition timing */
.transition-smooth { transition: all 0.2s ease-in-out; }
.transition-fast { transition: all 0.1s ease-in-out; }
.transition-slow { transition: all 0.3s ease-in-out; }

/* Modal entrance animations */
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
}

/* Hover animations (desktop only) */
@media (hover: hover) {
  .hover-lift:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
```

### **2. Loading Animations**

```css
/* Spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse animation for skeletons */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🔧 Implementation Guidelines

### **1. Modal Creation Checklist**

- [ ] Uses full-screen layout on mobile with three-tier structure
- [ ] Implements ThemedSectionHeader for all major sections
- [ ] Uses unified form field components with validation
- [ ] Follows button hierarchy with proper prominence
- [ ] Includes touch-optimized interactions (48px+ targets)
- [ ] Implements real-time validation with visual feedback
- [ ] Uses CSS variables for consistent theming
- [ ] Includes auto-save functionality for data protection
- [ ] Supports keyboard navigation and accessibility
- [ ] Tests on Samsung S8+ resolution (375px width)

### **2. Component Composition Pattern**

```typescript
// Standard modal structure
const StandardModal = ({ children, title, onClose }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex flex-col bg-white">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b">
      <h1 className="text-h1 font-semibold">{title}</h1>
      <ThemedButton variant="minimal" icon={X} onClick={onClose} />
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {children}
    </div>

    {/* Footer */}
    <div className="border-t p-4">
      <ModalFooter />
    </div>
  </div>
);
```

### **3. Testing Requirements**

```typescript
// Responsive testing matrix
const TestingMatrix = {
  devices: ['Samsung Galaxy S8+', 'iPhone 12', 'iPad', 'Desktop'],
  orientations: ['portrait', 'landscape'],
  themes: ['light', 'dark', 'branded'],
  interactions: ['touch', 'mouse', 'keyboard'],
  states: ['loading', 'error', 'success', 'validation']
};
```

---

## 📝 Code Examples

### **1. Complete Modal Implementation**

```typescript
// ExampleModal.tsx - Following gold standard
import React, { useState } from 'react';
import { X, User, Calendar } from 'lucide-react';
import { ThemedSectionHeader, ThemedButton, CustomDatePicker } from '../common';

interface ExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ExampleModal: React.FC<ExampleModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    selectedEmployee: '',
    meetingDate: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header - Following gold standard */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold text-gray-900">
          Schedule Meeting
        </h1>
        <ThemedButton variant="minimal" icon={X} onClick={onClose} />
      </div>

      {/* Content - Following gold standard spacing */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Employee Selection - Following gold standard pattern */}
        <div>
          <ThemedSectionHeader
            icon={User}
            title="Select Employee"
            subtitle="Choose the team member for this meeting"
          />
          <select
            value={formData.selectedEmployee}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              selectedEmployee: e.target.value
            }))}
            className="w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            style={{
              backgroundColor: 'var(--color-input-background)',
              borderColor: 'var(--color-input-border)',
              color: 'var(--color-text)'
            }}
          >
            <option value="">Choose an employee...</option>
          </select>
        </div>

        {/* Date Selection - Following gold standard pattern */}
        <CustomDatePicker
          type="date"
          label="Meeting Date"
          value={formData.meetingDate}
          onChange={(value) => setFormData(prev => ({
            ...prev,
            meetingDate: value
          }))}
          icon={Calendar}
          required
        />
      </div>

      {/* Footer - Following gold standard */}
      <div className="border-t p-4 flex gap-3">
        <ThemedButton
          variant="secondary"
          size="lg"
          onClick={onClose}
          fullWidth
        >
          Cancel
        </ThemedButton>
        <ThemedButton
          variant="primary"
          size="lg"
          onClick={() => onSubmit(formData)}
          fullWidth
        >
          Schedule Meeting
        </ThemedButton>
      </div>
    </div>
  );
};
```

---

## 🎯 Compliance Matrix

### **Current Modal Status** *(Updated after comprehensive audit)*

| Modal Component | Layout | Typography | Theming | Components | Mobile | Status | Priority |
|-----------------|--------|------------|---------|------------|--------|--------|----------|
| **Step 1** | ✅ Gold Standard | ✅ Gold Standard | ✅ Gold Standard | ✅ Gold Standard | ✅ Gold Standard | 🟢 **COMPLIANT** | ✅ Complete |
| **Step 2** | 🟡 Partial | 🟡 Partial | ✅ Good | 🔴 Critical | 🟡 Partial | 🟡 **NEEDS WORK** | 🔥 High Priority |
| **Step 3** | 🟡 Partial | 🟡 Partial | ✅ Good | 🔴 Critical | 🟡 Partial | 🟡 **NEEDS WORK** | 🔥 High Priority |
| **HR Meeting** | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 **NON-COMPLIANT** | 🚨 **CRITICAL** |
| **Report Absence** | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 **NON-COMPLIANT** | 🚨 **CRITICAL** |
| **Counselling** | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 Critical | 🔴 **NON-COMPLIANT** | 🚨 **CRITICAL** |

### **Audit Summary & Action Plan**

#### **🚨 Critical Issues Found:**
- **HR Meeting, Report Absence, Counselling**: All use traditional form layouts instead of full-screen modals
- **Typography inconsistency**: Multiple font size systems across components
- **Missing ThemedSectionHeader usage**: Critical for visual hierarchy
- **Non-responsive design patterns**: Desktop-first approaches on mobile-critical modals
- **Inconsistent button hierarchy**: Various styling approaches across components

#### **🔥 High Priority Fixes:**
1. **Convert all modals to full-screen layout** following Step 1 pattern
2. **Implement ThemedSectionHeader** consistently across all sections
3. **Standardize typography scales** to Samsung S8+ optimized sizes
4. **Unify button styling** using established hierarchy
5. **Add mobile touch targets** (48px minimum for primary actions)

#### **⏭ Next Actions:**
1. Start with **HR Meeting Modal** (most frequently used)
2. Apply **Standard Modal Template** from this document
3. Test on **Samsung S8+ resolution** (375px width)
4. **Progressive rollout** to remaining components

---

*This document serves as the definitive reference for all modal design decisions in the HR Disciplinary System. Any deviation from these standards must be documented and justified.*

**Last Updated**: 2025-01-28
**Version**: 1.0
**Status**: Gold Standard Established
**Next Review**: After all modals achieve compliance