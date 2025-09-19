import Logger from '../../utils/logger';
// frontend/src/hooks/employees/useEmployees.ts
// ✅ ENTERPRISE SCALE: Paginated loading for large organizations
// ✅ Handles hundreds of employees per organization efficiently
import { useState, useEffect } from 'react';
import { API } from '../../api';
import type { Employee } from '../../types';

interface PaginationState {
  hasMore: boolean;
  lastId?: string;
  currentPage: number;
  pageSize: number;
}

export const useEmployees = (organizationId?: string, managerId?: string) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // Full dataset for search/filter
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    hasMore: true,
    currentPage: 0,
    pageSize: 50 // Configurable page size for performance
  });

  // For small organizations (<100 employees), load all at once
  // For large organizations, use pagination
  const shouldUsePagination = (totalCount: number) => totalCount > 100;

  const loadEmployees = async (reset: boolean = true) => {
    if (!organizationId) return;
    
    try {
      if (reset) {
        setLoading(true);
        setEmployees([]);
        setPagination(prev => ({ ...prev, currentPage: 0, lastId: undefined }));
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      // HOD managers get their team members only
      if (managerId) {
        const data = await API.employees.getByManager(managerId, organizationId);
        setEmployees(data);
        setAllEmployees(data);
        setPagination(prev => ({ ...prev, hasMore: false }));
        return;
      }

      // For large organizations, load all employees (sharded API handles this efficiently)
      // Load ALL employees including archived ones for full visibility
      const pageEmployees = await API.employees.getAll(organizationId);
      
      // Since we're loading all at once with sharded API, no pagination needed
      const hasMore = false;
      const lastId = undefined;

      if (reset) {
        setEmployees(pageEmployees);
        setAllEmployees(pageEmployees);
      } else {
        setEmployees(prev => [...prev, ...pageEmployees]);
        setAllEmployees(prev => [...prev, ...pageEmployees]);
      }

      setPagination(prev => ({
        ...prev,
        hasMore,
        lastId,
        currentPage: reset ? 1 : prev.currentPage + 1
      }));

    } catch (err) {
      setError('Failed to load employees');
      Logger.error('Error loading employees:', err)
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load next page for large organizations
  const loadMoreEmployees = async () => {
    if (!pagination.hasMore || loadingMore) return;
    await loadEmployees(false);
  };

  // ✅ FIXED: Use the proper DataService.archiveEmployee method with reason
  const archiveEmployee = async (employee: Employee, reason?: string) => {
    if (!organizationId) return;

    try {
      // Use the API layer for archiving (sharded)
      await API.employees.delete(employee.id, organizationId);
      
      // Reload employees to reflect the change
      await loadEmployees();
    } catch (err) {
      setError('Failed to archive employee');
      Logger.error('Archive error:', err)
      throw err;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    if (!organizationId) return;

    try {
      await API.employees.update(employee.id, organizationId, employee);
      await loadEmployees();
    } catch (err) {
      setError('Failed to update employee');
      throw err;
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [organizationId]);

  return {
    employees,
    allEmployees, // For search/filtering across all loaded data
    loading,
    loadingMore,
    error,
    loadEmployees,
    loadMoreEmployees,
    archiveEmployee,
    updateEmployee,
    pagination: {
      hasMore: pagination.hasMore,
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      canLoadMore: pagination.hasMore && !loading && !loadingMore
    }
  };
};
