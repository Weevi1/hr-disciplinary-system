# Quick Reference - File Locations Catalog

Comprehensive file locations catalog for the HR Disciplinary System codebase.

---

## Core Architecture

### Type Definitions
- **`frontend/src/types/core.ts`**
  - Core type definitions across the system
  - Includes 3-color branding support (`primaryColor`, `secondaryColor`, `accentColor`)
  - Multi-manager employment details (`managerIds?: string[]`)
  - `PDFTemplateSettings` interface (lines 75-154) - Complete template configuration
  - `Warning` interface - Stores both `pdfGeneratorVersion` and `pdfTemplateVersion` fields

- **`frontend/src/types/employee.ts`**
  - Employee type definitions and utility functions
  - **`getManagerIds()` helper** - Backward compatibility for single-manager → multi-manager migration
  - `migrateEmployeeManagerData()` - Batch migration helper
  - `calculateEmployeeStats()` - Employee statistics computation

- **`frontend/src/types/billing.ts`**
  - Billing and reseller type definitions
  - ZAR (South African Rand) pricing structure
  - Subscription plans and payment tracking

- **`frontend/src/types/department.ts`**
  - Department type definitions
  - Default department templates (Operations, Admin)

### Utilities
- **`frontend/src/utils/saLocale.ts`**
  - South African localization utilities
  - Currency formatting (ZAR)
  - Date formatting (dd/mm/yyyy)
  - Timezone handling (Africa/Johannesburg)

- **`frontend/src/utils/signatureSVG.ts`** ⭐ NEW (Session 48)
  - **SVG signature generation** from canvas stroke data
  - SVG→PNG conversion for PDF embedding (jsPDF requirement)
  - Witness signature watermarking (SVG-native)
  - Format detection helpers (`isSignatureSVG`, `isSignaturePNG`)
  - 90%+ storage savings vs PNG (2-5 KB vs 50-200 KB)
  - See: `SVG_SIGNATURE_SYSTEM.md` for complete documentation

- **`frontend/src/utils/deviceDetection.ts`**
  - Comprehensive device capability detection
  - Browser feature detection
  - Performance tier classification

- **`frontend/src/utils/progressiveEnhancement.ts`**
  - Progressive enhancement engine
  - Device capability-based feature enabling
  - Performance tier classification (legacy/modern/high-performance)

- **`frontend/src/utils/pdfDataTransformer.ts`**
  - **UNIFIED PDF DATA TRANSFORMER** - Single source of truth
  - Async transformer (fetches PDF template versions from Firestore)
  - Handles Firestore Timestamp conversion
  - Used by all 7 PDF generation points

### Constants
- **`frontend/src/constants/zIndex.ts`**
  - **Standardized z-index scale** (9000-9999)
  - Prevents modal stacking conflicts
  - Consistent layering across all modals and overlays

---

## Design System & Theming

### Context Providers
- **`frontend/src/contexts/BrandingContext.tsx`**
  - White-label branding system
  - Dynamic CSS variable injection
  - Per-organization branding (logo, colors)

- **`frontend/src/contexts/ThemeContext.tsx`**
  - Theme management system
  - localStorage persistence
  - Theme switching (light/dark/branded)

### Theme Configuration
- **`frontend/src/config/themes.ts`**
  - Theme color definitions (light, dark, branded)
  - Dynamic CSS variables
  - Color scheme mapping

### Design System Components
- **`frontend/src/components/common/ThemedCard.tsx`**
  - **ENHANCED** unified design system components
  - `ThemedCard` - Standardized card with `rounded-lg` consistency
  - `ThemedSectionHeader` - Unified section headers
  - `ThemedFormInput` - Standardized form inputs with error states
  - `ThemedBadge` - Status indicators with semantic colors

- **`frontend/src/components/common/UnifiedModal.tsx`**
  - **GOLD STANDARD** modal wrapper component
  - WCAG 2.1 AA accessibility features
  - Focus trap, keyboard navigation, body scroll prevention
  - Standardized z-index usage

- **`frontend/src/components/common/ThemeSelector.tsx`**
  - Context-aware theme selector
  - Hides branded theme for super users
  - Integrated into dashboard header

- **`frontend/src/components/common/LoadingState.tsx`**
  - Unified loading indicators (sm/md/lg sizes)
  - Blue spinning Loader2 icon with gray text
  - Used across all dashboard tabs

- **`frontend/src/components/common/SmartComponentLoader.tsx`**
  - Intelligent component selection based on device capabilities
  - Loads legacy vs modern components dynamically
  - Performance optimization for low-end devices

