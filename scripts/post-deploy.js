#!/usr/bin/env node
// scripts/post-deploy.js
// Writes the current build version to Firestore system/appVersion
// Run after firebase deploy to trigger client-side app updates
//
// Usage: node scripts/post-deploy.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize with service account
const serviceAccountPath = path.resolve(__dirname, '../hr-disciplinary-system-firebase-adminsdk-fbsvc-e1bb9c1772.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found at:', serviceAccountPath);
  console.error('   Set GOOGLE_APPLICATION_CREDENTIALS or place the key file in the project root.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

// Extract build version from the built index.html or use timestamp
// The __BUILD_VERSION__ in the built JS files is the same Date.now() from build time
// We parse it from the built output to ensure exact match
async function getBuildVersion() {
  const indexPath = path.resolve(__dirname, '../frontend/dist/index.html');

  if (fs.existsSync(indexPath)) {
    // The version is baked into the JS bundle. Use the file modification time as a proxy
    // that exactly matches the Date.now() from build time (within seconds).
    // For exact match, we embed it in a known location.
    const stat = fs.statSync(indexPath);
    return stat.mtimeMs.toString().split('.')[0]; // milliseconds, no decimal
  }

  // Fallback
  return Date.now().toString();
}

async function main() {
  // Instead of trying to parse the bundle, use the same approach:
  // store the build timestamp. The Vite config uses Date.now() at build time.
  // We read it from a marker file that we'll create during the build.
  const markerPath = path.resolve(__dirname, '../frontend/dist/.build-version');
  let version;

  if (fs.existsSync(markerPath)) {
    version = fs.readFileSync(markerPath, 'utf8').trim();
  } else {
    console.warn('⚠️  No .build-version marker found. Using current timestamp.');
    version = Date.now().toString();
  }

  try {
    await db.collection('system').doc('appVersion').set({
      version,
      deployedAt: admin.firestore.FieldValue.serverTimestamp(),
      deployedBy: process.env.USER || 'unknown'
    });

    console.log(`✅ App version updated in Firestore: ${version}`);
  } catch (error) {
    console.error('❌ Failed to update app version:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
