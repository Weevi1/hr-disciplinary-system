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
- **Key Features**: Multi-sector HR management, role-based access, real-time notifications, QR code document delivery

---

## Development Workflow

1. **Code Changes**: Use existing patterns and design system
2. **Testing**: Manual testing preferred for development efficiency
   - E2E Playwright framework available: `npm run test:e2e` (use only when specifically requested)
   - Firebase emulator testing: `npm run test:firebase`
3. **Builds**: Allow 5+ minutes for full production builds
4. **Never commit**: Unless explicitly requested by user
5. **🚫 FIRESTORE INDEXES**: Never programmatically deploy indexes via firebase.json - user creates them manually in Firebase Console using error links

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

### Core Architecture
- `frontend/src/types/core.ts` - Core type definitions (includes 3-color branding support)
- `frontend/src/types/billing.ts` - Billing and reseller type definitions (ZAR pricing)
- `frontend/src/utils/saLocale.ts` - South African localization utilities (currency, dates, timezone)
- `frontend/src/services/` - Business logic and Firebase integration
- `frontend/src/constants/zIndex.ts` - **Standardized z-index scale** (9000-9999) for modal stacking and conflict prevention

### Design System & Theming
- `frontend/src/contexts/BrandingContext.tsx` - White-label branding system with dynamic CSS injection
- `frontend/src/contexts/ThemeContext.tsx` - Theme management system with localStorage persistence
- `frontend/src/config/themes.ts` - Theme color definitions (light, dark, branded) with dynamic CSS variables
- `frontend/src/components/common/ThemedCard.tsx` - **ENHANCED** unified design system components:
  - `ThemedCard` - Standardized card component with `rounded-lg` consistency
  - `ThemedSectionHeader` - Unified section headers across all wizard steps
  - `ThemedFormInput` - Standardized form inputs with error states and theming
  - `ThemedBadge` - Status indicators with semantic color usage
- `frontend/src/components/common/UnifiedModal.tsx` - **GOLD STANDARD** modal wrapper component
- `frontend/src/components/common/ThemeSelector.tsx` - Context-aware theme selector (hides branded theme for super users)
- `frontend/src/components/dashboard/QuotesSection.tsx` - Unified quotes component with theme selector integration

### Progressive Enhancement System
- `frontend/src/utils/deviceDetection.ts` - Comprehensive device capability detection system
- `frontend/src/utils/progressiveEnhancement.ts` - Progressive enhancement engine with performance tier classification
- `frontend/src/components/common/SmartComponentLoader.tsx` - Intelligent component selection based on device capabilities
- `frontend/src/index.css` - Comprehensive progressive enhancement CSS system (1,328 lines)

### Key Services
- `frontend/src/services/DatabaseShardingService.ts` - Core sharding engine
- `frontend/src/services/ShardedDataService.ts` - High-level sharded data operations
- `frontend/src/services/TimeService.ts` - Secure timestamp service preventing fraud (A+ security compliant)
- `frontend/src/services/PDFGenerationService.ts` - **VERSIONED PDF GENERATION** - See detailed section below
- `frontend/src/services/EmployeeLifecycleService.ts` - Complete employee archive/restore system
- `frontend/src/services/DepartmentService.ts` - Department CRUD operations with real-time sync and employee count management
- `frontend/src/utils/pdfDataTransformer.ts` - **UNIFIED PDF DATA TRANSFORMER** - Single source of truth for PDF data transformation

### Custom Hooks
- `frontend/src/hooks/useHistoricalWarningCountdown.ts` - **60-day countdown** for historical warning entry feature with urgency indicators
- `frontend/src/hooks/dashboard/useDashboardData.ts` - Unified dashboard data loading with parallel fetching
- `frontend/src/hooks/useMultiRolePermissions.ts` - Role-based permission system
- `frontend/src/hooks/usePreventBodyScroll.ts` - **Modal body scroll prevention** hook (all 21+ modals use this)
- `frontend/src/hooks/useFocusTrap.ts` - **Focus trap & keyboard navigation** hook with `useModalDialog()` helper for WCAG 2.1 AA compliance

### Security & Permissions
- `frontend/src/permissions/roleDefinitions.ts` - Role-based access control including reseller permissions
- `config/firestore.rules` - Security rules (requires review)

