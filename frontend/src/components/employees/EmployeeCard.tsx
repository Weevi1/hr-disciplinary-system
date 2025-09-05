// frontend/src/components/employees/EmployeeCard.tsx
import React from 'react';
import type { Employee } from '../../types';
import type { EmployeePermissions } from '../../types';
import { getDeliveryMethodIcon, getDeliveryMethodText } from '../../utils/employees/employeeHelpers';

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
      bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl 
      transform hover:-translate-y-1 transition-all duration-200 cursor-pointer
      ${!employee.isActive ? 'opacity-75' : ''}
    `}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {employee.profile.firstName} {employee.profile.lastName}
          </h3>
          <p className="text-sm text-gray-600">
            #{employee.profile.employeeNumber}
          </p>
        </div>
        
        {/* Status Badge */}
        <span className={`
          inline-flex px-3 py-1 text-xs font-semibold rounded-full
          ${employee.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'}
        `}>
          {employee.isActive ? 'Active' : 'Archived'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        {/* Department & Position */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">🏢</span>
          <div>
            <span className="font-medium text-gray-700">{employee.profile.department}</span>
            <span className="text-gray-500"> • </span>
            <span className="text-gray-600">{employee.profile.position}</span>
          </div>
        </div>

        {/* Contact Info */}
        {permissions.canViewContactInfo && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📧</span>
            <span className="text-gray-600 truncate">{employee.profile.email}</span>
          </div>
        )}

        {/* Contract Type */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">📋</span>
          <span className="text-gray-600">Contract:</span>
          <span className={`
            inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize
            ${employee.employment.contractType === 'permanent' 
              ? 'bg-green-100 text-green-800' 
              : employee.employment.contractType === 'contract' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-yellow-100 text-yellow-800'}
          `}>
            {employee.employment.contractType}
          </span>
        </div>

        {/* Delivery Method */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">
            {getDeliveryMethodIcon(employee.profile.preferredDeliveryMethod)}
          </span>
          <span className="text-gray-600">Delivery:</span>
          <span className="font-medium text-gray-700">
            {getDeliveryMethodText(employee.profile.preferredDeliveryMethod)}
          </span>
        </div>

        {/* Warnings */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">⚠️</span>
          <span className="text-gray-600">Active Warnings:</span>
          <span className={`
            inline-flex px-2 py-0.5 text-xs font-bold rounded-full
            ${employee.disciplinaryRecord.activeWarnings === 0 
              ? 'bg-green-100 text-green-800' 
              : employee.disciplinaryRecord.activeWarnings < 3 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-red-100 text-red-800'}
          `}>
            {employee.disciplinaryRecord.activeWarnings}
          </span>
        </div>

        {/* Probation Status */}
        {probation && employee.isActive && (
          <div className={`
            flex items-center gap-2 text-sm p-2 rounded-lg
            ${probation.status === 'critical' ? 'bg-red-50' : 
              probation.status === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}
          `}>
            <span className="text-lg">⏳</span>
            <span className={`
              font-medium
              ${probation.status === 'critical' ? 'text-red-700' : 
                probation.status === 'warning' ? 'text-yellow-700' : 'text-blue-700'}
            `}>
              Probation ends in {probation.daysLeft} days
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {permissions.canEdit && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onEdit(employee)}
            className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
          >
            ✏️ Edit
          </button>
          {employee.isActive && permissions.canArchive && (
            <button
              onClick={() => onArchive(employee)}
              className="flex-1 py-2 px-4 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-medium transition-colors"
            >
              📁 Archive
            </button>
          )}
          {!employee.isActive && permissions.canRestore && (
            <button
              onClick={() => onEdit(employee)} // For now, restore through edit
              className="flex-1 py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors"
            >
              ♻️ Restore
            </button>
          )}
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
        <span>Started: {new Date(employee.profile.startDate).toLocaleDateString()}</span>
        {employee.disciplinaryRecord.lastWarningDate && (
          <span>Last warning: {new Date(employee.disciplinaryRecord.lastWarningDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};
