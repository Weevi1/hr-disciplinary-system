#!/usr/bin/env node

/**
 * Production Database Initialization Script
 * 
 * Sets up essential data collections for the HR disciplinary system
 * Resolves missing warningCategories and sectors collections
 * 
 * Usage: node scripts/database/initialize-production-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin (requires service account key)
try {
  const serviceAccount = require('../../functions/service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com'
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin. Ensure service-account-key.json exists.');
  process.exit(1);
}

const db = admin.firestore();

// Universal Warning Categories (from UniversalCategories.ts)
const UNIVERSAL_CATEGORIES = [
  {
    id: 'attendance_punctuality',
    name: 'Attendance & Punctuality',
    description: 'Issues related to attendance, late arrivals, early departures, and absenteeism',
    severity: 'minor',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 3 - Progressive Discipline',
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal'],
    escalationRationale: 'Full progressive discipline allowing employee rehabilitation through consistent attendance',
    commonExamples: [
      'Arriving late for work repeatedly',
      'Leaving work early without permission',
      'Excessive sick leave without medical certificates',
      'Taking unauthorized breaks',
      'Not reporting absence timeously'
    ],
    proceduralRequirements: [
      'Verbal counseling session documented',
      'Clear attendance expectations communicated',
      'Reasonable opportunity to improve provided',
      'Medical incapacity vs misconduct distinction'
    ],
    evidenceRequired: [
      'Attendance registers/timesheets',
      'Previous counseling records',
      'Company attendance policy',
      'Medical certificates if applicable'
    ],
    ccmaFactors: [
      'Consistency of attendance issues',
      'Impact on workplace operations',
      'Previous warnings and interventions',
      'Personal circumstances considered'
    ],
    defaultValidityPeriod: 6,
    requiresImmediateAction: false,
    allowsWarningSkipping: false
  },
  {
    id: 'performance_issues',
    name: 'Performance Issues',
    description: 'Work quality, productivity, meeting deadlines, and job competency concerns',
    severity: 'minor',
    lraSection: 'LRA Section 188(1)(a) - Incapacity',
    schedule8Reference: 'Schedule 8 Item 10 - Poor Work Performance',
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'dismissal'],
    escalationRationale: 'Extended progressive discipline with emphasis on training and support before dismissal',
    commonExamples: [
      'Consistently missing deadlines',
      'Poor quality work output',
      'Inability to meet performance targets',
      'Lack of required job skills',
      'Failure to follow work procedures'
    ],
    proceduralRequirements: [
      'Performance standards clearly defined',
      'Regular performance reviews conducted',
      'Training and support opportunities provided',
      'Reasonable time for improvement allowed'
    ],
    evidenceRequired: [
      'Performance evaluations',
      'Work output samples',
      'Training records',
      'Job description and KPIs',
      'Comparison with peer performance'
    ],
    ccmaFactors: [
      'Clarity of performance expectations',
      'Training and development provided',
      'Personal circumstances affecting performance',
      'Consistency of performance management'
    ],
    defaultValidityPeriod: 12,
    requiresImmediateAction: false,
    allowsWarningSkipping: false
  },
  {
    id: 'safety_violations',
    name: 'Safety Violations',
    description: 'Workplace health and safety non-compliance, risk-taking behavior',
    severity: 'serious',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 6 - Endangering Safety',
    escalationPath: ['verbal', 'first_written', 'dismissal'],
    escalationRationale: 'Accelerated escalation due to safety implications - limited tolerance for safety breaches',
    commonExamples: [
      'Not wearing required PPE',
      'Ignoring safety procedures',
      'Creating unsafe working conditions',
      'Failure to report safety incidents',
      'Operating equipment without authorization'
    ],
    proceduralRequirements: [
      'Safety induction and training documented',
      'Clear safety policies communicated',
      'Risk assessment considerations',
      'OHSA compliance review'
    ],
    evidenceRequired: [
      'Safety policy documentation',
      'Training records',
      'Incident reports',
      'Witness statements',
      'Photos/videos of violations'
    ],
    ccmaFactors: [
      'Severity of safety breach',
      'Potential consequences',
      'Previous safety training',
      'Workplace safety culture'
    ],
    defaultValidityPeriod: 12,
    requiresImmediateAction: true,
    allowsWarningSkipping: true
  },
  {
    id: 'insubordination_disrespect',
    name: 'Insubordination & Disrespect',
    description: 'Refusing lawful instructions, disrespectful behavior, undermining authority',
    severity: 'serious',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 4 - Insubordination',
    escalationPath: ['verbal', 'first_written', 'final_written', 'dismissal'],
    escalationRationale: 'Progressive discipline with severity consideration - serious cases may skip levels',
    commonExamples: [
      'Refusing to follow lawful instructions',
      'Disrespectful language to supervisors',
      'Undermining management authority',
      'Inappropriate behavior in meetings',
      'Challenging decisions inappropriately'
    ],
    proceduralRequirements: [
      'Clear instruction/expectation documented',
      'Context of insubordination established',
      'Reasonableness of instruction confirmed',
      'Witness statements collected'
    ],
    evidenceRequired: [
      'Written instructions/policies',
      'Witness statements',
      'Email communications',
      'Meeting minutes',
      'Previous disciplinary records'
    ],
    ccmaFactors: [
      'Reasonableness of instruction',
      'Manner of refusal',
      'Impact on workplace discipline',
      'Previous relationship dynamics'
    ],
    defaultValidityPeriod: 12,
    requiresImmediateAction: false,
    allowsWarningSkipping: true
  },
  {
    id: 'policy_violations',
    name: 'Policy Violations',
    description: 'Breaching company policies, procedures, and workplace rules',
    severity: 'minor',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 7 - Breach of Rules',
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal'],
    escalationRationale: 'Flexible progressive discipline based on policy importance and breach severity',
    commonExamples: [
      'Dress code violations',
      'Misuse of company property',
      'Inappropriate use of technology',
      'Breach of confidentiality',
      'Non-compliance with procedures'
    ],
    proceduralRequirements: [
      'Policy clearly communicated',
      'Employee awareness confirmed',
      'Consistent policy application',
      'Reasonable policy interpretation'
    ],
    evidenceRequired: [
      'Written policies/procedures',
      'Training records',
      'Policy acknowledgment forms',
      'Breach documentation',
      'Consistent application evidence'
    ],
    ccmaFactors: [
      'Clarity of policy',
      'Severity of breach',
      'Consistent enforcement',
      'Employee understanding'
    ],
    defaultValidityPeriod: 6,
    requiresImmediateAction: false,
    allowsWarningSkipping: false
  },
  {
    id: 'dishonesty_theft',
    name: 'Dishonesty & Theft',
    description: 'Stealing, fraud, dishonest conduct, misrepresentation',
    severity: 'gross_misconduct',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 1 - Dishonesty',
    escalationPath: ['dismissal'],
    escalationRationale: 'Zero tolerance - trust relationship broken, immediate dismissal justified',
    commonExamples: [
      'Stealing company property',
      'Fraudulent expense claims',
      'Falsifying documents',
      'Lying about qualifications',
      'Misrepresenting work activities'
    ],
    proceduralRequirements: [
      'Thorough investigation conducted',
      'Clear evidence of dishonesty',
      'Fair hearing provided',
      'Legal implications considered'
    ],
    evidenceRequired: [
      'Physical evidence',
      'Financial records',
      'Security footage',
      'Witness statements',
      'Investigation reports'
    ],
    ccmaFactors: [
      'Strength of evidence',
      'Impact on trust relationship',
      'Value of items/amounts involved',
      'Premeditation vs opportunistic'
    ],
    defaultValidityPeriod: 12,
    requiresImmediateAction: true,
    allowsWarningSkipping: true
  },
  {
    id: 'substance_abuse',
    name: 'Substance Abuse',
    description: 'Alcohol/drug use affecting work, reporting to work under influence',
    severity: 'serious',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 8 - Intoxication',
    escalationPath: ['suspension', 'first_written', 'final_written', 'dismissal'],
    escalationRationale: 'Treatment-focused approach with clear boundaries and support for rehabilitation',
    commonExamples: [
      'Reporting to work under influence',
      'Consuming alcohol on premises',
      'Drug use affecting performance',
      'Refusing substance testing',
      'Safety risks from impairment'
    ],
    proceduralRequirements: [
      'Clear substance policy in place',
      'Testing procedures followed',
      'Employee assistance offered',
      'Medical evaluation considered'
    ],
    evidenceRequired: [
      'Testing results',
      'Witness observations',
      'Incident reports',
      'Medical reports',
      'Policy documentation'
    ],
    ccmaFactors: [
      'Safety implications',
      'Treatment willingness',
      'Pattern of behavior',
      'Support provided'
    ],
    defaultValidityPeriod: 12,
    requiresImmediateAction: true,
    allowsWarningSkipping: true
  },
  {
    id: 'harassment_discrimination',
    name: 'Harassment & Discrimination',
    description: 'Sexual harassment, unfair discrimination, creating hostile work environment',
    severity: 'gross_misconduct',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 2 - Sexual Harassment',
    escalationPath: ['dismissal'],
    escalationRationale: 'Zero tolerance approach - fundamental workplace rights violation requiring immediate action',
    commonExamples: [
      'Sexual harassment of colleagues',
      'Racial/gender discrimination',
      'Creating hostile work environment',
      'Inappropriate sexual conduct',
      'Discriminatory language/behavior'
    ],
    proceduralRequirements: [
      'Comprehensive investigation',
      'Support for complainant',
      'PEPUDA considerations',
      'Legal consultation advised'
    ],
    evidenceRequired: [
      'Complainant statements',
      'Witness statements',
      'Communication records',
      'Pattern evidence',
      'Investigation reports'
    ],
    ccmaFactors: [
      'Severity of conduct',
      'Impact on complainant',
      'Workplace culture effect',
      'Legal compliance'
    ],
    defaultValidityPeriod: 12,
    requiresImmediateAction: true,
    allowsWarningSkipping: true
  }
];

// South African Industry Sectors
const SOUTH_AFRICAN_SECTORS = [
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production, assembly, and manufacturing operations',
    specificConsiderations: [
      'OHSA compliance critical',
      'Shift work patterns',
      'Machinery safety requirements',
      'Quality control standards'
    ],
    commonRoles: ['Production Worker', 'Machine Operator', 'Quality Controller', 'Supervisor', 'Maintenance']
  },
  {
    id: 'retail',
    name: 'Retail & Commerce',
    description: 'Sales, customer service, and retail operations',
    specificConsiderations: [
      'Customer interaction standards',
      'Cash handling procedures',
      'Inventory management',
      'Flexible working hours'
    ],
    commonRoles: ['Sales Assistant', 'Cashier', 'Store Manager', 'Merchandiser', 'Stock Controller']
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    description: 'Medical services, patient care, and healthcare operations',
    specificConsiderations: [
      'Patient safety paramount',
      'HPCSA compliance',
      'Confidentiality critical',
      'Emergency response requirements'
    ],
    commonRoles: ['Nurse', 'Doctor', 'Admin Clerk', 'Security', 'Cleaner']
  },
  {
    id: 'security',
    name: 'Security Services',
    description: 'Security, protection, and safety services',
    specificConsiderations: [
      'PSIRA compliance',
      'Access control protocols',
      'Emergency procedures',
      'Client relationship management'
    ],
    commonRoles: ['Security Guard', 'Control Room Operator', 'Supervisor', 'Response Officer']
  },
  {
    id: 'mining',
    name: 'Mining & Extraction',
    description: 'Mining operations and resource extraction',
    specificConsiderations: [
      'MHSA compliance',
      'Underground safety critical',
      'Environmental regulations',
      'Specialized training required'
    ],
    commonRoles: ['Miner', 'Machine Operator', 'Safety Officer', 'Supervisor', 'Engineer']
  }
];

/**
 * Initialize warning categories for an organization
 */
