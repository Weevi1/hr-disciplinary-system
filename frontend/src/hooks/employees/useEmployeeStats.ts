// frontend/src/hooks/employees/useEmployeeStats.ts
import { useMemo } from 'react';
import type { Employee } from '../../types';
import type { EmployeeStats } from '../../types';

export const useEmployeeStats = (employees: Employee[]) => {
  const stats = useMemo<EmployeeStats>(() => {
    const result: EmployeeStats = {
      total: employees.length,
      active: 0,
      inactive: 0,
      onProbation: 0,
      withActiveWarnings: 0,
      departments: [],
      contractTypes: []
    };

    const departmentMap = new Map<string, number>();
    const contractMap = new Map<string, number>();
    const today = new Date();

    employees.forEach(employee => {
      // Active/Inactive count
      if (employee.isActive) {
        result.active++;
        
        // Probation check (only for active employees)
        if (employee.employment.probationEndDate) {
          const probationEnd = new Date(employee.employment.probationEndDate);
          if (probationEnd > today) {
            result.onProbation++;
          }
        }
        
        // Active warnings (only for active employees)
        if (employee.disciplinaryRecord.activeWarnings > 0) {
          result.withActiveWarnings++;
        }
      } else {
        result.inactive++;
      }

      // Department count
      const dept = employee.profile.department;
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);

      // Contract type count
      const contract = employee.employment.contractType;
      contractMap.set(contract, (contractMap.get(contract) || 0) + 1);
    });

    // Convert maps to arrays
    result.departments = Array.from(departmentMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    result.contractTypes = Array.from(contractMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return result;
  }, [employees]);

  const departmentDistribution = useMemo(() => {
    return stats.departments.map(dept => ({
      ...dept,
      percentage: Math.round((dept.count / stats.total) * 100)
    }));
  }, [stats]);

  const warningRiskLevel = useMemo(() => {
    if (stats.total === 0) return 'low';
    const warningPercentage = (stats.withActiveWarnings / stats.active) * 100;
    
    if (warningPercentage > 20) return 'high';
    if (warningPercentage > 10) return 'medium';
    return 'low';
  }, [stats]);

  return {
    stats,
    departmentDistribution,
    warningRiskLevel,
    probationPercentage: stats.active > 0 
      ? Math.round((stats.onProbation / stats.active) * 100) 
      : 0
  };
};
