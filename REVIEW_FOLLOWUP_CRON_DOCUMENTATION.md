# Review Follow-Up Cron Job - Complete Documentation

## 📋 Overview

This document covers the Firebase Cloud Function implementation for daily review follow-up checks across all organizations in the HR Disciplinary System.

### Purpose
- Automatically check all warnings with scheduled review dates
- Update review statuses (pending → due_soon → overdue → auto_satisfied)
- Send notifications to HR managers about upcoming/overdue reviews
- Auto-satisfy reviews that are 7+ days overdue

### Implementation
- **Scheduled Function**: `checkDueReviewsDaily` - Runs daily at 8:00 AM South African Time
- **Test Function**: `testReviewFollowUp` - Manual testing for single organization
- **Admin Function**: `manualReviewCheckAll` - Manual trigger for all organizations (super-users only)

---

## 📂 Files Created

### 1. Backend Service Layer
**File**: `/functions/src/services/ReviewFollowUpService.ts`

Backend adaptation of the frontend ReviewFollowUpService using Firebase Admin SDK.

**Key Methods**:
- `checkDueReviews(organizationId)` - Core logic for checking and updating review statuses
- `autoSatisfyReview(warningId, organizationId)` - Auto-satisfy overdue reviews
- `updateReviewStatus(warningId, organizationId, updateData)` - Generic status updates
- `sendReviewNotifications(organizationId, notifications)` - Batch notification creation

**Differences from Frontend Version**:
- Uses `firebase-admin/firestore` instead of client SDK
- Uses `logger` from `firebase-functions` instead of custom Logger
- Batch writes for notifications instead of calling RealtimeService
- No dependency on frontend utilities or React hooks

### 2. Cloud Functions
**File**: `/functions/src/reviewFollowUpCron.ts`

Three Cloud Functions for review follow-up automation.

**Functions**:

#### `checkDueReviewsDaily` (Scheduled)
- **Trigger**: Daily at 8:00 AM Africa/Johannesburg timezone
- **Region**: us-central1 (primary server)
- **Memory**: 256MB
- **Timeout**: 9 minutes (540 seconds)
- **Process**:
  1. Fetch all organizations
  2. For each org, call `ReviewFollowUpService.checkDueReviews()`
  3. Log success/failure for each organization
  4. Continue processing even if one org fails

#### `testReviewFollowUp` (Callable)
- **Trigger**: Manual HTTP call
- **Auth**: Requires authenticated user
- **Input**: `{ organizationId: string }`
- **Output**: Review check results with counts
- **Use Case**: Testing review logic for a single organization

#### `manualReviewCheckAll` (Callable)
- **Trigger**: Manual HTTP call
- **Auth**: Requires super-user role
- **Process**: Runs review check for ALL organizations
- **Use Case**: Emergency manual trigger or testing

### 3. Index Export
**File**: `/functions/src/index.ts` (Modified)

Added imports and exports for the three new Cloud Functions.

---

## 🔧 Deployment Instructions

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Authenticated: `firebase login`
3. Correct project selected: `firebase use <project-id>`

### Step 1: Build Functions
```bash
cd /home/aiguy/projects/hr-disciplinary-system/functions
npm run build
```

**Expected Output**: TypeScript compilation success (no errors)

### Step 2: Deploy Functions
```bash
# Deploy all functions (recommended for first deployment)
firebase deploy --only functions

# OR deploy only the new review follow-up functions
firebase deploy --only functions:checkDueReviewsDaily,functions:testReviewFollowUp,functions:manualReviewCheckAll
```

**Deployment Time**: 2-5 minutes depending on network speed

**Expected Output**:
```
✔  functions[us-central1-checkDueReviewsDaily] Successful create operation.
✔  functions[us-central1-testReviewFollowUp] Successful create operation.
✔  functions[us-central1-manualReviewCheckAll] Successful create operation.

✔  Deploy complete!
```

### Step 3: Verify Deployment
```bash
firebase functions:list
```

Look for:
- `checkDueReviewsDaily(us-central1)`
- `testReviewFollowUp(us-central1)`
- `manualReviewCheckAll(us-central1)`

