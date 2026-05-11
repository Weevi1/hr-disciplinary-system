# Archived migration scripts

Scripts moved here are out-of-build but preserved for reference / re-running
in disaster scenarios. They are excluded from the TypeScript include via
`frontend/tsconfig.json`'s `exclude` glob, so their tsc errors don't show
up in the project baseline.

## migrateToShardedDatabase.ts

One-time migration from the flat `warnings/{id}` / `employees/{id}` collections
to the sharded `organizations/{orgId}/{collection}/{id}` structure. Ran
successfully in 2025; sharding has been in production ever since.

Archived 2026-05-11 as part of Phase 2 Tier 2C — `DataService.ts` was deleted
and the script was its only remaining script-level importer. Kept in case a
future re-shard is ever required.

To re-run: revert the move, restore the DataService methods it depends on
from git history (`getAllOrganizations`, `loadEmployees`, `getWarningCategories`,
`getWarningsForOrganization`), and execute from a dev console with admin
credentials.

## migrateUserOrgIndex.ts

One-time migration that backfilled the `userOrgIndex` collection with O(1)
user→organization lookup entries for users that pre-dated the index. Ran
successfully in 2025; new users have written to the index ever since via
`UserOrgIndexService`.

Archived 2026-05-11 as part of Phase 6 — contributed 22 tsc errors against
stale `User`/`Organization` shapes (the canonical types moved on without it).
Kept in case a future re-shard or backfill is needed.

To re-run: revert the move, refresh imports against current types, and
execute via a dev console (browser or Node) with admin credentials.
