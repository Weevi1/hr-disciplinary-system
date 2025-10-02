# 📡 API Versioning Guide

## Overview

All Cloud Functions now support API versioning to ensure backward compatibility and smooth migrations.

---

## Current Version

**v1.0.0** (Released: October 2, 2025)

---

## How It Works

### 1. **Versioned Responses**

All API responses now include version metadata:

```typescript
{
  "success": true,
  "data": {
    // Your actual response data
  },
  "metadata": {
    "version": "1.0.0",
    "timestamp": 1727872800000,
    "functionName": "getUserClaims",
    "deprecated": false
  }
}
```

### 2. **Version Compatibility Check**

Clients can specify the API version they expect:

```typescript
// Frontend API call with version
const result = await httpsCallable(functions, 'getUserClaims')({
  apiVersion: '1.0.0',
  // ... your other params
});
```

### 3. **Deprecation Warnings**

When a version is deprecated, responses include warnings:

```typescript
{
  "metadata": {
    "version": "1.0.0",
    "deprecated": true,
    "deprecationWarning": "This API version will be deprecated on 2026-01-01"
  }
}
```

---

## For Developers

### Using the Versioning Middleware

Wrap your Cloud Functions with `versionedFunction`:

```typescript
import { onCall } from 'firebase-functions/v2/https';
import { versionedFunction, logApiUsage } from './middleware/apiVersioning';

export const myFunction = onCall(versionedFunction('myFunction', async (request) => {
  const { uid } = request.auth || {};

  // Log API usage for monitoring
  logApiUsage('myFunction', '1.0.0', uid);

  // Your function logic
  return {
    result: 'success'
  };
}));
```

### Response Format

The `versionedFunction` wrapper automatically:
- ✅ Checks API version compatibility
- ✅ Adds version metadata to responses
- ✅ Logs API usage statistics
- ✅ Handles deprecation warnings
- ✅ Enforces sunset dates

---

## Version Information Endpoint

Get current API version info:

```typescript
const versionInfo = await httpsCallable(functions, 'getApiVersionInfo')();

// Returns:
{
  "success": true,
  "data": {
    "current": "1.0.0",
    "supported": ["1.0.0"],
    "versions": {
      "1.0.0": {
        "version": "1.0.0",
        "releaseDate": "2025-10-02",
        "deprecated": false,
        "breaking": false
      }
    },
    "compatibility": {
      "minimumVersion": "1.0.0",
      "recommendedVersion": "1.0.0"
    }
  }
}
```

---

## Version Lifecycle

### 1. **Active** (Current)
- Fully supported
- No deprecation warnings
- Recommended for all new development

### 2. **Deprecated**
- Still functional
- Includes deprecation warnings
- Sunset date announced
- Developers should migrate

### 3. **Sunset**
- No longer functional
- Returns error directing to current version
- All clients must upgrade

---

## Migration Strategy

When introducing breaking changes:

### Step 1: Create New Version
```typescript
// Add to apiVersioning.ts
export const API_VERSIONS: Record<string, ApiVersion> = {
  '1.0.0': {
    version: '1.0.0',
    releaseDate: '2025-10-02',
    deprecated: true,
    deprecationDate: '2026-01-01',
    sunsetDate: '2026-04-01',
    breaking: false
  },
  '2.0.0': {
    version: '2.0.0',
    releaseDate: '2025-12-01',
    deprecated: false,
    breaking: true
  }
};

export const CURRENT_API_VERSION = '2.0.0';
```

### Step 2: Update Frontend
```typescript
// Update API calls to use new version
const result = await httpsCallable(functions, 'myFunction')({
  apiVersion: '2.0.0',
  // new params
});
```

### Step 3: Deprecation Timeline
- **Day 1**: v2.0.0 released, v1.0.0 marked deprecated
- **+90 days**: Deprecation warnings intensify
- **+180 days**: v1.0.0 sunset, returns errors

---

## Best Practices

### ✅ DO
- Always specify `apiVersion` in frontend calls
- Monitor deprecation warnings
- Migrate before sunset dates
- Use `getApiVersionInfo` to check compatibility
- Log API usage for analytics

### ❌ DON'T
- Hardcode version checks in business logic
- Ignore deprecation warnings
- Skip version testing
- Remove old versions without sunset period

---

## Frontend Integration

### API Service Wrapper

```typescript
// frontend/src/services/api.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CURRENT_API_VERSION } from '@/config/apiVersion';

export async function callFunction<T = any>(
  functionName: string,
  data: any = {}
): Promise<T> {
  const functions = getFunctions();
  const callable = httpsCallable(functions, functionName);

  // Always include API version
  const response = await callable({
    ...data,
    apiVersion: CURRENT_API_VERSION
  });

  const result = response.data as any;

  // Check for deprecation warnings
  if (result.metadata?.deprecated) {
    console.warn(
      `⚠️ API Deprecation: ${functionName} - ${result.metadata.deprecationWarning}`
    );
  }

  return result.data;
}
```

### Usage Example

```typescript
// Before (old style)
const result = await httpsCallable(functions, 'getUserClaims')();

// After (versioned)
import { callFunction } from '@/services/api';
const result = await callFunction('getUserClaims');
```

---

## Monitoring

### API Usage Logs

All versioned functions log usage to Firebase Functions logs:

```
📊 [API USAGE] {
  function: 'getUserClaims',
  version: '1.0.0',
  userId: 'abc123',
  organizationId: 'org456',
  timestamp: '2025-10-02T12:00:00Z'
}
```

### BigQuery Export (Future)

API usage logs can be exported to BigQuery for analytics:
- Version adoption rates
- Deprecation impact analysis
- Function usage patterns
- Performance metrics

---

## Status

**✅ Implemented:**
- Version middleware system
- Version info endpoint
- Deprecation warnings
- Sunset date enforcement
- Usage logging

**📋 Example Functions Updated:**
- `getUserClaims` - Fully versioned

**🔜 To Migrate:**
- All remaining Cloud Functions (25 total)

---

## Next Steps

1. ✅ Create versioning middleware
2. ✅ Add version info endpoint
3. ✅ Update example function (getUserClaims)
4. 🔜 Update frontend API service wrapper
5. 🔜 Migrate remaining functions
6. 🔜 Add BigQuery export for analytics

---

**Last Updated**: October 2, 2025
**Current API Version**: 1.0.0
**Deprecation Policy**: 180-day sunset period
