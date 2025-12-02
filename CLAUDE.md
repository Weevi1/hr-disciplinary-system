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

### Firebase CLI Authentication
Firebase CLI uses **service account authentication** (OAuth login deprecated/broken as of Dec 2024).

**Setup** (already configured in `~/.bashrc`):
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/aiguy/projects/hr-disciplinary-system/hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json"
```

**Verify it works**:
```bash
firebase projects:list
```

**⚠️ Security**: The service account JSON file is in `.gitignore` - never commit it.

### Current System Status
- **✅ Production**: Online at https://file.fifo.systems (custom domain) and https://hr-disciplinary-system.web.app
- **✅ Development**: Ubuntu environment at http://localhost:3003/ (dev server running)
- **✅ Enterprise Ready**: A-grade security, production monitoring, 2,700+ org scalability
- **✅ Sharded Architecture**: Database sharding implemented for multi-thousand organization support
- **✅ Progressive Enhancement**: Complete 2012-2025 device compatibility with zero performance punishment
- **✅ Unified Design System**: Complete visual unification with consistent typography, spacing, and theming
- **✅ Unified Admin Dashboards**: Business Owner, HR, and SuperAdmin dashboards follow identical structure - Greeting → Metrics → Tabs → Quote
- **✅ Custom Domain**: file.fifo.systems configured with Firebase Hosting (SSL auto-provisioned)

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
- **Current Size**: 427 lines ✅
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
- **Follow `AWARD_WINNING_UX_DESIGN_LANGUAGE.md`** for all modals, wizards, and interactive features
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
- **`AWARD_WINNING_UX_DESIGN_LANGUAGE.md`** - **⭐ MASTER REFERENCE** - Award-winning UX patterns, accessibility (WCAG AA/AAA), mobile-first, micro-interactions, data safety, visual progress. **ALL new modals/wizards MUST follow this spec.**
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

### **🔬 Priority 1: Research Unified Warning/Counselling System (Session 48)**

**Context**: Client template shows unified approach - every warning includes corrective counselling sections within the same form.

**Client Template Structure** (`hqkob_Scan_Itec25060912130.pdf`):
- (A) Details and Nature of Misconduct
- (B) Employee's version (their side of story)
- (C) Required/Expected behavior/Performance/Conduct/Standards (corrective guidance)
- (D) Disciplinary Action (tick box: First/Second/Final/Suspension/Dismissal)
- (E) Facts Leading to Decision Taken
- (F) Action Steps (employee commits to improve conduct/performance)
- Review Date, Signatures, Validity period

**Key Insight**: Sections (C) and (F) are essentially corrective counselling WITHIN the warning - not separate.

**Research Required** (Use Opus agents):
1. **Current Architecture Analysis**: How are counselling and warnings separated today?
   - Find all counselling-related components, services, types
   - Analyze `UnifiedCorrectiveCounselling` component and data structure
   - How does counselling differ from warnings in database?
   - User flow for recording counselling vs issuing warnings
2. **Current Warning Wizard Analysis**: What fields do we already capture?
   - Does EnhancedWarningWizard capture "expected behavior" (like section C)?
   - Do we capture "action steps/improvement commitments" (like section F)?
   - Do we capture "employee's version" (like section B)?
3. **Gap Analysis**: What's missing from our warnings to match client template?
4. **Impact Assessment**: Components, services, types, database changes needed
5. **Migration Complexity**: Files affected, data migration, routing changes
6. **Recommendation**: Should we merge? Support both models? Architectural options?

**Deliverable**: Comprehensive analysis document with architecture map, gap analysis, impact assessment, and recommendations.

**Status**: ⏳ Next session - Do NOT implement, research only

---

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

**For complete change history, see `RECENT_UPDATES.md` (Sessions 20-48) and `SESSION_HISTORY.md` (Sessions 5-19)**

### Most Recent (Session 51 - 2025-12-02)
- **🎉 AUDIO RECORDING ENHANCEMENTS**:
  - ✅ Organization-level toggle for business owners to enable/disable audio recording
  - ✅ Toggle in Warning Categories tab (executive-management/super-user only)
  - ✅ Waveform visualization - Spotify-style animated frequency bars during playback
  - ✅ Compression optimization - 24kbps/16kHz for clearer speech (was 16kbps/8kHz)
- **🎉 LRA RECOMMENDATION BUG FIX**:
  - ✅ Fixed race condition where wrong category name appeared in recommendation
  - ✅ Root cause: `selectedCategory` state was stale when `generateLRARecommendation` ran
  - ✅ Fix: Look up category directly from `categories` array using `formData.categoryId`
- **🎉 WRITING TIPS CLEANUP**:
  - ✅ Removed redundant static "Tip:" box from Incident Details form
  - ✅ Removed naive keyword-based Writing Assistance suggestions
  - ✅ Kept only word count badge (genuinely useful validation)
- **🎉 CONSISTENT WORD COUNT VALIDATION**:
  - ✅ All textareas now use 6 words minimum (was 20 characters for some)
  - ✅ Added `getWordCount()` helper function for clean reuse
  - ✅ Red border/background when started typing but < 6 words
  - ✅ Green checkmark when ≥ 6 words
- **UX Improvements**:
  - ✅ Welcome modal now appears immediately (removed 2-second delay)
  - ✅ Active warnings in Phase 2 now visually clickable (card styling, ChevronRight icon)
- **Files Modified**:
  - `UnifiedWarningWizard.tsx` - Audio toggle, LRA fix, word count validation
  - `IncidentDetailsForm.tsx` - Simplified writing tips, word count only
  - `OrganizationCategoriesViewer.tsx` - Audio recording toggle UI
  - `AudioWaveform.tsx` (NEW) - Web Audio API waveform visualization
  - `AudioPlaybackWidget.tsx` - Integrated waveform component
  - `useAudioRecording.ts` - Updated compression settings
  - `core.ts`, `organization.ts` - Added `enableAudioRecording` type
  - `MainLayout.tsx` - Removed welcome modal delay
- **Build & Deploy**: ✅ Success
- **Status**: ✅ Complete - Audio features, validation consistency, UX polish

### Previous (Session 50 - 2025-12-01)
- **🎉 LRA RECOMMENDATION LOADING SPINNER**: Fixed skeleton loader not showing during category analysis
- **🎉 SIGNATURE PAD FIXES**: Canvas sizing, stroke styles, timestamp+initials burn-in
- See `RECENT_UPDATES.md` for full details

### Previous (Session 49 - 2025-11-28)
- **🎉 AWARD-WINNING UX IMPLEMENTATION**: Complete UX overhaul for UnifiedWarningWizard
- See `RECENT_UPDATES.md` for full details on accessibility, mobile-first, micro-interactions

### Previous (Session 48 - 2025-11-11)
- **🎉 PDF PROFESSIONAL STANDARD IMPROVEMENTS & MULTILINGUAL ALIGNMENT**: Enhanced warning document quality and wizard-PDF synchronization
- **PDF Formatting Fixes**:
  - ✅ Enhanced `wrapText()` to handle newlines (`\n`) for proper paragraph/bullet structure
  - ✅ Fixed orphaned section headers (heading + content now stay together on same page)
  - ✅ Increased line spacing from 4mm to 5mm for better readability
  - ✅ Dynamic Consequences box sizing based on content
- **Professional Document Improvements**:
  - ✅ Removed redundant intro text from 3 corrective discussion sections
  - ✅ Reordered sections for logical flow (facts-leading-to-decision moved after employee statement)
  - ✅ Simplified Review Date section (heading: "FOLLOW-UP REVIEW")
  - ✅ Streamlined Consequences section with clear, concise language
  - ✅ Consolidated Employee Rights to 2 subsections (removed "What Happens Next" redundancy)
  - ✅ Disabled Appeal History section (details not in script)
- **Wizard-PDF Alignment ("Less is More" Philosophy)**:
  - ✅ Simplified all 11 SA language warning scripts - removed verbose legal language
  - ✅ Added missing LRA-compliant representation right: "You may have a fellow employee or shop steward represent you"
  - ✅ Aligned consequences statement: "Further misconduct will result in additional discipline, including formal hearings, up to ending of service. All unexpired warnings accumulate."
  - ✅ PDF template now perfectly reflects what's communicated during warning wizard
- **All 11 South African Languages Updated** (EN, AF, ZU, XH, ST, TS, VE, SS, TN, NR, NS):
  - ✅ Concise consequences statements
  - ✅ Representation right added to all languages
  - ✅ Consistent "ending of service" terminology
- **Files Modified**: 3 files
  - `PDFGenerationService.ts` - Text wrapping, orphaned headers, spacing improvements
  - `PDFTemplateService.ts` - Removed redundancy, reordered sections, simplified language
  - `MultiLanguageWarningScript.tsx` - Updated all 11 languages with concise scripts
- **Build & Deploy**: ✅ Success (16.26s)
- **Status**: ✅ Complete - Warning documents are clearer, more concise, and legally compliant across all 11 SA languages

### Previous Session (Session 47 Part 1 - 2025-11-09)
- **🎉 CRITICAL FIX: HOD Managers Can Now Submit Absence Reports & Counselling Sessions**
- **Root Cause**: Firestore security rules only allowed HR managers to write to `organizations/{orgId}/reports` collection
- **The Fix**:
  - ✅ Changed Firestore rule from `isHRManager()` to `isManager()` for reports collection
  - ✅ Now allows all manager types (executive-management, hr-manager, hod-manager, department-manager) to create reports
  - ✅ Deployed updated Firestore rules to production
- **Code Cleanup**:
  - ✅ Removed all debugging console.logs from UnifiedReportAbsence and UnifiedCorrectiveCounselling
  - ✅ Improved `isFormValid()` to explicitly return boolean with `!!` operator
- **🎉 READ-ONLY EMPLOYEE MANAGEMENT FOR EXECUTIVE DASHBOARD**:
  - ✅ Added `readOnly` prop to EmployeeManagement and EmployeeTableBrowser components
  - ✅ Executive Management dashboard now shows employees in read-only mode (no Edit/Archive buttons)
  - ✅ HR Manager dashboard retains full CRUD permissions for employee management
  - ✅ Same user gets different permissions based on which dashboard they're accessing from
- **Files Modified**:
  - `config/firestore.rules` (line 772) - Security rule fix
  - `frontend/src/components/absences/UnifiedReportAbsence.tsx` - Cleanup
  - `frontend/src/components/counselling/UnifiedCorrectiveCounselling.tsx` - Cleanup
  - `frontend/src/components/employees/EmployeeManagement.tsx` - Added readOnly prop
  - `frontend/src/components/employees/EmployeeTableBrowser.tsx` - Hide actions when readOnly
  - `frontend/src/components/dashboard/ExecutiveManagementDashboardSection.tsx` - Pass readOnly={true}
- **Status**: ✅ Complete - Absence/counselling fixed, executive dashboard now read-only for employees
- **Deployment**: ✅ Frontend built and deployed, Firestore rules deployed

### Previous Recent (Session 45 - 2025-11-06)
- **🎉 PROMOTE TO MANAGER MODAL REDESIGN**: Complete UX overhaul for compact, modern employee promotion workflow
- **Modal Simplification**:
  - ✅ Changed from 'lg' to 'sm' size - significantly smaller footprint
  - ✅ Removed redundant search input, replaced with dynamic autocomplete search
  - ✅ Search icon in input, real-time filtered results dropdown
  - ✅ Selected employee display with "Change" button
  - ✅ Click-outside to close results
- **Role Selection Modernization**:
  - ✅ Removed large button blocks for HOD/HR selection
  - ✅ Replaced with minimal radio buttons (10px text) on right side of label
  - ✅ Dramatically reduced visual prominence (was taking up 30% of modal)
  - ✅ HOD defaults to selected (most common use case)
- **Department Assignment UX**:
  - ✅ Changed from multi-select dropdown to checkbox list
  - ✅ Visible checkboxes for clear multi-selection feedback
  - ✅ Hover effects on department rows
  - ✅ Compact spacing (max-h-24, scrollable)
  - ✅ Only shows when HOD role selected
- **Typography Hierarchy**:
  - ✅ Section labels: 11px, uppercase, semibold, tracking-wide
  - ✅ Required/optional hints: 10px, gray-400
  - ✅ Role selector: 10px, subtle positioning
  - ✅ Clear visual hierarchy throughout
  - ✅ Proper spacing: mb-3 between sections, pt-3 mt-3 for buttons
- **Button Improvements**:
  - ✅ Fixed CSS conflict with modal-system.css button styles
  - ✅ Used modal-footer__button classes to prevent padding override
  - ✅ Equal width buttons with inline flex: 1 style
- **Files Modified**:
  - `frontend/src/components/managers/PromoteToManagerModal.tsx` (complete redesign - 349 lines)
  - Removed Mail, UserPlus, CheckCircle, X, ChevronDown unused imports
  - Added Search icon and dynamic filtering logic
- **Build & Deploy**: ✅ Success - Deployed to production
- **Status**: ✅ Complete - Professional, compact, modern modal with excellent UX

### Previous Recent (Session 44 - 2025-11-04)
- **🎉 HOD DASHBOARD MIGRATION TO DASHBOARDSHELL**: Completed dashboard consistency refactoring - all 3 main dashboards now use unified layout
- **Console Logging Fixes**: Fixed mysterious numeric logs with descriptive messages
- **Accessibility Improvements**: Added autocomplete attributes to login form

### Most Recent (Session 48 - 2025-11-21)
- **🎉 UNIFIED WARNING WIZARD**: Complete 10-phase wizard replacing old 4-step EnhancedWarningWizard
  - ✅ Phase 1: Employee Selection
  - ✅ Phase 2: Category & LRA Recommendation (with clickable warning history)
  - ✅ Phase 3: Incident Details (auto-fill SA timezone time)
  - ✅ Phase 4: Employee Response
  - ✅ Phase 5: Expected Standards
  - ✅ Phase 6: Improvement Plan
  - ✅ Phase 7: Review Documentation
  - ✅ Phase 8: Script & PDF Review (with acknowledgment)
  - ✅ Phase 9: Signatures (manager → PDF preview → employee views → employee signs)
  - ✅ Phase 10: Delivery (Email/WhatsApp/Print/QR Code)
- **Key Features**:
  - ✅ Compact progress bar (replaced 10-dot indicator)
  - ✅ SA timezone auto-fill for incident time
  - ✅ Clickable active warnings with details modal
  - ✅ PDF preview before employee signature (sees manager signature on doc)
  - ✅ QR Code delivery with instant PDF generation
  - ✅ Proper Firestore data structure for API.warnings.create
- **Files Modified**:
  - `UnifiedWarningWizard.tsx` - Complete 10-phase wizard (1600+ lines)
  - `PhaseProgress.tsx` - Compact progress bar component
  - `QRCodeDownloadModal.tsx` - QR delivery integration
- **Build & Deploy**: ✅ Complete
- **Status**: ✅ Production-ready unified warning wizard

### Previous Session (Session 47 - 2025-11-10/11)
- **🎉 SYSTEM-WIDE IMPROVEMENTS FOR INSITU PROJECTS & ALL CLIENTS**: 5 major improvements for legal compliance
- **See RECENT_UPDATES.md for Session 46-47 details**

### Previous Sessions Summary (41-47)
- **Session 47**: System-wide improvements (ending of service terminology, validity display, code of conduct references)
- **Session 46**: Warning wizard auto-advance fix, audio metadata, QR code delivery, custom domain setup
- **Session 45**: Promote to Manager Modal Redesign (compact autocomplete search)
- **Session 44**: HOD Dashboard migration to DashboardShell
- **Session 43**: Department management UX improvements
- **Session 42**: business-owner → executive-management role migration
- **Session 41**: Welcome modal optimization & deployment performance

**For complete session history, see:**
- `RECENT_UPDATES.md` - Sessions 20-48 (current)
- `SESSION_HISTORY.md` - Sessions 5-19 (archived)

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, **unified professional design system** across all components with **consistent inline tab UX across all dashboards**, **unified DashboardShell component** powering all 3 main dashboards (HR, Executive Management, HOD), **WCAG AA accessibility compliance**, **versioned PDF generation for legal compliance**, **per-organization PDF template customization**, **1000x storage reduction through centralized template version management**, **fully editable PDF text content with zero hardcoded fallbacks**, **SA-optimized employee CSV import with automatic phone number formatting**, **multi-manager support with array-based employee assignments**, **professional compact welcome modals**, **executive-management role** for inclusive senior leadership, **modern autocomplete employee search**, **SVG signature system with 90%+ storage savings**, **complete witness signature support**, **PDF preview & acknowledgment** ensuring employees see what they sign, **real-time LRA analysis** for instant step transitions, and **10-phase unified warning wizard** with structured corrective discussion workflow.*

*Last Updated: 2025-12-02 - Session 51: Audio recording toggle & waveform, LRA category fix, word count validation consistency*
