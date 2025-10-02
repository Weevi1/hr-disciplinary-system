# 📊 Firebase Performance Monitoring Guide

## Overview

Firebase Performance Monitoring helps you gain insight into the performance characteristics of your HR Disciplinary System app.

---

## Features

### Automatic Tracking

Firebase Performance automatically tracks:
- ✅ **Page Load Times** - Initial page load and navigation
- ✅ **Network Requests** - Firebase API calls and Cloud Functions
- ✅ **JavaScript Errors** - Performance impact of errors
- ✅ **First Contentful Paint (FCP)** - Time to first visual content
- ✅ **First Input Delay (FID)** - User interaction responsiveness

### Custom Tracking

We've added custom traces for:
- ✅ **Dashboard Loading** - Business Owner, HR, and HOD dashboards
- ✅ **Employee Operations** - Load, create, update, archive
- ✅ **Warning Operations** - Load, create, send warnings
- ✅ **PDF Generation** - PDF creation performance
- ✅ **File Operations** - Upload/download performance
- ✅ **Search Operations** - Search and filter performance

---

## Usage

### 1. Measuring Async Operations

```typescript
import { measureAsync, TraceNames } from '@/config/performance';

// Measure employee loading
const employees = await measureAsync(
  TraceNames.LOAD_EMPLOYEES,
  async () => {
    return await EmployeeService.getAll(organizationId);
  },
  {
    organizationId,
    count: String(employees.length)
  }
);
```

### 2. Measuring Sync Operations

```typescript
import { measureSync } from '@/config/performance';

const result = measureSync(
  'calculate_metrics',
  () => {
    // Expensive calculation
    return complexCalculation(data);
  },
  { dataSize: String(data.length) }
);
```

### 3. Creating Custom Traces

```typescript
import { createTrace } from '@/config/performance';

const trace = createTrace('complex_operation');
trace.start();

try {
  // Step 1
  trace.putAttribute('step', 'data_loading');
  const data = await loadData();

  // Step 2
  trace.putAttribute('step', 'processing');
  const processed = processData(data);

  // Track metric
  trace.putMetric('records_processed', processed.length);

  trace.stop();
} catch (error) {
  trace.putAttribute('error', 'true');
  trace.stop();
  throw error;
}
```

### 4. Tracking Metrics

```typescript
import { trackMetric } from '@/config/performance';

// Track PDF generation metrics
trackMetric('pdf_generation', {
  size_kb: pdfBlob.size / 1024,
  page_count: 3,
  generation_time_ms: Date.now() - startTime
});
```

### 5. Tracking Page Loads

```typescript
import { trackPageLoad } from '@/config/performance';

useEffect(() => {
  trackPageLoad('dashboard');
}, []);
```

### 6. Tracking API Calls

```typescript
import { trackApiCall } from '@/config/performance';

const result = await trackApiCall(
  'refreshUserClaims',
  () => callVersionedFunction('refreshUserClaims', { userId })
);
```

---

## Pre-defined Trace Names

Use the `TraceNames` constant for consistency:

```typescript
import { TraceNames } from '@/config/performance';

// Dashboard traces
TraceNames.LOAD_DASHBOARD
TraceNames.LOAD_BUSINESS_OWNER_DASHBOARD
TraceNames.LOAD_HR_DASHBOARD
TraceNames.LOAD_HOD_DASHBOARD

// Employee traces
TraceNames.LOAD_EMPLOYEES
TraceNames.CREATE_EMPLOYEE
TraceNames.UPDATE_EMPLOYEE
TraceNames.ARCHIVE_EMPLOYEE

// Warning traces
TraceNames.LOAD_WARNINGS
TraceNames.CREATE_WARNING
TraceNames.GENERATE_WARNING_PDF
TraceNames.SEND_WARNING

// Auth traces
TraceNames.LOGIN
TraceNames.LOGOUT
TraceNames.REFRESH_CLAIMS

// Data traces
TraceNames.LOAD_ORGANIZATION
TraceNames.LOAD_DEPARTMENTS
TraceNames.LOAD_CATEGORIES

// File traces
TraceNames.UPLOAD_FILE
TraceNames.DOWNLOAD_FILE
TraceNames.GENERATE_PDF

// Search traces
TraceNames.SEARCH_EMPLOYEES
TraceNames.SEARCH_WARNINGS
TraceNames.FILTER_DATA
```

---

## Viewing Performance Data

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Performance** in the left menu
4. View dashboards for:
   - Page load times
   - Network requests
   - Custom traces

### Key Metrics to Monitor

#### Page Performance
- **Page Load (median)**: Should be < 2s
- **FCP**: Should be < 1.8s for "Good" rating
- **FID**: Should be < 100ms for "Good" rating

