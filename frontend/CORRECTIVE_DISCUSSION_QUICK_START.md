# Corrective Discussion Step - Quick Start Integration Guide

## 30-Second Overview

New wizard step captures corrective counselling within warnings. Employee statement, expected behavior, facts, action commitments, and review date all documented in one place.

**Component**: `/frontend/src/components/warnings/enhanced/steps/CorrectiveDiscussionStep.tsx` (ready to use)
**Integration Time**: 2-3 hours
**Risk**: Low (all fields optional, backward compatible)

---

## Step 1: Add Type Definitions (5 minutes)

### File: `frontend/src/services/WarningService.ts`

Add after line 150:

```typescript
export interface ActionCommitment {
  id: string;
  commitment: string;
  timeline: string;
}

export interface CorrectiveDiscussionData {
  employeeStatement: string;
  expectedBehavior: string;
  factsAndReasoning: string;
  actionCommitments: ActionCommitment[];
  reviewDate: string;
  interventionDetails?: string;
  resourcesProvided?: string[];
}
```

Update `EnhancedWarningFormData`:

```typescript
export interface EnhancedWarningFormData {
  // ... existing fields ...
  correctiveDiscussion?: CorrectiveDiscussionData;
}
```

### File: `frontend/src/types/core.ts`

Add import at top:

```typescript
import type { ActionCommitment } from '../services/WarningService';
```

Update `Warning` interface (around line 200):

```typescript
export interface Warning {
  // ... existing fields ...

  // Corrective discussion fields
  employeeStatement?: string;
  expectedBehavior?: string;
  factsAndReasoning?: string;
  actionCommitments?: ActionCommitment[];
  reviewDate?: string;
  interventionDetails?: string;
  resourcesProvided?: string[];
}
```

---

## Step 2: Update Wizard Enum (2 minutes)

### File: `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`

**Line 74** - Update enum:

```typescript
// OLD
enum WizardStep {
  INCIDENT_DETAILS = 0,
  LEGAL_REVIEW_SIGNATURES = 1,
  DELIVERY_COMPLETION = 2
}

// NEW
enum WizardStep {
  INCIDENT_DETAILS = 0,
  LEGAL_REVIEW_SIGNATURES = 1,
  CORRECTIVE_DISCUSSION = 2,
  DELIVERY_COMPLETION = 3
}
```

---

## Step 3: Import Component & Add State (5 minutes)

### File: `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`

**Line 22** - Add import:

```typescript
import { CorrectiveDiscussionStep } from './steps/CorrectiveDiscussionStep';
import type { CorrectiveDiscussionData } from '../../../services/WarningService';
```

**Line 200** - Add state:

```typescript
const [correctiveDiscussion, setCorrectiveDiscussion] = useState<CorrectiveDiscussionData | null>(null);
const [correctiveDiscussionValid, setCorrectiveDiscussionValid] = useState(false);
```

---

## Step 4: Add Step Rendering (5 minutes)

### File: `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`

Find where steps are rendered (around line 600+) and add:

```typescript
{/* Step 2: Legal Review & Signatures */}
{currentStep === WizardStep.LEGAL_REVIEW_SIGNATURES && (
  <LegalReviewSignaturesStepV2
    // ... existing props ...
  />
)}

{/* NEW - Step 2.5: Corrective Discussion */}
{currentStep === WizardStep.CORRECTIVE_DISCUSSION && (
  <CorrectiveDiscussionStep
    warningLevel={formData.level}
    currentData={correctiveDiscussion || undefined}
    onDataChange={setCorrectiveDiscussion}
    onValidationChange={setCorrectiveDiscussionValid}
  />
)}

{/* Step 3: Delivery Completion */}
{currentStep === WizardStep.DELIVERY_COMPLETION && (
  <DeliveryCompletionStep
    // ... existing props ...
  />
)}
```

---

## Step 5: Update Navigation Logic (10 minutes)

### File: `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`

Find `handleNext` function and update:

```typescript
const handleNext = useCallback(async () => {
  if (currentStep === WizardStep.INCIDENT_DETAILS) {
    // Existing logic...
    setCurrentStep(WizardStep.LEGAL_REVIEW_SIGNATURES);
  }
  else if (currentStep === WizardStep.LEGAL_REVIEW_SIGNATURES) {
    // Auto-advance to corrective discussion
    setCurrentStep(WizardStep.CORRECTIVE_DISCUSSION);
  }
  else if (currentStep === WizardStep.CORRECTIVE_DISCUSSION) {
    // Validate before advancing
    if (!correctiveDiscussionValid) {
      alert('Please complete all required corrective discussion fields before continuing.');
      return;
    }
    setCurrentStep(WizardStep.DELIVERY_COMPLETION);
  }
}, [currentStep, correctiveDiscussionValid]);
```

Update step labels for progress indicator:

```typescript
const stepLabels = [
  'Incident Details',
  'Legal Review',
  'Corrective Discussion',  // NEW
  'Delivery'
];
```

---

## Step 6: Save Data to Firestore (15 minutes)

### File: `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`

Find where warning document is created/updated (likely in DeliveryCompletionStep or a save handler).

Add corrective discussion fields:

