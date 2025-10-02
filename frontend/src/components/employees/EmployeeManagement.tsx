// frontend/src/components/employees/EmployeeManagement.tsx
// 🏆 ENHANCED EMPLOYEE MANAGEMENT WITH ORGANOGRAM
// ✅ Visual hierarchy organogram
// ✅ Excel-style table browser  
// ✅ Role-based visibility
// ✅ Interactive employee selection

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { globalDeviceCapabilities, getPerformanceLimits } from '../../utils/deviceDetection';
import { useEmployees } from '../../hooks/employees/useEmployees';
import { useEmployeeFilters } from '../../hooks/employees/useEmployeeFilters';
import { EmployeeStats } from './EmployeeStats';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeImportModal } from './EmployeeImportModal';
import { EmployeeArchiveModal } from './EmployeeArchiveModal';
// EmployeeArchive moved to _legacy - archive list view functionality to be reimplemented if needed
import { EmployeePromotionModal } from './EmployeePromotionModal';
import { BulkAssignManagerModal } from './BulkAssignManagerModal';
import EmployeeOrganogram from './EmployeeOrganogram';
import EmployeeTableBrowser from './EmployeeTableBrowser';
import { MobileEmployeeManagement } from './MobileEmployeeManagement';
import { calculateEmployeePermissions } from '../../types';
import type { Employee } from '../../types';
import {
  Users, Plus, Upload, Grid, List, ChevronDown,
  Workflow, FileSpreadsheet, Eye, Layout, Archive, UserCheck
} from 'lucide-react';
// Import legacy skeleton loaders for 2012-era devices
import { LegacySkeletonDashboard, LegacyLoadingMessage } from '../common/LegacySkeletonLoader';
import { LoadingState } from '../common/LoadingState';

export const EmployeeManagement: React.FC = () => {
  const { user, organization } = useAuth();

  // Check if we should use mobile version
  const isMobile = window.innerWidth < 768; // Mobile breakpoint

  // Use mobile component for small screens
  if (isMobile) {
    return <MobileEmployeeManagement />;
  }

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

  // Device-aware pagination for 2012-era phones
  const performanceLimits = useMemo(() =>
    getPerformanceLimits(globalDeviceCapabilities || { isLegacyDevice: false }),
    []
  );

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = globalDeviceCapabilities?.isLegacyDevice ? performanceLimits.employeeListLimit : 50;

  // Paginated employees for legacy devices
  const paginatedEmployees = useMemo(() => {
    if (!globalDeviceCapabilities?.isLegacyDevice) {
      return filteredEmployees;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, pageSize, globalDeviceCapabilities?.isLegacyDevice]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  // UI State - Enhanced with new views
  const [viewMode, setViewMode] = useState<'organogram' | 'table' | 'cards' | 'archive'>('table'); // Default to table for better data overview
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [promotingEmployee, setPromotingEmployee] = useState<Employee | null>(null);
  const [bulkAssignEmployees, setBulkAssignEmployees] = useState<Employee[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

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
      case 'assign-manager':
        // Open bulk assign manager modal
        setBulkAssignEmployees(employees);
        setShowBulkAssignModal(true);
        break;
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

  const handleBulkAssignManager = useCallback(async (managerId: string) => {
    if (!organizationId) return;

    // Update all selected employees with the new manager
    const updatePromises = bulkAssignEmployees.map(employee =>
      updateEmployee(employee.id, {
        employment: {
          ...employee.employment,
          managerId
        }
      })
    );

    await Promise.all(updatePromises);
    await loadEmployees();
    setShowBulkAssignModal(false);
    setBulkAssignEmployees([]);
  }, [bulkAssignEmployees, organizationId, updateEmployee, loadEmployees]);

  if (loading) {
    // Use simplified loading for legacy devices
    if (globalDeviceCapabilities?.isLegacyDevice) {
      return (
        <div className="w-full p-4">
          <LegacyLoadingMessage message="Loading Employees..." />
          <div className="mt-4">
            <LegacySkeletonDashboard />
          </div>
        </div>
      );
    }

    // Full loading experience for modern devices
    return <LoadingState message="Loading employees..." size="lg" />;
  }

  return (
    <div className="w-full space-y-3">
        
      {/* Mobile-Optimized Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Employee Management
                </h3>
                <p className="text-indigo-100 text-xs font-medium">
                  {globalDeviceCapabilities?.isLegacyDevice
                    ? `${paginatedEmployees.length} of ${filteredEmployees.length} employees`
                    : `${filteredEmployees.length} employees`}
                </p>
              </div>
            </div>

            {/* Mobile-Optimized Action Buttons */}
            <div className="flex gap-1 sm:gap-2">
              {permissions.canCreate && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium border border-white/30 hover:border-white/50 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              )}

              {permissions.canBulkImport && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-all text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Import</span>
                </button>
              )}

              {permissions.canViewArchived && (
                <button
                  onClick={() => setViewMode('archive')}
                  className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-md transition-all text-sm"
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">Archive</span>
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
            departments={[...new Set(employees.map(e => e.profile.department))]}
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
          employees={paginatedEmployees}
          onEmployeeSelect={handleEmployeeSelect}
          onEmployeeEdit={handleEmployeeEdit}
          onEmployeeDelete={handleEmployeeDelete}
          onEmployeePromote={(employee) => setPromotingEmployee(employee)}
          onBulkAction={handleBulkAction}
          selectedEmployee={selectedEmployee}
          loading={loading}
        />
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedEmployees.map((employee) => (
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

      {/* Legacy Device Pagination Controls */}
      {globalDeviceCapabilities?.isLegacyDevice && totalPages > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 legacy-text-size">
              Page {currentPage} of {totalPages} ({filteredEmployees.length} total employees)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md legacy-touch-target legacy-text-size ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                Previous
              </button>
              <div className="flex items-center px-3 py-2 text-sm text-gray-600 legacy-text-size">
                {Math.max(1, currentPage - 1)}-{Math.min(totalPages, currentPage + 1)}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md legacy-touch-target legacy-text-size ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive list view temporarily disabled - EmployeeArchive moved to _legacy */}
      {viewMode === 'archive' && (
        <div className="text-center py-12">
          <p className="text-gray-500">Archive list view is being reimplemented. Use the Archive button on individual employees.</p>
          <button
            onClick={() => setViewMode('table')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Employee List
          </button>
        </div>
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

        {promotingEmployee && organization && (
          <EmployeePromotionModal
            isOpen={true}
            onClose={() => setPromotingEmployee(null)}
            employee={promotingEmployee}
            organizationId={organization.id}
            onSuccess={() => {
              loadEmployees();
              setPromotingEmployee(null);
            }}
          />
        )}

        {showBulkAssignModal && (
          <BulkAssignManagerModal
            isOpen={showBulkAssignModal}
            onClose={() => {
              setShowBulkAssignModal(false);
              setBulkAssignEmployees([]);
            }}
            employees={bulkAssignEmployees}
            onAssign={handleBulkAssignManager}
          />
        )}
    </div>
  );
};