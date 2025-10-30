# CLAUDE.md

Essential guidance for Claude Code when working with this HR Disciplinary System repository.

---

## Quick Start

### Development Commands
```bash
# Frontend development
cd frontend && npm run dev

# Build with extended timeout (handles 2081+ modules)
npm run build --timeout 300000

# Firebase emulators (all services)
firebase emulators:start

# Deploy to production
firebase deploy
```

### Current System Status
- **✅ Production**: Online at https://hr-disciplinary-system.web.app
- **✅ Development**: Ubuntu environment at http://localhost:3003/ (dev server running)
- **✅ Enterprise Ready**: A-grade security, production monitoring, 2,700+ org scalability
- **✅ Sharded Architecture**: Database sharding implemented for multi-thousand organization support
- **✅ Progressive Enhancement**: Complete 2012-2025 device compatibility with zero performance punishment
- **✅ Unified Design System**: Complete visual unification with consistent typography, spacing, and theming
- **✅ Unified Admin Dashboards**: Business Owner, HR, and SuperAdmin dashboards follow identical structure - Greeting → Metrics → Tabs → Quote

---

## Architecture Summary

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase Cloud Functions + Firestore + Storage
- **Firebase Regions**:
  - **Primary**: `us-central1` (most functions, main server)
  - **Secondary**: `us-east1` (super user functions only - new server)
- **Key Features**: Multi-sector HR management, multi-manager employee assignments, role-based access, real-time notifications, QR code document delivery

---

## Development Workflow

1. **Code Changes**: Use existing patterns and design system
2. **Testing**: Manual testing preferred for development efficiency
   - E2E Playwright framework available: `npm run test:e2e` (use only when specifically requested)
   - Firebase emulator testing: `npm run test:firebase`
3. **Builds**: Allow 5+ minutes for full production builds
4. **Never commit**: Unless explicitly requested by user
5. **🚫 FIRESTORE INDEXES**: Never programmatically deploy indexes via firebase.json - user creates them manually in Firebase Console using error links

### 📏 Documentation Maintenance

**IMPORTANT**: This file is size-limited to maintain context efficiency.

- **Size Limit**: 500 lines maximum (target: 400-470 lines)
- **Current Size**: 270 lines ✅
- **Policy**: See `DOCUMENTATION_POLICY.md` for complete maintenance rules
- **Before Adding Sessions**: Check size with `wc -l CLAUDE.md`
- **If > 450 lines**: Move previous session to RECENT_UPDATES.md first

---

## ⚠️ CRITICAL: Firebase Functions Deployment Regions

### **Server Configuration**
- **PRIMARY SERVER: `us-central1`** - Main deployment region (most functions)
- **SECONDARY SERVER: `us-east1`** - New server (super user functions only)

### **Frontend Configuration**
- **Current**: `frontend/src/config/firebase.ts` uses `us-central1`
- **⚠️ WARNING**: Only change region if deploying to different server
- **Rule**: Always match frontend region with target function's deployment region

### **Current Function Distribution**
```bash
us-central1: Most functions (reseller, organization, auth, billing, audio, etc.)
us-east1:    getSuperUserInfo, manageSuperUser (super user functions only)
```

---

## Important Files

**For complete file locations catalog with descriptions, see `QUICK_REFERENCE.md`**

### Key Files to Know
- **Core Types**: `frontend/src/types/core.ts`, `frontend/src/types/employee.ts`
- **PDF System**: `PDFGenerationService.ts`, `PDFTemplateVersionService.ts`, `pdfDataTransformer.ts` - See `PDF_SYSTEM_ARCHITECTURE.md`
- **Services**: `DatabaseShardingService.ts`, `EmployeeService.ts`, `WarningService.ts`
- **Design System**: `ThemedCard.tsx`, `UnifiedModal.tsx`, `index.css` (1,328 lines of progressive enhancement CSS)
- **Hooks**: `useDashboardData.ts`, `usePreventBodyScroll.ts`, `useFocusTrap.ts`

---

## Critical Operational Guidelines

### **🚫 NEVER DO**
- **Never commit** unless explicitly requested
- **Never update git config**
- **Never use git commands with -i flag** (interactive input not supported)
- **Never programmatically deploy Firestore indexes** - user creates manually via console
- **Never push to remote** unless user explicitly asks

