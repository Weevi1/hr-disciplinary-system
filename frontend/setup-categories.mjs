#!/usr/bin/env node

/**
 * Setup script to add default warning categories
 * Uses the same Firebase config as the frontend
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCghheyHpRDcc-2sue-u1apExJr6jQCzyw",
  authDomain: "hr-disciplinary-system.firebaseapp.com",
  projectId: "hr-disciplinary-system",
  storageBucket: "hr-disciplinary-system.firebasestorage.app",
  messagingSenderId: "989741369966",
  appId: "1:989741369966:web:e388dc78d75744d828747f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    console.log('🔍 Checking for existing organizations...');
    
    // Get all organizations
    const orgsRef = collection(db, 'organizations');
    const orgsSnapshot = await getDocs(orgsRef);
    
    if (orgsSnapshot.empty) {
      console.log('⚠️ No organizations found. Creating demo organization...');
      // Could create a demo org here, but for now just warn
      console.log('   Run the frontend app first to create an organization.');
      return;
    }

    console.log(`📋 Found ${orgsSnapshot.size} organization(s)`);

    const batch = writeBatch(db);
    let addedCount = 0;

    // Process each organization
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgData = orgDoc.data();
      
      console.log(`\n🏢 Processing: ${orgData.name || orgId}`);

      // Check existing categories
      const categoriesRef = collection(db, 'warningCategories');
      const existingQuery = query(categoriesRef, where('organizationId', '==', orgId));
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        console.log(`  ✅ Already has ${existingSnapshot.size} categories, skipping...`);
        continue;
      }

      // Add default categories
      console.log(`  📝 Adding ${DEFAULT_CATEGORIES.length} default categories...`);
      
      for (const category of DEFAULT_CATEGORIES) {
        const categoryId = `${orgId}-${category.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        const categoryData = {
          id: categoryId,
          organizationId: orgId,
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const categoryRef = doc(db, 'warningCategories', categoryId);
        batch.set(categoryRef, categoryData);
        addedCount++;
        
        console.log(`    ✓ ${category.name}`);
      }
    }

    if (addedCount > 0) {
      console.log(`\n💾 Saving ${addedCount} categories to Firestore...`);
      await batch.commit();
      console.log('✅ Successfully added default warning categories!');
    } else {
      console.log('\n✅ All organizations already have warning categories.');
    }

    console.log('\n🎉 Setup complete! Console errors should be resolved.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });