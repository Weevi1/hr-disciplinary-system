import Logger from '../utils/logger';

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
  onProbationWithWarnings: number;
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
  type: 'archive' | 'restore' | 'activate' | 'updateDepartment';
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
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const generateEmployeeId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `emp_${timestamp}_${random}`;
};

export const generateEmployeeNumber = (organizationId: string): string => {
  // Generate a unique employee number based on organization and timestamp
  const orgCode = organizationId.toUpperCase().substring(0, 3);
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  return `${orgCode}${timestamp}${random}`;
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
      primaryMethod: 'email',
      allowAlternativeMethods: true,
      whatsappConsent: false,
      emailConsent: true,
      printConsent: false,
      lastUpdated: now
    }
  };
};

// REPLACE the existing createFormFromEmployee function in types/employee.ts with this:

// Helper function to safely convert various date formats to YYYY-MM-DD string
const safeDateToString = (date: any): string => {
  if (!date) return '';
  
  try {
    // Handle Firestore Timestamp objects
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toISOString().split('T')[0];
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // Handle date strings
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    // Handle timestamp numbers
    if (typeof date === 'number') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    return '';
  } catch (error) {
    Logger.warn('Failed to convert date:', date, error);
    return '';
  }
};

export const createFormFromEmployee = (employee: Employee): EmployeeFormData => {
  return {
    employeeNumber: employee.profile?.employeeNumber || '',
    firstName: employee.profile?.firstName || '',
    lastName: employee.profile?.lastName || '',
    email: employee.profile?.email || '',
    phoneNumber: employee.profile?.phoneNumber || '',
    whatsappNumber: employee.profile?.whatsappNumber || '',
    department: employee.profile?.department || '',
    position: employee.profile?.position || '',
    startDate: safeDateToString(employee.profile?.startDate),
    contractType: employee.employment?.contractType || 'permanent',
    probationEndDate: safeDateToString(employee.employment?.probationEndDate),
    managerId: employee.employment?.managerId || '',
    isActive: employee.isActive ?? true
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
        };
      
    case 'hod-manager':
    case 'hod':
      return {
        canCreate: true,  // HOD managers can add basic employee records
        canEdit: false,   // HOD users can only VIEW existing employees (HR completes profiles)
        canArchive: false,
        canRestore: false,
        canViewAll: false,
        canViewArchived: false,
        canViewDepartments: departmentIds || [],
        canViewContactInfo: true,
        canBulkImport: false,
        canExport: false,
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
        };
  }
};

export const filterEmployees = (
  employees: Employee[],
  filters: EmployeeFilters,
  permissions: EmployeePermissions,
  userRole?: string,
  currentUserId?: string
): Employee[] => {
  return employees.filter(employee => {
    // Defensive check for employee structure - be more lenient
    if (!employee) {
      return false;
    }

    // Log employee structure for debugging HOD manager issues
    if (userRole === 'hod-manager' && !employee.profile) {
      Logger.warn('🔍 [FILTER DEBUG] Employee missing profile:', {
        id: employee.id,
        hasEmployment: !!employee.employment,
        managerId: employee.employment?.managerId,
        currentUserId
      });
    }

    // For HOD users, filter by manager relationship only
    if (!permissions.canViewAll && (userRole === 'hod' || userRole === 'hod-manager')) {
      const employeeManagerId = employee.employment?.managerId;

      if (employeeManagerId) {
        // Employee has a manager assigned - check if it's this user
        if (employeeManagerId !== currentUserId) {
          return false;
        }
      }
      // If no manager assigned, show to all HOD users (transition period)
      // HR can later assign specific managers to employees
    } else if (!permissions.canViewAll && permissions.canViewDepartments.length > 0) {
      // For other roles (like department heads), still use department filtering
      const employeeDepartment = employee.profile?.department;
      if (!employeeDepartment || !permissions.canViewDepartments.includes(employeeDepartment)) {
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
        (employee.profile?.firstName?.toLowerCase() || '').includes(searchLower) ||
        (employee.profile?.lastName?.toLowerCase() || '').includes(searchLower) ||
        (employee.profile?.employeeNumber?.toLowerCase() || '').includes(searchLower) ||
        (employee.profile?.email?.toLowerCase() || '').includes(searchLower);

      if (!matchesSearch) return false;
    }

    if (filters.department && employee.profile?.department !== filters.department) {
      return false;
    }

    if (filters.contractType && employee.employment?.contractType !== filters.contractType) {
      return false;
    }

    if (filters.hasWarnings && (!employee.disciplinaryRecord || employee.disciplinaryRecord.activeWarnings === 0)) {
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
    onProbationWithWarnings: 0,
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
      const isOnProbation = employee.employment?.probationEndDate &&
          new Date(employee.employment.probationEndDate) > new Date();
      const hasWarnings = employee.disciplinaryRecord?.activeWarnings > 0;

      if (isOnProbation) {
        stats.onProbation++;
      }

      if (hasWarnings) {
        stats.withActiveWarnings++;
      }

      // Count employees who are BOTH on probation AND have warnings
      if (isOnProbation && hasWarnings) {
        stats.onProbationWithWarnings++;
      }
    }
    
    const dept = employee.profile?.department || 'Unknown';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

    const contract = employee.employment?.contractType || 'Unknown';
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
    'probationEndDate'
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
      '' // No probation for permanent employee
    ],
    [
      'EMP002',
      'Sarah',
      'Johnson',
      'sarah.johnson@company.com',
      '+27987654321',
      '+27987654321',
      'Human Resources',
      'HR Manager',
      '2023-06-01',
      'permanent',
      '' // No probation for permanent employee
    ],
    [
      'EMP003',
      'Michael',
      'Smith',
      'michael.smith@company.com',
      '+27555123456',
      '', // No WhatsApp number
      'Operations',
      'Operations Coordinator',
      '2024-11-01',
      'contract',
      '2025-02-01' // 3-month probation period
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
