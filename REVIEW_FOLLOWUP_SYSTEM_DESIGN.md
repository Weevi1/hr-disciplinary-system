# Review Follow-Up System Design
**Comprehensive Design Document for Corrective Action Review Tracking**

**Version**: 1.0
**Created**: 2025-11-12
**Author**: Claude (Opus 4.1)
**Status**: Design Complete - Ready for Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [State Machine](#state-machine)
4. [HR Workflow](#hr-workflow)
5. [Auto-Satisfaction Logic](#auto-satisfaction-logic)
6. [Notification System](#notification-system)
7. [Dashboard Integration](#dashboard-integration)
8. [PDF Documentation](#pdf-documentation)
9. [Edge Cases](#edge-cases)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Purpose
The Review Follow-Up System tracks corrective action progress after warnings are issued. It enables HR managers to follow up with HODs on employee improvement, automatically mark reviews as satisfactory if no action is taken (indicating adequate progress), and escalate if needed.

### Key Principles
1. **Auto-Satisfaction**: If HR doesn't follow up by X days after review date, employee progress is deemed satisfactory
2. **Accountability**: System tracks all review actions and outcomes
3. **Progressive Enhancement**: Non-intrusive notifications that don't overwhelm HR
4. **Legal Compliance**: Full audit trail for all review decisions

### Core Features
- Automatic review tracking for warnings with `reviewDate` field
- Multi-state review lifecycle (pending → due → overdue → auto-satisfied/completed)
- Notification system for upcoming/overdue reviews
- Dashboard integration with "Reviews Due" metrics
- PDF clause explaining auto-satisfaction policy
- Complete audit trail

---

## TypeScript Interfaces

### 1. Review Follow-Up Tracking Interface

```typescript
// frontend/src/types/core.ts additions

/**
 * Review Follow-Up States
 * Tracks the lifecycle of corrective action reviews
 */
export type ReviewFollowUpStatus =
  | 'pending'                    // Review date not yet reached
  | 'due_soon'                   // Review date within 7 days
  | 'due'                        // Review date is today
  | 'overdue'                    // Review date passed, no action taken
  | 'auto_satisfied'             // Auto-marked satisfactory after grace period
  | 'in_progress'                // HR actively reviewing with HOD
  | 'completed_satisfactory'     // Manual review: Progress good
  | 'completed_unsatisfactory'   // Manual review: Progress poor, action taken
  | 'escalated';                 // New warning issued or further action taken

/**
 * Review Follow-Up Record
 * Attached to Warning interface, tracks corrective action review
 */
export interface ReviewFollowUp {
  // Core status
  status: ReviewFollowUpStatus;
  reviewDate: Date;                  // Scheduled review date (from warning wizard)

  // Status timestamps
  statusChangedAt: Date;             // Last status change timestamp
  statusChangedBy?: string;          // User ID who changed status

  // Auto-satisfaction tracking
  autoSatisfiedAt?: Date;            // When system auto-marked as satisfied
  autoSatisfactionGracePeriod: number; // Days after review date before auto-satisfaction (default: 7)

  // Manual review tracking
  reviewStartedAt?: Date;            // When HR clicked "Start Review"
  reviewStartedBy?: string;          // HR user ID who started review
  reviewCompletedAt?: Date;          // When review was completed
  reviewCompletedBy?: string;        // HR user ID who completed review

  // HOD feedback
  hodFeedback?: string;              // HOD's verbal/written feedback on employee progress
  hodContactedAt?: Date;             // When HR contacted HOD
  hodContactedBy?: string;           // HR user ID who contacted HOD
  hodContactMethod?: 'phone' | 'email' | 'in-person' | 'teams'; // How HOD was contacted

  // Review outcome
  outcome?: ReviewOutcome;           // Full outcome details

  // Follow-up actions (if unsatisfactory)
  followUpActions?: ReviewFollowUpAction[];

  // Audit trail
  auditLog: ReviewAuditEntry[];      // Complete history of status changes

  // Notifications
  notificationsSent?: ReviewNotification[]; // Track which notifications were sent

  // Metadata
  createdAt: Date;                   // When review tracking was created
  updatedAt: Date;                   // Last update timestamp
}

/**
 * Review Outcome Details
 * Captures the result of HR's manual review
 */
export interface ReviewOutcome {
  result: 'satisfactory' | 'unsatisfactory' | 'partial_improvement' | 'no_improvement';

  // Progress assessment
  progressRating: 1 | 2 | 3 | 4 | 5;     // 1=No improvement, 5=Excellent
  areasImproved: string[];               // Which commitments were met
  areasNeedingWork: string[];            // Which commitments still need work

  // HR notes
  reviewNotes: string;                   // HR's detailed notes
  hrRecommendation: string;              // Next steps recommendation

  // Action taken
  actionTaken: 'none' | 'new_warning' | 'meeting_scheduled' | 'escalated' | 'dismissed';
  newWarningId?: string;                 // If new warning issued
  meetingScheduledFor?: Date;            // If follow-up meeting scheduled

  // Supporting evidence
  evidenceDocuments?: string[];          // URLs to supporting documents
  witnessStatements?: string[];          // Any witness input

  // Date
  reviewDate: Date;                      // When review was completed
  reviewedBy: string;                    // HR manager who completed review
}

/**
 * Follow-Up Action
 * Actions taken after unsatisfactory review
 */
export interface ReviewFollowUpAction {
  id: string;
  type: 'new_warning' | 'meeting' | 'training' | 'escalation' | 'pip' | 'dismissal';
  description: string;
  scheduledFor?: Date;
  completedAt?: Date;
  completedBy?: string;
  relatedDocumentId?: string;           // Warning ID, meeting ID, etc.
  createdAt: Date;
  createdBy: string;
}

/**
 * Review Audit Entry
 * Complete audit trail for compliance
 */
export interface ReviewAuditEntry {
  timestamp: Date;
  action: string;                       // 'status_changed', 'hod_contacted', 'review_completed', etc.
  userId: string;                       // Who performed action
  userName: string;                     // Full name for audit log
  previousStatus?: ReviewFollowUpStatus;
  newStatus?: ReviewFollowUpStatus;
  notes?: string;
  metadata?: Record<string, any>;       // Additional context
}

/**
 * Review Notification
 * Track which notifications have been sent
 */
export interface ReviewNotification {
  type: 'review_upcoming' | 'review_due' | 'review_overdue' | 'auto_satisfied' | 'review_completed';
  sentAt: Date;
  sentTo: string[];                     // User IDs who received notification
  notificationId?: string;              // Reference to notification in notifications collection
}
```

### 2. Warning Interface Extensions

```typescript
// frontend/src/types/core.ts - Add to Warning interface

export interface Warning {
  // ... existing fields ...

  /**
   * Review Follow-Up Tracking
   * Added when warning includes reviewDate for corrective action follow-up
   */
  reviewFollowUp?: ReviewFollowUp;
}
```

### 3. Dashboard Metrics Extension

```typescript
// Add to DashboardData interface in useDashboardData.ts

interface DashboardData {
  // ... existing fields ...

  // Review follow-up metrics
  reviewMetrics: {
    dueSoon: number;           // Reviews due within 7 days
    dueToday: number;          // Reviews due today
    overdue: number;           // Reviews past due date
    autoSatisfied: number;     // Auto-satisfied this month
    completed: number;         // Manually completed this month
    inProgress: number;        // Currently being reviewed
  };
}
```

---

## State Machine

### State Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REVIEW FOLLOW-UP STATE MACHINE                    │
└─────────────────────────────────────────────────────────────────────┘

Initial State: PENDING
Trigger: Warning created with reviewDate field

   ┌──────────┐
   │ PENDING  │  Review date not yet reached
   └────┬─────┘  (More than 7 days away)
        │
        │ [7 days before reviewDate]
        ├──────────────────────────────────────────────────────────────┐
        │                                                               │
        ▼                                                               │
   ┌──────────┐  Review date within 7 days                             │
   │ DUE_SOON │  Notification: "Review coming up for [Employee]"       │
   └────┬─────┘                                                         │
        │                                                               │
        │ [reviewDate reached]                                          │
        ▼                                                               │
   ┌──────────┐  Review date is today                                  │
   │   DUE    │  Notification: "Review due today for [Employee]"       │
   └────┬─────┘                                                         │
        │                                                               │
        │ [reviewDate + 1 day]                                          │
        ▼                                                               │
   ┌──────────┐  Review date passed                                    │
   │ OVERDUE  │  Notification: "Review overdue for [Employee]"         │
   └────┬─────┘  (Daily reminder for 3 days)                           │
        │                                                               │
        │ [reviewDate + 7 days]                                         │
        ├──────────────────────────────────────────────────────────────┤
        │                                                               │
        │ NO HR ACTION                        HR STARTS REVIEW          │
        ▼                                              ▼                │
   ┌────────────────┐                          ┌──────────────┐        │
   │ AUTO_SATISFIED │                          │ IN_PROGRESS  │        │
   │                │                          │              │        │
   │ System auto-   │                          │ HR reviewing │        │
   │ marks progress │                          │ with HOD     │        │
   │ as satisfactory│                          └──────┬───────┘        │
   │                │                                 │                │
   │ Notification:  │                                 │                │
   │ "Auto-marked   │                      ┌──────────┴──────────┐     │
   │ satisfactory"  │                      │                     │     │
   └────────────────┘                      ▼                     ▼     │
                                    ┌────────────┐      ┌──────────────┴┐
                                    │ COMPLETED  │      │  COMPLETED     │
                                    │SATISFACTORY│      │ UNSATISFACTORY │
                                    │            │      │                │
                                    │ Manual     │      │ Manual review: │
                                    │ review:    │      │ Progress poor  │
                                    │ Progress   │      │                │
                                    │ good       │      │ Actions:       │
                                    └────────────┘      │ - New warning  │
                                                        │ - Meeting      │
                                                        │ - Training     │
                                                        └────────┬───────┘
                                                                 │
                                                                 │ [New warning issued]
                                                                 ▼
                                                         ┌──────────────┐
                                                         │  ESCALATED   │
                                                         │              │
                                                         │ New warning  │
                                                         │ created      │
                                                         └──────────────┘
```

### State Transitions

| From Status | To Status | Trigger | Conditions |
|------------|-----------|---------|------------|
| `pending` | `due_soon` | Automated | 7 days before reviewDate |
| `due_soon` | `due` | Automated | reviewDate reached |
| `due` | `overdue` | Automated | 1 day after reviewDate |
| `overdue` | `auto_satisfied` | Automated | 7 days after reviewDate, no HR action |
| `due_soon/due/overdue` | `in_progress` | HR action | HR clicks "Start Review" |
| `in_progress` | `completed_satisfactory` | HR action | HR marks as satisfactory |
| `in_progress` | `completed_unsatisfactory` | HR action | HR marks as unsatisfactory |
| `completed_unsatisfactory` | `escalated` | HR action | New warning issued |

### Transition Rules

1. **Automatic Transitions** (Daily cron job at 00:00 UTC):
   - Check all warnings with `reviewFollowUp.status` in `['pending', 'due_soon', 'due', 'overdue']`
   - Calculate days from reviewDate
   - Update status based on rules above
   - Create notifications as needed
   - Add audit log entry

2. **Manual Transitions** (HR-initiated):
   - Require HR user authentication
   - Validate status progression (can't skip states)
   - Mandatory fields based on transition (e.g., hodFeedback for completion)
   - Create audit log entry with HR user details

3. **Irreversible States**:
   - `auto_satisfied`: Cannot be manually changed (indicates no action was needed)
   - `completed_satisfactory`: Cannot be reopened
   - `completed_unsatisfactory`: Cannot be reopened
   - `escalated`: Final state

---

## HR Workflow

### Step-by-Step HR Workflow

#### 1. HR Sees Review Notification
**Location**: HR Dashboard → Top banner or "Reviews Due" metric card

**Display**:
```
┌───────────────────────────────────────────────────────────────┐
│ 🔔 You have 3 reviews due for follow-up                       │
│                                                                │
│ • 1 due today • 2 overdue • 0 upcoming (next 7 days)          │
│                                                                │
│ [View Reviews]                                                 │
└───────────────────────────────────────────────────────────────┘
```

#### 2. HR Opens Review Follow-Up Dashboard
**Route**: `/dashboard/hr/reviews`

**View**: Table/card view of warnings requiring review

```
┌─────────────────────────────────────────────────────────────────────┐
│ Review Follow-Up Dashboard                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Filters: [All] [Due Today] [Overdue] [Due Soon] [Completed]        │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ 🔴 OVERDUE (3 days)                                          │   │
│ │ Employee: John Doe (#EMP-1234)                              │   │
│ │ Warning: Verbal - Repeated Late Arrivals                     │   │
│ │ Issued: 2025-09-15 | Review Date: 2025-11-05                │   │
│ │ Commitments: 3 improvement actions                           │   │
│ │                                                               │   │
│ │ [Start Review] [View Warning Details]                        │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ 🟡 DUE TODAY                                                  │   │
│ │ Employee: Jane Smith (#EMP-5678)                             │   │
│ │ Warning: Written - Policy Violation                          │   │
│ │ Issued: 2025-08-12 | Review Date: 2025-11-12                │   │
│ │ Commitments: 2 improvement actions                           │   │
│ │                                                               │   │
│ │ [Start Review] [View Warning Details]                        │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3. HR Clicks "Start Review"
**Action**: Opens Review Modal with employee/warning details

**Modal Layout**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ Review Corrective Action Progress                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ 👤 EMPLOYEE INFORMATION                                              │
│ Name: John Doe (#EMP-1234)                                          │
│ Department: Operations | Position: Warehouse Operative              │
│                                                                      │
│ ⚠️ ORIGINAL WARNING                                                  │
│ Level: Verbal Warning                                                │
│ Category: Repeated Late Arrivals                                     │
│ Issued: 2025-09-15 | Review Date: 2025-11-05 (3 days overdue)      │
│                                                                      │
│ 📋 IMPROVEMENT COMMITMENTS                                           │
│ 1. Arrive on time for all shifts (Timeline: Immediate)              │
│    Status: [ ] Completed                                            │
│                                                                      │
│ 2. Set multiple alarms to avoid oversleeping (Timeline: Within 1 wk)│
│    Status: [ ] Completed                                            │
│                                                                      │
│ 3. Notify supervisor if running late (Timeline: Ongoing)            │
│    Status: [ ] Completed                                            │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ 🎯 HOD FEEDBACK                                                      │
│ Contact HOD to get verbal feedback on employee progress             │
│                                                                      │
│ HOD Contact Method:                                                  │
│ [ ] Phone [ ] Email [ ] In-Person [ ] Teams                         │
│                                                                      │
│ HOD Feedback:                                                        │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [Text area for HOD's feedback - min 50 chars]                │   │
│ │                                                                │   │
│ │                                                                │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ 📊 PROGRESS ASSESSMENT                                               │
│                                                                      │
│ Overall Progress Rating:                                             │
│ ⭐⭐⭐☆☆ (3/5 - Partial Improvement)                                │
│                                                                      │
│ Areas Improved:                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [Multi-select checklist from commitments]                    │   │
│ │ ☑ Commitment #1: Arriving on time                             │   │
│ │ ☑ Commitment #3: Notifying supervisor                         │   │
│ │ ☐ Commitment #2: Setting alarms                               │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ Areas Still Needing Work:                                            │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [Text area - auto-populated from unchecked commitments]      │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ HR Review Notes:                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [Text area for HR's detailed notes - min 50 chars]           │   │
│ │                                                                │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ ✅ REVIEW OUTCOME                                                    │
│                                                                      │
│ Is the employee's progress satisfactory?                             │
│ ( ) Satisfactory - No further action needed                         │
│ ( ) Unsatisfactory - Further action required                        │
│                                                                      │
│ [If Unsatisfactory selected, show additional options:]              │
│                                                                      │
│ What action should be taken?                                         │
│ [ ] Issue new warning (escalate)                                    │
│ [ ] Schedule follow-up meeting                                      │
│ [ ] Arrange additional training                                     │
│ [ ] Create Performance Improvement Plan (PIP)                       │
│ [ ] Other (specify below)                                           │
│                                                                      │
│ Follow-Up Action Details:                                            │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ [Text area for action details]                               │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ [Cancel]                         [Save Draft]  [Complete Review]    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4. HR Submits Review
**Validation**:
- HOD feedback required (min 50 chars)
- Progress rating required (1-5)
- Review notes required (min 50 chars)
- Outcome selection required (satisfactory/unsatisfactory)
- If unsatisfactory: Action type and details required

**Actions**:
1. Update `reviewFollowUp.status` → `completed_satisfactory` or `completed_unsatisfactory`
2. Save all review data to `reviewFollowUp.outcome`
3. Add audit log entry
4. Send notification to manager
5. If unsatisfactory: Create follow-up actions
6. If escalation selected: Launch warning wizard with pre-filled employee data

#### 5. Review Complete View
**Display**: Success message with summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ ✅ Review Completed Successfully                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Review for John Doe has been completed and saved.                   │
│                                                                      │
│ Outcome: Satisfactory                                                │
│ Progress Rating: 3/5 (Partial Improvement)                           │
│                                                                      │
│ Next Steps:                                                          │
│ • No further action required at this time                            │
│ • Warning remains active until expiry (2025-12-15)                   │
│                                                                      │
│ [View Review Details] [Return to Dashboard]                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Auto-Satisfaction Logic

### Overview
If HR doesn't review by the grace period deadline, the system automatically marks progress as satisfactory, indicating the employee must be performing adequately since no corrective action was deemed necessary.

### Configuration

```typescript
// Default auto-satisfaction settings
const AUTO_SATISFACTION_CONFIG = {
  gracePeriodDays: 7,                    // Days after reviewDate before auto-satisfaction
  enableAutoSatisfaction: true,          // Can be disabled per organization
  notifyOnAutoSatisfaction: true,        // Send notification when auto-satisfied
  requireHROverride: false               // If true, HR must manually confirm
};
```

### Auto-Satisfaction Process

#### Daily Cron Job (Firebase Cloud Function)
**Schedule**: Every day at 00:00 UTC

```typescript
// functions/src/reviewFollowUpCron.ts

export const processReviewFollowUps = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const now = new Date();

    // Query all warnings with overdue reviews
    const warningsRef = db.collectionGroup('warnings');
    const overdueQuery = query(
      warningsRef,
      where('reviewFollowUp.status', '==', 'overdue'),
      where('reviewFollowUp.reviewDate', '<=', now)
    );

    const overdueSnapshot = await getDocs(overdueQuery);

    for (const warningDoc of overdueSnapshot.docs) {
      const warning = warningDoc.data();
      const reviewFollowUp = warning.reviewFollowUp;

      // Calculate days overdue
      const reviewDate = reviewFollowUp.reviewDate.toDate();
      const daysOverdue = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

      // Check if past grace period
      if (daysOverdue >= reviewFollowUp.autoSatisfactionGracePeriod) {
        // Auto-satisfy
        await autoSatisfyReview(warningDoc.ref, warning);
      }
    }

    // Also handle status transitions for pending/due_soon/due
    await processStatusTransitions(now);
  });

async function autoSatisfyReview(warningRef: DocumentReference, warning: Warning) {
  const now = new Date();

  const updates = {
    'reviewFollowUp.status': 'auto_satisfied',
    'reviewFollowUp.autoSatisfiedAt': now,
    'reviewFollowUp.statusChangedAt': now,
    'reviewFollowUp.updatedAt': now,
    'reviewFollowUp.auditLog': FieldValue.arrayUnion({
      timestamp: now,
      action: 'auto_satisfied',
      userId: 'system',
      userName: 'System (Automated)',
      previousStatus: 'overdue',
      newStatus: 'auto_satisfied',
      notes: `Automatically marked as satisfactory after ${warning.reviewFollowUp.autoSatisfactionGracePeriod} day grace period`
    })
  };

  await warningRef.update(updates);

  // Send notification to HR
  await sendAutoSatisfactionNotification(warning);

  Logger.info(`Auto-satisfied review for warning ${warning.id} - employee ${warning.employeeId}`);
}
```

### Auto-Satisfaction Notification

**Notification Type**: `info` (not urgent)

**Title**: "Review Auto-Marked Satisfactory"

**Message**:
```
The review for [Employee Name] (#[EmployeeNumber]) has been automatically
marked as satisfactory as no follow-up action was required within the
grace period.

Original Warning: [Level] - [Category]
Review Date: [ReviewDate]
Auto-Satisfied: [AutoSatisfiedDate]

Since no corrective action was needed, the employee's progress is deemed
satisfactory. The warning remains active until its expiry date.
```

**Actions**:
- `[View Warning Details]` → Opens WarningDetailsModal
- `[Dismiss]` → Marks notification as read

### Manual Override (Optional Feature)
If organization requires HR confirmation even for auto-satisfaction:

```typescript
// Organization setting
interface Organization {
  reviewFollowUpSettings?: {
    requireManualConfirmation: boolean;
    // If true, auto-satisfaction creates task instead of completing
  };
}

// Modified auto-satisfaction flow
if (org.reviewFollowUpSettings?.requireManualConfirmation) {
  // Create pending review task instead of auto-satisfying
  await createReviewConfirmationTask(warning);
} else {
  // Standard auto-satisfaction
  await autoSatisfyReview(warningRef, warning);
}
```

---

## Notification System

### Notification Types

| Type | Trigger | Recipients | Priority | Frequency |
|------|---------|------------|----------|-----------|
| `review_upcoming` | 7 days before reviewDate | HR managers | Low | Once |
| `review_due` | reviewDate reached | HR managers | Medium | Once |
| `review_overdue` | reviewDate + 1 day | HR managers | High | Daily for 3 days |
| `auto_satisfied` | reviewDate + grace period | HR managers | Low | Once |
| `review_completed_satisfactory` | Manual review complete | Manager who issued warning | Low | Once |
| `review_completed_unsatisfactory` | Manual review complete | Manager who issued warning, HOD | High | Once |

### Notification Templates

#### 1. Review Upcoming (7 days before)
```typescript
{
  type: 'info',
  title: 'Review Coming Up',
  message: `A corrective action review is scheduled for [Employee Name] in 7 days.

  Warning: [Level] - [Category]
  Issued: [IssueDate]
  Review Date: [ReviewDate]

  Please plan to contact the HOD to assess the employee's progress on their improvement commitments.`,
  category: 'review_follow_up',
  actions: [
    { label: 'View Review', action: 'view_review', variant: 'primary' },
    { label: 'Dismiss', action: 'dismiss', variant: 'secondary' }
  ],
  data: {
    warningId: warning.id,
    employeeId: warning.employeeId,
    reviewDate: warning.reviewFollowUp.reviewDate
  }
}
```

#### 2. Review Due Today
```typescript
{
  type: 'warning',
  title: 'Review Due Today',
  message: `A corrective action review is due today for [Employee Name].

  Warning: [Level] - [Category]
  Issued: [IssueDate]
  Review Date: [ReviewDate]

  Please contact the HOD to assess progress and complete the review.`,
  category: 'review_follow_up',
  actions: [
    { label: 'Start Review', action: 'start_review', variant: 'primary' },
    { label: 'View Details', action: 'view_details', variant: 'secondary' }
  ]
}
```

#### 3. Review Overdue
```typescript
{
  type: 'error',
  title: 'Review Overdue',
  message: `URGENT: A corrective action review is [X] days overdue for [Employee Name].

  Warning: [Level] - [Category]
  Review Date: [ReviewDate]

  If no action is taken within [Y] days, the review will be automatically marked as satisfactory, indicating no further action is needed.`,
  category: 'review_follow_up',
  actions: [
    { label: 'Start Review Now', action: 'start_review', variant: 'danger' },
    { label: 'View Details', action: 'view_details', variant: 'secondary' }
  ]
}
```

#### 4. Auto-Satisfied
```typescript
{
  type: 'info',
  title: 'Review Auto-Marked Satisfactory',
  message: `The corrective action review for [Employee Name] has been automatically marked as satisfactory as no follow-up action was required.

  Warning: [Level] - [Category]
  Review Date: [ReviewDate]
  Auto-Satisfied: [AutoSatisfiedDate]

  The employee's progress is deemed satisfactory. The warning remains active until its expiry date.`,
  category: 'review_follow_up',
  actions: [
    { label: 'View Warning', action: 'view_warning', variant: 'secondary' },
    { label: 'Dismiss', action: 'dismiss', variant: 'secondary' }
  ]
}
```

### Notification Delivery

**Service**: `NotificationDeliveryService` (existing)

**Method**: Real-time Firestore subscription via `useNotifications` hook

**Storage**: `notifications` collection

**Retention**: 90 days (auto-delete old notifications)

---

## Dashboard Integration

### HR Dashboard Integration Points

#### 1. Metric Card - "Reviews Due"
**Location**: HR Dashboard → Metrics section (below Warnings/Meetings/Reports cards)

**Card Design**:
```
┌─────────────────────────────────────────────┐
│ 📋 Reviews Due                               │
├─────────────────────────────────────────────┤
│                                              │
│ 🔴 2 Overdue                                 │
│ 🟡 1 Due Today                               │
│ 🟢 3 Due Soon (next 7 days)                 │
│                                              │
│ ──────────────────────────────────────────  │
│                                              │
│ This Month:                                  │
│ ✅ 12 Completed (8 satisfactory)             │
│ ⏰ 5 Auto-satisfied                          │
│                                              │
│ [View All Reviews]                           │
│                                              │
└─────────────────────────────────────────────┘
```

**Data Source**:
```typescript
// Add to useDashboardData.ts

const loadReviewMetrics = async (orgId: string) => {
  const warnings = await API.warnings.getAll(orgId);
  const now = new Date();

  // Filter warnings with active reviews
  const activeReviews = warnings.filter(w =>
    w.reviewFollowUp &&
    ['due_soon', 'due', 'overdue', 'in_progress'].includes(w.reviewFollowUp.status)
  );

  // Calculate metrics
  const metrics = {
    dueSoon: activeReviews.filter(w => w.reviewFollowUp.status === 'due_soon').length,
    dueToday: activeReviews.filter(w => w.reviewFollowUp.status === 'due').length,
    overdue: activeReviews.filter(w => w.reviewFollowUp.status === 'overdue').length,
    inProgress: activeReviews.filter(w => w.reviewFollowUp.status === 'in_progress').length,

    // This month completed
    completed: warnings.filter(w =>
      w.reviewFollowUp &&
      ['completed_satisfactory', 'completed_unsatisfactory'].includes(w.reviewFollowUp.status) &&
      isThisMonth(w.reviewFollowUp.reviewCompletedAt)
    ).length,

    autoSatisfied: warnings.filter(w =>
      w.reviewFollowUp?.status === 'auto_satisfied' &&
      isThisMonth(w.reviewFollowUp.autoSatisfiedAt)
    ).length
  };

  return metrics;
};
```

#### 2. Navigation Quick Action
**Location**: HR Dashboard → Quick Actions section (top of page)

**Button**:
```
┌────────────────────────────┐
│ 📋 Review Follow-Ups (6)   │  ← Red badge if overdue
└────────────────────────────┘
```

**Badge Logic**:
- Show count of due + overdue reviews
- Red if any overdue
- Orange if any due today
- Green if only due soon

#### 3. Dashboard Tab (Optional)
**Location**: HR Dashboard → Tabs

**Tab**: "Reviews" (between "Warnings" and "Meetings")

**Content**: Embedded ReviewFollowUpDashboard component

#### 4. Top Banner Notification
**Location**: Above HR Dashboard content

**Display**: Only if reviews are overdue

```
┌───────────────────────────────────────────────────────────────────┐
│ ⚠️ ATTENTION: You have 2 overdue corrective action reviews        │
│                                                                    │
│ These reviews are past their scheduled date. Please complete them │
│ to avoid automatic satisfaction marking.                           │
│                                                                    │
│ [View Reviews Now]  [Remind Me Later]  [Dismiss]                  │
└───────────────────────────────────────────────────────────────────┘
```

### New Component: ReviewFollowUpDashboard

**Route**: `/dashboard/hr/reviews`

**File**: `frontend/src/components/reviews/ReviewFollowUpDashboard.tsx`

**Features**:
- Filterable table/card view (Overdue, Due Today, Due Soon, Completed)
- Search by employee name/number
- Sort by review date, status, employee name
- Batch actions (e.g., "Mark as In Progress" for multiple)
- Export to CSV
- "Start Review" button for each warning

**Layout**: Similar to existing WarningsReviewDashboard

---

## PDF Documentation

### PDF Clause - Review Date & Auto-Satisfaction

**Section**: After "Improvement Commitments" section, before "Signatures"

**Heading**: "REVIEW DATE AND AUTO-SATISFACTION CLAUSE"

**Content**:
```
REVIEW DATE AND AUTO-SATISFACTION CLAUSE

This corrective action will be reviewed on [REVIEW_DATE].

At the review, your manager will contact your Head of Department to assess
your progress on the improvement commitments outlined above. If you have
demonstrated satisfactory improvement, no further action will be taken.

If the scheduled review does not occur within [GRACE_PERIOD] days after the
review date, your performance will be deemed satisfactory and this corrective
action will remain active until its natural expiry date. This reflects our
understanding that if no follow-up was required, you have adequately addressed
the concerns raised.

However, should performance issues persist or new incidents occur, additional
disciplinary action may be initiated in accordance with company policy and
South African labour law.

Review Date: [REVIEW_DATE]
Grace Period: [GRACE_PERIOD] days
Warning Expires: [EXPIRY_DATE]
```

**Dynamic Fields**:
- `[REVIEW_DATE]`: From `warning.reviewDate` (formatted: "12 December 2025")
- `[GRACE_PERIOD]`: From `warning.reviewFollowUp.autoSatisfactionGracePeriod` (default: 7)
- `[EXPIRY_DATE]`: From `warning.expiryDate` (formatted: "12 March 2026")

**Styling**:
- Border: 1pt solid gray
- Background: Very light gray (#F9FAFB)
- Padding: 10mm
- Font: 10pt, line height 1.5
- Heading: Bold, 11pt

### PDF Implementation

```typescript
// frontend/src/services/PDFGenerationService.ts

// Add to WarningPDFData interface
export interface WarningPDFData {
  // ... existing fields ...

  reviewDate?: Date;
  autoSatisfactionGracePeriod?: number; // Default: 7
}

// Add to PDF generation method (v1.3.0 - new version)
const addReviewDateClause = (
  doc: jsPDF,
  yPosition: number,
  reviewDate: Date,
  expiryDate: Date,
  gracePeriod: number = 7
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Section heading
  doc.setFillColor(249, 250, 251); // Light gray background
  doc.rect(marginLeft, yPosition, contentWidth, 45, 'F'); // Background box
  doc.setDrawColor(209, 213, 219); // Gray border
  doc.rect(marginLeft, yPosition, contentWidth, 45, 'S'); // Border

  yPosition += 5;

  // Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REVIEW DATE AND AUTO-SATISFACTION CLAUSE', marginLeft + 5, yPosition);
  yPosition += 7;

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const bodyText = [
    `This corrective action will be reviewed on ${formatDate(reviewDate)}.`,
    '',
    'At the review, your manager will contact your Head of Department to assess your progress on the improvement commitments outlined above. If you have demonstrated satisfactory improvement, no further action will be taken.',
    '',
    `If the scheduled review does not occur within ${gracePeriod} days after the review date, your performance will be deemed satisfactory and this corrective action will remain active until its natural expiry date. This reflects our understanding that if no follow-up was required, you have adequately addressed the concerns raised.`,
    '',
    'However, should performance issues persist or new incidents occur, additional disciplinary action may be initiated in accordance with company policy and South African labour law.',
    '',
    `Review Date: ${formatDate(reviewDate)}`,
    `Grace Period: ${gracePeriod} days`,
    `Warning Expires: ${formatDate(expiryDate)}`
  ];

  bodyText.forEach(line => {
    const splitText = doc.splitTextToSize(line, contentWidth - 10);
    doc.text(splitText, marginLeft + 5, yPosition);
    yPosition += splitText.length * 5;
  });

  return yPosition + 5;
};

// Usage in generateWarningPDF_v1_3_0()
if (data.reviewDate) {
  yPosition = addReviewDateClause(
    doc,
    yPosition,
    data.reviewDate,
    data.expiryDate || new Date(),
    data.autoSatisfactionGracePeriod || 7
  );
}
```

---

## Edge Cases

### 1. Employee Terminated Before Review
**Scenario**: Employee is terminated/resigned before review date

**Handling**:
- Automatically mark review as `completed_satisfactory` with note "Employee no longer employed"
- No notification sent
- Audit log records reason
- Review remains viewable for historical records

```typescript
// When employee archived/terminated
if (employee.isActive === false && employee.archivedAt) {
  const activeReviews = await getActiveReviewsForEmployee(employee.id);

  for (const review of activeReviews) {
    await closeReviewDueToTermination(review.warningId, employee);
  }
}
```

### 2. Warning Appealed During Review Period
**Scenario**: Employee appeals warning while review is pending

**Handling**:
- Review status remains active but marked as "on hold"
- Add `reviewFollowUp.onHold` flag
- Appeal outcome determines next step:
  - **Appeal upheld**: Warning overturned → Review auto-cancelled
  - **Appeal rejected**: Resume review process

```typescript
interface ReviewFollowUp {
  // ... existing fields ...
  onHold: boolean;
  onHoldReason?: 'appeal_pending' | 'employee_leave' | 'investigation';
  onHoldSince?: Date;
}
```

### 3. Warning Expires Before Review
**Scenario**: Warning expires before review is completed (review scheduled beyond expiry)

**Handling**:
- Allow review to proceed (historical tracking)
- Mark review as `completed_satisfactory` by default
- Note in audit log: "Warning expired before review"
- No escalation possible if unsatisfactory

**Prevention**: Warning wizard validates `reviewDate < expiryDate`

### 4. Multiple Reviews Due Same Day
**Scenario**: HR has 10+ reviews due on same day

**Handling**:
- Batch review interface (optional)
- Allow "Quick Review" mode: Bulk mark as satisfactory with single HOD call
- Consolidated notification instead of 10 separate ones
- Prioritize by warning level (Final > Written > Verbal)

### 5. HR User on Leave During Review Period
**Scenario**: Only HR manager is on vacation when reviews are due

**Handling**:
- Delegate reviews to another HR user (if available)
- Extend grace period automatically if all HR users unavailable
- Send notification to alternate contacts (e.g., executive management)

```typescript
interface Organization {
  reviewFollowUpSettings?: {
    backupReviewers?: string[]; // User IDs who can complete reviews
    autoExtendGracePeriod?: boolean; // Extend if all HR unavailable
  };
}
```

### 6. Review Data Lost/Corrupted
**Scenario**: Technical issue causes review data loss

**Handling**:
- Full audit log allows reconstruction
- Backup system stores review snapshots
- Allow HR to manually re-enter review if needed
- Audit log shows "manual_recovery" action

### 7. Auto-Satisfaction Disputed
**Scenario**: Employee claims auto-satisfaction is unfair

**Handling**:
- HR can view auto-satisfaction audit trail
- HR can manually add notes to completed review
- System shows clear evidence no action was taken
- No ability to "un-satisfy" (preserves system integrity)

### 8. System Downtime During Cron Job
**Scenario**: Cron job fails due to system outage

**Handling**:
- Idempotent cron function (can run multiple times safely)
- Catch-up logic: Process all missed transitions on next run
- Alert admin if cron job hasn't run in 48 hours

```typescript
// Catch-up logic
const lastSuccessfulRun = await getLastCronRun();
const now = new Date();

if (now.getTime() - lastSuccessfulRun.getTime() > 48 * 60 * 60 * 1000) {
  // Alert admin
  await sendAdminAlert('Review cron job has not run in 48 hours');
}

// Process all transitions since last run
await processTransitionsSince(lastSuccessfulRun, now);
```

### 9. HOD Disagrees with Auto-Satisfaction
**Scenario**: HOD sees auto-satisfied review and says employee has NOT improved

**Handling**:
- HOD can request HR to re-open review (if within 7 days of auto-satisfaction)
- HR creates new follow-up review
- Original auto-satisfaction remains in history
- New review outcome overwrites effective status

```typescript
// Re-open capability (within 7 days only)
const canReopen = (review: ReviewFollowUp): boolean => {
  if (review.status !== 'auto_satisfied') return false;

  const autoSatisfiedAt = review.autoSatisfiedAt;
  const daysSince = Math.floor((Date.now() - autoSatisfiedAt.getTime()) / (1000 * 60 * 60 * 24));

  return daysSince <= 7;
};
```

### 10. Corrective Action Commitments Partially Met
**Scenario**: Employee met 2 of 3 commitments

**Handling**:
- HR marks specific commitments as complete
- Overall outcome: `partial_improvement`
- Decision tree:
  - Minor unmet commitment → Mark satisfactory with notes
  - Major unmet commitment → Schedule follow-up meeting
  - Critical unmet commitment → Escalate

**UI Support**: Checkbox for each commitment in review modal

---

## Implementation Checklist

### Phase 1: Data Models & Backend (Week 1)
- [ ] Add `ReviewFollowUp` interface to `core.ts`
- [ ] Add `reviewFollowUp` field to `Warning` interface
- [ ] Update `DashboardData` interface with `reviewMetrics`
- [ ] Create Firestore security rules for review access
- [ ] Create indexes for review queries
- [ ] Build Firebase Cloud Function: `processReviewFollowUps` (daily cron)
- [ ] Build helper function: `autoSatisfyReview()`
- [ ] Build helper function: `processStatusTransitions()`
- [ ] Build API endpoint: `GET /api/reviews/:orgId`
- [ ] Build API endpoint: `POST /api/reviews/:warningId/start`
- [ ] Build API endpoint: `POST /api/reviews/:warningId/complete`
- [ ] Add unit tests for state machine transitions
- [ ] Add unit tests for auto-satisfaction logic

### Phase 2: Notification System (Week 1)
- [ ] Create notification templates (4 types)
- [ ] Integrate with existing `NotificationDeliveryService`
- [ ] Build notification UI components (inbox, toast)
- [ ] Add notification preferences (per user)
- [ ] Test notification delivery for all triggers
- [ ] Add notification scheduling (7 days before, etc.)

### Phase 3: Review UI Components (Week 2)
- [ ] Create `ReviewFollowUpDashboard.tsx` component
- [ ] Create `ReviewModal.tsx` component
- [ ] Create `ReviewMetricsCard.tsx` component
- [ ] Add "Start Review" workflow
- [ ] Add progress assessment form
- [ ] Add HOD feedback form
- [ ] Add review outcome selection
- [ ] Add follow-up action options
- [ ] Add validation for required fields
- [ ] Add success/error handling

### Phase 4: Dashboard Integration (Week 2)
- [ ] Add "Reviews Due" metric card to HR Dashboard
- [ ] Add "Reviews" quick action button
- [ ] Add top banner for overdue reviews
- [ ] Add review metrics to `useDashboardData` hook
- [ ] Add review filtering/search functionality
- [ ] Add export to CSV functionality
- [ ] Test real-time updates when review completed

### Phase 5: PDF Documentation (Week 3)
- [ ] Create PDF generator version v1.3.0
- [ ] Add `addReviewDateClause()` method
- [ ] Add review clause to warning PDFs
- [ ] Test PDF rendering with review clause
- [ ] Verify PDF clause displays correctly
- [ ] Add review clause to existing PDF templates

### Phase 6: Warning Wizard Integration (Week 3)
- [ ] Modify warning creation to initialize `reviewFollowUp`
- [ ] Set initial status to `pending`
- [ ] Calculate auto-satisfaction grace period
- [ ] Add audit log on warning creation
- [ ] Test review initialization for new warnings
- [ ] Test historical warnings without reviews (backward compatibility)

### Phase 7: Edge Case Handling (Week 4)
- [ ] Handle employee termination during review
- [ ] Handle warning appeal during review
- [ ] Handle warning expiry before review
- [ ] Handle multiple reviews same day
- [ ] Handle HR user unavailability
- [ ] Handle system downtime/catch-up
- [ ] Handle auto-satisfaction disputes
- [ ] Test all edge case scenarios

### Phase 8: Testing & Deployment (Week 4)
- [ ] E2E test: Create warning with review date
- [ ] E2E test: Status transitions (pending → due_soon → due → overdue)
- [ ] E2E test: Auto-satisfaction trigger
- [ ] E2E test: Manual review completion (satisfactory)
- [ ] E2E test: Manual review completion (unsatisfactory)
- [ ] E2E test: Escalation from unsatisfactory review
- [ ] Load test: 1000+ reviews due same day
- [ ] Security audit: Review access permissions
- [ ] Documentation: Update CLAUDE.md
- [ ] Documentation: Create user guide
- [ ] Deploy to staging
- [ ] QA testing on staging
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Gather user feedback

---

## Implementation Notes

### Backend Considerations

1. **Firestore Indexes Required**:
```json
{
  "collectionGroup": "warnings",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "reviewFollowUp.status", "order": "ASCENDING" },
    { "fieldPath": "reviewFollowUp.reviewDate", "order": "ASCENDING" }
  ]
}
```

2. **Security Rules**:
```javascript
// Firestore rules for reviews
match /organizations/{orgId}/warnings/{warningId} {
  // HR can read/write reviews
  allow read, write: if isHRManager(orgId);

  // HOD can read reviews for their employees only
  allow read: if isHODManager(orgId) &&
                 warningBelongsToHODDepartment(warningId, request.auth.uid);

  // Manager who issued warning can read reviews
  allow read: if resource.data.issuedBy == request.auth.uid;
}
```

3. **Performance Optimization**:
- Cache review metrics in dashboard hook
- Paginate review dashboard (50 per page)
- Lazy load review details modal
- Debounce search/filter inputs

### Frontend Considerations

1. **State Management**:
- Use existing `useDashboardData` hook for metrics
- Create new `useReviewFollowUp` hook for review operations
- Cache review data with `CacheService`

2. **Accessibility**:
- ARIA labels for review status badges
- Keyboard navigation in review modal
- Screen reader announcements for status changes

3. **Mobile Optimization**:
- Responsive review dashboard (card view on mobile)
- Touch-friendly review modal
- Condensed metrics card on small screens

### Testing Strategy

1. **Unit Tests**:
- State machine transitions
- Auto-satisfaction calculation
- Notification triggers
- Edge case handlers

2. **Integration Tests**:
- API endpoints
- Firestore queries
- Cloud function execution
- Notification delivery

3. **E2E Tests**:
- Complete review workflow
- Auto-satisfaction trigger
- Dashboard metrics update
- PDF generation with review clause

---

## Success Metrics

### System Performance
- Review cron job executes successfully 99.9% of time
- Average review completion time < 5 minutes
- Zero data loss incidents
- < 100ms dashboard load time for review metrics

### User Adoption
- 80%+ of reviews completed before grace period
- < 10% auto-satisfactions (indicates HR is actively reviewing)
- 90%+ HR user satisfaction with review workflow
- Average 3-5 reviews completed per HR user per week

### Legal Compliance
- 100% audit trail coverage
- Zero disputed auto-satisfactions
- Clear documentation for all review decisions
- PDF clause present on 100% of warnings with review dates

---

## Future Enhancements (Post-MVP)

1. **Bulk Review Operations**:
   - Batch "Mark as Satisfactory" for multiple employees
   - Consolidated HOD call for multiple reviews
   - Bulk export of review outcomes

2. **Review Templates**:
   - Pre-defined HOD feedback templates
   - Common follow-up action templates
   - Quick review shortcuts

3. **Analytics Dashboard**:
   - Review completion rates over time
   - Auto-satisfaction percentage trends
   - Average review completion time
   - Most common follow-up actions

4. **Integration with HR Meetings**:
   - Auto-schedule follow-up meeting from review
   - Link review outcome to meeting agenda
   - Track meeting outcomes in review system

5. **Employee Self-Service**:
   - Allow employees to view their review status
   - Allow employees to self-report progress on commitments
   - Allow employees to request early review if improved

6. **Advanced Notifications**:
   - SMS notifications for overdue reviews
   - WhatsApp integration
   - Slack/Teams bot notifications
   - Custom notification schedules per organization

---

## Conclusion

This comprehensive design provides a complete blueprint for implementing the Review Follow-Up System. The system balances automation (auto-satisfaction) with HR control (manual review), ensuring legal compliance while reducing administrative burden.

**Key Success Factors**:
1. Clear state machine prevents ambiguity
2. Auto-satisfaction reduces HR workload
3. Full audit trail ensures compliance
4. Progressive notifications keep HR informed
5. Dashboard integration makes reviews discoverable
6. PDF clause sets clear expectations

**Next Steps**:
1. Review design with stakeholders
2. Prioritize features (MVP vs. Future)
3. Begin Phase 1 implementation (Data Models & Backend)
4. Set up staging environment for testing
5. Schedule weekly progress reviews

---

**End of Document**
