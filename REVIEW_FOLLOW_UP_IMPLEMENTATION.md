# Review Follow-Up System Implementation

## Overview

This document describes the review tracking and auto-satisfaction system for warnings with improvement commitments. The system automatically manages review deadlines, sends notifications, and auto-satisfies reviews when HR doesn't take action within 7 days of the review date.

---

## Files Modified/Created

### 1. **Updated: `/frontend/src/types/core.ts`**
Added comprehensive review tracking fields to the `Warning` interface:

```typescript
// Review Follow-Up Tracking Fields
reviewStatus?: 'pending' | 'due_soon' | 'overdue' | 'in_progress' |
               'completed_satisfactory' | 'completed_unsatisfactory' |
               'auto_satisfied' | 'escalated';
reviewCompletedDate?: any;
reviewCompletedBy?: string;
reviewCompletedByName?: string;
reviewHODFeedback?: string;
reviewHRNotes?: string;
reviewOutcome?: 'satisfactory' | 'some_concerns' | 'unsatisfactory';
reviewNextSteps?: string;
autoSatisfiedDate?: any;
escalatedToWarningId?: string;
reviewLastChecked?: any;
```

**Status Lifecycle:**
- `pending` → Review date is in the future
- `due_soon` → Review date within 3 days
- `overdue` → Review date passed, within 7-day grace period
- `in_progress` → HR has started the review
- `completed_satisfactory` → Employee met commitments
- `completed_unsatisfactory` → Employee did not meet commitments (requires escalation)
- `auto_satisfied` → Automatically marked satisfactory after 7 days overdue
- `escalated` → Unsatisfactory review resulted in new warning

---

### 2. **Updated: `/frontend/src/services/WarningService.ts`**
Added review tracking methods:

#### **New Methods:**

##### `getWarningsNeedingReview(organizationId: string): Promise<Warning[]>`
- Fetches all warnings with review status: `due_soon`, `overdue`, or `in_progress`
- Ordered by review date (ascending)
- Properly converts Firestore Timestamps to JavaScript Dates

##### `updateReviewStatus(warningId, organizationId, statusData): Promise<void>`
- Generic method to update review tracking fields
- Handles Date to Timestamp conversion
- Updates `updatedAt` timestamp automatically

##### `markReviewSatisfactory(warningId, organizationId, hrUserId, hrUserName, hrNotes?): Promise<void>`
- Quick method for HR to mark review as satisfactory
- Sets status to `completed_satisfactory`
- Records HR user details and completion date

##### `markReviewUnsatisfactory(warningId, organizationId, hrUserId, hrUserName, feedback, nextSteps): Promise<void>`
- Marks review as unsatisfactory
- Requires feedback and next steps
- Sets status to `completed_unsatisfactory`

##### `getReviewStatistics(organizationId: string): Promise<ReviewStats>`
- Returns counts of warnings by review status
- Useful for dashboard widgets
- Statistics include: pending, dueSoon, overdue, inProgress, completedSatisfactory, completedUnsatisfactory, autoSatisfied, escalated

---

### 3. **Created: `/frontend/src/services/ReviewFollowUpService.ts`**
New service dedicated to review automation and tracking.

#### **Key Methods:**

##### `checkDueReviews(organizationId: string): Promise<{dueSoon, overdue, autoSatisfied}>`
**Purpose:** Daily cron job to check review statuses and send notifications

**Logic:**
1. Queries all warnings with `reviewDate` set and status in `['pending', 'due_soon', 'overdue', null]`
2. For each warning, calculates days until/past review date
3. Updates status:
   - **7+ days overdue** → Auto-satisfy (call `autoSatisfyReview()`)
   - **1-6 days overdue** → Mark as `overdue`
   - **0-3 days until due** → Mark as `due_soon`
   - **4+ days until due** → Keep as `pending`
4. Sends bulk notifications to HR managers
5. Returns counts for monitoring

**Notification Types:**
- `review_due_soon` - Warning review due in 3 days
- `review_overdue` - Warning review is X days overdue
- `review_auto_satisfied` - Warning was automatically marked satisfactory

---

##### `autoSatisfyOverdueReviews(organizationId: string): Promise<string[]>`
**Purpose:** Batch auto-satisfy all reviews 7+ days overdue

**Logic:**
1. Queries warnings where `reviewDate < 7 days ago` and status is `['pending', 'due_soon', 'overdue']`
2. For each warning, calls `autoSatisfyReview()`
3. Returns array of auto-satisfied warning IDs

---

