# Lessons — File by FIFO

> Patterns learned from corrections. Reviewed at session start.
> Format: `[date] What went wrong → What to do instead`

## Security
- [2025-10-02] `isAuthenticated()` used 30+ times as security bypass in Firestore rules → Always validate role/organization membership explicitly. Never use `allow read: if isAuthenticated()` as a catch-all
- [2025-10-02] `allow read, list, write: if true` found in rules → Never use `true` in security rules. Always scope to org membership + role
- [Session 64] `file.makePublic()` used for evidence files → Use signed URLs with expiry instead: `getSignedUrl({ expires: Date.now() + 15*60*1000 })`

## Auth & Users
- [2025-10-23] New users had to sign out/back in to get their role → Always call `auth.setCustomUserClaims()` immediately after creating user doc. Applied to all 5 creation functions
- [Session 63] Reseller user creation missing `uid` field, role saved as raw string → Always set `uid: userRecord.uid` and normalize role to object format `{ id, name, level }`
- [Session 63] `issuedBy` empty on warnings when user has no `uid` → Provide fallback: `user?.id || 'unknown'`

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