### Dashboard Components
- **`frontend/src/components/dashboard/QuotesSection.tsx`**
  - Unified quotes component
  - Theme selector integration
  - Random inspirational quotes per session

- **`frontend/src/components/dashboard/WelcomeSection.tsx`**
  - Unified greeting component
  - Role selector integration
  - Organization name display

- **`frontend/src/components/dashboard/DashboardRoleSelector.tsx`**
  - **Multi-role dashboard switcher**
  - localStorage persistence
  - Dropdown role selection for users with multiple roles

---

## Progressive Enhancement System

- **`frontend/src/utils/deviceDetection.ts`** - Device capability detection (see above)
- **`frontend/src/utils/progressiveEnhancement.ts`** - Enhancement engine (see above)
- **`frontend/src/components/common/SmartComponentLoader.tsx`** - Component loader (see above)
- **`frontend/src/index.css`** - Comprehensive progressive enhancement CSS system (1,328 lines)
  - Legacy device fallbacks (Android 4.0+, iOS 6+)
  - CSS Grid polyfills
  - Flexbox fallbacks
  - Performance optimizations

---

## Services

### Core Services
- **`frontend/src/services/DatabaseShardingService.ts`**
  - Core sharding engine
  - Organization-based sharding (`orgShard_{A-Z}`)
  - Document read/write with automatic routing

- **`frontend/src/services/ShardedDataService.ts`**
  - High-level sharded data operations
  - Batch operations across shards
  - Query optimization

- **`frontend/src/services/TimeService.ts`**
  - Secure timestamp service
  - Prevents timestamp fraud (A+ security compliant)
  - Server-side timestamp generation

- **`frontend/src/services/FirebaseService.ts`**
  - Firebase initialization and configuration
  - Firestore, Auth, Storage, Functions integration
  - Environment-based configuration

### PDF Services
- **`frontend/src/services/PDFGenerationService.ts`**
  - **VERSIONED PDF GENERATION** - See `PDF_SYSTEM_ARCHITECTURE.md`
  - v1.0.0 [FROZEN] and v1.1.0 [CURRENT] methods
  - Version routing switch for legal compliance
  - 100+ lines of protective comments
  - 3-parameter signature: `generateWarningPDF(data, version?, settings?)`

- **`frontend/src/services/PDFTemplateVersionService.ts`**
  - **PDF TEMPLATE VERSION STORAGE** - 1000x storage reduction
  - `saveTemplateVersion()` - Store template in centralized collection
  - `getTemplateVersion()` - Fetch specific version
  - `ensureTemplateVersionExists()` - Called during warning creation
  - See `PDF_SYSTEM_ARCHITECTURE.md` for complete details

- **`frontend/src/services/PDFTemplateService.ts`**
  - Save/load PDF template settings for organizations
  - Version history tracking
  - Default template configuration (v1.1.0 LRA-compliant)

### Employee & Manager Services
- **`frontend/src/services/EmployeeService.ts`**
  - Complete employee CRUD operations
  - Multi-manager filtering with `managerIds` array support
  - CSV import/export functionality
  - Employee statistics calculation

- **`frontend/src/services/EmployeeLifecycleService.ts`**
  - Employee archive/restore system
  - Status management (active/archived/terminated)
  - Lifecycle event tracking

- **`frontend/src/services/ManagerService.ts`**
  - Manager operations (promote/demote)
  - Multi-manager employee counting
  - Team member filtering

- **`frontend/src/services/DepartmentService.ts`**
  - Department CRUD operations
  - Real-time sync with Firestore
  - Employee count management
  - Default department creation

### Warning Services
- **`frontend/src/services/WarningService.ts`**
  - Warning CRUD operations
  - Status management (draft/issued/delivered/archived)
  - Multi-organization support

- **`frontend/src/services/CategoryService.ts`**
  - Warning category management
  - Severity levels and escalation rules
  - Custom category creation

---

## Custom Hooks

### Dashboard Hooks
- **`frontend/src/hooks/dashboard/useDashboardData.ts`**
  - Unified dashboard data loading
  - Parallel fetching optimization
  - Employee filtering by role (HR/Business Owner see all, HOD sees team only)

- **`frontend/src/hooks/useHistoricalWarningCountdown.ts`**
  - **60-day countdown** for historical warning entry feature
  - Urgency indicators (amber → orange → red progression)
  - Per-user countdown tracking

