// Department Service for CRUD operations and Firestore integration
// Manages organizational departments with real-time sync

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Logger from '../utils/logger';
import type { Department, DepartmentFormData, DepartmentStats } from '../types/department';
import { DEFAULT_DEPARTMENTS } from '../types/department';

class DepartmentService {
  private getCollectionPath(organizationId: string): string {
    return `organizations/${organizationId}/departments`;
  }

  // Create default departments for new organization
  async createDefaultDepartments(organizationId: string): Promise<Department[]> {
    try {
      Logger.info('Creating default departments for organization', { organizationId });

      const batch = writeBatch(db);
      const departments: Department[] = [];
      const now = new Date();

      for (const defaultDept of DEFAULT_DEPARTMENTS) {
        const deptRef = doc(collection(db, this.getCollectionPath(organizationId)));
        const department: Department = {
          id: deptRef.id,
          ...defaultDept,
          organizationId,
          employeeCount: 0,
          createdAt: now,
          updatedAt: now
        };

        batch.set(deptRef, {
          ...department,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });

        departments.push(department);
      }

      await batch.commit();
      Logger.success('Default departments created successfully', { organizationId, count: departments.length });

      return departments;
    } catch (error) {
      Logger.error('Failed to create default departments', { error, organizationId });
      throw error;
    }
  }

