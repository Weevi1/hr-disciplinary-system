// scripts/dev/find-orphan-users.js
//
// Comprehensive orphan-record audit (READ-ONLY). Finds inconsistencies
// between Firebase Auth, Firestore user docs, the userOrgIndex, the
// resellers collection, and per-org user subcollections.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json \
//     NODE_PATH=./functions/node_modules \
//     node scripts/dev/find-orphan-users.js [--json]
//
// Categories reported:
//
// A. Firestore user docs with no Auth record
//    - root users/{uid} or organizations/{orgId}/users/{uid}
//    - cannot log in but still occupies storage and may show in admin UIs
//
// B. Auth users with no Firestore user doc (reverse direction)
//    - can log in but the app's user lookup will 404 and likely crash
//
// C. userOrgIndex entries pointing to deleted Auth users
//    - stale routing; getUserOrganization() returns mapping for a ghost user
//
// D. userOrgIndex entries pointing to non-existent organizations
//    - stale routing; user would land on a 404 org
//
// E. Resellers with no Auth user pointing at them (resellerId on user doc)
//    - a reseller record exists but no one can log in as it
//
// F. Users with role=reseller and resellerId set, but the reseller doc is missing
//    - reverse of E; user can log in but their reseller profile is gone
//
// Sentinel handling: `_metadata` docs inside org-scoped collections are
// per-org shard metadata records written by DatabaseShardingService. They
// are NOT orphans; suppressed from the count but reported separately.
//
// Cleanup is a separate, authorised step — this script does not delete.

const admin = require('firebase-admin');

const FLAG_JSON = process.argv.includes('--json');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'hr-disciplinary-system' });
}

const auth = admin.auth();
const db = admin.firestore();

