// scripts/dev/cleanup-orphan-users.js
//
// Phase 6 targeted orphan cleanup. Counterpart to find-orphan-users.js.
//
// Deletes ONLY the records flagged in categories A (Firestore docs without
// Auth) and C (userOrgIndex pointing to deleted Auth users). Does not touch
// the test-reseller organization, its remaining subcollections, or the
// adjacent `resellers/reseller_1769505345579` doc (those are out of scope
// per the targeted-cleanup decision).
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json \
//     NODE_PATH=./functions/node_modules \
//     node scripts/dev/cleanup-orphan-users.js           # dry-run (default)
//     node scripts/dev/cleanup-orphan-users.js --apply   # actually delete
//
// Safety:
//   - Detection runs in-process via the same logic as find-orphan-users.js.
//     We never trust a stale list — every run re-audits first.
//   - Dry-run is the default; --apply is required to mutate Firestore.
//   - Each delete is wrapped in try/catch so one failure doesn't abort the rest.
//   - Re-runs the full audit at the end and prints expected residuals.

const admin = require('firebase-admin');

const FLAG_APPLY = process.argv.includes('--apply');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'hr-disciplinary-system' });
}

const auth = admin.auth();
const db = admin.firestore();

// ─── Detection (mirrors find-orphan-users.js) ────────────────────────────────

async function listAllAuthUids() {
  const uids = new Set();
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    for (const u of result.users) uids.add(u.uid);
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return uids;
}

async function listRootUserDocs() {
  const snap = await db.collection('users').get();
  return snap.docs.map(d => ({ id: d.id, path: `users/${d.id}`, email: d.get('email') || null }));
}

async function listOrgs() {
  const snap = await db.collection('organizations').get();
  return snap.docs.map(d => d.id);
}

async function listOrgScopedUserDocs(orgIds) {
  const out = [];
  for (const orgId of orgIds) {
    const snap = await db.collection('organizations').doc(orgId).collection('users').get();
    for (const u of snap.docs) {
      out.push({
        id: u.id,
        path: `organizations/${orgId}/users/${u.id}`,
        organizationId: orgId,
        email: u.get('email') || null,
      });
    }
  }
  return out;
}

async function listUserOrgIndex() {
  const snap = await db.collection('userOrgIndex').get();
  return snap.docs.map(d => ({
    id: d.id,
    path: `userOrgIndex/${d.id}`,
    organizationId: d.get('organizationId') || null,
  }));
}

async function audit() {
  const orgs = await listOrgs();
  const [authUids, rootDocs, orgDocs, idx] = await Promise.all([
    listAllAuthUids(),
    listRootUserDocs(),
    listOrgScopedUserDocs(orgs),
    listUserOrgIndex(),
  ]);
  const allFsDocs = [...rootDocs, ...orgDocs];
  const fsWithoutAuth = allFsDocs.filter(d => d.id !== '_metadata' && !authUids.has(d.id));
  const indexOrphans = idx.filter(e => !authUids.has(e.id));
  return { authUidsCount: authUids.size, fsWithoutAuth, indexOrphans };
}

// ─── Deletion helpers ────────────────────────────────────────────────────────

async function safeDelete(ref, label, results) {
  if (!FLAG_APPLY) {
    results.skipped.push(label);
    console.log(`  [dry-run] would delete ${label}`);
    return;
  }
  try {
    await ref.delete();
    results.deleted.push(label);
    console.log(`  ✅ deleted ${label}`);
  } catch (err) {
    results.failed.push({ label, error: err.message });
    console.error(`  ❌ failed ${label}: ${err.message}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const mode = FLAG_APPLY ? 'APPLY' : 'DRY-RUN';
  console.log(`\n=== cleanup-orphan-users [${mode}] ===\n`);

  console.log(`Step 1: auditing current state…`);
  const before = await audit();
  console.log(`  auth uids:                       ${before.authUidsCount}`);
  console.log(`  category A (fs docs no auth):    ${before.fsWithoutAuth.length}`);
  console.log(`  category C (userOrgIndex stale): ${before.indexOrphans.length}`);
  console.log('');

  if (before.fsWithoutAuth.length === 0 && before.indexOrphans.length === 0) {
    console.log(`Nothing to clean. Exiting.\n`);
    return;
  }

  const results = { deleted: [], skipped: [], failed: [] };

  // Step 2: Delete A-category orphan user docs (root + sharded)
  console.log(`Step 2: removing ${before.fsWithoutAuth.length} Firestore user docs without Auth…`);
  for (const doc of before.fsWithoutAuth) {
    const ref =
      doc.organizationId !== undefined
        ? db.doc(`organizations/${doc.organizationId}/users/${doc.id}`)
        : db.doc(`users/${doc.id}`);
    await safeDelete(ref, `${doc.path} (${doc.email ?? 'no-email'})`, results);
  }
  console.log('');

  // Step 3: Delete C-category stale userOrgIndex entries
  console.log(`Step 3: removing ${before.indexOrphans.length} stale userOrgIndex entries…`);
  for (const entry of before.indexOrphans) {
    const ref = db.doc(`userOrgIndex/${entry.id}`);
    await safeDelete(ref, `${entry.path} → org=${entry.organizationId ?? 'none'}`, results);
  }
  console.log('');

  // Step 4: Re-audit
  if (FLAG_APPLY) {
    console.log(`Step 4: re-auditing after cleanup…`);
    const after = await audit();
    console.log(`  category A (fs docs no auth):    ${after.fsWithoutAuth.length}  (was ${before.fsWithoutAuth.length})`);
    console.log(`  category C (userOrgIndex stale): ${after.indexOrphans.length}  (was ${before.indexOrphans.length})`);
    console.log('');
  }

  // Step 5: summary
  console.log(`=== Summary [${mode}] ===`);
  console.log(`  deleted: ${results.deleted.length}`);
  console.log(`  skipped (dry-run): ${results.skipped.length}`);
  console.log(`  failed:  ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log(`\nFailures:`);
    for (const f of results.failed) console.log(`  - ${f.label}: ${f.error}`);
  }

  if (!FLAG_APPLY) {
    console.log(`\nThis was a dry-run. Re-run with --apply to actually delete.`);
  } else {
    console.log(`\nDone. Run scripts/dev/find-orphan-users.js to verify full audit.`);
    console.log(`Expected residual: 1 E-category orphan (resellers/reseller_1769505345579) — known, out of scope.`);
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('cleanup-orphan-users failed:', err);
    process.exit(1);
  });
