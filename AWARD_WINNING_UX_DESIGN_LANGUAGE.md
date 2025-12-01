# Award-Winning UX Design Language

**Version**: 1.0.0
**Reference Implementation**: `UnifiedWarningWizard.tsx`
**Last Updated**: 2025-11-26

This document defines the design language, patterns, and standards for all modals, wizards, and interactive features in the HR Disciplinary System. All new features MUST follow these guidelines to maintain consistency and award-winning UX quality.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Accessibility Standards](#accessibility-standards)
3. [Mobile-First Design](#mobile-first-design)
4. [Micro-Interactions & Animations](#micro-interactions--animations)
5. [Data Safety Patterns](#data-safety-patterns)
6. [Visual Progress Indicators](#visual-progress-indicators)
7. [Component Patterns](#component-patterns)
8. [CSS Classes Reference](#css-classes-reference)
9. [Required Hooks](#required-hooks)
10. [Implementation Checklist](#implementation-checklist)

---

## Core Principles

### 1. Progressive Disclosure
- Break complex tasks into digestible phases/steps
- Maximum 5-9 fields per step
- One primary action per phase
- Each phase has clear guidance text

### 2. Contextual Awareness
- Always show where user is in the process
- Display relevant context (employee name, date, etc.) as quick reference
- Provide clear validation feedback per step

### 3. Forgiving Design
- Auto-save drafts to prevent data loss
- Allow navigation back to previous steps
- Confirm destructive actions
- Provide recovery options

### 4. Emotional Design
- Celebrate success with meaningful feedback
- Use subtle animations to guide attention
- Provide haptic feedback on mobile
- Never leave the user wondering "did it work?"

---

## Accessibility Standards

### WCAG 2.1 AA/AAA Compliance

#### Touch Targets (MANDATORY)
```css
/* Minimum 44×44px for AAA compliance */
.wizard-touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Minimum 24×24px for AA compliance */
.wizard-touch-target-aa {
  min-width: 24px;
  min-height: 24px;
}
```

**Usage**: Apply to ALL interactive elements (buttons, links, checkboxes, radio buttons).

#### Focus Management
```tsx
// Use useFocusTrap hook for all modals
import { useFocusTrap } from '@/hooks/useFocusTrap';

const focusTrapRef = useFocusTrap({
  isActive: isOpen,
  onEscape: onClose,
  autoFocus: true,
  returnFocus: true
});
```

**Requirements**:
- Focus trapped within modal when open
- Escape key closes modal
- Focus returns to trigger element on close
- Visible focus indicators (`:focus-visible`)

#### ARIA Labels (MANDATORY)
```tsx
<div
  ref={focusTrapRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">What this modal does</p>
</div>
```

**Required Attributes**:
- `role="dialog"` on modal container
- `aria-modal="true"` on modal container
- `aria-labelledby` pointing to title ID
- `aria-describedby` pointing to description/guidance ID
- `aria-label` on icon-only buttons
- `aria-current="step"` on current phase indicator
- `role="status"` and `aria-live="polite"` on dynamic status updates

#### Reduced Motion Support (MANDATORY)
```css
@media (prefers-reduced-motion: reduce) {
  .wizard-phase-enter-next,
  .wizard-phase-enter-prev,
  /* ... all animation classes */
  {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Mobile-First Design

### Responsive Container Pattern
```tsx
<div
  className={`
    bg-white shadow-2xl w-full
    ${isMobile
      ? 'h-full rounded-none wizard-mobile-enter'
      : 'max-w-2xl max-h-[90vh] rounded-xl'
    }
    overflow-hidden flex flex-col
  `}
>
```

**Breakpoint**: `640px` (sm in Tailwind)

```tsx
// Mobile detection hook
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 640);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### Mobile-Specific Features

#### 1. Full-Screen on Mobile
- Modal fills entire viewport on mobile
- No rounded corners on mobile
- Slide-up entrance animation

#### 2. Swipe Navigation
```tsx
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const swipeRef = useSwipeNavigation({
  onSwipeLeft: handleNext,
  onSwipeRight: handlePrevious,
  enabled: isMobile,
  threshold: 50,
  maxTime: 300
});
```

#### 3. Haptic Feedback
```tsx
// Trigger on phase transitions
if ('vibrate' in navigator && isMobile) {
  navigator.vibrate(10); // Short pulse for navigation
}

// Success celebration pattern
navigator.vibrate([50, 30, 50]); // Double pulse
```

#### 4. Mobile Swipe Hint (First-time UX)
```tsx
{isMobile && currentPhase === 0 && (
  <div className="px-4 py-2 text-center text-xs border-t"
    style={{
      backgroundColor: 'var(--color-alert-info-bg)',
      color: 'var(--color-alert-info-text)'
    }}>
    💡 Swipe left/right to navigate between phases
  </div>
)}
```

---

## Micro-Interactions & Animations

### Animation Timing Standards

| Animation Type | Duration | Easing |
|---------------|----------|--------|
| Phase transitions | 300ms | ease-out |
| Scale animations | 200ms | ease-out |
| Fade animations | 250ms | ease-out |
| Progress glow | 600ms | ease-in-out |
| Button tap | 100ms | ease-out |
| Success celebration | 500-600ms | cubic-bezier(0.175, 0.885, 0.32, 1.275) |

### Required Animation Classes

#### Phase Transitions
```css
.wizard-phase-enter-next {
  animation: wizard-slide-in-right 0.3s ease-out forwards;
}

.wizard-phase-enter-prev {
  animation: wizard-slide-in-left 0.3s ease-out forwards;
}
```

**Usage**:
```tsx
<div className={`
  ${isTransitioning
    ? transitionDirection === 'next'
      ? 'wizard-phase-enter-next'
      : 'wizard-phase-enter-prev'
    : ''
  }
`}>
  {content}
</div>
```

#### Button Tap Feedback
```css
.wizard-button-tap {
  transition: transform 0.1s ease-out;
}
.wizard-button-tap:active {
  transform: scale(0.97);
}
```

**Usage**: Apply to ALL buttons.

#### Progress Bar Glow
```css
.wizard-progress-glow {
  animation: wizard-progress-pulse 0.6s ease-in-out;
}
```

**Trigger**: When phase transitions.

#### Skeleton Loaders
```tsx
import { WizardSkeleton } from './shared';

// During loading states
{isLoading ? (
  <WizardSkeleton variant="form" /> // or "card", "list", "signature"
) : (
  <ActualContent />
)}
```

### Success Celebration Component
```tsx
import { SuccessCelebration } from './shared';

<SuccessCelebration
  isVisible={showSuccess}
  message="Success Title!"
  subMessage="Additional context"
  onComplete={() => {
    setShowSuccess(false);
    onClose();
  }}
  duration={3000}
  showConfetti={true}
/>
```

**Required for**: All major workflow completions (warnings, reports, submissions).

---

## Data Safety Patterns

### ⚠️ IMPORTANT: When NOT to Use Drafts

**Do NOT use draft auto-save for wizards with:**
- Audio recording (cannot resume recordings)
- Real-time sessions (video calls, live data)
- Time-sensitive processes (signatures with timestamps)

The **Warning Wizard does NOT use drafts** because it includes audio recording of the disciplinary discussion.

### Auto-Save Draft Hook (For Non-Audio Wizards Only)
```tsx
import { useWizardDraft } from '@/hooks/useWizardDraft';

const {
  hasDraft,
  draftData,
  draftPhase,
  lastSaved,
  saveDraft,
  clearDraft,
  hasUnsavedChanges
} = useWizardDraft<DraftDataType>({
  storageKey: `feature-wizard-${organizationId}`,
  initialData: defaultData,
  autoSaveInterval: 2000,
  enabled: !!organizationId
});
```

### Draft Recovery Modal
```tsx
import { DraftRecoveryModal } from './shared';

<DraftRecoveryModal
  isOpen={showDraftRecovery}
  lastSaved={lastSaved}
  phaseName={phaseInfo[draftPhase]?.title}
  onResume={handleResumeDraft}
  onDiscard={handleDiscardDraft}
  onClose={() => setShowDraftRecovery(false)}
/>
```

### Data Safety Features

| Feature | Implementation | When to Use |
|---------|----------------|-------------|
| Auto-save | `useWizardDraft` hook | Multi-step wizards **WITHOUT audio** |
| Unsaved changes warning | `beforeunload` event | Forms with data entry |
| Draft recovery prompt | `DraftRecoveryModal` | On wizard open if draft exists |
| Clear on success | `clearDraft()` | After successful submission |

**Note**: For audio-based wizards, rely on the Success Celebration to confirm completion instead of drafts.

---

## Visual Progress Indicators

### Enhanced Progress Bar Component
```tsx
import { PhaseProgressEnhanced } from './shared';

<PhaseProgressEnhanced
  currentPhase={currentPhase}
  totalPhases={TOTAL_PHASES}
  completedPhases={completedPhases}
  onPhaseClick={goToPhase}
  phaseInfo={PHASE_INFO}
  isTransitioning={isTransitioning}
/>
```

### Phase Info Structure
```tsx
const PHASE_INFO = [
  { title: 'Step Name', icon: IconComponent, guidance: 'Help text' },
  // ...
];
```

### Progress Indicator Features

1. **Thin Progress Bar**: 6px height, rounded, fills as progress is made
2. **Clickable Phase Dots**: Navigate to completed/current phases
3. **Phase States**:
   - **Completed**: Green with checkmark ✓
   - **Current**: Primary color with pulsing ring, scaled up
   - **Upcoming**: Gray, numbered
4. **Hover Tooltips**: Show phase title on hover/focus
5. **Phase Label**: "Phase X of Y" + current phase title
6. **Glow Effect**: Progress bar glows during transitions

---

## Component Patterns

### Modal Container Structure
```tsx
<>
  {/* Overlay */}
  <div
    ref={focusTrapRef}
    className={`
      fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000]
      flex items-center justify-center
      ${isMobile ? 'p-0' : 'p-4'}
    `}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    {/* Modal Content */}
    <div className={`
      bg-white shadow-2xl w-full
      ${isMobile ? 'h-full rounded-none' : 'max-w-2xl max-h-[90vh] rounded-xl'}
      overflow-hidden flex flex-col
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 id="modal-title">Title</h2>
        <button className="wizard-touch-target" aria-label="Close">
          <X />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {content}
      </div>

      {/* Fixed Footer (if needed) */}
      <div className="p-4 border-t">
        {actions}
      </div>
    </div>
  </div>
</>
```

### Phase Header Component
```tsx
import { PhaseHeader } from './shared';

<PhaseHeader
  title={phaseInfo.title}
  icon={phaseInfo.icon}
  phaseNumber={currentPhase + 1}
  totalPhases={TOTAL_PHASES}
  employeeName={employeeName}
  incidentDate={formData.incidentDate}
/>
```

### Phase Guidance Component
```tsx
import { PhaseGuidance } from './shared';

<PhaseGuidance variant="info">
  <span id="guidance-text">{phaseInfo.guidance}</span>
</PhaseGuidance>
```

Variants: `info` (default), `tip`, `warning`

### Phase Navigation Component
```tsx
import { PhaseNavigation } from './shared';

<PhaseNavigation
  currentPhase={currentPhase}
  totalPhases={TOTAL_PHASES}
  isValid={isPhaseValid}
  isLoading={isLoading}
  onPrevious={handlePrevious}
  onNext={handleNext}
  customNextText="Save Warning"
  showFinalize={isLastPhase}
  onFinalize={handleFinalize}
/>
```

---

## CSS Classes Reference

### Import Statement
```tsx
import '@/styles/wizard-animations.css';
```

### Animation Classes

| Class | Description |
|-------|-------------|
| `.wizard-phase-enter-next` | Slide in from right |
| `.wizard-phase-enter-prev` | Slide in from left |
| `.wizard-phase-fade-in` | Fade in with slight lift |
| `.wizard-phase-scale-in` | Scale from 95% to 100% |
| `.wizard-progress-glow` | Progress bar pulse glow |
| `.wizard-button-tap` | Button press feedback |
| `.wizard-mobile-enter` | Mobile slide-up entrance |
| `.wizard-success-bounce` | Success card bounce |
| `.wizard-success-circle` | Checkmark circle scale |
| `.wizard-success-checkmark` | Checkmark draw animation |
| `.wizard-skeleton` | Skeleton loader shimmer |
| `.wizard-phase-dot-current` | Current phase dot pulse |
| `.wizard-recording-indicator` | Recording pulse |
| `.wizard-haptic-error` | Error shake |
| `.animate-fade-in` | Tooltip fade in |

### Touch Target Classes

| Class | Size | WCAG Level |
|-------|------|------------|
| `.wizard-touch-target` | 44×44px | AAA |
| `.wizard-touch-target-aa` | 24×24px | AA |
| `.wizard-touch-target-extended` | 44×44px hit area | AAA |

### Skeleton Variants

| Class | Use Case |
|-------|----------|
| `.wizard-skeleton-text` | Text line placeholder |
| `.wizard-skeleton-button` | Button placeholder |
| `.wizard-skeleton-card` | Card placeholder |

---

## Required Hooks

### 1. useFocusTrap
**Location**: `@/hooks/useFocusTrap`
**Use**: All modals and dialogs
**Features**: Tab cycling, Escape key, focus return

### 2. useWizardDraft
**Location**: `@/hooks/useWizardDraft`
**Use**: Multi-step wizards with data entry
**Features**: Auto-save, recovery, unsaved warning

### 3. useSwipeNavigation
**Location**: `@/hooks/useSwipeNavigation`
**Use**: Multi-step wizards on mobile
**Features**: Left/right swipe detection

---

## Implementation Checklist

### For Every Modal/Wizard

#### Accessibility
- [ ] Focus trap implemented with `useFocusTrap`
- [ ] `role="dialog"` and `aria-modal="true"` on container
- [ ] `aria-labelledby` pointing to title
- [ ] `aria-describedby` pointing to description
- [ ] All interactive elements have 44×44px touch targets
- [ ] Escape key closes modal
- [ ] Focus visible indicators present
- [ ] `aria-label` on icon-only buttons
- [ ] Reduced motion support in CSS

#### Mobile-First
- [ ] Full-screen on mobile (< 640px)
- [ ] Mobile detection with resize listener
- [ ] Swipe navigation (if multi-step)
- [ ] Haptic feedback on transitions
- [ ] Mobile swipe hint (first phase, optional)

#### Micro-Interactions
- [ ] Phase transition animations
- [ ] Button tap feedback (`.wizard-button-tap`)
- [ ] Progress bar glow on transitions
- [ ] Skeleton loaders during loading
- [ ] Success celebration on completion

#### Data Safety
- [ ] Auto-save with `useWizardDraft` (if multi-step)
- [ ] Draft recovery modal on open
- [ ] Unsaved changes warning
- [ ] Clear draft on success

#### Visual Progress (Multi-Step Only)
- [ ] `PhaseProgressEnhanced` component
- [ ] Clickable phase dots
- [ ] Completion checkmarks
- [ ] Current phase pulse animation
- [ ] Phase tooltips on hover

---

## Z-Index Scale

| Layer | Z-Index | Use |
|-------|---------|-----|
| Base modal | 9000 | Standard modals |
| PDF preview | 9100 | In-modal previews |
| Success celebration | 9500 | Celebration overlay |
| Draft recovery | 9600 | Recovery prompt |
| Confetti | 9999 | Celebration particles |

---

## Color Variables

Always use CSS variables for colors:

```css
var(--color-primary)
var(--color-primary-light)
var(--color-primary-rgb) /* For rgba() */
var(--color-success)
var(--color-warning)
var(--color-error)
var(--color-text-primary)
var(--color-text-secondary)
var(--color-text-tertiary)
var(--color-background)
var(--color-border)
var(--color-border-light)
var(--color-card-background)
var(--color-alert-info-bg)
var(--color-alert-info-text)
var(--color-alert-success-bg)
var(--color-alert-success-text)
var(--color-alert-warning-bg)
var(--color-alert-warning-text)
```

---

## Example: Minimal Award-Winning Modal

```tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ThemedButton } from '@/components/common/ThemedButton';
import { SuccessCelebration } from '@/components/warnings/enhanced/shared';
import '@/styles/wizard-animations.css';

interface AwardWinningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export const AwardWinningModal: React.FC<AwardWinningModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Accessibility: Focus trap
  const focusTrapRef = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose,
    autoFocus: true,
    returnFocus: true
  });

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit();
      setShowSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <SuccessCelebration
        isVisible={showSuccess}
        message="Action Completed!"
        onComplete={onClose}
        duration={2500}
      />

      <div
        ref={focusTrapRef}
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000]
          flex items-center justify-center
          ${isMobile ? 'p-0' : 'p-4'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className={`
            bg-white shadow-2xl w-full wizard-phase-scale-in
            ${isMobile ? 'h-full rounded-none' : 'max-w-md rounded-xl'}
            overflow-hidden flex flex-col
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--color-border-light)' }}>
            <h2 id="modal-title" className="font-semibold"
              style={{ color: 'var(--color-text-primary)' }}>
              Modal Title
            </h2>
            <button
              onClick={onClose}
              className="wizard-touch-target p-2 rounded-lg hover:bg-gray-100 wizard-button-tap"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Modal content goes here.
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex gap-2"
            style={{ borderColor: 'var(--color-border-light)' }}>
            <ThemedButton
              variant="outline"
              onClick={onClose}
              className="flex-1 wizard-touch-target"
            >
              Cancel
            </ThemedButton>
            <ThemedButton
              onClick={handleSubmit}
              loading={isLoading}
              icon={CheckCircle}
              className="flex-1 wizard-touch-target"
            >
              Confirm
            </ThemedButton>
          </div>
        </div>
      </div>
    </>
  );
};
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  AWARD-WINNING UX QUICK REFERENCE                       │
├─────────────────────────────────────────────────────────┤
│  ACCESSIBILITY                                          │
│  ✓ useFocusTrap on all modals                          │
│  ✓ 44×44px touch targets                               │
│  ✓ role="dialog" + aria-modal="true"                   │
│  ✓ aria-labelledby + aria-describedby                  │
│  ✓ Escape key closes                                   │
│  ✓ Reduced motion support                              │
├─────────────────────────────────────────────────────────┤
│  MOBILE                                                 │
│  ✓ Full-screen < 640px                                 │
│  ✓ Swipe navigation (multi-step)                       │
│  ✓ Haptic feedback                                     │
│  ✓ wizard-mobile-enter animation                       │
├─────────────────────────────────────────────────────────┤
│  ANIMATIONS                                             │
│  ✓ wizard-phase-enter-next/prev                        │
│  ✓ wizard-button-tap                                   │
│  ✓ wizard-progress-glow                                │
│  ✓ WizardSkeleton for loading                          │
│  ✓ SuccessCelebration on complete                      │
├─────────────────────────────────────────────────────────┤
│  DATA SAFETY                                            │
│  ✓ useWizardDraft for auto-save                        │
│  ✓ DraftRecoveryModal on open                          │
│  ✓ clearDraft() on success                             │
├─────────────────────────────────────────────────────────┤
│  IMPORTS                                                │
│  import '@/styles/wizard-animations.css';              │
│  import { useFocusTrap } from '@/hooks/useFocusTrap';  │
│  import { useWizardDraft } from '@/hooks/useWizardDraft';│
│  import { SuccessCelebration, ... } from './shared';   │
└─────────────────────────────────────────────────────────┘
```

---

*This design language ensures every feature in the HR Disciplinary System delivers a consistent, accessible, and delightful user experience worthy of design awards.*