async function listAllAuthUsers() {
  const users = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    for (const u of result.users) {
      users.push({
        uid: u.uid,
        email: u.email || null,
        disabled: u.disabled || false,
        customClaims: u.customClaims || {},
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime || null,
      });
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return users;
}

async function listRootUserDocs() {
  const snap = await db.collection('users').get();
  return snap.docs.map(d => ({
    id: d.id,
    data: d.data(),
    path: `users/${d.id}`,
  }));
}

async function listAllOrganizations() {
  const snap = await db.collection('organizations').get();
  return snap.docs.map(d => ({ id: d.id, name: d.get('name') || '(unknown)' }));
}

async function listAllOrgUserDocs(orgIds) {
  const out = [];
  for (const org of orgIds) {
    const usersSnap = await db.collection('organizations').doc(org.id).collection('users').get();
    for (const u of usersSnap.docs) {
      out.push({
        id: u.id,
        data: u.data(),
        organizationId: org.id,
        organizationName: org.name,
        path: `organizations/${org.id}/users/${u.id}`,
      });
    }
  }
  return out;
}

async function listUserOrgIndex() {
  const snap = await db.collection('userOrgIndex').get();
  return snap.docs.map(d => ({
    id: d.id,
    organizationId: d.get('organizationId') || null,
    userId: d.get('userId') || null,
    path: `userOrgIndex/${d.id}`,
  }));
}

async function listResellers() {
  const snap = await db.collection('resellers').get();
  return snap.docs.map(d => ({
    id: d.id,
    email: d.get('email') || null,
    firstName: d.get('firstName') || null,
    lastName: d.get('lastName') || null,
    isActive: d.get('isActive') ?? null,
    path: `resellers/${d.id}`,
  }));
}

function describeUserDoc(doc) {
  const role = doc.data?.role;
  return {
    id: doc.id,
    path: doc.path,
    email: doc.data?.email || null,
    role: typeof role === 'object' ? role?.id : role,
    organizationId: doc.organizationId || doc.data?.organizationId || null,
    organizationName: doc.organizationName || null,
    resellerId: doc.data?.resellerId || null,
    isDemoProspect: doc.data?.isDemoProspect || false,
    createdAt: doc.data?.createdAt?.toDate
      ? doc.data.createdAt.toDate().toISOString()
      : doc.data?.createdAt || null,
  };
}

async function main() {
  const startedAt = Date.now();
  const orgs = await listAllOrganizations();

  const [authUsers, rootDocs, orgDocs, userOrgIndexEntries, resellers] = await Promise.all([
    listAllAuthUsers(),
    listRootUserDocs(),
    listAllOrgUserDocs(orgs),
    listUserOrgIndex(),
    listResellers(),
  ]);

  const authUidSet = new Set(authUsers.map(u => u.uid));
  const orgIdSet = new Set(orgs.map(o => o.id));
  const allUserDocs = [...rootDocs, ...orgDocs];

  // A. Firestore docs without Auth (excluding _metadata sentinels)
  const sentinelDocs = allUserDocs.filter(d => d.id === '_metadata');
  const fsWithoutAuth = allUserDocs
    .filter(d => d.id !== '_metadata' && !authUidSet.has(d.id))
    .map(describeUserDoc);

  // B. Auth without Firestore (uid not in any user doc)
  const userDocUidSet = new Set(allUserDocs.filter(d => d.id !== '_metadata').map(d => d.id));
  const authWithoutFs = authUsers
    .filter(u => !userDocUidSet.has(u.uid))
    .map(u => ({
      uid: u.uid,
      email: u.email,
      disabled: u.disabled,
      role: u.customClaims?.r || u.customClaims?.role || null,
      organizationId: u.customClaims?.org || u.customClaims?.organizationId || null,
      creationTime: u.creationTime,
      lastSignInTime: u.lastSignInTime,
    }));

  // C. userOrgIndex pointing to deleted Auth user
  const indexOrphansAuth = userOrgIndexEntries.filter(e => !authUidSet.has(e.id));

  // D. userOrgIndex pointing to deleted organization (excluding the
  // intentional 'system' sentinel — super-users and resellers have
  // organizationId='system' by design; see UserOrgIndexService line ~234
  // and AuthContext line ~192/260)
  const indexOrphansOrg = userOrgIndexEntries.filter(
    e => e.organizationId && e.organizationId !== 'system' && !orgIdSet.has(e.organizationId)
  );

  // E. Reseller docs with no user pointing at them via resellerId
  const resellerIdsReferencedByUsers = new Set(
    allUserDocs
      .filter(d => d.data?.resellerId)
      .map(d => d.data.resellerId)
  );
  const resellersWithoutUser = resellers.filter(r => !resellerIdsReferencedByUsers.has(r.id));

  // F. Users with role=reseller pointing at non-existent reseller doc
  const resellerIdSet = new Set(resellers.map(r => r.id));
  const userDocsWithBadResellerLink = allUserDocs
    .filter(d => {
      const role = d.data?.role;
      const roleId = typeof role === 'object' ? role?.id : role;
      return roleId === 'reseller' && d.data?.resellerId && !resellerIdSet.has(d.data.resellerId);
    })
    .map(describeUserDoc);

  const report = {
    scannedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    counts: {
      authUsers: authUsers.length,
      firestoreUserDocs: allUserDocs.length - sentinelDocs.length,
      metadataSentinels: sentinelDocs.length,
      organizations: orgs.length,
      userOrgIndexEntries: userOrgIndexEntries.length,
      resellers: resellers.length,
    },
    A_fsDocsWithoutAuth: fsWithoutAuth,
    B_authWithoutFsDoc: authWithoutFs,
    C_userOrgIndexNoAuth: indexOrphansAuth.map(e => ({
      uid: e.id,
      organizationId: e.organizationId,
      path: e.path,
    })),
    D_userOrgIndexNoOrg: indexOrphansOrg.map(e => ({
      uid: e.id,
      organizationId: e.organizationId,
      path: e.path,
    })),
    E_resellersWithoutLinkedUser: resellersWithoutUser.map(r => ({
      id: r.id,
      email: r.email,
      name: r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : null,
      isActive: r.isActive,
      path: r.path,
    })),
    F_userDocsWithBrokenResellerLink: userDocsWithBadResellerLink,
  };

  if (FLAG_JSON) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n=== Orphan / inconsistency audit ===');
  console.log(`scanned at: ${report.scannedAt}  (${report.elapsedMs}ms)\n`);

  console.log(`Counts:`);
  console.log(`  auth users:           ${report.counts.authUsers}`);
  console.log(`  firestore user docs:  ${report.counts.firestoreUserDocs}  (+${report.counts.metadataSentinels} _metadata sentinels)`);
  console.log(`  organizations:        ${report.counts.organizations}`);
  console.log(`  userOrgIndex entries: ${report.counts.userOrgIndexEntries}`);
  console.log(`  resellers:            ${report.counts.resellers}\n`);

  const sections = [
    ['A', 'Firestore user docs WITHOUT Auth record', report.A_fsDocsWithoutAuth, o =>
      `${o.path}\n      email: ${o.email ?? '(none)'}    role: ${o.role ?? '(none)'}` +
      (o.organizationName ? `\n      org: ${o.organizationName} (${o.organizationId})` : '') +
      (o.resellerId ? `\n      resellerId: ${o.resellerId}` : '')],
    ['B', 'Auth users WITHOUT Firestore user doc', report.B_authWithoutFsDoc, o =>
      `auth uid: ${o.uid}\n      email: ${o.email ?? '(none)'}    role-claim: ${o.role ?? '(none)'}` +
      (o.organizationId ? `\n      org-claim: ${o.organizationId}` : '') +
      `\n      created: ${o.creationTime}    last sign-in: ${o.lastSignInTime ?? 'never'}` +
      (o.disabled ? `\n      ⚠️  disabled` : '')],
    ['C', 'userOrgIndex entries pointing to DELETED Auth user', report.C_userOrgIndexNoAuth, e =>
      `${e.path}    → org: ${e.organizationId}`],
    ['D', 'userOrgIndex entries pointing to NON-EXISTENT organization', report.D_userOrgIndexNoOrg, e =>
      `${e.path}    → missing org: ${e.organizationId}`],
    ['E', 'Resellers with NO user pointing at them', report.E_resellersWithoutLinkedUser, r =>
      `${r.path}\n      ${r.name ?? '(no name)'}  ${r.email ?? '(no email)'}  active=${r.isActive}`],
    ['F', 'User docs with role=reseller pointing at MISSING reseller doc', report.F_userDocsWithBrokenResellerLink, o =>
      `${o.path}\n      email: ${o.email}    broken resellerId: ${o.resellerId}`],
  ];

  let totalIssues = 0;
  for (const [letter, title, items, fmt] of sections) {
    console.log(`${letter}. ${title}: ${items.length}`);
    for (const item of items) {
      console.log(`    ${fmt(item)}\n`);
    }
    totalIssues += items.length;
  }

  console.log(`Total issues: ${totalIssues}`);
  console.log(`\nCleanup is a separate authorised step — review each entry before deleting.\n`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('audit failed:', err);
    process.exit(1);
  });