  // Get all departments for organization
  async getDepartments(organizationId: string): Promise<Department[]> {
    try {
      const q = query(
        collection(db, this.getCollectionPath(organizationId)),
        where('isActive', '==', true),
        orderBy('isDefault', 'desc'), // Default departments first
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      const departments: Department[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        departments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Department);
      });

      Logger.info('Retrieved departments', { organizationId, count: departments.length });
      return departments;
    } catch (error) {
      Logger.error('Failed to get departments', { error, organizationId });
      throw error;
    }
  }

  // Get single department
  async getDepartment(organizationId: string, departmentId: string): Promise<Department | null> {
    try {
      const docRef = doc(db, this.getCollectionPath(organizationId), departmentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Department;
    } catch (error) {
      Logger.error('Failed to get department', { error, organizationId, departmentId });
      throw error;
    }
  }

  // Create new department
  async createDepartment(organizationId: string, formData: DepartmentFormData): Promise<Department> {
    try {
      Logger.info('Creating new department', { organizationId, formData });

      const now = new Date();
      const departmentData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        managerId: formData.managerId || null,
        managerName: null, // Will be populated by updateManagerInfo
        managerEmail: null,
        employeeCount: 0,
        isDefault: false,
        organizationId,
        isActive: true,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await addDoc(collection(db, this.getCollectionPath(organizationId)), departmentData);

      const department: Department = {
        id: docRef.id,
        ...departmentData,
        createdAt: now,
        updatedAt: now
      };

      // Update manager info if provided
      if (formData.managerId) {
        await this.updateManagerInfo(organizationId, docRef.id, formData.managerId);
      }

      Logger.success('Department created successfully', { organizationId, departmentId: docRef.id });
      return department;
    } catch (error) {
      Logger.error('Failed to create department', { error, organizationId, formData });
      throw error;
    }
  }

  // Update department
  async updateDepartment(organizationId: string, departmentId: string, formData: DepartmentFormData): Promise<void> {
    try {
      Logger.info('Updating department', { organizationId, departmentId, formData });

      const docRef = doc(db, this.getCollectionPath(organizationId), departmentId);
      const updateData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        managerId: formData.managerId || null,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(docRef, updateData);

      // Update manager info if changed
      if (formData.managerId) {
        await this.updateManagerInfo(organizationId, departmentId, formData.managerId);
      } else {
        // Clear manager info
        await updateDoc(docRef, {
          managerName: null,
          managerEmail: null
        });
      }

      Logger.success('Department updated successfully', { organizationId, departmentId });
    } catch (error) {
      Logger.error('Failed to update department', { error, organizationId, departmentId, formData });
      throw error;
    }
  }

  // Delete department (soft delete)
  async deleteDepartment(organizationId: string, departmentId: string): Promise<void> {
    try {
      // Check if it's a default department
      const department = await this.getDepartment(organizationId, departmentId);
      if (department?.isDefault) {
        throw new Error('Cannot delete default departments (Operations, Admin)');
      }

      Logger.info('Deleting department', { organizationId, departmentId });

      const docRef = doc(db, this.getCollectionPath(organizationId), departmentId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date())
      });

      Logger.success('Department deleted successfully', { organizationId, departmentId });
    } catch (error) {
      Logger.error('Failed to delete department', { error, organizationId, departmentId });
      throw error;
    }
  }

  // Update manager information (cached fields)
  private async updateManagerInfo(organizationId: string, departmentId: string, managerId: string): Promise<void> {
    try {
      // Fetch manager details from employees collection
      const employeeRef = doc(db, `organizations/${organizationId}/employees/${managerId}`);
      const employeeSnap = await getDoc(employeeRef);

      if (employeeSnap.exists()) {
        const employeeData = employeeSnap.data();
        const managerName = `${employeeData.profile?.firstName || ''} ${employeeData.profile?.lastName || ''}`.trim();
        const managerEmail = employeeData.profile?.email || '';

        const deptRef = doc(db, this.getCollectionPath(organizationId), departmentId);
        await updateDoc(deptRef, {
          managerName,
          managerEmail,
          updatedAt: Timestamp.fromDate(new Date())
        });
      }
    } catch (error) {
      Logger.error('Failed to update manager info', { error, organizationId, departmentId, managerId });
      // Don't throw - this is a secondary operation
    }
  }

  // Get department statistics
  async getDepartmentStats(organizationId: string): Promise<DepartmentStats> {
    try {
      const departments = await this.getDepartments(organizationId);

      const totalDepartments = departments.length;
      const departmentsWithManagers = departments.filter(d => d.managerId).length;
      const departmentsWithoutManagers = totalDepartments - departmentsWithManagers;
      const totalEmployeesAcrossDepartments = departments.reduce((sum, d) => sum + d.employeeCount, 0);
      const averageEmployeesPerDepartment = totalDepartments > 0 ? totalEmployeesAcrossDepartments / totalDepartments : 0;

      return {
        totalDepartments,
        departmentsWithManagers,
        departmentsWithoutManagers,
        totalEmployeesAcrossDepartments,
        averageEmployeesPerDepartment: Math.round(averageEmployeesPerDepartment * 100) / 100
      };
    } catch (error) {
      Logger.error('Failed to get department stats', { error, organizationId });
      throw error;
    }
  }

  // Subscribe to department changes (real-time)
  subscribeToDepartments(organizationId: string, callback: (departments: Department[]) => void): () => void {
    const q = query(
      collection(db, this.getCollectionPath(organizationId)),
      where('isActive', '==', true),
      orderBy('isDefault', 'desc'),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const departments: Department[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        departments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Department);
      });

      callback(departments);
    }, (error) => {
      Logger.error('Department subscription error', { error, organizationId });
    });
  }

  // Update employee count for a department
  async updateEmployeeCount(organizationId: string, departmentId: string, newCount: number): Promise<void> {
    try {
      const docRef = doc(db, this.getCollectionPath(organizationId), departmentId);
      await updateDoc(docRef, {
        employeeCount: newCount,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      Logger.error('Failed to update employee count', { error, organizationId, departmentId, newCount });
      throw error;
    }
  }

  // Refresh employee counts for all departments by counting actual employees
  async refreshEmployeeCounts(organizationId: string): Promise<void> {
    try {
      Logger.info('Refreshing employee counts for all departments', { organizationId });

      // Get all employees
      const employeesRef = collection(db, `organizations/${organizationId}/employees`);
      const employeesSnapshot = await getDocs(query(employeesRef, where('isActive', '==', true)));

      // Count employees by department
      const departmentCounts: Record<string, number> = {};

      employeesSnapshot.forEach((doc) => {
        const employee = doc.data();
        // Check both profile.department and employment.department
        const department = employee.profile?.department || employee.employment?.department;
        if (department) {
          departmentCounts[department] = (departmentCounts[department] || 0) + 1;
        }
      });

      // Get all departments and update their counts
      const departments = await this.getDepartments(organizationId);
      const batch = writeBatch(db);

      for (const department of departments) {
        const newCount = departmentCounts[department.name] || 0;
        if (department.employeeCount !== newCount) {
          const deptRef = doc(db, this.getCollectionPath(organizationId), department.id);
          batch.update(deptRef, {
            employeeCount: newCount,
            updatedAt: Timestamp.fromDate(new Date())
          });
        }
      }

      await batch.commit();
      Logger.success('Employee counts refreshed successfully', { organizationId, counts: departmentCounts });
    } catch (error) {
      Logger.error('Failed to refresh employee counts', { error, organizationId });
      throw error;
    }
  }

  // Get departments available for manager assignment
  async getDepartmentsForManager(organizationId: string, excludeCurrentManager?: string): Promise<Department[]> {
    try {
      const departments = await this.getDepartments(organizationId);
      // Return departments that either have no manager or have the current manager (for updates)
      return departments.filter(dept =>
        !dept.managerId || dept.managerId === excludeCurrentManager
      );
    } catch (error) {
      Logger.error('Failed to get departments for manager', { error, organizationId });
      throw error;
    }
  }
}

export default new DepartmentService();