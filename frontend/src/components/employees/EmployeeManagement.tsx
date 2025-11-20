// frontend/src/components/employees/EmployeeManagement.tsx
// 🏆 ENHANCED EMPLOYEE MANAGEMENT WITH ORGANOGRAM
// ✅ Visual hierarchy organogram
// ✅ Excel-style table browser  
// ✅ Role-based visibility
// ✅ Interactive employee selection

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useModal } from '../../hooks/useModal';
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
// EmployeePromotionModal removed - promotion now handled in dedicated Managers tab
import { BulkAssignManagerModal } from './BulkAssignManagerModal';
import { BulkAssignDepartmentModal } from './BulkAssignDepartmentModal';
import EmployeeOrganogram from './EmployeeOrganogram';
import EmployeeTableBrowser from './EmployeeTableBrowser';
import { calculateEmployeePermissions } from '../../types';
import type { Employee } from '../../types';
import {
  Users, Plus, Upload, Grid, List, ChevronDown,
  Workflow, FileSpreadsheet, Eye, Layout, Archive, UserCheck, Filter, X, Search
} from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
import { getManagerIds } from '../../types/employee';
// Import legacy skeleton loaders for 2012-era devices
import { LegacySkeletonDashboard, LegacyLoadingMessage } from '../common/LegacySkeletonLoader';
import { LoadingState } from '../common/LoadingState';
import Logger from '../../utils/logger';

