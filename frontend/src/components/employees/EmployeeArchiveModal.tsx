// frontend/src/components/employees/EmployeeArchiveModal.tsx
// ✅ FIXED: Now passes reason to archive function + debug logging
import React, { useState } from 'react';
import type { Employee } from '../../types';

interface EmployeeArchiveModalProps {
  employee: Employee;
  onClose: () => void;
  onArchive: (employee: Employee, reason?: string) => void; // ✅ FIXED: Added reason parameter
}

export const EmployeeArchiveModal: React.FC<EmployeeArchiveModalProps> = ({
  employee,
  onClose,
  onArchive
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    // 🔍 DEBUG: Log all the data we're working with
    console.log('🔍 DEBUGGING - Archive Modal Data:', {
      employee: employee,
      employeeId: employee?.id,
      employeeIdType: typeof employee?.id,
      employeeIdLength: employee?.id?.length,
      employeeName: `${employee?.profile?.firstName} ${employee?.profile?.lastName}`,
      reason: reason,
      hasValidId: employee?.id && employee.id.trim().length > 0
    });

    // ✅ VALIDATION: Check if we have a valid employee with ID
    if (!employee || !employee.id || employee.id.trim().length === 0) {
      console.error('🚨 CRITICAL ERROR: Invalid employee or missing employee ID');
      alert('Error: Invalid employee data. Cannot archive.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Calling onArchive with employee and reason...');
      
      // ✅ FIXED: Pass the reason parameter to the archive function
      await onArchive(employee, reason.trim() || undefined);
      
      console.log('✅ Archive operation completed successfully');
      
      // Close modal after successful archive
      onClose();
    } catch (error) {
      console.error('❌ Archive operation failed:', error);
      alert(`Failed to archive employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-amber-600 mb-4">⚠️ Archive Employee</h2>
          
          <p className="text-gray-700 mb-4">
            Are you sure you want to archive <strong>{employee.profile.firstName} {employee.profile.lastName}</strong>?
          </p>
          
          {/* 🔍 DEBUG: Show employee ID for debugging */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs">
            <p className="text-blue-800">
              <strong>Debug Info:</strong> Employee ID: {employee.id || 'MISSING ID!'}
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Archiving an employee will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              <li>• Mark their record as inactive</li>
              <li>• Preserve all historical data</li>
              <li>• Remove them from active employee lists</li>
              <li>• Maintain compliance with HR regulations</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for archiving (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
              rows={3}
              placeholder="e.g., Resignation, End of contract, etc."
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleArchive}
              disabled={loading || !employee?.id}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Archiving...' : 'Yes, Archive'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