```typescript
const warningData = {
  // ... existing fields ...

  // Corrective discussion
  employeeStatement: correctiveDiscussion?.employeeStatement || '',
  expectedBehavior: correctiveDiscussion?.expectedBehavior || '',
  factsAndReasoning: correctiveDiscussion?.factsAndReasoning || '',
  actionCommitments: correctiveDiscussion?.actionCommitments || [],
  reviewDate: correctiveDiscussion?.reviewDate || '',
  interventionDetails: correctiveDiscussion?.interventionDetails || '',
  resourcesProvided: correctiveDiscussion?.resourcesProvided || []
};
```

---

## Step 7: Update PDF Generation (30 minutes)

### File: `frontend/src/services/PDFGenerationService.ts`

This requires creating v1.2.0 with new sections. Add after existing warning content:

```typescript
// Section B: Employee's Statement
if (data.employeeStatement) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(B) Employee\'s Version of Events:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(data.employeeStatement, contentWidth);
  doc.text(lines, margin, yPos);
  yPos += (lines.length * lineHeight) + sectionSpacing;
}

// Section C: Expected Behavior
if (data.expectedBehavior) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(C) Required/Expected Behavior & Standards:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(data.expectedBehavior, contentWidth);
  doc.text(lines, margin, yPos);
  yPos += (lines.length * lineHeight) + sectionSpacing;
}

// Section E: Facts & Reasoning
if (data.factsAndReasoning) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(E) Facts Leading to Decision Taken:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(data.factsAndReasoning, contentWidth);
  doc.text(lines, margin, yPos);
  yPos += (lines.length * lineHeight) + sectionSpacing;
}

// Section F: Action Steps
if (data.actionCommitments && data.actionCommitments.length > 0) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(F) Action Steps & Improvement Commitments:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  data.actionCommitments.forEach((commitment, index) => {
    const text = `${index + 1}. ${commitment.commitment} (Timeline: ${commitment.timeline})`;
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += (lines.length * lineHeight) + 2;
  });

  yPos += sectionSpacing;
}

// Review Date
if (data.reviewDate) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Follow-up Review Date:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.reviewDate), margin + 50, yPos);
  yPos += lineHeight + sectionSpacing;
}
```

### File: `frontend/src/services/pdfDataTransformer.ts`

Update transformer to include new fields:

```typescript
export function transformWarningDataForPDF(warning: Warning, ...): PDFWarningData {
  return {
    // ... existing fields ...

    // Corrective discussion
    employeeStatement: warning.employeeStatement || '',
    expectedBehavior: warning.expectedBehavior || '',
    factsAndReasoning: warning.factsAndReasoning || '',
    actionCommitments: warning.actionCommitments || [],
    reviewDate: warning.reviewDate || '',
    interventionDetails: warning.interventionDetails || '',
    resourcesProvided: warning.resourcesProvided || []
  };
}
```

---

## Step 8: Test (1-2 hours)

### Quick Test Checklist

**Navigation:**
- [ ] Step 2 → Step 2.5 works
- [ ] Step 2.5 → Step 3 validates first
- [ ] Back button works
- [ ] 4 steps show in progress bar

**Conditional Logic:**
- [ ] Verbal warning: All fields required
- [ ] Final warning: Commitments hidden

**Validation:**
- [ ] Can't proceed with empty required fields
- [ ] Character minimums enforced
- [ ] Review date must be future

**Data:**
- [ ] Data saves to Firestore
- [ ] PDF includes new sections

---

## Common Issues & Solutions

### Issue: TypeScript errors on ActionCommitment
**Solution**: Make sure you imported `ActionCommitment` from WarningService in core.ts

### Issue: Step 2.5 doesn't show
**Solution**: Check WizardStep enum values are correct (0, 1, 2, 3)

### Issue: Validation not working
**Solution**: Ensure `onValidationChange` callback is connected to parent state

### Issue: PDF missing sections
**Solution**: Update PDF generator version to 1.2.0 and check field mapping in transformer

---

## Files to Modify

1. ✅ `frontend/src/services/WarningService.ts` - Add interfaces
2. ✅ `frontend/src/types/core.ts` - Update Warning interface
3. ✅ `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` - Main integration
4. ✅ `frontend/src/services/PDFGenerationService.ts` - Add PDF sections (v1.2.0)
5. ✅ `frontend/src/services/pdfDataTransformer.ts` - Map fields

---

## Complete Integration Script

Run these commands to verify setup:

```bash
# 1. Check component exists
ls -lh frontend/src/components/warnings/enhanced/steps/CorrectiveDiscussionStep.tsx

# 2. After integration, check for TypeScript errors
cd frontend
npm run typecheck

# 3. Build to verify no issues
npm run build

# 4. Run dev server for testing
npm run dev
```

---

## Rollback Plan

If issues arise, simply:

1. Revert WizardStep enum back to 3 steps
2. Remove CorrectiveDiscussionStep import
3. Remove state variables
4. Remove step rendering case
5. Revert navigation logic

All changes are additive - existing warnings will work fine even with incomplete rollback.

---

## Support Resources

**Full Integration Guide**: `CORRECTIVE_DISCUSSION_INTEGRATION.md`
**Visual Mockup**: `CORRECTIVE_DISCUSSION_VISUAL_MOCKUP.md`
**PDF Example**: `CORRECTIVE_DISCUSSION_PDF_EXAMPLE.md`
**Complete Summary**: `CORRECTIVE_DISCUSSION_STEP_SUMMARY.md`

---

**Estimated Total Time**: 2-3 hours integration + 1-2 hours testing = **Half day**

**Status**: Component ready, integration straightforward, low risk

Good luck! 🚀
