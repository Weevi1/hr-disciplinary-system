# Lessons — File by FIFO

> Patterns learned from corrections. Reviewed at session start.
> Format: `[date] What went wrong → What to do instead`

## Security
- [2025-10-02] `isAuthenticated()` used 30+ times as security bypass in Firestore rules → Always validate role/organization membership explicitly. Never use `allow read: if isAuthenticated()` as a catch-all
- [2025-10-02] `allow read, list, write: if true` found in rules → Never use `true` in security rules. Always scope to org membership + role
- [Session 64] `file.makePublic()` used for evidence files → Use signed URLs with expiry instead: `getSignedUrl({ expires: Date.now() + 15*60*1000 })`
- [2026-05-08] `auth-export.json` + `users.json` (real Firebase Auth exports with emails + bcrypt hashes) committed to git in 2 historical commits → Scrubbed via `git filter-repo --invert-paths --path auth-export.json --path users.json --force` + force-push to GitHub + `git fetch && reset --hard + git gc --aggressive --prune=now` on cats. Pre-scrub mirror saved at `cats:/storage/backups/git-history-scrub/hr-mirror-pre-scrub-2026-05-08_1014`. Lesson: NEVER commit Firebase Auth exports, Firestore data exports, or any file with real emails/hashes/IDs. Always `gitignore *.json exports + test data dumps from the start` (now in `.gitignore`: `auth-export.json`, `users.json`, `*-export.json`). Verify `.gitignore` before the first commit on any new file class.
- [2026-05-08] Storage rules had wide-open catch-all `match /{allPaths=**} { allow read, write: if request.auth != null; }` AND `userOrgIndex/{userId}` allowed any authenticated user to write any other user's index entry → Replaced catch-all with explicit `organizations/{orgId}/{allPaths=**}` rule (org-membership / super-user / reseller checks) + deny-by-default catch-all + new `warnings/{orgId}/{warningId}/pdfs/{file}` rule (was relying on the old catch-all). Tightened `userOrgIndex` write to `request.auth.uid == userId`. Lesson: when a "fix" tightens a load-bearing catch-all, scan the storage bucket for ALL paths in actual use first (`bucket.getFiles()` admin SDK script) — bucket reality beats grep, several paths only relied on the catch-all and would have silently broken otherwise.

## Auth & Users
- [2025-10-23] New users had to sign out/back in to get their role → Always call `auth.setCustomUserClaims()` immediately after creating user doc. Applied to all 5 creation functions
- [Session 63] Reseller user creation missing `uid` field, role saved as raw string → Always set `uid: userRecord.uid` and normalize role to object format `{ id, name, level }`
- [Session 63] `issuedBy` empty on warnings when user has no `uid` → Provide fallback: `user?.id || 'unknown'`
- [2026-05-10] Phase 1.5 dual custom-claim format cleanup: codebase historically supported both NEW abbreviated (`r`/`org`/`res`) and LEGACY verbose (`role`/`organizationId`/`resellerId`) formats with `||` fallbacks scattered across rules + middleware + frontend. Migration order: (1) update remaining LEGACY setters to NEW format, (2) bulk-refresh production users via `customClaims.refreshOrganizationUserClaims()` + direct Admin SDK script (9 users, 1 migrated, 8 already clean), (3) remove fallbacks. Single canonical format now enforced. Lesson: when introducing an abbreviated/optimised claim shape, plan the cutover from day one — track all setters and readers, write both formats only during transition, then commit to a single format. Dual-format support doubles every permission check and rots over time.
- [2026-05-10] Pre-existing bug discovered during Phase 1.5: `frontend/src/auth/AuthContext.tsx:221-222` was reading `claims.orgId` (a field that exists in NEITHER format — neither NEW `org` nor LEGACY `organizationId`) before falling back to `organizationId`. Effectively the optimistic org-fetch always missed the NEW format and only worked via legacy fallback. Lesson: when implementing dual-format readers, write a regression test that asserts the NEW path is actually exercised. Otherwise typos hide for years.

## Modals & UI
- [Session 21] Body scrolling behind modals → Use `usePreventBodyScroll` hook. Never `position: absolute` — use `fixed inset-0`
- [Session 59] SignaturePad canvas sizing broken inside modals → Use React Portal to escape parent CSS, inline styles only, `useLayoutEffect` for viewport-based sizing

## Data & Services
- [2025-09-20] Flat collection paths used instead of sharded → Always use `organizations/{orgId}/warnings/{id}`, never `warnings/{id}`
- [Session 44] Auth lookup fallbacks creating 2-8s delays → Use UserOrgIndexService as primary source, remove fallback searches

## Active Wizard
- [2026-02] Wrong wizard investigated → Active/production wizard is `UnifiedWarningWizard.tsx`. Legacy `EnhancedWarningWizard.tsx` + `CombinedIncidentStepV2.tsx` are NOT used. Always verify which component is rendered

## PDF Pipeline
- [2026-03-09] PDF missing corrective data (employee statement, commitments, expected standards) → Root cause was `WarningDetailsModal.tsx` manually constructing `formData` without including corrective fields. Always check the full data pipeline: Firestore → Modal → PDFPreviewModal → pdfDataTransformer → PDFGenerationService
- [2026-03-09] PDF changes are universal vs per-tenant → Section renderer methods (`addEmployeeStatementSection` etc.) are hardcoded and shared by both the dynamic section router AND fallback path. Template system only controls section ordering/visibility, not rendering logic inside each section. Changes to renderer methods affect ALL tenants

## Config Files
- [2026-04-24] Edited root `firestore.indexes.json` but indexes didn't deploy → `firebase.json` points to `config/firestore.indexes.json`; the root file is stale/unused. Always check `firebase.json` for the actual path before editing Firestore config (rules + indexes both live under `config/`)

## Demo Organizations
- [2026-04-24] Any new cron/trigger/delivery Cloud Function that iterates orgs or emails users must guard against demo data → Demo orgs use fake `@demo.local` addresses and prospect logins with real auth. Add `if (orgData.isDemo === true) continue;` to cron loops; throw `failed-precondition` in callable delivery functions; filter `isDemoProspect === true` from user recipient lists. Pattern established in `reviewFollowUpCron.ts`, `warningDelivery.ts`, `notifyHROnAppeal.ts`
