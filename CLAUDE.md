# CLAUDE.md

Essential guidance for Claude Code when working with this HR Disciplinary System repository.

## Lessons
- Review `lessons.md` at the start of each session
- After any correction from Riaan, record the pattern in `lessons.md`
- Format: `[date] What went wrong → What to do instead`

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
- **✅ Landing Page**: `frontend/public/landing.html` — dark-themed marketing page served at `/` via Firebase rewrite. Tailwind CDN, no build step. Login/trial CTAs link to `/login`. Has its own CSP header in `firebase.json`.
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
- **Backend**: Firebase Cloud Functions (Node.js 22, 2nd Gen) + Firestore + Storage
- **SDK versions**: `firebase-admin` ^13.x, `firebase-functions` ^7.x (all functions on v2 API)
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
5. **Firestore indexes**: Add required composite indexes to `firestore.indexes.json` when you introduce a new query that needs them. Riaan deploys them via `firebase deploy --only firestore:indexes`. Don't run that deploy yourself unless asked.

### 📏 Documentation Maintenance

**IMPORTANT**: This file is size-limited to maintain context efficiency.

- **Size Limit**: 500 lines maximum (target: 400-470 lines)
- **Current Size**: 538 lines ⚠️ (over 500-line target — move oldest "Most Recent" entry to RECENT_UPDATES.md before next session)
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
- **Warning Wizard**: `warnings/enhanced/UnifiedWarningWizard.tsx` (v1, 10-phase) is the **production default**. `warnings/v2/UnifiedWarningWizardV2.tsx` (6-phase) is the **active migration target / next-gen wizard** — wired into HODDashboardSection behind a "Beta" CTA; not yet the production cutover. New mobile/UX work goes into v2.
- **Core Types**: `frontend/src/types/core.ts`, `frontend/src/types/employee.ts`
- **PDF System**: `PDFGenerationService.ts`, `PDFTemplateVersionService.ts`, `pdfDataTransformer.ts` - See `PDF_SYSTEM_ARCHITECTURE.md`
- **Services**: `DatabaseShardingService.ts`, `ShardedDataService.ts`, `AdminDataService.ts`, `WarningService.ts`
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
- `docs/archive/MODAL_FIXES_IMPLEMENTATION.md` - **✅ Week 1 Complete** - Body scroll prevention hook, standardized z-index (9000-9999), all 19 modals updated
- `docs/archive/MODAL_WEEK_2_3_IMPLEMENTATION.md` - **✅ Week 2-3 Complete** - Focus trap hook, ARIA labels, scroll strategy standardization, comprehensive usage guidelines
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

**✅ Completed**: Deploy Functions, Enhanced User Creation, Bulk Employee-Manager Assignment, Print & Hand Delivery

**Pending**:
- Test Historical Warning Entry (60-day countdown, urgency indicators)
- Test Employee Management Fixes (HOD team view, employee edit after promotion)
- Test Department System (real-time counts, default departments)
- **Test Employee Response Link Flow** (generate → view PDF → submit → HR email notification)

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

### Most Recent (Node 22 + firebase-functions v7 upgrade, 2026-05-19)
- **✅ Cloud Functions runtime bumped Node 20 → 22** ahead of the 2026-10-30 decommission deadline. All 47 functions redeployed on `nodejs22` / 2nd Gen.
- **✅ SDK bump**: `firebase-functions` 4.9.0 → 7.2.5; `firebase-admin` 11.x → 13.10.0. All deploy warnings about deprecated/outdated SDKs are gone.
- **✅ Full v1 → v2 migration of 3 residual files**: `timeService.ts`, `audioCleanup.ts`, `temporaryDownload.ts`. Removed manual CORS middleware + manual `CallableContext` shimming inside `onRequest` handlers.
- **Migration gotcha**: `firebase functions:delete` required for the 12 functions previously deployed as 1st gen — `firebase deploy` refuses to upgrade gen in-place. After delete+recreate, public IAM had to be set explicitly via `gcloud run services add-iam-policy-binding ... --member=allUsers --role=roles/run.invoker`. Recorded in `lessons.md`.
- **Post-deploy audit catch**: 3 functions (`deliverWarningByEmail`, `uploadResponseEvidence`, `notifyHROnAppeal`) hit CPU-quota during deploy; `firebase functions:list` listed them as `nodejs22` but `gcloud run services describe` showed them still serving 9-day-old Node 20 revisions. Re-deployed those three explicitly; now `Ready=True` on the new revisions. Verification pattern recorded in `lessons.md` — always cross-check Cloud Run service state after deploys with partial failures.

