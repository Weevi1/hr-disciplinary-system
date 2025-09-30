// frontend/src/components/employees/MobileEmployeeManagement.tsx
// 📱 MOBILE-OPTIMIZED EMPLOYEE MANAGEMENT
// ✅ Compact design for Samsung S8 era devices
// ✅ Touch-friendly interface with larger targets
// ✅ Simplified navigation and filtering

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { globalDeviceCapabilities, getPerformanceLimits } from '../../utils/deviceDetection';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { useEmployeeFilters } from '../../hooks/employees/useEmployeeFilters';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeImportModal } from './EmployeeImportModal';
import { EmployeeArchiveModal } from './EmployeeArchiveModal';
import { calculateEmployeePermissions } from '../../types';
import type { Employee } from '../../types';
import {
  Users, Plus, Upload, Search, Filter, List, Grid, Archive, ChevronDown
} from 'lucide-react';

export const MobileEmployeeManagement: React.FC = () => {
  const { user, organization } = useAuth();

  // Use the same dashboard data source as the main dashboard
  const {
    employees: dashboardEmployees,
    loading,
    error,
    refreshData
  } = useDashboardData({ role: 'hod' });

  // Transform dashboard employee data to match expected structure
  const employees = React.useMemo(() => {
    if (!dashboardEmployees || dashboardEmployees.length === 0) {
      return [];
    }

    return dashboardEmployees.map(emp => ({
      id: emp.id,
      organizationId: organization?.id || '',
      isActive: true, // Dashboard employees are always active (since they're loaded)
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        department: emp.department,
        employeeNumber: emp.employeeNumber || emp.id,
        phoneNumber: emp.phone,
        position: emp.position,
        startDate: new Date() // Default start date
      },
      employment: {
        startDate: new Date(), // Default start date
        department: emp.department,
        position: emp.position,
        contractType: emp.contractType || 'full-time'
      },
      disciplinaryRecord: {
        totalWarnings: emp.recentWarnings?.count || 0,
        activeWarnings: emp.recentWarnings?.count || 0,
        currentLevel: 'none',
        warningHistory: [],
        warningsByCategory: {}
      },
      deliveryPreferences: {
        primaryMethod: 'email',
        allowAlternativeMethods: true,
        whatsappConsent: false,
        emailConsent: true,
        printConsent: false,
        lastUpdated: new Date()
      },
      // Keep original data for reference
      _original: emp
    }));
  }, [dashboardEmployees, organization?.id]);

  const { filters, setFilters, filteredEmployees } = useEmployeeFilters(employees, user);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 [MobileEmployeeManagement] Data status:', {
      organizationId: organization?.id,
      userId: user?.id,
      loading: loading?.overall || loading?.employees || false,
      error,
      employeesCount: employees.length,
      filteredCount: filteredEmployees.length,
      filters,
      rawDashboardEmployees: dashboardEmployees,
      transformedEmployees: employees.map(e => ({
        id: e.id,
        name: `${e.profile?.firstName || 'Unknown'} ${e.profile?.lastName || 'Unknown'}`,
        isActive: e.isActive,
        hasProfile: !!e.profile,
        profileDepartment: e.profile?.department,
        rawEmployee: e
      })),
      filteredEmployees: filteredEmployees.map(e => ({
        id: e.id,
        name: `${e.profile?.firstName || 'Unknown'} ${e.profile?.lastName || 'Unknown'}`,
        isActive: e.isActive,
        hasProfile: !!e.profile
      })),
      userRole: user?.role?.id,
      userDepartments: user?.departmentIds
    });
  }, [organization?.id, user?.id, loading, error, employees, filteredEmployees, filters, dashboardEmployees, user]);

  // Mobile-specific states
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const permissions = calculateEmployeePermissions(user?.role.id, user?.departmentIds);

  // Mobile-optimized stats
  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    const active = filteredEmployees.filter(e => e.isActive).length;
    const warnings = filteredEmployees.filter(e => e.disciplinaryRecord?.activeWarnings > 0).length;

    return { total, active, warnings };
  }, [filteredEmployees]);

  const handleEmployeeSaved = async () => {
    refreshData();
    setShowAddModal(false);
    setEditingEmployee(null);
  };

  const handleEmployeeArchived = async (employee: Employee) => {
    // TODO: Implement archive functionality
    setArchivingEmployee(null);
    refreshData();
  };

  const isLoading = loading?.overall || loading?.employees || false;

  // Debug for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Employee Management:', {
      employeesCount: employees.length,
      filteredCount: filteredEmployees.length,
      userRole: user?.role?.id,
      canEdit: permissions.canEdit,
      canCreate: permissions.canCreate
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 p-4">

      {/* Mobile Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white" />
              <div>
                <h3 className="text-base font-bold text-white">Employee Directory</h3>
                <p className="text-blue-100 text-xs">{stats.total} of {employees.length} employees</p>
              </div>
            </div>
            <div className="flex gap-1">
              {permissions.canCreate && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Stats Bar */}
        <div className="flex items-center justify-around p-3 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.warnings}</div>
            <div className="text-xs text-gray-600">Warnings</div>
          </div>
        </div>

        {/* Mobile Search & Controls */}
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg border ${
                showFilters ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                <select
                  value={filters.isActive ? 'active' : 'all'}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Employees</option>
                  <option value="active">Active Only</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No employees found</h3>
            <p className="text-gray-600 text-sm mb-4">
              {employees.length === 0
                ? "Add your first employee to get started"
                : "Try adjusting your search criteria"
              }
            </p>
            {permissions.canCreate && employees.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add First Employee
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className={`p-3 transition-colors ${permissions.canEdit ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                onClick={() => permissions.canEdit ? setEditingEmployee(employee) : null}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {employee.profile.firstName?.charAt(0)}{employee.profile.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.profile.firstName} {employee.profile.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {employee.employment.position}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                      employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className={`bg-white border border-gray-200 rounded-lg p-3 transition-shadow ${permissions.canEdit ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
                onClick={() => permissions.canEdit ? setEditingEmployee(employee) : null}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {employee.profile.firstName} {employee.profile.lastName}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <div>{employee.employment.position}</div>
                  <div>{employee.profile.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Export Button */}
      {filteredEmployees.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-3">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
            <ChevronDown className="w-4 h-4" />
            Export ({filteredEmployees.length} employees)
          </button>
        </div>
      )}

      {/* Modals */}
      {(showAddModal || editingEmployee) && (
        <EmployeeFormModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
          onSave={handleEmployeeSaved}
          basicMode={!editingEmployee && !permissions.canEdit} // Basic mode for new employees when user can't edit
        />
      )}

      {showImportModal && (
        <EmployeeImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={refreshData}
        />
      )}

      {archivingEmployee && (
        <EmployeeArchiveModal
          employee={archivingEmployee}
          onClose={() => setArchivingEmployee(null)}
          onArchive={handleEmployeeArchived}
        />
      )}
    </div>
  );
};