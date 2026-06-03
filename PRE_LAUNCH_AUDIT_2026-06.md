# File by FIFO — Pre-Mass-Production Audit & Remediation Roadmap

*Audit date: 2026-06-03 · Scope: full app (frontend, backend, data, ops) · Deliverable: this document, no code changes*

---

## Context

File by FIFO is an HR disciplinary SaaS built over ~12 months. The vision and tech have shifted repeatedly during that time. Before going to "mass production," the question is: **are we ready, safe, optimised, and cost-effective — while delivering a snappy, intuitive, mobile-first product?**

Business reality (from `CLAUDE.md` / FIFO Ops): **0 paying clients today**, targeting the **first ~50 via HR-consultant resellers**, with **2,700+ orgs as the long-term ceiling**. This audit prioritizes accordingly: *make it safe and excellent for the first 50 now, and sequence the mass-scale work so nothing is a surprise later.* It optimizes neither for premature 2,700-org engineering nor for ignoring scale entirely.

Built from deep exploration across three domains (frontend/UX, backend/functions, data/scale/ops). **Two headline claims from the raw exploration were wrong and have been corrected by direct verification** — noted inline so we don't action non-issues.

---

## Bottom line

**Verdict: GO for the first ~50 clients — the foundation is genuinely strong.** A mature, well-organized codebase with real multi-tenant isolation, modern tooling (React 18 / Vite 6 / TS strict / Node 22 / firebase-functions v7), strong auth, double-send guards, audit logging, Sentry, and demonstrably good data hygiene (the recent orphan-record audit + root-cause fixes are a *positive* signal, not a worrying one).

It is **not yet** tuned for 2,700 orgs — but it doesn't need to be today. There are **3 genuine pre-launch fixes** (small), a **mobile-first claim that is really "responsive retrofit"** (the biggest gap vs. the stated vision), and a **scale-prep tranche** that can wait until past ~300 orgs.

Confidence: **8/10 for a 50-client launch** with the Tier 0 fixes done; the Tier 2 items are what stand between you and 2,700.

---

## Corrections to flag (verified directly — do NOT action these)

1. **PDF is already lazy-loaded.** Initial exploration claimed jspdf (~576KB) loads eagerly on startup and should be split out. **False.** Every `jspdf` and `PDFGenerationService` reference is a dynamic `await import(...)` (e.g. PDFGenerationService dynamic imports across `v1_0_0/v1_1_0/v1_2_0.ts`, `UnifiedWarningWizard.tsx:905`); there are **zero static jspdf imports**. The `pdf-vendor` manualChunk in `frontend/vite.config.ts:74` only downloads when a PDF is actually generated. Already optimal. **No action.**
2. **The v2 warning wizard is NOT dead code.** It's actively wired into `frontend/src/components/dashboard/HODDashboardSection.tsx`. It's a real in-progress migration. Decision: **flag as debt, keep both, don't remove.**

---

## What's genuinely strong (keep / don't touch)

- **Modern, current stack** — React 18.3, Vite 6.3, Tailwind 3.4, TS 5.8 strict, Firebase SDK 11.9, Node 22 / firebase-functions v7 / admin v13, all v2 functions. Nothing deprecated. Good dependency hygiene (date-fns not moment, single icon lib, no lodash bloat).
- **Real multi-tenant isolation** — data is path-scoped under `organizations/{orgId}/...`, enforced by Firestore rules (`belongsToOrganization` / `resellerManagesOrganization`) and consistently passed `organizationId` across ~67 `ShardedDataService` call-sites. No cross-tenant leak found.
- **Solid backend security** — defense-in-depth auth (rules check Firestore, not just JWT), claims-versioning for stale tokens, token-based public `/respond/{token}` system with 32-byte tokens, expiry, revocation, 20-views/hr rate limiting. SendGrid key correctly managed via `defineString` (Secret Manager).
- **Reliability discipline** — double-send guard on `deliverWarningByEmail`, idempotent appeal trigger (`notifyHROnAppeal` fires only on false→true flip), demo-org guards across crons/delivery, per-org try/catch so one failure doesn't cascade.
- **Operational maturity** — Sentry, PII-sanitizing Logger, audit logs, versioned PDFs for legal compliance, backup script with retention tiers, session guard + forced updates. The 18-orphan cleanup + creation/deletion patches show audits are actually run and root-caused.

