// frontend/src/components/employees/EmployeeManagement.tsx
// 🏆 ENHANCED EMPLOYEE MANAGEMENT WITH ORGANOGRAM
// ✅ Visual hierarchy organogram
// ✅ Excel-style table browser  
// ✅ Role-based visibility
// ✅ Interactive employee selection

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useEmployees } from '../../hooks/employees/useEmployees';
import { useEmployeeFilters } from '../../hooks/employees/useEmployeeFilters';
import { EmployeeStats } from './EmployeeStats';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeImportModal } from './EmployeeImportModal';
import { EmployeeArchiveModal } from './EmployeeArchiveModal';
import { EmployeeArchive } from './EmployeeArchive';
import EmployeeOrganogram from './EmployeeOrganogram';
import EmployeeTableBrowser from './EmployeeTableBrowser';
import { calculateEmployeePermissions } from '../../types';
import type { Employee } from '../../types';
import {
  Users, Plus, Upload, Grid, List, ChevronDown,
  Workflow, FileSpreadsheet, Eye, Layout, Archive
} from 'lucide-react';

export const EmployeeManagement: React.FC = () => {
  const { user, organization } = useAuth();
  
  // Check if user is an HOD manager - if so, only load their team members
  const isHODManager = user?.role?.id === 'hod-manager';
  const organizationId = organization?.id;
  
  const { 
    employees, 
    allEmployees,
    loading, 
    loadingMore,
    error, 
    loadEmployees, 
    loadMoreEmployees,
    archiveEmployee, 
    updateEmployee, 
    pagination 
  } = useEmployees(organizationId, isHODManager ? user?.id : undefined);
  const { filters, setFilters, filteredEmployees } = useEmployeeFilters(employees, user);
  
  // UI State - Enhanced with new views
  const [viewMode, setViewMode] = useState<'organogram' | 'table' | 'cards' | 'archive'>('table'); // Default to table for better data overview
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const permissions = calculateEmployeePermissions(user?.role.id, user?.departmentIds);

  const handleEmployeeSaved = async () => {
    await loadEmployees();
    setShowAddModal(false);
    setEditingEmployee(null);
  };

  const handleEmployeeArchived = async (employee: Employee) => {
    await archiveEmployee(employee);
    setArchivingEmployee(null);
  };

  // Enhanced handlers for new components
  const handleEmployeeSelect = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
  }, []);

  const handleEmployeeEdit = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
  }, []);

  const handleEmployeeDelete = useCallback((employee: Employee) => {
    setArchivingEmployee(employee);
  }, []);

  const handleBulkAction = useCallback((action: string, employees: Employee[]) => {
    switch (action) {
      case 'export':
        // Export selected employees
        console.log('Exporting employees:', employees);
        break;
      case 'email':
        // Send bulk email
        console.log('Sending email to employees:', employees);
        break;
      default:
        console.log('Bulk action:', action, employees);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Employees</h3>
          <p className="text-slate-600">Fetching your team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
        
      {/* Compact Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Employee Management
                </h3>
                <p className="text-indigo-100 text-xs font-medium">
                  {filteredEmployees.length} employees
                </p>
              </div>
            </div>
            
            {/* Compact Action Buttons */}
            <div className="flex gap-2">
              {permissions.canCreate && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium border border-white/30 hover:border-white/50 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              )}
              
              {permissions.canBulkImport && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-all text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </button>
              )}

              {permissions.canViewArchived && (
                <button
                  onClick={() => setViewMode('archive')}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-md transition-all text-sm"
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Error State */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">⚠️</span>
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats - Enhanced Design */}
      <EmployeeStats employees={filteredEmployees} />
        
      {/* Compact View Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {user?.role?.id === 'hr-manager' 
            ? 'Full organizational view'
            : user?.role?.id === 'hod-manager'
            ? 'Your team structure'
            : 'Team directory'}
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('organogram')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all text-xs ${
            viewMode === 'organogram'
              ? 'bg-white shadow-md text-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Workflow className="w-3 h-3" />
          <span>Hierarchy</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all text-xs ${
            viewMode === 'table'
              ? 'bg-white shadow-md text-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3 h-3" />
          <span>Table</span>
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all text-xs ${
            viewMode === 'cards'
              ? 'bg-white shadow-md text-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layout className="w-3 h-3" />
          <span>Cards</span>
        </button>
      </div>
      </div>
            
      {/* Show filters only in cards view for simplicity */}
      {viewMode === 'cards' && (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-white/50 p-3">
          <EmployeeFilters 
            filters={filters}
            setFilters={setFilters}
            departments={[...new Set(employees.map(e => e.employment.department))]}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>
      )}

      {/* Main Content Views */}
      {viewMode === 'organogram' && (
        <EmployeeOrganogram
          employees={filteredEmployees}
          onEmployeeClick={handleEmployeeSelect}
          selectedEmployee={selectedEmployee}
        />
      )}

      {viewMode === 'table' && (
        <EmployeeTableBrowser
          employees={filteredEmployees}
          onEmployeeSelect={handleEmployeeSelect}
          onEmployeeEdit={handleEmployeeEdit}
          onEmployeeDelete={handleEmployeeDelete}
          onBulkAction={handleBulkAction}
          selectedEmployee={selectedEmployee}
          loading={loading}
        />
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              permissions={permissions}
              onEdit={setEditingEmployee}
              onArchive={setArchivingEmployee}
            />
          ))}
        </div>
      )}

      {viewMode === 'archive' && (
        <EmployeeArchive
          onBack={() => setViewMode('table')}
          onEmployeeRestored={() => loadEmployees(true)}
        />
      )}

      {/* Compact Load More Button */}
      {viewMode === 'cards' && pagination.canLoadMore && !loading && (
        <div className="text-center py-4">
          <button
            onClick={loadMoreEmployees}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-medium shadow-md transition-all text-sm"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Load More ({employees.length})</span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Page {pagination.currentPage} • {pagination.pageSize} per page
          </p>
        </div>
      )}

      {/* Compact Selected Employee Panel */}
      {selectedEmployee && (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Selected Employee
              </h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedEmployee.profile.firstName} {selectedEmployee.profile.lastName}</p>
                  <p><span className="font-medium">ID:</span> {selectedEmployee.profile.employeeNumber}</p>
                  <p><span className="font-medium">Email:</span> {selectedEmployee.profile.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedEmployee.profile.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Employment Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Department:</span> {selectedEmployee.employment.department}</p>
                  <p><span className="font-medium">Position:</span> {selectedEmployee.employment.position}</p>
                  <p><span className="font-medium">Start Date:</span> {(() => {
                    const startDate = selectedEmployee.employment?.startDate || selectedEmployee.profile?.startDate;
                    if (!startDate) return 'Not set';
                    
                    try {
                      if (startDate && typeof startDate.toDate === 'function') {
                        return startDate.toDate().toLocaleDateString();
                      }
                      if (startDate instanceof Date) {
                        return startDate.toLocaleDateString();
                      }
                      const parsed = new Date(startDate);
                      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : 'Invalid date';
                    } catch (error) {
                      return 'Invalid date';
                    }
                  })()}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      selectedEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {permissions.canEdit && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleEmployeeEdit(selectedEmployee)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Employee
                </button>
                <button
                  onClick={() => handleEmployeeDelete(selectedEmployee)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Archive Employee
                </button>
              </div>
            )}
          </div>
        )}

      {/* Compact Empty State */}
      {!loading && filteredEmployees.length === 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 text-center shadow-lg border border-white/50">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {employees.length === 0 ? 'No employees yet' : 'No matching employees'}
          </h3>
          <p className="text-slate-600 mb-4 text-sm">
            {employees.length === 0 
              ? "Add your first employee or import from CSV"
              : "Try adjusting your search criteria"
            }
          </p>
          {permissions.canCreate && employees.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Employee
            </button>
          )}
        </div>
      )}

        {/* Modals - Mobile-Optimized */}
        {(showAddModal || editingEmployee) && (
          <EmployeeFormModal
            employee={editingEmployee}
            onClose={() => {
              setShowAddModal(false);
              setEditingEmployee(null);
            }}
            onSave={handleEmployeeSaved}
          />
        )}

        {showImportModal && (
          <EmployeeImportModal
            onClose={() => setShowImportModal(false)}
            onImportComplete={loadEmployees}
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