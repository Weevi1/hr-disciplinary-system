# Phase 6 — Pre-Launch Verification Checklist

> Status as of 2026-05-11 (commit a7ad1079 → current). Use this as the run-book for the verification drive that closes the master pre-launch cleanup plan.

Items 1, 2, and 5 below are **done** (automated/static checks I ran). Items 3 and 4 need **Riaan-in-loop** manual execution against real tenants.

---

## ✅ 1. Orphan Firestore user docs — DETECTED

Script: `scripts/dev/find-orphan-users.js` (read-only)

Run command:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json \
  NODE_PATH=./functions/node_modules \
  node scripts/dev/find-orphan-users.js
```

### Results (2026-05-11)
- **20** Auth UIDs in production
- **37** Firestore user docs (10 root + 27 org-scoped)
- **6** `_metadata` sentinel docs (legitimate, one per org — written by `DatabaseShardingService` for shard health; NOT orphans)
- **6** real orphan candidates (Firestore-only, no Auth match)

### The 6 candidates

| Path | Email | Role | Notes |
|---|---|---|---|
| `users/HbDs1QKnAudP22g8iGubvN2worl2` | piet@spur.com | executive-management | Looks like test user (Spur reference?) |
| `users/ma2VqihAcCPOkJnBiy0ZDGSHOPE3` | test@reseller.com | reseller | Test reseller |
| `users/t2d4FBfoLMaEQB0r3yIjfiumJQp2` | michelle@demo.com | executive-management | Demo user |
| `users/uM6SDwnToNdIzTd5aODHCi78AZh2` | test@bakery.com | executive-management | Test user (also has org-scoped duplicate) |
| `organizations/test-reseller/users/Z3V5qiD1lRgRYgH1kWk8A4I1JgO2` | hr@bakery.com | hr-manager | Inside "Test Reseller" org |
| `organizations/test-reseller/users/uM6SDwnToNdIzTd5aODHCi78AZh2` | test@bakery.com | executive-management | Inside "Test Reseller" org (same UID as #4) |

### Recommended next step
All 6 look like test data from internal QA. Before deleting, confirm:
- The "Test Reseller" org (`organizations/test-reseller`) is itself test data — if so, archive/delete the whole org instead of just the user subdocs.
- Cross-check `userOrgIndex/{uid}` entries for the 4 root-level orphans — if those exist, delete them too.

**This is a destructive operation — flag when you want me to write the cleanup script and we'll authorise it explicitly.**

---

## ✅ 2. Multi-tenant isolation re-audit — PASSED (with dead-code cleanup)

Approach: grep audit for flat-collection access patterns + collectionGroup queries.

### Findings
- **0** active production-code uses of flat `collection(db, 'warnings')` or `collection(db, 'employees')` paths.
- **3** dead files that still contained flat-collection queries from pre-sharding days (2025 initial commit, zero importers):
  - `frontend/src/services/EscalationAIService.ts` (329 LOC)
  - `frontend/src/hooks/warnings/useSimpleWarnings.ts` (117 LOC)
  - `frontend/src/hooks/warnings/useWarnings.ts` (173 LOC)
  - All three **deleted** in this verification drive (-619 LOC).
- **1** `collectionGroup()` usage in `DatabaseShardingService.ts` — checked manually, used only for SuperUser-scope queries (legitimate).

### Result
No live cross-tenant data access paths. Sharding boundary is intact. Firestore rules (config/firestore.rules, audited in Phase 0) enforce the boundary server-side regardless.

---

## ⏳ 3. Warning wizard end-to-end smoke test — NEEDS RIAAN

Manual exercise against a real test tenant.

### Steps
1. Log in as a tenant user with HR-manager role (Pharmacy of SA or a demo org).
2. Open the warning wizard end-to-end (UnifiedWarningWizard):
   - [ ] Phase 1: Employee selection loads
   - [ ] Phase 2: Category selection (verify `expectedStandardsTemplate` auto-fills if the chosen category has one — Ops Gap 5)
   - [ ] Phase 3: Incident details + evidence upload (verify file attaches and persists — Ops Gap 4)
   - [ ] Phase 4: Expected standards (auto-filled from Gap 5; manager can edit)
   - [ ] Phase 5: Improvement plan + commitments
   - [ ] Phase 6: Employee response capture
   - [ ] Phase 7: Script + PDF preview (verify PDF renders all sections incl. evidence list)
   - [ ] Phase 8: Signatures
   - [ ] Phase 9: Review + documentation
   - [ ] Phase 10: Delivery (try email + WhatsApp + print paths)
3. After issuance:
   - [ ] Warning appears in employee's history
   - [ ] PDF generates correctly from `WarningDetailsModal`
   - [ ] HR receives notification (if appeal flow triggered separately)

### What to do if anything fails
Capture screenshot + console errors + the warning's Firestore doc ID. Flag here.

---

## ⏳ 4. PDF v1.0.0 / v1.1.0 byte-regression — NEEDS RIAAN

The master plan flagged: "every v1.0.0 warning that already exists in production must regenerate identically." Pharmacy of South Africa has 4 historical warnings per Phase 0 inspection.

### Steps
1. Log in as Pharmacy of SA HR-manager.
2. For each of the 4 historical warnings:
   - Note its `pdfGeneratorVersion` field (Firestore: `organizations/the-compounding-pharmacy-of-south-africa-/warnings/{id}`).
   - Download the current PDF via WarningDetailsModal → "Download PDF".
   - Compare visually against any previously-saved PDF copy (if Pharmacy of SA archived their originals).
3. **What's NOT testable**: byte-identical comparison against the original generation. No reference PDF was captured before Phase 2 Tier 3B. Visual comparison is the available bar.

### Acceptance
- All 4 PDFs regenerate without error.
- Visual structure (header, sections, fonts, layout, page count) matches what would be expected for that version.
- Critical fields render: employee name, employee number, category, incident date, level, signatures.

### Risk
If a v1.0.0 PDF regenerates DIFFERENTLY from the original (e.g. layout shift, missing section), the decomposition introduced a behaviour change in supposedly-frozen code. Revert candidates:
- `frontend/src/services/pdf/versions/v1_0_0.ts` (extracted from monolith)
- `frontend/src/services/pdf/sections/disciplinaryHistorySections.ts` (`addPreviousDisciplinaryActionSection`)
- `frontend/src/services/pdf/PDFGenerationService.ts` (dispatcher)

---

## ✅ 5. Build / lint / tsc baseline — VERIFIED

| Check | Status | Value |
|---|---|---|
| `npm run lint` | ✅ exit 0 | 614 warnings, 0 errors |
| `npx tsc --noEmit` | ✅ | 616 errors (Phase 2 start: 903, -32%) |
| `npx vite build` | ✅ | last green run during Phase 4 |

---

## Gating decision

If items 3 and 4 pass clean, the master pre-launch cleanup plan is **closed**.

If anything in 3 or 4 surfaces issues, fix and re-verify before considering launch-ready.
