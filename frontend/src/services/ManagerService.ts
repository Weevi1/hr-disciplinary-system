// ManagerService.ts
// 👥 MANAGER MANAGEMENT SERVICE
// Handles all manager-related data operations
// Managers are users with roles: 'hr-manager' or 'hod-manager'

import { DatabaseShardingService } from './DatabaseShardingService';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Timestamp } from 'firebase/firestore';
import Logger from '../utils/logger';
import type { Employee } from '../types';

export interface Manager {
  id: string;
  uid: string; // Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  role: {
    id: 'hr-manager' | 'hod-manager';
    name: string;
  };
  departmentIds?: string[];
  organizationId: string;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  // Computed fields
  employeeCount?: number;
  departmentNames?: string[];
}

export interface ManagerStats {
  totalManagers: number;
  hrManagers: number;
  hodManagers: number;
  managersWithDepartments: number;
  managersWithoutDepartments: number;
  totalEmployeesUnderManagement: number;
  averageEmployeesPerManager: number;
}

class ManagerServiceClass {
  /**
   * Get all managers for an organization
   */
  async getManagers(organizationId: string): Promise<Manager[]> {
    try {
      Logger.debug('📋 Fetching managers for organization:', { organizationId });

      // Query users collection for managers
      const result = await DatabaseShardingService.queryDocuments(organizationId, 'users');

      // Filter to only managers (HR and HOD)
      const managers: Manager[] = result.documents
        .filter((user: any) =>
          user.role?.id === 'hr-manager' || user.role?.id === 'hod-manager'
        )
        .map((user: any) => ({
          id: user.id,
          uid: user.uid || user.id,
          firstName: user.firstName || user.profile?.firstName || 'Unknown',
          lastName: user.lastName || user.profile?.lastName || 'User',
          email: user.email,
          role: user.role,
          departmentIds: user.departmentIds || [],
          organizationId: user.organizationId || organizationId,
          isActive: user.isActive !== false,
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt
        }));

      Logger.success(`✅ Loaded ${managers.length} managers`);
      return managers;
    } catch (error) {
      Logger.error('Failed to fetch managers:', error);
      throw new Error('Failed to load managers. Please try again.');
    }
  }

  /**
   * Get manager by ID
   */
  async getManagerById(organizationId: string, managerId: string): Promise<Manager | null> {
    try {
      const user = await DatabaseShardingService.getDocument(
        organizationId,
        'users',
        managerId
      );

      if (!user) {
        return null;
      }

      // Verify this user is actually a manager
      if (user.role?.id !== 'hr-manager' && user.role?.id !== 'hod-manager') {
        throw new Error('User is not a manager');
      }

      return {
        id: user.id,
        uid: user.uid || user.id,
        firstName: user.firstName || user.profile?.firstName || 'Unknown',
        lastName: user.lastName || user.profile?.lastName || 'User',
        email: user.email,
        role: user.role,
        departmentIds: user.departmentIds || [],
        organizationId: user.organizationId || organizationId,
        isActive: user.isActive !== false,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt
      };
    } catch (error) {
      Logger.error('Failed to fetch manager:', error);
      throw error;
    }
  }

  /**
   * Get all employees assigned to a specific manager
   */
  async getManagerEmployees(organizationId: string, managerId: string): Promise<Employee[]> {
    try {
      Logger.debug('👥 Fetching employees for manager:', { organizationId, managerId });

      const result = await DatabaseShardingService.queryDocuments(organizationId, 'employees');

      // Filter employees who have this manager assigned
      const managerEmployees = result.documents.filter(
        (emp: any) => emp.employment?.managerId === managerId && emp.isActive !== false
      );

      Logger.success(`✅ Found ${managerEmployees.length} employees for manager ${managerId}`);
      return managerEmployees as Employee[];
    } catch (error) {
      Logger.error('Failed to fetch manager employees:', error);
      throw new Error('Failed to load manager employees. Please try again.');
    }
  }

  /**
   * Get employee count for each manager
   */
  async getManagerEmployeeCounts(organizationId: string, managers: Manager[]): Promise<Map<string, number>> {
    try {
      const result = await DatabaseShardingService.queryDocuments(organizationId, 'employees');
      const employees = result.documents.filter((emp: any) => emp.isActive !== false);

      const counts = new Map<string, number>();

      // Initialize all managers with 0
      managers.forEach(manager => counts.set(manager.id, 0));

      // Count employees for each manager
      employees.forEach((emp: any) => {
        const managerId = emp.employment?.managerId;
        if (managerId && counts.has(managerId)) {
          counts.set(managerId, (counts.get(managerId) || 0) + 1);
        }
      });

      return counts;
    } catch (error) {
      Logger.error('Failed to get employee counts:', error);
      return new Map();
    }
  }

