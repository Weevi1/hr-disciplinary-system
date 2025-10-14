// Department Management Component for Business Owners
// Full CRUD operations for organizational departments

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Crown,
  Mail,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import DepartmentService from '../../services/DepartmentService';
import { ThemedCard } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import { UnifiedModal } from '../common/UnifiedModal';
import { LoadingState } from '../common/LoadingState';
import Logger from '../../utils/logger';
import type { Department, DepartmentFormData, DepartmentStats } from '../../types/department';

interface DepartmentManagementProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
  inline?: boolean; // New prop for inline rendering in tabs
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({
  isOpen,
  onClose,
  organizationId: propOrgId,
  inline = false
}) => {
  const { organization } = useOrganization();
  const orgId = propOrgId || organization?.id;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    managerId: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Load departments
  useEffect(() => {
    if (!orgId || (!isOpen && !inline)) return;

    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const [deptData, statsData] = await Promise.all([
          DepartmentService.getDepartments(orgId),
          DepartmentService.getDepartmentStats(orgId)
        ]);

        setDepartments(deptData);
        setStats(statsData);
      } catch (err) {
        Logger.error('Failed to load departments', { error: err });
        setError('Failed to load departments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [orgId, isOpen, inline]);

  // Real-time subscription
  useEffect(() => {
    if (!orgId || (!isOpen && !inline)) return;

    const unsubscribe = DepartmentService.subscribeToDepartments(
      orgId,
      (updatedDepartments) => {
        setDepartments(updatedDepartments);
      }
    );

    return unsubscribe;
  }, [orgId, isOpen, inline]);

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setFormData({ name: '', description: '', managerId: '' });
    setShowForm(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || ''
    });
    setShowForm(true);
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (!orgId) return;

    if (department.isDefault) {
      alert('Cannot delete default departments (Operations, Admin)');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await DepartmentService.deleteDepartment(orgId, department.id);
      // Real-time subscription will update state automatically

      Logger.success('Department deleted successfully');
    } catch (err) {
      Logger.error('Failed to delete department', { error: err });
      alert('Failed to delete department. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    try {
      setFormLoading(true);

      if (editingDepartment) {
        // Update existing department
        await DepartmentService.updateDepartment(
          orgId,
          editingDepartment.id,
          formData
        );
        // Real-time subscription will update state automatically
      } else {
        // Create new department
        await DepartmentService.createDepartment(
          orgId,
          formData
        );
        // Real-time subscription will update state automatically
      }

      setShowForm(false);
      setFormData({ name: '', description: '', managerId: '' });
      Logger.success(editingDepartment ? 'Department updated successfully' : 'Department created successfully');
    } catch (err) {
      Logger.error('Failed to save department', { error: err });
      alert('Failed to save department. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '', managerId: '' });
  };

  if (!inline && !isOpen) return null;

  // Content to be rendered (either in modal or inline)
  const content = (
    <>
      {/* Compact Header with Stats and Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <h3 className="text-base font-bold text-gray-900">Departments</h3>
            {stats && (
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {stats.totalDepartments} total
                </span>
                <span className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {stats.departmentsWithManagers} with managers
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.totalEmployeesAcrossDepartments} employees
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleCreateDepartment}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Department
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingState message="Loading departments..." />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Departments List */}
      {!loading && !error && (
        <div className="space-y-1.5">
          {departments.map((department) => (
            <div key={department.id} className="bg-white border border-gray-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {department.name}
                    </h4>
                    {department.isDefault && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        Default
                      </span>
                    )}
                  </div>

                  {department.description && (
                    <p className="text-xs text-gray-600 mb-1.5">
                      {department.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {department.employeeCount} employees
                    </span>

                    {department.managerName ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {department.managerName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="w-3 h-3" />
                        No manager
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                    title="Edit department"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {!department.isDefault && (
                    <button
                      onClick={() => handleDeleteDepartment(department)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {departments.length === 0 && !loading && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                No departments found
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Create your first department to get started with organizational structure.
              </p>
              <button
                onClick={handleCreateDepartment}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Department
              </button>
            </div>
          )}
        </div>
      )}

      {/* Department Form Modal */}
      {showForm && (
        <UnifiedModal
          isOpen={showForm}
          onClose={handleCloseForm}
          title={editingDepartment ? 'Edit Department' : 'Create Department'}
          subtitle={editingDepartment ? 'Update department information' : 'Add a new department to your organization'}
          size="md"
        >
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Operations, Admin, Sales"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the department's role and responsibilities"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={formLoading}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading || !formData.name.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {editingDepartment ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {editingDepartment ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </form>
        </UnifiedModal>
      )}
    </>
  );

  // Render inline or as modal
  if (inline) {
    return <div className="space-y-4">{content}</div>;
  }

  return createPortal(
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Management"
      subtitle="Manage organizational departments and assignments"
      size="lg"
    >
      {content}
    </UnifiedModal>,
    document.body
  );
};