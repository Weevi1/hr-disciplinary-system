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

### Security & Permissions
- `frontend/src/permissions/roleDefinitions.ts` - Role-based access control including reseller permissions
- `config/firestore.rules` - Security rules (requires review)

### Component Systems
- `frontend/src/components/warnings/enhanced/` - Main warning workflow (mobile-optimized)
- `frontend/src/components/warnings/ManualWarningEntry.tsx` - **Historical Warning Entry System** for digitizing paper records
- `frontend/src/components/warnings/HistoricalWarningDisclaimer.tsx` - Legal compliance warnings for manual entry
- `frontend/src/components/reseller/` - Reseller dashboard, client management, and organization deployment
- `frontend/src/components/hr/EnhancedDeliveryWorkflow.tsx` - Complete HR delivery workflow system
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
- `ENHANCED_WARNING_WIZARD_MOBILE_OPTIMIZATION.md` - Samsung S8+ mobile optimization details
- `ENHANCED_WARNING_WIZARD_DESIGN_SYSTEM.md` - Unified design system implementation

### Development History
- `CLAUDE_DEVELOPMENT_HISTORY.md` - Historical context and archived implementation details
- `FEATURE_IMPLEMENTATIONS.md` - **NEW** Completed feature documentation (Department Management, User Management, Dashboard Redesign, Manual Warning Entry)
- `RECENT_UPDATES.md` - **NEW** Latest session updates and recent changes (Session 3 work, Modal styling, Component redesigns)

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

---

### **🚀 New Features to Implement**

**Feature Request: Bulk Employee-Manager Assignment**
- Add bulk selection capability to Employee Management (HR role)
- Allow HR to select multiple employees via checkboxes
- Bulk action: "Assign to Manager" dropdown with available managers
- Currently: Manager assignment only possible via individual employee edit modal
- Goal: Streamline HR workflow for assigning multiple employees to managers at once

### **🎯 Current System State**
- ✅ All code changes committed (commit `30955563`)
- ✅ Frontend deployed and live
- ✅ Development server running at http://localhost:3003/
- ✅ All new features ready for production testing
- ✅ **HR Dashboard completely rewritten** - Now matches Business Owner Dashboard structure

---

### **🔧 Recent Fixes (Session 5) - HR DASHBOARD REWRITE**
- **HR Dashboard Section - Complete Rewrite ✨**
  - ✅ **Structural Fix**: Completely rewrote HRDashboardSection.tsx to match BusinessOwnerDashboard pattern
  - ✅ **Mobile View**: 2x2 grid layout with 4 metric cards + 3 tab buttons (Urgent Tasks, Warnings, Employees)
  - ✅ **Desktop View**: 4 notification blocks + tab navigation system (Urgent, Warnings, Employees)
  - ✅ **JSX Compilation**: Fixed persistent "Unterminated JSX contents" error
  - ✅ **Modal System**: All modals properly placed inside main div wrapper
  - ✅ **No Fragment Wrapper**: Single div return pattern for clean structure
  - ✅ **Unified Design**: Consistent with Business Owner Dashboard styling and layout
  - ✅ **Tab System**: Matching tab navigation with active states and counts
  - ✅ **Typography**: Optimized font sizes for mobile (xs→lg progression)
  - ✅ **Touch Targets**: All buttons meet 48px+ minimum for accessibility
  - ✅ **Visual Hierarchy**: Clear action buttons → team overview → contextual alerts
  - ✅ **Chevron Indicator**: Team Members button shows right arrow for navigation clarity
  - ✅ **Count Display**: Large, bold employee count (2xl font) for quick scanning

---

### **🔧 Recent Fixes (Session 5) - DASHBOARD & DATA INTEGRITY**
- **Manual Warning Entry - Date Handling Fix ✨**
  - ✅ **CustomDatePicker Integration**: Fixed date conversion between Date objects and ISO strings
  - ✅ **Form Validation**: Incident and issue dates now properly validated and displayed
  - ✅ **Review Step**: Date display in review step now works correctly with `.toLocaleDateString()`
  - ✅ **Historical Warnings**: Excluded from delivery queue via `isHistoricalEntry` flag filter