### Previous (Pre-Launch Cleanup, 2026-05-11)
Phase 2 (architectural debt), Phase 4 (ESLint + console scrub), Phase 5 (docs hygiene) shipped over Sessions 68–73. tsc 903 → 647 (-28%), ~10,000 LOC removed/relocated. `DataService` decomposed into `ShardedDataService` + `AdminDataService`; `EmployeeService`, `DataServiceV2`, `NestedDataService`, `CategoryService` deleted; types unified to `types/core.ts`; 7 oversized components decomposed; PDF generator 4,135→958 LOC with byte-identical v1.0.0/v1.1.0 preservation; `Logger` now sanitises all production logging; 12 real react-hooks/rules-of-hooks bugs fixed; `npm run lint` clean. Full detail in `RECENT_UPDATES.md`.

### Previous (Session 67 - 2026-04-24)
- **✅ Reseller demo organizations** — Resellers can deploy pre-populated demo orgs for prospect testing, separate from paying-client lifecycle
- **Backend**: 4 new Cloud Functions in `functions/src/Reseller/demoManagement.ts` — `deployDemoOrganization`, `createDemoProspectLogin`, `resetDemoOrganization`, `deleteDemoOrganization`. Max 5 concurrent demos per reseller (separate quota from real deployments). Seed data in `demoSeedData.ts` (10 canonical SA employees) and `demoCategories.ts` (8 LRA categories)
- **Frontend**: `ResellerDemoService.ts` + 5 new components under `components/reseller/demos/` (MyDemos list + 4 modals). New "My Demos" tab on ResellerDashboard, desktop + mobile
- **Org schema**: Added `isDemo?: boolean` and `demoMetadata?: { resellerId, createdAt, lastResetAt, resetCount, activeProspectLoginIds }` to `Organization`. Added `resellerId` + `isDemoProspect` to `User`. Added `'reseller'` to `UserRoleId` (fixed pre-existing type gap)
- **Safety rails**: Persistent amber `DEMO ORGANIZATION` banner in MainLayout. `AdminDataService.getResellerClients` filters out `isDemo: true`. Cron/trigger guards added to `reviewFollowUpCron.ts`, `warningDelivery.ts`, and `notifyHROnAppeal.ts` so demo orgs never generate SendGrid bounces on fake `@demo.local` addresses
- **Indexes deployed**: `organizations (resellerId, isDemo)` and `organizations (resellerId, isDemo, isActive)` in `config/firestore.indexes.json`
- **Reset semantics**: Full re-seed to pristine template — wipes warnings, evidence, response tokens, prospect logins, employees, departments; re-seeds the 10 canonical employees + Operations/Admin departments. Reset count is tracked

### Previous Sessions (52-66)
See `RECENT_UPDATES.md` for detailed session history including Sessions 57-66.

**For complete session history, see:**
- `RECENT_UPDATES.md` - Sessions 20-63 (current)
- `SESSION_HISTORY.md` - Sessions 5-19 (archived)
- `legal/BUSINESS_LAUNCH_TRACKER.md` - Company formation & go-to-market progress

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ org scalability, progressive enhancement for 2012-2025 devices, **unified design system**, **DashboardShell** across all dashboards, **WCAG AA compliance**, **versioned PDF generation**, **per-org PDF templates**, **SVG signatures**, **10-phase unified warning wizard**, **link-based employee response/appeal system** with token auth and PDF viewing, **HR email notifications via SendGrid**, **evidence upload on appeals with client-side image optimization**, **per-organization multi-dashboard theming** (Manager, HR, Executive views with per-view metric card colors), **optimized warning data loading with staleness detection**, **session guard with auto-logout + forced app updates**, and **CCMA-ready PDFs with section labels, continuation headers, electronic signature notation, and page initials**.*

*Last Updated: 2026-05-19 - Cloud Functions Node 22 + firebase-functions v7 + firebase-admin v13 upgrade; 3 residual v1 files fully migrated to v2.*

---

## FIFO Ops Integration

This project reports to **FIFO Ops** (ops.fifo.systems) for centralized task and context tracking across all FIFO Solutions projects.

### Reading from Ops
At session start, check `/home/aiguy/projects/fifo-ops/FIFO_OPS_STATE.md` for current business priorities and cross-project context.

### Writing to Ops
When working in this project, if you identify:
- Tasks that should be tracked in the central Ops dashboard
- Issues requiring Riaan's attention across projects
- Cross-project dependencies or blockers
- Important decisions or context other projects should know about

**Add them to the Outbox section below.** FIFO Ops will process these during its sync.

---

## Inbox from FIFO Ops
> Last updated: 2026-02-02

### ✅ COMPLETED: Appeal & Employee Response Enhancements (Session 57 - 2026-02-02)

All 3 gaps identified by HR practitioner feedback have been implemented and deployed:

- **✅ Gap 1: Link-Based Employee Response & Appeal** — `file.fifo.systems/respond/{token}`, 8 Cloud Functions, public page with response/appeal tabs, evidence upload, PDF viewing
- **✅ Gap 2: Evidence Upload on Appeals** — `EvidenceUploader` component in `AppealModal`, thumbnails in `AppealReviewModal`, Firebase Storage rules
- **✅ Gap 3: HR Email Notification** — `notifyHROnAppeal` Firestore trigger, SendGrid emails from `file@fifo.systems`
- **✅ Bonus: PDF Viewing** — Employees can view/print warning PDF from response link via signed URL

### FIFO Comms Policy (2026-02-17)

**Full spec:** `fifo-ops/docs/COMMS_HANDBOOK.md`

Two types of outbound email across FIFO — use these exact terms:

| Term | What | Who sends | How |
|------|------|----------|-----|
| **App Email** | Single-recipient, triggered by a user's action | This app | SendGrid, `file@fifo.systems` |
| **Ops Broadcast** | Multi-recipient, business decision | FIFO Ops | Brevo SMTP, `riaan@fifo.systems`, Riaan approves |

**This app's App Emails (you own these — template, logic, sending):**
- HR notification when employee appeals (`notifyHROnAppeal` Cloud Function)
- Warning delivery emails to employees
- Password resets, account verification
- Any future single-recipient transactional emails

**Ops Broadcasts (do NOT build — flag via outbox):**
- Legal page updates (ToS, Privacy Policy for File by FIFO)
- Feature announcements to all File tenants
- Pricing/billing changes, maintenance notices

**To request an Ops Broadcast:** Add `[OPS-BROADCAST]` to outbox with subject, body, and recipients.

### Email Architecture (2026-01-29)
- **Sending**: SendGrid, domain-verified. Send from `file@fifo.systems`.
- **Receiving**: Cloudflare Email Routing → Gmail.
- No Google Workspace needed.

### Remaining HR Practitioner Feedback (from Adam's colleague, 2 Feb)

Gaps 1-3 are done. These 2 remain from the same feedback session:

#### Gap 4: Manager Evidence Upload During Warning Creation — ✅ ALREADY IMPLEMENTED
**Session 62 Investigation:** Evidence upload IS wired in `UnifiedWarningWizard` (the active wizard). Ops' report was based on `EnhancedWarningWizard` (legacy, unused). Needs end-to-end testing only.
- `frontend/src/components/common/EvidenceUploader.tsx` -- already built, just import and render
- `frontend/src/types/warning.ts` line 342 -- `evidenceItems: EvidenceItem[]` already in form data type
- Ensure evidence is saved to Firestore with the warning and rendered in the review/PDF steps

#### Gap 5: Pre-Populated Expected Behavior Standards from Warning Categories
**Problem:** Phase 4 (EXPECTED_STANDARDS) is an empty textarea every time. Manager types from scratch. The `WarningCategory` type has no field for standard templates. This causes inconsistency, wasted time, and compliance risk.

