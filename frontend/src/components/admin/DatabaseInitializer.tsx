import React, { useState } from 'react';import Logger from '../../utils/logger';

import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../auth/AuthContext';
import { CheckCircle, AlertTriangle, Database, Play, Loader } from 'lucide-react';

// Universal warning categories (from our backend script)
const UNIVERSAL_CATEGORIES = [
  {
    id: 'attendance_punctuality',
    name: 'Attendance & Punctuality',
    description: 'Issues related to attendance, late arrivals, early departures, and absenteeism',
    severity: 'minor',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 3 - Progressive Discipline',
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal'],
    defaultValidityPeriod: 6,
    commonExamples: [
      'Arriving late for work repeatedly',
      'Leaving work early without permission',
      'Excessive sick leave without medical certificates'
    ]
  },
  {
    id: 'performance_issues', 
    name: 'Performance Issues',
    description: 'Work quality, productivity, meeting deadlines, and job competency concerns',
    severity: 'minor',
    lraSection: 'LRA Section 188(1)(a) - Incapacity',
    schedule8Reference: 'Schedule 8 Item 10 - Poor Work Performance',
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'dismissal'],
    defaultValidityPeriod: 12,
    commonExamples: [
      'Consistently missing deadlines',
      'Poor quality work output',
      'Inability to meet performance targets'
    ]
  },
  {
    id: 'safety_violations',
    name: 'Safety Violations', 
    description: 'Workplace health and safety non-compliance, risk-taking behavior',
    severity: 'serious',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 6 - Endangering Safety',
    escalationPath: ['verbal', 'first_written', 'dismissal'],
    defaultValidityPeriod: 12,
    commonExamples: [
      'Not wearing required PPE',
      'Ignoring safety procedures',
      'Creating unsafe working conditions'
    ]
  },
  {
    id: 'insubordination_disrespect',
    name: 'Insubordination & Disrespect',
    description: 'Refusing lawful instructions, disrespectful behavior, undermining authority',
    severity: 'serious', 
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 4 - Insubordination',
    escalationPath: ['verbal', 'first_written', 'final_written', 'dismissal'],
    defaultValidityPeriod: 12,
    commonExamples: [
      'Refusing to follow lawful instructions',
      'Disrespectful language to supervisors',
      'Undermining management authority'
    ]
  },
  {
    id: 'policy_violations',
    name: 'Policy Violations',
    description: 'Breaching company policies, procedures, and workplace rules',
    severity: 'minor',
    lraSection: 'LRA Section 188(1)(a) - Misconduct', 
    schedule8Reference: 'Schedule 8 Item 7 - Breach of Rules',
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal'],
    defaultValidityPeriod: 6,
    commonExamples: [
      'Dress code violations',
      'Misuse of company property',
      'Inappropriate use of technology'
    ]
  },
  {
    id: 'dishonesty_theft',
    name: 'Dishonesty & Theft',
    description: 'Stealing, fraud, dishonest conduct, misrepresentation',
    severity: 'gross_misconduct',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 1 - Dishonesty', 
    escalationPath: ['dismissal'],
    defaultValidityPeriod: 12,
    commonExamples: [
      'Stealing company property',
      'Fraudulent expense claims',
      'Falsifying documents'
    ]
  },
  {
    id: 'substance_abuse',
    name: 'Substance Abuse',
    description: 'Alcohol/drug use affecting work, reporting to work under influence',
    severity: 'serious',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 8 - Intoxication',
    escalationPath: ['suspension', 'first_written', 'final_written', 'dismissal'],
    defaultValidityPeriod: 12,
    commonExamples: [
      'Reporting to work under influence',
      'Consuming alcohol on premises',
      'Drug use affecting performance'
    ]
  },
  {
    id: 'harassment_discrimination',
    name: 'Harassment & Discrimination',
    description: 'Sexual harassment, unfair discrimination, creating hostile work environment',
    severity: 'gross_misconduct',
    lraSection: 'LRA Section 188(1)(a) - Misconduct',
    schedule8Reference: 'Schedule 8 Item 2 - Sexual Harassment',
    escalationPath: ['dismissal'], 
    defaultValidityPeriod: 12,
    commonExamples: [
      'Sexual harassment of colleagues',
      'Racial/gender discrimination',
      'Creating hostile work environment'
    ]
  }
];