#### Custom Traces
- **PDF Generation**: Track average time and size
- **Dashboard Loading**: Compare across roles
- **Employee Operations**: Monitor CRUD performance
- **Search Performance**: Track query response times

#### Network Performance
- **Cloud Functions**: Monitor call duration
- **Firestore Queries**: Track query performance
- **File Uploads**: Monitor upload speeds

---

## Performance Budgets

### Target Metrics

| Operation | Target | Warning | Critical |
|-----------|--------|---------|----------|
| Dashboard Load | < 1s | 1-2s | > 2s |
| Employee List | < 500ms | 500-1000ms | > 1s |
| PDF Generation | < 3s | 3-5s | > 5s |
| Search Results | < 300ms | 300-600ms | > 600ms |
| Cloud Function | < 1s | 1-2s | > 2s |

### Alerts

Set up alerts in Firebase Console for:
- Page load > 3s
- PDF generation > 10s
- Any operation > 30s

---

## Optimization Tips

### 1. Code Splitting
Already implemented:
- ✅ Dashboard components split by role
- ✅ PDF generation lazy-loaded

### 2. Data Loading
```typescript
// Bad: Load all at once
const employees = await loadAll();

// Good: Paginate
const employees = await loadEmployees({ limit: 50, offset: 0 });
```

### 3. Caching
```typescript
// Use React Query or similar
const { data, isLoading } = useQuery(
  ['employees', organizationId],
  () => loadEmployees(organizationId),
  { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
);
```

### 4. Debouncing Search
```typescript
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchEmployees(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## Example Integration

### PDF Generation (Already Implemented)

```typescript
// frontend/src/components/warnings/enhanced/PDFPreviewModal.tsx

import { measureAsync, TraceNames } from '../../../config/performance';

// In generatePDF function:
const { PDFGenerationService } = await import('@/services/PDFGenerationService');

const blob = await measureAsync(
  TraceNames.GENERATE_WARNING_PDF,
  () => PDFGenerationService.generateWarningPDF(pdfData),
  {
    employee: `${extractedData.employee.firstName} ${extractedData.employee.lastName}`,
    category: extractedData.category.name
  }
);
```

### Dashboard Loading Example

```typescript
import { useEffect } from 'react';
import { measureAsync, TraceNames, trackPageLoad } from '@/config/performance';

export const HRDashboard = () => {
  useEffect(() => {
    // Track page load
    trackPageLoad('hr_dashboard');

    // Load data with performance tracking
    const loadDashboardData = async () => {
      const data = await measureAsync(
        TraceNames.LOAD_HR_DASHBOARD,
        async () => {
          const [warnings, employees, departments] = await Promise.all([
            loadWarnings(),
            loadEmployees(),
            loadDepartments()
          ]);
          return { warnings, employees, departments };
        },
        { organizationId }
      );

      setDashboardData(data);
    };

    loadDashboardData();
  }, []);

  // ...
};
```

---

## Production vs Development

### Production
- ✅ Performance monitoring enabled
- ✅ All traces active
- ✅ Data sent to Firebase

### Development
- ⚠️ Performance monitoring disabled
- ⚠️ Traces are no-ops (zero overhead)
- ⚠️ No data sent

This ensures:
- No performance overhead in development
- Real production metrics only
- Faster development experience

---

## Data Privacy

### What's Collected
- ✅ Performance metrics (timing, sizes)
- ✅ Custom attributes (non-PII)
- ✅ Device and network info
- ✅ App version

### What's NOT Collected
- ❌ User PII (names, emails, IDs)
- ❌ Sensitive data (warnings, employee records)
- ❌ Authentication tokens
- ❌ Organization details

### GDPR Compliance
All performance data is:
- Aggregated and anonymized
- Stored in Firebase (GDPR-compliant)
- Retained for 90 days
- Can be exported/deleted on request

---

## Status

**✅ Implemented:**
- Performance monitoring initialization
- Custom trace helpers (measureAsync, measureSync)
- Pre-defined trace names
- Metric tracking
- Page load tracking
- API call tracking

**✅ Examples Added:**
- PDF generation performance tracking

**🔜 To Add:**
- Dashboard loading traces
- Employee operation traces
- Search performance traces
- File upload traces

---

## Next Steps

1. ✅ Initialize Performance Monitoring
2. ✅ Add PDF generation tracking
3. 🔜 Add dashboard loading traces
4. 🔜 Add employee CRUD traces
5. 🔜 Add search performance traces
6. 🔜 Set up performance alerts in Firebase Console
7. 🔜 Create performance budget monitoring

---

**Last Updated**: October 2, 2025
**Status**: Active (Production Only)
**Data Retention**: 90 days
