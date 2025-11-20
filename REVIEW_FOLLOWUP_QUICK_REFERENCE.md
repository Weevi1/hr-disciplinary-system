# Review Follow-Up System - Quick Reference
**TL;DR Design Summary**

---

## Core Concept

**Problem**: Warnings include review dates for follow-up, but no system to track them.

**Solution**: Automated review tracking with auto-satisfaction if HR doesn't follow up (indicates employee is performing adequately).

---

## State Machine (Simplified)

```
PENDING (>7 days away)
    ↓
DUE_SOON (7 days before)
    ↓
DUE (review date)
    ↓
OVERDUE (1-6 days late)
    ↓
    ├─→ AUTO_SATISFIED (7+ days late, no HR action)
    └─→ IN_PROGRESS (HR starts review)
            ↓
            ├─→ COMPLETED_SATISFACTORY (good progress)
            └─→ COMPLETED_UNSATISFACTORY (poor progress)
                    ↓
                    └─→ ESCALATED (new warning issued)
```

---

## Key Features

### 1. Auto-Satisfaction Logic
- **Grace Period**: 7 days after review date
- **Trigger**: No HR action within grace period
- **Result**: System marks review as satisfactory
- **Reasoning**: If HR didn't need to follow up, employee must be performing adequately
- **Notification**: HR gets info notification (not urgent)

### 2. Review Workflow
1. HR sees "Reviews Due" notification/card
2. HR opens ReviewFollowUpDashboard
3. HR clicks "Start Review" on warning
4. HR contacts HOD (phone/email/in-person)
5. HR records HOD feedback and progress assessment
6. HR marks as satisfactory/unsatisfactory
7. If unsatisfactory: Choose action (new warning, meeting, training)

### 3. Notifications
| When | Type | Message |
|------|------|---------|
| 7 days before | Info | "Review coming up for [Employee]" |
| Review date | Warning | "Review due today for [Employee]" |
| 1-3 days late | Error | "Review overdue for [Employee]" (daily) |
| 7 days late | Info | "Review auto-marked satisfactory for [Employee]" |

### 4. Dashboard Integration
- **Metric Card**: "Reviews Due" (dueSoon, dueToday, overdue counts)
- **Quick Action**: "Review Follow-Ups" button with badge
- **Top Banner**: Warning if reviews are overdue
- **New Tab**: "Reviews" tab in HR Dashboard

### 5. PDF Clause
Added to warning PDFs after "Improvement Commitments" section:

```
REVIEW DATE AND AUTO-SATISFACTION CLAUSE

This corrective action will be reviewed on [DATE].

If the scheduled review does not occur within 7 days after the
review date, your performance will be deemed satisfactory and
this corrective action will remain active until its natural
expiry date. This reflects our understanding that if no
follow-up was required, you have adequately addressed the
concerns raised.

Review Date: [DATE]
Grace Period: 7 days
Warning Expires: [DATE]
```

---

## TypeScript Interfaces (Core)

```typescript
export type ReviewFollowUpStatus =
  | 'pending' | 'due_soon' | 'due' | 'overdue'
  | 'auto_satisfied' | 'in_progress'
  | 'completed_satisfactory' | 'completed_unsatisfactory'
  | 'escalated';

export interface ReviewFollowUp {
  status: ReviewFollowUpStatus;
  reviewDate: Date;
  autoSatisfactionGracePeriod: number; // Default: 7

  // Auto-satisfaction
  autoSatisfiedAt?: Date;

  // Manual review
  reviewStartedAt?: Date;
  reviewCompletedAt?: Date;
  reviewCompletedBy?: string;

  // HOD feedback
  hodFeedback?: string;
  hodContactMethod?: 'phone' | 'email' | 'in-person' | 'teams';

  // Outcome
  outcome?: ReviewOutcome;

  // Audit trail
  auditLog: ReviewAuditEntry[];
}

export interface ReviewOutcome {
  result: 'satisfactory' | 'unsatisfactory' | 'partial_improvement';
  progressRating: 1 | 2 | 3 | 4 | 5;
  areasImproved: string[];
  areasNeedingWork: string[];
  reviewNotes: string;
  actionTaken: 'none' | 'new_warning' | 'meeting_scheduled' | 'escalated';
  newWarningId?: string;
}

// Add to Warning interface
export interface Warning {
  // ... existing fields ...
  reviewFollowUp?: ReviewFollowUp;
}
```

---

## Backend Implementation

### Daily Cron Job
```typescript
// Firebase Cloud Function
// Runs daily at 00:00 UTC

export const processReviewFollowUps = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(async () => {
    // 1. Query all overdue reviews
    // 2. Check if past grace period (7 days)
    // 3. Auto-satisfy if yes
    // 4. Send notifications
    // 5. Process status transitions (pending → due_soon → due → overdue)
  });
```

### Key Functions
- `autoSatisfyReview()` - Marks review as satisfied, adds audit log, sends notification
- `processStatusTransitions()` - Updates review statuses based on current date
- `sendReviewNotification()` - Creates notification record
- `calculateReviewMetrics()` - Dashboard metrics calculation

---

## Edge Cases Handled

1. **Employee Terminated**: Auto-complete review with note "Employee no longer employed"
2. **Warning Appealed**: Put review on hold until appeal resolved
3. **Warning Expires Before Review**: Allow review to proceed (historical tracking)
4. **Multiple Reviews Same Day**: Batch review UI, consolidated notifications
5. **HR User Unavailable**: Delegate to backup reviewers, extend grace period
6. **Auto-Satisfaction Disputed**: HOD can request re-open within 7 days
7. **System Downtime**: Catch-up logic processes missed transitions
8. **Partial Commitment Completion**: Track individual commitments, allow partial satisfaction

---

## Files to Create/Modify

### New Files
- `frontend/src/components/reviews/ReviewFollowUpDashboard.tsx`
- `frontend/src/components/reviews/ReviewModal.tsx`
- `frontend/src/components/reviews/ReviewMetricsCard.tsx`
- `functions/src/reviewFollowUpCron.ts`

### Modified Files
- `frontend/src/types/core.ts` (add ReviewFollowUp interfaces)
- `frontend/src/hooks/dashboard/useDashboardData.ts` (add review metrics)
- `frontend/src/components/dashboard/HRDashboardSection.tsx` (add metrics card)
- `frontend/src/services/PDFGenerationService.ts` (add review clause - v1.3.0)
- `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` (initialize reviewFollowUp)

---

## Implementation Timeline

**Week 1**: Backend (data models, cron job, API endpoints)
**Week 2**: UI components (dashboard, modal, metrics)
**Week 3**: PDF integration, warning wizard integration
**Week 4**: Edge cases, testing, deployment

**Total Estimate**: 4 weeks (1 developer)

---

## Success Metrics

- **< 10% auto-satisfactions** (indicates HR is actively reviewing)
- **80%+ reviews completed before grace period**
- **99.9%+ cron job reliability**
- **100% audit trail coverage**
- **< 100ms dashboard load time**

---

## Legal Compliance

✅ Full audit trail for all actions
✅ Clear PDF documentation of auto-satisfaction policy
✅ Employee acknowledgment of review process
✅ No ability to delete or modify historical reviews
✅ System timestamps for all status changes

---

## Next Steps

1. Review design with stakeholders
2. Confirm auto-satisfaction grace period (7 days OK?)
3. Decide on dashboard placement (tab vs. quick action)
4. Confirm notification frequency (daily reminders OK?)
5. Begin Phase 1 implementation

---

**For Full Details**: See `REVIEW_FOLLOWUP_SYSTEM_DESIGN.md`