### **✅ ALWAYS DO**
- Use existing patterns and design system
- Check for similar code in components before adding new code
- Run lint and typecheck commands after significant changes if available
- Use absolute file paths in tools
- Prefer editing existing files over creating new ones
- Use defensive programming with null checks

### **Development Server Status**
- **Current**: Running at http://localhost:3003/
- **Status**: Fully optimized for 2012-era devices with progressive enhancement
- **Compatibility**: 95% compatible with Android 4.0+ and iOS 6+ devices
- **✅ Mobile Dashboard**: Samsung S8 era mobile optimizations implemented
- **✅ Mobile Layout**: MainLayout header optimized - removed hamburger menu, consolidated navigation into profile dropdown
- **✅ Mobile Components**: Created MobileEmployeeManagement component with dedicated mobile UX patterns

---

## PDF Systems Overview

**For complete PDF system documentation, see `PDF_SYSTEM_ARCHITECTURE.md`**

The system uses a 3-layer architecture for legal compliance and organizational flexibility:

1. **PDF Generator Versioning** (v1.0.0 [FROZEN], v1.1.0 [CURRENT])
   - Ensures historical warnings regenerate identically for legal compliance
   - **⚠️ CRITICAL**: Never modify frozen version methods
   - See `PDFGenerationService.ts` for version routing

2. **PDF Template Customization** (Per-Organization Styling)
   - Each organization can have unique PDF branding (colors, fonts, logos)
   - Maintains same code version for legal consistency
   - See `PDFTemplateManager.tsx`, `PDFTemplateEditor.tsx`

3. **PDF Template Version Storage** (1000x Storage Reduction)
   - Centralized template storage prevents duplication
   - Warnings store 5-byte version reference instead of 5-10KB settings object
   - See `PDFTemplateVersionService.ts`

**Key Pattern**: `generateWarningPDF(data, codeVersion, templateSettings)`

---

## Reference Documentation

**Quick reference to supporting documentation:**

### Architecture & Security
- `DATABASE_SHARDING_ARCHITECTURE.md` - Complete sharding implementation with validation
- `SECURITY_AUDIT_REPORT.md` - A-grade security framework and assessment
- `TESTING_STRATEGY.md` - Comprehensive testing framework
- `REQUIRED_FIRESTORE_INDEXES.md` - Active operational reference

### Design & UI
- `V2_DESIGN_PRINCIPLES.md` - Production-ready visual design language
- `MODAL_DESIGN_STANDARDS.md` - Gold standard modal design patterns and implementation guidelines
- `MODAL_AUDIT_REPORT.md` - **Modal system audit** - Comprehensive analysis of all 21+ modals (centering, scrolling, body scroll prevention, z-index) with fix recommendations
- `MODAL_FIXES_IMPLEMENTATION.md` - **✅ Week 1 Complete** - Body scroll prevention hook, standardized z-index (9000-9999), all 19 modals updated
- `MODAL_WEEK_2_3_IMPLEMENTATION.md` - **✅ Week 2-3 Complete** - Focus trap hook, ARIA labels, scroll strategy standardization, comprehensive usage guidelines
- `MODAL_USAGE_GUIDELINES.md` - **Complete usage guide** - Decision tree, best practices, accessibility requirements, code examples, testing guidelines
- `ENHANCED_WARNING_WIZARD_MOBILE_OPTIMIZATION.md` - Samsung S8+ mobile optimization details
- `ENHANCED_WARNING_WIZARD_DESIGN_SYSTEM.md` - Unified design system implementation

### Development History & Sessions
- **`DOCUMENTATION_POLICY.md`** - **Size limits & rotation rules** - How this documentation system stays maintainable
- **`QUICK_REFERENCE.md`** - **File locations catalog** - Comprehensive file paths and descriptions
- **`PDF_SYSTEM_ARCHITECTURE.md`** - **Complete PDF systems reference** - All 3 PDF layers with implementation details
- **`RECENT_UPDATES.md`** - **Latest session updates** (Sessions 20-34) - All recent fixes, improvements, and feature implementations
- **`SESSION_HISTORY.md`** - **Archived session history** (Sessions 5-19) - Detailed change logs
- `FEATURE_IMPLEMENTATIONS.md` - Completed feature documentation (Department Management, User Management, Dashboard Redesign, Manual Warning Entry)
- `CLAUDE_DEVELOPMENT_HISTORY.md` - Historical context and archived implementation details

---

## 📋 CURRENT FOCUS / PENDING TASKS

### **🔜 Testing & Validation Tasks**

