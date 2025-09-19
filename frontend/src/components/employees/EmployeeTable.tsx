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
      <div className="w-full max-w-full">
        {/* Grid-based header */}
        <div className={`grid gap-1 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 p-2 ${
          permissions.canEdit 
            ? 'grid-cols-8' 
            : 'grid-cols-7'
        }`}>
          <div className="text-xs font-bold text-gray-700 truncate">👤 Employee</div>
          <div className="text-xs font-bold text-gray-700 truncate">🏢 Dept</div>
          <div className="text-xs font-bold text-gray-700 truncate">💼 Pos</div>
          <div className="text-xs font-bold text-gray-700 truncate text-center">📋</div>
          <div className="text-xs font-bold text-gray-700 truncate text-center">🏆</div>
          <div className="text-xs font-bold text-gray-700 truncate text-center">⚠️</div>
          <div className="text-xs font-bold text-gray-700 truncate text-center">✅</div>
          {permissions.canEdit && (
            <div className="text-xs font-bold text-gray-700 truncate text-center">⚙️</div>
          )}
        </div>
        
        {/* Grid-based body */}
        <div className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <div 
              key={employee.id}
              className={`grid gap-1 hover:bg-gray-50 transition-colors p-2 items-center ${
                permissions.canEdit 
                  ? 'grid-cols-8' 
                  : 'grid-cols-7'
              }`}
            >
              {/* Employee - Column 1 */}
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-xs truncate">
                  {employee.profile.firstName} {employee.profile.lastName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  #{employee.profile.employeeNumber}
                </div>
              </div>
              
              {/* Department - Column 2 */}
              <div className="text-xs text-gray-700 truncate" title={employee.profile.department}>
                {employee.profile.department}
              </div>
              
              {/* Position - Column 3 */}
              <div className="text-xs text-gray-700 truncate" title={employee.profile.position}>
                {employee.profile.position}
              </div>
              
              {/* Contract - Column 4 */}
              <div className="text-center">
                <span className={`
                  inline-block w-4 h-4 text-xs font-bold rounded text-center leading-4
                  ${employee.employment.contractType === 'permanent' 
                    ? 'bg-green-100 text-green-800' 
                    : employee.employment.contractType === 'contract' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'}
                `}>
                  {employee.employment.contractType === 'permanent' ? 'P' : 
                   employee.employment.contractType === 'contract' ? 'C' : 
                   employee.employment.contractType === 'temporary' ? 'T' : 'I'}
                </span>
              </div>
              
              {/* Delivery Method - Column 5 */}
              <div className="text-center">
                <span className="text-sm" title={getDeliveryMethodText(employee.profile.preferredDeliveryMethod)}>
                  {getDeliveryMethodIcon(employee.profile.preferredDeliveryMethod)}
                </span>
              </div>
              
              {/* Warnings - Column 6 */}
              <div className="text-center">
                <span className={`
                  inline-block w-5 h-5 text-xs font-bold rounded text-center leading-5
                  ${employee.disciplinaryRecord.activeWarnings === 0 
                    ? 'bg-green-100 text-green-800' 
                    : employee.disciplinaryRecord.activeWarnings < 3 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'}
                `}>
                  {employee.disciplinaryRecord.activeWarnings}
                </span>
              </div>
              
              {/* Status - Column 7 */}
              <div className="text-center">
                <span className={`
                  inline-block w-5 h-5 text-xs font-bold rounded text-center leading-5
                  ${employee.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'}
                `}>
                  {employee.isActive ? '✓' : '✗'}
                </span>
              </div>
              
              {/* Actions - Column 8 (if can edit) */}
              {permissions.canEdit && (
                <div className="flex gap-1 justify-center">
                  <button 
                    onClick={() => onEdit(employee)}
                    className="w-6 h-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded flex items-center justify-center text-xs transition-colors"
                    title="Edit Employee"
                  >
                    ✏️
                  </button>
                  {employee.isActive && (
                    <button 
                      onClick={() => onArchive(employee)}
                      className="w-6 h-6 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded flex items-center justify-center text-xs transition-colors"
                      title="Archive Employee"
                    >
                      📦
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
