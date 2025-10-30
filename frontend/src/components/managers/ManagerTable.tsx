// ManagerTable.tsx
// 📋 MANAGER TABLE VIEW
// Displays managers in a table format with action buttons

import React, { useState } from 'react';
import { Eye, Edit, UserMinus, Archive, Users, Building2, Mail, Settings } from 'lucide-react';
import { Manager } from '../../services/ManagerService';

interface ManagerTableProps {
  managers: Manager[];
  onViewDetails: (manager: Manager) => void;
  onEdit: (manager: Manager) => void;
  onDemote: (manager: Manager) => void;
  onArchive: (manager: Manager) => void;
  onConfigurePermissions: (manager: Manager) => void;
}

export const ManagerTable: React.FC<ManagerTableProps> = ({
  managers,
  onViewDetails,
  onEdit,
  onDemote,
  onArchive,
  onConfigurePermissions
}) => {
  const [sortField, setSortField] = useState<keyof Manager>('lastName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Manager) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedManagers = [...managers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || bValue === undefined) return 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  if (managers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Managers Found</h3>
        <p className="text-gray-600 mb-4">
          There are currently no managers in your organization.
        </p>
        <p className="text-sm text-gray-500">
          Use the "Promote Employee" button to create managers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('lastName')}
              >
                <div className="flex items-center gap-2">
                  Name
                  {sortField === 'lastName' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-2">
                  Role
                  {sortField === 'role' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Departments
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('employeeCount')}
              >
                <div className="flex items-center gap-2">
                  Direct Reports
                  {sortField === 'employeeCount' && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedManagers.map((manager) => (
              <tr
                key={manager.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {manager.firstName} {manager.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Mail className="w-3 h-3" />
                    {manager.email}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      manager.role.id === 'hr-manager'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {manager.role.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Building2 className="w-3 h-3" />
                    {manager.departmentNames && manager.departmentNames.length > 0 ? (
                      <span>{manager.departmentNames.join(', ')}</span>
                    ) : (
                      <span className="text-gray-400 italic">No departments</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-900 font-medium">
                    <Users className="w-3 h-3" />
                    {manager.employeeCount || 0}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(manager)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(manager)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                      title="Edit Manager"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {manager.role.id === 'hod-manager' && (
                      <button
                        onClick={() => onConfigurePermissions(manager)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                        title="Configure Dashboard Features"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDemote(manager)}
                      className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                      title="Demote to Employee"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onArchive(manager)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Archive Manager"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {sortedManagers.map((manager) => (
          <div key={manager.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {manager.firstName} {manager.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{manager.email}</div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  manager.role.id === 'hr-manager'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {manager.role.name}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>
                  {manager.departmentNames && manager.departmentNames.length > 0
                    ? manager.departmentNames.join(', ')
                    : 'No departments'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{manager.employeeCount || 0} Direct Reports</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(manager)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
              >
                View
              </button>
              <button
                onClick={() => onEdit(manager)}
                className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
              >
                Edit
              </button>
              {manager.role.id === 'hod-manager' && (
                <button
                  onClick={() => onConfigurePermissions(manager)}
                  className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
                  title="Features"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDemote(manager)}
                className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100"
              >
                Demote
              </button>
              <button
                onClick={() => onArchive(manager)}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
