#!/usr/bin/env node

/**
 * Quick setup script to add default warning categories to existing organizations
 * This fixes the console errors from missing warningCategories collection
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (uses default credentials or service account)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const DEFAULT_CATEGORIES = [
  {
    name: 'Attendance Issues',
    description: 'Unauthorized absence, tardiness, or attendance-related misconduct',
    severity: 'medium',
    escalationPath: ['counselling', 'verbal', 'written', 'final'],
    requiredDocuments: ['attendance_record'],
    isActive: true
  },
  {
    name: 'Safety Violations',
    description: 'Violation of workplace safety protocols and procedures',
    severity: 'high',
    escalationPath: ['written', 'final', 'dismissal'],
    requiredDocuments: ['incident_report', 'safety_checklist'],
    isActive: true
  },
  {
    name: 'Performance Issues',
    description: 'Poor work performance or failure to meet job requirements',
    severity: 'medium',
    escalationPath: ['counselling', 'verbal', 'written', 'final'],
    requiredDocuments: ['performance_review'],
    isActive: true
  },
  {
    name: 'Misconduct',
    description: 'General workplace misconduct or inappropriate behavior',
    severity: 'medium',
    escalationPath: ['counselling', 'verbal', 'written', 'final'],
    requiredDocuments: ['incident_report'],
    isActive: true
  },
  {
    name: 'Policy Violations',
    description: 'Violation of company policies or procedures',
    severity: 'medium',
    escalationPath: ['verbal', 'written', 'final'],
    requiredDocuments: ['policy_document'],
    isActive: true
  }
];

async function setupCategories() {
  try {
    console.log('🔍 Finding existing organizations...');
    
    // Get all organizations
    const orgsSnapshot = await db.collection('organizations').get();
    
    if (orgsSnapshot.empty) {
      console.log('⚠️ No organizations found. Categories will be added when organizations are created.');
      return;
    }

    console.log(`📋 Found ${orgsSnapshot.size} organization(s)`);

    // Process each organization
    const batch = db.batch();
    let addedCount = 0;

    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      
      console.log(`\n🏢 Processing organization: ${orgData.name || orgId}`);

      // Check if categories already exist for this org
      const existingCategories = await db.collection('warningCategories')
        .where('organizationId', '==', orgId)
        .get();

      if (!existingCategories.empty) {
        console.log(`  ✅ Already has ${existingCategories.size} categories, skipping...`);
        continue;
      }

      // Add default categories for this organization
      console.log(`  📝 Adding ${DEFAULT_CATEGORIES.length} default categories...`);
      
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const category = DEFAULT_CATEGORIES[i];
        const categoryId = `${orgId}-${category.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        const categoryData = {
          id: categoryId,
          organizationId: orgId,
          ...category,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const categoryRef = db.collection('warningCategories').doc(categoryId);
        batch.set(categoryRef, categoryData);
        addedCount++;
        
        console.log(`    ✓ ${category.name}`);
      }
    }

    if (addedCount > 0) {
      console.log(`\n💾 Committing ${addedCount} categories to Firestore...`);
      await batch.commit();
      console.log('✅ Successfully added default warning categories!');
    } else {
      console.log('\n✅ All organizations already have warning categories configured.');
    }

    console.log('\n🎉 Setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up categories:', error);
    process.exit(1);
  }
}

// Run the setup
setupCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });