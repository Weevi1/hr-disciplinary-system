# ROADMAP — File by FIFO (HR Disciplinary System)

> A single place that records **what's been built** over ~6 months of development and **what's
> left to do**, priority-ordered. Synthesised from `RECENT_UPDATES.md`, `SESSION_HISTORY.md`,
> `PRE_LAUNCH_AUDIT_2026-06.md`, `legal/BUSINESS_LAUNCH_TRACKER.md`, the future-feature roadmap
> docs, and a direct read of the live codebase.
>
> **Last updated:** 2026-06-04 · **Status:** Production-ready, deployed at file.fifo.systems, **0 paying clients yet**

---

## Where we are now (baseline)

- **Frontend:** React 18 + Vite + TypeScript (strict) + Tailwind. Live at https://file.fifo.systems.
- **Backend:** Firebase Cloud Functions — Node 22, `firebase-functions` v7, `firebase-admin` v13,
  **all on the v2 API** (~34 functions). Primary region `us-central1`, super-user functions `us-east1`.
- **Data:** Multi-tenant **sharded** Firestore — every tenant's data under `organizations/{orgId}/...`,
  isolation enforced by security rules. Architected for 2,700+ orgs.
- **Email:** SendGrid from `file@fifo.systems` (App Emails). Payment gateway not yet integrated.
- The product is feature-complete and hardened; the gap to revenue is **commercial/business setup**, not engineering.

---

## ✅ What's been done (retrospective, by epic)

### Warning workflow
- Full **V2 warning wizard rewrite** — intro overview + 5 working steps (Setup → Incident →
  Conversation → Sign & Save → Deliver). **V1 (10-phase) deleted 2026-06-03** — V2 is the sole wizard.
- LRA-compliant **escalation engine** (counselling → verbal → first/second/final written) with
  real-time recommendation and category override.
- **HR-intervention gate** prevents auto-escalation past final written; urgent HR alerts on repeat offences.
- **Multi-manager** system (`managerIds[]`) with bulk assignment, backward-compatible helpers.

### PDF system (3-layer, legal-grade)
- **Versioned generator** — v1.0.0 [frozen], v1.1.0, v1.2.0 [template-aware]; historical warnings
  regenerate byte-identically for CCMA admissibility.
- **Per-org template customisation** (colours, fonts, margins, section order/visibility) + **centralised
  version storage** (~1000× storage reduction — 5-byte reference vs 5-10 KB object per warning).
- CCMA-ready output: lettered sections, continuation headers, electronic-signature notation, page
  initials, **Employee Rights** block, watermarked **appeal-decision reports**.
- **SVG signatures** (2-5 KB vs 50-200 KB PNG, ~90% smaller) with witness watermarking.

### Employee / manager / department management
- Full CRUD; **CSV import** with SA phone (`082…` → `+2782…`) and date formatting; duplicate detection.
- **Dual-mode user creation** (promote existing employee or create new manager); custom claims set
  immediately (no sign-out/in cycle).
- **Department system** with real-time counts + default departments.
- **Manual/historical warning entry** for digitising paper records, with a **60-day countdown** to encourage digitisation.

### Delivery — all four methods live
- **Email**, **QR** (1-hr signed link), **WhatsApp** (durable 180-day respond link via `wa.me`),
  **Printed** (collect-from-HR with `notifyHRPrintedCollection`).
- Fixed the `deliveryStatus`-vs-`status` bug that left delivered warnings stuck in the undelivered queue.

### Employee response & appeal
- Public **`/respond/:token`** page (no auth), **8 Cloud Functions**, token auth + rate limiting,
  PDF viewing, evidence upload, and **HR email notifications** on response/appeal via SendGrid.

### Security & architecture
- Database **sharding** for scale; **server-side timestamps** (tamper-proof audit trail);
  **session guard** (10-min inactivity logout) + forced app-update mechanism.
- **Evidence-upload hardening** (download-token URLs not public; client-side image optimisation).
- **Reseller demo organisations** with persistent banner + cron/trigger guards (no fake-email bounces).
- **Tier 0 pre-launch hardening done (2026-06-04):** `TEMP_LINK_SECRET` moved to `defineString`
  (fails closed, no hardcoded fallback); `getHREmails()` repointed to the sharded `organizations/{orgId}/users`
  path across `warningDelivery.ts`, `employeeResponse.ts`, `notifyHROnAppeal.ts`.

### Design / UX / accessibility
- Unified design system; **WCAG 2.1 AA** modals (focus trap, scroll lock, standardised z-index 9000-9999);
  mobile polish; **multi-dashboard theming** (Manager/HR/Executive per-view colours); signature-pad redesign.

### Infrastructure
- **Node 20 → 22** + full **v1 → v2 functions migration**; build/version pipeline with forced updates;
  performance + **staleness-detection** optimisations; production console-log scrub (`no-console` enforced).

### Business / legal / marketing
- **FIFO Solutions (Pty) Ltd registered** (2026/071559/07); legal docs (ToS, Privacy, Reseller Agreement);
  full sales/marketing toolkit; **HR-consultant-as-reseller** go-to-market validated.