### Employee Hooks
- **`frontend/src/hooks/employees/useEmployeeImport.ts`**
  - CSV import logic with validation
  - Automatic phone number formatting (SA-specific: `0825254011` → `+27825254011`)
  - Date parsing (dd/mm/yyyy South African format)
  - Duplicate detection

- **`frontend/src/hooks/employees/useEmployeeFilters.ts`**
  - Employee filtering and search
  - Multi-criteria filtering (department, status, manager)

### Permission & Role Hooks
- **`frontend/src/hooks/useMultiRolePermissions.ts`**
  - Role-based permission system
  - Permission checking for actions
  - Multi-role support

### Accessibility Hooks
- **`frontend/src/hooks/usePreventBodyScroll.ts`**
  - **Modal body scroll prevention** hook
  - All 21+ modals use this hook
  - Mobile-safe scroll locking

- **`frontend/src/hooks/useFocusTrap.ts`**
  - **Focus trap & keyboard navigation** hook
  - `useModalDialog()` helper for WCAG 2.1 AA compliance
  - Tab trapping within modals

---

## Security & Permissions

- **`frontend/src/permissions/roleDefinitions.ts`**
  - Role-based access control (RBAC)
  - Permission definitions for all roles
  - Reseller permissions

- **`config/firestore.rules`**
  - Firestore security rules
  - Organization-based isolation
  - Role-based read/write access
  - PDF template version collection rules (lines 604-617)

---

## Authentication System

### Auth Components
- **`frontend/src/auth/LoginForm.tsx`**
  - Professional login screen
  - Progressive loading states
  - Forgot password link integration

- **`frontend/src/auth/ForgotPasswordModal.tsx`**
  - **Password reset modal**
  - WCAG 2.1 AA accessibility
  - Email enumeration attack prevention
  - Two-state UI (form → success)

### Auth Context
- **`frontend/src/auth/AuthContext.tsx`**
  - Auth state management
  - Firebase integration
  - `resetPassword(email)` function
  - User session persistence

---

## Component Systems

### Warning Components
- **`frontend/src/components/warnings/enhanced/`**
  - Main warning workflow (mobile-optimized)
  - `EnhancedWarningWizard.tsx` - 7-step wizard
  - `IncidentDetailsForm.tsx` - Step 1
  - `EmployeeSelectionStep.tsx` - Step 2
  - `DeliveryCompletionStep.tsx` - Final step with QR code

- **`frontend/src/components/warnings/ManualWarningEntry.tsx`**
  - **Historical Warning Entry System** for digitizing paper records
  - 4-step wizard for manual entry
  - Physical document tracking

- **`frontend/src/components/warnings/HistoricalWarningDisclaimer.tsx`**
  - Legal compliance warnings for manual entry
  - Missing digital evidence notice

### HR Components
- **`frontend/src/components/hr/EnhancedDeliveryWorkflow.tsx`**
  - Complete HR delivery workflow system
  - Multi-step delivery process
  - Email and print options

- **`frontend/src/components/hr/PrintDeliveryGuide.tsx`**
  - Print & hand delivery workflow
  - On-demand PDF generation
  - Physical delivery confirmation

### Employee Components
- **`frontend/src/components/employees/EmployeeManagement.tsx`**
  - Main employee management interface
  - Tab navigation (Overview, Browse, Archived)
  - Bulk actions support

- **`frontend/src/components/employees/EmployeeFormModal.tsx`**
  - Employee create/edit form
  - Multi-manager checkbox selection
  - Department assignment
  - Auto-scroll to top when opened

- **`frontend/src/components/employees/EmployeeTableBrowser.tsx`**
  - Employee table with sorting and filtering
  - Multi-manager badge display
  - CSV export with semicolon-separated managers
  - Checkbox column for bulk selection

- **`frontend/src/components/employees/EmployeeImportModal.tsx`**
  - CSV import interface
  - 8-field simplified format
  - Helpful tips and sample data
  - Preview before import

- **`frontend/src/components/employees/BulkAssignManagerModal.tsx`**
  - Bulk employee-manager assignment
  - **ADD mode** (preserves existing managers)
  - **REPLACE mode** (removes all existing)
  - Radio button mode selector

- **`frontend/src/components/employees/MobileEmployeeManagement.tsx`**
  - Dedicated mobile UX for employee management
  - Optimized for Samsung S8 era devices
  - Touch-friendly interface

### Manager Components
- **`frontend/src/components/managers/ManagerManagement.tsx`**
  - Manager overview and operations
  - Promote/demote functionality
  - Team member counts

