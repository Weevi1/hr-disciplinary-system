// frontend/src/components/organization/OrganizationCategoriesViewer.tsx
// READ-ONLY categories viewer for business owners - shows deployed categories from Firestore
// CRUD operations restricted to SuperUser only for security and compliance

import React, { useState, useEffect } from 'react';
import {
  X,
  Tags,
  AlertTriangle,
  Shield,
  FileText,
  Target,
  RefreshCw,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lock,
  Info,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  GripVertical
} from 'lucide-react';

import { OrganizationContext } from '../../contexts/OrganizationContext';
import { useAuth } from '../../auth/AuthContext';
import { API } from '../../api';
import { ShardedDataService } from '../../services/ShardedDataService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import type { WarningCategory } from '../../services/WarningService';
import { UNIVERSAL_SA_CATEGORIES } from '../../services/UniversalCategories';
import { LoadingState } from '../common/LoadingState';
import Logger from '../../utils/logger';

interface OrganizationCategoriesViewerProps {
  onClose: () => void;
  inline?: boolean; // New prop for inline rendering in tabs
  organizationId?: string; // Optional - for use without OrganizationProvider (e.g., SuperAdmin)
  organizationName?: string; // Optional - for display without OrganizationProvider
  allowEdit?: boolean; // Optional - enable CRUD for SuperUser
}

export const OrganizationCategoriesViewer: React.FC<OrganizationCategoriesViewerProps> = ({
  onClose,
  inline = false,
  organizationId: propOrganizationId,
  organizationName: propOrganizationName,
  allowEdit = false
}) => {
  const { user } = useAuth();

  // Optional organization context - not all users have organizations (e.g., super users)
  const orgContext = React.useContext(OrganizationContext);
  const organization = orgContext?.organization || null;
  const contextOrganizationId = orgContext?.organizationId;

  // Use prop if provided, otherwise fall back to context
  const organizationId = propOrganizationId || contextOrganizationId;
  const [categories, setCategories] = useState<WarningCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<WarningCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState<any>({
    name: '',
    description: '',
    level: 'verbal' as const,
    color: '#10b981',
    icon: '📋',
    isActive: true,
    isDefault: false,
    escalationPath: ['verbal', 'first_written', 'final_written']
  });

  // Check if user has CRUD access (SuperUser or Reseller)
  const isSuperUser = user?.role?.id === 'super-user';
  const isReseller = user?.role?.id === 'reseller';
  const canEdit = allowEdit && (isSuperUser || isReseller);

  const loadCategories = async () => {
    if (!organizationId) {
      setError('Organization ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      Logger.debug('[OrganizationCategoriesViewer] Loading categories for organization:', organizationId);

      // Load the organization's categories from Firestore
      const orgCategories = await API.organizations.getCategories(organizationId);

      Logger.debug('[OrganizationCategoriesViewer] Loaded categories:', orgCategories);
      setCategories(orgCategories);

    } catch (error) {
      Logger.error('[OrganizationCategoriesViewer] Error loading categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [organizationId]);

  // CRUD Handlers for SuperUser and Reseller
  const handleSaveCategory = async (category: WarningCategory) => {
    if (!organizationId || !canEdit) return;

    try {
      setSaving(true);

      // Update the category document in subcollection
      // Remove undefined values as Firestore doesn't support them
      const updateData: any = {
        name: category.name,
        description: category.description,
        level: category.level,
        color: category.color,
        icon: category.icon,
        isActive: category.isActive,
        escalationPath: category.escalationPath,
        updatedAt: new Date()
      };

      // Only include severity if it's defined
      if (category.severity !== undefined && category.severity !== null) {
        updateData.severity = category.severity;
      }

      // Update document and invalidate cache
      await DatabaseShardingService.updateDocument(
        organizationId,
        'categories',
        category.id,
        updateData
      );

      // Invalidate cache to ensure fresh data on reload
      ShardedDataService.invalidateCache(`categories:${organizationId}`);

      await loadCategories();
      setEditingCategory(null);
      Logger.success('Category updated successfully');
    } catch (error) {
      Logger.error('Failed to update category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!organizationId || !canEdit) return;
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      setSaving(true);

      // Use ShardedDataService which properly invalidates cache
      await ShardedDataService.deleteDocument(
        organizationId,
        'categories',
        categoryId
      );

      await loadCategories();
      Logger.success('Category deleted successfully');
    } catch (error) {
      Logger.error('Failed to delete category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category: WarningCategory) => {
    if (!organizationId || !canEdit) return;

    try {
      setSaving(true);

      // Toggle isActive status
      const newActiveStatus = category.isActive === false ? true : false;

      // Update category document in subcollection and invalidate cache
      await DatabaseShardingService.updateDocument(
        organizationId,
        'categories',
        category.id,
        {
          isActive: newActiveStatus,
          updatedAt: new Date()
        }
      );

      // Invalidate cache to ensure fresh data on reload
      ShardedDataService.invalidateCache(`categories:${organizationId}`);

      await loadCategories();
      Logger.success(`Category ${category.isActive !== false ? 'deactivated' : 'activated'}`);
    } catch (error) {
      Logger.error('Failed to toggle category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!organizationId || !canEdit) return;
    if (!newCategory.name?.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      setSaving(true);

      // Create new category document in subcollection (with cache invalidation)
      const categoryToCreate: any = {
        name: newCategory.name,
        description: newCategory.description || '',
        severity: newCategory.level || 'minor', // Map level to severity for consistency
        level: newCategory.level || 'verbal',
        color: newCategory.color || '#10b981',
        icon: newCategory.icon || '📋',
        isActive: newCategory.isActive !== false,
        isDefault: false,
        escalationPath: newCategory.escalationPath || ['verbal', 'first_written', 'final_written']
      };

      // Use ShardedDataService which properly invalidates cache
      await ShardedDataService.createWarningCategory(categoryToCreate, organizationId);

      await loadCategories();
      setCreatingNew(false);
      setNewCategory({
        name: '',
        description: '',
        level: 'verbal',
        color: '#10b981',
        icon: '📋',
        isActive: true,
        isDefault: false,
        escalationPath: ['verbal', 'first_written', 'final_written']
      });
      Logger.success('Category created successfully');
    } catch (error) {
      Logger.error('Failed to create category:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
      case 'low':
        return '#10b981'; // green
      case 'serious':
      case 'medium':
        return '#f59e0b'; // amber
      case 'gross_misconduct':
      case 'high':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'minor':
      case 'low':
        return <Shield className="h-4 w-4" />;
      case 'serious':
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'gross_misconduct':
      case 'high':
        return <X className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatEscalationPath = (path?: string[]) => {
    if (!path || path.length === 0) return 'No escalation path defined';
    return path.map(level => level.replace('_', ' ')).join(' → ');
  };

  // Content to be rendered (either in modal or inline)
  const content = (
    <>
      {/* Header */}
      {!inline && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-600 text-white p-2 rounded-lg">
                <Tags className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Warning Categories</h2>
                <p className="text-gray-600">
                  {propOrganizationName || organization?.name} • {categories.length} categories configured
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadCategories}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                title="Refresh categories"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Header */}
      {inline && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-bold text-gray-900">Warning Categories</h2>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Tags className="w-3 h-3" />
                  {categories.length} total
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {categories.filter(c => c.isActive !== false).length} active
                </span>
              </div>
            </div>

            <button
              onClick={loadCategories}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
              title="Refresh categories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <LoadingState message="Loading categories..." />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Error Loading Categories</span>
              </div>
              <p className="text-xs text-red-600 mb-2">{error}</p>
              <button
                onClick={loadCategories}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Tags className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-900 mb-1">No Categories Found</p>
              <p className="text-xs text-gray-600 mb-3">
                No warning categories have been configured for this organization yet.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800 text-xs">
                  <Info className="w-3.5 h-3.5" />
                  <span>Categories can only be configured by SuperUser administrators for security and compliance.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Security Notice */}
              {!canEdit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-blue-900 mb-0.5">Read-Only View</h4>
                      <p className="text-xs text-blue-800">
                        Category modifications are restricted to SuperUser administrators to ensure compliance and data integrity.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {canEdit && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Edit className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-green-900 mb-0.5">{isSuperUser ? 'SuperUser' : 'Reseller'} Edit Mode</h4>
                      <p className="text-xs text-green-800">
                        You can edit, activate/deactivate, and delete categories for this organization.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Create New Category Button */}
              {canEdit && !creatingNew && (
                <button
                  onClick={() => setCreatingNew(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Create New Category</span>
                </button>
              )}

              {/* Create New Category Form - Matching Wizard Format */}
              {canEdit && creatingNew && (
                <div className="bg-white border-2 border-blue-400 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900">Create New Category</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTemplateSelector(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-medium text-gray-700 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Use Template
                      </button>
                      <button
                        onClick={() => setCreatingNew(false)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                      <input
                        type="text"
                        value={newCategory.name || ''}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g., Attendance Issues"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Starting Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Starting Level</label>
                      <select
                        value={newCategory.level || 'verbal'}
                        onChange={(e) => setNewCategory({ ...newCategory, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="counselling">Counselling</option>
                        <option value="verbal">Verbal Warning</option>
                        <option value="first_written">Written Warning</option>
                        <option value="second_written">Second Written Warning</option>
                        <option value="final_written">Final Written Warning</option>
                        <option value="suspension">Suspension</option>
                        <option value="dismissal">Ending of Service</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newCategory.description || ''}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        placeholder="Brief description of this category..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
                      <input
                        type="color"
                        value={newCategory.color || '#10b981'}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newCategory.isActive !== false}
                          onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Category</span>
                      </label>
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
                    <div className="grid grid-cols-8 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                      {['📋', '⚠️', '📊', '🔒', '👔', '💼', '🏢', '📞', '🖥️', '📝', '🗂️', '📅', '🔧', '⚡', '🎯', '📈'].map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCategory({ ...newCategory, icon })}
                          className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-100 ${
                            newCategory.icon === icon
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    {newCategory.icon && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: <span className="text-xl">{newCategory.icon}</span>
                      </div>
                    )}
                  </div>

                  {/* Escalation Path Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Path</label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      {/* Current Path Display */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">Current escalation sequence (drag to reorder):</div>
                        {newCategory.escalationPath && newCategory.escalationPath.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {newCategory.escalationPath.map((level: string, index: number) => (
                              <React.Fragment key={index}>
                                <div
                                  className="relative"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverIndex(index);
                                  }}
                                  onDragLeave={() => {
                                    setDragOverIndex(null);
                                  }}
                                >
                                  {/* Drop indicator line */}
                                  {draggedIndex !== null && dragOverIndex === index && draggedIndex !== index && (
                                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10" />
                                  )}

                                  <div
                                    draggable
                                    onDragStart={() => {
                                      setDraggedIndex(index);
                                      setDragOverIndex(null);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedIndex(null);
                                      setDragOverIndex(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      if (draggedIndex !== null && draggedIndex !== index) {
                                        const newPath = [...newCategory.escalationPath];
                                        const draggedItem = newPath[draggedIndex];
                                        newPath.splice(draggedIndex, 1);
                                        newPath.splice(index, 0, draggedItem);
                                        setNewCategory({ ...newCategory, escalationPath: newPath });
                                      }
                                      setDraggedIndex(null);
                                      setDragOverIndex(null);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium select-none transition-all duration-150 ${
                                      draggedIndex === index
                                        ? 'opacity-40 scale-95 cursor-grabbing shadow-lg'
                                        : dragOverIndex === index && draggedIndex !== null
                                        ? 'bg-blue-200 scale-105 shadow-md'
                                        : 'cursor-grab hover:bg-blue-200 hover:shadow-sm'
                                    }`}
                                  >
                                    <GripVertical className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                    <span className="capitalize">{level.replace('_', ' ')}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newPath = newCategory.escalationPath.filter((_: string, i: number) => i !== index);
                                        setNewCategory({ ...newCategory, escalationPath: newPath });
                                      }}
                                      className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {index < newCategory.escalationPath.length - 1 && (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No escalation path defined</p>
                        )}
                      </div>

                      {/* Add Level Buttons */}
                      <div className="text-xs text-gray-600 mb-2">Add warning level:</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { value: 'counselling', label: 'Counselling' },
                          { value: 'verbal', label: 'Verbal' },
                          { value: 'first_written', label: 'Written' },
                          { value: 'second_written', label: 'Second Written' },
                          { value: 'final_written', label: 'Final Written' },
                          { value: 'suspension', label: 'Suspension' },
                          { value: 'dismissal', label: 'Ending of Service' }
                        ].map((levelOption) => (
                          <button
                            key={levelOption.value}
                            type="button"
                            onClick={() => {
                              const currentPath = newCategory.escalationPath || [];
                              if (!currentPath.includes(levelOption.value)) {
                                setNewCategory({
                                  ...newCategory,
                                  escalationPath: [...currentPath, levelOption.value]
                                });
                              }
                            }}
                            disabled={newCategory.escalationPath?.includes(levelOption.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              newCategory.escalationPath?.includes(levelOption.value)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {levelOption.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCreateCategory}
                      disabled={saving || !newCategory.name?.trim()}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Creating...' : 'Create Category'}
                    </button>
                    <button
                      onClick={() => setCreatingNew(false)}
                      disabled={saving}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Category Form */}
              {canEdit && editingCategory && (
                <div className="bg-white border-2 border-yellow-400 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900">Edit Category</h4>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                      <input
                        type="text"
                        value={editingCategory.name || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="e.g., Attendance Issues"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Starting Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Starting Level</label>
                      <select
                        value={editingCategory.level || 'verbal'}
                        onChange={(e) => setEditingCategory({ ...editingCategory, level: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="counselling">Counselling</option>
                        <option value="verbal">Verbal Warning</option>
                        <option value="first_written">Written Warning</option>
                        <option value="second_written">Second Written Warning</option>
                        <option value="final_written">Final Written Warning</option>
                        <option value="suspension">Suspension</option>
                        <option value="dismissal">Ending of Service</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editingCategory.description || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                        placeholder="Brief description of this category..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
                      <input
                        type="color"
                        value={editingCategory.color || '#10b981'}
                        onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingCategory.isActive !== false}
                          onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active Category</span>
                      </label>
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
                    <div className="grid grid-cols-8 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                      {['📋', '⚠️', '📊', '🔒', '👔', '💼', '🏢', '📞', '🖥️', '📝', '🗂️', '📅', '🔧', '⚡', '🎯', '📈'].map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setEditingCategory({ ...editingCategory, icon })}
                          className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-100 ${
                            editingCategory.icon === icon
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    {editingCategory.icon && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: <span className="text-xl">{editingCategory.icon}</span>
                      </div>
                    )}
                  </div>

                  {/* Escalation Path Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Path</label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      {/* Current Path Display */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">Current escalation sequence (drag to reorder):</div>
                        {editingCategory.escalationPath && editingCategory.escalationPath.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {editingCategory.escalationPath.map((level: string, index: number) => (
                              <React.Fragment key={index}>
                                <div
                                  className="relative"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverIndex(index);
                                  }}
                                  onDragLeave={() => {
                                    setDragOverIndex(null);
                                  }}
                                >
                                  {/* Drop indicator line */}
                                  {draggedIndex !== null && dragOverIndex === index && draggedIndex !== index && (
                                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10" />
                                  )}

                                  <div
                                    draggable
                                    onDragStart={() => {
                                      setDraggedIndex(index);
                                      setDragOverIndex(null);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedIndex(null);
                                      setDragOverIndex(null);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      if (draggedIndex !== null && draggedIndex !== index) {
                                        const newPath = [...editingCategory.escalationPath!];
                                        const draggedItem = newPath[draggedIndex];
                                        newPath.splice(draggedIndex, 1);
                                        newPath.splice(index, 0, draggedItem);
                                        setEditingCategory({ ...editingCategory, escalationPath: newPath });
                                      }
                                      setDraggedIndex(null);
                                      setDragOverIndex(null);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium select-none transition-all duration-150 ${
                                      draggedIndex === index
                                        ? 'opacity-40 scale-95 cursor-grabbing shadow-lg'
                                        : dragOverIndex === index && draggedIndex !== null
                                        ? 'bg-blue-200 scale-105 shadow-md'
                                        : 'cursor-grab hover:bg-blue-200 hover:shadow-sm'
                                    }`}
                                  >
                                    <GripVertical className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                    <span className="capitalize">{level.replace('_', ' ')}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newPath = editingCategory.escalationPath!.filter((_, i) => i !== index);
                                        setEditingCategory({ ...editingCategory, escalationPath: newPath });
                                      }}
                                      className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {index < editingCategory.escalationPath.length - 1 && (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No escalation path defined</p>
                        )}
                      </div>

                      {/* Add Level Buttons */}
                      <div className="text-xs text-gray-600 mb-2">Add warning level:</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { value: 'counselling', label: 'Counselling' },
                          { value: 'verbal', label: 'Verbal' },
                          { value: 'first_written', label: 'Written' },
                          { value: 'second_written', label: 'Second Written' },
                          { value: 'final_written', label: 'Final Written' },
                          { value: 'suspension', label: 'Suspension' },
                          { value: 'dismissal', label: 'Ending of Service' }
                        ].map((levelOption) => (
                          <button
                            key={levelOption.value}
                            type="button"
                            onClick={() => {
                              const currentPath = editingCategory.escalationPath || [];
                              if (!currentPath.includes(levelOption.value)) {
                                setEditingCategory({
                                  ...editingCategory,
                                  escalationPath: [...currentPath, levelOption.value]
                                });
                              }
                            }}
                            disabled={editingCategory.escalationPath?.includes(levelOption.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              editingCategory.escalationPath?.includes(levelOption.value)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {levelOption.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleSaveCategory(editingCategory)}
                      disabled={saving || !editingCategory.name?.trim()}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      disabled={saving}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="space-y-1.5">
                {categories.map((category) => {
                  const isExpanded = expandedCategory === category.id;

                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg bg-white">
                      <div className="p-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            {/* Color indicator */}
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                              style={{
                                backgroundColor: category.color || getSeverityColor(category.severity)
                              }}
                            />

                            {/* Category info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {category.name}
                                </h3>

                                {/* Severity badge */}
                                <div
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs font-medium"
                                  style={{ backgroundColor: getSeverityColor(category.severity) }}
                                >
                                  <span className="scale-75">{getSeverityIcon(category.severity)}</span>
                                  {category.severity?.replace('_', ' ') || 'Unknown'}
                                </div>

                                {/* Active status */}
                                {category.isActive !== false && (
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    Active
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              {category.description && (
                                <p className="text-xs text-gray-600 mb-1.5 line-clamp-2">
                                  {category.description}
                                </p>
                              )}

                              {/* Quick info */}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {category.escalationPath?.length || 0} steps
                                </span>
                                {category.createdAt && (
                                  <span>
                                    {new Date(category.createdAt).toLocaleDateString('en-ZA')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            {/* SuperUser CRUD buttons */}
                            {canEdit && (
                              <>
                                {/* Edit button */}
                                <button
                                  onClick={() => setEditingCategory(category)}
                                  disabled={saving}
                                  className="p-1.5 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50 flex-shrink-0"
                                  title="Edit category"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Active/Inactive */}
                                <button
                                  onClick={() => handleToggleActive(category)}
                                  disabled={saving}
                                  className={`p-1.5 rounded hover:bg-gray-50 flex-shrink-0 ${
                                    category.isActive !== false
                                      ? 'text-green-600 hover:text-green-700'
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                  title={category.isActive !== false ? 'Deactivate category' : 'Activate category'}
                                >
                                  {category.isActive !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={saving}
                                  className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 flex-shrink-0"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Expand/collapse button */}
                            <button
                              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 flex-shrink-0"
                              title={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-2.5 border-t border-gray-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {/* Escalation Path */}
                              <div>
                                <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Escalation Path
                                </h5>
                                {category.escalationPath && category.escalationPath.length > 0 ? (
                                  <div className="space-y-1">
                                    {category.escalationPath.map((level, index) => (
                                      <div key={index} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded text-xs">
                                        <span className="w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                                          {index + 1}
                                        </span>
                                        <span className="font-medium capitalize">
                                          {level.replace('_', ' ')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-xs">No escalation path defined</p>
                                )}
                              </div>

                              {/* Additional Details */}
                              <div>
                                <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Details
                                </h5>
                                <div className="space-y-1.5 text-xs">
                                  <div>
                                    <span className="font-medium text-gray-700">Category ID:</span>
                                    <span className="text-gray-600 ml-1 font-mono text-[10px]">{category.id}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Severity:</span>
                                    <span className="text-gray-600 ml-1 capitalize">
                                      {category.severity?.replace('_', ' ') || 'Not specified'}
                                    </span>
                                  </div>
                                  {category.examples && category.examples.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-700">Examples:</span>
                                      <div className="mt-1.5 flex flex-wrap gap-1">
                                        {category.examples.slice(0, 3).map((example, index) => (
                                          <span
                                            key={index}
                                            className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded"
                                          >
                                            {example}
                                          </span>
                                        ))}
                                        {category.examples.length > 3 && (
                                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                                            +{category.examples.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600 flex-wrap gap-2">
                  <span>
                    Total: <strong>{categories.length}</strong> configured
                  </span>
                  <span>
                    Active: <strong>{categories.filter(c => c.isActive !== false).length}</strong>
                  </span>
                  {canEdit ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Edit className="w-2.5 h-2.5" />
                      Edit mode
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Read-only
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              maxWidth: '48rem',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#dbeafe',
                    borderRadius: '0.5rem'
                  }}
                >
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                    Select Category Template
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
                    Choose from 8 universal SA labor law compliant categories
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateSelector(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Templates List - Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {UNIVERSAL_SA_CATEGORIES.map((template) => {
                  const severityColor = getSeverityColor(template.severity);
                  const severityIcon = getSeverityIcon(template.severity);

                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        // Map template fields to newCategory structure
                        setNewCategory({
                          name: template.name,
                          description: template.description,
                          level: template.escalationPath?.[0] || 'verbal',
                          color: severityColor,
                          icon: template.icon || '📋',
                          isActive: true,
                          isDefault: false,
                          escalationPath: template.escalationPath || ['verbal', 'first_written', 'final_written']
                        });
                        setShowTemplateSelector(false);
                      }}
                      style={{
                        padding: '1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                        {/* Icon */}
                        <div
                          style={{
                            fontSize: '2rem',
                            flexShrink: 0
                          }}
                        >
                          {template.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                              {template.name}
                            </h4>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: severityColor,
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              <span style={{ transform: 'scale(0.8)' }}>{severityIcon}</span>
                              {template.severity?.replace('_', ' ')}
                            </div>
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            {template.description}
                          </p>

                          {/* Escalation Path */}
                          {template.escalationPath && template.escalationPath.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Target className="w-3 h-3" />
                                Escalation Path:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {template.escalationPath.map((level, index) => (
                                  <React.Fragment key={index}>
                                    <span
                                      style={{
                                        padding: '0.125rem 0.5rem',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        fontSize: '0.625rem',
                                        fontWeight: 500,
                                        borderRadius: '0.25rem',
                                        textTransform: 'capitalize'
                                      }}
                                    >
                                      {level.replace('_', ' ')}
                                    </span>
                                    {index < template.escalationPath!.length - 1 && (
                                      <ChevronRight className="w-3 h-3 text-gray-400" />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Examples */}
                          {template.commonExamples && template.commonExamples.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                                Common Examples:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {template.commonExamples.slice(0, 3).map((example, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      padding: '0.125rem 0.5rem',
                                      backgroundColor: '#dbeafe',
                                      color: '#1e40af',
                                      fontSize: '0.625rem',
                                      borderRadius: '0.25rem'
                                    }}
                                  >
                                    {example}
                                  </span>
                                ))}
                                {template.commonExamples.length > 3 && (
                                  <span
                                    style={{
                                      padding: '0.125rem 0.5rem',
                                      backgroundColor: '#f3f4f6',
                                      color: '#6b7280',
                                      fontSize: '0.625rem',
                                      borderRadius: '0.25rem'
                                    }}
                                  >
                                    +{template.commonExamples.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Arrow indicator */}
                        <div style={{ flexShrink: 0, color: '#9ca3af' }}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}
            >
              <button
                onClick={() => setShowTemplateSelector(false)}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Render inline or as modal
  if (inline) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {content}
      </div>
    </div>
  );
};