interface EmployeeManagementProps {
  onDataChange?: () => void; // Callback to notify parent when employee data changes
  hideFloatingButton?: boolean; // Hide the floating action button (when parent provides its own)
  onAddEmployeeClick?: () => void; // Expose the add employee action to parent
  inline?: boolean; // Render without header when embedded in tabs (for dashboard inline rendering)
  readOnly?: boolean; // Read-only mode - hides all action buttons (for executive management view)
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onDataChange, hideFloatingButton = false, onAddEmployeeClick, inline = false, readOnly = false }) => {
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

  // Detect mobile on mount and set appropriate default view
  const isMobile = useMemo(() => window.innerWidth < 768, []);

  // UI State - Enhanced with new views
  const [viewMode, setViewMode] = useState<'organogram' | 'table' | 'cards' | 'archive'>(
    isMobile ? 'cards' : 'table' // Mobile defaults to cards, desktop to table
  );

  // 🚀 REFACTORED: Migrated to useModal hook
  const addModal = useModal();
  const importModal = useModal();
  const bulkAssignModal = useModal<Employee[]>();
  const bulkAssignDeptModal = useModal<Employee[]>();

  // Expose add employee action to parent if callback provided
  useEffect(() => {
    if (onAddEmployeeClick) {
      // Store the callback in a way that parent can trigger it
      (window as any).__openAddEmployeeModal = () => addModal.open();
    }
    return () => {
      delete (window as any).__openAddEmployeeModal;
    };
  }, [onAddEmployeeClick, addModal]);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  // promotingEmployee state removed - promotion now handled in dedicated Managers tab
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const permissions = calculateEmployeePermissions(user?.role.id, user?.departmentIds);

  const handleEmployeeSaved = async () => {
    await loadEmployees();
    addModal.close(); // 🚀 REFACTORED: Using useModal hook
    setEditingEmployee(null);

    // Notify parent dashboard to refresh metrics
    onDataChange?.();
  };

  const handleEmployeeArchived = async (employee: Employee) => {
    await archiveEmployee(employee);
    setArchivingEmployee(null);

    // Notify parent dashboard to refresh metrics
    onDataChange?.();
  };

  const handleImportComplete = async () => {
    await loadEmployees();

    // Notify parent dashboard to refresh metrics
    onDataChange?.();
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
        // 🚀 REFACTORED: Using useModal hook with data
        bulkAssignModal.open(employees);
        break;
      case 'assign-department':
        // 🚀 REFACTORED: Using useModal hook with data
        bulkAssignDeptModal.open(employees);
        break;
      case 'export':
        // Export selected employees
        Logger.debug('Exporting employees:', employees);
        break;
      case 'email':
        // Send bulk email
        Logger.debug('Sending email to employees:', employees);
        break;
      default:
        Logger.debug('Bulk action:', action, employees);
    }
  }, [bulkAssignModal, bulkAssignDeptModal]);

  const handleBulkAssignManager = useCallback(async (managerId: string, mode: 'add' | 'replace') => {
    if (!organizationId || !bulkAssignModal.data) return;

    // 🔧 UPDATED: Multi-manager support with ADD/REPLACE modes
    const updatePromises = bulkAssignModal.data.map(employee => {
      // Get current manager IDs (handles backward compatibility)
      const currentManagerIds = employee.employment?.managerIds ||
                               (employee.employment?.managerId ? [employee.employment.managerId] : []);

      // Calculate new manager IDs based on mode
      const newManagerIds = mode === 'add'
        ? [...new Set([...currentManagerIds, managerId])] // Add + deduplicate
        : [managerId]; // Replace all

      return updateEmployee({
        ...employee,
        employment: {
          ...employee.employment,
          managerIds: newManagerIds
        }
      });
    });

    await Promise.all(updatePromises);
    await loadEmployees();
    bulkAssignModal.close(); // 🚀 REFACTORED: Using useModal hook
  }, [bulkAssignModal.data, organizationId, updateEmployee, loadEmployees, bulkAssignModal]);

  const handleBulkAssignDepartment = useCallback(async (departmentName: string) => {
    if (!organizationId || !bulkAssignDeptModal.data) return;

    // Update all selected employees with the new department
    const updatePromises = bulkAssignDeptModal.data.map(employee =>
      updateEmployee({
        ...employee,
        profile: {
          ...employee.profile,
          department: departmentName
        }
      })
    );

    await Promise.all(updatePromises);
    await loadEmployees();
    bulkAssignDeptModal.close(); // 🚀 REFACTORED: Using useModal hook
  }, [bulkAssignDeptModal.data, organizationId, updateEmployee, loadEmployees, bulkAssignDeptModal]);

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
    <div className={`w-full ${inline ? 'space-y-3' : 'space-y-2 md:space-y-4'} relative`}>

      {/* Mobile: Compact Count Badge - Hidden when inline */}
      {!inline && (
        <div className="md:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              <Users className="w-4 h-4" />
              {filteredEmployees.length}
            </span>
            {filters.search && (
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear search
              </button>
            )}
          </div>
          {permissions.canBulkImport && (
            <button
              onClick={() => importModal.open()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          )}
        </div>
      )}

      {/* Desktop Header Only - Hidden when inline */}
      {!inline && (
        <div className="hidden md:block md:bg-white/95 md:backdrop-blur-sm md:rounded-xl md:shadow-lg md:border md:border-white/50 overflow-hidden">

          {/* Desktop: Full Header with Gradient */}
          <div className="hidden md:block bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 p-3">
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
                    {globalDeviceCapabilities?.isLegacyDevice
                      ? `${paginatedEmployees.length} of ${filteredEmployees.length} employees`
                      : `${filteredEmployees.length} employees`}
                  </p>
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="flex gap-2">
                {permissions.canCreate && (
                  <button
                    onClick={() => addModal.open()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium border border-white/30 hover:border-white/50 transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}

                {permissions.canBulkImport && (
                  <button
                    onClick={() => importModal.open()}
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
                    <span className="hidden sm:inline">Archive</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Error State */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">⚠️</span>
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats - Desktop Only - Hidden when inline */}
      {!inline && (
        <div className="hidden md:block">
          <EmployeeStats employees={filteredEmployees} />
        </div>
      )}

      {/* Inline Mode: Compact Header Card (matches Organization tab style) */}
      {inline && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="pl-3 pr-8 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {user?.role?.id !== 'hod-manager' && (
                    <option value="organogram">Hierarchy</option>
                  )}
                  <option value="table">Table</option>
                  <option value="cards">Cards</option>
                </select>
                <span className="text-xs text-gray-600">{filteredEmployees.length} employees</span>
              </div>

              <div className="flex items-center gap-2">
                {permissions.canCreate && (
                  <button
                    onClick={() => addModal.open()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Employee
                  </button>
                )}
                {permissions.canBulkImport && (
                  <button
                    onClick={() => importModal.open()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import
                  </button>
                )}
              </div>
            </div>

            {/* Search & Filter Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded text-xs font-medium transition-all ${
                  showMobileFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* Collapsible Filters */}
            {showMobileFilters && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Departments</option>
                    {[...new Set(employees.map(e => e.profile?.department).filter(Boolean))].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <select
                    value={filters.contractType}
                    onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Contract Types</option>
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>

                  <div className="flex gap-1.5">
                    <label className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded border border-gray-200 text-xs cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={filters.hasWarnings}
                        onChange={(e) => setFilters({ ...filters, hasWarnings: e.target.checked })}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-gray-700">Warnings</span>
                    </label>
                    <label className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded border border-gray-200 text-xs cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={filters.isActive}
                        onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* View Controls - Desktop Only - Hidden when inline */}
      {!inline && (
        <div className="hidden md:flex md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            {user?.role?.id === 'hr-manager'
              ? 'Full organizational view'
              : user?.role?.id === 'hod-manager'
              ? 'Your team structure'
              : 'Team directory'}
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
          {/* Hide Hierarchy tab for HOD managers */}
          {user?.role?.id !== 'hod-manager' && (
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
          )}
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
      )}
            
      {/* Desktop: Show filters in cards view - Hidden when inline */}
      {!inline && viewMode === 'cards' && (
        <div className="hidden md:block bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-white/50 p-3">
          <EmployeeFilters
            filters={filters}
            setFilters={setFilters}
            departments={[...new Set(employees.map(e => e.profile.department))]}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>
      )}

      {/* Mobile: Search bar with filter button - Hidden when inline */}
      {!inline && (
        <div className="md:hidden -mt-1 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 Search employees..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all bg-white text-sm"
          />
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`px-3 py-2.5 border rounded-lg font-medium text-sm transition-all ${
              showMobileFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showMobileFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="">All Departments</option>
              {[...new Set(employees.map(e => e.profile?.department).filter(Boolean))].map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filters.contractType}
              onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="">All Contract Types</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </select>

            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={filters.hasWarnings}
                  onChange={(e) => setFilters({ ...filters, hasWarnings: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Has Warnings</span>
              </label>

              <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Active Only</span>
              </label>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Main Content Views */}
      {viewMode === 'organogram' && (
        <EmployeeOrganogram
          employees={filteredEmployees}
          onEmployeeClick={handleEmployeeSelect}
          selectedEmployee={selectedEmployee}
          inline={inline}
        />
      )}

      {viewMode === 'table' && (
        <EmployeeTableBrowser
          employees={paginatedEmployees}
          onEmployeeSelect={handleEmployeeSelect}
          onEmployeeEdit={readOnly ? undefined : handleEmployeeEdit}
          onEmployeeDelete={readOnly ? undefined : handleEmployeeDelete}
          onBulkAction={readOnly ? undefined : handleBulkAction}
          selectedEmployee={selectedEmployee}
          loading={loading}
          compact={inline}
          readOnly={readOnly}
        />
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3 pb-24 md:pb-0 -mt-0.5 md:mt-0">
          {paginatedEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              permissions={permissions}
              onEdit={setEditingEmployee}
              onArchive={setArchivingEmployee}
              onView={handleEmployeeSelect}
              onViewWarnings={(employee) => {
                // Close the employee modal and navigate to warnings with employee filter
                // This will be handled by parent component (HRDashboardSection)
                Logger.debug('View warnings for employee:', employee.id);
                // You can store the employee ID in localStorage or pass it up
                localStorage.setItem('warningFilterEmployeeId', employee.id);
                localStorage.setItem('warningFilterEmployeeName', `${employee.profile.firstName} ${employee.profile.lastName}`);
                // Close the modal by triggering parent
                window.dispatchEvent(new CustomEvent('navigateToWarnings', { detail: { employeeId: employee.id } }));
              }}
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

      {/* Compact Empty State - Hidden when inline (table handles empty state) */}
      {!inline && !loading && filteredEmployees.length === 0 && (
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
              onClick={() => addModal.open()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Employee
            </button>
          )}
        </div>
      )}

        {/* Modals - Mobile-Optimized */}
        {/* 🚀 REFACTORED: Using useModal hook */}
        {(addModal.isOpen || editingEmployee) && (
          <EmployeeFormModal
            employee={editingEmployee}
            onClose={() => {
              addModal.close();
              setEditingEmployee(null);
            }}
            onSave={handleEmployeeSaved}
            basicMode={isHODManager}
          />
        )}

        {importModal.isOpen && (
          <EmployeeImportModal
            onClose={importModal.close}
            onImportComplete={handleImportComplete}
          />
        )}

        {archivingEmployee && (
          <EmployeeArchiveModal
            employee={archivingEmployee}
            onClose={() => setArchivingEmployee(null)}
            onArchive={handleEmployeeArchived}
          />
        )}

        {/* EmployeePromotionModal removed - promotion now handled in dedicated Managers tab */}

        {/* 🚀 REFACTORED: Using useModal hook with data */}
        {bulkAssignModal.isOpen && bulkAssignModal.data && (
          <BulkAssignManagerModal
            isOpen={bulkAssignModal.isOpen}
            onClose={bulkAssignModal.close}
            employees={bulkAssignModal.data}
            onAssign={handleBulkAssignManager}
          />
        )}

        {bulkAssignDeptModal.isOpen && bulkAssignDeptModal.data && (
          <BulkAssignDepartmentModal
            isOpen={bulkAssignDeptModal.isOpen}
            onClose={bulkAssignDeptModal.close}
            employees={bulkAssignDeptModal.data}
            onAssign={handleBulkAssignDepartment}
          />
        )}

        {/* Employee View Modal - For viewing employee details without editing */}
        {selectedEmployee && viewMode === 'cards' && (
          <UnifiedModal
            isOpen={true}
            onClose={() => setSelectedEmployee(null)}
            title="Employee Details"
            maxWidth="2xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Personal Information</h5>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedEmployee.profile.firstName} {selectedEmployee.profile.lastName}</p>
                    <p><span className="font-medium">ID:</span> {selectedEmployee.profile.employeeNumber}</p>
                    {/* Only show contact details to HR and Executive Management roles */}
                    {(user?.role?.id === 'hr-manager' || user?.role?.id === 'executive-management') && (
                      <>
                        <p><span className="font-medium">Email:</span> {selectedEmployee.profile.email}</p>
                        <p><span className="font-medium">Phone:</span> {selectedEmployee.profile.phoneNumber || 'Not provided'}</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Employment Details</h5>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Department:</span> {selectedEmployee.profile.department}</p>
                    <p><span className="font-medium">Position:</span> {selectedEmployee.employment.position}</p>
                    <p><span className="font-medium">Start Date:</span> {selectedEmployee.employment?.startDate ? new Date(selectedEmployee.employment.startDate).toLocaleDateString() : 'Not set'}</p>
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

              {/* Action buttons - only for users with edit permission */}
              {permissions.canEdit && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setEditingEmployee(selectedEmployee);
                      setSelectedEmployee(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Edit Employee
                  </button>
                  {selectedEmployee.isActive && permissions.canArchive && (
                    <button
                      onClick={() => {
                        setArchivingEmployee(selectedEmployee);
                        setSelectedEmployee(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Archive Employee
                    </button>
                  )}
                </div>
              )}
            </div>
          </UnifiedModal>
        )}

        {/* Floating Action Button - Mobile Only */}
        {!hideFloatingButton && permissions.canCreate && (
          <div className="md:hidden fixed bottom-6 right-6 w-14 h-14 z-50">
            {/* 🚀 REFACTORED: Using useModal hook */}
            <button
              onClick={addModal.open}
              className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
              aria-label="Add Employee"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
    </div>
  );
};