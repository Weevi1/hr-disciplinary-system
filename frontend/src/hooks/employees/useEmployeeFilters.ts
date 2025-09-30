// frontend/src/hooks/employees/useEmployeeFilters.ts
import { useState, useMemo } from 'react';
import type { Employee } from '../../types';
import type { EmployeeFilters } from '../../types';
import { filterEmployees, calculateEmployeePermissions } from '../../types';

export const useEmployeeFilters = (employees: Employee[], user: any) => {
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: '',
    department: '',
    contractType: '',
    hasWarnings: false,
    isActive: true
  });

  const permissions = useMemo(() => {
    return calculateEmployeePermissions(user?.role.id, user?.departmentIds);
  }, [user]);

  const filteredEmployees = useMemo(() => {
    return filterEmployees(employees, filters, permissions, user?.role?.id, user?.id);
  }, [employees, filters, permissions, user?.role?.id, user?.id]);

  return {
    filters,
    setFilters,
    filteredEmployees
  };
};