**Fix (Riaan's idea):** Add an `expectedStandardsTemplate` field to `WarningCategory`. Configure it on the **same admin screen where warning categories are managed** -- since categories are already custom per organisation, the expected standards template belongs right there alongside the category name, severity, and escalation path.

**Implementation:**
1. Add `expectedStandardsTemplate?: string` field to `WarningCategory` type in `frontend/src/types/core.ts`
2. Add a textarea for "Default Expected Standards" on the warning category admin/edit screen (wherever categories are configured)
3. In the warning wizard, when a category is selected (Phase 1 `onCategorySelect` handler in `UnifiedWarningWizard.tsx` ~line 894), populate `expectedBehavior` state from `category.expectedStandardsTemplate` if it exists
4. Manager can still edit the pre-filled text for the specific warning -- it's a starting point, not locked
5. Update Firestore schema for `warningCategories` collection to include the new field

**UX:** When a company sets up their categories (e.g. "Late Attendance"), they also write the expected standard template (e.g. "Employees must report for duty at their scheduled start time and notify their manager before shift start if unable to attend"). This gets auto-filled into every warning in that category. Manager can tweak per incident.

### Gap 4: RESOLVED — Ops investigated wrong wizard (Session 62)
> Investigated 2026-02-11

**Ops' report was based on `EnhancedWarningWizard` + `CombinedIncidentStepV2` (legacy code, NOT used in production).** The active wizard `UnifiedWarningWizard` has evidence fully wired:
- `pendingEvidenceItems` state (line 276)
- All 3 evidence props passed to `IncidentDetailsForm` in Phase 2 (lines 1028-1037)
- Post-save batch upload to Firebase Storage (lines 827-860)
- Firestore persistence of `evidenceItems` array on warning document
- UI file count badge (lines 1423-1430)

**Status:** Needs end-to-end testing only (attach file → complete warning → verify in Storage/Firestore).

### Gap 5: Confirmed working — just needs testing
> Updated by FIFO Ops, 2026-02-09

Ops code review confirmed Gap 5 IS fully implemented: type definitions, AdminDataService merge logic, admin UI textarea, auto-population in `UnifiedWarningWizard.tsx` on category select, info badge. Just needs end-to-end testing with real category data.

### Active Tasks for This Project
- [HIGH] Schedule 4-5 demo calls with HR professionals for File by FIFO (Riaan is handling outreach)
- [DONE - NEEDS TESTING] Manager evidence upload in warning wizard (Gap 4) ✅ Was already working in UnifiedWarningWizard — Ops checked legacy code
- [DONE - NEEDS TESTING] Pre-populated expected standards from warning categories (Gap 5) ✅ Confirmed working
- [DONE] ~~Implement link-based employee response/appeal system (Gap 1)~~ ✅ Session 57
- [DONE] ~~Add evidence upload to AppealModal (Gap 2)~~ ✅ Session 57
- [DONE] ~~Add HR email notification on appeal submission (Gap 3)~~ ✅ Session 57
- [MEDIUM] Draft WhatsApp outreach message for File by FIFO
- [MEDIUM] Test complete response link flow end-to-end (generate link → view PDF → submit response → HR notification)

### Context
- No paying clients yet. 0 MRR.
- Riaan approached his network but they're slow to respond.
- Product is production-ready and polished -- just needs clients.
- Real HR practitioner feedback received (via Adam's colleague) -- see gaps above.
- Insitu Construction (Michelle Pedersen) is the closest to first client -- needs onsite visit to onboard.

---

## Outbox for FIFO Ops

<!--
Add notes for FIFO Ops here. Format:
- [DATE] [PROJECT: file] [PRIORITY: low/medium/high] Description

Items will be processed and removed by FIFO Ops sync.
-->

<!--
- [2026-06-03] [PROJECT: file] [PRIORITY: high] BILLING-MODEL PIVOT. Built-in Stripe card billing removed from File (Tier 0 — billing.ts + frontend StripeService.ts deleted; checkout/portal/webhook/processMonthlyCommissions gone). Riaan is switching to manual ANNUAL / SEMI-ANNUAL invoicing (monthly = too much admin). NEW PROJECT to scope: where invoicing lives — strong candidate is Fin by FIFO / `invoiced`. Note: reseller commission CREATION now relies on the manual `CommissionService.recordClientPayment` path (FinancialDashboard) until an invoicing flow exists; commission DISPLAY/reporting is unaffected. Org creation already auto-activates (never depended on Stripe).
-->


<!-- Processed by FIFO Ops on 2026-02-02:
- All 5 HR practitioner feedback gaps COMPLETED (Sessions 57-58)
- Gap 1: link-based response, Gap 2: evidence on appeals, Gap 3: HR email notification
- Gap 4: manager evidence in wizard, Gap 5: expected standards templates
- SendGrid API key configured for file@fifo.systems — domain verification to be confirmed
- End-to-end testing needed: Riaan should test response link flow with a real warning
-->

<!-- Processed by FIFO Ops on 2026-02-11: Gap 4 correction acknowledged. Ops investigated legacy wizard by mistake. Active wizard (UnifiedWarningWizard) has evidence fully wired. Both gaps confirmed done. -->

<!--
- [2026-06-03] [PROJECT: file] [PRIORITY: high] Pre-mass-production audit completed — see PRE_LAUNCH_AUDIT_2026-06.md. Verdict: GO for first ~50 clients after 3 small Tier 0 fixes; not yet tuned for 2,700 orgs (well-understood Tier 2 work).
- [2026-06-03] [PROJECT: file] [PRIORITY: high] Tier 0 pre-launch fixes (do before first paying client, ~1 day): (0.1) TEMP_LINK_SECRET defaults to hardcoded predictable string in functions/src/temporaryDownload.ts:58 — move to Secret Manager; (0.2) remove Stripe secret/webhook fallbacks in billing.ts + verify webhook signature before taking real money; (0.3) getHREmails() reads legacy global users collection — repoint to sharded path.
- [2026-06-03] [PROJECT: file] [PRIORITY: medium] Headline vision gap: app is responsive, not truly mobile-first. Tier 1.1 in audit doc — mobile-first the 3-4 hot-path screens at 320px on real low-end Android.
-->

