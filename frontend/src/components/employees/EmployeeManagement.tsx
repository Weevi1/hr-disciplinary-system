// frontend/src/components/employees/EmployeeManagement.tsx
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useEmployees } from '../../hooks/employees/useEmployees';
import { useEmployeeFilters } from '../../hooks/employees/useEmployeeFilters';
import { EmployeeStats } from './EmployeeStats';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeImportModal } from './EmployeeImportModal';
import { EmployeeArchiveModal } from './EmployeeArchiveModal';
import { calculateEmployeePermissions } from '../../types';
import type { Employee } from '../../types';

export const EmployeeManagement: React.FC = () => {
  const { user, organization } = useAuth();
  const { employees, loading, error, loadEmployees, archiveEmployee, updateEmployee } = useEmployees(organization?.id);
  const { filters, setFilters, filteredEmployees } = useEmployeeFilters(employees, user);
  
  // UI State
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [archivingEmployee, setArchivingEmployee] = useState<Employee | null>(null);

  const permissions = calculateEmployeePermissions(user?.role.id, user?.departmentIds);

  const handleEmployeeSaved = async () => {
    await loadEmployees();
    setShowAddModal(false);
    setEditingEmployee(null);
  };

  const handleEmployeeArchived = async (employee: Employee) => {
    await archiveEmployee(employee);
    setArchivingEmployee(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg font-medium">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header - Only styling improved */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                👥 Employee Management
              </h1>
              <p className="text-slate-600">
                {organization?.name} • {filteredEmployees.length} employees
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {permissions.canBulkImport && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  📊 Import CSV
                </button>
              )}
              
              {permissions.canCreate && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  ➕ Add Employee
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}

        <EmployeeStats employees={filteredEmployees} />
        
        <EmployeeFilters 
          filters={filters}
          setFilters={setFilters}
          departments={[...new Set(employees.map(e => e.profile.department))]}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Employee List */}
        {viewMode === 'table' ? (
          <EmployeeTable 
            employees={filteredEmployees}
            permissions={permissions}
            onEdit={setEditingEmployee}
            onArchive={setArchivingEmployee}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                permissions={permissions}
                onEdit={setEditingEmployee}
                onArchive={setArchivingEmployee}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEmployees.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No employees found</h3>
            <p className="text-slate-600 mb-6">
              {employees.length === 0 
                ? "Get started by adding your first employee or importing from CSV"
                : "Try adjusting your search criteria"
              }
            </p>
          </div>
        )}

{/* Modals - Remove the wrapper overlays */}
{(showAddModal || editingEmployee) && (
  <EmployeeFormModal
    employee={editingEmployee}
    onClose={() => {
      setShowAddModal(false);
      setEditingEmployee(null);
    }}
    onSave={handleEmployeeSaved}
  />
)}

{showImportModal && (
  <EmployeeImportModal
    onClose={() => setShowImportModal(false)}
    onImportComplete={loadEmployees}
  />
)}

{archivingEmployee && (
  <EmployeeArchiveModal
    employee={archivingEmployee}
    onClose={() => setArchivingEmployee(null)}
    onArchive={handleEmployeeArchived}
  />
)}

      </div>
    </div>
  );
};
