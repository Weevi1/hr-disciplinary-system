// scripts/dev/find-orphan-users.js
//
// Detection script (READ-ONLY) — finds Firestore user docs that have no
// corresponding Firebase Auth record. Output is printed to stdout; nothing
// is mutated. Intended for Phase 6 pre-launch verification cleanup
// (the plan flagged "4 orphan Firestore user docs (no Auth records) found
// in Phase 1.5 Sitting B — Phase 6 verification cleanup").
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json \
//     node scripts/dev/find-orphan-users.js [--json]
//
// What it scans:
//   1) Root collection: users/{uid}            — super-users, resellers, legacy
//   2) Per-org subcollections: organizations/{orgId}/users/{uid}
//
// What it reports:
//   - Total Auth UIDs
//   - Total Firestore user docs (root + sharded)
//   - Orphans: Firestore docs whose ID is not in the Auth set
//
// Cleanup is a separate, authorised step — this script does not delete.

const admin = require('firebase-admin');

const FLAG_JSON = process.argv.includes('--json');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'hr-disciplinary-system' });
}

const auth = admin.auth();
const db = admin.firestore();

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
  return snap.docs.map(d => ({
    id: d.id,
    email: d.get('email') || null,
    role: d.get('role') || null,
    organizationId: d.get('organizationId') || null,
    createdAt: d.get('createdAt') || null,
    path: `users/${d.id}`,
  }));
}

async function listAllOrgUserDocs() {
  const orgsSnap = await db.collection('organizations').get();
  const out = [];
  for (const orgDoc of orgsSnap.docs) {
    const orgId = orgDoc.id;
    const orgName = orgDoc.get('name') || '(unknown)';
    const usersSnap = await orgDoc.ref.collection('users').get();
    for (const u of usersSnap.docs) {
      out.push({
        id: u.id,
        email: u.get('email') || null,
        role: u.get('role') || null,
        organizationId: orgId,
        organizationName: orgName,
        createdAt: u.get('createdAt') || null,
        path: `organizations/${orgId}/users/${u.id}`,
      });
    }
  }
  return out;
}

async function main() {
  const startedAt = Date.now();
  const [authUids, rootDocs, orgDocs] = await Promise.all([
    listAllAuthUids(),
    listRootUserDocs(),
    listAllOrgUserDocs(),
  ]);

  const allFsDocs = [...rootDocs, ...orgDocs];
  const orphans = allFsDocs.filter(d => !authUids.has(d.id));

  const report = {
    scannedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    counts: {
      authUids: authUids.size,
      firestoreUserDocs: allFsDocs.length,
      rootDocs: rootDocs.length,
      orgScopedDocs: orgDocs.length,
      orphans: orphans.length,
    },
    orphans: orphans.map(o => ({
      id: o.id,
      path: o.path,
      email: o.email,
      role: typeof o.role === 'object' ? o.role?.id : o.role,
      organizationId: o.organizationId,
      organizationName: o.organizationName,
      createdAt: o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : o.createdAt,
    })),
  };

  if (FLAG_JSON) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n=== Orphan Firestore user audit ===`);
    console.log(`scanned at: ${report.scannedAt}`);
    console.log(`elapsed:    ${report.elapsedMs}ms`);
    console.log(`auth uids:  ${report.counts.authUids}`);
    console.log(`fs docs:    ${report.counts.firestoreUserDocs} (root: ${report.counts.rootDocs}, org-scoped: ${report.counts.orgScopedDocs})`);
    console.log(`orphans:    ${report.counts.orphans}\n`);

    if (orphans.length === 0) {
      console.log(`✅ No orphan Firestore user docs.`);
    } else {
      console.log(`⚠️  ${orphans.length} orphan user doc(s) — Firestore-only, no matching Auth record:\n`);
      for (const o of report.orphans) {
        console.log(`  ${o.path}`);
        console.log(`    id:        ${o.id}`);
        console.log(`    email:     ${o.email ?? '(none)'}`);
        console.log(`    role:      ${o.role ?? '(none)'}`);
        if (o.organizationName) console.log(`    org:       ${o.organizationName} (${o.organizationId})`);
        if (o.createdAt) console.log(`    createdAt: ${o.createdAt}`);
        console.log('');
      }
      console.log(`Cleanup is a separate authorised step. Inspect each entry before deleting:`);
      console.log(`  - Some orphans may be legitimate (e.g. invited but not yet signed in)`);
      console.log(`  - Some may be artifacts of Auth deletion without Firestore cleanup`);
      console.log(`  - Cross-reference with userOrgIndex/{uid} entries\n`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('find-orphan-users failed:', err);
    process.exit(1);
  });
