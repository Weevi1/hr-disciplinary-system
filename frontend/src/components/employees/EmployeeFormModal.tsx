import Logger from '../../utils/logger';
// frontend/src/components/employees/EmployeeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { API } from '../../api';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import DepartmentService from '../../services/DepartmentService';
import { createEmployeeFromForm, createFormFromEmployee, generateEmployeeNumber } from '../../types';
import type { Employee, User, Department } from '../../types';
import type { EmployeeFormData } from '../../types';
import { X, User as UserIcon, Building, Settings, Save, Loader2 } from 'lucide-react';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import { useModalDialog } from '../../hooks/useFocusTrap';
import { Z_INDEX } from '../../constants/zIndex';

// Helper function to get role ID from either string or object role format
const getRoleId = (role: any): string => {
  return typeof role === 'string' ? role : role?.id || '';
};

interface EmployeeFormModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSave: () => void;
  basicMode?: boolean; // For HOD managers - only essential fields
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  employee,
  onClose,
  onSave,
  basicMode = false
}) => {
  const { organization, user } = useAuth();
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
    managerId: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(true);

  // Set up focus trap and ARIA
  const { containerRef, ariaProps } = useModalDialog({
    isOpen: true,
    onClose,
    titleId: 'employee-form-title',
    descriptionId: 'employee-form-description',
  });

  // Load managers for the dropdown
  useEffect(() => {
    const loadManagers = async () => {
      if (!organization) return;
      
      try {
        setLoadingManagers(true);
        const usersResult = await DatabaseShardingService.queryDocuments(organization.id, 'users', []);
        const users = usersResult.documents as User[];
        
        const managerUsers = users.filter((user: User) => {
          const roleId = getRoleId(user.role);
          const isManager = roleId === 'hod-manager' || 
                           roleId === 'hr-manager' || 
                           roleId === 'business-owner';
          return isManager;
        });
        
        setManagers(managerUsers);
      } catch (error) {
        Logger.error('Failed to load managers:', error)
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers();
  }, [organization]);

  // Load departments for the dropdown
  useEffect(() => {
    const loadDepartments = async () => {
      if (!organization) return;

      try {
        setLoadingDepartments(true);
        const depts = await DepartmentService.getDepartments(organization.id);
        setDepartments(depts);
      } catch (error) {
        Logger.error('Failed to load departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [organization]);

  // Initialize form data when employee prop changes
  useEffect(() => {
    if (employee) {
      const formFromEmployee = createFormFromEmployee(employee);
      setFormData(formFromEmployee);
    } else if (basicMode && organization) {
      // Auto-generate employee number for new basic entries
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      setFormData(prev => ({
        ...prev,
        employeeNumber: generateEmployeeNumber(organization.id),
        department: user?.departmentIds?.[0] || user?.profile?.department || 'Operations', // Pre-fill with manager's department or default
        startDate: today, // Default to today
        managerId: user?.id, // Assign to current user as manager
        isActive: true
      }));
    }
  }, [employee, basicMode, organization, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (employee) {
        // Update existing employee - preserve existing structure and ID
        const updatedEmployee = {
          ...employee, // Preserve existing data and ID
          profile: {
            ...employee.profile,
            employeeNumber: formData.employeeNumber,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber || null,
            whatsappNumber: formData.whatsappNumber || null,
            department: formData.department,
            position: formData.position,
            startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
          },
          employment: {
            ...employee.employment,
            contractType: formData.contractType,
            managerId: formData.managerId || undefined, // Always save managerId (undefined if empty)
            ...(formData.probationEndDate && { probationEndDate: new Date(formData.probationEndDate) })
          },
          isActive: employee.isActive, // Preserve current active status - use archive functionality to change status
          updatedAt: new Date()
        };
        
        await API.employees.update(employee.id, organization.id, updatedEmployee);
        Logger.debug(`✅ Updated employee: ${employee.id}`);
      } else {
        // Create new employee
        const employeeData = createEmployeeFromForm(formData, organization.id);
        // Remove ID for new employee creation
        const { id, ...employeeDataWithoutId } = employeeData;
        const employeeId = await API.employees.create(employeeDataWithoutId);
        Logger.debug(`✅ Created new employee: ${employeeId}`);
      }
      
      onSave();
    } catch (error: any) {
      Logger.error('Error saving employee:', error)
      setError(error.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
      onClick={(e) => {
        // Close modal if clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={containerRef}
        {...ariaProps}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 id="employee-form-title" className="text-xl font-bold text-slate-800">
              {employee ? 'Edit Employee' : basicMode ? 'Quick Add Employee' : 'Add New Employee'}
            </h2>
            <p id="employee-form-description" className="text-sm text-slate-600 mt-1">
              {basicMode
                ? 'Basic details only - HR can complete the full profile later'
                : 'Fill in the employee details below'
              }
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close employee form modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none ${basicMode ? 'bg-slate-50' : ''}`}
                    placeholder="EMP001"
                    readOnly={basicMode}
                    title={basicMode ? 'Auto-generated - HR can change this later' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="john.doe@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number {basicMode ? '(Optional)' : ''}
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="+27 123 456 789"
                  />
                </div>
              </div>
            </div>

            {/* Work Information Section */}
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Work Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    disabled={loadingDepartments}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {loadingDepartments && (
                    <div className="text-sm text-gray-500 mt-1">Loading departments...</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="HR Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contract Type *
                  </label>
                  <select
                    required
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value as 'permanent' | 'contract' | 'temporary' | 'intern' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                {!basicMode && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    disabled={loadingManagers}
                  >
                    <option value="">No Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName} ({typeof manager.role === 'string' ? manager.role : manager.role?.name})
                      </option>
                    ))}
                  </select>
                  {loadingManagers && (
                    <div className="text-sm text-gray-500 mt-1">Loading managers...</div>
                  )}
                </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Probation End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.probationEndDate}
                    onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Leave empty if no probation period"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Typical probation periods are 3-6 months for new hires
                  </p>
                </div>
              </div>
            </div>

            {/* Communication Preferences Section - Hidden in basic mode */}
            {!basicMode && (
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-600" />
                Communication Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="+27 123 456 789"
                  />
                </div>


              </div>
            </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {employee ? 'Update Employee' : 'Add Employee'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;