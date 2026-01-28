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
- **Current Size**: 469 lines ✅
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

### **🚀 Priority 0: FIFO Business Launch (Session 54 - 2026-01-26)**

**STATUS: COMPANY REGISTERED ✅ — Ready for first client**

#### Company Details
- **Company Name**: FIFO Solutions (Pty) Ltd
- **Enterprise Number**: 2026/071559/07
- **Registration Date**: 2026-01-26
- **Director**: Riaan Potas (sole director)
- **Bank**: Capitec Business (selected, awaiting account setup)

#### Pricing Model (Current - Adam's Proposal)

**Commission Split**: 50% Reseller → 30% Owner (Riaan) → 20% File Operations

| Tier | Employees | Annual | Setup | Reseller 50% | Per Emp/Month |
|------|-----------|--------|-------|--------------|---------------|
| 1 | 0-20 | R5,000 | R1,000 | R2,500/yr | R41.70 ✅ |
| 2 | 21-50 | R8,000 | R1,500 | R4,000/yr | R19.05 ⚠️ |
| 3 | 51-100 | R12,000 | R2,500 | R6,000/yr | R13.33 ⚠️ |
| 4 | 101-300 | R15,000 | R2,500 | R7,500/yr | R6.25 ❌ |
| 5 | 301-500 | R20,000 | R2,500 | R10,000/yr | R4.17 ❌ |
| 6 | 500+ | R25,000 | R2,500 | R12,500/yr | R3.47 ❌ |

#### ⚠️ IMPORTANT: Pricing Review Required

**Analysis (Session 54):** Adam's pricing is fine for Tier 1-2 (market rate) but **leaves significant money on table for Tiers 4-6**. Competitors charge R24-R50/employee/month. A 200-employee company paying R15,000/year (R6.25/emp) is 77% cheaper than Sage HR.

**Recommendation:**
- Keep Tiers 1-3 for market entry (first 50 clients)
- After proving model, introduce "2026 pricing" for new customers:
  - Tier 4: R25,000-R30,000 (not R15,000)
  - Tier 5: R35,000-R45,000 (not R20,000)
  - Tier 6: R50,000-R60,000 (not R25,000)

**Revenue Impact:** Same 300 clients with adjusted Tier 4-6 = +R360,000/year more for you.

**Decision:** Discuss with Adam. Option to grandfather early clients at current rates.

#### ✅ Completed
- ✅ **Company Registered** - FIFO Solutions (Pty) Ltd (2026/071559/07)
- ✅ **Name Reserved** - Approved 2026-01-12
- ✅ **Bank Selected** - Capitec Business (low fees, best app)
- ✅ **Legal Documents** - All ready in `legal/` folder
- ✅ **Marketing Materials** - Complete sales toolkit in `marketing/` folder
- ✅ **NotebookLM Content** - 3 videos created, slides & infographic sources ready

#### ⏳ Next Steps (Priority Order)
1. **Download CIPC docs** - MOI, registration cert (wait for director status to sync)
2. **Capitec account setup** - They will contact you
3. **SARS registration** - Tax number needed to invoice clients
4. **Sign reseller agreement** - Adam ready to go
5. **Onboard first client** - Adam has leads
6. **Review pricing with Adam** - Consider raising Tiers 4-6 for future clients

#### 🎯 Go-To-Market Strategy: HR Consultants as Resellers

**Validated approach (Session 54):** Target independent HR consultants/representatives as resellers.

**Why it works:**
- They manage 10-50 employer clients each
- They experience the "no documentation" pain weekly (CCMA frustration)
- They have existing trust relationships (warm intros, not cold sales)
- File makes their job easier + they earn 50% passive income
- ~3,000-5,000 independent HR consultants in SA (SABPP data)

**Market size:**
- 52,000 unfair dismissal cases/year at CCMA
- 50,000+ target businesses (10-500 employees, formal sector)
- <1% market penetration needed for R2.5M+ revenue

**Created content for recruiting HR consultant partners:**
- `hr-consultant-partner-pitch-short.md` - 2-min video source (NotebookLM)
- `hr-consultant-partner-pitch-long.md` - 7-min deep dive (NotebookLM)
- `hr-consultant-whatsapp-intro.md` - WhatsApp message templates

**Projection:** 25 resellers × 12 clients each = 300 clients = R2.6M revenue = R780K/year for you

#### Key Folders
| Folder | Contents |
|--------|----------|
| `legal/` | Terms of Service, Privacy Policy, Reseller Agreement |
| `marketing/sales/` | One-pager, pricing sheet, feature highlights |
| `marketing/sales/meeting-forms/` | Discovery form, quote calculator, order form, onboarding form, follow-up templates |
| `marketing/demo/` | Demo script, objection handling |
| `marketing/onboarding/` | Quick start, admin checklist, HOD training, FAQ |
| `marketing/audio-sources/` | Product overview, ROI deep-dive, manager training (for NotebookLM) |
| `marketing/notebooklm-sources/` | Slide deck, infographic, **HR consultant partner pitches** |
| `marketing/pdf/` | All materials converted to PDF |

---

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

**For complete change history, see `RECENT_UPDATES.md` (Sessions 20-52) and `SESSION_HISTORY.md` (Sessions 5-19)**

### Most Recent (Session 56 - 2026-01-27)
- **🐛 DASHBOARD TAB CONTENT BUG FIX**: Tab content not rendering on desktop
  - ✅ Issue: `DashboardShell.tsx` used `hidden lg:block` (≥1024px) but `isDesktop` was ≥768px
  - ✅ Screens 768-1024px got desktop layout but empty tab content
  - ✅ Fix: Removed `hidden lg:block` class - content renders via conditional `activeTab === tab.id`