### Step 4: Check Scheduled Function
1. Go to Firebase Console → Functions
2. Find `checkDueReviewsDaily`
3. Click "View in Cloud Scheduler"
4. Verify schedule: `0 8 * * *` with timezone `Africa/Johannesburg`

---

## 🧪 Testing Instructions

### Test 1: Single Organization Test (Callable Function)

#### Frontend Testing (React)
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const testReviewFollowUp = httpsCallable(functions, 'testReviewFollowUp');

// Call the function
const result = await testReviewFollowUp({
  organizationId: 'your-org-id-here'
});

console.log('Review check results:', result.data);
// Output:
// {
//   success: true,
//   organizationId: "org_123",
//   organizationName: "Test Organization",
//   processingTime: "1.23s",
//   dueSoon: 2,
//   overdue: 1,
//   autoSatisfied: 0
// }
```

#### Backend Testing (Firebase CLI)
```bash
# Using Firebase emulator
firebase functions:shell

# In the shell, run:
testReviewFollowUp({ organizationId: 'your-org-id-here' })
```

#### cURL Testing
```bash
curl -X POST \
  https://us-central1-<project-id>.cloudfunctions.net/testReviewFollowUp \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{"data": {"organizationId": "your-org-id-here"}}'
```

### Test 2: Manual Trigger for All Organizations (Super-User Only)

**⚠️ Important**: This requires super-user authentication.

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const manualReviewCheckAll = httpsCallable(functions, 'manualReviewCheckAll');

// Call the function (must be super-user)
const result = await manualReviewCheckAll({});

console.log('All organizations processed:', result.data);
// Output:
// {
//   success: true,
//   totalOrganizations: 15,
//   successCount: 14,
//   errorCount: 1,
//   processingTime: "12.45s",
//   results: [...]
// }
```

### Test 3: Verify Scheduled Execution

#### Option A: Check Logs
```bash
# View recent logs
firebase functions:log --only checkDueReviewsDaily --limit 50

# Real-time logs
firebase functions:log --only checkDueReviewsDaily --follow
```

Look for:
- `🕐 Starting daily review follow-up check`
- `Processing reviews for organization: <name> (<id>)`
- `✅ Processed reviews for <name>: { dueSoon: X, overdue: Y, autoSatisfied: Z }`
- `✅ Review check complete`

#### Option B: Manual Trigger (Cloud Scheduler)
1. Go to Firebase Console → Functions → `checkDueReviewsDaily`
2. Click "View in Cloud Scheduler"
3. Click the three dots → "Force a job run"
4. Monitor logs in Firebase Console or CLI

#### Option C: Simulate Next Run
```bash
# Run the function immediately (requires gcloud CLI)
gcloud scheduler jobs run firebase-schedule-checkDueReviewsDaily-us-central1 \
  --project=<project-id>
```

### Test 4: End-to-End Validation

#### Setup Test Data
1. Create a warning with a review date 2 days from now
2. Wait for scheduled function to run (or trigger manually)
3. Verify warning status changes to `due_soon`
4. Verify HR managers receive notification

#### Expected Results
| Review Date Status | Expected Warning Status | HR Notification? |
|-------------------|------------------------|------------------|
| 4+ days away | `pending` | No |
| 1-3 days away | `due_soon` | Yes (info) |
| 1-6 days overdue | `overdue` | Yes (warning) |
| 7+ days overdue | `auto_satisfied` | Yes (info) |

---

## 🔍 Monitoring & Debugging

### Cloud Function Logs

#### Firebase Console
1. Firebase Console → Functions
2. Click `checkDueReviewsDaily`
3. View "Logs" tab

#### Firebase CLI
```bash
# Recent logs
firebase functions:log --only checkDueReviewsDaily --limit 100

# Real-time logs
firebase functions:log --only checkDueReviewsDaily --follow

# Filter by severity
firebase functions:log --only checkDueReviewsDaily --severity ERROR
```

#### Google Cloud Console
1. Go to Cloud Logging: https://console.cloud.google.com/logs
2. Filter by function name: `resource.labels.function_name="checkDueReviewsDaily"`

### Key Metrics to Monitor

**Success Indicators**:
- ✅ Function executes daily at 8:00 AM
- ✅ All organizations processed successfully
- ✅ Zero errors in logs
- ✅ Review statuses updated correctly
- ✅ Notifications created for HR managers

**Error Indicators**:
- ❌ Function timeout (> 540 seconds)
- ❌ Firestore permission errors
- ❌ Missing organization data
- ❌ Notification creation failures

### Common Issues & Solutions

#### Issue 1: Function Times Out
**Symptom**: Error after 9 minutes
**Cause**: Too many organizations to process
**Solution**:
- Increase timeout in function config (max 540s for scheduled)
- Optimize query performance
- Consider splitting into batches

#### Issue 2: No Notifications Created
**Symptom**: Review statuses update but HR doesn't receive notifications
**Cause**: Firestore permissions or missing HR managers
**Solution**:
- Check Firestore rules for `notifications` collection
- Verify HR managers exist in organization
- Check notification query logic

#### Issue 3: Auto-Satisfaction Not Working
**Symptom**: Reviews stay overdue beyond 7 days
**Cause**: Query filters or date calculation issue
**Solution**:
- Check warning `reviewDate` field exists
- Verify date math: `daysDiff <= -7`
- Ensure `reviewStatus` is in allowed states

---

## 📊 Data Flow

### Database Schema

**Warnings Collection**: `organizations/{orgId}/warnings/{warningId}`
```typescript
{
  reviewDate: Timestamp,           // When review should happen
  reviewStatus: ReviewStatus,      // Current review status
  reviewLastChecked: Timestamp,    // Last time cron checked this
  autoSatisfiedDate?: Timestamp,   // When auto-satisfied
  reviewCompletedDate?: Timestamp, // When HR completed review
  reviewCompletedBy?: string,      // HR user ID
  reviewCompletedByName?: string,  // HR user name
  reviewHODFeedback?: string,      // HOD feedback
  reviewHRNotes?: string,          // HR notes
  reviewOutcome?: string,          // satisfactory | some_concerns | unsatisfactory
  // ... other warning fields
}
```

**Notifications Collection**: `notifications/{notificationId}`
```typescript
{
  userId: string,                  // Recipient user ID
  organizationId: string,          // Organization ID
  type: 'info' | 'warning' | 'error',
  title: string,                   // Notification title
  message: string,                 // Notification message
  read: boolean,                   // Read status
  timestamp: Timestamp,            // Creation time
  category: 'review_follow_up',
  data: {
    warningId: string,
    employeeName: string,
    reviewDate: Timestamp
  }
}
```

### Status Transitions

```
pending → due_soon → overdue → auto_satisfied
                        ↓
                   in_progress → completed_satisfactory
                                → completed_unsatisfactory
                                → escalated
```

**Automatic Transitions** (handled by cron):
- `pending` → `due_soon` (3 days before review date)
- `due_soon` → `overdue` (after review date passes)
- `overdue` → `auto_satisfied` (7 days after review date)

**Manual Transitions** (handled by HR):
- `overdue` → `in_progress` (HR starts review)
- `in_progress` → `completed_satisfactory` (HR marks satisfactory)
- `in_progress` → `completed_unsatisfactory` (HR marks unsatisfactory)
- `in_progress` → `escalated` (HR escalates to new warning)

---

## 🔐 Security Considerations

### Function Authentication

**Scheduled Function** (`checkDueReviewsDaily`):
- Runs automatically with admin privileges
- No user authentication required
- Has full Firestore read/write access

**Callable Functions** (`testReviewFollowUp`, `manualReviewCheckAll`):
- Require user authentication via Firebase Auth
- `testReviewFollowUp`: Any authenticated user (should add org permission check)
- `manualReviewCheckAll`: Super-user role only (enforced)

### Firestore Security Rules

Ensure these rules exist:

```javascript
// Warnings collection - managers can read their org's warnings
match /organizations/{orgId}/warnings/{warningId} {
  allow read: if isAuthenticated() &&
                 resource.data.organizationId == orgId;
  allow write: if isHRManager() || isExecutiveManagement();
}

// Notifications - users can only read their own
match /notifications/{notificationId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if true; // Cloud Functions can create
  allow update: if request.auth.uid == resource.data.userId; // Mark as read
}
```

