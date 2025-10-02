# 📦 Legacy Components Archive

This folder contains **deprecated/replaced components** that are no longer used in the application but are preserved for reference.

## ⚠️ Build Exclusion

These components are **excluded from production builds** via `vite.config.ts` to reduce bundle size.

---

## Components Archived (Session 7 - Oct 2, 2025)

### **Dashboard Components** (1)
- `UnifiedHODDashboardSection.tsx` - Replaced by `HODDashboardSection.tsx`

### **Admin Components** (6)
- `OrganizationList.tsx` - Integrated into SuperAdminDashboard
- `OrganizationSwitcher.tsx` - Organization switching handled differently
- `SystemStats.tsx` - Not referenced in current dashboard
- `DatabaseManagement.tsx` - Dev tool, not production
- `SuperUserSettings.tsx` - Not linked from SuperAdminDashboard
- `FirebaseInitUI.tsx` - Development tool only

### **Warning Components** (3)
- `CombinedIncidentStep.tsx` (V1) - Replaced by `CombinedIncidentStepV2.tsx`
- `LegalReviewSignaturesStep.tsx` (V1) - Replaced by `LegalReviewSignaturesStepV2.tsx`
- `WarningArchive.tsx` - Archive accessible through ReviewDashboard

### **Meeting/Absence/Counselling** (3)
- `BookHRMeeting.tsx` - Replaced by `UnifiedBookHRMeeting.tsx`
- `ReportAbsence.tsx` - Replaced by `UnifiedReportAbsence.tsx`
- `CorrectiveCounselling.tsx` - Replaced by `UnifiedCorrectiveCounselling.tsx`

### **Employee Components** (1)
- `EmployeeArchive.tsx` - Archive functionality integrated into `EmployeeManagement.tsx`

### **Auth Components** (1)
- `ProtectedRoute.tsx` - Replaced by inline `ProtectedLayout` in `App.tsx`

### **Examples/Dev Tools** (1)
- `UnifiedModalExamples.tsx` - Documentation/examples only, not user-facing

---

## Why Keep Legacy Components?

1. **Reference Implementation** - See how features were originally built
2. **Migration Assistance** - Understand what changed between V1 and V2
3. **Code Examples** - Reusable patterns and logic
4. **Rollback Safety** - Quick restoration if needed

---

## Restoring a Legacy Component

If you need to restore a component:

1. **Copy from `_legacy/` to original location**
   ```bash
   cp src/_legacy/dashboard/UnifiedHODDashboardSection.tsx src/components/dashboard/
   ```

2. **Update imports** in files that use it

3. **Remove from `_legacy/`** if permanently restored

---

## Maintenance

- **Never import** from `_legacy/` in production code
- **Update this README** when archiving new components
- **Review quarterly** - delete truly obsolete components after 6 months

---

**Last Updated:** October 2, 2025
**Components Archived:** 17
**Estimated Bundle Size Reduction:** ~200-300 KB
