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
import { LoadingState } from '../common/LoadingState';
import Logger from '../../utils/logger';

interface OrganizationCategoriesViewerProps {
  onClose: () => void;
  inline?: boolean; // New prop for inline rendering in tabs
}

export const OrganizationCategoriesViewer: React.FC<OrganizationCategoriesViewerProps> = ({
  onClose,
  inline = false
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

                          {/* Expand/collapse button */}
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 flex-shrink-0"
                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
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
                  <span className="flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Read-only
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
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