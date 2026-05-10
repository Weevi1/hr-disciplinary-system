# Pre-Launch Cleanup Plan — File by FIFO

> Six-phase plan to make this codebase production-ready before mass marketing.
> Created 2026-05-08. Worked through phase-by-phase with Riaan.
> Tick boxes as items complete. Each phase has an acceptance gate before moving on.

---

## Audit summary (what we're fixing)

- **309 frontend ts/tsx files**, **24 backend ts files**.
- **8,227 lines** of `_legacy/` code still in source tree.
- **EnhancedWarningWizard.tsx** (1,966 lines) is dead — App.tsx aliases the name to UnifiedWarningWizard.
- **PDFGenerationService.ts** = 4,135 lines, **DataService.ts** = 2,630 lines, **WarningService.ts** = 1,234 lines.
- **629 `any` casts** in frontend; no `tsconfig.json` for the frontend at all.
- **3 backup copies** of `firestore.rules` next to the live one — security logic has been volatile.
- **68 .md files** at the project root.
- **125 console statements** in frontend, **67** in backend.
- **`@headlessui/react`** in `package.json` with zero imports.
- **Four parallel data services** (`DataService`, `DataServiceV2`, `NestedDataService`, `ShardedDataService`) all live.
- **Zero unit/integration tests** for Cloud Functions.
- **`.gitignore`** misses `frontend/dist`, `frontend/test-results`, `frontend/playwright-report`.

---

## Phase 0 — Security & data isolation (BLOCKING)

> Goal: nothing in here can slip past launch. If a tenant can read another tenant's data, it doesn't matter how clean the rest of the code is.

- [ ] **0.1 Firestore rules audit + refactor** — `config/firestore.rules` (1,096 lines)
  - Read end-to-end with reseller + multi-tenant isolation in mind
  - Extract repeated checks (`belongsToOrganization()`, `resellerManagesOrganization()`, role/permission checks) into reusable rule functions at the top of the file
  - Verify every collection has explicit org-scoped read/write rules — no `if isAuthenticated()` catch-alls (per `lessons.md` 2025-10-02)
  - Verify `evidence/` storage paths use signed URLs, not `makePublic()` (per `lessons.md` Session 64)
  - Delete `firestore.rules.backup`, `firestore.rules.backup-20251025-162926`, `firestore.rules.fixed`
  - Riaan deploys with `firebase deploy --only firestore:rules`