---

## Findings & roadmap (prioritized)

### 🔴 Tier 0 — Do before onboarding the first paying client (small, ~1 day total)

| # | Finding | File | Fix |
|---|---------|------|-----|
| 0.1 | **`TEMP_LINK_SECRET` defaults to a hardcoded predictable string** `'temp-download-secret-2024'` — weakens HMAC signing of temporary download links (real security issue). | `functions/src/temporaryDownload.ts:58` | Move to `defineString`/Secret Manager; fail closed if unset. |
| 0.2 | **Stripe secret/webhook fallbacks** (`'sk_test_...'`, `'whsec_...'`). Placeholder ellipsis strings (no real key leaked), but mask misconfiguration and let billing init silently with junk. | `functions/src/billing.ts:11,111` | Remove fallbacks; require env via `defineString`; fail explicitly. Stripe path is also untested — verify webhook signature handling before taking real money. |
| 0.3 | **`getHREmails()` reads the legacy global `users` collection** instead of the sharded `organizations/{orgId}/users`. Inconsistent with the architecture; gets slower/cheaper-wrong as the global collection grows. | `warningDelivery.ts`, `employeeResponse.ts`, `notifyHROnAppeal.ts` | Repoint to sharded path. ~1hr, 3 files. |

*Rationale: 0.1 is a real signing weakness, 0.2 protects revenue + avoids embarrassing billing failures with the first client, 0.3 is cheap and removes a latent legacy dependency. None are large.*

### 🟠 Tier 1 — Do during the first-50 ramp (the "mobile-first vision gap" + clarity debt)

The tranche most tied to the vision of *"groundbreaking, snappy, intuitive, mobile-first."*

- **1.1 — "Mobile-first" is actually "desktop-first, responsive-patched."** Base Tailwind styles trend desktop-sized then shrink at breakpoints (e.g. `EmployeeStats.tsx`); there's an unreferenced `MobileEmployeeManagement.tsx` (335 lines, **0 imports — confirmed dead**) signalling an abandoned mobile-fork approach; ~4,600 lines of hand-tuned CSS (`index.css`, `main-layout.css`, `modal-system.css`) carry `@media` breakpoints that belong in Tailwind utilities. **For an SA mobile-majority audience this is the #1 vision gap.** Action: (a) delete the dead `MobileEmployeeManagement.tsx`; (b) pick the 3–4 most-used screens (warning wizard, employee list, HOD dashboard, login) and genuinely mobile-first them at 320px on a real low-end Android; (c) migrate breakpoint logic out of CSS files into component classes incrementally. *Don't boil the ocean — target the hot paths.*
- **1.2 — Firestore listener duplication.** `onSnapshot` listeners (~25) are created per-hook with correct cleanup, but no pooling/dedup — multiple dashlets subscribing to the same collection multiply live reads. Fine at 50 clients; a cost driver later. Action now: just **measure** (watch Firestore read counts on the first multi-user org). Real fix (listener pool or React Query + Firestore adapter) is Tier 2.
- **1.3 — Dual warning wizards (v1 10-phase + v2 6-phase).** **Keep both**, but add one line to `CLAUDE.md` stating v2 is an active experiment and v1 is the production default, so it isn't mistaken for finished or for dead code. Commit the `v2/` directory (currently untracked) so it's under version control even as an experiment.
- **1.4 — God components.** `UnifiedWarningWizard.tsx` (1,645), `ClientOrganizationManager.tsx` (1,575), `EnhancedOrganizationWizard.tsx` (1,560). Not urgent, but every bug in these is expensive. Decompose opportunistically when you next touch them; don't schedule a dedicated refactor yet.

### 🟡 Tier 2 — Sequence before mass scale (≈ past 300 orgs; do NOT do prematurely)