### Large-scale cleanup (Phases 0-6)
- tsc errors 903 → 647; ~10,000 LOC removed; `DataService` → `ShardedDataService` + `AdminDataService`;
  PDF generator 4,135 → 958 LOC (byte-identical); orphan-record audit + recurrence patches; lint clean.

---

## 🔴 What's left — priority-ordered

### P0 — Blocks the first paying client (commercial/revenue)
The *engineering* pre-launch blockers (audit Tier 0) are **done**. What remains is commercial setup:
- **SARS registration** — tax number needed before you can invoice clients (TIN submitted).
- **Capitec business account** — finalise (needed to receive payment).
- **Payment collection** — no gateway integrated yet (PayFast/Yoco). Needed before self-serve billing;
  first clients can be invoiced manually in the interim. (`CommissionService.ts:617` commission-statement
  PDF gen is still a `TODO`.)
- **Sign the reseller agreement** with Adam.
- **Onboard the first client** — Insitu Construction (Michelle Pedersen) is closest; needs an onsite
  visit to capture the staff list and set up the company profile.

### P1 — During the first-50 ramp
- **End-to-end test the "done, needs testing" features** (built but never verified end-to-end):
  - Gap 4 — manager evidence upload in the wizard (attach → complete → confirm in Storage/Firestore).
  - Gap 5 — expected-standards templates auto-fill on category select.
  - Response-link flow — generate → view PDF → submit response/appeal → HR notification.
  - Historical-warning 60-day countdown; department real-time counts; HOD team view; employee edit after promotion.
- **Mobile-first pass on the hot paths** (the honest "responsive ✅, mobile-first ✗" gap). Drive the
  warning wizard, employee list, HOD dashboard and login at **320px on a real low-end Android / 3G throttle**;
  fix tap targets and horizontal scroll. Delete the dead, unimported `MobileEmployeeManagement.tsx` (~335 lines).
- **Pricing review with Adam** — Tiers 4-6 are well below market (a 200-emp client at R6.25/emp/mo is
  ~77% cheaper than Sage HR). Consider a "2026 pricing" tier for new clients; grandfather early ones.
  Estimated upside ≈ **+R360k/yr** at 300 clients. See `legal/BUSINESS_LAUNCH_TRACKER.md`.
- **Research only (no implementation):** unified warning/counselling architecture analysis — should the
  corrective-counselling sections live *inside* the warning (per the client template), and at what migration cost?

### P2 — Scale-prep (sequence past ~300 orgs; do NOT do prematurely at 0 clients)
- **Cron read amplification** — `checkDueReviewsDaily` and `cleanupExpiredAudio` both loop all orgs
  (~10.8k reads/day at 2,700 orgs). Stagger schedules + batch/paginate org processing.
- **Firestore index drift** — ~14 production indexes exist only in the Firebase console, not in
  `config/firestore.indexes.json`. Export and reconcile into version control (do once).
- **Function-level content validation** — Admin SDK writes bypass security rules; add a guard
  (`if (data.organizationId !== orgIdFromPath) throw`) as cheap insurance.
- **CI hardening** — add a Playwright **multi-tenant isolation** test (org A can't see org B's warning) +
  daily prod smoke test + Dependabot/Snyk.
- **Automate backups + write a one-page DR runbook** (backup script exists but is manual).
- **Lower-priority debt:** Firestore listener pooling/dedup (~25 `onSnapshot`, measure first);
  decompose god components opportunistically (`UnifiedWarningWizardV2`, `ClientOrganizationManager`,
  `EnhancedOrganizationWizard`); bundle weight (revisit only on 3G cold-load complaints).

### P3 — Future features (design docs already written)
- **Review Follow-Up System** — track warnings post-issuance, auto-satisfy/escalate. 4-week plan in
  `REVIEW_FOLLOWUP_IMPLEMENTATION_ROADMAP.md`.
- **Recognition & Achievement Tracking** — positive-reinforcement counterpart to discipline. 4-6 week
  plan in `RECOGNITION_SYSTEM_IMPLEMENTATION_ROADMAP.md`.

---

## In-code debt (small, opportunistic)
- `frontend/src/types/core.ts:512-518` — 4 `@deprecated` alias fields (`lastName`, `department`,
  `position`, `category`) to retire.
- `frontend/src/types/core.ts:537` — `FIXME`: reconcile `actionSteps` `{action,timeline}` shape (Phase 2/3 cleanup).
- `frontend/src/services/ErrorTrackingService.ts:165` — `TODO`: wire external error tracking.
- `frontend/src/services/CommissionService.ts:617` — `TODO`: commission-statement PDF generation.

---

## Where the detail lives
- `RECENT_UPDATES.md` — Sessions 20-67 change log (current)
- `SESSION_HISTORY.md` — Sessions 5-19 (archived)
- `PRE_LAUNCH_AUDIT_2026-06.md` — Tier 0/1/2 audit (note: Tier 0 now done; Tier 1.3 dual-wizard item resolved)
- `legal/BUSINESS_LAUNCH_TRACKER.md` — company formation, banking, pricing, go-to-market
- `REVIEW_FOLLOWUP_IMPLEMENTATION_ROADMAP.md` / `RECOGNITION_SYSTEM_IMPLEMENTATION_ROADMAP.md` — P3 designs
- `CLAUDE.md` + `QUICK_REFERENCE.md` — working guidance and file catalog
