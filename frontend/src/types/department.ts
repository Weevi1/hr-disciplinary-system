// Types for Department Management System
// Provides structure for organizational departments with CRUD operations

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string; // Employee ID of department manager
  managerName?: string; // Cached manager name for display
  managerEmail?: string; // Cached manager email for display
  employeeCount: number;
  isDefault: boolean; // Operations and Admin are default
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  managerId?: string;
}

export interface DepartmentStats {
  totalDepartments: number;
  departmentsWithManagers: number;
  departmentsWithoutManagers: number;
  totalEmployeesAcrossDepartments: number;
  averageEmployeesPerDepartment: number;
}

export interface DepartmentEmployeeAssignment {
  employeeId: string;
  departmentId: string;
  assignedAt: Date;
  assignedBy: string; // User ID who made the assignment
}

// Default departments that are created for new organizations
export const DEFAULT_DEPARTMENTS: Omit<Department, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'employeeCount' | 'managerId' | 'managerName' | 'managerEmail'>[] = [
  {
    name: 'Operations',
    description: 'Core business operations and daily management activities',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Admin',
    description: 'Human resources, administration, and support functions',
    isDefault: true,
    isActive: true
  }
];