##### `autoSatisfyReview(warningId, organizationId): Promise<void>` (private)
**Purpose:** Auto-satisfy a single review

**Updates:**
```typescript
{
  reviewStatus: 'auto_satisfied',
  autoSatisfiedDate: Timestamp.now(),
  reviewHRNotes: 'Automatically marked satisfactory after 7 days with no HR action',
  reviewOutcome: 'satisfactory',
  reviewLastChecked: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

---

##### `completeReviewSatisfactory(warningId, organizationId, hrUserId, hrUserName, data): Promise<void>`
**Purpose:** HR completes review as satisfactory

**Parameters:**
- `data.hodFeedback` (optional) - Feedback from employee's direct manager
- `data.hrNotes` (optional) - HR manager's notes
- `data.outcome` (optional) - Either `'satisfactory'` or `'some_concerns'`

---

##### `completeReviewUnsatisfactory(warningId, organizationId, hrUserId, hrUserName, data): Promise<void>`
**Purpose:** HR completes review as unsatisfactory

**Parameters:**
- `data.hodFeedback` (optional) - Feedback from HOD
- `data.hrNotes` (required) - HR manager's assessment
- `data.nextSteps` (required) - Action taken (e.g., "Escalated to Final Warning")

---

##### `escalateReview(warningId, organizationId, hrUserId, hrUserName, escalationData): Promise<string>`
**Purpose:** Escalate unsatisfactory review to new warning

**Note:** This is a placeholder - the actual new warning creation should be done by `WarningService.saveWarning()` first, then this method links the two warnings together.

**Parameters:**
- `escalationData.originalWarningId`
- `escalationData.employeeId`
- `escalationData.categoryId`
- `escalationData.newLevel` - Escalated warning level
- `escalationData.reason` - Why escalation occurred
- `escalationData.hodFeedback` (optional)
- `escalationData.hrNotes` (optional)

**Returns:** New warning ID

---

##### `getWarningsNeedingReview(organizationId: string): Promise<Warning[]>`
**Purpose:** Fetch warnings for HR review dashboard

**Query:**
- `reviewDate != null`
- `reviewStatus in ['due_soon', 'overdue', 'in_progress']`
- Ordered by `reviewDate` ascending

---

##### `getReviewSummary(organizationId: string): Promise<ReviewSummaryData>`
**Purpose:** Dashboard widget data

**Returns:**
```typescript
{
  dueSoonCount: number;
  overdueCount: number;
  inProgressCount: number;
  upcomingReviews: ReviewSummary[]; // Next 10 reviews
}
```

**ReviewSummary structure:**
```typescript
{
  warningId: string;
  employeeId: string;
  employeeName: string;
  reviewDate: Date;
  currentStatus: ReviewStatus;
  daysUntilDue: number;
  daysOverdue: number;
}
```

---

##### `markReviewInProgress(warningId, organizationId, hrUserId): Promise<void>`
**Purpose:** Mark review as started when HR opens review modal

---

##### `sendReviewNotifications(organizationId, notifications): Promise<void>` (private)
**Purpose:** Send bulk notifications to HR managers

**Logic:**
1. Fetches all users with role `['hr-manager', 'executive-management']`
2. For each notification, calls `createBulkNotification()` from `RealtimeService`
3. Notification categories: `review_follow_up`

---

## Integration Guide

### Cloud Function (Recommended)

Create a scheduled Cloud Function to run daily:

```typescript
// functions/src/scheduledReviewCheck.ts
import * as functions from 'firebase-functions';
import { ReviewFollowUpService } from './services/ReviewFollowUpService';

export const checkDueReviewsDaily = functions.pubsub
  .schedule('0 8 * * *') // Run at 8am daily
  .timeZone('Africa/Johannesburg')
  .onRun(async (context) => {
    const db = admin.firestore();

    // Get all organizations
    const orgsSnapshot = await db.collection('organizations').get();

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;

      try {
        const result = await ReviewFollowUpService.checkDueReviews(orgId);

        console.log(`✅ Review check complete for ${orgId}`, result);
      } catch (error) {
        console.error(`❌ Review check failed for ${orgId}`, error);
      }
    }

    return null;
  });
```

---

### Frontend Usage

#### 1. **HR Dashboard - Review Pending Widget**

```tsx
import { ReviewFollowUpService } from '../services/ReviewFollowUpService';

