// frontend/src/components/warnings/ReviewDashboardArchiveView.tsx
//
// Archive view sub-section of ReviewDashboard. Extracted in Phase 2 Tier
// 3D step 3. Renders the archive header, stats grid (total / overturned /
// expired), and the list of archived warnings with appeal-decision and
// natural-expiry detail blocks.

import React from 'react';
import {
  Archive, ChevronDown, RefreshCw, Clock, Scale, Eye,
} from 'lucide-react';
import type { Warning } from '../../types/warning';
import { safeRenderText } from './reviewDashboardHelpers';

interface ReviewDashboardArchiveViewProps {
  archivedWarnings: Warning[];
  onBackToActive: () => void;
  onViewDetails: (warning: Warning) => void;
}

export const ReviewDashboardArchiveView: React.FC<ReviewDashboardArchiveViewProps> = ({
  archivedWarnings,
  onBackToActive,
  onViewDetails,
}) => (
  <div className="space-y-4">
    {/* Archive Header */}
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-600" />
          Warning Archive
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          View expired and overturned warnings with appeal decision history
        </p>
      </div>
      <button
        onClick={onBackToActive}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
      >
        <ChevronDown className="w-4 h-4 rotate-90" />
        Back to Active Warnings
      </button>
    </div>

    {/* Archive Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-gray-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{archivedWarnings.length}</div>
            <div className="text-sm text-gray-600">Total Archived</div>
          </div>
        </div>
      </div>
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-orange-600" />
          <div>
            <div className="text-2xl font-bold text-orange-900">
              {archivedWarnings.filter(w => w.status === 'overturned').length}
            </div>
            <div className="text-sm text-orange-700">Overturned Appeals</div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {archivedWarnings.filter(w => w.status === 'expired').length}
            </div>
            <div className="text-sm text-blue-700">Naturally Expired</div>
          </div>
        </div>
      </div>
    </div>

    {/* Archived Warnings List */}
    {archivedWarnings.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <Archive className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No archived warnings</p>
        <p className="text-sm text-gray-400 mt-1">Expired and overturned warnings will appear here</p>
      </div>
    ) : (
      <div className="space-y-3">
        {archivedWarnings.map((warning, index) => (
          <div
            key={warning.id || `archived-${index}`}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{safeRenderText(warning.employeeName)}</h4>
                  <span className="text-xs text-gray-500">
                    {safeRenderText(warning.employeeNumber)} • {safeRenderText(warning.department)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Warning Level</p>
                    <p className="text-sm font-medium text-gray-900">
                      {warning.level === 'counselling' ? 'Counselling' :
                       warning.level === 'verbal' ? 'Verbal' :
                       warning.level === 'first_written' ? 'Written' :
                       warning.level === 'second_written' ? 'Second Written' :
                       warning.level === 'final_written' ? 'Final Written' :
                       safeRenderText(warning.level, 'Unknown')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{safeRenderText(warning.category)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {warning.issueDate
                        ? new Date((warning.issueDate as any).seconds ? (warning.issueDate as any).seconds * 1000 : warning.issueDate as any).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      warning.status === 'overturned' ? 'bg-orange-100 text-orange-800' :
                      warning.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {warning.status === 'overturned' ? 'Overturned' :
                       warning.status === 'expired' ? 'Expired' :
                       safeRenderText(warning.status, 'Archived')}
                    </span>
                  </div>
                </div>

                {/* Appeal Decision Details (for overturned warnings) */}
                {warning.status === 'overturned' && warning.appealDecisionDate && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 mt-3">
                    <div className="flex items-start gap-2">
                      <Scale className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-orange-900 mb-1">Appeal Decision</p>
                        <p className="text-xs text-orange-800 mb-2">
                          <strong>Outcome:</strong> {warning.appealOutcome === 'overturned' ? 'Warning Overturned' : safeRenderText(warning.appealOutcome)}
                        </p>
                        {warning.appealReasoning && (
                          <p className="text-xs text-orange-800 mb-2">
                            <strong>Reasoning:</strong> {safeRenderText(warning.appealReasoning)}
                          </p>
                        )}
                        {warning.hrNotes && (
                          <p className="text-xs text-orange-800 mb-2">
                            <strong>HR Notes:</strong> {safeRenderText(warning.hrNotes)}
                          </p>
                        )}
                        <p className="text-xs text-orange-700">
                          <strong>Decision Date:</strong> {new Date(warning.appealDecisionDate as any).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expiry Info (for naturally expired warnings) */}
                {warning.status === 'expired' && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mt-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 mb-1">Natural Expiry</p>
                        <p className="text-xs text-blue-800">
                          This warning expired after its validity period completed without further incidents.
                        </p>
                        {warning.expiryDate && (
                          <p className="text-xs text-blue-700 mt-1">
                            <strong>Expired On:</strong> {new Date(warning.expiryDate as any).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* View Details Button */}
              <button
                onClick={() => onViewDetails(warning)}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
