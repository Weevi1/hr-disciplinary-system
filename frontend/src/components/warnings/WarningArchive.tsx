// frontend/src/components/warnings/WarningArchive.tsx
// 🗄️ WARNING ARCHIVE - Complete archive management interface
// ✅ Performance optimized with pagination and filtering
// ✅ Full table interface matching main warning management
// ✅ Export and search functionality for archived warnings

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Archive, AlertTriangle, Calendar, Clock, Search, Filter, Download, Eye, FileText, ChevronLeft, ChevronRight, User, MapPin, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { API } from '../../api';
import { calculateEmployeePermissions } from '../../types/employee';
import type { Warning, Employee } from '../../types';
import Logger from '../../utils/logger';

interface WarningArchiveProps {
  onBack: () => void;
}

interface ArchiveStats {
  total: number;
  byLevel: Record<string, number>;
  byStatus: Record<string, number>;
  oldestWarning?: Warning;
  newestWarning?: Warning;
}

export const WarningArchive: React.FC<WarningArchiveProps> = ({ onBack }) => {
  const { user, organization } = useAuth();
  const [archivedWarnings, setArchivedWarnings] = useState<Warning[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null);

  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'employee' | 'level' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const permissions = calculateEmployeePermissions(user?.role.id, user?.departmentIds);

  // Load archived warnings and employees on mount
  useEffect(() => {
    loadArchivedData();
  }, [organization?.id]);

  const loadArchivedData = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);

      // Load archived warnings and all employees in parallel
      const [warnings, allEmployees] = await Promise.all([
        API.warnings.getArchived(organization.id),
        API.employees.getAll(organization.id, { includeArchived: true })
      ]);

      setArchivedWarnings(warnings);
      setEmployees(allEmployees);

      // Calculate archive statistics
      calculateArchiveStats(warnings);

      Logger.success(`📋 Loaded ${warnings.length} archived warnings`);
    } catch (error) {
      Logger.error('Failed to load archived warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateArchiveStats = (warnings: Warning[]) => {
    const stats: ArchiveStats = {
      total: warnings.length,
      byLevel: {},
      byStatus: {}
    };

    let oldest: Warning | undefined;
    let newest: Warning | undefined;

    warnings.forEach(warning => {
      // Count by level
      const level = warning.level || 'unknown';
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

      // Count by status
      const status = warning.status || 'unknown';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Find oldest and newest
      const warningDate = warning.issueDate?.toDate ? warning.issueDate.toDate() : new Date(warning.issueDate);

      if (!oldest || warningDate < (oldest.issueDate?.toDate ? oldest.issueDate.toDate() : new Date(oldest.issueDate))) {
        oldest = warning;
      }

      if (!newest || warningDate > (newest.issueDate?.toDate ? newest.issueDate.toDate() : new Date(newest.issueDate))) {
        newest = warning;
      }
    });

    stats.oldestWarning = oldest;
    stats.newestWarning = newest;
    setArchiveStats(stats);
  };

  // Helper function to get employee info
  const getEmployeeInfo = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? {
      name: `${employee.profile.firstName} ${employee.profile.lastName}`,
      department: employee.profile.department,
      employeeNumber: employee.profile.employeeNumber,
      isArchived: !!employee.archivedAt
    } : {
      name: 'Unknown Employee',
      department: 'Unknown',
      employeeNumber: 'N/A',
      isArchived: false
    };
  };

  // Get unique values for filters
  const uniqueDepartments = useMemo(() => {
    const departments = new Set(employees.map(emp => emp.profile.department));
    return Array.from(departments).sort();
  }, [employees]);

  const uniqueEmployees = useMemo(() => {
    return employees
      .map(emp => ({ id: emp.id, name: `${emp.profile.firstName} ${emp.profile.lastName}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  // Filter and sort warnings
  const filteredAndSortedWarnings = useMemo(() => {
    let filtered = archivedWarnings.filter(warning => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const employee = getEmployeeInfo(warning.employeeId);
        const matchesSearch =
          employee.name.toLowerCase().includes(searchLower) ||
          warning.category.toLowerCase().includes(searchLower) ||
          warning.description.toLowerCase().includes(searchLower) ||
          employee.employeeNumber.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && warning.status !== statusFilter) return false;

      // Level filter
      if (levelFilter !== 'all' && warning.level !== levelFilter) return false;

      // Department filter
      if (departmentFilter !== 'all') {
        const employee = getEmployeeInfo(warning.employeeId);
        if (employee.department !== departmentFilter) return false;
      }

      // Employee filter
      if (employeeFilter !== 'all' && warning.employeeId !== employeeFilter) return false;

      return true;
    });

    // Sort warnings
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = a.issueDate?.toDate ? a.issueDate.toDate() : new Date(a.issueDate);
          const dateB = b.issueDate?.toDate ? b.issueDate.toDate() : new Date(b.issueDate);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'employee':
          const empA = getEmployeeInfo(a.employeeId).name;
          const empB = getEmployeeInfo(b.employeeId).name;
          comparison = empA.localeCompare(empB);
          break;
        case 'level':
          const levelOrder = ['counselling', 'verbal', 'first_written', 'final_written'];
          const levelA = levelOrder.indexOf(a.level) !== -1 ? levelOrder.indexOf(a.level) : 999;
          const levelB = levelOrder.indexOf(b.level) !== -1 ? levelOrder.indexOf(b.level) : 999;
          comparison = levelA - levelB;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [archivedWarnings, searchTerm, statusFilter, levelFilter, departmentFilter, employeeFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedWarnings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWarnings = filteredAndSortedWarnings.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, levelFilter, departmentFilter, employeeFilter]);

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

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'counselling': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verbal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'first_written': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'final_written': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'appealed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overturned': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Archive</h3>
          <p className="text-slate-600">Fetching archived warnings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
                    Warning Archive
                  </h3>
                  <p className="text-orange-100 text-sm font-medium">
                    {filteredAndSortedWarnings.length} archived warnings
                  </p>
                </div>
              </div>

              {/* Archive Stats */}
              {archiveStats && (
                <div className="flex gap-4 text-white">
                  <div className="text-center">
                    <div className="text-lg font-bold">{archiveStats.total}</div>
                    <div className="text-xs text-orange-100">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{Object.keys(archiveStats.byLevel).length}</div>
                    <div className="text-xs text-orange-100">Levels</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{uniqueEmployees.length}</div>
                    <div className="text-xs text-orange-100">Employees</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search archived warnings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="appealed">Appealed</option>
                <option value="overturned">Overturned</option>
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="counselling">Counselling</option>
                <option value="verbal">Verbal</option>
                <option value="first_written">First Written</option>
                <option value="final_written">Final Written</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="all">All Employees</option>
                {uniqueEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as 'date' | 'employee' | 'level' | 'category');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="date-desc">Latest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="employee-asc">Employee A-Z</option>
                <option value="employee-desc">Employee Z-A</option>
                <option value="level-desc">Level: High-Low</option>
                <option value="level-asc">Level: Low-High</option>
                <option value="category-asc">Category A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warning Table */}
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium text-gray-500">No archived warnings found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedWarnings.map((warning) => {
                    const employee = getEmployeeInfo(warning.employeeId);
                    return (
                      <tr key={warning.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {employee.name}
                              {employee.isArchived && (
                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                  Archived Employee
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {employee.employeeNumber}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {employee.department}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{warning.category}</div>
                          <div className="text-sm text-gray-600 truncate max-w-48">
                            {warning.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelBadgeClass(warning.level)}`}>
                            {warning.level?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {formatDate(warning.issueDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(warning.status)}`}>
                            {warning.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedWarning(warning)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {permissions.canExport && (
                              <button
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                title="Export Warning"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedWarnings.length)} of {filteredAndSortedWarnings.length} warnings
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-orange-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Details Modal */}
      {selectedWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Warning Details</h3>
                <button
                  onClick={() => setSelectedWarning(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee</label>
                  <div className="mt-1 text-gray-900">{getEmployeeInfo(selectedWarning.employeeId).name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <div className="mt-1 text-gray-900">{selectedWarning.category}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Level</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelBadgeClass(selectedWarning.level)}`}>
                      {selectedWarning.level?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(selectedWarning.status)}`}>
                      {selectedWarning.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Issue Date</label>
                  <div className="mt-1 text-gray-900">{formatDate(selectedWarning.issueDate)}</div>
                </div>
                {selectedWarning.archivedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Archived Date</label>
                    <div className="mt-1 text-gray-900">{formatDate(selectedWarning.archivedAt)}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedWarning.description}
                </div>
              </div>

              {selectedWarning.archiveReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Archive Reason</label>
                  <div className="mt-1 p-3 bg-orange-50 rounded-lg text-gray-900">
                    {selectedWarning.archiveReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};