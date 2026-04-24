// functions/src/Reseller/demoManagement.ts
// Reseller demo organization lifecycle — deploy, reset, delete, prospect logins.
// All operations require the caller to be a reseller and to own the target demo org.

import * as admin from 'firebase-admin';
import { HttpsError, CallableRequest, onCall } from 'firebase-functions/v2/https';
import { DEMO_SAMPLE_EMPLOYEES } from './demoSeedData';
import { DEMO_SEED_CATEGORIES } from './demoCategories';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const DEMO_CONCURRENT_LIMIT = 5;

// ─── helpers ─────────────────────────────────────────────────────────────────

const extractRole = (userData: any): string => {
  if (!userData) return '';
  if (typeof userData.role === 'string') return userData.role;
  if (typeof userData.role === 'object' && userData.role?.id) return userData.role.id;
  return '';
};

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'demo';

const shortHash = (): string =>
  Math.random().toString(36).slice(2, 8);

const randomPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

/**
 * Verify caller is a reseller, return their user data.
 * Throws HttpsError on failure.
 */
async function requireReseller(uid: string): Promise<{ userData: any; resellerId: string }> {
  const callerDoc = await admin.firestore().collection('users').doc(uid).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'User profile not found');
  }
  const userData = callerDoc.data();
  const role = extractRole(userData);
  if (role !== 'reseller') {
    throw new HttpsError('permission-denied', 'Only resellers can manage demo organizations');
  }
  const resellerId = userData?.resellerId;
  if (!resellerId) {
    throw new HttpsError('permission-denied', 'Reseller profile missing resellerId');
  }
  return { userData, resellerId };
}

/**
 * Verify the caller owns the given demo org. Returns the org snapshot.
 */
async function requireDemoOrgOwnership(
  orgId: string,
  resellerId: string
): Promise<admin.firestore.DocumentSnapshot> {
  const orgRef = admin.firestore().collection('organizations').doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError('not-found', `Organization ${orgId} not found`);
  }
  const org = orgSnap.data();
  if (!org?.isDemo) {
    throw new HttpsError('failed-precondition', 'This is not a demo organization');
  }
  if (org.resellerId !== resellerId) {
    throw new HttpsError('permission-denied', 'You do not own this demo organization');
  }
  return orgSnap;
}

/**
 * Count active demos owned by this reseller.
 */
async function countActiveDemos(resellerId: string): Promise<number> {
  const snap = await admin
    .firestore()
    .collection('organizations')
    .where('resellerId', '==', resellerId)
    .where('isDemo', '==', true)
    .where('isActive', '==', true)
    .get();
  return snap.size;
}

/**
 * Seed sample employees into a demo org. Uses a batched write.
 */
