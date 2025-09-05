// frontend/src/hooks/employees/useEmployees.ts
// ✅ FIXED: Proper archive function that uses DataService.archiveEmployee
import { useState, useEffect } from 'react';
import { API } from '@/api';
import type { Employee } from '../../types';

export const useEmployees = (organizationId?: string) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await API.employees.getAll(organizationId);
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use the proper DataService.archiveEmployee method with reason
  const archiveEmployee = async (employee: Employee, reason?: string) => {
    if (!organizationId) return;

    try {
      // Use the dedicated archiveEmployee method that includes audit trails
      await DataService.archiveEmployee(organizationId, employee.id, reason);
      
      // Reload employees to reflect the change
      await loadEmployees();
    } catch (err) {
      setError('Failed to archive employee');
      console.error('Archive error:', err);
      throw err;
    }
  };

  const updateEmployee = async (employee: Employee) => {
    if (!organizationId) return;

    try {
      await DataService.saveEmployee(organizationId, employee);
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
    loading,
    error,
    loadEmployees,
    archiveEmployee,
    updateEmployee
  };
};
