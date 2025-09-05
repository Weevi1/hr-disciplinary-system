import { FirebaseService, COLLECTIONS } from '../services/FirebaseService';
import { Timestamp } from 'firebase/firestore';
// Fix: Use type-only imports
import type { Organization, User, Employee, Warning, WarningCategory } from '../types';

interface InitializationResult {
  success: boolean;
  message: string;
  data?: any;
}

export class FirebaseInitializer {
  /**
   * Initialize all demo data
   */
  static async initializeAll(): Promise<InitializationResult> {
    console.log('🚀 Starting Firebase initialization...');
    
    try {
      // Step 1: Create demo organization
      const orgId = await this.createDemoOrganization();
      console.log('✅ Demo organization created:', orgId);
      
      // Step 2: Create demo users
      const userIds = await this.createDemoUsers(orgId);
      console.log('✅ Demo users created:', userIds.length);
      
      // Step 3: Create warning categories
      await this.createWarningCategories(orgId);
      console.log('✅ Warning categories created');
      
      // Step 4: Create demo employees
      const employeeIds = await this.createDemoEmployees(orgId);
      console.log('✅ Demo employees created:', employeeIds.length);
      
      // Step 5: Create demo warnings
      await this.createDemoWarnings(orgId, employeeIds[0], userIds.hod);
      console.log('✅ Demo warnings created');
      
      // Step 6: Create templates
      await this.createDemoTemplates(orgId);
      console.log('✅ Templates created');
      
      return {
        success: true,
        message: 'Firebase initialized successfully!',
        data: { orgId, userIds, employeeIds }
      };
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Initialization failed: ${message}`
      };
    }
  }

  /**
   * Create demo organization
   */
  private static async createDemoOrganization(): Promise<string> {
    const orgData: Partial<Organization> = {
      name: 'Demo Corporation Ltd',
      industry: 'manufacturing' as const,
      branding: {
        logo: '/demo-logo.png',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        companyName: 'Demo Corporation Ltd',
        domain: 'demo-corp.hrdignitysystem.com'
      },
      settings: {
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
        language: 'en'
      },
      customization: {
        enablePhotoCapture: true,
        enableWhatsAppDelivery: true,
        enablePrintDelivery: false
      }
    };

    return await FirebaseService.createDocument(
      COLLECTIONS.ORGANIZATIONS, 
      orgData, 
      'demo-corp'
    );
  }

  /**
   * Create demo users for each role
   */
  private static async createDemoUsers(orgId: string) {
    const users = [
      {
        id: 'super-admin-demo',
        email: 'superuser@hrdignitysystem.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super-user' as const,
        organizationId: null,
        departmentIds: [],
        isActive: true
      },
      {
        id: 'business-owner-demo',
        email: 'ceo@democorp.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'business-owner' as const,
        organizationId: orgId,
        departmentIds: [],
        isActive: true
      },
      {
        id: 'hr-manager-demo',
        email: 'hr@democorp.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'hr-manager' as const,
        organizationId: orgId,
        departmentIds: [],
        isActive: true
      },
      {
        id: 'hod-manager-demo',
        email: 'manager@democorp.com',
        firstName: 'Mike',
        lastName: 'Williams',
        role: 'hod-manager' as const,
        organizationId: orgId,
        departmentIds: ['production'],
        isActive: true
      }
    ];

const userIds: Record<string, string> = {};
    
    for (const user of users) {
      await FirebaseService.createDocument(
        COLLECTIONS.USERS, 
        { ...user, id: undefined }, // Remove id from data, pass as separate param
        user.id
      );
      userIds[user.role.split('-')[0]] = user.id;
    }
    
    return userIds;
  }

  /**
   * Create warning categories
   */
  private static async createWarningCategories(orgId: string) {
    const categories = [
      {
        organizationId: orgId,
        name: 'Absenteeism',
        description: 'Unauthorized absence from work',
        severity: 'medium' as const,
        escalationPath: ['verbal', 'written', 'final'],
        requiredDocuments: ['absence_record'],
        isActive: true
      },
      {
        organizationId: orgId,
        name: 'Safety Violation',
        description: 'Violation of safety protocols',
        severity: 'high' as const,
        escalationPath: ['written', 'final', 'dismissal'],
        requiredDocuments: ['incident_report', 'photo_evidence'],
        isActive: true
      },
      {
        organizationId: orgId,
        name: 'Poor Performance',
        description: 'Failure to meet performance standards',
        severity: 'medium' as const,
        escalationPath: ['verbal', 'written', 'final'],
        requiredDocuments: ['performance_review'],
        isActive: true
      },
      {
        organizationId: orgId,
        name: 'Insubordination',
        description: 'Refusal to follow instructions',
        severity: 'high' as const,
        escalationPath: ['written', 'final', 'dismissal'],
        requiredDocuments: ['witness_statement'],
        isActive: true
      },
      {
        organizationId: orgId,
        name: 'Time Keeping',
        description: 'Late arrival or early departure',
        severity: 'low' as const,
        escalationPath: ['verbal', 'written', 'final'],
        requiredDocuments: ['time_record'],
        isActive: true
      }
    ];

    await FirebaseService.batchCreate(COLLECTIONS.WARNING_CATEGORIES, categories);
  }

  /**
   * Create demo employees
   */
  private static async createDemoEmployees(orgId: string) {
    const employees = [
      {
        organizationId: orgId,
        employeeCode: 'EMP001',
        firstName: 'Alice',
        lastName: 'Anderson',
        email: 'alice@democorp.com',
        phone: '+27123456789',
        department: 'Production',
        position: 'Machine Operator',
        managerId: 'hod-manager-demo',
        deliveryPreference: {
          type: 'whatsapp' as const,
          whatsappNumber: '+27123456789'
        },
        warningCount: 0,
        lastWarningDate: null,
        isActive: true
      },
      {
        organizationId: orgId,
        employeeCode: 'EMP002',
        firstName: 'Bob',
        lastName: 'Brown',
        email: 'bob@democorp.com',
        phone: '+27123456790',
        department: 'Production',
        position: 'Quality Inspector',
        managerId: 'hod-manager-demo',
        deliveryPreference: {
          type: 'email' as const,
          email: 'bob@democorp.com'
        },
        warningCount: 0,
        lastWarningDate: null,
        isActive: true
      },
      {
        organizationId: orgId,
        employeeCode: 'EMP003',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol@democorp.com',
        phone: '+27123456791',
        department: 'Warehouse',
        position: 'Forklift Driver',
        managerId: 'hod-manager-demo',
        deliveryPreference: {
          type: 'physical' as const,
          physicalAddress: 'HR Office, Building A'
        },
        warningCount: 0,
        lastWarningDate: null,
        isActive: true
      }
    ];

    const ids = [];
    for (const employee of employees) {
      const id = await FirebaseService.createDocument(
        COLLECTIONS.EMPLOYEES, 
        employee
      );
      ids.push(id);
    }
    
    return ids;
  }

  /**
   * Create demo warnings
   */
  private static async createDemoWarnings(
    orgId: string, 
    employeeId: string, 
    issuedBy: string
  ) {
    const warnings = [
      {
        organizationId: orgId,
        employeeId: employeeId,
        issuedBy: issuedBy,
        approvedBy: 'hr-manager-demo',
        category: 'Time Keeping',
        severity: 'verbal' as const,
        description: 'Employee arrived 30 minutes late without prior notice',
        incidentDate: Timestamp.fromDate(new Date('2025-01-20')),
        issueDate: Timestamp.fromDate(new Date('2025-01-21')),
        deliveryMethod: 'whatsapp' as const,
        deliveryStatus: {
          status: 'delivered' as const,
          timestamp: Timestamp.fromDate(new Date('2025-01-21')),
          details: 'Delivered via WhatsApp'
        },
        documents: [],
        followUpActions: ['Monitor punctuality for next 2 weeks'],
        status: 'delivered' as const
      }
    ];

    await FirebaseService.batchCreate(COLLECTIONS.WARNINGS, warnings);
  }

  /**
   * Create demo templates
   */
  private static async createDemoTemplates(orgId: string) {
    const templates = [
      {
        organizationId: orgId,
        type: 'warning_letter' as const,
        name: 'Standard Warning Letter',
        description: 'Default template for written warnings',
        content: `Dear {{employeeName}},

This letter serves as a formal {{severity}} warning regarding {{category}}.

Date of Incident: {{incidentDate}}
Description: {{description}}

{{followUpActions}}

Please acknowledge receipt of this warning.

        Regards,
{{managerName}}
{{companyName}}`,
        variables: [
          'employeeName', 
          'severity', 
          'category', 
          'incidentDate', 
          'description', 
          'followUpActions', 
          'managerName', 
          'companyName'
        ],
        isActive: true
      },
      {
        organizationId: orgId,
        type: 'email_template' as const,
        name: 'Warning Notification Email',
        description: 'Email template for warning notifications',
        content: `Subject: Disciplinary Warning - {{category}}

Dear {{employeeName}},

Please be advised that a {{severity}} warning has been issued regarding {{category}}.

You may view the full details by logging into the HR system.

This is an automated notification. Please contact HR if you have any questions.

Best regards,
HR Department
{{companyName}}`,
        variables: ['employeeName', 'severity', 'category', 'companyName'],
        isActive: true
      },
      {
        organizationId: orgId,
        type: 'whatsapp_template' as const,
        name: 'WhatsApp Warning Notification',
        description: 'WhatsApp message template',
        content: `Hello {{employeeName}},

You have received a {{severity}} warning for {{category}}.

Please check your email or visit HR for full details.

Reply ACKNOWLEDGE to confirm receipt.

- {{companyName}} HR`,
        variables: ['employeeName', 'severity', 'category', 'companyName'],
        isActive: true
      }
    ];

    await FirebaseService.batchCreate(COLLECTIONS.TEMPLATES, templates);
  }

  /**
   * Clear all data (use with caution!)
   */
  static async clearAllData(): Promise<void> {
    console.warn('⚠️ Clearing all Firebase data...');
    
    const collections = Object.values(COLLECTIONS);
    
    for (const collectionName of collections) {
      try {
        const docs = await FirebaseService.getCollection(collectionName);
        for (const doc of docs) {
          await FirebaseService.deleteDocument(collectionName, (doc as { id: string }).id);
        }
        console.log(`✅ Cleared ${collectionName}`);
      } catch (error) {
        console.error(`❌ Failed to clear ${collectionName}:`, error);
      }
    }
  }
}

