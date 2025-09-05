// frontend/src/hooks/employees/useEmployeeSearch.ts
import { useState, useMemo, useCallback } from 'react';
import type { Employee } from '../../types';
import type { EmployeeFilters } from '../../types';

export const useEmployeeSearch = (employees: Employee[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: '',
    department: '',
    contractType: '',
    hasWarnings: false,
    isActive: true
  });

  const updateFilter = useCallback(<K extends keyof EmployeeFilters>(
    key: K,
    value: EmployeeFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      department: '',
      contractType: '',
      hasWarnings: false,
      isActive: true
    });
    setSearchTerm('');
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Active filter
      if (filters.isActive && !employee.isActive) return false;
      if (!filters.isActive && employee.isActive) return false;
      
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          employee.profile.firstName.toLowerCase().includes(search) ||
          employee.profile.lastName.toLowerCase().includes(search) ||
          employee.profile.employeeNumber.toLowerCase().includes(search) ||
          employee.profile.email.toLowerCase().includes(search);
        
        if (!matchesSearch) return false;
      }
      
      // Department filter
      if (filters.department && employee.profile.department !== filters.department) {
        return false;
      }
      
      // Contract type filter
      if (filters.contractType && employee.employment.contractType !== filters.contractType) {
        return false;
      }
      
      // Warnings filter
      if (filters.hasWarnings && employee.disciplinaryRecord.activeWarnings === 0) {
        return false;
      }
      
      return true;
    });
  }, [employees, filters]);

  const departments = useMemo(() => {
    return [...new Set(employees.map(e => e.profile.department))].sort();
  }, [employees]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.department) count++;
    if (filters.contractType) count++;
    if (filters.hasWarnings) count++;
    if (!filters.isActive) count++;
    return count;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    filteredEmployees,
    departments,
    activeFiltersCount,
    totalCount: employees.length,
    filteredCount: filteredEmployees.length
  };
};