- **`frontend/src/components/managers/ManagerDetailsModal.tsx`**
  - Manager details and team view
  - Add/remove employees from team
  - Employee assignment with multi-manager support

- **`frontend/src/components/managers/PromoteToManagerModal.tsx`**
  - Promote existing employee to manager
  - Department selection for HOD role
  - Multi-department assignment with checkboxes
  - Defensive null checks for incomplete employee data

### Admin Components
- **`frontend/src/components/admin/DepartmentManagement.tsx`**
  - Complete department CRUD management
  - Stats dashboard with employee counts
  - Manager assignment per department
  - Real-time sync

- **`frontend/src/components/admin/SuperAdminDashboard.tsx`**
  - **UNIFIED** SuperAdmin dashboard
  - Real metrics (growth, storage usage, organization stats)
  - Greeting → Metrics → Tabs → Quote structure

- **`frontend/src/components/admin/EnhancedOrganizationWizard.tsx`**
  - Organization deployment wizard
  - Logo upload with JPG→PNG conversion
  - Default department creation (Operations, Admin)
  - Multi-step setup process

- **`frontend/src/components/admin/OrganizationManagementV2.tsx`**
  - Organization settings and configuration
  - User management interface
  - Department management integration
  - Ultra-compact design (inline stat badges)

- **`frontend/src/components/admin/OrganizationCategoriesViewer.tsx`**
  - Warning category management
  - Category creation/edit with severity levels
  - Compact card design with expand/collapse

### PDF Template Components
- **`frontend/src/components/admin/PDFTemplateManager.tsx`**
  - SuperAdmin interface for managing per-organization PDF templates
  - Organization list with template status
  - Editor/preview integration
  - Version history display

- **`frontend/src/components/admin/PDFTemplateEditor.tsx`**
  - Visual editor for PDF template settings
  - Color pickers (header, section, body, border)
  - Font selectors (Helvetica, Times, Arial)
  - Margin controls, logo settings
  - Section configuration editor

- **`frontend/src/components/admin/PDFTemplatePreview.tsx`**
  - Real-time PDF preview with sample data
  - Debounced regeneration (500ms)
  - Full-screen preview mode

- **`frontend/src/components/admin/SectionEditorModal.tsx`**
  - Edit PDF section content (Consequences, Employee Rights, etc.)
  - Subsections editor (title + content)
  - Content type toggle (Paragraph ↔ Bullet Points)
  - Dynamic bullet point management

### Reseller Components
- **`frontend/src/components/reseller/`**
  - Reseller dashboard and client management
  - Organization deployment for clients
  - Billing and subscription management

### Dashboard Sections
- **`frontend/src/components/dashboard/HRDashboardSection.tsx`**
  - HR dashboard with greeting, metrics, tabs
  - Employee management integration
  - Warning workflow access
  - Historical warning entry button (60-day countdown)

- **`frontend/src/components/dashboard/BusinessOwnerDashboardSection.tsx`**
  - Business Owner dashboard (matches HR dashboard structure)
  - Executive Command Center theme
  - Organization, Employees, Warnings tabs
  - Department management integration

- **`frontend/src/components/dashboard/HODDashboardSection.tsx`**
  - Head of Department dashboard
  - Team members modal with proper scrolling
  - Warning, counselling, absence tools

- **`frontend/src/components/dashboard/DashboardRouter.tsx`**
  - Main dashboard routing component
  - Role-based section rendering
  - Mobile viewport overflow fix (nested containers)

---

## Pages

- **`frontend/src/pages/business/BusinessDashboard.tsx`**
  - Main dashboard router
  - Role-based section rendering
  - Welcome section integration
  - Mobile-optimized layout (nested padding containers)

---

## Styling