async function initializeWarningCategories(organizationId) {
  console.log(`📝 Initializing warning categories for organization: ${organizationId}`);
  
  const batch = db.batch();
  
  for (const category of UNIVERSAL_CATEGORIES) {
    const categoryRef = db.collection('warningCategories').doc();
    const categoryData = {
      ...category,
      organizationId,
      isActive: true,
      isUniversal: true,
      customizations: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(categoryRef, categoryData);
  }
  
  await batch.commit();
  console.log(`✅ Created ${UNIVERSAL_CATEGORIES.length} warning categories`);
}

/**
 * Initialize sectors collection
 */
async function initializeSectors() {
  console.log(`🏭 Initializing sectors collection...`);
  
  const batch = db.batch();
  
  for (const sector of SOUTH_AFRICAN_SECTORS) {
    const sectorRef = db.collection('sectors').doc(sector.id);
    const sectorData = {
      ...sector,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(sectorRef, sectorData);
  }
  
  await batch.commit();
  console.log(`✅ Created ${SOUTH_AFRICAN_SECTORS.length} industry sectors`);
}

/**
 * Create demo organization for testing
 */
async function createDemoOrganization() {
  console.log(`🏢 Creating demo organization...`);
  
  const orgRef = db.collection('organizations').doc();
  const orgData = {
    name: 'Demo Corporation Ltd',
    industry: 'manufacturing',
    settings: {
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR',
      language: 'en',
      defaultDeliveryMethod: 'email'
    },
    isDemo: true,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await orgRef.set(orgData);
  console.log(`✅ Created demo organization: ${orgRef.id}`);
  
  return orgRef.id;
}

/**
 * Main initialization function
 */
async function main() {
  console.log('🚀 Starting database initialization...\n');
  
  try {
    // 1. Initialize sectors (global)
    await initializeSectors();
    
    // 2. Create demo organization
    const demoOrgId = await createDemoOrganization();
    
    // 3. Initialize warning categories for demo org
    await initializeWarningCategories(demoOrgId);
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   • 8 Universal warning categories (SA LRA compliant)');
    console.log('   • 5 Industry sectors (Manufacturing, Retail, Healthcare, Security, Mining)');
    console.log('   • Demo organization for testing');
    console.log('   • All collections properly indexed and structured');
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('   2. Test the application - console errors should be resolved');
    console.log('   3. Create additional organizations as needed');
    console.log('   4. Customize warning categories per organization');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  initializeWarningCategories,
  initializeSectors,
  createDemoOrganization,
  UNIVERSAL_CATEGORIES,
  SOUTH_AFRICAN_SECTORS
};