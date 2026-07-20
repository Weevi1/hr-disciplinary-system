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

**This machine ("cat")**: the key file lives at the repo root and `gcloud` is already authenticated with it (`gcloud auth activate-service-account`, done 2026-07-17). `GOOGLE_APPLICATION_CREDENTIALS` is NOT exported in `~/.bashrc` — set it per-command if a tool needs it:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/cat/development/projects/hr-disciplinary-system/hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json"
```

**Verify it works**: `firebase projects:list`

**⚠️ Limits**: The service account can deploy/administer Firebase but has NO Cloud Monitoring permissions (can't create alert policies — see `MONITORING_SETUP.md`).
**⚠️ Security**: The service account JSON file is in `.gitignore` - never commit it.

### Current System Status
- **✅ Landing Page**: `frontend/public/landing.html` — dark-themed marketing page served at `/` via Firebase rewrite. Tailwind CDN, no build step. Login CTA → `/login`; "Book a Free Demo" CTAs → `#demo` lead form (POSTs to `submitDemoRequest` function → `leads` collection + email to Riaan). Has its own CSP header in `firebase.json` (allows the function origin in `connect-src`).
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
- **Current Size**: ~470 lines ✅ (2026-07-20 condensed older "Previous" session entries into pointers to `RECENT_UPDATES.md`)
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
- **Warning Wizard**: `warnings/v2/UnifiedWarningWizardV2.tsx` (intro + 5 steps) is the **production default** (V1 `enhanced/UnifiedWarningWizard.tsx` was retired/deleted 2026-06-03). It reuses phase components still living under `warnings/enhanced/phases/*` + `shared/*`. **Step 5 (Delivery)** = `enhanced/phases/DeliveryPhase.tsx` (rendered via `v2/phases/DeliveryPhaseV2.tsx`), with self-finalizing panels for Email/WhatsApp/Printed and a shared Finalize for QR.
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

### **🚀 Priority 0: FIFO Business Launch — GO TO MARKET (updated 2026-07-17)**

**Full detail (pricing tables, GTM strategy, checklists): `legal/BUSINESS_LAUNCH_TRACKER.md`**

- **Company**: FIFO Solutions (Pty) Ltd (2026/071559/07), registered 2026-01-26; Riaan sole director; Capitec Business bank.
- **Sales motion (July 2026)**: cold **email campaign** → landing-page demo-request form → manual onboarding; **direct invoicing + EFT** (no payment gateway — Stripe removed; use an external invoicing tool). HR-consultants-as-resellers remains the parallel channel (50% reseller / 30% Riaan / 20% ops split).
- **Pricing**: 6 annual tiers, R5,000–R25,000/yr + setup. ⚠️ Tiers 4-6 priced well below market (~R6.25/emp/mo vs competitors' R24-R50) — review with Adam before scaling; +R360k/yr upside at 300 clients.
- **⚠️ Campaign rule**: never send cold email from `file@fifo.systems` or the SendGrid transactional identity — its reputation carries legal warning-delivery emails. Use a separate warmed-up domain with SPF/DKIM/DMARC + POPIA §69 opt-out.

#### ⏳ Immediate pendings (updated 2026-07-20)
1. ~~Deploy the go-to-market hardening~~ ✅ **Deployed 2026-07-20** (functions + hosting + firestore:rules; all 41 functions live).
2. **Backend error alerting** — 5-min one-time setup with Riaan's owner account per `MONITORING_SETUP.md` (service account can't do it).
3. **Cloudflare purge of old service worker** — Riaan: Custom Purge `https://file.fifo.systems/sw.js` (Caching → Configuration → Purge Cache); until then existing users keep the retired caching worker.
4. **Dry-run a fake client end-to-end** — wizard → import → warning → all 4 delivery methods → respond link → appeal (also covers untested Gaps 4/5; can include the new setup-checklist/practice-warning flow).
5. SARS registration → invoice clients; sign reseller agreement with Adam; onboard first client (Insitu Construction closest).

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

