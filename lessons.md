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
