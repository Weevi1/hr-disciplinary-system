// useManagers.ts
// 👥 CUSTOM HOOK FOR MANAGER STATE MANAGEMENT
// Handles loading, caching, and CRUD operations for managers

import { useState, useEffect, useCallback } from 'react';
import ManagerService, { Manager, ManagerStats } from '../../services/ManagerService';
import DepartmentService from '../../services/DepartmentService';
import Logger from '../../utils/logger';

interface UseManagersReturn {
  managers: Manager[];
  stats: ManagerStats | null;
  loading: boolean;
  error: string | null;
  loadManagers: () => Promise<void>;
  refreshManagers: () => Promise<void>;
  promoteEmployee: (employeeId: string, role: 'hr-manager' | 'hod-manager', departmentIds?: string[]) => Promise<void>;
  demoteManager: (managerId: string, replacementManagerId?: string) => Promise<void>;
  updateManagerDepartments: (managerId: string, departmentIds: string[]) => Promise<void>;
  archiveManager: (managerId: string, reason: string, replacementManagerId?: string) => Promise<void>;
  restoreManager: (managerId: string) => Promise<void>;
}

export function useManagers(organizationId?: string): UseManagersReturn {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all managers for the organization
   */
  const loadManagers = useCallback(async () => {
    if (!organizationId) {
      setManagers([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      Logger.debug('🔄 Loading managers...', { organizationId });

      // Load managers
      const managersData = await ManagerService.getManagers(organizationId);

      // Load employee counts for each manager
      const employeeCounts = await ManagerService.getManagerEmployeeCounts(organizationId, managersData);

      // Load departments to get department names
      const departments = await DepartmentService.getDepartments(organizationId);
      const deptMap = new Map(departments.map(d => [d.id, d.name]));

      // Enhance managers with employee count and department names
      const enhancedManagers = managersData.map(manager => ({
        ...manager,
        employeeCount: employeeCounts.get(manager.id) || 0,
        departmentNames: manager.departmentIds
          ?.map(id => deptMap.get(id))
          .filter(Boolean) as string[] || []
      }));

      // Load stats
      const statsData = await ManagerService.getManagerStats(organizationId);

      setManagers(enhancedManagers);
      setStats(statsData);

      Logger.success('✅ Managers loaded successfully', {
        count: enhancedManagers.length,
        hrManagers: statsData.hrManagers,
        hodManagers: statsData.hodManagers
      });
    } catch (err: any) {
      Logger.error('Failed to load managers:', err);
      setError(err.message || 'Failed to load managers');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  /**
   * Refresh managers data
   */
  const refreshManagers = useCallback(async () => {
    await loadManagers();
  }, [loadManagers]);

  /**
   * Promote an employee to manager
   */
  const promoteEmployee = useCallback(async (
    employeeId: string,
    role: 'hr-manager' | 'hod-manager',
    departmentIds?: string[]
  ) => {
    if (!organizationId) throw new Error('Organization ID is required');

    try {
      await ManagerService.promoteEmployeeToManager(
        organizationId,
        employeeId,
        role,
        departmentIds
      );

      await refreshManagers();
    } catch (err: any) {
      Logger.error('Failed to promote employee:', err);
      throw err;
    }
  }, [organizationId, refreshManagers]);

  /**
   * Demote a manager back to employee
   */
  const demoteManager = useCallback(async (
    managerId: string,
    replacementManagerId?: string
  ) => {
    if (!organizationId) throw new Error('Organization ID is required');

    try {
      await ManagerService.demoteManagerToEmployee(
        organizationId,
        managerId,
        replacementManagerId
      );

      await refreshManagers();
    } catch (err: any) {
      Logger.error('Failed to demote manager:', err);
      throw err;
    }
  }, [organizationId, refreshManagers]);

  /**
   * Update manager's department assignments
   */
  const updateManagerDepartments = useCallback(async (
    managerId: string,
    departmentIds: string[]
  ) => {
    if (!organizationId) throw new Error('Organization ID is required');

    try {
      await ManagerService.updateManagerDepartments(
        organizationId,
        managerId,
        departmentIds
      );

      await refreshManagers();
    } catch (err: any) {
      Logger.error('Failed to update manager departments:', err);
      throw err;
    }
  }, [organizationId, refreshManagers]);

  /**
   * Archive a manager
   */
  const archiveManager = useCallback(async (
    managerId: string,
    reason: string,
    replacementManagerId?: string
  ) => {
    if (!organizationId) throw new Error('Organization ID is required');

    try {
      await ManagerService.archiveManager(
        organizationId,
        managerId,
        reason,
        replacementManagerId
      );

      await refreshManagers();
    } catch (err: any) {
      Logger.error('Failed to archive manager:', err);
      throw err;
    }
  }, [organizationId, refreshManagers]);

  /**
   * Restore an archived manager
   */
  const restoreManager = useCallback(async (managerId: string) => {
    if (!organizationId) throw new Error('Organization ID is required');

    try {
      await ManagerService.restoreManager(organizationId, managerId);

      await refreshManagers();
    } catch (err: any) {
      Logger.error('Failed to restore manager:', err);
      throw err;
    }
  }, [organizationId, refreshManagers]);

  // Load managers on mount or when organizationId changes
  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  return {
    managers,
    stats,
    loading,
    error,
    loadManagers,
    refreshManagers,
    promoteEmployee,
    demoteManager,
    updateManagerDepartments,
    archiveManager,
    restoreManager
  };
}