**✅ Priority 1: Deploy Functions** - COMPLETED
- ✅ Redeployed Firebase Functions - all 25/25 functions deployed successfully after cleanup
- ✅ Removed `setCustomClaimsOnSignIn` function
- ✅ No GCIP upgrade errors

**✅ Priority 2: Test Enhanced User Creation** - COMPLETED
- ✅ Business owners can promote existing employees to HR/Department manager roles
- ✅ Business owners can create new managers with automatic employee records
- ✅ Email verification during employee promotion works correctly

**Priority 3: Test Historical Warning Entry**
- 60-day countdown displays correctly for HR managers
- First access timestamp recorded properly
- Urgency indicators work (amber → orange → red progression)
- Button hides after 60 days

**Priority 4: Test Employee Management Fixes**
- HOD managers can view their team members (no "No Employees Found" error)
- HR managers can edit employee records created during manager promotion
- Optional chaining handles missing profile data gracefully

**Priority 5: Test Department System**
- Real-time employee count updates when employees added/removed
- Department management works on Business Owner Dashboard tabs
- Default departments (Operations, Admin) created for new organizations

**✅ Priority 6: Test Bulk Employee-Manager Assignment** - COMPLETED (Feature Verified)
- ✅ Checkbox column appears in Employee Table Browser
- ✅ Select all checkbox toggles all employees on page
- ✅ Bulk actions bar appears when employees selected
- ✅ "Assign to Manager" button visible for HR role only
- ✅ Modal opens with manager dropdown and confirmation
- ✅ Multiple employees assigned to manager successfully
- ✅ Employee list refreshes after assignment

**✅ Priority 7: Test Print & Hand Delivery Workflow** - COMPLETED (Session 19)
- ✅ On-demand PDF generation works for warnings without existing PDF URLs
- ✅ Employee data structure transformation (nested → flat) successful
- ✅ Field mapping corrections (level, issueDate, incidentDate) working
- ✅ Simplified workflow (Steps 2 & 3) streamlined for better UX
- ✅ Dashboard counter refresh mechanism working correctly
- ✅ Status updates propagate to HR Dashboard in real-time

---

### **🎯 Current System State**
- ✅ All code changes committed (Session 22)
- ✅ Frontend deployed and live
- ✅ Development server running at http://localhost:3003/
- ✅ All new features ready for production testing
- ✅ **PDF A4 Formatting** - Professional A4 documents with optimized spacing and typography
- ✅ **Warning scripts rewritten** - All 11 SA languages updated to formal recap format
- ✅ **Witness signature system** - Prominent watermarking with explicit save buttons
- ✅ **Manager Name in PDFs** - All new warnings now store and display manager name in signature section

---

## 🔧 Latest Updates

**For complete change history, see `RECENT_UPDATES.md` (Sessions 20-39) and `SESSION_HISTORY.md` (Sessions 5-19)**

### Most Recent (Session 39 - 2025-10-30)
- **🎉 PDF SIGNATURE DISPLAY FIX & UI IMPROVEMENTS**: Fixed critical PDF signature rendering bug and improved PDF layout
- **Critical Bug Fix - PDF Signatures Not Displaying**:
  - ✅ Fixed v1.2.0 method signature mismatch - was passing entire data object instead of signatures
  - ✅ Root cause: PDF template system implementation introduced parameter ordering bug
  - ✅ Signatures now display correctly in PDF preview and generated documents
  - ✅ Issue affected all warnings using v1.2.0 generator (2025-10-15 onwards)
- **PDF Layout Improvements**:
  - ✅ Added 8mm spacing before signatures section for better visual separation
  - ✅ Made blue "Employee Rights" background box dynamic (adjusts height to content)
  - ✅ Removed "Generated on" timestamp from footer (only shows issue/valid/incident dates)
  - ✅ Centered page numbers in footer for cleaner layout
- **Warning History Modal**:
  - ✅ Created interactive warning history in Step 2 with tappable warning cards
  - ✅ Modal shows date, manager, incident details, location, and expiry with color coding
  - ✅ Mobile-optimized with 44px touch targets
  - ✅ Removed slide animation per user request
- **Multi-Language Script Section**:
  - ✅ Redesigned to ultra-compact layout (60% size reduction)
  - ✅ Language selector and "View Script" button now equal weight
  - ✅ Removed redundant "Script available in" and "Complete script" text
  - ✅ Perfect horizontal alignment using flexbox items-stretch
