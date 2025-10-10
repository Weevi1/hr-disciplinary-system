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
- `frontend/src/services/PDFGenerationService.ts` - PDF generation with organization branding and logos
- `frontend/src/services/EmployeeLifecycleService.ts` - Complete employee archive/restore system
- `frontend/src/services/DepartmentService.ts` - Department CRUD operations with real-time sync and employee count management

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
- ✅ All code changes committed (Session 21)
- ✅ Frontend deployed and live
- ✅ Development server running at http://localhost:3003/
- ✅ All new features ready for production testing
- ✅ **PDF A4 Formatting** - Professional A4 documents with optimized spacing and typography
- ✅ **Warning scripts rewritten** - All 11 SA languages updated to formal recap format
- ✅ **Witness signature system** - Prominent watermarking with explicit save buttons

---

## 🔧 Latest Updates (Session 21)

**See `RECENT_UPDATES.md` and `SESSION_HISTORY.md` for complete change history**

### Most Recent Changes (Session 21 - 2025-10-10)
- **PDF A4 Formatting Fixes**: Comprehensive formatting improvements for professional A4 warning documents
  - **Previous Disciplinary Action Section**: Reduced font from 14pt to 12pt, increased padding and line spacing
  - **Consequences Section**: Removed emoji (⚠️), split heading across 2 lines to prevent cut-off, increased box height and padding
  - **Employee Rights Section**: Removed emoji (⚖️), increased box height from 85mm to 102mm, optimized line spacing from 4.5 to 5mm
  - **Spacing Improvements**: Increased spacing after Employee Rights box from 12mm to 35mm to eliminate overlap with Signatures section
  - **All sections**: Reduced heading font sizes from 14pt to 12pt for proper A4 readability
  - **Result**: Clean, professional PDFs with no emoji rendering issues, no text cut-off, proper spacing throughout

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

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, **unified professional design system** across all components, and **WCAG AA accessibility compliance**.*

*Last Updated: 2025-10-10 - Session 21: PDF A4 Formatting Fixes*
