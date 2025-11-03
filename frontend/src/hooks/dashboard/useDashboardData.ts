// frontend/src/hooks/dashboard/useDashboardData.ts
// 🚀 UNIVERSAL DASHBOARD DATA HOOK - ALL ROLES
// ✅ Loads all dashboard data in parallel based on user role
// ✅ Replaces scattered hooks with unified performance-optimized loading

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import Logger from '../../utils/logger';
import { API } from '../../api';
import { DataServiceV2 } from '../../services/DataServiceV2';
import { ShardedDataService } from '../../services/ShardedDataService';
import CacheService from '../../services/CacheService';

// Types for dashboard data
interface DashboardData {
  // Core data (all roles)
  organization: any | null;
  categories: any[];
  user: any | null;

  // Role-specific data
  employees: any[];           // HOD, HR, Business Owner
  followUps: any[];          // HOD, HR
  permissions: any;          // All roles
  warnings: any[];           // HR mainly
  reports: any[];            // Business Owner, HR
  teams: any[];              // Business Owner
  metrics: any;              // Business Owner, HR

  // Progressive loading states - individual loading states for each data type
  loading: {
    overall: boolean;        // True until initial UI can be shown
    employees: boolean;
    followUps: boolean;
    permissions: boolean;
    warnings: boolean;
    reports: boolean;
    teams: boolean;
    metrics: boolean;
  };
  error: string | null;
}

interface UseDashboardDataProps {
  role?: string;
  skipData?: string[]; // Allow skipping certain data types
}

