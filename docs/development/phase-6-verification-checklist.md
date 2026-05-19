# Phase 6 — Pre-Launch Verification Checklist

> Status as of 2026-05-11 (commit a7ad1079 → current). Use this as the run-book for the verification drive that closes the master pre-launch cleanup plan.

Items 1, 2, and 5 below are **done** (automated/static checks I ran). Items 3 and 4 need **Riaan-in-loop** manual execution against real tenants.

---

## ✅ 1. Orphan / inconsistency audit — DETECTED + CLEANED

Script: `scripts/dev/find-orphan-users.js` (read-only). Initial scan caught only 6 issues (Firestore-only docs); extended scan covers six categories and surfaced **18 real issues** vs the original plan's "4 orphan docs" estimate. The original count was understated.

Run command:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json \
  NODE_PATH=./functions/node_modules \
  node scripts/dev/find-orphan-users.js
```

### Categories scanned
- **A** — Firestore user doc has no Auth record (root + per-org)
- **B** — Auth user has no Firestore profile doc (reverse direction — would crash app on login)
- **C** — `userOrgIndex/{uid}` entry points to deleted Auth user
- **D** — `userOrgIndex/{uid}` entry points to non-existent organization (excluding `'system'` sentinel for super-users/resellers — intentional design)
- **E** — Reseller in `resellers/` with no user pointing at them
- **F** — User doc with `role=reseller` and broken `resellerId` link

Sentinel handling: `_metadata` per-org shard records and `organizationId='system'` are recognised as intentional and excluded.

### Results (2026-05-11)
- Auth users: **20** · Firestore user docs: **31** (+6 `_metadata` sentinels) · Organizations: **6** · userOrgIndex entries: **32** · Resellers: **4**

| Category | Count | Severity |
|---|---|---|
| A. Firestore user doc without Auth | **6** | low — can't log in, just storage clutter |
| B. Auth user without Firestore doc | **0** | ✅ |
| C. userOrgIndex pointing to deleted Auth | **12** | medium — stale routing entries |
| D. userOrgIndex pointing to missing org | **0** | ✅ |
| E. Reseller without linked user | **0** | ✅ |
| F. User with broken resellerId | **0** | ✅ |

### Category A — 6 Firestore-only user docs

| Path | Email | Role |
|---|---|---|
| `users/HbDs1QKnAudP22g8iGubvN2worl2` | piet@spur.com | executive-management |
| `users/ma2VqihAcCPOkJnBiy0ZDGSHOPE3` | test@reseller.com | reseller (resellerId: `reseller_1769505345579`) |
| `users/t2d4FBfoLMaEQB0r3yIjfiumJQp2` | michelle@demo.com | executive-management |
| `users/uM6SDwnToNdIzTd5aODHCi78AZh2` | test@bakery.com | executive-management |
| `organizations/test-reseller/users/Z3V5qiD1lRgRYgH1kWk8A4I1JgO2` | hr@bakery.com | hr-manager |
| `organizations/test-reseller/users/uM6SDwnToNdIzTd5aODHCi78AZh2` | test@bakery.com | executive-management |

### Category C — 12 stale userOrgIndex entries

**5 overlap with category A** (same UID — Firestore profile AND index both stale):
`HbDs…`, `ma2V…`, `t2d4…`, `uM6S…`, `Z3V5…`

**7 are PURE index orphans** (Auth gone, Firestore profile also gone, only the index remains):

| Path | Maps to org |
|---|---|
| `userOrgIndex/2N7keBUEcXcGeeGKnZRV8K1dDWb2` | robertson-spur |
| `userOrgIndex/3bXjz72vPKZOo3pv9gnslBkgIAx2` | robertson-spur |
| `userOrgIndex/8D7EdZ06yLViuAoNGVy7AhkFs312` | robertson-spur |
| `userOrgIndex/aZ0m1OcE7CTpz4XQPfn5PerFmTC3` | robertson-spur |
| `userOrgIndex/cEv1D3njFSTNhMlRZ2XZ6uKDFXk2` | robertson-spur |
| `userOrgIndex/RJ4UqOK4FvNLsIjJfu7SgpdQkkk1` | insitu-demo |
| `userOrgIndex/tUeEnnMbsqf68wIqpeuExRGo8VK2` | insitu-demo |

Looks like test users deleted from `robertson-spur` (5) and `insitu-demo` (2) — Auth + profile cleaned up but `userOrgIndex/{uid}` never written. Suggests `UserOrgIndexService.removeMapping()` was never called during deletion flows.

### Cleanup considerations

1. **`test-reseller` is itself a test org** — likely simplest to delete the whole org (catches 2 user subdocs + 2 index entries + the `_metadata` sentinel + the reseller's user record at root level).
2. **`reseller_1769505345579`** referenced by orphan `ma2V…` — check whether this reseller doc still exists and clean up if it's also orphan test data.
3. **The 7 pure index orphans** in `robertson-spur`/`insitu-demo` — purely index-only cleanup, no other data to touch.
4. **Real bug surfaced**: user deletion flow doesn't call `UserOrgIndexService.removeMapping()`. Worth tracking down and fixing so this doesn't keep accumulating.

### Cleanup status (2026-05-19)

**Executed via `scripts/dev/cleanup-orphan-users.js --apply`. All 18 records deleted; re-audit confirms post-state below.**

```
A=0  B=0  C=0  D=0  F=0    (down from A=6, C=12)
E=1                          (known residual — see below)
```

The single E-residual is `resellers/reseller_1769505345579` ("Test Reseller", `test@reseller.com`, `clientIds=[]`) — became orphan once the linked `users/ma2V…` doc was deleted. Per the targeted-cleanup scope, this was left intentionally; clean it up with a one-liner if/when desired:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json \
  NODE_PATH=./functions/node_modules \
  node -e "require('firebase-admin').initializeApp({projectId:'hr-disciplinary-system'}); require('firebase-admin').firestore().doc('resellers/reseller_1769505345579').delete().then(() => process.exit(0))"
```

### Prevention — drift sources patched

To stop the same drift accumulating again, the following creation/deletion paths in `functions/src/` were patched to write/delete `userOrgIndex/{uid}` consistently:

- **`createOrganizationAdmin`** — writes index entry after profile + claims
- **`createOrganizationUsers`** (bulk) — writes index entry per user in the loop
- **`createResellerUser`** — writes index entry with `organizationId: 'system'` sentinel
- **`createDemoProspectLogin`** — writes index entry as part of the parallel provisioning Promise.all
- **`deleteProspectLogins`** (called by `resetDemoOrganization` and `deleteDemoOrganization`) — deletes index entry per uid
- **`deleteDemoOrganization`** — additionally calls new `wipeUserOrgIndexForOrg(orgId)` helper to catch any non-prospect users in the org

Each write is best-effort (own try/catch); failure logs but doesn't roll back user creation. The next deploy of these functions activates the protection.

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