- [ ] **0.2 Add strict frontend `tsconfig.json`**
  - Mirror `functions/tsconfig.json` rigour: `strict: true`, `noImplicitReturns`, `noUnusedLocals`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`
  - Run `cd frontend && npx tsc --noEmit` — capture the error count baseline
  - Add `tsc --noEmit` to the build script (or at least to a `typecheck` npm script that CI can call)
- [ ] **0.3 Strengthen `.gitignore`**
  - Add `frontend/dist/`, `frontend/test-results/`, `frontend/playwright-report/`
  - Run `git ls-files | grep -E "(dist|test-results|playwright-report)"` to confirm nothing is already tracked; if it is, `git rm -r --cached <path>`
  - Audit for any other large/sensitive committed files: `git ls-files | xargs ls -la 2>/dev/null | sort -k5 -n -r | head -30`
- [ ] **0.4 Move dev seed data out of root**
  - Create `scripts/dev-data/` (gitignored)
  - Move `auth-export.json`, `users.json`, `freshmart_demo_employees.csv`
  - Move root JS scripts (`set-super-user-claims.js`, `refresh-claims.js`, `setup-categories.js`, `debug-manager-employees.js`, `run-health-checks.js`) into `scripts/dev-tools/`
  - Move root SH scripts (`quick-test.sh`, `scan-flat-database.sh`, `create-backup.sh`, `backup-system.sh`) into `scripts/`
  - Verify the service account JSON (`hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json`) is gitignored — `.gitignore` has `*-firebase-adminsdk-*.json` so confirmed, but double-check
- [ ] **0.5 Verify Firestore indexes are under version control**
  - Compare `config/firestore.indexes.json` against the indexes live in the Firebase Console
  - Export missing ones (the ~14 manually-created indexes referenced in `lessons.md`) and add them to the config file
  - Riaan deploys with `firebase deploy --only firestore:indexes`

**Phase 0 acceptance gate:**
- [x] All `.backup`/`.fixed` rules files deleted (commit `296d69e0`)
- [x] `npm run typecheck` runs; baseline captured at `docs/development/tsc-baseline-2026-05-10.txt` (937 errors — Phase 2 punchlist)
- [x] `firestore.rules` reviewed: 4 dead helpers removed, userOrgIndex write tightened to self-only, sectors documented (commits `296d69e0`, `b5691b6b`)
- [x] `storage.rules` tightened: explicit `organizations/{orgId}/**` + deny-default catch-all + new `warnings/{orgId}/{warningId}/pdfs/` rule (commits `b5691b6b`, `51585eff`)
- [x] `.gitignore` updated; build artifacts untracked (commit `b7c66f64`)
- [x] PII history scrubbed via `git filter-repo` + force-push + cats reset (101 commits rewritten, fresh-clone verification clean)
- [x] All 21 production Firestore indexes in `config/firestore.indexes.json` (was 7, commit `96bf4be2`)
- [x] Frontend `tsconfig.json` + `tsconfig.node.json` created with strict mode (`strict: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`)
- [x] `npm run typecheck` script added (not wired into build — Phase 2)

**Phase 0 complete: 2026-05-10.** Subsequent phases are maintainability/polish, not production blockers.

---

## Phase 1 — Dead code removal (zero-risk, high readability)

> Goal: every file in the source tree should be reachable from a real entry point. No more "is this still used?"

- [ ] **1.1 Delete `frontend/src/_legacy/` entirely**
  - Confirm zero external imports: `grep -rn "from.*_legacy" frontend/src --include="*.ts" --include="*.tsx"` should return only self-references
  - `rm -rf frontend/src/_legacy`
  - Remove the `_legacy` exclusion from `frontend/vite.config.ts` `rollupOptions.external` once the directory is gone
- [ ] **1.2 Delete `EnhancedWarningWizard.tsx` (1,966 lines)**
  - File: `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`
  - Rename the local alias `EnhancedWarningWizard` → `UnifiedWarningWizard` in:
    - `frontend/src/App.tsx` (lines 15, 130, 237, 332)
    - `frontend/src/components/dashboard/HODDashboardSection.tsx` (lines 19, 372)
  - Also check `frontend/src/components/common/SmartComponentLoader.tsx` — found in grep, verify and clean
  - Delete `CombinedIncidentStepV2.tsx` if present in the same `enhanced/` folder
- [ ] **1.3 Delete `.backup` / `.fixed` files**
  - `frontend/src/index-backup.css`
  - `frontend/src/index-full.css`
  - `frontend/src/modal-system.css.backup`
  - `frontend/src/components/absences/UnifiedReportAbsence.tsx.backup`
  - `frontend/src/components/warnings/enhanced/steps/CorrectiveDiscussionStep.tsx.backup`
  - `frontend/src/components/warnings/enhanced/steps/components/IncidentDetailsForm.tsx.backup`
- [ ] **1.4 Drop the unused `@headlessui/react` dependency**
  - Confirm zero imports: `grep -rn "@headlessui/react" frontend/src` returns nothing
  - `cd frontend && npm uninstall @headlessui/react`
- [ ] **1.5 Resolve legacy contexts** — `BrandingContext_legacy`, `ThemeContext_legacy` in `frontend/src/contexts/`
  - If imported anywhere, finish the migration to current contexts
  - Otherwise delete the files

**Phase 1 acceptance gate:**
- [x] `cd frontend && npm run build` succeeds (verified after each commit)
- [x] `git diff --stat HEAD~3 HEAD` shows >18,000 lines removed (commit `aba8b7cf` deleted 6,777, commit `55ad5e82` deleted 12,200)
- [x] tsc baseline dropped 937 → 905 (32 errors removed, exceeds projection of ≤916)
- [x] No `EnhancedWarningWizard` symbol in code (1 remaining match is a historical doc comment)
- [x] `_legacy/` directory deleted, vite + tsconfig references removed
- [x] All `.backup` / `.fixed` files removed from `frontend/src/`
- [x] `@headlessui/react` uninstalled (was zero imports)
- [x] Legacy contexts deleted (BrandingContext_legacy, ThemeContext_legacy)
- [ ] App still boots locally (`npm run dev`) — Riaan smoke-tests warning wizard end-to-end

**Phase 1 nearly complete: 2026-05-10.** Awaiting Riaan's smoke test of the warning wizard (HR/business-owner "Issue Warning" flow + HOD team-warning trigger) to confirm no UI regressions.

**Deferred from Phase 1:**
- Dual custom-claim format cleanup → **Phase 1.5** (own focused session). Audit complete. Migration order documented in plan file.

---

## Phase 2 — Service-layer consolidation (architectural debt)

> Goal: one canonical data-access pattern. One PDF generator that's tractable. Components that fit in a head.

- [ ] **2.1 Pick one data-access service**
  - Inventory call sites for each: `DataService` (2,630 LOC), `DataServiceV2` (829 LOC), `NestedDataService`, `ShardedDataService`
  - Per CLAUDE.md, **`ShardedDataService` is the documented architecture**
  - Migrate everything to `ShardedDataService`
  - Delete the other three
  - Update CLAUDE.md to remove confusion about which service to use
- [ ] **2.2 Decompose `PDFGenerationService.ts` (4,135 lines)**
  - Current state: monolithic, 56 `any` casts, fallback + template paths intertwined
  - Target structure under `frontend/src/services/pdf/`:
    - `PDFGenerationService.ts` (orchestrator, version routing — keep small)
    - `sections/` (one file per section: `EmployeeStatementSection`, `SignaturesSection`, `IncidentDetailsSection`, etc.)
    - `templates/` (per-version template logic — v1.0.0 frozen, v1.1.0 current, v1.2.0 latest)
    - `utils/` (page initials, continuation headers, watermarks)
  - **Hard rule** (per CLAUDE.md): never touch frozen v1.0.0 methods. Verify a historical warning still regenerates byte-identical output before merging.
- [ ] **2.3 Decompose `WarningService.ts` (1,234 lines)**
  - Split into `WarningService.ts` (CRUD), `EscalationService.ts` (level calculation, AI suggestions), `WarningPDFCoordinator.ts` (wires data → PDF)
- [ ] **2.4 Decompose oversized components** (>1,500 lines)
  - `UnifiedWarningWizard.tsx` (2,595) — extract each phase into its own file under `phases/`
  - `ClientOrganizationManager.tsx` (1,634) — split tab content
  - `OrganizationCategoriesViewer.tsx` (1,595) — extract category list + editor
  - `CategoryManagement.tsx` (1,579) — same
  - `WarningDetailsModal.tsx` (1,521) — split tabs (Details / PDF / Audit / Appeals)
  - `ReviewDashboard.tsx` (1,455) — extract list, filters, stats
- [ ] **2.5 Type-cast cleanup**
  - 629 `any` casts in frontend. Top offenders: `PDFGenerationService` (56), `useWizardLogging` (23), `WizardLoggingService` (22)
  - Once Phase 2.2 is done, these drop naturally
  - For the rest, prioritize files already touched by other Phase 2 work — don't open new fronts

**Phase 2 acceptance gate:**
- [ ] No file in `frontend/src/` exceeds 800 lines (excluding generated/types)
- [ ] Single data-access service in use; others deleted
- [ ] `tsc --noEmit` error count cut at least in half from the Phase 0.2 baseline
- [ ] PDF regression test: generate a warning, compare byte-for-byte against a known-good v1.0.0 reference

---

## Phase 3 — Backend hygiene

> Goal: Cloud Functions structure mirrors the frontend's domain organisation. Critical paths have tests.

- [ ] **3.1 Reorganize `functions/src/`**
  - Current: 17 files at root, sparse subfolders
  - Target structure:
    - `functions/src/auth/` — `customClaims.ts`, `superUserManagement.ts`, `updateUserPermissions.ts`, existing `Auth/` contents
    - `functions/src/warnings/` — `warningDelivery.ts`, `notifyHROnAppeal.ts`, `employeeResponse.ts`, `temporaryDownload.ts`
    - `functions/src/billing/` — `billing.ts`
    - `functions/src/organizations/` — `createOrganizationUser.ts`, existing `Reseller/` contents (incl. `demoManagement.ts`)
    - `functions/src/scheduled/` — `reviewFollowUpCron.ts`, `audioCleanup.ts`
    - `functions/src/services/` — keep, fold `timeService.ts` in here
    - `functions/src/email/` — keep, hold templating helpers
  - Update `functions/src/index.ts` exports to match
- [ ] **3.2 Decide on shared types between frontend and functions**
  - Currently zero sharing — `Warning`, `Employee`, `Organization` types only live in `frontend/src/types/`
  - **Option A**: monorepo-style `shared/types/` package, symlinked or built into both
  - **Option B**: accept duplication, document it, add a CI check that key types match
  - Riaan to decide. Discuss tradeoffs.
- [ ] **3.3 Add backend tests**
  - Smoke-test the highest-risk Cloud Functions:
    - `notifyHROnAppeal` — fires on Firestore trigger; demo-org guard
    - `warningDelivery` — sends email; demo-org guard
    - `employeeResponse` — public token-authed endpoints
    - `deployDemoOrganization` / `resetDemoOrganization` / `deleteDemoOrganization`
    - `reviewFollowUpCron` — scheduled, demo-org guard
  - Use Firebase emulators (`firebase emulators:start`) and the existing `npm run test:firebase` script
  - Don't aim for 100% coverage — aim for "if this breaks at launch, the business is hurt"
- [ ] **3.4 Demo-safety guard audit**
  - Per `lessons.md` [2026-04-24]: every cron/trigger/delivery function that iterates orgs or emails users must have a demo guard
  - Pattern: `if (orgData.isDemo === true) continue;` for crons; `failed-precondition` for callable delivery; filter `isDemoProspect === true` from recipients
  - Walk every Cloud Function in `functions/src/` against this checklist; document compliance

**Phase 3 acceptance gate:**
- [ ] `functions/src/` is organized by domain; no files at root other than `index.ts` and config
- [ ] `npm run test:firebase` passes against the emulator with the new tests
- [ ] Every function that touches multiple orgs has a demo-safety guard documented

---

## Phase 4 — Console noise & lint

> Goal: clean production bundle, lint that catches what humans miss.

- [ ] **4.1 Verify production bundle has zero `console.log`**
  - `cd frontend && npm run build`
  - `grep -c "console\.log" frontend/dist/assets/*.js` should return 0
  - The Vite `pure_funcs` Logger stripping should already handle this; if not, fix the config
- [ ] **4.2 Spot-clean the worst offenders**
  - `PDFGenerationService.ts` — remove emoji "🎨 PDF TEMPLATE DEBUG" logs (raw `console.log`, not Logger calls)
  - `ClientOrganizationManager.tsx` — remove 3 raw `console.log` data dumps
  - Audit any `console.error` calls — make sure they're either Sentry-captured or genuine recoverable warnings
- [ ] **4.3 Tighten ESLint**
  - Add `@typescript-eslint/recommended`
  - Enable `no-explicit-any` (warn, then error)
  - Enable `no-unused-vars`
  - Enable `react-hooks/exhaustive-deps`
  - Run `npm run lint` and fix the top-10 noisiest violations; document the rest as follow-up
- [ ] **4.4 Resolve TODO/FIXME/HACK comments**
  - 17 occurrences in frontend. Categorize each:
    - **Ship-blocker** — fix now
    - **Post-launch** — convert to a tracked issue (Linear/GitHub) and remove the comment
    - **Stale** — delete

**Phase 4 acceptance gate:**
- [ ] Production bundle: zero `console.log`, zero `debugger`
- [ ] ESLint runs in CI and the build fails on errors
- [ ] No TODO/FIXME/HACK comments remain in `frontend/src/` or `functions/src/` (all converted to issues or fixed)

---

## Phase 5 — Documentation hygiene

> Goal: < 15 root-level .md files. New developer can find what they need in 30 seconds.

- [ ] **5.1 Create `docs/sessions/` and archive session reports**
  - Move all `SESSION_*.md` (10 files) — `SESSION_43_*` (4), `SESSION_44_*` (1), `SESSION_48_*` (5)
  - Move all `WEEK_*.md` (3 files)
  - Move `CLAUDE_DEVELOPMENT_HISTORY.md`
- [ ] **5.2 Archive proposal-level docs**
  - `RECOGNITION_SYSTEM_*` (8 files for unbuilt feature) → `docs/proposals/recognition/`
  - `REVIEW_FOLLOWUP_*` (6 files) → `docs/proposals/review-followup/` — keep one canonical living doc at root if the feature is shipped
  - `frontend/CORRECTIVE_DISCUSSION_*` (6 files) → `docs/proposals/corrective-discussion/`
  - `frontend/RECOGNITION_CERTIFICATE_*` (3 files) → `docs/proposals/recognition/`
- [ ] **5.3 Archive architectural deep-dives that aren't living docs**
  - `4_WEEK_OVERHAUL_SYNOPSIS.md`, `REFACTORING_PLAN.md`, `WEEK_*.md` — move to `docs/archive/`
  - `BEST_PRACTICE_AUTH_IMPLEMENTATION.md`, `AUTHENTICATION_CODE_SNIPPETS.md`, `AUTHENTICATION_QUICK_REFERENCE.md` — collapse into one `AUTHENTICATION.md` if needed, archive the rest
  - `DELIVERY_METHOD_SELECTION_*` (3 files) → `docs/archive/`
  - `MODAL_*` (5 files) → keep `MODAL_USAGE_GUIDELINES.md` only, archive the rest
  - `SESSION_HISTORY.md`, `RECENT_UPDATES.md` — keep at root (CLAUDE.md references them)
- [ ] **5.4 Root .md files to keep**
  - `CLAUDE.md`
  - `README.md` (create if missing — public-facing)
  - `QUICK_REFERENCE.md`
  - `lessons.md`
  - `SECURITY_AUDIT_REPORT.md`
  - `TESTING_STRATEGY.md`
  - `PDF_SYSTEM_ARCHITECTURE.md`
  - `AWARD_WINNING_UX_DESIGN_LANGUAGE.md`
  - `RECENT_UPDATES.md`
  - `SESSION_HISTORY.md`
  - `DOCUMENTATION_POLICY.md`
  - `PRE_LAUNCH_CLEANUP_PLAN.md` (this file — delete after launch)
- [ ] **5.5 Update CLAUDE.md cross-references**
  - Many doc references in CLAUDE.md will break after the move
  - Walk every file path mentioned in CLAUDE.md and update or remove

**Phase 5 acceptance gate:**
- [ ] Root has ≤ 15 .md files
- [ ] CLAUDE.md cross-references all resolve
- [ ] `docs/` has clean structure: `architecture/`, `deployment/`, `development/`, `features/`, `sessions/`, `proposals/`, `archive/`

---

## Phase 6 — Pre-launch verification

> Goal: prove it works. Don't trust, verify.

- [ ] **6.1 Clean production build**
  - `cd frontend && npm run build`
  - Compare bundle size to pre-cleanup baseline — expect a noticeable drop
  - Inspect chunks: each role-specific chunk (business-owner-dashboard, hr-dashboard, hod-dashboard) should be reasonable size
  - Verify `frontend/dist/assets/` has no `console.log` or sourcemaps leaked
- [ ] **6.2 End-to-end smoke test: reseller demo flow**
  - Login as a reseller
  - Deploy a new demo organisation
  - Create a prospect login for it
  - Login as the prospect, create a warning end-to-end (test Gap 4: evidence upload, Gap 5: pre-populated standards)
  - Submit an employee response via the link flow
  - Reset the demo
  - Delete the demo
  - **All must succeed without sending real emails** — verify SendGrid logs / inbox is clean
- [ ] **6.3 End-to-end smoke test: real-tenant flow**
  - Login as a real organisation HR user
  - Create a warning end-to-end including signature, evidence upload, manager + employee signatures
  - View the generated PDF, verify all sections render correctly (employee statement, expected standards, action steps)
  - Submit a response/appeal via the link flow
  - Verify HR receives the appeal email (real SendGrid send)
- [ ] **6.4 PDF regression**
  - Generate a warning PDF using v1.0.0 (frozen) — compare byte-for-byte against a known-good reference saved before Phase 2
  - Generate a warning PDF using v1.1.0 (current) — same
  - Generate a warning PDF using v1.2.0 (latest) — same
  - Per-org PDF template: pick one tenant with a custom template, regenerate, verify visually
- [ ] **6.5 Multi-tenant isolation test**
  - Create two test orgs (or use existing dev orgs)
  - Login as Org A user, attempt to read Org B's warnings/employees/categories — must fail at the rules layer
  - Repeat for reseller relationships
  - This is the single most important launch test
- [ ] **6.6 Lighthouse / mobile compatibility**
  - Run Lighthouse on production build, target ≥90 on Performance/Accessibility/Best Practices/SEO
  - Test on Samsung S8-class device (per CLAUDE.md mobile optimisation work)
  - Verify the landing page (`frontend/public/landing.html`) loads cleanly and the login/trial CTAs route correctly
- [ ] **6.7 Sentry / error tracking sanity**
  - Verify Sentry DSN is set in production env
  - Trigger a deliberate error in staging, confirm it lands in Sentry
  - Set up an alert on error rate spike for launch day
- [ ] **6.8 Deployment dry-run**
  - `firebase deploy --only hosting` to a staging target (if available) or a preview channel
  - `firebase deploy --only functions` — verify all 24 functions deploy without errors
  - Smoke test the staging URL end-to-end
- [ ] **6.9 Launch-day runbook**
  - Single page: how to deploy, how to roll back, who to call, where to watch for errors (Sentry, Firebase logs, SendGrid bounces, payment webhooks)
  - Save as `LAUNCH_RUNBOOK.md` (root) — delete after first 30 days uneventful

**Phase 6 acceptance gate:**
- [ ] All smoke tests pass
- [ ] Multi-tenant isolation verified
- [ ] PDF regression clean
- [ ] Sentry receiving errors from production
- [ ] Riaan signs off

---

## Out of scope for this plan (future debt)

- Recognition System (8 design docs, no implementation) — post-launch feature
- Migrating from SendGrid to Brevo — tracked in CLAUDE.md inbox
- PayFast/Yoco payment gateway integration — tracked in CLAUDE.md inbox
- Cloudflare wildcard DNS for agent subdomains — tracked in CLAUDE.md inbox
- Brevo migration for File by FIFO & Trained — tracked in CLAUDE.md inbox

---

## Working agreement

- We work one phase at a time, in order.
- Each phase ends with its acceptance gate ticked before moving to the next.
- If a phase reveals scope we didn't anticipate, add the item to the phase and re-estimate before continuing.
- Riaan deploys; Claude doesn't run `firebase deploy` unless explicitly asked.
- After each phase, commit with a clear message: `cleanup: phase N — <summary>`.
- Update `lessons.md` with anything surprising we learn along the way.