### CSS Files
- **`frontend/src/index.css`**
  - Comprehensive progressive enhancement CSS (1,328 lines)
  - Legacy device fallbacks (Android 4.0+, iOS 6+)
  - CSS Grid polyfills, Flexbox fallbacks
  - Mobile viewport overflow safeguards (`overflow-x: hidden` on html, body, #root)
  - Tailwind CSS base styles

- **`frontend/src/warning-wizard.css`**
  - Comprehensive mobile CSS optimizations (1,600+ lines)
  - Samsung S8 compatibility
  - Touch-friendly controls
  - Enhanced Warning Wizard specific styles

---

## Configuration Files

### Firebase Configuration
- **`frontend/src/config/firebase.ts`**
  - Firebase SDK initialization
  - Region configuration (`us-central1` primary, `us-east1` super user)
  - Environment-based settings

### Build Configuration
- **`frontend/vite.config.ts`**
  - Vite build configuration
  - Module resolution
  - Build optimizations

- **`frontend/tsconfig.json`**
  - TypeScript compiler options
  - Path aliases
  - Strict mode settings

### Deployment Configuration
- **`firebase.json`**
  - Firebase hosting configuration
  - Firestore indexes (user creates manually)
  - Functions deployment settings
  - Storage rules

---

## API Layer

- **`frontend/src/api/index.ts`**
  - Centralized API layer
  - Cloud Functions integration
  - `pdfTemplateVersion` field passthrough (line 213)
  - Request/response type safety

---

## Firebase Functions

### Function Files
- **`functions/src/index.ts`**
  - Main functions entry point
  - Exports all cloud functions

- **`functions/src/customClaims.ts`**
  - Custom claims management
  - `refreshUserClaims` - Manual refresh
  - `getUserClaims` - Get current claims
  - `refreshOrganizationUserClaims` - Bulk refresh

- **`functions/src/organizations.ts`**
  - Organization CRUD functions
  - `createOrganizationUser` - Create user with employeeId linking

### Regions
- **Primary (`us-central1`)**: Most functions (reseller, organization, auth, billing, audio, etc.)
- **Secondary (`us-east1`)**: Super user functions only (`getSuperUserInfo`, `manageSuperUser`)

---

## Documentation Files

### Current Documentation
- **`CLAUDE.md`** - Essential guidance for Claude Code (this file)
- **`QUICK_REFERENCE.md`** - File locations catalog (you are here)
- **`PDF_SYSTEM_ARCHITECTURE.md`** - Complete PDF systems reference (3 systems: versioning, customization, storage)
- **`RECENT_UPDATES.md`** - Latest session updates (Sessions 20-34)
- **`SESSION_HISTORY.md`** - Archived session history (Sessions 5-19)
- **`FEATURE_IMPLEMENTATIONS.md`** - Completed feature documentation

### Architecture & Security
- **`DATABASE_SHARDING_ARCHITECTURE.md`** - Complete sharding implementation with validation
- **`SECURITY_AUDIT_REPORT.md`** - A-grade security framework and assessment
- **`TESTING_STRATEGY.md`** - Comprehensive testing framework
- **`REQUIRED_FIRESTORE_INDEXES.md`** - Active operational reference

### Design & UI
- **`V2_DESIGN_PRINCIPLES.md`** - Production-ready visual design language
- **`MODAL_DESIGN_STANDARDS.md`** - Gold standard modal design patterns
- **`MODAL_AUDIT_REPORT.md`** - Modal system audit (21+ modals analyzed)
- **`MODAL_FIXES_IMPLEMENTATION.md`** - Week 1: Body scroll prevention, z-index standardization
- **`MODAL_WEEK_2_3_IMPLEMENTATION.md`** - Week 2-3: Focus trap, ARIA labels, scroll strategies
- **`MODAL_USAGE_GUIDELINES.md`** - Complete usage guide with decision tree
- **`ENHANCED_WARNING_WIZARD_MOBILE_OPTIMIZATION.md`** - Samsung S8+ mobile optimization
- **`ENHANCED_WARNING_WIZARD_DESIGN_SYSTEM.md`** - Unified design system implementation

### Development History
- **`CLAUDE_DEVELOPMENT_HISTORY.md`** - Historical context and archived implementation details

---

## Cross-References

### PDF System (3 Layers)
For complete details on the PDF system, see **`PDF_SYSTEM_ARCHITECTURE.md`**:
1. **PDF Generator Versioning** (legal compliance) → `PDFGenerationService.ts`
2. **PDF Template Customization** (per-org styling) → `PDFTemplateService.ts`, `PDFTemplateManager.tsx`
3. **PDF Template Version Storage** (1000x storage reduction) → `PDFTemplateVersionService.ts`

### Recent Changes
For session-by-session change history:
- **Sessions 20-34**: See `RECENT_UPDATES.md`
- **Sessions 5-19**: See `SESSION_HISTORY.md`

### Feature Implementations
For completed feature documentation, see **`FEATURE_IMPLEMENTATIONS.md`**:
- Department Management System
- Enhanced User Creation System
- Business Owner Dashboard Redesign
- Manual Warning Entry System
- Ultra-Compact Dashboard Components

---

*Last Updated: 2025-10-23 - Complete file catalog with PDF systems, employee management, and dashboard components*
