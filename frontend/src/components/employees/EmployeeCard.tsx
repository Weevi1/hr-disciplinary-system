// frontend/src/components/employees/EmployeeCard.tsx
import React from 'react';
import type { Employee } from '../../types';
import type { EmployeePermissions } from '../../types';

interface EmployeeCardProps {
  employee: Employee;
  permissions: EmployeePermissions;
  onEdit: (employee: Employee) => void;
  onArchive: (employee: Employee) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  permissions,
  onEdit,
  onArchive
}) => {
  const getProbationStatus = () => {
    if (!employee.employment?.probationEndDate) return null;

    const endDate = new Date(employee.employment.probationEndDate);
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return null;

    return {
      daysLeft,
      status: daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'warning' : 'normal'
    };
  };

  const probation = getProbationStatus();

  const activeWarnings = employee.disciplinaryRecord?.activeWarnings || 0;

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 overflow-hidden
        transition-all duration-200 hover:shadow-md
        ${!employee.isActive ? 'opacity-60' : ''}
      `}
      onClick={permissions.canEdit ? () => onEdit(employee) : undefined}
      style={{ cursor: permissions.canEdit ? 'pointer' : 'default' }}
    >
      {/* Compact Header with Visual Hierarchy */}
      <div className="px-3 py-3 sm:px-4 sm:py-4">
        {/* Name & Status Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
              {employee.profile.firstName} {employee.profile.lastName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {employee.profile?.position || 'N/A'}
            </p>
          </div>

          {/* Warning Badge - Prominent */}
          {activeWarnings > 0 && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0
              ${activeWarnings >= 3
                ? 'bg-red-100'
                : 'bg-yellow-100'}
            `}>
              <span className="text-sm">⚠️</span>
              <span className={`
                text-xs font-bold
                ${activeWarnings >= 3 ? 'text-red-700' : 'text-yellow-700'}
              `}>
                {activeWarnings}
              </span>
            </div>
          )}
        </div>

        {/* Department & Employee Number - Compact */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
          <span className="truncate">{employee.profile?.department || 'N/A'}</span>
          <span className="text-gray-400">•</span>
          <span className="flex-shrink-0">#{employee.profile.employeeNumber}</span>
        </div>

        {/* Quick Info Pills - Mobile Optimized */}
        <div className="flex flex-wrap gap-1.5">
          {/* Status Pill */}
          <span className={`
            inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
            ${employee.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'}
          `}>
            <span className="w-1.5 h-1.5 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-gray-400'}"></span>
            {employee.isActive ? 'Active' : 'Archived'}
          </span>

          {/* Contract Type Pill */}
          <span className={`
            inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize
            ${employee.employment?.contractType === 'permanent'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-purple-50 text-purple-700'}
          `}>
            {employee.employment?.contractType || 'N/A'}
          </span>

          {/* Probation Pill */}
          {probation && employee.isActive && (
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
              ${probation.status === 'critical' ? 'bg-red-50 text-red-700' :
                probation.status === 'warning' ? 'bg-orange-50 text-orange-700' :
                'bg-blue-50 text-blue-700'}
            `}>
              ⏳ {probation.daysLeft}d
            </span>
          )}

          {/* No Warnings Badge */}
          {activeWarnings === 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
              <span className="text-xs">✓</span> Clean Record
            </span>
          )}
        </div>
      </div>

      {/* Actions Bar - Touch Friendly */}
      {permissions.canEdit && (
        <div className="border-t border-gray-100 px-3 py-2 sm:px-4 bg-gray-50/50 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(employee);
            }}
            className="flex-1 py-2.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm active:scale-95"
          >
            Edit Details
          </button>
          {employee.isActive && permissions.canArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(employee);
              }}
              className="px-3 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm active:scale-95"
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
};
