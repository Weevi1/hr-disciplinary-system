// frontend/src/components/employees/EmployeeArchive.tsx
// 🗄️ EMPLOYEE ARCHIVE - Separate view for archived employees
// ✅ Performance optimized - loads only when accessed
// ✅ Full warning history visibility for archived employees
// ✅ Lifecycle management and restoration capabilities

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Archive, Users, Calendar, AlertTriangle, RotateCcw, Trash2, Search, Eye, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { API } from '../../api';
import { EmployeeLifecycleService } from '../../services/EmployeeLifecycleService';
import { ShardedDataService } from '../../services/ShardedDataService';
import { calculateEmployeePermissions } from '../../types';
import type { Employee } from '../../types';
import Logger from '../../utils/logger';

interface EmployeeArchiveProps {
  onBack: () => void;
  onEmployeeRestored?: () => void; // Callback to refresh main employee list
}

export const EmployeeArchive: React.FC<EmployeeArchiveProps> = ({ onBack, onEmployeeRestored }) => {
  const { user, organization } = useAuth();
  const [archivedEmployees, setArchivedEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeWarnings, setEmployeeWarnings] = useState<any[]>([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [lifecycleStats, setLifecycleStats] = useState<any>(null);
  const [restoringEmployee, setRestoringEmployee] = useState<string | null>(null);

  const permissions = calculateEmployeePermissions(user?.role.id, user?.departmentIds);

  // Load archived employees on mount
  useEffect(() => {
    loadArchivedEmployees();
    loadLifecycleStats();
  }, [organization?.id]);

  const loadArchivedEmployees = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);

      // Clear cache to force fresh data load
      ShardedDataService.clearCache();

      // Force fresh data load by waiting a moment for cache invalidation to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Debug: Load active and archived separately to see exact counts
      const [activeEmployees, archivedEmployees] = await Promise.all([
        API.employees.getAll(organization.id),
        API.employees.getArchived(organization.id)
      ]);


      setArchivedEmployees(archivedEmployees);
      Logger.success(`📋 Loaded ${archivedEmployees.length} archived employees`);
    } catch (error) {
      Logger.error('Failed to load archived employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLifecycleStats = async () => {
    if (!organization?.id) return;

    try {
      const stats = await API.employees.getLifecycleStats(organization.id);
      setLifecycleStats(stats);
    } catch (error) {
      Logger.error('Failed to load lifecycle stats:', error);
    }
  };

  const loadEmployeeWarnings = async (employee: Employee) => {
    if (!organization?.id) return;

    try {
      setLoadingWarnings(true);
      setSelectedEmployee(employee);
      const warnings = await API.employees.getAllWarningsForEmployee(employee.id, organization.id);
      setEmployeeWarnings(warnings);
      Logger.debug(`📋 Loaded ${warnings.length} warnings for archived employee ${employee.profile.firstName} ${employee.profile.lastName}`);
    } catch (error) {
      Logger.error('Failed to load employee warnings:', error);
      setEmployeeWarnings([]);
    } finally {
      setLoadingWarnings(false);
    }
  };

  const handleRestoreEmployee = async (employee: Employee) => {
    if (!organization?.id || !user?.id) return;

    try {
      setRestoringEmployee(employee.id);
      await API.employees.restore(employee.id, organization.id, user.id);
      Logger.success(`✅ Restored employee: ${employee.profile.firstName} ${employee.profile.lastName}`);

      // Reload archived employees
      await loadArchivedEmployees();
      await loadLifecycleStats();

      // Refresh main employee list
      if (onEmployeeRestored) {
        onEmployeeRestored();
      }

      // Close employee details if restoring the selected employee
      if (selectedEmployee?.id === employee.id) {
        setSelectedEmployee(null);
        setEmployeeWarnings([]);
      }
    } catch (error) {
      Logger.error('Failed to restore employee:', error);
    } finally {
      setRestoringEmployee(null);
    }
  };

  // Filter archived employees based on search
  const filteredEmployees = archivedEmployees.filter(employee => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.profile.firstName.toLowerCase().includes(searchLower) ||
      employee.profile.lastName.toLowerCase().includes(searchLower) ||
      employee.profile.employeeNumber.toLowerCase().includes(searchLower) ||
      employee.profile.department.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getTimeInArchive = (archivedAt: any) => {
    if (!archivedAt) return 'Unknown';
    try {
      const archivedDate = archivedAt.toDate ? archivedAt.toDate() : new Date(archivedAt);
      const now = new Date();
      const diffTime = now.getTime() - archivedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) return `${diffDays} days`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
      return `${Math.floor(diffDays / 365)} years`;
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Archive</h3>
          <p className="text-slate-600">Fetching archived employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Employee Archive
                </h3>
                <p className="text-orange-100 text-sm font-medium">
                  {filteredEmployees.length} archived employees
                </p>
              </div>
            </div>

            {/* Lifecycle Stats */}
            {lifecycleStats && (
              <div className="flex gap-4 text-white">
                <div className="text-center">
                  <div className="text-lg font-bold">{lifecycleStats.archived}</div>
                  <div className="text-xs text-orange-100">Archived</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{lifecycleStats.deletionEligible}</div>
                  <div className="text-xs text-orange-100">5+ Years</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search archived employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-4 border-b">
            <h4 className="text-lg font-semibold text-gray-900">Archived Employees</h4>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No archived employees</p>
                <p className="text-sm">All employees are currently active</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedEmployee?.id === employee.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                  }`}
                  onClick={() => loadEmployeeWarnings(employee)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {employee.profile.firstName} {employee.profile.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {employee.profile.employeeNumber} • {employee.profile.department}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        Archived {formatDate(employee.archivedAt)} • {getTimeInArchive(employee.archivedAt)} ago
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {permissions.canRestore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreEmployee(employee);
                          }}
                          disabled={restoringEmployee === employee.id}
                          className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                          title="Restore Employee"
                        >
                          {restoringEmployee === employee.id ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => loadEmployeeWarnings(employee)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                        title="View Warning History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Employee Details & Warning History */}
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-4 border-b">
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedEmployee ? 'Warning History' : 'Employee Details'}
            </h4>
          </div>

          {!selectedEmployee ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Select an Employee</p>
              <p className="text-sm">Click on an archived employee to view their warning history</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {/* Employee Info */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="font-medium text-gray-900">
                  {selectedEmployee.profile.firstName} {selectedEmployee.profile.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedEmployee.profile.employeeNumber} • {selectedEmployee.profile.department}
                </div>
                {selectedEmployee.archiveReason && (
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Archive Reason:</strong> {selectedEmployee.archiveReason}
                  </div>
                )}
              </div>

              {/* Warning History */}
              <div className="divide-y">
                {loadingWarnings ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading warning history...</p>
                  </div>
                ) : employeeWarnings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No Warning History</p>
                    <p className="text-sm">This employee has no recorded warnings</p>
                  </div>
                ) : (
                  employeeWarnings.map((warning, index) => (
                    <div key={warning.id || index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {warning.category || warning.categoryName || 'Unknown Category'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {warning.description || 'No description available'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(warning.issueDate || warning.createdAt)}
                            </span>
                            {warning.level && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                warning.level === 'counselling' ? 'bg-blue-100 text-blue-800' :
                                warning.level === 'verbal' ? 'bg-yellow-100 text-yellow-800' :
                                warning.level === 'first_written' ? 'bg-orange-100 text-orange-800' :
                                warning.level === 'final_written' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {warning.level.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {warning.status || 'Unknown Status'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};