async function seedSampleEmployees(orgId: string): Promise<void> {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // Seeded employees are written with deterministic IDs so a reset produces
  // a byte-identical employee set (makes verification + cache behaviour sane).
  for (const emp of DEMO_SAMPLE_EMPLOYEES) {
    const ref = db.doc(`organizations/${orgId}/employees/${emp.employeeNumber}`);
    batch.set(ref, {
      id: emp.employeeNumber,
      organizationId: orgId,
      profile: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeNumber: emp.employeeNumber,
        email: emp.email,
        phoneNumber: emp.phoneNumber || '',
        whatsappNumber: emp.whatsappNumber || '',
        department: emp.department,
        position: emp.position,
        startDate: new Date()
      },
      employment: {
        startDate: new Date(),
        contractType: emp.contractType,
        department: emp.department,
        position: emp.position,
        managerIds: []
      },
      disciplinaryRecord: {
        totalWarnings: 0,
        activeWarnings: 0,
        currentLevel: 'none',
        warningHistory: [],
        warningsByCategory: {}
      },
      deliveryPreferences: {
        preferredMethod: emp.preferredMethod,
        whatsappNumber: emp.whatsappNumber || '',
        emailAddress: emp.email,
        allowMultipleMethods: true,
        requireReadReceipt: false,
        timezone: 'Africa/Johannesburg'
      },
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  // Update the _metadata doc's totalDocuments counter for the collection
  const metaRef = db.doc(`organizations/${orgId}/employees/_metadata`);
  batch.set(
    metaRef,
    {
      totalDocuments: DEMO_SAMPLE_EMPLOYEES.length,
      lastUpdated: now
    },
    { merge: true }
  );

  await batch.commit();
}

/**
 * Seed default Operations + Admin departments.
 */
async function seedDefaultDepartments(orgId: string): Promise<void> {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // Count seeded employees per department so the default-department docs
  // reflect the seeded reality rather than showing zero.
  const countByDept: Record<string, number> = {};
  DEMO_SAMPLE_EMPLOYEES.forEach(e => {
    countByDept[e.department] = (countByDept[e.department] || 0) + 1;
  });

  const defaults = [
    { name: 'Operations', description: 'Core business operations and daily management activities' },
    { name: 'Admin', description: 'Human resources, administration, and support functions' }
  ];

  for (const d of defaults) {
    const ref = db.collection(`organizations/${orgId}/departments`).doc();
    batch.set(ref, {
      id: ref.id,
      name: d.name,
      description: d.description,
      isDefault: true,
      isActive: true,
      organizationId: orgId,
      employeeCount: countByDept[d.name] || 0,
      createdAt: now,
      updatedAt: now
    });
  }

  await batch.commit();
}

/**
 * Seed default warning categories.
 */
async function seedDefaultCategories(orgId: string): Promise<void> {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  for (const cat of DEMO_SEED_CATEGORIES) {
    const ref = db.doc(`organizations/${orgId}/categories/${cat.id}`);
    batch.set(ref, {
      ...cat,
      organizationId: orgId,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  const metaRef = db.doc(`organizations/${orgId}/categories/_metadata`);
  batch.set(
    metaRef,
    { totalDocuments: DEMO_SEED_CATEGORIES.length, lastUpdated: now },
    { merge: true }
  );

  await batch.commit();
}

/**
 * Initialize the sharded-collection _metadata docs that the frontend expects.
 */
async function initializeShardedMetadata(orgId: string): Promise<void> {
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  const collections = ['employees', 'warnings', 'categories', 'users', 'meetings', 'reports'];
  for (const collectionName of collections) {
    const ref = db.doc(`organizations/${orgId}/${collectionName}/_metadata`);
    batch.set(ref, {
      collectionName,
      organizationId: orgId,
      createdAt: now,
      totalDocuments: 0,
      lastUpdated: now
    });
  }

  // settings/main
  const settingsRef = db.doc(`organizations/${orgId}/settings/main`);
  batch.set(settingsRef, {
    organizationId: orgId,
    defaultWarningLevel: 'verbal',
    requireWitnessSignature: true,
    autoEscalation: true,
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      deliveryConfirmation: true
    },
    customFields: [],
    createdAt: now
  });

  await batch.commit();
}

/**
 * Wipe every document in a sharded subcollection, preserving _metadata.
 */
async function wipeSubcollection(orgId: string, collectionName: string): Promise<number> {
  const db = admin.firestore();
  const snap = await db.collection(`organizations/${orgId}/${collectionName}`).get();
  if (snap.empty) return 0;

  let deleted = 0;
  // Delete in chunks of 400 to stay within batch limits
  const docs = snap.docs.filter(d => d.id !== '_metadata');
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + 400);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += chunk.length;
  }

  // Reset metadata counter
  const metaRef = db.doc(`organizations/${orgId}/${collectionName}/_metadata`);
  await metaRef.set(
    { totalDocuments: 0, lastUpdated: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  return deleted;
}

/**
 * Delete every response token tied to the demo org.
 */
async function wipeResponseTokens(orgId: string): Promise<number> {
  const db = admin.firestore();
  const snap = await db
    .collection('responseTokens')
    .where('organizationId', '==', orgId)
    .get();
  if (snap.empty) return 0;

  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.size;
}

/**
 * Delete all Storage files under a prefix. Used to clean evidence + audio on reset.
 */
async function deleteStoragePrefix(prefix: string): Promise<number> {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix });
  if (files.length === 0) return 0;

  await Promise.all(files.map(f => f.delete({ ignoreNotFound: true })));
  return files.length;
}

/**
 * Delete a list of Firebase Auth + Firestore user docs belonging to a demo.
 */
async function deleteProspectLogins(orgId: string, uids: string[]): Promise<void> {
  if (uids.length === 0) return;

  const db = admin.firestore();
  await Promise.all(
    uids.map(async uid => {
      try {
        await admin.auth().deleteUser(uid);
      } catch (err: any) {
        // If user already gone, ignore
        if (err?.code !== 'auth/user-not-found') {
          console.warn(`⚠️ Failed to delete auth user ${uid}:`, err?.message);
        }
      }
      try {
        await db.collection('users').doc(uid).delete();
      } catch (err: any) {
        console.warn(`⚠️ Failed to delete user doc ${uid}:`, err?.message);
      }
      try {
        await db.doc(`organizations/${orgId}/users/${uid}`).delete();
      } catch {
        // org-scoped user doc may or may not exist
      }
    })
  );
}

// ─── deployDemoOrganization ──────────────────────────────────────────────────

export const deployDemoOrganization = onCall(
  { enforceAppCheck: false, cors: true, region: 'us-central1' },
  async (request: CallableRequest<{ companyName: string }>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { resellerId } = await requireReseller(request.auth.uid);

    const companyName = (request.data?.companyName || '').trim();
    if (!companyName || companyName.length < 2) {
      throw new HttpsError('invalid-argument', 'Company name is required (min 2 characters)');
    }

    const active = await countActiveDemos(resellerId);
    if (active >= DEMO_CONCURRENT_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        `You have reached the demo limit (${DEMO_CONCURRENT_LIMIT} active demos). Delete or reuse an existing demo before deploying a new one.`
      );
    }

    const db = admin.firestore();
    const orgId = `demo-${slugify(companyName)}-${shortHash()}`;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const nowIso = new Date().toISOString();

    // Guard against (extremely rare) collision
    const existing = await db.collection('organizations').doc(orgId).get();
    if (existing.exists) {
      throw new HttpsError('already-exists', 'Demo ID collision — please retry');
    }

    console.log(`🧪 [DEMO] Deploying demo org ${orgId} for reseller ${resellerId}`);

    // 1. Create the organization document
    await db.collection('organizations').doc(orgId).set({
      id: orgId,
      name: companyName,
      industry: 'Demo',
      contactEmail: `demo@${orgId}.fifo.systems`,
      subscriptionTier: 'demo',
      subscriptionStatus: 'demo',
      resellerId,
      isDemo: true,
      demoMetadata: {
        resellerId,
        createdAt: nowIso,
        resetCount: 0,
        activeProspectLoginIds: []
      },
      branding: {
        logo: null,
        logoUrl: '',
        primaryColor: '#f59e0b',
        secondaryColor: '#1f2937',
        accentColor: '#fbbf24',
        companyName,
        domain: `${orgId}.fifo.systems`
      },
      settings: {
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
        language: 'en',
        defaultDeliveryMethod: 'email',
        allowEmployeeChoice: true,
        requireSignatures: true
      },
      customization: {
        enablePhotoCapture: true,
        enableWhatsAppDelivery: true,
        enablePrintDelivery: true,
        enableAudioRecording: true
      },
      createdAt: now,
      updatedAt: now,
      isActive: true,
      databaseVersion: '2.0',
      shardingEnabled: true,
      dataStructure: 'sharded'
    });

    // 2. Initialize sharded metadata + settings
    await initializeShardedMetadata(orgId);

    // 3. Seed categories, departments, employees (in parallel — independent writes)
    await Promise.all([
      seedDefaultCategories(orgId),
      seedDefaultDepartments(orgId),
      seedSampleEmployees(orgId)
    ]);

    // 4. Audit log
    await db.collection('auditLogs').add({
      action: 'DEMO_ORG_DEPLOYED',
      resourceType: 'organization',
      resourceId: orgId,
      performedBy: request.auth.uid,
      details: { companyName, resellerId, employeeCount: DEMO_SAMPLE_EMPLOYEES.length },
      timestamp: now
    });

    console.log(`✅ [DEMO] Deployed demo org ${orgId}`);
    return {
      orgId,
      companyName,
      employeeCount: DEMO_SAMPLE_EMPLOYEES.length,
      categoryCount: DEMO_SEED_CATEGORIES.length
    };
  }
);

// ─── createDemoProspectLogin ─────────────────────────────────────────────────

export const createDemoProspectLogin = onCall(
  { enforceAppCheck: false, cors: true, region: 'us-central1' },
  async (
    request: CallableRequest<{ orgId: string; prospectEmail?: string; prospectName?: string }>
  ) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { resellerId } = await requireReseller(request.auth.uid);
    const { orgId, prospectEmail, prospectName } = request.data || ({} as any);
    if (!orgId) throw new HttpsError('invalid-argument', 'orgId is required');

    const orgSnap = await requireDemoOrgOwnership(orgId, resellerId);
    const org = orgSnap.data()!;

    const db = admin.firestore();
    const email =
      (prospectEmail || '').trim().toLowerCase() ||
      `prospect-${Date.now()}@${orgId}.fifo.systems`;
    const password = randomPassword();
    const displayName = (prospectName || '').trim() || 'Prospect User';
    const [firstName, ...rest] = displayName.split(' ');
    const lastName = rest.join(' ') || 'Demo';

    // Create auth user
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false
      });
    } catch (err: any) {
      if (err?.code === 'auth/email-already-exists') {
        throw new HttpsError(
          'already-exists',
          'A user with this email already exists. Pick a different email.'
        );
      }
      throw err;
    }

    // Firestore user profile (top-level users/ collection follows existing pattern)
    const claimsVersion = 1;
    const profile = {
      uid: userRecord.uid,
      id: userRecord.uid,
      email,
      firstName,
      lastName,
      role: 'executive-management',
      organizationId: orgId,
      isActive: true,
      mustChangePassword: false, // demo — don't force on first login
      hasSeenWelcome: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      claimsVersion,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isDemoProspect: true
    };

    try {
      await Promise.all([
        db.collection('users').doc(userRecord.uid).set(profile),
        db.doc(`organizations/${orgId}/users/${userRecord.uid}`).set({
          ...profile,
          role: {
            id: 'executive-management',
            name: 'Executive Management',
            description: 'Demo Prospect (Executive Management)',
            level: 4
          }
        }),
        admin.auth().setCustomUserClaims(userRecord.uid, {
          org: orgId,
          r: 'executive-management',
          v: claimsVersion
        })
      ]);
    } catch (err) {
      // Rollback on failure
      console.error(`❌ Failed to provision prospect login — rolling back ${userRecord.uid}`, err);
      await admin.auth().deleteUser(userRecord.uid).catch(() => {});
      throw new HttpsError('internal', 'Failed to provision prospect login');
    }

    // Track on org demoMetadata
    const existing: string[] = org.demoMetadata?.activeProspectLoginIds || [];
    await orgSnap.ref.update({
      'demoMetadata.activeProspectLoginIds': [...existing, userRecord.uid],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('auditLogs').add({
      action: 'DEMO_PROSPECT_LOGIN_CREATED',
      resourceType: 'user',
      resourceId: userRecord.uid,
      performedBy: request.auth.uid,
      organizationId: orgId,
      details: { email, prospectName: displayName, resellerId },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { uid: userRecord.uid, email, password };
  }
);

// ─── resetDemoOrganization ───────────────────────────────────────────────────

export const resetDemoOrganization = onCall(
  { enforceAppCheck: false, cors: true, region: 'us-central1', timeoutSeconds: 300 },
  async (request: CallableRequest<{ orgId: string }>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { resellerId } = await requireReseller(request.auth.uid);
    const { orgId } = request.data || ({} as any);
    if (!orgId) throw new HttpsError('invalid-argument', 'orgId is required');

    const orgSnap = await requireDemoOrgOwnership(orgId, resellerId);
    const org = orgSnap.data()!;

    console.log(`🧨 [DEMO] Reset starting for ${orgId}`);

    // Wipe data (parallel — independent)
    const [warningsDeleted, employeesDeleted, tokensDeleted, warningStorageDeleted] =
      await Promise.all([
        wipeSubcollection(orgId, 'warnings'),
        wipeSubcollection(orgId, 'employees'),
        wipeResponseTokens(orgId),
        deleteStoragePrefix(`warnings/${orgId}/`)
      ]);

    // temp-downloads/{orgId} cleanup + temporaryFiles docs
    const [tempStorageDeleted] = await Promise.all([deleteStoragePrefix(`temp-downloads/${orgId}/`)]);

    const db = admin.firestore();
    const tempFilesSnap = await db
      .collection('temporaryFiles')
      .where('organizationId', '==', orgId)
      .get();
    if (!tempFilesSnap.empty) {
      for (let i = 0; i < tempFilesSnap.docs.length; i += 400) {
        const batch = db.batch();
        tempFilesSnap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // Prospect logins
    const prospectUids: string[] = org.demoMetadata?.activeProspectLoginIds || [];
    await deleteProspectLogins(orgId, prospectUids);

    // Departments — delete + re-seed for clean state (drops any prospect-created ones)
    await wipeSubcollection(orgId, 'departments').catch(() => 0);
    await seedDefaultDepartments(orgId);

    // Re-seed canonical sample employees
    await seedSampleEmployees(orgId);

    // Update demoMetadata
    const newResetCount = (org.demoMetadata?.resetCount || 0) + 1;
    const nowIso = new Date().toISOString();
    await orgSnap.ref.update({
      'demoMetadata.lastResetAt': nowIso,
      'demoMetadata.resetCount': newResetCount,
      'demoMetadata.activeProspectLoginIds': [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('auditLogs').add({
      action: 'DEMO_ORG_RESET',
      resourceType: 'organization',
      resourceId: orgId,
      performedBy: request.auth.uid,
      details: {
        resellerId,
        warningsDeleted,
        employeesDeleted,
        tokensDeleted,
        warningStorageDeleted,
        tempStorageDeleted,
        prospectLoginsRevoked: prospectUids.length,
        resetCount: newResetCount
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ [DEMO] Reset complete for ${orgId}`);
    return {
      resetAt: nowIso,
      resetCount: newResetCount,
      warningsDeleted,
      employeesDeleted,
      tokensDeleted,
      prospectLoginsRevoked: prospectUids.length
    };
  }
);

// ─── deleteDemoOrganization ──────────────────────────────────────────────────

export const deleteDemoOrganization = onCall(
  { enforceAppCheck: false, cors: true, region: 'us-central1', timeoutSeconds: 300 },
  async (request: CallableRequest<{ orgId: string }>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    const { resellerId } = await requireReseller(request.auth.uid);
    const { orgId } = request.data || ({} as any);
    if (!orgId) throw new HttpsError('invalid-argument', 'orgId is required');

    const orgSnap = await requireDemoOrgOwnership(orgId, resellerId);
    const org = orgSnap.data()!;

    console.log(`🗑️  [DEMO] Deleting demo org ${orgId}`);

    // Wipe all subcollections (parallel where safe)
    await Promise.all([
      wipeSubcollection(orgId, 'warnings'),
      wipeSubcollection(orgId, 'employees'),
      wipeSubcollection(orgId, 'categories'),
      wipeSubcollection(orgId, 'meetings'),
      wipeSubcollection(orgId, 'reports'),
      wipeSubcollection(orgId, 'users'),
      wipeResponseTokens(orgId),
      deleteStoragePrefix(`warnings/${orgId}/`),
      deleteStoragePrefix(`temp-downloads/${orgId}/`)
    ]);
    await wipeSubcollection(orgId, 'departments').catch(() => 0);

    // Delete prospect logins
    const prospectUids: string[] = org.demoMetadata?.activeProspectLoginIds || [];
    await deleteProspectLogins(orgId, prospectUids);

    // Delete metadata + settings docs and the org doc itself
    const db = admin.firestore();
    const metaDocs = ['employees', 'warnings', 'categories', 'users', 'meetings', 'reports']
      .map(c => db.doc(`organizations/${orgId}/${c}/_metadata`));
    const deleteBatch = db.batch();
    metaDocs.forEach(ref => deleteBatch.delete(ref));
    deleteBatch.delete(db.doc(`organizations/${orgId}/settings/main`));
    deleteBatch.delete(db.doc(`organizations/${orgId}`));
    await deleteBatch.commit();

    // temporaryFiles
    const tempFilesSnap = await db
      .collection('temporaryFiles')
      .where('organizationId', '==', orgId)
      .get();
    if (!tempFilesSnap.empty) {
      for (let i = 0; i < tempFilesSnap.docs.length; i += 400) {
        const batch = db.batch();
        tempFilesSnap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

    await db.collection('auditLogs').add({
      action: 'DEMO_ORG_DELETED',
      resourceType: 'organization',
      resourceId: orgId,
      performedBy: request.auth.uid,
      details: { resellerId, prospectLoginsRevoked: prospectUids.length },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ [DEMO] Demo org ${orgId} deleted`);
    return { deletedAt: new Date().toISOString(), orgId };
  }
);