function ReviewPendingWidget() {
  const { organization } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      const data = await ReviewFollowUpService.getReviewSummary(organization.id);
      setSummary(data);
    }
    loadSummary();
  }, [organization.id]);

  if (!summary) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Review Follow-Ups</h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.dueSoonCount}</div>
          <div className="text-sm text-gray-600">Due Soon</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.overdueCount}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.inProgressCount}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Upcoming Reviews</h4>
        {summary.upcomingReviews.map(review => (
          <div key={review.warningId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm">{review.employeeName}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              review.daysOverdue > 0 ? 'bg-red-100 text-red-800' :
              review.daysUntilDue <= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {review.daysOverdue > 0
                ? `${review.daysOverdue}d overdue`
                : `Due in ${review.daysUntilDue}d`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

#### 2. **Review Completion Modal**

```tsx
import { ReviewFollowUpService } from '../services/ReviewFollowUpService';

function ReviewCompletionModal({ warning, onClose }) {
  const { user, organization } = useAuth();
  const [outcome, setOutcome] = useState<'satisfactory' | 'unsatisfactory'>('satisfactory');
  const [hodFeedback, setHodFeedback] = useState('');
  const [hrNotes, setHrNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const handleSubmit = async () => {
    try {
      if (outcome === 'satisfactory') {
        await ReviewFollowUpService.completeReviewSatisfactory(
          warning.id,
          organization.id,
          user.uid,
          `${user.firstName} ${user.lastName}`,
          {
            hodFeedback,
            hrNotes,
            outcome: 'satisfactory'
          }
        );
        toast.success('Review marked as satisfactory');
      } else {
        await ReviewFollowUpService.completeReviewUnsatisfactory(
          warning.id,
          organization.id,
          user.uid,
          `${user.firstName} ${user.lastName}`,
          {
            hodFeedback,
            hrNotes,
            nextSteps
          }
        );
        toast.success('Review marked as unsatisfactory');
      }

      onClose();
    } catch (error) {
      console.error('Failed to complete review:', error);
      toast.error('Failed to complete review');
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>Complete Review Follow-Up</h2>

      <div className="mb-4">
        <label>Outcome</label>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value as any)}>
          <option value="satisfactory">Satisfactory</option>
          <option value="unsatisfactory">Unsatisfactory</option>
        </select>
      </div>

      <div className="mb-4">
        <label>HOD Feedback (optional)</label>
        <textarea
          value={hodFeedback}
          onChange={(e) => setHodFeedback(e.target.value)}
          placeholder="Feedback from employee's direct manager..."
        />
      </div>

      <div className="mb-4">
        <label>HR Notes</label>
        <textarea
          value={hrNotes}
          onChange={(e) => setHrNotes(e.target.value)}
          placeholder="Your assessment and observations..."
          required
        />
      </div>

      {outcome === 'unsatisfactory' && (
        <div className="mb-4">
          <label>Next Steps (required)</label>
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder="What action will be taken? (e.g., Escalated to Final Warning)"
            required
          />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSubmit} disabled={!hrNotes || (outcome === 'unsatisfactory' && !nextSteps)}>
          Complete Review
        </button>
      </div>
    </Modal>
  );
}
```

---

#### 3. **Review List Component**

```tsx
import { WarningService } from '../services/WarningService';

function ReviewListComponent() {
  const { organization } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    async function loadWarnings() {
      const data = await WarningService.getWarningsNeedingReview(organization.id);
      setWarnings(data);
    }
    loadWarnings();
  }, [organization.id]);

  return (
    <div>
      <h2>Warnings Needing Review</h2>

      {warnings.length === 0 ? (
        <p>No reviews pending</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Review Date</th>
              <th>Status</th>
              <th>Days Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {warnings.map(warning => {
              const reviewDate = new Date(warning.reviewDate);
              const today = new Date();
              const daysOverdue = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <tr key={warning.id}>
                  <td>{warning.employeeName}</td>
                  <td>{reviewDate.toLocaleDateString()}</td>
                  <td>{warning.reviewStatus}</td>
                  <td className={daysOverdue > 0 ? 'text-red-600' : ''}>
                    {daysOverdue > 0 ? `${daysOverdue} days` : '-'}
                  </td>
                  <td>
                    <button onClick={() => openReviewModal(warning)}>
                      Complete Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## Firestore Indexes Required

The following composite indexes are required for efficient queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "warnings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "reviewDate", "order": "ASCENDING" },
        { "fieldPath": "reviewStatus", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "warnings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "reviewStatus", "order": "ASCENDING" },
        { "fieldPath": "reviewDate", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Important:** Firebase will provide the exact index creation links via error messages when running queries for the first time.

---

## Firestore Security Rules

Add these rules to `/config/firestore.rules`:

```javascript
// Allow HR managers to read/write review status
match /organizations/{orgId}/warnings/{warningId} {
  allow read: if isAuthenticated() && belongsToOrg(orgId);

  allow update: if isAuthenticated()
    && belongsToOrg(orgId)
    && (isHRManager() || isExecutiveManagement())
    && onlyUpdatingFields([
      'reviewStatus',
      'reviewCompletedDate',
      'reviewCompletedBy',
      'reviewCompletedByName',
      'reviewHODFeedback',
      'reviewHRNotes',
      'reviewOutcome',
      'reviewNextSteps',
      'autoSatisfiedDate',
      'escalatedToWarningId',
      'reviewLastChecked',
      'updatedAt'
    ]);
}
```

---

## Testing Checklist

### Unit Tests
- [ ] `ReviewFollowUpService.checkDueReviews()` - Status updates work correctly
- [ ] `ReviewFollowUpService.autoSatisfyOverdueReviews()` - 7-day threshold
- [ ] `WarningService.getWarningsNeedingReview()` - Filters correctly
- [ ] `WarningService.markReviewSatisfactory()` - Status update persists
- [ ] `WarningService.markReviewUnsatisfactory()` - Requires feedback
- [ ] Date to Timestamp conversions work correctly
- [ ] Notifications sent to correct users

### Integration Tests
- [ ] Create warning with `reviewDate` → status starts as `pending`
- [ ] 3 days before review → status updates to `due_soon`
- [ ] 1 day after review → status updates to `overdue`
- [ ] 7 days after review → status updates to `auto_satisfied`
- [ ] HR completes review → status updates correctly
- [ ] Escalation creates new warning and links properly

### Manual Testing
- [ ] HR Dashboard shows review statistics widget
- [ ] Review list shows correct warnings
- [ ] Review completion modal works
- [ ] Notifications appear for HR managers
- [ ] Auto-satisfaction works when cron runs
- [ ] Review dates convert correctly between UI and database

---

## Performance Considerations

1. **Batch Processing**: `checkDueReviews()` processes all warnings in a single query, not per-document
2. **Firestore Composite Indexes**: Required for efficient filtering by `reviewDate` and `reviewStatus`
3. **Notification Batching**: Uses `createBulkNotification()` to send multiple notifications efficiently
4. **Pagination**: If organization has 1000+ warnings with review dates, consider adding pagination to `getWarningsNeedingReview()`

---

## Future Enhancements

1. **Email Notifications**: Send email reminders to HR managers for overdue reviews
2. **Review Reminders**: Send reminder 1 day before review date
3. **HOD Review Input**: Allow HOD managers to submit feedback before HR review
4. **Review History**: Track all status changes for audit trail
5. **Bulk Review Completion**: Allow HR to complete multiple reviews at once
6. **Review Templates**: Pre-fill HR notes based on common scenarios
7. **Auto-Escalation**: Automatically escalate unsatisfactory reviews to next warning level
8. **Mobile Notifications**: Push notifications via Firebase Cloud Messaging

---

## Troubleshooting

### Issue: Reviews not auto-satisfying after 7 days
**Solution:** Check if Cloud Function is running daily. Verify cron schedule and logs.

### Issue: Firestore permission denied when updating review status
**Solution:** Ensure user has `hr-manager` or `executive-management` role. Check security rules.

### Issue: Review date not converting correctly
**Solution:** Ensure frontend converts `reviewDate` to `Date` object before passing to service methods. Check Timestamp conversion logic.

### Issue: Notifications not sending
**Solution:** Verify HR managers exist in organization. Check `RealtimeService.createBulkNotification()` implementation.

### Issue: Query fails with "Missing index" error
**Solution:** Click the Firebase Console link in the error message to create the required composite index.

---

## Summary

This implementation provides a complete review follow-up system with:

✅ **11 new fields** added to Warning interface
✅ **ReviewFollowUpService** with 10 methods for automation
✅ **5 new WarningService methods** for review tracking
✅ **Auto-satisfaction** after 7 days of inaction
✅ **Notifications** for HR managers
✅ **Dashboard widgets** for review monitoring
✅ **Complete audit trail** of review process

The system is designed to:
- **Reduce HR workload** by auto-satisfying reviews when employees are progressing
- **Prevent missed reviews** through proactive notifications
- **Maintain legal compliance** with full audit trail
- **Support escalation** when employees don't meet commitments
- **Scale efficiently** with composite Firestore indexes
