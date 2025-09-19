// frontend/src/hooks/employees/useEmployeeForm.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { API } from '../../api';
import { createEmployeeFromForm, createFormFromEmployee, validateEmployee } from '../../types';
import type { Employee } from '../../types';
import type { EmployeeFormData } from '../../types';

interface UseEmployeeFormProps {
  employee?: Employee | null;
  onSuccess?: () => void;
}

export const useEmployeeForm = ({ employee, onSuccess }: UseEmployeeFormProps) => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    department: '',
    position: '',
    startDate: '',
    contractType: 'permanent',
    probationEndDate: '',
    preferredDeliveryMethod: 'email',
    isActive: true
  });

  // Load employee data if editing
  useEffect(() => {
    if (employee) {
      setFormData(createFormFromEmployee(employee));
    }
  }, [employee]);

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (!formData.employeeNumber.trim()) {
      validationErrors.push('Employee number is required');
    }

    if (!formData.firstName.trim()) {
      validationErrors.push('First name is required');
    }

    if (!formData.lastName.trim()) {
      validationErrors.push('Last name is required');
    }

    if (!formData.email.trim()) {
      validationErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.push('Invalid email format');
    }

    if (!formData.department.trim()) {
      validationErrors.push('Department is required');
    }

    if (!formData.position.trim()) {
      validationErrors.push('Position is required');
    }

    if (!formData.startDate) {
      validationErrors.push('Start date is required');
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!organization) {
      setErrors(['Organization not found']);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      const employeeData = createEmployeeFromForm(formData, organization.id);
      
      if (employee) {
        // Preserve existing data when updating
        employeeData.id = employee.id;
        employeeData.createdAt = employee.createdAt;
        employeeData.disciplinaryRecord = employee.disciplinaryRecord; // Preserve warnings
      }

      if (employee) {
        // Update existing employee
        await API.employees.update(employee.id, organization.id, employeeData);
      } else {
        // Create new employee
        await API.employees.create(employeeData);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save employee';
      setErrors([errorMessage]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof EmployeeFormData>(
    field: K,
    value: EmployeeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      whatsappNumber: '',
      department: '',
      position: '',
      startDate: '',
      contractType: 'permanent',
      probationEndDate: '',
      preferredDeliveryMethod: 'email',
      isActive: true
    });
    setErrors([]);
  };

  return {
    formData,
    loading,
    errors,
    updateField,
    handleSubmit,
    resetForm,
    validateForm
  };
};
