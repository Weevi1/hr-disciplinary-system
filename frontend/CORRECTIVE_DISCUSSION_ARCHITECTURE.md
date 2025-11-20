# Corrective Discussion Step - Component Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EnhancedWarningWizard                            │
│                    (Parent Component)                               │
│                                                                     │
│  State:                                                             │
│  ├─ currentStep: WizardStep                                         │
│  ├─ formData: EnhancedWarningFormData                               │
│  ├─ correctiveDiscussion: CorrectiveDiscussionData | null  ← NEW   │
│  └─ correctiveDiscussionValid: boolean                     ← NEW   │
│                                                                     │
│  Render Logic:                                                      │
│  ├─ Step 0: CombinedIncidentStepV2                                 │
│  ├─ Step 1: LegalReviewSignaturesStepV2                            │
│  ├─ Step 2: CorrectiveDiscussionStep                      ← NEW    │
│  └─ Step 3: DeliveryCompletionStep                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Props
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CorrectiveDiscussionStep                          │
│                   (New Component)                                   │
│                                                                     │
│  Props:                                                             │
│  ├─ warningLevel: WarningLevel                                     │
│  ├─ currentData?: CorrectiveDiscussionData                         │
│  ├─ onDataChange: (data) => void                                   │
│  └─ onValidationChange?: (isValid) => void                         │
│                                                                     │
│  Internal State:                                                    │
│  ├─ formData: CorrectiveDiscussionData                             │
│  ├─ resourceInput: string                                          │
│  └─ validationErrors: Record<string, string>                       │
│                                                                     │
│  Render:                                                            │
│  ├─ Header Card (with warning level badge)                         │
│  ├─ Context Alert (conditional)                                    │
│  ├─ Section B: Employee Statement Card                             │
│  ├─ Section C: Expected Behavior Card                              │
│  ├─ Section E: Facts & Reasoning Card                              │
│  ├─ Section F: Action Commitments Card (conditional)               │
│  ├─ Follow-up Review Date Card (conditional)                       │
│  ├─ Training/Coaching Card (optional)                              │
│  └─ Resources Card (optional)                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Uses
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Design System Components                        │
│                                                                     │
│  ├─ ThemedCard (container)                                         │
│  ├─ ThemedButton (actions)                                         │
│  ├─ ThemedBadge (warning level)                                    │
│  ├─ ThemedAlert (context messages)                                 │
│  ├─ ThemedSectionHeader (section titles)                           │
│  └─ Lucide Icons (MessageSquare, Target, Scale, etc.)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────┐
│    User      │
│   Actions    │
└──────┬───────┘
       │
       │ Types in textarea, adds commitments, etc.
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CorrectiveDiscussionStep                                           │
│                                                                     │
│  handleFieldChange()                                                │
│  ├─ Updates local formData state                                   │
│  ├─ Triggers validation                                             │
│  └─ Calls onDataChange() → Parent                                  │
│                                                                     │
│  handleAddCommitment()                                              │
│  └─ Adds new commitment to formData.actionCommitments              │
│                                                                     │
│  handleRemoveCommitment()                                           │
│  └─ Removes commitment from formData.actionCommitments             │
│                                                                     │
│  validateForm()                                                     │
│  ├─ Checks all required fields                                     │
│  ├─ Conditional validation based on warningLevel                   │
│  └─ Calls onValidationChange(isValid) → Parent                     │
└─────────────────────────────────────────────────────────────────────┘
       │
       │ Data propagates up
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EnhancedWarningWizard                                              │
│                                                                     │
│  setCorrectiveDiscussion(data)                                      │
│  └─ Stores data in parent state                                    │
│                                                                     │
│  setCorrectiveDiscussionValid(isValid)                              │
│  └─ Enables/disables Next button                                   │
│                                                                     │
│  handleNext()                                                       │
│  ├─ Checks correctiveDiscussionValid                               │
│  └─ Advances to Delivery step if valid                             │
└─────────────────────────────────────────────────────────────────────┘
       │
       │ On finalize
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Firestore Warning Document                                         │
│                                                                     │
│  warnings/{orgId}/{warningId}                                       │
│  {                                                                  │
│    // ... existing fields ...                                      │
│    employeeStatement: string,                                      │
│    expectedBehavior: string,                                       │
│    factsAndReasoning: string,                                      │
│    actionCommitments: ActionCommitment[],                          │
│    reviewDate: string,                                             │
│    interventionDetails?: string,                                   │
│    resourcesProvided?: string[]                                    │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
       │
       │ PDF generation
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PDF Generation Service (v1.2.0)                                    │
│                                                                     │
│  transformWarningDataForPDF()                                       │
│  └─ Maps Warning → PDFWarningData                                  │
│                                                                     │
│  generateWarningPDF_v1_2_0()                                        │
│  ├─ Section A: Incident details                                    │
│  ├─ Section B: Employee statement                                  │
│  ├─ Section C: Expected behavior                                   │
│  ├─ Section E: Facts & reasoning                                   │
│  ├─ Section F: Action commitments                                  │
│  └─ Follow-up review date                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Internal Structure

```
CorrectiveDiscussionStep
│
├─ State Management
│  ├─ formData: CorrectiveDiscussionData
│  ├─ resourceInput: string (temp input)
│  └─ validationErrors: Record<string, string>
│
├─ Computed Values
│  └─ levelInfo (useMemo)
│     ├─ label: string
│     ├─ color: string
│     └─ requiresCommitments: boolean
│
├─ Validation Logic (validateForm)
│  ├─ Always Required:
│  │  ├─ expectedBehavior (20+ chars)
│  │  └─ factsAndReasoning (20+ chars)
│  │
│  ├─ Conditional (if requiresCommitments):
│  │  ├─ employeeStatement (20+ chars)
│  │  ├─ actionCommitments.length >= 1
│  │  ├─ Each commitment (10+ chars)
│  │  ├─ Each timeline (3+ chars)
│  │  └─ reviewDate (future date)
│  │
│  └─ Returns: boolean
│
├─ Event Handlers
│  ├─ handleFieldChange(field, value)
│  ├─ handleAddCommitment()
│  ├─ handleRemoveCommitment(id)
│  ├─ handleCommitmentChange(id, field, value)
│  ├─ handleAddResource()
│  └─ handleRemoveResource(index)
│
└─ Render Structure
   ├─ Header Card
   │  ├─ Icon (MessageSquare)
   │  ├─ Title & subtitle
   │  └─ Warning level badge
   │
   ├─ Context Alert (conditional)
   │  └─ Different message per warning level
   │
   ├─ Section B Card (Employee Statement)
   │  ├─ Label with Required/Optional tag
   │  ├─ Textarea input
   │  ├─ Validation error (if any)
   │  └─ Character counter
   │
   ├─ Section C Card (Expected Behavior)
   │  ├─ Label (always Required)
   │  ├─ Textarea input
   │  ├─ Validation error (if any)
   │  └─ Character counter
   │
   ├─ Section E Card (Facts & Reasoning)
   │  ├─ Label (always Required)
   │  ├─ Textarea input
   │  ├─ Validation error (if any)
   │  └─ Character counter
   │
   ├─ Section F Card (Action Commitments) - if requiresCommitments
   │  ├─ Empty state alert OR
   │  ├─ List of commitment cards
   │  │  └─ Each card:
   │  │     ├─ Commitment text input
   │  │     ├─ Timeline text input
   │  │     ├─ Validation errors
   │  │     └─ Remove button
   │  └─ Add Commitment button
   │
   ├─ Review Date Card - if requiresCommitments
   │  ├─ Date input
   │  ├─ Validation error (if any)
   │  └─ Helper text
   │
   ├─ Training/Coaching Card (optional)
   │  ├─ Textarea input
   │  └─ Helper text
   │
   └─ Resources Card (optional)
      ├─ Existing resource tags (if any)
      ├─ Text input + Add button
      └─ Helper text
```

---

## Type Hierarchy

```
CorrectiveDiscussionData
├─ employeeStatement: string
├─ expectedBehavior: string
├─ factsAndReasoning: string
├─ actionCommitments: ActionCommitment[]
│  └─ ActionCommitment
│     ├─ id: string
│     ├─ commitment: string
│     └─ timeline: string
├─ reviewDate: string
├─ interventionDetails?: string
└─ resourcesProvided?: string[]

EnhancedWarningFormData (updated)
├─ ... existing fields ...
└─ correctiveDiscussion?: CorrectiveDiscussionData

Warning (updated)
├─ ... existing fields ...
├─ employeeStatement?: string
├─ expectedBehavior?: string
├─ factsAndReasoning?: string
├─ actionCommitments?: ActionCommitment[]
├─ reviewDate?: string
├─ interventionDetails?: string
└─ resourcesProvided?: string[]
```

---

## Conditional Rendering Logic

```
if (warningLevel === 'counselling' || 'verbal' || 'first_written' || 'second_written'):
    requiresCommitments = true

    Required:
    ✓ Employee Statement (Section B)
    ✓ Expected Behavior (Section C)
    ✓ Facts & Reasoning (Section E)
    ✓ Action Commitments (Section F) - at least 1
    ✓ Review Date

    Optional:
    ○ Training/Coaching
    ○ Resources

    UI:
    ✓ Show "Corrective Action Required" alert (blue)
    ✓ Show all sections
    ✓ Mark fields as "Required"

else if (warningLevel === 'final_written' || 'suspension' || 'dismissal'):
    requiresCommitments = false

    Required:
    ✓ Expected Behavior (Section C)
    ✓ Facts & Reasoning (Section E)

    Optional:
    ○ Employee Statement (Section B) - might refuse
    ○ Training/Coaching
    ○ Resources

    Hidden:
    ✗ Action Commitments (Section F)
    ✗ Review Date

    UI:
    ✓ Show "Serious Disciplinary Action" alert (amber)
    ✓ Hide commitments & review sections
    ✓ Mark employee statement as "Optional"
```

---

## Validation Flow

```
User types → handleFieldChange() → setFormData() → useEffect()
                                                        │
                                                        ▼
                                                  validateForm()
                                                        │
                                    ┌───────────────────┴───────────────────┐
                                    │                                       │
                                    ▼                                       ▼
                            Check Required Fields              Check Conditional Fields
                            ├─ expectedBehavior                ├─ if requiresCommitments:
                            └─ factsAndReasoning               │  ├─ employeeStatement
                                                               │  ├─ actionCommitments
                                                               │  └─ reviewDate
                                    │                          │
                                    └──────────┬───────────────┘
                                               ▼
                                        Set validationErrors
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                    ▼                     ▼
                            onValidationChange()   onDataChange()
                                    │                     │
                                    ▼                     ▼
                            Parent updates        Parent updates
                            "valid" state         "data" state
                                    │                     │
                                    └──────────┬──────────┘
                                               ▼
                                      Next button enabled/disabled
```

---

## Integration Points

```
CorrectiveDiscussionStep
    │
    ├─ Imports From:
    │  ├─ ThemedCard (from common/ThemedCard)
    │  ├─ ThemedButton (from common/ThemedButton)
    │  ├─ ThemedBadge (from common/ThemedCard)
    │  ├─ ThemedAlert (from common/ThemedCard)
    │  ├─ ThemedSectionHeader (from common/ThemedCard)
    │  ├─ WarningLevel (from types/core)
    │  └─ Lucide Icons (MessageSquare, Target, Scale, etc.)
    │
    ├─ Exports:
    │  ├─ CorrectiveDiscussionStep (component)
    │  ├─ ActionCommitment (interface)
    │  └─ CorrectiveDiscussionData (interface)
    │
    └─ Used By:
       └─ EnhancedWarningWizard (parent)
```

---

## File Dependencies

```
CorrectiveDiscussionStep.tsx (NEW)
    │
    ├─ Depends On:
    │  ├─ react (hooks)
    │  ├─ lucide-react (icons)
    │  ├─ ../../../common/ThemedCard
    │  ├─ ../../../common/ThemedButton
    │  └─ ../../../../types/core (WarningLevel)
    │
EnhancedWarningWizard.tsx (MODIFIED)
    │
    ├─ New Imports:
    │  ├─ ./steps/CorrectiveDiscussionStep
    │  └─ ../../../services/WarningService (CorrectiveDiscussionData)
    │
    ├─ New State:
    │  ├─ correctiveDiscussion
    │  └─ correctiveDiscussionValid
    │
WarningService.ts (MODIFIED)
    │
    ├─ New Interfaces:
    │  ├─ ActionCommitment
    │  └─ CorrectiveDiscussionData
    │
core.ts (MODIFIED)
    │
    ├─ New Import:
    │  └─ ActionCommitment (from WarningService)
    │
    ├─ Updated Interface:
    │  └─ Warning (7 new optional fields)
    │
PDFGenerationService.ts (MODIFIED)
    │
    ├─ New Version:
    │  └─ generateWarningPDF_v1_2_0() (NEW FUNCTION)
    │
pdfDataTransformer.ts (MODIFIED)
    │
    └─ Updated Function:
       └─ transformWarningDataForPDF() (7 new field mappings)
```

---

## Component Lifecycle

```
1. Mount
   ├─ Initialize formData from currentData prop
   ├─ Calculate levelInfo (useMemo)
   └─ Run initial validation

2. User Interaction
   ├─ User types in textarea
   │  └─ handleFieldChange()
   │     └─ setFormData()
   │
   ├─ User adds commitment
   │  └─ handleAddCommitment()
   │     └─ setFormData()
   │
   ├─ User removes commitment
   │  └─ handleRemoveCommitment()
   │     └─ setFormData()
   │
   └─ User adds resource
      └─ handleAddResource()
         └─ setFormData()

3. After Each State Change (useEffect)
   ├─ validateForm()
   │  └─ setValidationErrors()
   ├─ onValidationChange(isValid)
   └─ onDataChange(formData)

4. Parent Navigation
   ├─ User clicks Next
   │  └─ Parent checks correctiveDiscussionValid
   │     ├─ If valid: advance to next step
   │     └─ If invalid: show alert, stay on step
   │
   └─ User clicks Back
      └─ Parent goes to previous step
         (formData preserved in state)

5. Unmount
   └─ No cleanup needed (no subscriptions, timers, etc.)
```

---

## Error Handling

```
Validation Errors
├─ Missing Required Fields
│  └─ Display: Red border + error message below field
│
├─ Character Count Too Low
│  └─ Display: Error message + current count
│
├─ Invalid Commitments
│  ├─ Empty commitment text
│  ├─ Empty timeline
│  └─ Display: Error for each invalid commitment
│
└─ Invalid Review Date
   └─ Display: Error if date in past or empty

User Actions
├─ Try to Proceed with Invalid Data
│  └─ Alert: "Please complete all required fields..."
│
└─ Remove Last Commitment
   └─ Warn: "At least 1 improvement commitment required"
```

---

## Performance Considerations

### Optimizations
✅ `useMemo` for levelInfo (prevents recalculation)
✅ `useCallback` for event handlers (prevents rerenders)
✅ Controlled inputs (React best practice)
✅ Minimal state updates (batch when possible)

### No Performance Issues
- Component renders once per data change (expected)
- Validation runs on change (acceptable for UX)
- No expensive computations
- No large lists (max ~10 commitments expected)

---

## Security Considerations

### Input Sanitization
- All inputs are strings (no HTML injection)
- Firestore stores plain text
- PDF generation escapes special characters

### No Security Changes Needed
- Uses existing Firestore security rules
- Warning document already has proper access control
- No new authentication/authorization required

---

## Accessibility Features

✅ **Semantic HTML**: Proper label/input associations
✅ **ARIA Labels**: Descriptive labels for screen readers
✅ **Keyboard Navigation**: Tab order, Enter key support
✅ **Focus Indicators**: Clear focus states on all inputs
✅ **Error Association**: aria-describedby for validation errors
✅ **Color Contrast**: Meets WCAG AA standards
✅ **Required Indicators**: Visual and semantic (aria-required)

---

## Mobile Optimization

✅ **Touch Targets**: 44px minimum height (iOS/Android guidelines)
✅ **Font Sizes**: 14px+ body, 16px+ inputs (prevents zoom on iOS)
✅ **Responsive Layout**: Stacks vertically on small screens
✅ **Full-Width Inputs**: Easier to tap on mobile
✅ **Large Buttons**: Easy to tap without precision
✅ **Wrapping Tags**: Resource tags wrap on narrow screens
✅ **Generous Spacing**: 16px+ between sections

---

This architecture ensures a maintainable, performant, accessible, and user-friendly corrective discussion step that integrates seamlessly with the existing warning wizard system.