### Most Recent (Launch-window session, 2026-07-20) — ✅ ALL DEPLOYED
- **Go-to-market hardening deployed** (functions + hosting + firestore:rules; `resetDemoOrganization` needed 3 retries — transient Cloud Run CPU-quota during mass deploys).
- **PWA cleanup**: caching `sw.js` replaced with a self-cleanup worker (keep deployed until old workers gone); SW registration removed; `manifest.json` `start_url` → `/dashboard`. ⏳ Riaan: Cloudflare purge of `/sw.js`.
- **Hosting cache headers**: catch-all `**` → no-cache before asset rules (later matching header block wins); hashed js/css immutable; images 1d. Fixes SPA routes being cached 1h and makes forced-update reliable.
- **Per-org feature toggles**: super-user ("Features" button per org) + reseller ("Features" tab) can disable `reportAbsence`/`hrMeetings`/`recognition`/`historicalWarnings`/`reviewFollowups` per org. `features` map on org doc — absent = enabled. Both dashboards + route guards (`FeatureProtectedRoute`); `constants/orgFeatures.ts`, `useOrgFeature`.
- **In-app help & guidance**: global Help & Support modal in profile dropdown (role quick-start from `config/roleContent.ts`, feature/permission-filtered "How do I…" from `config/helpTasks.ts`, `SUPPORT_EMAIL`); shared `InfoBanner`/`EmptyState`/`ExplainerPanel` components (PhaseGuidance now wraps InfoBanner); legal explainers at recommendation card, delivery methods, and appeal review (`constants/legalExplainers.ts`, `constants/appealGrounds.ts` — single source incl. per-ground `hrGuidance`); setup checklist extracted to `SetupChecklist.tsx` + new steps: review categories (new read-only Categories tab on HR dashboard) and practice warning (`/warnings/create?practice=1` → wizard `startInPracticeMode`; completion writes `setupSkipped.practiceWarning`). Existing orgs see the Getting Started card once more (one-click skip).
- Full detail in `RECENT_UPDATES.md`.

### Previous (Go-To-Market Hardening, 2026-07-17 — deployed 2026-07-20)
Onboarding wizard: crypto-random one-time admin password (no more `temp123`), shown once with copy button. Suspend kill-switch + trials: `subscriptionStatus` `active`/`trial`(+`trialEndsAt`)/`suspended` enforced in rules (`activeOrgMember()`) + MainLayout lock screen/trial banner; SuperAdmin Status column + Suspend/Reactivate. Lead capture: public `submitDemoRequest` → `leads` + email to Riaan; landing "Book a Demo" form. Respond endpoints throttled per-token 20/hr. Detail in `RECENT_UPDATES.md`.

### Previous (Step 5 delivery completed — WhatsApp + Printed, 2026-06-04)
All four Step 5 delivery methods functional (WhatsApp = wa.me + durable 180-day respond link; Printed = `awaiting_collection` + `notifyHRPrintedCollection`, HR completes via PrintDeliveryGuide); fixed `ReviewDashboard` writing `status` instead of `deliveryStatus`. Self-finalizing-panel pattern: Email/WhatsApp/Printed excluded from generic Finalize; only QR uses it. Deployed 2026-06-04. Detail in `RECENT_UPDATES.md`.

### Previous (Node 22 + firebase-functions v7 upgrade, 2026-05-19)
Runtime Node 20 → 22; `firebase-functions` → 7.2.5, `firebase-admin` → 13.x; 3 residual files migrated v1→v2. Gen-1→gen-2 in-place upgrade is blocked (delete+recreate + explicit public IAM). `firebase functions:list` reports configured runtime, not what's serving — cross-check `gcloud run services describe` after partial-failure deploys. Full detail + gotchas in `lessons.md` and `RECENT_UPDATES.md`.

### Previous Sessions (52-73, incl. Pre-Launch Cleanup 2026-05-11)
See `RECENT_UPDATES.md` for detailed session history.

**For complete session history, see:**
- `RECENT_UPDATES.md` - Sessions 20-63 (current)
- `SESSION_HISTORY.md` - Sessions 5-19 (archived)
- `legal/BUSINESS_LAUNCH_TRACKER.md` - Company formation & go-to-market progress

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ org scalability, progressive enhancement for 2012-2025 devices, **unified design system**, **DashboardShell** across all dashboards, **WCAG AA compliance**, **versioned PDF generation**, **per-org PDF templates**, **SVG signatures**, **10-phase unified warning wizard**, **link-based employee response/appeal system** with token auth and PDF viewing, **HR email notifications via SendGrid**, **evidence upload on appeals with client-side image optimization**, **per-organization multi-dashboard theming** (Manager, HR, Executive views with per-view metric card colors), **optimized warning data loading with staleness detection**, **session guard with auto-logout + forced app updates**, and **CCMA-ready PDFs with section labels, continuation headers, electronic signature notation, and page initials**.*

*Last Updated: 2026-07-20 - Launch-window session, all deployed: go-to-market hardening live, PWA caching SW retired + cache headers fixed, per-org feature toggles (super-user + reseller), in-app help & guidance (Help modal, legal explainers, instructive empty states, extended setup checklist). Pending owner tasks: backend error alerting, Cloudflare `/sw.js` purge, end-to-end dry-run.*

---

## FIFO Ops Integration

This project reports to **FIFO Ops** (ops.fifo.systems) for centralized task and context tracking across all FIFO Solutions projects.

### Reading from Ops
At session start, check `/home/cat/development/projects/fifo-ops/FIFO_OPS_STATE.md` for current business priorities and cross-project context.

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