- **2.1 — Cron read amplification.** `checkDueReviewsDaily` and `cleanupExpiredAudio` both loop **all orgs** (O(1+2N) reads/run). At 2,700 orgs that's ~10.8K reads/day combined — cheap in dollars (~$200–300/mo Firestore at full scale) but a quota-contention risk if both run together. Fixes when needed: stagger schedules (1-line), batch/paginate org processing, cache the org list. **Premature today** — 0 orgs.
- **2.2 — Firestore indexes drift.** ~14 production indexes exist only in the Firebase console, not in `config/firestore.indexes.json` (~20 tracked). Risk: a new query hits a missing index in prod and blocks the UI. Action before scale: `firebase firestore:indexes` → export → reconcile into the config file so all indexes are version-controlled. Low effort, do it once.
- **2.3 — No schema-content validation in functions.** Rules guard *paths*, not document *content*; Admin SDK writes bypass rules, so a future bug could write a wrong `organizationId` into a doc. Add a guard helper (`if (data.organizationId !== orgIdFromPath) throw`) in write functions. Cheap insurance for mass scale.
- **2.4 — Testing & CI gaps.** 243 test files + Playwright + emulator tests exist, but E2E is **not in CI** ("manual testing preferred"). Before 2,700 orgs add: a Playwright multi-tenant isolation test in CI (login org A → create warning → login org B → assert not visible), and a daily prod smoke test. Dependabot/Snyk for deps.
- **2.5 — Bundle weight.** ~1.4MB eager JS (Firebase SDK ~552KB + React + app core; **not** PDF — see correction #1). Acceptable for enterprise SaaS; revisit only if cold-load on 3G becomes a complaint.
- **2.6 — Automate backups + write a DR runbook.** Backup script exists but is manual; schedule it (GitHub Action cron or Firebase scheduled backups) and write a one-page disaster-recovery runbook before holding meaningful client data at scale.

### 🟢 Naming / honesty (no functional impact)

- "Database sharding" is really **collection-scoped multi-tenancy** (no horizontal partitioning/rebalancing). It's sound and sufficient to well beyond 2,700 orgs — but the docs oversell it. Rename in `DATABASE_SHARDING_ARCHITECTURE.md` for accuracy when convenient.

---

## Answering the core question directly

| Question | Answer |
|----------|--------|
| **Optimally set up for the goal?** | Architecture is sound and appropriate — not over- or under-engineered for the real near-term scale. The one true mismatch vs. vision is mobile-first (it's responsive, not mobile-first). |
| **Ready for mass prod?** | Ready for the **first ~50** after Tier 0. **Not yet** for 2,700 — Tier 2 is the gap, and it's well-understood, not scary. |
| **Safe?** | Largely yes. One real fix (Tier 0.1 temp-link secret). Isolation, auth, and tenancy are solid. |
| **Optimised?** | Frontend perf is better than the raw report implied (PDF already lazy). Backend crons need scale-prep *later*. Listener dedup is the main efficiency debt. |
| **Cost-effective?** | Yes at 50; needs the Tier 2.1 cron work to stay cheap at thousands. No idle costs (no minInstances). |
| **Groundbreaking, snappy, intuitive?** | The design system, accessibility (74 ARIA impls), and polish are genuinely strong. "Snappy on mobile" is the area to invest in to match the vision. |
| **Mobile-first?** | **The headline gap.** Honest grade: responsive ✅, mobile-first ✗. Tier 1.1 closes it on the hot paths without a rewrite. |

---

## Recommended next steps (separate sessions, your call)

1. **Tier 0 fix session** (≈1 day): the three pre-launch fixes, each verifiable —
   - 0.1/0.2: grep for hardcoded secret fallbacks returns none; deploy fails fast when env unset.
   - 0.3: `getHREmails` reads sharded path; send a test appeal/delivery in an emulator org and confirm HR receives it.
2. **Tier 1 mobile pass**: drive the app on a real low-end Android (or Chrome DevTools 320px / 3G throttle) through the warning wizard and HOD dashboard; confirm tap targets, no horizontal scroll, readable type.
3. **Tier 2** items as the client count climbs past ~300.