  /**
   * Get manager statistics
   */
  async getManagerStats(organizationId: string): Promise<ManagerStats> {
    try {
      const managers = await this.getManagers(organizationId);
      const employeeCounts = await this.getManagerEmployeeCounts(organizationId, managers);

      const hrManagers = managers.filter(m => m.role.id === 'hr-manager').length;
      const hodManagers = managers.filter(m => m.role.id === 'hod-manager').length;
      const managersWithDepartments = managers.filter(
        m => m.departmentIds && m.departmentIds.length > 0
      ).length;

      const totalEmployeesUnderManagement = Array.from(employeeCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      );

      const averageEmployeesPerManager = managers.length > 0
        ? Math.round(totalEmployeesUnderManagement / managers.length)
        : 0;

      return {
        totalManagers: managers.length,
        hrManagers,
        hodManagers,
        managersWithDepartments,
        managersWithoutDepartments: managers.length - managersWithDepartments,
        totalEmployeesUnderManagement,
        averageEmployeesPerManager
      };
    } catch (error) {
      Logger.error('Failed to calculate manager stats:', error);
      throw error;
    }
  }

  /**
   * Promote an employee to manager role
   * This updates the user's role in Firebase Auth custom claims AND Firestore
   */
  async promoteEmployeeToManager(
    organizationId: string,
    employeeId: string,
    role: 'hr-manager' | 'hod-manager',
    departmentIds?: string[]
  ): Promise<void> {
    try {
      Logger.debug('🚀 Promoting employee to manager:', {
        organizationId,
        employeeId,
        role,
        departmentIds
      });

      // Get Firebase Functions
      const functions = getFunctions();
      const createOrganizationUser = httpsCallable(functions, 'createOrganizationUser');

      // Get employee details first
      const employee = await DatabaseShardingService.getDocument(
        organizationId,
        'employees',
        employeeId
      );

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Call cloud function to create/update user with manager role
      // This will handle both Firebase Auth custom claims and Firestore user document
      await createOrganizationUser({
        organizationId,
        email: employee.profile?.email,
        role,
        firstName: employee.profile?.firstName,
        lastName: employee.profile?.lastName,
        departmentIds: departmentIds || []
      });

      // If department assignments provided, update the department documents
      if (departmentIds && departmentIds.length > 0) {
        const managerName = `${employee.profile?.firstName || ''} ${employee.profile?.lastName || ''}`.trim();
        const managerEmail = employee.profile?.email;

        // Wait a moment for the cloud function to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the newly created user ID (should match employee ID)
        const user = await DatabaseShardingService.getDocument(
          organizationId,
          'users',
          employeeId
        );

        if (user) {
          const managerId = user.id || employeeId;

          // Update each assigned department
          for (const deptId of departmentIds) {
            await DatabaseShardingService.updateDocument(
              organizationId,
              'departments',
              deptId,
              {
                managerId,
                managerName,
                managerEmail
              }
            );
            Logger.debug(`🔄 Assigned new manager to department ${deptId}`);
          }
        }
      }

      Logger.success(`✅ Employee ${employeeId} promoted to ${role}`);
    } catch (error: any) {
      Logger.error('Failed to promote employee:', error);
      throw new Error(error.message || 'Failed to promote employee. Please try again.');
    }
  }

  /**
   * Demote a manager back to regular employee
   * Optionally reassign their employees to a replacement manager
   */
  async demoteManagerToEmployee(
    organizationId: string,
    managerId: string,
    replacementManagerId?: string
  ): Promise<void> {
    try {
      Logger.debug('⬇️ Demoting manager to employee:', {
        organizationId,
        managerId,
        replacementManagerId
      });

      // Get manager's current department assignments before demoting
      const manager = await DatabaseShardingService.getDocument(
        organizationId,
        'users',
        managerId
      );

      const oldDepartmentIds = manager ? (manager.departmentIds || []) : [];

      // If replacement manager specified, reassign all employees
      if (replacementManagerId) {
        const employees = await this.getManagerEmployees(organizationId, managerId);

        // Reassign all employees to replacement manager
        for (const employee of employees) {
          await DatabaseShardingService.updateDocument(
            organizationId,
            'employees',
            employee.id,
            { 'employment.managerId': replacementManagerId }
          );
        }

        Logger.debug(`✅ Reassigned ${employees.length} employees to new manager`);
      }

      // Clear this manager from all their assigned departments
      for (const deptId of oldDepartmentIds) {
        await DatabaseShardingService.updateDocument(
          organizationId,
          'departments',
          deptId,
          {
            managerId: null,
            managerName: null,
            managerEmail: null
          }
        );
        Logger.debug(`🔄 Removed manager from department ${deptId}`);
      }

      // Update manager's role in Firestore (Auth custom claims need backend function)
      await DatabaseShardingService.updateDocument(
        organizationId,
        'users',
        managerId,
        {
          role: {
            id: 'employee', // Assuming 'employee' is a valid role
            name: 'Employee',
            description: 'Regular employee',
            level: 0
          },
          departmentIds: [] // Clear department assignments
        }
      );

      // Note: To fully demote in Firebase Auth, we'd need a cloud function
      // For now, the Firestore update will reflect in the UI
      Logger.warn('⚠️ Auth custom claims not updated - requires backend function');

      Logger.success(`✅ Manager ${managerId} demoted to employee`);
    } catch (error: any) {
      Logger.error('Failed to demote manager:', error);
      throw new Error(error.message || 'Failed to demote manager. Please try again.');
    }
  }