export const useDashboardData = ({ role, skipData = [] }: UseDashboardDataProps = {}) => {
  // Core hooks
  const { user } = useAuth();
  const { organization, categories: orgCategories, loading: orgLoading } = useOrganization();

  // State
  const [data, setData] = useState<DashboardData>({
    organization: null,
    categories: [],
    user: null,
    employees: [],
    followUps: [],
    permissions: {},
    warnings: [],
    reports: [],
    teams: [],
    metrics: {},
    loading: {
      overall: true,
      employees: false,
      followUps: false,
      permissions: false,
      warnings: false,
      reports: false,
      teams: false,
      metrics: false
    },
    error: null
  });

  // Refs to prevent duplicate loading
  const loadingRef = useRef(false);
  const loadedRef = useRef<string | null>(null);

  // Determine what data to load based on role
  const getDataRequirements = useCallback((userRole: string) => {
    const requirements = {
      core: ['organization', 'categories', 'permissions'],
      hod: ['employees', 'followUps'],
      hr: ['employees', 'followUps', 'warnings', 'reports', 'metrics'],
      business_owner: ['employees', 'teams', 'reports', 'metrics'],
      super_admin: ['employees', 'warnings', 'reports', 'metrics', 'teams']
    };

    return [
      ...requirements.core,
      ...(requirements[userRole as keyof typeof requirements] || [])
    ].filter(item => !skipData.includes(item));
  }, [skipData]);

  // 🚀 PROGRESSIVE DATA LOADING - Show UI immediately, load data independently
  const loadDashboardData = useCallback(async () => {
    // 🚀 OPTIMIZATION: Start loading even if org is still loading - use user.organizationId
    const orgId = organization?.id || user?.organizationId;

    if (!orgId || !user?.id || loadingRef.current) {
      return;
    }

    const cacheKey = `${orgId}-${user.id}-${role || user.role}`;
    if (loadedRef.current === cacheKey) {
      return; // Already loaded this combination
    }

    loadingRef.current = true;

    try {
      const userRole = role || user.role || 'hod';
      const requirements = getDataRequirements(userRole);

      Logger.debug(`🚀 [DashboardData] Progressive loading for role: ${userRole}`, requirements);

      // 🔥 STEP 1: Show UI shell immediately with core data
      setData(prev => ({
        ...prev,
        organization: organization || prev.organization, // Use whatever we have
        categories: orgCategories || prev.categories || [],
        user,
        loading: {
          overall: false, // ✅ RENDER IMMEDIATELY - don't wait for data
          // Set individual loading states for required data
          employees: requirements.includes('employees'),
          followUps: requirements.includes('followUps'),
          permissions: requirements.includes('permissions'),
          warnings: requirements.includes('warnings'),
          reports: requirements.includes('reports'),
          teams: requirements.includes('teams'),
          metrics: requirements.includes('metrics')
        },
        error: null
      }));

      // 🔥 STEP 2: Load each data type independently and update UI as it loads
      const startTime = Date.now();

      // Helper function to update individual data and loading state
      const updateDataItem = (dataType: string, data: any) => {
        setData(prev => ({
          ...prev,
          [dataType]: data,
          loading: {
            ...prev.loading,
            [dataType]: false
          }
        }));
      };

      // Core data requests - load independently
      if (requirements.includes('permissions')) {
        CacheService.getOrFetch(
          `permissions:${user.id}:${orgId}`,
          () => Promise.resolve({}) // Placeholder for permissions - implement if needed
        ).then(data => updateDataItem('permissions', data || {}))
          .catch(error => {
            Logger.error('❌ Failed to load permissions:', error);
            updateDataItem('permissions', {});
          });
      }

      // Role-specific data requests - load independently
      if (requirements.includes('employees')) {
        // HR and Business Owner see ALL employees ALWAYS (even when viewing HOD dashboard)
        // Check ACTUAL user role, not requested dashboard role
        // Note: user.role can be an object {id: 'hr-manager', name: 'HR Manager'} or a string
        const actualUserRoleId = typeof user.role === 'object' && user.role?.id
          ? user.role.id
          : (user.role || userRole);

        const isHROrOwner = actualUserRoleId === 'hr' ||
                           actualUserRoleId === 'business_owner' ||
                           actualUserRoleId === 'hr-manager' ||
                           actualUserRoleId === 'business-owner';

        const cacheKey = isHROrOwner
          ? CacheService.generateOrgKey(orgId, 'employees:all')
          : CacheService.generateOrgKey(orgId, `employees:manager:${user.id}`);

        CacheService.getOrFetch(
          cacheKey,
          async () => {
            // HR/Business Owner get all employees (even in HOD view), HOD gets their team only
            const employeesData = isHROrOwner
              ? await API.employees.getAll(orgId)
              : await API.employees.getByManager(user.id, orgId);

            Logger.debug(`👥 Loading ${employeesData.length} employees for ${actualUserRoleId} (viewing ${userRole} dashboard)`);

            // Return employees with full structure (ManualWarningEntry needs profile property)
            return employeesData;
          }
        ).then(data => updateDataItem('employees', Array.isArray(data) ? data : []))
          .catch(error => {
            Logger.error('❌ Failed to load employees:', error);
            updateDataItem('employees', []);
          });
      }

      if (requirements.includes('followUps')) {
        CacheService.getOrFetch(
          `followups:${user.id}:${orgId}`,
          () => Promise.resolve([]) // Placeholder for follow-ups - implement if needed
        ).then(data => updateDataItem('followUps', Array.isArray(data) ? data : []))
          .catch(error => {
            Logger.error('❌ Failed to load followUps:', error);
            updateDataItem('followUps', []);
          });
      }

      if (requirements.includes('warnings')) {
        CacheService.getOrFetch(
          CacheService.generateOrgKey(orgId, 'warnings'),
          () => API.warnings.getAll(orgId)
        ).then(data => updateDataItem('warnings', Array.isArray(data) ? data : []))
          .catch(error => {
            Logger.error('❌ Failed to load warnings:', error);
            updateDataItem('warnings', []);
          });
      }

      if (requirements.includes('reports')) {
        CacheService.getOrFetch(
          CacheService.generateOrgKey(orgId, 'reports'),
          () => API.reports.getAll(orgId)
        ).then(data => updateDataItem('reports', Array.isArray(data) ? data : []))
          .catch(error => {
            Logger.error('❌ Failed to load reports:', error);
            updateDataItem('reports', []);
          });
      }

      if (requirements.includes('teams')) {
        CacheService.getOrFetch(
          CacheService.generateOrgKey(orgId, 'teams'),
          () => ShardedDataService.getAllEmployees(orgId)
        ).then(data => updateDataItem('teams', Array.isArray(data) ? data : []))
          .catch(error => {
            Logger.error('❌ Failed to load teams:', error);
            updateDataItem('teams', []);
          });
      }

      if (requirements.includes('metrics')) {
        CacheService.getOrFetch(
          CacheService.generateOrgKey(orgId, 'metrics'),
          () => API.analytics.getDashboardMetrics(orgId)
        ).then(data => updateDataItem('metrics', data || {}))
          .catch(error => {
            Logger.error('❌ Failed to load metrics:', error);
            updateDataItem('metrics', {});
          });
      }

      // Log completion and mark as loaded
      loadedRef.current = cacheKey;
      Logger.debug(`✅ [DashboardData] Progressive loading initiated for role: ${userRole} (${Date.now() - startTime}ms)`);

    } catch (error) {
      Logger.error('❌ [DashboardData] Failed to initialize progressive loading:', error);
      setData(prev => ({
        ...prev,
        loading: {
          overall: false,
          employees: false,
          followUps: false,
          permissions: false,
          warnings: false,
          reports: false,
          teams: false,
          metrics: false
        },
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [organization, user, orgCategories, role, getDataRequirements]); // 🚀 REMOVED: orgLoading dependency

  // Refresh function
  const refreshData = useCallback(() => {
    loadedRef.current = null;
    CacheService.clearByPrefix(`org:${organization?.id}:`);
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]); // 🔧 FIX: Removed loadDashboardData to prevent unnecessary re-renders

  // 🚀 OPTIMIZED: Load data when user is ready - don't wait for orgLoading
  useEffect(() => {
    if (user?.id && (organization?.id || user.organizationId)) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, organization?.id, user?.organizationId]); // 🔧 FIX: Removed loadDashboardData to prevent infinite loop

  return {
    ...data,
    refreshData,
    isReady: !data.loading.overall && !!organization && !!user
  };
};

export default useDashboardData;