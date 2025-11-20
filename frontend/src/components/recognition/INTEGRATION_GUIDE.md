# Recognition Entry Component - Integration Guide

## Overview

The `RecognitionEntry` component allows managers to record employee achievements and recognition. It's built using the same patterns as the counselling and absence reporting modals, with a positive, celebratory design.

## Component Location

**File:** `/home/aiguy/projects/hr-disciplinary-system/frontend/src/components/recognition/RecognitionEntry.tsx`

## Features Implemented

### ✅ Core Features
- **Employee Selection** - Uses `UniversalEmployeeSelector` for consistent UX
- **Recognition Types** - 9 pre-defined types with icons and descriptions
- **Achievement Title** - Required field (5-100 characters)
- **Achievement Description** - Required field (minimum 20 characters)
- **Business Impact** - Required field (minimum 20 characters)
- **Achievement Date** - Date picker with backdate capability
- **Skills Demonstrated** - Multi-select with pre-defined + custom skills
- **Recognition Given** - Checkboxes for bonus, time off, praise, certificate, other
- **Future Goals** - Optional textarea for stretch targets
- **Manager Comments** - Optional textarea for additional notes

### ✅ UX Features
- **Confetti Animation** - Celebration animation on successful submission
- **Form Validation** - Comprehensive inline validation with error messages
- **Mobile Optimized** - Responsive design with mobile modal patterns
- **Accessibility** - Focus trap, ARIA labels, keyboard navigation
- **Body Scroll Prevention** - Proper modal behavior
- **Loading States** - Loading spinner during submission
- **Success Screen** - Celebratory success message with trophy icon

### ✅ Design System Integration
- Uses `modal-system.css` for consistent modal styling
- Uses CSS variables for theming
- Uses `ThemedCard`, `ThemedButton` patterns
- Matches existing component design language

## Data Structure

### RecognitionRecord Interface

```typescript
interface RecognitionRecord {
  id?: string;
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;

  // Core Recognition Fields
  recognitionType: RecognitionType;
  achievementTitle: string;
  achievementDescription: string;
  businessImpact: string;
  achievementDate: string;

  // Optional Fields
  skillsDemonstrated: string[];
  recognitionGiven: RecognitionGivenType[];
  recognitionOtherDetails?: string;
  futureGoals?: string;
  managerComments?: string;

  // System Fields
  createdAt: string;
  updatedAt: string;
}
```

### Recognition Types

```typescript
type RecognitionType =
  | 'exceptional_performance'
  | 'achievement'
  | 'positive_behavior'
  | 'innovation'
  | 'leadership'
  | 'teamwork'
  | 'customer_service'
  | 'safety'
  | 'other';
```

### Recognition Given Types

```typescript
type RecognitionGivenType =
  | 'bonus'
  | 'extra_time_off'
  | 'public_praise'
  | 'certificate'
  | 'other';
```

## Firestore Collection

**Collection Path:** `/organizations/{orgId}/recognitions`

**Security Rules Required:**

```javascript
// Add to firestore.rules
match /organizations/{orgId}/recognitions/{recognitionId} {
  // Managers can create recognitions for their employees
  allow create: if isManager() && request.resource.data.organizationId == orgId;

  // Managers can read recognitions for their employees
  allow read: if isManager() &&
    (request.auth.uid == resource.data.managerId ||
     request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)/employees/$(resource.data.employeeId)).data.managerIds);

  // HR can read all recognitions in their org
  allow read: if isHRManager() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;

  // Managers can update their own recognitions
  allow update: if isManager() &&
    request.auth.uid == resource.data.managerId &&
    request.resource.data.organizationId == orgId;
}
```

## Integration Instructions

### 1. Import the Component

```typescript
import { RecognitionEntry } from './components/recognition/RecognitionEntry';
```

### 2. Add State Management

```typescript
const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);
const [preSelectedEmployeeId, setPreSelectedEmployeeId] = useState<string | undefined>(undefined);
```

### 3. Render the Component

**Example 1: Open from Dashboard (No pre-selected employee)**

```typescript
<RecognitionEntry
  isOpen={isRecognitionModalOpen}
  onClose={() => setIsRecognitionModalOpen(false)}
/>
```

**Example 2: Open from Employee Profile (Pre-selected employee)**

```typescript
<RecognitionEntry
  isOpen={isRecognitionModalOpen}
  onClose={() => {
    setIsRecognitionModalOpen(false);
    setPreSelectedEmployeeId(undefined);
  }}
  employeeId={preSelectedEmployeeId}
/>
```

### 4. Add Button to Open Modal

**Dashboard Button:**

```typescript
<button
  onClick={() => setIsRecognitionModalOpen(true)}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
>
  <Award className="w-4 h-4" />
  Recognize Employee
</button>
```

**Employee Profile Button:**

```typescript
<button
  onClick={() => {
    setPreSelectedEmployeeId(employee.id);
    setIsRecognitionModalOpen(true);
  }}
  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
>
  <Trophy className="w-4 h-4" />
  Recognize Achievement
</button>
```

## Suggested Integration Points

