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
  Lock,
  Info
} from 'lucide-react';

import { useOrganization } from '../../contexts/OrganizationContext';
import { API } from '../../api';
import type { WarningCategory } from '../../services/WarningService';
import Logger from '../../utils/logger';

interface OrganizationCategoriesViewerProps {
  onClose: () => void;
}

export const OrganizationCategoriesViewer: React.FC<OrganizationCategoriesViewerProps> = ({
  onClose
}) => {
  const { organization, organizationId } = useOrganization();
  const [categories, setCategories] = useState<WarningCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-violet-600 text-white p-2 rounded-lg">
                <Tags className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Warning Categories</h2>
                <p className="text-gray-600">
                  {organization?.name} • {categories.length} categories configured
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading categories...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Categories</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadCategories}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Found</h3>
                <p className="text-gray-600 mb-4">
                  No warning categories have been configured for this organization yet.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <Info className="h-4 w-4" />
                    <span>Categories can only be configured by SuperUser administrators for security and compliance.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Read-Only View</h4>
                    <p className="text-sm text-blue-800">
                      Category modifications are restricted to SuperUser administrators to ensure compliance,
                      prevent fraud, and maintain data integrity across all disciplinary records.
                    </p>
                  </div>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                {categories.map((category) => {
                  const isExpanded = expandedCategory === category.id;

                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg bg-white">
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Color indicator */}
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: category.color || getSeverityColor(category.severity)
                              }}
                            />

                            {/* Category info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {category.name}
                                </h3>

                                {/* Severity badge */}
                                <div
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-white text-sm font-medium"
                                  style={{ backgroundColor: getSeverityColor(category.severity) }}
                                >
                                  {getSeverityIcon(category.severity)}
                                  {category.severity?.replace('_', ' ') || 'Unknown'}
                                </div>

                                {/* Active status */}
                                {category.isActive !== false && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    Active
                                  </div>
                                )}
                              </div>

                              {/* Description */}
                              {category.description && (
                                <p className="text-gray-600 mb-3 leading-relaxed">
                                  {category.description}
                                </p>
                              )}

                              {/* Quick info */}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {category.escalationPath?.length || 0} escalation steps
                                </div>
                                {category.createdAt && (
                                  <div>
                                    Created: {new Date(category.createdAt).toLocaleDateString('en-ZA')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expand/collapse button */}
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Escalation Path */}
                              <div>
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Escalation Path
                                </h5>
                                {category.escalationPath && category.escalationPath.length > 0 ? (
                                  <div className="space-y-2">
                                    {category.escalationPath.map((level, index) => (
                                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                        <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                          {index + 1}
                                        </span>
                                        <span className="text-sm font-medium capitalize">
                                          {level.replace('_', ' ')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">No escalation path defined</p>
                                )}
                              </div>

                              {/* Additional Details */}
                              <div>
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Details
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Category ID:</span>
                                    <span className="text-gray-600 ml-2 font-mono text-xs">{category.id}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Severity:</span>
                                    <span className="text-gray-600 ml-2 capitalize">
                                      {category.severity?.replace('_', ' ') || 'Not specified'}
                                    </span>
                                  </div>
                                  {category.examples && category.examples.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-700">Examples:</span>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {category.examples.slice(0, 3).map((example, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                          >
                                            {example}
                                          </span>
                                        ))}
                                        {category.examples.length > 3 && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
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
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Total: <strong>{categories.length}</strong> categories configured
                  </span>
                  <span>
                    Active: <strong>{categories.filter(c => c.isActive !== false).length}</strong> categories
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Read-only access
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};