- **Email Delivery Modal - Scrolling Fix 🎨**
  - ✅ **Flex Layout**: EnhancedDeliveryWorkflow now uses proper `flex flex-col` structure
  - ✅ **Scrollable Content**: Content area has `overflow-y-auto` with `min-h-0` for proper scrolling
  - ✅ **Fixed Sections**: Header, progress, and footer use `flex-shrink-0` to maintain height
  - ✅ **User Experience**: Modal now scrolls smoothly when content exceeds viewport

- **Employee Department Field - Data Structure Fix 📊**
  - ✅ **Field Location**: Changed from `employment.department` to `profile.department` across 9 files
  - ✅ **EmployeeTableBrowser**: All 7 references updated (filter, search, sort, CSV, table, details)
  - ✅ **EmployeeManagement**: Department filter now uses correct field
  - ✅ **EmployeeOrganogram**: Department grouping and display fixed
  - ✅ **Backward Compatibility**: Services check both locations for legacy data

- **Employee Statistics - Improved Metrics 📈**
  - ✅ **Removed Redundant Stats**: Eliminated "Archived" and "On Probation" individual blocks
  - ✅ **Combined Critical Stat**: New "On Probation, With Warnings" shows high-risk employees
  - ✅ **Manager Count Logic**: Counts by position title containing "manager" OR having direct reports
  - ✅ **Team Status Section**: Replaced "Total Employees" with "Managers" count (more actionable)
  - ✅ **Active Employees Display**: Shows Active Employees, Managers, and New This Month

- **Probation Period Handling 🗓️**
  - ✅ **Always Visible**: Probation End Date field now shows for all contract types (not just non-permanent)
  - ✅ **Optional Field**: Marked as "(Optional)" with helpful 3-6 months guidance text
  - ✅ **Universal Application**: Applies to permanent contracts where probation is the employer's early termination option

- **Warning Severity Labels - Terminology Fix ⚠️**
  - ✅ **Removed "Dismissals"**: System doesn't handle termination, only warnings
  - ✅ **Updated to "Gross Misconduct"**: Accurate reflection of high-severity warning categories
  - ✅ **Consistent Labeling**: Applied to both mobile and desktop dashboard views

- **UI Polish - Employee Table 🎯**
  - ✅ **Removed Inline Edit Button**: Deleted pencil icon from actions column
  - ✅ **Streamlined Actions**: Now only shows eye icon to view details
  - ✅ **Cleaner UX**: Users click eye to expand, then use "Edit Employee" button in details panel

---

### **🔧 Recent Fixes (Session 6) - SUPER ADMIN DASHBOARD & ORGANIZATION WIZARD**

- **SuperAdmin Dashboard - Complete Redesign ✨**
  - ✅ **Unified Layout**: Matches HR/Business Owner dashboard structure exactly
  - ✅ **Card Spacing**: Fixed desktop metrics - changed from `gap-6` → `gap-3`, `padding="lg"` → `padding="sm"`
  - ✅ **Container Alignment**: Wrapped content with `max-w-7xl mx-auto p-6 pt-2` to align with greeting section
  - ✅ **Quote System**: Replaced hardcoded quotes with unified `QuotesSection` component
  - ✅ **Header Cleanup**: Removed redundant header section - starts directly with metric cards
  - ✅ **Deploy Button**: Moved "Deploy New Organization" into Organizations tab header
  - ✅ **Icon Layout**: Horizontal card layout with icon + text side-by-side (matching other dashboards)

- **Theme Selector - Super User Support 🎨**
  - ✅ **Context-Aware**: Automatically hides "branded" theme option for users without organization context
  - ✅ **Auto-Switch**: Converts from "branded" to "light" theme if no organization available
  - ✅ **Compact Version**: Updated cycle logic to skip branded theme for super users
  - ✅ **Smart Detection**: Uses `OrganizationContext` to determine available themes

- **Real Monthly Growth Metrics 📈**
  - ✅ **Calculation Logic**: Counts organizations created this month vs. last month
  - ✅ **Percentage Display**: Shows actual growth like `-50%`, `0%`, `+25%`, `+100%`
  - ✅ **Edge Cases**: Handles year boundaries (December → January), no orgs in either month
  - ✅ **Timestamp Parsing**: Properly handles Firestore timestamps and Date objects
  - ✅ **Replaced Placeholder**: Changed from hardcoded `12` to real calculation

