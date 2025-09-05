// frontend/src/components/employees/EmployeeTable.tsx
import React from 'react';
import type { Employee } from '../../types';
import type { EmployeePermissions } from '../../types';
import { getDeliveryMethodIcon, getDeliveryMethodText } from '../../utils/employees/employeeHelpers';

interface EmployeeTableProps {
  employees: Employee[];
  permissions: EmployeePermissions;
  onEdit: (employee: Employee) => void;
  onArchive: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  permissions,
  onEdit,
  onArchive
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">👤 Employee</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">🏢 Department</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">💼 Position</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">📋 Contract</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">🏆 Delivery</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">⚠️ Warnings</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">✅ Status</th>
              {permissions.canEdit && (
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">⚙️ Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr 
                key={employee.id} 
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {employee.profile.firstName} {employee.profile.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      #{employee.profile.employeeNumber}
                    </div>
                    {permissions.canViewContactInfo && (
                      <div className="text-sm text-gray-500">
                        {employee.profile.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {employee.profile.department}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {employee.profile.position}
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex px-3 py-1 text-xs font-semibold rounded-full
                    ${employee.employment.contractType === 'permanent' 
                      ? 'bg-green-100 text-green-800' 
                      : employee.employment.contractType === 'contract' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'}
                  `}>
                    {employee.employment.contractType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getDeliveryMethodIcon(employee.profile.preferredDeliveryMethod)}
                    </span>
                    <span className="text-gray-700">
                      {getDeliveryMethodText(employee.profile.preferredDeliveryMethod)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex px-3 py-1 text-xs font-bold rounded-full
                    ${employee.disciplinaryRecord.activeWarnings === 0 
                      ? 'bg-green-100 text-green-800' 
                      : employee.disciplinaryRecord.activeWarnings < 3 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'}
                  `}>
                    {employee.disciplinaryRecord.activeWarnings}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    inline-flex px-3 py-1 text-xs font-semibold rounded-full
                    ${employee.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'}
                  `}>
                    {employee.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
                {permissions.canEdit && (
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onEdit(employee)}
                      className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                    >
                      Edit
                    </button>
                    {employee.isActive && (
                      <button 
                        onClick={() => onArchive(employee)}
                        className="text-amber-600 hover:text-amber-800 font-medium"
                      >
                        Archive
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