### Component Systems
- `frontend/src/components/warnings/enhanced/` - Main warning workflow (mobile-optimized)
- `frontend/src/components/warnings/ManualWarningEntry.tsx` - **Historical Warning Entry System** for digitizing paper records
- `frontend/src/components/warnings/HistoricalWarningDisclaimer.tsx` - Legal compliance warnings for manual entry
- `frontend/src/components/reseller/` - Reseller dashboard, client management, and organization deployment
- `frontend/src/components/hr/EnhancedDeliveryWorkflow.tsx` - Complete HR delivery workflow system
- `frontend/src/components/hr/PrintDeliveryGuide.tsx` - Print & hand delivery workflow with on-demand PDF generation
- `frontend/src/components/admin/DepartmentManagement.tsx` - Complete department CRUD management with stats dashboard
- `frontend/src/components/admin/SuperAdminDashboard.tsx` - **UNIFIED** SuperAdmin dashboard with real metrics (growth, storage usage)
- `frontend/src/components/admin/EnhancedOrganizationWizard.tsx` - Organization deployment wizard with logo upload & JPG→PNG conversion
- `frontend/src/components/dashboard/DashboardRoleSelector.tsx` - **Multi-role dashboard switcher** with localStorage persistence
- `frontend/src/components/dashboard/WelcomeSection.tsx` - Unified greeting component with role selector integration
- `frontend/src/pages/business/BusinessDashboard.tsx` - Main dashboard router with role-based section rendering
- `frontend/src/warning-wizard.css` - Comprehensive mobile CSS optimizations (1,600+ lines) with S8 compatibility

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

## 🔒 PDF Generator Versioning System - SECURITY CRITICAL

### **Overview**

The PDF generation system uses semantic versioning to ensure **legal compliance** and **document integrity**. Historical warnings must regenerate **identically** years later for appeals, audits, or legal proceedings.

### **⚠️⚠️⚠️ CRITICAL: NEVER MODIFY FROZEN VERSIONS ⚠️⚠️⚠️**

**Frozen versions** are PERMANENTLY LOCKED and must **NEVER** be changed. Modifying them breaks legal document integrity and could invalidate historical warnings in court.

### **Current Version Status**

- **v1.0.0** - [FROZEN] - Used by warnings created before 2025-10-14
  - Previous Action shows: `Date | Offense | Level`
  - ⚠️ **DO NOT MODIFY** `generateWarningPDF_v1_0_0()` or `addPreviousDisciplinaryActionSection_v1_0_0()`

- **v1.1.0** - [CURRENT] - Used by all new warnings
  - Previous Action shows: `Date | Incident Description | Level`
  - ⚠️ Will become FROZEN when v1.2.0 is released

### **How It Works**

1. **New Warnings**: Store `pdfGeneratorVersion: '1.1.0'` in Firestore when created
2. **Regeneration**: Read stored version from Firestore, route to correct version handler
3. **Consistency**: Old warnings use v1.0.0 code, new warnings use v1.1.0 code
4. **Legal Compliance**: PDFs always look identical regardless of when regenerated

### **Key Files**

- **`frontend/src/services/PDFGenerationService.ts`**
  - Main entry point: `generateWarningPDF(data, requestedVersion)`
  - Version routing switch (lines 206-228)
  - Frozen methods: `generateWarningPDF_v1_0_0()`, `addPreviousDisciplinaryActionSection_v1_0_0()`
  - Current method: `generateWarningPDF_v1_1_0()`
  - **100+ lines of protective comments**

- **`frontend/src/utils/pdfDataTransformer.ts`**
  - `transformWarningDataForPDF()` - Adds `pdfGeneratorVersion` to all PDFs
  - Single source of truth for data transformation

- **`frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`**
  - Stores `pdfGeneratorVersion` when creating warnings (line 887)
  - 27 lines of comprehensive comments explaining system

### **Updated Components (All pass stored version)**