- **Default Template Update**:
  - ✅ Removed "Refer to counselling dated {{issuedDate}}" from consequences section
  - ✅ Affects new organizations only (existing orgs can edit via template editor)
- **Files Modified**:
  - `PDFGenerationService.ts:872` - Fixed addSignaturesSection parameters
  - `PDFGenerationService.ts:1685` - Added signature section spacing
  - `PDFGenerationService.ts:1610-1695` - Dynamic blue box height calculation
  - `PDFGenerationService.ts:2100,2457` - Removed generation timestamps
  - `LegalReviewSignaturesStepV2.tsx` - Interactive warning history with modal
  - `MultiLanguageWarningScript.tsx` - Ultra-compact script selector
  - `PDFTemplateService.ts:225` - Updated default template text
- **Deployment**: ✅ Frontend built and deployed
- **Status**: ✅ Complete - PDF signatures working, improved layouts deployed

### Previous Recent (Session 38 - 2025-10-28)
- **🎉 MANAGER DASHBOARD FIX - Team Members Now Visible**: Fixed critical bug where managers couldn't see their assigned team
- **Reseller Dashboard Enhancements**:
  - ✅ Fixed eye icon - now opens ClientSummaryModal instead of broken new tab
  - ✅ Created professional client summary modal with metrics, contact info, and activity
  - ✅ Added pagination (10 clients per page) with search and status filtering
  - ✅ Removed "Trial" status option (not yet implemented)
  - ✅ Updated "Your Clients" to "Recent Clients" showing last 2 deployed
- **HOD Manager Employee Management**:
  - ✅ Hidden Hierarchy tab from HOD managers (security restriction)
  - ✅ Removed contact details (email/phone) from employee views
  - ✅ Hidden Edit and Archive buttons (read-only access for HOD)
  - ✅ Added employee view modal for cards view on mobile
  - ✅ Role-based visibility throughout employee management
- **Team Management Modal Fixes**:
  - ✅ Fixed body scroll prevention when modal is open
  - ✅ Fixed floating action button positioning (was rendering off-screen)
  - ✅ Added communication bridge between parent and child components
- **Quick Add Employee for HOD Managers**:
  - ✅ Simplified form with only essential fields (Name, Surname, Start Date, Position, Reporting Manager)
  - ✅ Auto-generated employee number (read-only)
  - ✅ HR can complete full profile later
  - ✅ Enables managers to onboard employees immediately if HR hasn't yet
- **Mobile Optimizations**:
  - ✅ Hidden "Clean Record" badge on mobile cards view
  - ✅ Fixed FAB positioning within modal bounds
  - ✅ Employee details modal works on mobile tap
- **Files Modified**:
  - `frontend/src/components/reseller/ClientSummaryModal.tsx` - NEW: Client details modal
  - `frontend/src/components/reseller/MyClients.tsx` - Pagination, filters, view modal
  - `frontend/src/components/reseller/ResellerDashboard.tsx` - "Recent Clients" section
  - `frontend/src/components/employees/EmployeeTableBrowser.tsx` - Role-based contact visibility
  - `frontend/src/components/employees/EmployeeManagement.tsx` - Hierarchy tab, view modal, FAB control
  - `frontend/src/components/employees/EmployeeCard.tsx` - View support, mobile badge hiding
  - `frontend/src/components/employees/EmployeeFormModal.tsx` - Basic mode for HOD managers
  - `frontend/src/components/dashboard/HODDashboardSection.tsx` - Modal scroll fix, FAB positioning
  - `frontend/src/hooks/usePreventBodyScroll.ts` - Applied to Team Management modal
- **Deployment**: ✅ Frontend built and deployed
- **Status**: ✅ Complete - Full reseller and HOD manager workflow improvements

### Previous Recent (Session 38 - 2025-10-28)
- **🎉 MANAGER DASHBOARD FIX - Team Members Now Visible**: Fixed critical bug where managers couldn't see their assigned team
- **Problem**: Bulk assign manager was writing to `employment.managerIds` (array), but `getByManager` query was looking for old `employment.managerId` (string)
- **Root Cause**: Query mismatch between legacy field (`managerId`) and modern multi-manager field (`managerIds`)
- **Solution**: Updated `API.employees.getByManager` query to use `array-contains` operator on `managerIds` array
- **Manager Welcome Modal Improvements**:
  - ✅ Dynamic greeting adjusts based on enabled HOD permissions
  - ✅ Search function in "Promote to Manager" modal now filters correctly
  - ✅ Fixed HOD permissions modal to use sharded collection path
  - ✅ Improved modal UI: removed scrollbars, fixed close button visibility, proper content scrolling
  - ✅ Fixed spacing issues: icon no longer cut off, reduced excessive padding
  - ✅ Modal is non-dismissible (must be acknowledged via "Get Started" button)
- **Files Modified**:
  - `frontend/src/api/index.ts` (line 649) - Fixed manager query to use `managerIds` array
  - `frontend/src/components/managers/PromoteToManagerModal.tsx` - Fixed employee search filtering
  - `frontend/src/components/admin/HODPermissionsModal.tsx` - Fixed to use sharded collection path
  - `frontend/src/components/auth/FirstTimeWelcomeModal.tsx` - Dynamic greetings, improved spacing
  - `frontend/src/components/common/UnifiedModal.tsx` - Added hideHeader prop, fixed scrolling
  - `frontend/src/modal-system.css` - Fixed content scrolling behavior
  - `frontend/src/layouts/MainLayout.tsx` - Pass hodPermissions to welcome modal
- **⚠️ IMPORTANT**: Requires new Firestore composite index (Firebase will provide URL on first query):
  - Collection: `organizations/{organizationId}/employees`
  - Fields: `employment.managerIds` (Array), `isActive` (Ascending), `profile.lastName` (Ascending)
- **Deployment**: ✅ Frontend built and deployed
- **Status**: ✅ Complete - Managers can now see their team members

### Previous Recent (Session 37 - 2025-10-23)
- **🎉 RESELLER SESSION PRESERVATION FIX**: Fixed reseller logout issue during organization deployment
- **Problem**: `createUserWithEmailAndPassword()` automatically signed in new admin user, logging out the reseller
- **Solution**: Migrated to Cloud Function `createOrganizationAdmin` using Admin SDK (preserves current session)
- **Backend Changes**: Updated `createOrganizationAdmin` function to allow reseller permissions with security check
- **Frontend Changes**: `ShardedOrganizationService.ts` now calls Cloud Function instead of client-side Auth API
- **Success Modal**: Removed misleading "You have been signed in as new admin" message
- **Impact**: ✅ Resellers stay signed in after deploying clients, smooth wizard completion
- **Files Modified**:
  - `functions/src/Auth/userCreationService.ts` (lines 87-128) - Added reseller permissions
  - `frontend/src/services/ShardedOrganizationService.ts` (lines 271-349) - Cloud Function integration
  - `frontend/src/components/admin/EnhancedOrganizationWizard.tsx` (lines 862-869) - Updated success message
- **Deployment**: ✅ Backend deployed, frontend built successfully
- **Status**: ✅ Complete - Ready for testing

### Previous Recent (Session 36 - 2025-10-23)
- **User Creation & Role Assignment Fix**: Fixed issue where new users had to sign out/in to get roles working
- **Solution**: Added `auth.setCustomUserClaims()` to all 4 user creation functions
- **Deployment**: ✅ All 28 functions deployed successfully to production
- **Status**: ✅ Complete

### Previous Sessions Summary
- **Session 35**: Documentation policy & maintenance system (500-line limit, rotation rules)
- **Session 34**: CSV import enhancements (SA phone formatting, dd/mm/yyyy dates)
- **Session 33**: Editable PDF text content system (zero hardcoded fallbacks, subsections editor)
- **Session 32**: Multi-manager system fixes & debugging (promotion crashes fixed)
- **Session 31**: PDF template customization system (per-organization styling)
- **Session 30**: PDF template version storage optimization (1000x storage reduction)
- **Sessions 20-29**: See `RECENT_UPDATES.md` for detailed change history

**For complete session history, see:**
- `RECENT_UPDATES.md` - Sessions 20-38 (current)
- `SESSION_HISTORY.md` - Sessions 5-19 (archived)

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, **unified professional design system** across all components, **WCAG AA accessibility compliance**, **versioned PDF generation for legal compliance**, **per-organization PDF template customization**, **1000x storage reduction through centralized template version management**, **fully editable PDF text content with zero hardcoded fallbacks**, **SA-optimized employee CSV import with automatic phone number formatting**, and **multi-manager support with array-based employee assignments**.*

*Last Updated: 2025-10-30 - Session 39: PDF Signature Display Fix & UI Improvements*
