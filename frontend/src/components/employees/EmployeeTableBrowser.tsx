// frontend/src/components/employees/EmployeeTableBrowser.tsx
// 🏆 EXCEL-STYLE EMPLOYEE TABLE BROWSER
// ✅ Sortable columns
// ✅ Advanced filtering
// ✅ Multi-select actions
// ✅ Export functionality
// ✅ Inline editing capabilities

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building,
  User,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Eye,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import Logger from '../../utils/logger';
import type { Employee } from '../../types';

interface EmployeeTableBrowserProps {
  employees: Employee[];
  onEmployeeSelect?: (employee: Employee) => void;
  onEmployeeEdit?: (employee: Employee) => void;
  onEmployeeDelete?: (employee: Employee) => void;
  onBulkAction?: (action: string, employees: Employee[]) => void;
  selectedEmployee?: Employee | null;
  loading?: boolean;
}

type SortField = 'name' | 'department' | 'position' | 'manager' | 'startDate' | 'status';
type SortOrder = 'asc' | 'desc';

interface ColumnConfig {
  key: string;
  label: string;
  sortable: boolean;
  width: string;
  align?: 'left' | 'center' | 'right';
}

export const EmployeeTableBrowser: React.FC<EmployeeTableBrowserProps> = ({
  employees,
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeDelete,
  onBulkAction,
  selectedEmployee,
  loading = false
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();

  // State for users lookup
  const [users, setUsers] = useState<any[]>([]);

  // Load users for manager lookup
  useEffect(() => {
    const loadUsers = async () => {
      if (!organization?.id) return;

      try {
        const result = await DatabaseShardingService.queryDocuments(organization.id, 'users');
        setUsers(result.documents);
        Logger.debug(`📋 Loaded ${result.documents.length} users for manager lookup`);
      } catch (error) {
        Logger.error('Failed to load users for manager lookup:', error);
      }
    };

    loadUsers();
  }, [organization?.id]);

  // Helper function to resolve manager ID to name
  const getManagerName = useCallback((managerId: string | null) => {
    if (!managerId) return 'HR Manager';

    // First try to find manager in employees list
    const managerEmployee = employees.find(emp => emp.id === managerId);
    if (managerEmployee) {
      return `${managerEmployee.profile.firstName} ${managerEmployee.profile.lastName}`;
    }

    // If not found in employees, look in users list
    const managerUser = users.find(u => u.id === managerId);
    if (managerUser) {
      const firstName = managerUser.firstName || managerUser.profile?.firstName;
      const lastName = managerUser.lastName || managerUser.profile?.lastName;
      const role = managerUser.role?.name || managerUser.role?.id;

      if (firstName && lastName) {
        return role ? `${firstName} ${lastName} (${role})` : `${firstName} ${lastName}`;
      }
    }

    // Fallback to generic name
    return 'HR Manager';
  }, [employees, users]);

  // Table state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column configuration
  const columns: ColumnConfig[] = [
    { key: 'select', label: '', sortable: false, width: '48px', align: 'center' },
    { key: 'name', label: 'Employee', sortable: true, width: '200px' },
    { key: 'employeeNumber', label: 'ID', sortable: true, width: '100px' },
    { key: 'department', label: 'Department', sortable: true, width: '130px' },
    { key: 'position', label: 'Position', sortable: true, width: '130px' },
    { key: 'manager', label: 'Manager', sortable: true, width: '120px' },
    { key: 'contact', label: 'Contact', sortable: false, width: '80px', align: 'center' },
    { key: 'startDate', label: 'Start Date', sortable: true, width: '100px' },
    { key: 'status', label: 'Status', sortable: true, width: '100px' },
    { key: 'actions', label: 'Actions', sortable: false, width: '80px', align: 'center' }
  ];

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.employment.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [employees]);

  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = employees.filter(employee => {
      const searchFields = [
        employee.profile.firstName,
        employee.profile.lastName,
        employee.profile.employeeNumber,
        employee.employment.department,
        employee.employment.position,
        employee.profile.email
      ].join(' ').toLowerCase();

      const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());
      const matchesDepartment = !filterDepartment || employee.employment.department === filterDepartment;
      const matchesStatus = !filterStatus || (
        filterStatus === 'active' ? employee.isActive : !employee.isActive
      );

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.profile.firstName} ${a.profile.lastName}`;
          bValue = `${b.profile.firstName} ${b.profile.lastName}`;
          break;
        case 'department':
          aValue = a.employment.department || '';
          bValue = b.employment.department || '';
          break;
        case 'position':
          aValue = a.employment.position || '';
          bValue = b.employment.position || '';
          break;
        case 'manager':
          aValue = getManagerName(a.employment.managerId);
          bValue = getManagerName(b.employment.managerId);
          break;
        case 'startDate':
          // Handle various date formats for sorting
          const getDateValue = (emp: Employee) => {
            const startDate = emp.employment?.startDate || emp.profile?.startDate;
            if (!startDate) return 0;
            
            try {
              // Handle Firestore Timestamp objects
              if (startDate && typeof startDate.toDate === 'function') {
                return startDate.toDate().getTime();
              }
              
              // Handle Date objects
              if (startDate instanceof Date) {
                return startDate.getTime();
              }
              
              // Handle date strings/numbers
              const parsed = new Date(startDate);
              return !isNaN(parsed.getTime()) ? parsed.getTime() : 0;
            } catch (error) {
              return 0;
            }
          };
          
          aValue = getDateValue(a);
          bValue = getDateValue(b);
          break;
        case 'status':
          aValue = a.isActive ? 'Active' : 'Inactive';
          bValue = b.isActive ? 'Active' : 'Inactive';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchTerm, filterDepartment, filterStatus, sortField, sortOrder]);

  // Pagination
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedEmployees.slice(start, start + pageSize);
  }, [filteredAndSortedEmployees, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedEmployees.length / pageSize);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const handleRowSelect = useCallback((employeeId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedEmployees.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedEmployees.map(emp => emp.id)));
    }
  }, [selectedRows.size, paginatedEmployees]);

  const handleBulkAction = useCallback((action: string) => {
    const selectedEmployees = employees.filter(emp => selectedRows.has(emp.id));
    onBulkAction?.(action, selectedEmployees);
    setSelectedRows(new Set());
  }, [employees, selectedRows, onBulkAction]);

  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Employee ID', 'Department', 'Position', 'Manager', 'Email', 'Phone', 'Start Date', 'Status'];
    const csvData = filteredAndSortedEmployees.map(emp => [
      `${emp.profile.firstName} ${emp.profile.lastName}`,
      emp.profile.employeeNumber,
      emp.employment.department,
      emp.employment.position,
      getManagerName(emp.employment.managerId),
      emp.profile.email || '',
      emp.profile.phoneNumber || '',
      (() => {
        const startDate = emp.employment?.startDate || emp.profile?.startDate;
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
      })(),
      emp.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employees-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAndSortedEmployees]);

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              Employee Directory
            </h2>
            <p className="text-gray-600 text-sm">
              {filteredAndSortedEmployees.length} of {employees.length} employees
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors
                ${showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedRows.size} employee{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Export Selected
                </button>
                <button
                  onClick={() => handleBulkAction('email')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`
                      px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                      ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key as SortField)}
                  >
                    <div className="flex items-center gap-1">
                      {column.key === 'select' ? (
                        <button onClick={handleSelectAll}>
                          {selectedRows.size === paginatedEmployees.length ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      ) : (
                        <>
                          {column.label}
                          {column.sortable && renderSortIcon(column.key as SortField)}
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className={`
                    hover:bg-gray-50 transition-colors cursor-pointer
                    ${selectedEmployee?.id === employee.id ? 'bg-blue-50' : ''}
                    ${selectedRows.has(employee.id) ? 'bg-blue-25' : ''}
                  `}
                  onClick={() => onEmployeeSelect?.(employee)}
                >
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowSelect(employee.id);
                      }}
                    >
                      {selectedRows.has(employee.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {employee.profile.firstName} {employee.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.profile.employeeNumber}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {employee.profile.employeeNumber}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{employee.employment.department}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900">
                    {employee.employment.position}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getManagerName(employee.employment.managerId)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {employee.profile.email && (
                        <Mail 
                          className="w-4 h-4 text-green-600" 
                          title={`Email: ${employee.profile.email}`}
                        />
                      )}
                      {employee.profile.phoneNumber && (
                        <Phone 
                          className="w-4 h-4 text-blue-600" 
                          title={`Phone: ${employee.profile.phoneNumber}`}
                        />
                      )}
                      {!employee.profile.email && !employee.profile.phoneNumber && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {(() => {
                          // Handle various date formats safely
                          const startDate = employee.employment?.startDate || employee.profile?.startDate;
                          if (!startDate) return 'Not set';
                          
                          try {
                            // Handle Firestore Timestamp objects
                            if (startDate && typeof startDate.toDate === 'function') {
                              return startDate.toDate().toLocaleDateString();
                            }
                            
                            // Handle Date objects
                            if (startDate instanceof Date) {
                              return startDate.toLocaleDateString();
                            }
                            
                            // Handle date strings/numbers
                            const parsed = new Date(startDate);
                            if (!isNaN(parsed.getTime())) {
                              return parsed.toLocaleDateString();
                            }
                            
                            return 'Invalid date';
                          } catch (error) {
                            return 'Invalid date';
                          }
                        })()}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-medium rounded-full
                      ${employee.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }
                    `}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmployeeEdit?.(employee);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmployeeSelect?.(employee);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedEmployees.length)} of {filteredAndSortedEmployees.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                        px-3 py-1 border rounded text-sm transition-colors
                        ${page === currentPage 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredAndSortedEmployees.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employees Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterDepartment || filterStatus 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Start by adding employees to your organization.'
            }
          </p>
          {(searchTerm || filterDepartment || filterStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDepartment('');
                setFilterStatus('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeTableBrowser;