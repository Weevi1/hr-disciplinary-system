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
import Logger from '../../utils/logger';
import type { Department, DepartmentFormData, DepartmentStats } from '../../types/department';

interface DepartmentManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({
  isOpen,
  onClose
}) => {
  const { organization } = useOrganization();
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
    if (!organization?.id || !isOpen) return;

    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const [deptData, statsData] = await Promise.all([
          DepartmentService.getDepartments(organization.id),
          DepartmentService.getDepartmentStats(organization.id)
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
  }, [organization?.id, isOpen]);

  // Real-time subscription
  useEffect(() => {
    if (!organization?.id || !isOpen) return;

    const unsubscribe = DepartmentService.subscribeToDepartments(
      organization.id,
      (updatedDepartments) => {
        setDepartments(updatedDepartments);
      }
    );

    return unsubscribe;
  }, [organization?.id, isOpen]);

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
    if (!organization?.id) return;

    if (department.isDefault) {
      alert('Cannot delete default departments (Operations, Admin)');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await DepartmentService.deleteDepartment(organization.id, department.id);

      // Update local state
      setDepartments(prev => prev.filter(d => d.id !== department.id));

      Logger.success('Department deleted successfully');
    } catch (err) {
      Logger.error('Failed to delete department', { error: err });
      alert('Failed to delete department. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    try {
      setFormLoading(true);

      if (editingDepartment) {
        // Update existing department
        await DepartmentService.updateDepartment(
          organization.id,
          editingDepartment.id,
          formData
        );

        // Update local state
        setDepartments(prev =>
          prev.map(d =>
            d.id === editingDepartment.id
              ? { ...d, ...formData, updatedAt: new Date() }
              : d
          )
        );
      } else {
        // Create new department
        const newDepartment = await DepartmentService.createDepartment(
          organization.id,
          formData
        );

        setDepartments(prev => [...prev, newDepartment]);
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

  if (!isOpen) return null;

  return createPortal(
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Management"
      subtitle="Manage organizational departments and assignments"
      size="lg"
    >
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ThemedCard padding="md">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {stats.totalDepartments}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Total Departments
                </div>
              </div>
            </div>
          </ThemedCard>

          <ThemedCard padding="md">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {stats.departmentsWithManagers}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  With Managers
                </div>
              </div>
            </div>
          </ThemedCard>

          <ThemedCard padding="md">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" style={{ color: 'var(--color-info)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {stats.totalEmployeesAcrossDepartments}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Total Employees
                </div>
              </div>
            </div>
          </ThemedCard>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Departments
        </h3>
        <ThemedButton variant="primary" onClick={handleCreateDepartment}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </ThemedButton>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>
            Loading departments...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Departments List */}
      {!loading && !error && (
        <div className="space-y-4">
          {departments.map((department) => (
            <ThemedCard key={department.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {department.name}
                    </h4>
                    {department.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  {department.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {department.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{department.employeeCount} employees</span>
                    </div>

                    {department.managerName ? (
                      <div className="flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        <span>Manager: {department.managerName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600">No manager assigned</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    title="Edit department"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {!department.isDefault && (
                    <button
                      onClick={() => handleDeleteDepartment(department)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </ThemedCard>
          ))}

          {departments.length === 0 && !loading && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                No departments found
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Create your first department to get started with organizational structure.
              </p>
              <ThemedButton variant="primary" onClick={handleCreateDepartment}>
                <Plus className="w-4 h-4 mr-2" />
                Create Department
              </ThemedButton>
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
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-input-background)',
                  color: 'var(--color-text)'
                }}
                placeholder="e.g., Operations, Admin, Sales"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-input-background)',
                  color: 'var(--color-text)'
                }}
                placeholder="Brief description of the department's role and responsibilities"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <ThemedButton
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                disabled={formLoading}
              >
                Cancel
              </ThemedButton>
              <ThemedButton
                type="submit"
                variant="primary"
                disabled={formLoading || !formData.name.trim()}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingDepartment ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </>
                )}
              </ThemedButton>
            </div>
          </form>
        </UnifiedModal>
      )}
    </UnifiedModal>,
    document.body
  );
};