All 6 PDF regeneration points now pass the stored version:
1. `SimplePDFDownloadModal.tsx` (line 212-215)
2. `PDFPreviewModal.tsx` (line 219-222)
3. `PrintDeliveryGuide.tsx` (line 149-152)
4. `DeliveryCompletionStep.tsx` (line 275-278)
5. `ProofOfDeliveryModal.tsx` (line 279-282)
6. `PDFViewerModal.tsx` (line 184-187)

### **🚫 DO NOT:**

- Modify `generateWarningPDF_v1_0_0()` method
- Modify `addPreviousDisciplinaryActionSection_v1_0_0()` method
- Change format strings in frozen versions (e.g., line 865 in v1.0.0)
- "Fix bugs" in frozen versions
- Remove cases from version routing switch
- Modify `generateWarningPDF_v1_1_0()` once it becomes frozen

### **✅ HOW TO ADD A NEW VERSION (e.g., v1.2.0):**

1. **Increment Version**: Update `PDF_GENERATOR_VERSION` in `PDFGenerationService.ts` (line 63)
   ```typescript
   export const PDF_GENERATOR_VERSION = '1.2.0'; // Changed from 1.1.0
   ```

2. **Create New Method**: Copy v1.1.0 method and create `generateWarningPDF_v1_2_0()`
   ```typescript
   private static async generateWarningPDF_v1_2_0(data: WarningPDFData): Promise<Blob> {
     // Your new implementation
   }
   ```

3. **Create New Format Method** (if format changed):
   ```typescript
   private static addPreviousDisciplinaryActionSection_v1_2_0(...) {
     // Your new format
   }
   ```

4. **Update Version Routing** (add new case, KEEP all old ones):
   ```typescript
   switch (version) {
     case '1.0.0':
       return this.generateWarningPDF_v1_0_0(data);
     case '1.1.0':
       return this.generateWarningPDF_v1_1_0(data);
     case '1.2.0':  // ADD THIS
       return this.generateWarningPDF_v1_2_0(data);
     default:
       return this.generateWarningPDF_v1_2_0(data); // Update fallback
   }
   ```

5. **Mark Previous Version as FROZEN**:
   - Update v1.1.0 method comment to say [FROZEN]
   - Add ⚠️ DO NOT MODIFY warnings to v1.1.0

6. **Update Version History** (lines 40-51):
   ```typescript
   * - v1.2.0 (2025-XX-XX): Description of changes [CURRENT]
   *   - What changed and why
   ```

7. **Update CLAUDE.md**: Add v1.2.0 to version status list

8. **Test Thoroughly**:
   - Create new warning, verify it stores v1.2.0
   - Regenerate old v1.0.0 warning, verify format unchanged
   - Regenerate old v1.1.0 warning, verify format unchanged
   - Download, preview, print all versions

### **Semantic Versioning Rules**

- **MAJOR (X.0.0)**: Breaking changes to PDF structure (page layout, sections)
- **MINOR (0.X.0)**: Content changes (field additions, formatting tweaks, text changes)
- **PATCH (0.0.X)**: Bug fixes that don't affect visible output (code refactoring only)

### **Testing Checklist**

When versioning changes are made:

- [ ] New warnings store current version in Firestore
- [ ] Old warnings regenerate with their original version
- [ ] All 6 regeneration points pass stored version
- [ ] Version routing works for all versions
- [ ] No modifications to frozen version methods
- [ ] Comments updated with [FROZEN] or [CURRENT] status
- [ ] CLAUDE.md updated with version information
- [ ] Build succeeds without errors
- [ ] Production deployment successful

### **Legal Compliance Impact**

This versioning system is **CRITICAL** for:
- **Court proceedings**: Historical warnings must match original documents
- **Audits**: Consistency required for labor law compliance
- **Appeals**: Documents must be identical across time
- **CCMA cases**: Document tampering allegations avoided

**Modifying frozen versions could result in:**
- ❌ Documents being challenged in court
- ❌ Losing CCMA/labor disputes
- ❌ Legal liability for the organization
- ❌ Loss of document integrity and trust

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

### Development History
- `CLAUDE_DEVELOPMENT_HISTORY.md` - Historical context and archived implementation details
- `FEATURE_IMPLEMENTATIONS.md` - Completed feature documentation (Department Management, User Management, Dashboard Redesign, Manual Warning Entry)
- `RECENT_UPDATES.md` - **Latest session updates** (Sessions 5-18) - All recent fixes, improvements, and feature implementations
- `SESSION_HISTORY.md` - **Archived session history** - Detailed change logs from Sessions 5-17

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

