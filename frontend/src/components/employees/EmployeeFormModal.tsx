// frontend/src/components/employees/EmployeeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { DataService } from '../../services/DataService';
import { createEmployeeFromForm, createFormFromEmployee } from '../../types';
import type { Employee, User } from '../../types';
import type { EmployeeFormData, DeliveryMethod } from '../../types';

interface EmployeeFormModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSave: () => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ 
  employee, 
  onClose, 
  onSave 
}) => {
  const { organization } = useAuth();
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
    managerId: '', // Manager field
    isActive: true
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeeNumberValidation, setEmployeeNumberValidation] = useState<{
    isValid: boolean;
    isAvailable: boolean;
    message?: string;
    suggestions?: string[];
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Auto-generate employee number for new employees
  const handleAutoGenerateEmployeeNumber = async () => {
    if (!organization) return;
    
    try {
      const nextNumber = await DataService.generateNextEmployeeNumber(organization.id);
      setFormData(prev => ({ ...prev, employeeNumber: nextNumber }));
      
      // Validate the generated number
      const validation = await DataService.validateEmployeeNumber(
        organization.id, 
        nextNumber,
        employee?.id
      );
      setEmployeeNumberValidation(validation);
    } catch (error) {
      console.error('Failed to generate employee number:', error);
    }
  };

  // Validate employee number on change
  const handleEmployeeNumberChange = async (value: string) => {
    setFormData(prev => ({ ...prev, employeeNumber: value }));
    
    if (!organization || !value.trim()) {
      setEmployeeNumberValidation(null);
      return;
    }
    
    setIsValidating(true);
    try {
      const validation = await DataService.validateEmployeeNumber(
        organization.id, 
        value,
        employee?.id
      );
      setEmployeeNumberValidation(validation);
      setShowSuggestions(!validation.isAvailable && !!validation.suggestions);
    } catch (error) {
      console.error('Failed to validate employee number:', error);
      setEmployeeNumberValidation({
        isValid: false,
        isAvailable: false,
        message: 'Validation error'
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Load existing employee data when editing
  useEffect(() => {
    if (employee) {
      setFormData(createFormFromEmployee(employee));
    }
  }, [employee]);

 // Load managers for the dropdown - DEBUG VERSION
  useEffect(() => {
    const loadManagers = async () => {
      console.log('[DEBUG] EmployeeFormModal mounted, organization:', organization);
      
      if (!organization) {
        console.log('[DEBUG] No organization, skipping manager load');
        return;
      }
      
      try {
        setLoadingManagers(true);
        console.log('[DEBUG] Loading managers for org:', organization.id);
        
        // Get users who can be managers
        const users = await DataService.getUsersByOrganization(organization.id);
        console.log('[DEBUG] All users loaded:', users.length, 'users');
        console.log('[DEBUG] Users:', users);
        
        // Show each user's role structure
        users.forEach(user => {
          console.log(`[DEBUG] User: ${user.firstName} ${user.lastName}`, {
            role: user.role,
            roleType: typeof user.role,
            email: user.email
          });
        });
        
        // Filter managers with improved role checking
        const managerUsers = users.filter(user => {
          // Handle both string and object role formats
          const roleId = typeof user.role === 'string' ? user.role : user.role?.id;
          const isManager = ['business-owner', 'hr-manager', 'hod-manager'].includes(roleId);
          
          console.log(`[DEBUG] ${user.firstName} ${user.lastName}: roleId="${roleId}" isManager=${isManager}`);
          return isManager;
        });
        
        console.log('[DEBUG] Manager users found:', managerUsers.length);
        console.log('[DEBUG] Managers:', managerUsers);
        setManagers(managerUsers);
        
      } catch (error) {
        console.error('[DEBUG] Failed to load managers:', error);
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers(); // Run immediately when component mounts
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!formData.employeeNumber || !formData.firstName || !formData.lastName || !formData.email) {
        throw new Error('Please fill in all required fields');
      }

      // Validate employee number
      if (employeeNumberValidation && !employeeNumberValidation.isAvailable) {
        throw new Error(employeeNumberValidation.message || 'Employee number is not available');
      }

      const employeeData = createEmployeeFromForm(formData, organization.id);
      
      if (employee) {
        employeeData.id = employee.id;
        employeeData.createdAt = employee.createdAt;
      }

      await DataService.saveEmployee(employeeData, organization.id);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.employeeNumber}
                  onChange={(e) => handleEmployeeNumberChange(e.target.value)}
                  className={`flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    employeeNumberValidation?.isAvailable === false
                      ? 'border-red-300 focus:border-red-500'
                      : employeeNumberValidation?.isAvailable === true
                      ? 'border-green-300 focus:border-green-500'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="EMP001"
                />
                {!employee && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateEmployeeNumber}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                    title="Auto-generate next employee number"
                  >
                    Auto
                  </button>
                )}
                {isValidating && (
                  <div className="flex items-center px-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Validation feedback */}
              {employeeNumberValidation && (
                <div className={`mt-1 text-sm ${
                  employeeNumberValidation.isAvailable 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {employeeNumberValidation.message}
                </div>
              )}
              
              {/* Suggestions */}
              {showSuggestions && employeeNumberValidation?.suggestions && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-1">Suggestions:</p>
                  <div className="flex gap-1 flex-wrap">
                    {employeeNumberValidation.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmployeeNumberChange(suggestion)}
                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+27123456789"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="+27123456789"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            
           {/* 🔧 FIXED MANAGER FIELD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Manager
              </label>
              <select
                value={formData.managerId || ''}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={loadingManagers}
              >
                <option value="">Select Manager (Optional)</option>
                {managers.map((manager) => {
                  // Fix: Extract the role name properly
                  const roleName = typeof manager.role === 'string' 
                    ? manager.role 
                    : manager.role?.name || manager.role?.id || 'Manager';
                  
                  return (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} ({roleName})
                    </option>
                  );
                })}
              </select>
              {loadingManagers && (
                <p className="text-sm text-gray-500 mt-1">Loading managers...</p>
              )}
              {!loadingManagers && managers.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No managers found. Make sure users have manager roles assigned.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type
              </label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
            
            {employee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.isActive ? 'active' : 'archived'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Delivery Preference Section */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">🏆 Delivery Preference</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['email', 'whatsapp', 'printed'] as DeliveryMethod[]).map((method) => (
                <label 
                  key={method}
                  className={`
                    flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${formData.preferredDeliveryMethod === method 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={method}
                    checked={formData.preferredDeliveryMethod === method}
                    onChange={(e) => setFormData({ ...formData, preferredDeliveryMethod: e.target.value as DeliveryMethod })}
                    className="mr-3"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {method === 'email' ? '📧' : method === 'whatsapp' ? '📱' : '🖨️'}
                      </span>
                      <span className="font-medium capitalize">{method}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {method === 'email' ? 'Digital delivery' : 
                       method === 'whatsapp' ? 'Mobile delivery' : 'Physical copy'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : (employee ? 'Update Employee' : 'Add Employee')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
