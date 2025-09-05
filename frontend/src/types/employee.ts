// frontend/src/types/employee.ts
// 🏆 COMPLETE EMPLOYEE MANAGEMENT SYSTEM
// Enhanced with archiving, bulk operations, CSV import, and full permission system

import type { 
  Employee as CoreEmployee, 
  EmployeeProfile, 
  EmploymentDetails, 
  DisciplinaryRecord,
  DeliveryMethod,
  ContractType,
  UserRoleId,
  DeliveryPreferences
} from './core';

// ============================================
// RE-EXPORTS FROM CORE
// ============================================

export type Employee = CoreEmployee;
export type { 
  EmployeeProfile, 
  EmploymentDetails, 
  DisciplinaryRecord, 
  DeliveryMethod, 
  ContractType,
  DeliveryPreferences 
};

// ============================================
// FORM & UI TYPES
// ============================================

export interface EmployeeFormData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  department: string;
  position: string;
  startDate: string;
  contractType: ContractType;
  probationEndDate?: string;
  preferredDeliveryMethod: DeliveryMethod;
  managerId?: string; // 🔧 ADD THIS LINE
  isActive: boolean;
}

export interface EmployeeFilters {
  search: string;
  department: string;
  contractType: string;
  hasWarnings: boolean;
  isActive: boolean;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  onProbation: number;
  withActiveWarnings: number;
  departments: Array<{
    name: string;
    count: number;
  }>;
  contractTypes: Array<{
    type: string;
    count: number;
  }>;
}

// ============================================
// ENHANCED EMPLOYEE WITH CONTEXT
// ============================================

export interface EmployeeWithContext {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  deliveryPreference: DeliveryMethod;
  recentWarnings: {
    count: number;
    lastDate?: Date;
    lastCategory?: string;
    level?: string;
  };
  riskIndicators: {
    highRisk: boolean;
    reasons: string[];
  };
}

// ============================================
// ARCHIVE SYSTEM
// ============================================

export interface EmployeeArchiveData {
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
  canBeRestored: boolean;
}

export interface ArchivedEmployee extends Employee {
  archiveData?: EmployeeArchiveData;
}

// ============================================
// CSV IMPORT SYSTEM
// ============================================

export interface CSVImportRow {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  department: string;
  position: string;
  startDate: string;
  contractType?: string;
  preferredDeliveryMethod?: string;
  probationEndDate?: string;
  [key: string]: string | undefined;
}

export interface CSVImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface CSVRowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: EmployeeFormData;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkAction {
  type: 'archive' | 'restore' | 'activate' | 'updateDepartment' | 'updateDeliveryMethod';
  employeeIds: string[];
  value?: string;
  reason?: string;
}

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    employeeId: string;
    error: string;
  }>;
}

// ============================================
// PERMISSIONS
// ============================================

export interface EmployeePermissions {
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canViewAll: boolean;
  canViewArchived: boolean;
  canViewDepartments: string[];
  canViewContactInfo: boolean;
  canBulkImport: boolean;
  canExport: boolean;
  canManageDeliveryMethods: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const generateEmployeeId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `emp_${timestamp}_${random}`;
};

// REPLACE the existing createEmployeeFromForm function in types/employee.ts with this:

export const createEmployeeFromForm = (
  formData: EmployeeFormData, 
  organizationId: string
): Employee => {
  const now = new Date();
  const employeeId = generateEmployeeId();
  
  return {
    id: employeeId,
    organizationId,
    isActive: formData.isActive,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    
    profile: {
      employeeNumber: formData.employeeNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email.toLowerCase(),
      phoneNumber: formData.phoneNumber || null, // 🔧 FIXED: null instead of undefined
      whatsappNumber: formData.whatsappNumber || null, // 🔧 FIXED: null instead of undefined
      department: formData.department,
      position: formData.position,
      startDate: new Date(formData.startDate),
      preferredDeliveryMethod: formData.preferredDeliveryMethod
    },
    
    employment: {
      startDate: new Date(formData.startDate),
      contractType: formData.contractType,
      probationEndDate: formData.probationEndDate ? new Date(formData.probationEndDate) : null, // 🔧 FIXED: null instead of undefined
      department: formData.department,
      position: formData.position,
      managerId: formData.managerId || null // 🔧 FIXED: null instead of undefined
    },
    
    disciplinaryRecord: {
      totalWarnings: 0,
      activeWarnings: 0,
      currentLevel: 'none',
      warningHistory: [],
      warningsByCategory: {}
    },
    
    deliveryPreferences: {
      primaryMethod: formData.preferredDeliveryMethod,
      allowAlternativeMethods: true,
      whatsappConsent: formData.preferredDeliveryMethod === 'whatsapp',
      emailConsent: formData.preferredDeliveryMethod === 'email',
      printConsent: formData.preferredDeliveryMethod === 'printed',
      lastUpdated: now
    }
  };
};

// REPLACE the existing createFormFromEmployee function in types/employee.ts with this:

export const createFormFromEmployee = (employee: Employee): EmployeeFormData => {
  return {
    employeeNumber: employee.profile.employeeNumber,
    firstName: employee.profile.firstName,
    lastName: employee.profile.lastName,
    email: employee.profile.email,
    phoneNumber: employee.profile.phoneNumber || '',
    whatsappNumber: employee.profile.whatsappNumber || '',
    department: employee.profile.department,
    position: employee.profile.position,
    startDate: employee.profile.startDate instanceof Date 
      ? employee.profile.startDate.toISOString().split('T')[0]
      : employee.profile.startDate.toString().split('T')[0],
    contractType: employee.employment.contractType,
    probationEndDate: employee.employment.probationEndDate
      ? (employee.employment.probationEndDate instanceof Date 
        ? employee.employment.probationEndDate.toISOString().split('T')[0]
        : employee.employment.probationEndDate.toString().split('T')[0])
      : '',
    preferredDeliveryMethod: employee.profile.preferredDeliveryMethod || 'email',
    managerId: employee.employment.managerId || '', // 🔧 ADD THIS LINE
    isActive: employee.isActive
  };
};

export const calculateEmployeePermissions = (
  roleId?: UserRoleId,
  departmentIds?: string[]
): EmployeePermissions => {
  if (!roleId) {
    return {
      canCreate: false,
      canEdit: false,
      canArchive: false,
      canRestore: false,
      canViewAll: false,
      canViewArchived: false,
      canViewDepartments: [],
      canViewContactInfo: false,
      canBulkImport: false,
      canExport: false,
      canManageDeliveryMethods: false
    };
  }

  switch (roleId) {
    case 'super-user':
      return {
        canCreate: true,
        canEdit: true,
        canArchive: true,
        canRestore: true,
        canViewAll: true,
        canViewArchived: true,
        canViewDepartments: [],
        canViewContactInfo: true,
        canBulkImport: true,
        canExport: true,
        canManageDeliveryMethods: true
      };
      
    case 'business-owner':
      return {
        canCreate: false,
        canEdit: false,
        canArchive: false,
        canRestore: false,
        canViewAll: true,
        canViewArchived: true,
        canViewDepartments: [],
        canViewContactInfo: true,
        canBulkImport: false,
        canExport: true,
        canManageDeliveryMethods: false
      };
      
    case 'hr-manager':
      return {
        canCreate: true,
        canEdit: true,
        canArchive: true,
        canRestore: true,
        canViewAll: true,
        canViewArchived: true,
        canViewDepartments: [],
        canViewContactInfo: true,
        canBulkImport: true,
        canExport: true,
        canManageDeliveryMethods: true
      };
      
    case 'hod-manager':
      return {
        canCreate: false,
        canEdit: false,
        canArchive: false,
        canRestore: false,
        canViewAll: false,
        canViewArchived: false,
        canViewDepartments: departmentIds || [],
        canViewContactInfo: true,
        canBulkImport: false,
        canExport: false,
        canManageDeliveryMethods: false
      };
      
    default:
      return {
        canCreate: false,
        canEdit: false,
        canArchive: false,
        canRestore: false,
        canViewAll: false,
        canViewArchived: false,
        canViewDepartments: [],
        canViewContactInfo: false,
        canBulkImport: false,
        canExport: false,
        canManageDeliveryMethods: false
      };
  }
};

