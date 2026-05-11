# docs/archive — Historical implementation snapshots

This directory holds documentation that captured a specific point-in-time implementation, refactor, or session — material that's no longer load-bearing for day-to-day work but is preserved for context, audit trail, or git-history archaeology.

Content was archived from the repo root on **2026-05-11** as part of Phase 5 documentation hygiene. The active reference docs (`CLAUDE.md`, `QUICK_REFERENCE.md`, `PDF_SYSTEM_ARCHITECTURE.md`, `RECENT_UPDATES.md`, `SESSION_HISTORY.md`, the modal/UX design docs) live at the repo root.

## Categories of archived material

- **Session-specific summaries** — `SESSION_43_*.md`, `SESSION_44_*.md`, `SESSION_48_*.md`: detailed work logs from individual sessions. Useful for understanding *why* a particular decision was made; superseded for "what does the code do today" by current source + `RECENT_UPDATES.md`.
- **Week-specific refactor logs** — `WEEK_2_4_REFACTORING_PROGRESS.md`, `WEEK_4_TASK_*.md`: progress trackers from the multi-week dashboard/architecture overhaul. The work landed; the trackers are history.
- **Implementation snapshots** — `MODAL_FIXES_IMPLEMENTATION.md`, `MODAL_WEEK_2_3_IMPLEMENTATION.md`, `DELIVERY_METHOD_SELECTION_*.md`: completed implementations that have already shipped. Active guidance is in `MODAL_USAGE_GUIDELINES.md` and `MODAL_DESIGN_STANDARDS.md`.
- **Pre-implementation plans** — `4_WEEK_OVERHAUL_SYNOPSIS.md`: planning docs for completed work.
- **One-off fix notes** — `USER_CREATION_ROLE_FIX.md`: bug-fix postmortems that don't need to be in primary navigation.

## When to consult

- Tracing the rationale behind a structural decision the current code doesn't explain
- Understanding why a refactor was done in two phases instead of one
- Reading "this used to be the case, why was it changed" context

## When NOT to consult

- For current architecture — read the code or the active root-level docs
- For session activity — read `git log` or `RECENT_UPDATES.md`
- For onboarding — start at `CLAUDE.md`, not here
