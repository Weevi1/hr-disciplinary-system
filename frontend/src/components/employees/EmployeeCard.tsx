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
    if (!employee.employment.probationEndDate) return null;
    
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

  return (
    <div className={`
      bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg
      border border-gray-200
      transition-all duration-200
      ${!employee.isActive ? 'opacity-75' : ''}
    `}>
      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 truncate">
            {employee.profile.firstName} {employee.profile.lastName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            #{employee.profile.employeeNumber}
          </p>
        </div>

        {/* Status Badge */}
        <span className={`
          inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0
          ${employee.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'}
        `}>
          {employee.isActive ? 'Active' : 'Archived'}
        </span>
      </div>

      {/* Details - Compact Grid on Mobile */}
      <div className="space-y-2 mb-3">
        {/* Department & Position */}
        <div className="flex items-start gap-2 text-sm">
          <span className="text-base flex-shrink-0">🏢</span>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">{employee.profile.department}</div>
            <div className="text-xs text-gray-600 truncate">{employee.profile.position}</div>
          </div>
        </div>

        {/* Contact Info */}
        {permissions.canViewContactInfo && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base flex-shrink-0">📧</span>
            <span className="text-gray-600 truncate text-xs sm:text-sm">{employee.profile.email}</span>
          </div>
        )}

        {/* Contract Type & Warnings - Side by Side on Mobile */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="text-base">📋</span>
            <span className={`
              inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full capitalize
              ${employee.employment.contractType === 'permanent'
                ? 'bg-green-100 text-green-800'
                : employee.employment.contractType === 'contract'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'}
            `}>
              {employee.employment.contractType}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm justify-end">
            <span className="text-base">⚠️</span>
            <span className={`
              inline-flex px-1.5 py-0.5 text-xs font-bold rounded-full
              ${employee.disciplinaryRecord.activeWarnings === 0
                ? 'bg-green-100 text-green-800'
                : employee.disciplinaryRecord.activeWarnings < 3
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'}
            `}>
              {employee.disciplinaryRecord.activeWarnings} Warning{employee.disciplinaryRecord.activeWarnings !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Probation Status */}
        {probation && employee.isActive && (
          <div className={`
            flex items-center gap-2 text-xs sm:text-sm p-2 rounded-lg
            ${probation.status === 'critical' ? 'bg-red-50' :
              probation.status === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}
          `}>
            <span className="text-base flex-shrink-0">⏳</span>
            <span className={`
              font-medium
              ${probation.status === 'critical' ? 'text-red-700' :
                probation.status === 'warning' ? 'text-yellow-700' : 'text-blue-700'}
            `}>
              Probation: {probation.daysLeft}d left
            </span>
          </div>
        )}
      </div>

      {/* Actions - Full Width on Mobile */}
      {permissions.canEdit && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => onEdit(employee)}
            className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors text-sm touch-manipulation"
          >
            <span className="hidden sm:inline">✏️ </span>Edit
          </button>
          {employee.isActive && permissions.canArchive && (
            <button
              onClick={() => onArchive(employee)}
              className="flex-1 py-2 px-3 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-medium transition-colors text-sm touch-manipulation"
            >
              <span className="hidden sm:inline">📁 </span>Archive
            </button>
          )}
          {!employee.isActive && permissions.canRestore && (
            <button
              onClick={() => onEdit(employee)} // For now, restore through edit
              className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors text-sm touch-manipulation"
            >
              <span className="hidden sm:inline">♻️ </span>Restore
            </button>
          )}
        </div>
      )}

      {/* Quick Stats Bar - Simplified on Mobile */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-500">
        <span className="truncate">Started: {(() => {
          const startDate = employee.profile?.startDate || employee.employment?.startDate;
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
        })()}</span>
        {employee.disciplinaryRecord.lastWarningDate && (
          <span className="truncate">Last warning: {new Date(employee.disciplinaryRecord.lastWarningDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};
