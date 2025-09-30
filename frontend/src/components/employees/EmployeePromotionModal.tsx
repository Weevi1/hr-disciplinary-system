// frontend/src/components/employees/EmployeePromotionModal.tsx
// 👔 Employee Promotion to Manager Modal
// Allows HR to promote employees to HR Manager or Department Manager roles

import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, Shield } from 'lucide-react';
import { ThemedCard } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import DepartmentService from '../../services/DepartmentService';
import type { Employee } from '../../types/core';
import type { Department } from '../../types/department';

interface EmployeePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  organizationId: string;
  onSuccess: () => void;
}

type ManagerRole = 'hr-manager' | 'hod-manager';

export const EmployeePromotionModal: React.FC<EmployeePromotionModalProps> = ({
  isOpen,
  onClose,
  employee,
  organizationId,
  onSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<ManagerRole>('hod-manager');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(employee.profile?.email || employee.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Scroll to top and disable body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      // Save original body style
      const originalStyle = window.getComputedStyle(document.body).overflow;

      // Scroll to top to ensure modal is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Disable body scroll
      document.body.style.overflow = 'hidden';

      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Load departments for HOD selection
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const depts = await DepartmentService.getDepartments(organizationId);
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (isOpen && organizationId) {
      loadDepartments();
    }
  }, [isOpen, organizationId]);

  if (!isOpen) return null;

  const handlePromote = async () => {
    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (selectedRole === 'hod-manager' && selectedDepartments.length === 0) {
      setError('Please select at least one department for the HOD manager');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Import dynamically to avoid circular dependencies
      const { functions, httpsCallable } = await import('firebase/functions');
      const { functions: functionsInstance } = await import('../../config/firebase');

      const createOrganizationUser = httpsCallable(functionsInstance, 'createOrganizationUser');

      const payload: any = {
        organizationId,
        email: email.trim(),
        firstName: employee.profile?.firstName || employee.firstName,
        lastName: employee.profile?.lastName || employee.lastName,
        password: password,
        role: selectedRole,
        employeeId: employee.id, // Link to existing employee
        updateEmployeeEmail: email !== (employee.profile?.email || employee.email) // Update if email changed
      };

      // Add departmentIds for HOD managers
      if (selectedRole === 'hod-manager') {
        payload.departmentIds = selectedDepartments;
      }

      console.log('🚀 Promoting employee with payload:', {
        ...payload,
        password: '***HIDDEN***', // Don't log the actual password
        employeeData: {
          id: employee.id,
          emailChanged: email !== (employee.profile?.email || employee.email)
        }
      });

      const result = await createOrganizationUser(payload);

      console.log('✅ Employee promoted to manager:', result);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Failed to promote employee:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details
      });
      setError(err.message || 'Failed to promote employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Promote to Manager
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Grant management access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Employee Info */}
          <ThemedCard className="bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Promoting:
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {employee.profile?.firstName || employee.firstName} {employee.profile?.lastName || employee.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {employee.profile?.email || employee.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {employee.profile?.department || 'No Department'} • {employee.profile?.position || 'No Position'}
              </p>
            </div>
          </ThemedCard>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Manager Role *
            </label>

            {/* HR Manager Option */}
            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
              <input
                type="radio"
                name="role"
                value="hr-manager"
                checked={selectedRole === 'hr-manager'}
                onChange={(e) => setSelectedRole(e.target.value as ManagerRole)}
                className="w-5 h-5 mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">HR Manager</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full access to employee management, warnings, HR reports, and department management
                </p>
              </div>
            </label>

            {/* Department Manager Option */}
            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20">
              <input
                type="radio"
                name="role"
                value="hod-manager"
                checked={selectedRole === 'hod-manager'}
                onChange={(e) => setSelectedRole(e.target.value as ManagerRole)}
                className="w-5 h-5 mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Department Manager (HOD)</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage their department team, issue warnings, view department reports
                </p>
              </div>
            </label>
          </div>

          {/* Department Selection for HOD */}
          {selectedRole === 'hod-manager' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Department(s) *
              </label>

              {loadingDepartments ? (
                <div className="text-sm text-gray-500">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="text-sm text-gray-500">No departments available</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDepartments([...selectedDepartments, dept.id]);
                          } else {
                            setSelectedDepartments(selectedDepartments.filter(id => id !== dept.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {dept.name}
                        {dept.employeeCount > 0 && (
                          <span className="text-gray-500 ml-1">({dept.employeeCount} employees)</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Verification */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@company.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verify or update the employee's email address
            </p>
          </div>

          {/* Password Fields */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Set Login Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              required
              minLength={6}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Important:
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This will create a user account with management permissions. Share the login credentials with the employee. They can change their password from their dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <ThemedButton
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handlePromote}
            disabled={isSubmitting}
            icon={UserCheck}
          >
            {isSubmitting ? 'Promoting...' : 'Promote to Manager'}
          </ThemedButton>
        </div>
      </div>
    </div>
  );
};

export default EmployeePromotionModal;