- **🐛 DASHBOARD METRICS GRID FIX**: Cards stacking vertically instead of 2-column grid
  - ✅ Issue: Desktop used `grid-cols-1 lg:grid-cols-2` - single column on screens 768-1024px
  - ✅ Fix: Changed to `grid-cols-2 xl:grid-cols-4` - always 2 columns, 4 on wide screens
  - ✅ Applied to: DashboardShell, SuperAdminDashboard, ResellerDashboard
  - ✅ Now consistent with mobile view (which already used `grid-cols-2`)
- **📋 DEMO MATERIALS CREATED**: Bakery staff CSV for reseller demo
  - ✅ Created `legal/demo-bakery-staff.csv` with 12 bakery employees
  - ✅ Positions: Head Baker, Pastry Chef, Store Manager, Cake Decorator, etc.
  - ✅ Ready for CSV import demo with potential reseller
- **✅ VERIFIED**: Reseller dashboard and deploy client wizard ready for demo
- **Files Modified**:
  - `DashboardShell.tsx` - Tab content fix + metrics grid fix
  - `SuperAdminDashboard.tsx` - Metrics grid fix
  - `ResellerDashboard.tsx` - Metrics grid fix
- **Build & Deploy**: ✅ Success (19.23s build, deployed)

### Previous (Session 55 - 2026-01-27)
- **📄 MARKETING PDF OVERHAUL**: All PDFs reformatted for proper A4 display
- **⚖️ LEGAL DOCUMENTS**: Created PDFs and fixed company references
- **🏢 BUSINESS STRUCTURE CLARIFIED**: File by FIFO vs FIFO Solutions
- **Status**: ✅ All marketing & legal documents ready for business launch

### Previous (Session 54 - 2026-01-26)
- **🎉 COMMISSION SYSTEM FIXED**: Removed Stripe dependency, now works with SA payment methods
- **🎉 FINANCIAL DASHBOARD**: New SuperAdmin tab for recording payments
- **📝 FIN/FILE INTEGRATION**: Updated Fin's CLAUDE.md
- **Build & Deploy**: ✅ Success (19.2s build, deployed)

### Previous (Session 52 - 2025-12-10)
- **🎉 MOBILE UX FIXES**: 9 issues identified from user testing, all resolved
  - ✅ "Unknown" department → "No Department" in employee selection lists
  - ✅ Compact absence type list (reduced padding, smaller icons/text)
  - ✅ Supporting docs reminder added to Report Absence modal
  - ✅ Book HR Meeting buttons now visible on mobile (max-height constraint)
  - ✅ HR Meeting success message corrected ("HR will contact you directly")
  - ✅ Category dropdown no longer auto-focuses keyboard (removed autoFocus)
  - ✅ Review phase text now expands fully (removed line-clamp truncation)
  - ✅ Signature pad canvas fixed with ResizeObserver + minHeight
  - ✅ Save Warning button shows validation feedback when disabled
  - ✅ Hardware back button shows confirmation dialog instead of exiting app
- **Files Modified**:
  - `UnifiedReportAbsence.tsx` - Department fallback, compact list, docs reminder
  - `UnifiedBookHRMeeting.tsx` - Buttons visibility, success message
  - `CategorySelector.tsx` - Removed autoFocus
  - `UnifiedWarningWizard.tsx` - Text expansion, signature pad, save feedback, back button
- **Build & Deploy**: ✅ Success (16.82s)
- **Status**: ✅ Complete - All mobile UX issues resolved

### Previous Sessions (44-54)
See `RECENT_UPDATES.md` for detailed session history including:
- Session 54: Commission system fixed, FinancialDashboard
- Session 52: Mobile UX fixes (9 issues resolved)
- Session 51: Audio recording, LRA bug fix, word count validation
- Session 50: LRA loading spinner, signature pad fixes
- Session 49: Award-winning UX implementation
- Session 48: Unified 10-phase warning wizard, PDF improvements
- Session 47: System-wide legal compliance, read-only employee management
- Session 46: QR code delivery, custom domain setup
- Session 45: Promote to Manager Modal redesign
- Session 44: HOD Dashboard migration to DashboardShell

**For complete session history, see:**
- `RECENT_UPDATES.md` - Sessions 20-56 (current)
- `SESSION_HISTORY.md` - Sessions 5-19 (archived)
- `legal/BUSINESS_LAUNCH_TRACKER.md` - Company formation & go-to-market progress

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, **unified professional design system** across all components with **consistent inline tab UX across all dashboards**, **unified DashboardShell component** powering all 3 main dashboards (HR, Executive Management, HOD), **WCAG AA accessibility compliance**, **versioned PDF generation for legal compliance**, **per-organization PDF template customization**, **1000x storage reduction through centralized template version management**, **fully editable PDF text content with zero hardcoded fallbacks**, **SA-optimized employee CSV import with automatic phone number formatting**, **multi-manager support with array-based employee assignments**, **professional compact welcome modals**, **executive-management role** for inclusive senior leadership, **modern autocomplete employee search**, **SVG signature system with 90%+ storage savings**, **complete witness signature support**, **PDF preview & acknowledgment** ensuring employees see what they sign, **real-time LRA analysis** for instant step transitions, and **10-phase unified warning wizard** with structured corrective discussion workflow.*

*Last Updated: 2026-01-27 - Session 56: Dashboard tab content fix, metrics grid 2-column fix (all dashboards), demo bakery CSV created*