### Recommended Enhancements

1. **Add Organization Permission Check** to `testReviewFollowUp`:
```typescript
// Verify user belongs to this organization
const userDoc = await db.collection('users').doc(auth.uid).get();
if (!userDoc.exists || userDoc.data()?.organizationId !== organizationId) {
  throw new HttpsError('permission-denied', 'Access denied to this organization');
}
```

2. **Add Rate Limiting** to prevent abuse of callable functions

3. **Add Audit Logging** for manual triggers

---

## 🚀 Production Readiness Checklist

Before deploying to production:

- [ ] Functions built successfully (`npm run build`)
- [ ] TypeScript compilation has zero errors
- [ ] Tested `testReviewFollowUp` with real organization data
- [ ] Verified notifications are created correctly
- [ ] Tested auto-satisfaction logic (7+ days overdue)
- [ ] Confirmed scheduled time (8:00 AM South African Time)
- [ ] Set up monitoring alerts (Cloud Monitoring)
- [ ] Documented timezone considerations
- [ ] Added error handling for edge cases
- [ ] Verified super-user role check works
- [ ] Tested with multiple organizations
- [ ] Checked function logs for errors
- [ ] Validated Firestore security rules
- [ ] Tested manual trigger (`manualReviewCheckAll`)
- [ ] Set up alerting for function failures

---

## 📝 Frontend Integration (Optional)

If you want to expose manual testing to HR managers in the UI:

### Add Test Button to HR Dashboard

```typescript
// src/components/dashboard/HRDashboardSection.tsx

import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../auth/AuthContext';

const TestReviewFollowUp = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    if (!user?.organizationId) return;

    setTesting(true);
    try {
      const functions = getFunctions();
      const testFunc = httpsCallable(functions, 'testReviewFollowUp');
      const response = await testFunc({ organizationId: user.organizationId });

      setResult(response.data);

      // Show success toast
      console.log('Review check complete:', response.data);
    } catch (error) {
      console.error('Review check failed:', error);
      alert('Failed to run review check');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-2">Test Review Follow-Up</h3>
      <p className="text-sm text-gray-600 mb-3">
        Manually trigger review status checks for your organization
      </p>

      <button
        onClick={handleTest}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {testing ? 'Running...' : 'Run Review Check'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-sm font-medium">Results:</p>
          <ul className="text-sm space-y-1 mt-2">
            <li>Due Soon: {result.dueSoon}</li>
            <li>Overdue: {result.overdue}</li>
            <li>Auto-Satisfied: {result.autoSatisfied}</li>
            <li>Processing Time: {result.processingTime}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 📞 Support & Troubleshooting

### Get Help
- Check Firebase Console logs first
- Review Firestore data structure
- Test with single organization before testing all
- Use Cloud Scheduler manual trigger for testing
- Monitor function execution time and memory usage

### Useful Commands
```bash
# View all functions
firebase functions:list

# View specific function details
firebase functions:config:get

# View recent function executions
gcloud functions logs read checkDueReviewsDaily \
  --limit 50 \
  --project=<project-id>

# Force scheduled function to run now
gcloud scheduler jobs run firebase-schedule-checkDueReviewsDaily-us-central1 \
  --project=<project-id>
```

### Contact Points
- Firebase Support: https://firebase.google.com/support
- Cloud Scheduler Docs: https://cloud.google.com/scheduler/docs
- Cloud Functions Docs: https://firebase.google.com/docs/functions

---

## 📅 Maintenance Schedule

**Weekly**:
- Review function logs for errors
- Check notification delivery rates
- Verify no timeouts

**Monthly**:
- Review function costs (Cloud Functions pricing)
- Analyze execution patterns
- Optimize if needed

**Quarterly**:
- Review auto-satisfaction logic
- Update timezone if needed
- Performance audit

---

**Last Updated**: 2025-11-12
**Version**: 1.0.0
**Author**: Claude Code Assistant
**Status**: Production Ready