### 1. Manager Dashboard

Add a "Recognize Employee" button to the manager dashboard quick actions:

**Location:** `/src/components/dashboard/HODDashboardSection.tsx` or similar

```typescript
// In quick actions section
<ThemedButton
  variant="primary"
  onClick={() => setIsRecognitionModalOpen(true)}
  icon={Award}
>
  Recognize Employee
</ThemedButton>
```

### 2. Employee Profile/Details Modal

Add recognition button to employee actions:

**Location:** Employee details modal or profile view

```typescript
// In employee actions
<button
  onClick={() => handleRecognizeEmployee(employee.id)}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
>
  <Trophy className="w-4 h-4" />
  Recognize
</button>
```

### 3. Employee Management Table

Add "Recognize" action button to employee table rows:

**Location:** `/src/components/employees/EmployeeTableBrowser.tsx`

```typescript
// In action buttons column
<button
  onClick={() => handleRecognizeEmployee(employee.id)}
  className="p-2 rounded hover:bg-green-50"
  title="Recognize achievement"
>
  <Award className="w-4 h-4 text-green-600" />
</button>
```

## Future Enhancements (Optional)

### 1. Photo/Certificate Upload

Add file upload functionality for achievement certificates or team photos:

```typescript
// Add to component state
const [attachments, setAttachments] = useState<File[]>([]);

// Add upload logic
const handleFileUpload = async (files: File[]) => {
  // Upload to Firebase Storage
  // Add URLs to recognitionData.attachmentUrls
};
```

### 2. PDF/Certificate Generation

Generate a printable achievement certificate:

```typescript
// New service: RecognitionCertificateService.ts
export const generateCertificate = async (recognition: RecognitionRecord) => {
  // Use PDFGenerationService pattern
  // Generate achievement certificate PDF
  // Return download URL
};
```

### 3. Recognition Dashboard

Create a dedicated dashboard to view all recognitions:

**Component:** `/src/components/recognition/RecognitionDashboard.tsx`

Features:
- Filter by employee, type, date range
- Export to CSV/PDF
- Analytics (most recognized employees, popular recognition types)
- Timeline view of recognitions

### 4. Public Recognition Feed

Show recent recognitions on team dashboard:

```typescript
// Component: RecognitionFeed.tsx
<div className="recognition-feed">
  {recentRecognitions.map(recognition => (
    <RecognitionCard key={recognition.id} recognition={recognition} />
  ))}
</div>
```

### 5. Integration with Performance Reviews

Link recognitions to performance review documents:

```typescript
// Add to performance review data structure
interface PerformanceReview {
  // ... existing fields
  linkedRecognitions: string[]; // Recognition IDs
}
```

## Testing Checklist

- [ ] Open modal from dashboard (no pre-selected employee)
- [ ] Open modal from employee profile (pre-selected employee)
- [ ] Select employee from dropdown
- [ ] Select recognition type
- [ ] Fill all required fields (title, description, business impact, date)
- [ ] Add skills (predefined and custom)
- [ ] Select recognition given options
- [ ] Test "Other" option requires details
- [ ] Fill optional fields (future goals, manager comments)
- [ ] Test validation errors for required fields
- [ ] Test character limits (title 5-100, descriptions 20+)
- [ ] Submit recognition successfully
- [ ] Verify confetti animation appears
- [ ] Verify success message displays
- [ ] Verify modal auto-closes after 3 seconds
- [ ] Test on mobile (responsive design)
- [ ] Test keyboard navigation (Tab, Escape)
- [ ] Test screen reader accessibility
- [ ] Verify data saved to Firestore
- [ ] Test with slow network (loading states)
- [ ] Test error handling (network failure)

## Maintenance Notes

### Dependencies

- `UniversalEmployeeSelector` - Employee selection component
- `CustomDatePicker` - Date selection component
- `usePreventBodyScroll` - Modal scroll prevention hook
- `useFocusTrap` - Accessibility focus trap hook
- `DatabaseShardingService` - Firestore operations
- `TimeService` - Server timestamp generation
- `modal-system.css` - Modal styling

### Style Dependencies

- CSS confetti animation added to `/src/index.css` (lines 1337-1353)
- Uses existing CSS variables from design system
- Uses existing modal-system classes

### Icons Used

From `lucide-react`:
- `Award`, `Trophy`, `Star`, `Sparkles` - Recognition icons
- `User`, `Calendar`, `FileText`, `Tag` - Form field icons
- `CheckCircle`, `AlertCircle` - Status icons
- `X`, `ChevronDown`, `Upload`, `Target` - UI icons

## Support

For questions or issues with this component:

1. Check existing patterns in `UnifiedReportAbsence.tsx` and `UnifiedBookHRMeeting.tsx`
2. Review modal design standards in `MODAL_USAGE_GUIDELINES.md`
3. Check design system components in `ThemedCard.tsx`, `ThemedButton.tsx`
4. Review accessibility hooks in `useFocusTrap.ts`, `usePreventBodyScroll.ts`

## License

Part of the HR Disciplinary System - Enterprise Edition