export const filterEmployees = (
  employees: Employee[],
  filters: EmployeeFilters,
  permissions: EmployeePermissions
): Employee[] => {
  return employees.filter(employee => {
    if (!permissions.canViewAll && permissions.canViewDepartments.length > 0) {
      if (!permissions.canViewDepartments.includes(employee.profile.department)) {
        return false;
      }
    }
    
    if (filters.isActive && !employee.isActive) {
      return false;
    }
    
    if (!filters.isActive && !employee.isActive && !permissions.canViewArchived) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        employee.profile.firstName.toLowerCase().includes(searchLower) ||
        employee.profile.lastName.toLowerCase().includes(searchLower) ||
        employee.profile.employeeNumber.toLowerCase().includes(searchLower) ||
        employee.profile.email.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    if (filters.department && employee.profile.department !== filters.department) {
      return false;
    }
    
    if (filters.contractType && employee.employment.contractType !== filters.contractType) {
      return false;
    }
    
    if (filters.hasWarnings && employee.disciplinaryRecord.activeWarnings === 0) {
      return false;
    }
    
    return true;
  });
};

export const calculateEmployeeStats = (employees: Employee[]): EmployeeStats => {
  const stats: EmployeeStats = {
    total: employees.length,
    active: 0,
    inactive: 0,
    onProbation: 0,
    withActiveWarnings: 0,
    departments: [],
    contractTypes: []
  };
  
  const departmentCounts: Record<string, number> = {};
  const contractCounts: Record<string, number> = {};
  
  employees.forEach(employee => {
    if (employee.isActive) {
      stats.active++;
    } else {
      stats.inactive++;
    }
    
    if (employee.isActive) {
      if (employee.employment.probationEndDate && 
          new Date(employee.employment.probationEndDate) > new Date()) {
        stats.onProbation++;
      }
      
      if (employee.disciplinaryRecord.activeWarnings > 0) {
        stats.withActiveWarnings++;
      }
    }
    
    const dept = employee.profile.department;
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    
    const contract = employee.employment.contractType;
    contractCounts[contract] = (contractCounts[contract] || 0) + 1;
  });
  
  stats.departments = Object.entries(departmentCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
    
  stats.contractTypes = Object.entries(contractCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  return stats;
};

export const generateSampleCSV = (): string => {
  const headers = [
    'employeeNumber',
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'whatsappNumber',
    'department',
    'position',
    'startDate',
    'contractType',
    'preferredDeliveryMethod'
  ];
  
  const sampleRows = [
    [
      'EMP001',
      'John',
      'Doe',
      'john.doe@company.com',
      '+27123456789',
      '+27123456789',
      'Engineering',
      'Software Developer',
      '2024-01-15',
      'permanent',
      'email'
    ],
    [
      '', // Empty employee number - will be auto-generated
      'Jane',
      'Smith',
      'jane.smith@company.com',
      '+27987654321',
      '+27987654321',
      'Human Resources',
      'HR Manager',
      '2023-06-01',
      'permanent',
      'whatsapp'
    ]
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

export const validateEmployee = (employee: Partial<Employee>): string[] => {
  const errors: string[] = [];
  
  if (!employee.profile?.employeeNumber) {
    errors.push('Employee number is required');
  }
  
  if (!employee.profile?.firstName) {
    errors.push('First name is required');
  }
  
  if (!employee.profile?.lastName) {
    errors.push('Last name is required');
  }
  
  if (!employee.profile?.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.profile.email)) {
    errors.push('Invalid email format');
  }
  
  if (!employee.profile?.department) {
    errors.push('Department is required');
  }
  
  if (!employee.profile?.position) {
    errors.push('Position is required');
  }
  
  if (!employee.profile?.startDate) {
    errors.push('Start date is required');
  }
  
  return errors;
};
