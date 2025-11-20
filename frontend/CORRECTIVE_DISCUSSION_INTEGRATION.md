# Corrective Discussion Step Integration Guide

## Overview
This document provides complete integration instructions for adding the new **Step 2.5: Corrective Discussion & Action Plan** to the EnhancedWarningWizard.

---

## 1. Type Definitions

Add these type definitions to `/home/aiguy/projects/hr-disciplinary-system/frontend/src/services/WarningService.ts`:

```typescript
// Add to existing interfaces section (around line 150)

/**
 * Action commitment for corrective discussion
 */
export interface ActionCommitment {
  id: string;
  commitment: string;
  timeline: string;
}

/**
 * Corrective discussion data captured in Step 2.5
 * Based on client template sections B, C, E, F
 */
export interface CorrectiveDiscussionData {
  // Section B: Employee's version
  employeeStatement: string;

  // Section C: Expected behavior/standards
  expectedBehavior: string;

  // Section E: Facts leading to decision
  factsAndReasoning: string;

  // Section F: Action steps
  actionCommitments: ActionCommitment[];

  // Follow-up review
  reviewDate: string;

  // Optional intervention details
  interventionDetails?: string;

  // Optional resources provided
  resourcesProvided?: string[];
}
```

Update `EnhancedWarningFormData` interface to include corrective discussion:

```typescript
export interface EnhancedWarningFormData {
  // ... existing fields ...

  // NEW: Corrective discussion data
  correctiveDiscussion?: CorrectiveDiscussionData;
}
```

---

## 2. Update Warning Interface

Add corrective discussion fields to the `Warning` interface in `/home/aiguy/projects/hr-disciplinary-system/frontend/src/types/core.ts` (around line 200):

```typescript
export interface Warning {
  // ... existing fields ...

  // NEW: Corrective discussion fields
  employeeStatement?: string;
  expectedBehavior?: string;
  factsAndReasoning?: string;
  actionCommitments?: ActionCommitment[];
  reviewDate?: string;
  interventionDetails?: string;
  resourcesProvided?: string[];
}
```

Don't forget to import `ActionCommitment` from WarningService at the top of core.ts:

```typescript
import type { ActionCommitment } from '../services/WarningService';
```

---

## 3. Update EnhancedWarningWizard

### 3.1 Update WizardStep Enum

In `/home/aiguy/projects/hr-disciplinary-system/frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` (around line 74):

```typescript
// OLD - 3-STEP WIZARD
enum WizardStep {
  INCIDENT_DETAILS = 0,
  LEGAL_REVIEW_SIGNATURES = 1,
  DELIVERY_COMPLETION = 2
}

// NEW - 4-STEP WIZARD
enum WizardStep {
  INCIDENT_DETAILS = 0,
  LEGAL_REVIEW_SIGNATURES = 1,
  CORRECTIVE_DISCUSSION = 2,
  DELIVERY_COMPLETION = 3
}
```

### 3.2 Import the New Component

Add import at the top (around line 22):

```typescript
import { CorrectiveDiscussionStep } from './steps/CorrectiveDiscussionStep';
import type { CorrectiveDiscussionData } from '../../../services/WarningService';
```

### 3.3 Add State for Corrective Discussion

Add state variable (around line 200):

```typescript
const [correctiveDiscussion, setCorrectiveDiscussion] = useState<CorrectiveDiscussionData | null>(null);
const [correctiveDiscussionValid, setCorrectiveDiscussionValid] = useState(false);
```

### 3.4 Update Step Rendering

Find the step rendering section (around line 600+) and add the new step:

```typescript
{/* Step 2: Legal Review & Signatures */}
{currentStep === WizardStep.LEGAL_REVIEW_SIGNATURES && (
  <LegalReviewSignaturesStepV2
    // ... existing props ...
  />
)}

{/* NEW Step 2.5: Corrective Discussion */}
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

### 3.5 Update Step Navigation Logic

Update the `handleNext` function to include corrective discussion validation:

```typescript
const handleNext = useCallback(async () => {
  if (currentStep === WizardStep.INCIDENT_DETAILS) {
    // Existing logic...
    setCurrentStep(WizardStep.LEGAL_REVIEW_SIGNATURES);
  }
  else if (currentStep === WizardStep.LEGAL_REVIEW_SIGNATURES) {
    // Auto-advance after signatures - go to corrective discussion
    setCurrentStep(WizardStep.CORRECTIVE_DISCUSSION);
  }
  else if (currentStep === WizardStep.CORRECTIVE_DISCUSSION) {
    // Validate corrective discussion before advancing
    if (!correctiveDiscussionValid) {
      alert('Please complete all required corrective discussion fields before continuing.');
      return;
    }
    setCurrentStep(WizardStep.DELIVERY_COMPLETION);
  }
}, [currentStep, correctiveDiscussionValid]);
```

### 3.6 Update Progress Indicator

Update the step labels array (look for the progress indicator rendering):

```typescript
const stepLabels = [
  'Incident Details',
  'Legal Review',
  'Corrective Discussion',  // NEW
  'Delivery'
];
```

### 3.7 Save Corrective Discussion to Database

Update the warning creation/update logic to include corrective discussion data. Find where warnings are saved (likely in DeliveryCompletionStep or a save handler):

```typescript
// When creating/updating warning document
const warningData = {
  // ... existing fields ...

  // Add corrective discussion fields
  employeeStatement: correctiveDiscussion?.employeeStatement,
  expectedBehavior: correctiveDiscussion?.expectedBehavior,
  factsAndReasoning: correctiveDiscussion?.factsAndReasoning,
  actionCommitments: correctiveDiscussion?.actionCommitments || [],
  reviewDate: correctiveDiscussion?.reviewDate,
  interventionDetails: correctiveDiscussion?.interventionDetails,
  resourcesProvided: correctiveDiscussion?.resourcesProvided || []
};
```

---

## 4. Update PDF Generation

The PDF generation will need to include the new corrective discussion fields.

### 4.1 Update PDF Data Transformer

In `/home/aiguy/projects/hr-disciplinary-system/frontend/src/services/pdfDataTransformer.ts`:

```typescript
export function transformWarningDataForPDF(warning: Warning, ...): PDFWarningData {
  return {
    // ... existing fields ...

    // NEW: Corrective discussion fields
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

### 4.2 Update PDF Generation Service

In `/home/aiguy/projects/hr-disciplinary-system/frontend/src/services/PDFGenerationService.ts`, add new sections to the PDF template (this will likely be v1.2.0):

```typescript
// Add after existing warning content sections

// Section B: Employee's Statement
if (data.employeeStatement) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(B) Employee\'s Version of Events:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const statementLines = doc.splitTextToSize(data.employeeStatement, contentWidth);
  doc.text(statementLines, margin, yPos);
  yPos += (statementLines.length * lineHeight) + sectionSpacing;
}

// Section C: Expected Behavior
if (data.expectedBehavior) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(C) Required/Expected Behavior & Standards:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const behaviorLines = doc.splitTextToSize(data.expectedBehavior, contentWidth);
  doc.text(behaviorLines, margin, yPos);
  yPos += (behaviorLines.length * lineHeight) + sectionSpacing;
}

// Section E: Facts & Reasoning
if (data.factsAndReasoning) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('(E) Facts Leading to Decision Taken:', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const factsLines = doc.splitTextToSize(data.factsAndReasoning, contentWidth);
  doc.text(factsLines, margin, yPos);
  yPos += (factsLines.length * lineHeight) + sectionSpacing;
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
    const commitmentText = `${index + 1}. ${commitment.commitment} (Timeline: ${commitment.timeline})`;
    const commitmentLines = doc.splitTextToSize(commitmentText, contentWidth);
    doc.text(commitmentLines, margin, yPos);
    yPos += (commitmentLines.length * lineHeight) + 2;
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

---

## 5. Firestore Security Rules

No changes needed - corrective discussion fields are part of the warning document which already has proper security rules.

---

## 6. Testing Checklist

After integration, test the following:

### Step Navigation
- [ ] Step 2 (Signatures) advances to Step 2.5 (Corrective Discussion)
- [ ] Step 2.5 advances to Step 3 (Delivery) only when valid
- [ ] Back button works from Step 2.5 to Step 2
- [ ] Progress indicator shows 4 steps correctly

### Conditional Logic
- [ ] For Counselling/Verbal/Written warnings:
  - [ ] Employee statement is required
  - [ ] At least 1 commitment is required
  - [ ] Review date is required
  - [ ] Warning message shows "Corrective Action Required"

- [ ] For Final/Dismissal warnings:
  - [ ] Employee statement is optional
  - [ ] Commitments section is hidden
  - [ ] Review date is hidden
  - [ ] Warning message shows "Serious Disciplinary Action"

### Form Validation
- [ ] Cannot proceed with empty required fields
- [ ] Character count validation (20+ chars for statements)
- [ ] Commitment validation (10+ chars for commitment, 3+ chars for timeline)
- [ ] Review date must be in future
- [ ] Validation errors display clearly

### Action Commitments
- [ ] Can add multiple commitments
- [ ] Can remove commitments
- [ ] Each commitment validates independently
- [ ] Empty commitments show validation errors

### Resources
- [ ] Can add resource tags
- [ ] Can remove resource tags
- [ ] Resources display as styled badges
- [ ] Press Enter adds resource

### Data Persistence
- [ ] Corrective discussion data saves to warning document
- [ ] Data persists when navigating back/forward
- [ ] Data appears correctly in PDF
- [ ] All fields optional in Firestore (no validation errors)

### PDF Generation
- [ ] Section B appears in PDF when provided
- [ ] Section C appears in PDF
- [ ] Section E appears in PDF
- [ ] Section F appears with numbered commitments
- [ ] Review date appears in PDF
- [ ] Optional fields (intervention, resources) appear when provided

---

## 7. Component File Location

**Created File:**
```
/home/aiguy/projects/hr-disciplinary-system/frontend/src/components/warnings/enhanced/steps/CorrectiveDiscussionStep.tsx
```

**Component Features:**
- ✅ Fully themed using ThemedCard, ThemedButton, ThemedBadge
- ✅ Mobile-optimized (44px minimum touch targets)
- ✅ Conditional logic based on warning level
- ✅ Dynamic action commitments list
- ✅ Resource tag input
- ✅ Real-time validation with error display
- ✅ Character count indicators
- ✅ Progressive enhancement ready
- ✅ Follows existing design patterns from LegalReviewSignaturesStepV2

---

## 8. Next Steps

1. **Update Type Definitions** - Add interfaces to WarningService.ts and core.ts
2. **Integrate Component** - Update EnhancedWarningWizard.tsx with new step
3. **Update PDF Generation** - Add sections to PDFGenerationService.ts (create v1.2.0)
4. **Test Thoroughly** - Use testing checklist above
5. **Deploy** - Build and deploy to production

---

## Notes

- **PDF Version**: This will likely be PDF Generator v1.2.0 (new sections added)
- **Backward Compatibility**: All new fields are optional, so existing warnings won't break
- **Legal Compliance**: Matches client template structure (sections B, C, E, F)
- **Data Size**: Action commitments are small text fields, won't affect Firestore limits
- **Mobile UX**: All inputs have proper touch targets (44px minimum)
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

---

**Status:** Component created and ready for integration
**Estimated Integration Time:** 2-3 hours
**Testing Time:** 1-2 hours
**Total Effort:** Half day