## 🔧 Latest Updates (Session 23)

**See `RECENT_UPDATES.md` and `SESSION_HISTORY.md` for complete change history**

### Most Recent Changes (Session 23 - 2025-10-14)
- **🔒 PDF GENERATOR VERSIONING SYSTEM** - Implemented comprehensive versioning for legal compliance
  - **Purpose**: Ensure historical warnings regenerate identically years later for appeals, audits, and legal proceedings
  - **Implementation**:
    - Added semantic versioning (v1.0.0, v1.1.0) to PDFGenerationService
    - Created frozen v1.0.0 method with "Date | Offense | Level" format (for old warnings)
    - Created current v1.1.0 method with "Date | Incident Description | Level" format
    - Version routing system directs to appropriate handler based on stored version
    - All 6 PDF regeneration points now pass stored version
  - **Key Features**:
    - New warnings store `pdfGeneratorVersion: '1.1.0'` in Firestore
    - Old warnings regenerate with v1.0.0 code, new warnings use v1.1.0 code
    - Frozen versions are PERMANENTLY LOCKED and must never be modified
    - 100+ lines of protective comments prevent accidental changes
  - **Files Modified**:
    - `PDFGenerationService.ts`: Added versioning, routing, frozen methods, comprehensive comments
    - `pdfDataTransformer.ts`: Added `pdfGeneratorVersion` field to all transformations
    - `EnhancedWarningWizard.tsx`: Stores version when creating warnings (27 lines of comments)
    - `SimplePDFDownloadModal.tsx`: Passes stored version for regeneration
    - `PDFPreviewModal.tsx`: Passes stored version for regeneration
    - `PrintDeliveryGuide.tsx`: Passes stored version for regeneration
    - `DeliveryCompletionStep.tsx`: Passes stored version for regeneration
    - `ProofOfDeliveryModal.tsx`: Passes stored version for regeneration
    - `PDFViewerModal.tsx`: Passes stored version for regeneration
    - `CLAUDE.md`: Added comprehensive versioning documentation section
  - **Legal Impact**: Prevents document tampering, ensures court admissibility, maintains audit compliance
  - **Status**: ✅ Complete - Ready for production use

### Previous Changes (Session 22 - 2025-10-13)
- **CRITICAL: Manager Name in PDF Signatures** - Fixed missing manager name in PDF signature section
  - **Problem**: Manager signature section showed blank line `Manager Name: _____________________` instead of actual manager name
  - **Root Cause**: Enhanced Warning Wizard was NOT saving `issuedBy` and `issuedByName` fields to Firestore when creating warnings
  - **Solution**: Added manager information to warning creation in wizard
    - `EnhancedWarningWizard.tsx` (lines 779-781): Added `issuedBy: user?.uid` and `issuedByName: currentManagerName`
    - `pdfDataTransformer.ts` (line 148): Already configured to extract `issuedByName` from warning data
    - `PDFGenerationService.ts`: Already configured to display manager name in signatures
  - **Impact**:
    - ✅ NEW warnings (created after fix) will display manager name correctly
    - ❌ EXISTING warnings (created before fix) do NOT have this field in Firestore and will continue showing blank
  - **Files Modified**:
    - `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` (lines 779-781)
    - `frontend/src/utils/pdfDataTransformer.ts` (line 148)
- **PDF Signature Layout Fixes** - Improved signature positioning and spacing in PDFs
  - **Problem**: Signatures were rendering on the bottom line of boxes instead of being properly centered
  - **Solution**:
    - Changed from centering vertically to positioning from top (5mm from top)
    - Reduced max signature height from 37mm to 35mm for better spacing
    - Increased padding from 8mm total to 16mm total (8mm each side)
    - Moved manager name and date below signature boxes with better spacing (+7mm and +11mm)
  - **Result**: Signatures now render properly centered with professional spacing throughout
  - **Files Modified**:
    - `frontend/src/services/PDFGenerationService.ts` (lines 970-1093)