const SOUTH_AFRICAN_SECTORS = [
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production, assembly, and manufacturing operations'
  },
  {
    id: 'retail', 
    name: 'Retail & Commerce',
    description: 'Sales, customer service, and retail operations'
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical', 
    description: 'Medical services, patient care, and healthcare operations'
  },
  {
    id: 'security',
    name: 'Security Services',
    description: 'Security, protection, and safety services'
  },
  {
    id: 'mining',
    name: 'Mining & Extraction',
    description: 'Mining operations and resource extraction'
  }
];

export const DatabaseInitializer: React.FC = () => {
  const { user, organization } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState<{
    categories: boolean;
    sectors: boolean;
    error?: string;
  }>({ categories: false, sectors: false });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeWarningCategories = async (orgId: string) => {
    addLog('Creating warning categories...');
    
    const batch = writeBatch(db);
    
    for (const category of UNIVERSAL_CATEGORIES) {
      const categoryRef = doc(collection(db, 'warningCategories'));
      const categoryData = {
        ...category,
        organizationId: orgId,
        isActive: true,
        isUniversal: true,
        customizations: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      batch.set(categoryRef, categoryData);
    }
    
    await batch.commit();
    addLog(`✅ Created ${UNIVERSAL_CATEGORIES.length} warning categories`);
    return true;
  };

  const initializeSectors = async () => {
    addLog('Creating industry sectors...');
    
    const batch = writeBatch(db);
    
    for (const sector of SOUTH_AFRICAN_SECTORS) {
      const sectorRef = doc(collection(db, 'sectors'), sector.id);
      const sectorData = {
        ...sector,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      batch.set(sectorRef, sectorData);
    }
    
    await batch.commit();
    addLog(`✅ Created ${SOUTH_AFRICAN_SECTORS.length} industry sectors`);
    return true;
  };

  const handleInitialize = async () => {
    if (!organization?.id) {
      addLog('❌ No organization found. Please ensure you are logged in properly.');
      return;
    }

    setIsInitializing(true);
    setInitStatus({ categories: false, sectors: false });
    setLogs([]);
    
    try {
      addLog('🚀 Starting database initialization...');
      
      // Initialize sectors (global)
      const sectorsSuccess = await initializeSectors();
      setInitStatus(prev => ({ ...prev, sectors: sectorsSuccess }));
      
      // Initialize warning categories for current organization
      const categoriesSuccess = await initializeWarningCategories(organization.id);
      setInitStatus(prev => ({ ...prev, categories: categoriesSuccess }));
      
      addLog('🎉 Database initialization completed successfully!');
      addLog('The console errors should now be resolved. You may need to refresh the page.');
      
    } catch (error) {
      Logger.error('Database initialization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Initialization failed: ${errorMessage}`);
      setInitStatus(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setIsInitializing(false);
    }
  };

  // Only super users and business owners can initialize
  const canInitialize = user?.role?.id === 'super-user' || user?.role?.id === 'business-owner';

  if (!canInitialize) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Access Restricted</span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Database initialization requires Super User or Business Owner permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Database Initializer</h1>
            <p className="text-slate-600">Set up essential data collections for your HR system</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What will be created:</h3>
          <ul className="space-y-1 text-blue-800 text-sm">
            <li>• 8 Universal warning categories (SA LRA compliant)</li>
            <li>• 5 Industry sectors (Manufacturing, Retail, Healthcare, Security, Mining)</li>
            <li>• Proper database structure for {organization?.name}</li>
          </ul>
        </div>

        <button
          onClick={handleInitialize}
          disabled={isInitializing}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {isInitializing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Initialize Database
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {(initStatus.categories || initStatus.sectors || initStatus.error) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Initialization Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {initStatus.sectors ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
              )}
              <span className={initStatus.sectors ? 'text-green-700' : 'text-slate-600'}>
                Industry Sectors Created
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {initStatus.categories ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <div className="w-5 h-5 border-2 border-slate-300 rounded-full" />
              )}
              <span className={initStatus.categories ? 'text-green-700' : 'text-slate-600'}>
                Warning Categories Created
              </span>
            </div>
          </div>

          {initStatus.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{initStatus.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Initialization Log</h3>
          <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-slate-700">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};