- **Storage Usage Tracking 💾**
  - ✅ **New Column**: Added "Storage" column in Organizations table
  - ✅ **Audio Files**: Scans `organizations/{orgId}/audio` folder
  - ✅ **Signature PNGs**: Scans `organizations/{orgId}/signatures` folder
  - ✅ **Human-Readable**: Formats bytes as `0 B`, `45.2 KB`, `1.3 MB`, `2.1 GB`
  - ✅ **Real-Time**: Calculates storage on dashboard load for each organization
  - ✅ **Visual Indicator**: Shows hard drive icon next to storage size

- **Organization Wizard - Logo Upload 🖼️**
  - ✅ **File Upload**: Drag & drop / click to upload interface in Branding step
  - ✅ **File Validation**: Accepts JPG/PNG only, max 5MB size limit
  - ✅ **JPG → PNG Conversion**: Automatic conversion using HTML5 Canvas API
  - ✅ **Live Preview**: Shows uploaded image with remove button
  - ✅ **Firebase Storage**: Uploads to `organizations/{orgId}/logos/logo-{timestamp}.png`
  - ✅ **URL Fallback**: Optional URL input (disabled when file is selected)
  - ✅ **Loading States**: Shows upload progress and conversion indicator
  - ✅ **Error Handling**: Continues deployment even if logo upload fails

- **Bug Fixes 🐛**
  - ✅ **DataService Method**: Fixed `getAllOrganizations()` → `loadOrganizations()`
  - ✅ **Modal Alignment**: SuperAdmin content now aligns with greeting section
  - ✅ **Theme Selector Position**: Removed duplicate theme selector from header

---

### **🔧 Recent Fixes (Session 7) - MULTI-ROLE DASHBOARD SELECTOR**

- **Dashboard Role Selector - Multi-Role Support 🎯**
  - ✅ **New Component**: Created `DashboardRoleSelector.tsx` with dropdown interface
  - ✅ **Smart Detection**: Shows only if user has 2+ dashboard roles (Business Owner, HR, HOD)
  - ✅ **localStorage Persistence**: Remembers user's last selected dashboard view
  - ✅ **Elegant Design**: Glassmorphic dropdown with role icons and descriptions
  - ✅ **Click Outside**: Auto-closes dropdown when clicking elsewhere
  - ✅ **z-index Fix**: Dropdown properly renders above all dashboard content

- **Role Access Logic 🔐**
  - ✅ **Business Owner**: Can switch between Business Owner, HR Manager, and Department Manager dashboards
  - ✅ **HR Manager**: Can switch between HR Manager and Department Manager dashboards
  - ✅ **Standalone HOD**: No switcher (only has HOD dashboard)
  - ✅ **Priority System**: Defaults to highest permission level, respects localStorage selection
  - ✅ **Permission Validation**: Re-validates selection on permission changes

- **WelcomeSection Integration 👋**
  - ✅ **Desktop View**: Role selector replaces static role badge in top-right
  - ✅ **Mobile View**: Role selector appears in greeting card area
  - ✅ **Overflow Fix**: Changed `overflow-hidden` → `overflow: visible` to prevent clipping
  - ✅ **Conditional Render**: Falls back to static badge for single-role users

- **BusinessDashboard Router Updates 🔄**
  - ✅ **State Management**: Added `selectedRole` state with `getInitialDashboardRole()` helper
  - ✅ **Dynamic Rendering**: Shows selected dashboard section instead of hierarchical default
  - ✅ **HOD Fallback**: Standalone HODs automatically see HOD dashboard without selector
  - ✅ **Role Change Handler**: Updates localStorage and re-renders on selection

- **User Experience 🎨**
  - ✅ **Visual Feedback**: Active role shows green indicator in dropdown
  - ✅ **Role Icons**: Business Owner (💼), HR Manager (🛡️), Department Manager (👥)
  - ✅ **Descriptions**: Each role shows clear purpose ("Executive & Configuration", etc.)
  - ✅ **Info Footer**: "Your selection will be remembered for this session"

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, and **unified professional design system** across all components.*

*Last Updated: 2025-10-02 - Session 7: Multi-role dashboard selector with localStorage persistence*