  /**
   * Update manager's department assignments
   * Also updates the reverse relationship in department documents
   */
  async updateManagerDepartments(
    organizationId: string,
    managerId: string,
    departmentIds: string[]
  ): Promise<void> {
    try {
      Logger.debug('🏢 Updating manager departments:', {
        organizationId,
        managerId,
        departmentIds
      });

      // Get manager details for department updates
      const manager = await DatabaseShardingService.getDocument(
        organizationId,
        'users',
        managerId
      );

      if (!manager) {
        throw new Error('Manager not found');
      }

      const managerName = `${manager.firstName || ''} ${manager.lastName || ''}`.trim();
      const managerEmail = manager.email;
      const oldDepartmentIds = manager.departmentIds || [];

      // Update manager's departmentIds
      await DatabaseShardingService.updateDocument(
        organizationId,
        'users',
        managerId,
        { departmentIds }
      );

      // Get all departments to update
      const allDepartmentsResult = await DatabaseShardingService.queryDocuments(
        organizationId,
        'departments'
      );
      const departments = allDepartmentsResult.documents;

      // Determine which departments need updates
      const departmentsToAdd = departmentIds.filter(id => !oldDepartmentIds.includes(id));
      const departmentsToRemove = oldDepartmentIds.filter(id => !departmentIds.includes(id));

      // Update departments that are NO LONGER assigned to this manager
      for (const deptId of departmentsToRemove) {
        const dept = departments.find((d: any) => d.id === deptId);
        if (dept && (dept as any).managerId === managerId) {
          await DatabaseShardingService.updateDocument(
            organizationId,
            'departments',
            deptId,
            {
              managerId: null,
              managerName: null,
              managerEmail: null
            }
          );
          Logger.debug(`🔄 Removed manager from department ${deptId}`);
        }
      }

      // Update departments that ARE NOW assigned to this manager
      for (const deptId of departmentsToAdd) {
        await DatabaseShardingService.updateDocument(
          organizationId,
          'departments',
          deptId,
          {
            managerId,
            managerName,
            managerEmail
          }
        );
        Logger.debug(`🔄 Assigned manager to department ${deptId}`);
      }

      Logger.success(`✅ Updated department assignments for manager ${managerId}`);
    } catch (error: any) {
      Logger.error('Failed to update manager departments:', error);
      throw new Error(error.message || 'Failed to update departments. Please try again.');
    }
  }

  /**
   * Archive a manager (soft delete)
   */
  async archiveManager(
    organizationId: string,
    managerId: string,
    reason: string,
    replacementManagerId?: string
  ): Promise<void> {
    try {
      Logger.debug('🗄️ Archiving manager:', {
        organizationId,
        managerId,
        reason,
        replacementManagerId
      });

      // Get manager's current department assignments before archiving
      const manager = await DatabaseShardingService.getDocument(
        organizationId,
        'users',
        managerId
      );

      const departmentIds = manager ? (manager.departmentIds || []) : [];

      // Reassign employees if replacement provided
      if (replacementManagerId) {
        const employees = await this.getManagerEmployees(organizationId, managerId);

        for (const employee of employees) {
          await DatabaseShardingService.updateDocument(
            organizationId,
            'employees',
            employee.id,
            { 'employment.managerId': replacementManagerId }
          );
        }
      }

      // Clear this manager from all their assigned departments
      for (const deptId of departmentIds) {
        await DatabaseShardingService.updateDocument(
          organizationId,
          'departments',
          deptId,
          {
            managerId: null,
            managerName: null,
            managerEmail: null
          }
        );
        Logger.debug(`🔄 Removed archived manager from department ${deptId}`);
      }

      // Archive the manager user
      const auth = getAuth();
      const currentUser = auth.currentUser;

      await DatabaseShardingService.updateDocument(
        organizationId,
        'users',
        managerId,
        {
          isActive: false,
          archivedAt: Timestamp.now(),
          archivedBy: currentUser?.uid || 'system',
          archiveReason: reason
        }
      );

      Logger.success(`✅ Manager ${managerId} archived successfully`);
    } catch (error: any) {
      Logger.error('Failed to archive manager:', error);
      throw new Error(error.message || 'Failed to archive manager. Please try again.');
    }
  }

  /**
   * Restore an archived manager
   */
  async restoreManager(organizationId: string, managerId: string): Promise<void> {
    try {
      Logger.debug('♻️ Restoring archived manager:', { organizationId, managerId });

      const auth = getAuth();
      const currentUser = auth.currentUser;

      await DatabaseShardingService.updateDocument(
        organizationId,
        'users',
        managerId,
        {
          isActive: true,
          restoredAt: Timestamp.now(),
          restoredBy: currentUser?.uid || 'system'
        }
      );

      Logger.success(`✅ Manager ${managerId} restored successfully`);
    } catch (error: any) {
      Logger.error('Failed to restore manager:', error);
      throw new Error(error.message || 'Failed to restore manager. Please try again.');
    }
  }
}

// Export singleton instance
const ManagerService = new ManagerServiceClass();
export default ManagerService;
