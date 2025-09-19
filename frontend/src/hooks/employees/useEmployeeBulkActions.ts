// frontend/src/hooks/employees/useEmployeeBulkActions.ts
import { useState } from 'react';
import { API } from '../../api';
import type { Employee } from '../../types';
import type { BulkAction, BulkActionResult } from '../../types';

export const useEmployeeBulkActions = () => {
  const [processing, setProcessing] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const selectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAll = (employees: Employee[]) => {
    setSelectedEmployees(employees.map(e => e.id));
  };

  const deselectAll = () => {
    setSelectedEmployees([]);
  };

  const performBulkAction = async (
    action: BulkAction,
    organizationId: string
  ): Promise<BulkActionResult> => {
    if (selectedEmployees.length === 0) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ employeeId: '', error: 'No employees selected' }]
      };
    }

    setProcessing(true);
    let processed = 0;
    let failed = 0;
    const errors: Array<{ employeeId: string; error: string }> = [];

    try {
      for (const employeeId of selectedEmployees) {
        try {
          switch (action.type) {
            case 'archive':
              await API.employees.delete(employeeId, organizationId);
              break;
              
            case 'updateDepartment':
              if (!action.value) throw new Error('Department not specified');
              // Get employee, update department field, then save
              const employeeForDept = await API.employees.getById(employeeId, organizationId);
              if (employeeForDept) {
                employeeForDept.profile.department = action.value;
                await API.employees.update(employeeId, organizationId, employeeForDept);
              }
              break;
              
            case 'updateDeliveryMethod':
              if (!action.value) throw new Error('Delivery method not specified');
              // Get employee, update delivery method, then save
              const employeeForDelivery = await API.employees.getById(employeeId, organizationId);
              if (employeeForDelivery) {
                employeeForDelivery.profile.preferredDeliveryMethod = action.value as any;
                await API.employees.update(employeeId, organizationId, employeeForDelivery);
              }
              break;
              
            default:
              throw new Error(`Unknown action type: ${action.type}`);
          }
          
          processed++;
        } catch (err) {
          failed++;
          errors.push({
            employeeId,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      const result: BulkActionResult = {
        success: failed === 0,
        processed,
        failed,
        errors
      };

      // Clear selection after successful action
      if (result.success) {
        deselectAll();
      }

      return result;
    } finally {
      setProcessing(false);
    }
  };

  return {
    selectedEmployees,
    processing,
    selectEmployee,
    selectAll,
    deselectAll,
    performBulkAction,
    selectedCount: selectedEmployees.length
  };
};
