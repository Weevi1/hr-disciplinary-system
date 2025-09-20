# 🔥 REQUIRED FIRESTORE INDEXES FOR PERFORMANCE OPTIMIZATION

## Critical Indexes for Employee Query Performance

### 1. Manager Employee Query Index
**Collection**: `organizations/{organizationId}/employees`
**Fields**:
- `employment.managerId` (Ascending)
- `isActive` (Ascending)
- `profile.lastName` (Ascending)

**Purpose**: Optimizes `API.employees.getByManager()` query
**Performance Impact**: Reduces manager employee lookup from O(n) to O(log n)

### 2. Employee Pagination Index
**Collection**: `organizations/{organizationId}/employees`
**Fields**:
- `isActive` (Ascending)
- `profile.lastName` (Ascending)

**Purpose**: Optimizes `API.employees.getAll()` with pagination
**Performance Impact**: Enables efficient sorting and pagination for large employee lists

### 3. User Organization Index (Already in place)
**Collection**: `userOrgIndex`
**Fields**: Single field indexes on:
- `userId` (Ascending) - Primary key
- `organizationId` (Ascending) - For admin queries
- `isActive` (Ascending) - For filtering

## How to Create These Indexes

### Method 1: Firebase Console (Recommended)
1. Navigate to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Enter the collection path and field configuration above
4. Wait for index creation to complete

### Method 2: Error-Driven Creation (Automatic)
1. Use the application with the optimized queries
2. Firebase will show error messages with direct links to create required indexes
3. Click the links to automatically create the proper indexes

## Index Creation URLs
When you encounter index errors, Firebase will provide URLs like:
```
https://console.firebase.google.com/project/hr-disciplinary-system/firestore/indexes?create_composite=...
```

**Action Required**: Click these URLs when they appear in console errors to create the indexes automatically.

## Performance Expected After Index Creation
- **Manager employee queries**: ~50-100ms (down from 300ms+)
- **Paginated employee lists**: ~100-200ms regardless of organization size
- **User authentication**: Already optimized to ~50ms with UserOrgIndex

## Monitoring
Monitor query performance in console logs:
- Look for `[OPTIMIZED]` tags in employee query logs
- Expected reduction of 60-80% in query times after indexes are created