### Previous Changes (Session 21 - 2025-10-10)
- **PDF A4 Formatting Fixes**: Comprehensive formatting improvements for professional A4 warning documents
  - **Previous Disciplinary Action Section**: Reduced font from 14pt to 12pt, increased padding and line spacing
  - **Consequences Section**: Removed emoji (⚠️), split heading across 2 lines to prevent cut-off, increased box height and padding
  - **Employee Rights Section**: Removed emoji (⚖️), increased box height from 85mm to 102mm, optimized line spacing from 4.5 to 5mm
  - **Spacing Improvements**: Increased spacing after Employee Rights box from 12mm to 35mm to eliminate overlap with Signatures section
  - **All sections**: Reduced heading font sizes from 14pt to 12pt for proper A4 readability
  - **Result**: Clean, professional PDFs with no emoji rendering issues, no text cut-off, proper spacing throughout
- **CRITICAL: Firestore Timestamp Date Fix**: Fixed historical warnings showing incorrect dates in PDFs
  - **Problem**: Old warnings were showing today's date (10 October 2025) instead of their original issue date in signatures and document fields
  - **Root Cause**: Firestore Timestamp objects (`{ seconds, nanoseconds }`) were not being converted to JavaScript Date objects in PrintDeliveryGuide.tsx
  - **Solution**: Added `convertTimestampToDate()` helper function that properly converts Firestore Timestamps using `new Date(timestamp.seconds * 1000)`
  - **Files Modified**:
    - `frontend/src/components/hr/PrintDeliveryGuide.tsx` (lines 146-177) - Added timestamp conversion for `issuedDate` and `incidentDate`
    - `frontend/src/services/PDFGenerationService.ts` (lines 933-1010) - Updated signature dates to use `issuedDate` parameter
  - **Impact**: Historical warnings now display their correct original dates, ensuring legal compliance and accurate record-keeping
- **Unified PDF Data Transformer**: Created centralized data transformation utility for consistent PDF generation across all components
  - **Created**: `frontend/src/utils/pdfDataTransformer.ts` - Single source of truth for transforming warning data to PDF format
  - **Security-critical**: Ensures consistent data structure across all PDF generation methods (prevents data leakage or inconsistencies)
  - **Updated components**:
    - `PrintDeliveryGuide.tsx` - Uses unified transformer for on-demand PDF generation
    - `PDFPreviewModal.tsx` - Uses unified transformer for preview generation
    - `SimplePDFDownloadModal.tsx` - Uses unified transformer for simple downloads
  - **Benefits**: Eliminates duplicate transformation logic, ensures all PDFs have identical data structure, easier to maintain and debug
- **PDFPreviewModal Data Structure Fix**: Fixed console errors when viewing PDFs in Review Warnings modal
  - **Error**: `Uncaught TypeError: Cannot read properties of undefined (reading 'replace')` at PDFPreviewModal.tsx:177
  - **Root Cause**: After unified transformer migration, `extractedData.category` changed from object `{name: string}` to plain string
  - **Fixed locations**:
    - Line 177: Changed `extractedData.category.name.replace()` → `(extractedData.category || 'Warning').replace()`
    - Lines 194-196: Changed `extractedData.incident.description` → `extractedData.description`
    - Lines 459, 572: Changed `extractedData.category.name` → `extractedData.category`
    - Lines 430, 626: Changed `extractedData.incident.description` → `extractedData.description`
  - **Result**: PDF preview modal now works correctly with unified transformer data structure
- **PDF Signature Aspect Ratio Preservation**: Fixed signature distortion in generated PDFs
  - **Problem**: Signatures appeared stretched/distorted - dimensions didn't match original captured signatures
  - **Root Cause**: Both manager and employee signatures used hardcoded height (15mm) regardless of original proportions
  - **Solution**: Implemented proper aspect ratio preservation algorithm
    - Load original image dimensions from base64 signature data using `Image()` object
    - Calculate aspect ratio: `width / height`
    - Scale to fit max width, check if height exceeds max height
    - If height exceeds max, scale based on height instead
    - Center signature horizontally within box for better presentation
  - **Files Modified**:
    - `PDFGenerationService.ts` (lines 966-997): Manager signature aspect ratio preservation
    - `PDFGenerationService.ts` (lines 1011-1042): Employee signature aspect ratio preservation
  - **Result**: Signatures now maintain original proportions and are professionally centered in PDFs

### Session 20 Changes (2025-10-08)
- **Modal Accessibility Completion**: Fixed 2 remaining modals missing accessibility features from Week 2-3 implementation
  - **DeliveryMethodSelectionModal**: Added focus trap, ARIA labels, keyboard navigation, `min-h-0` for proper scrolling
  - **EmployeeFormModal**: Replaced manual body scroll with `usePreventBodyScroll()` hook, added focus trap, ARIA labels, standardized z-index
  - All 21+ modals now have: proper viewport centering, body scroll prevention, standardized z-index, and WCAG 2.1 AA accessibility
- **Modal System Verification**: Completed full audit of all modals to ensure consistent implementation
  - Verified UnifiedModal-based modals (BulkAssignDepartmentModal, BulkAssignManagerModal)
  - Verified standard pattern modals (all warning modals, employee modals)
  - Confirmed all modals follow Week 1 + Week 2-3 patterns

### Session 19 Changes (2025-10-08)
- **Print & Hand Delivery PDF Generation**: Fixed on-demand PDF generation for warnings without existing PDF URLs
  - Added employee data structure transformation (nested `profile`/`employment` → flat structure)
  - Fixed field mapping (`level` → `warningLevel`, `issueDate` → `issuedDate`, etc.)
  - Removed "print on letterhead" instruction (PDF generates its own letterhead)
- **Workflow Simplification**: Streamlined Print & Hand Delivery process for better UX
  - **Step 2**: Reduced to 1 checkbox (removed witness name, additional notes, redundant checks)
  - **Step 3**: Simplified to single "Delivery process completed" confirmation
  - Removed verbose delivery summary and warning alerts
- **API Method Fix**: Changed from non-existent `API.warnings.updateDeliveryStatus()` to `API.warnings.update()`
- **Dashboard Counter Refresh**: Added callback mechanism to refresh metrics after delivery completion
  - Fixed counter logic from `!w.delivered` to `w.status !== 'delivered'`
  - "Undelivered Warnings" counter now updates in real-time

### Session 18 Changes (2025-10-07)
- **Employee Rights PDF Section**: Added comprehensive LRA-compliant rights section to all warning PDFs (before signatures)
- **Email Delivery Workflow**: Complete enhancement with download, copy-to-clipboard, and mailto link features
- **Firestore Timestamp Handling**: Enhanced date conversion in PDFGenerationService and modals
- **Bug Fixes**: Fixed employee name display in email delivery modal, timestamp conversion errors

### Session 17 Changes (2025-10-07)
- **Appeal Report System**: Standalone PDF generator with color-coded outcomes, multi-page support
- **Signature Timestamps**: SA timezone timestamps on all signatures (Manager, Employee, Witness)
- **Sequential Signature Capture**: Enforced workflow (Manager → Employee/Witness)
- **Mobile CSS Fix**: Horizontal scroll issue resolved (100vw → 100%)
- **Warning Dates Fix**: Invalid dates resolved with proper Firestore Timestamp conversion

### Previous Sessions (5-16)
- Session 16: Warning script rewrite (11 SA languages) + witness signature watermarking
- Session 15: Simplified loading experience with progressive status bar
- Session 14: Warning wizard UX improvements + level override fixes
- Session 13: Multi-language warning script + logging consistency
- Session 12: Wizard finalization + employee data structure fixes
- Session 11: Mobile scrolling fix + audio recording optimization + UX improvements
- Session 10: Accessibility improvements (WCAG AA) + mobile optimization
- Session 9: Bulk employee-manager assignment feature
- Session 8: Console security cleanup + timestamp security (20 fixes)
- Session 7: Multi-role dashboard selector with localStorage persistence
- Session 6: SuperAdmin dashboard redesign + organization wizard logo upload
- Session 5: HR dashboard rewrite + data integrity fixes

**Full details**: See `SESSION_HISTORY.md`

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, **unified professional design system** across all components, **WCAG AA accessibility compliance**, and **versioned PDF generation for legal compliance**.*

*Last Updated: 2025-10-14 - Session 23: PDF Generator Versioning System*
