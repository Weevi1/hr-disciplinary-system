// frontend/src/components/warnings/ReviewDashboard.tsx
// 🏆 CLEAN VERSION - Fixed syntax errors
// ✅ All original functionality restored
// ✅ Working WarningDetailsModal integration
// ✅ Proper error boundaries and data handling

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Filter, Calendar, Download, Eye, Printer, AlertTriangle, 
  CheckCircle, Clock, Shield, RefreshCw, ChevronDown, ChevronUp,
  X, FileText, Users, Building, TrendingUp, Archive, Mail,
  MessageCircle, FileSignature, Info, AlertCircle, Award,
  Send, Scale
} from 'lucide-react';

// Use API layer with proper warning types
import { API } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import type { Warning } from '../../types/warning';

// Import the working modal
import WarningDetailsModal from './modals/WarningDetailsModal';

// Warning interface imported from API layer types

interface WarningsReviewProps {
  organizationId?: string; // Optional - will get from auth context
  onClose?: () => void;
  PDFGenerationService?: any;
  DataService?: any;
  canTakeAction?: boolean;
  userRole?: string;
  onApprove?: (warningId: string) => void;
  onReject?: (warningId: string, reason?: string) => void;
}

// 🔧 SAFE RENDERING HELPER - Prevents React Error #31
const safeRenderText = (value: any, fallback: string = 'Unknown'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') {
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`;
    return fallback;
  }
  return String(value);
};

export const WarningsReviewDashboard: React.FC<WarningsReviewProps> = ({
  organizationId: propOrganizationId,
  onClose,
  PDFGenerationService,
  DataService: DataServiceProp,
  canTakeAction = false,
  userRole = 'viewer',
  onApprove,
  onReject
}) => {
  const { organization } = useAuth();
  const organizationId = propOrganizationId || organization?.id;
  
  console.log('🔧 [WarningsReviewDashboard] Using API layer version');

  // State management
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [filteredWarnings, setFilteredWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'employee' | 'level' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  // Load warnings
// Add this to your WarningsReviewDashboard.tsx file
// Replace your existing loadWarnings function with this debug version:

// Replace your loadWarnings function in WarningsReviewDashboard.tsx with this fixed version:

// Add this to your WarningsReviewDashboard.tsx - replace the existing loadWarnings function:

// Replace your loadWarnings function with this security-safe version:

const loadWarnings = useCallback(async () => {
  if (!organizationId) {
    console.warn('No organization ID available for loading warnings');
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Loading warnings via API layer for org:', organizationId);
    const data = await API.warnings.getAll(organizationId);
    
    // Sort by creation date (newest first)
    const sortedWarnings = data.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    
    setWarnings(sortedWarnings);
    setFilteredWarnings(sortedWarnings);
    console.log('✅ Loaded warnings:', sortedWarnings.length);
    
  } catch (error) {
    console.error('❌ Failed to load warnings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setError(`Failed to load warnings: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
}, [organizationId]);

  // Load warnings on mount
  useEffect(() => {
    if (organizationId) {
      loadWarnings();
    } else {
      setLoading(false);
    }
  }, [organizationId, loadWarnings]);

  // Filter and search
  useEffect(() => {
    let filtered = [...warnings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(warning =>
        warning.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warning.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warning.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warning.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(warning => warning.status === filterStatus);
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(warning => warning.level === filterLevel);
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(warning => warning.department === filterDepartment);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'employee':
          aValue = a.employeeName;
          bValue = b.employeeName;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredWarnings(filtered);
    setCurrentPage(1);
  }, [warnings, searchTerm, filterStatus, filterLevel, filterDepartment, sortBy, sortOrder]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(warnings.map(w => w.department).filter(dept => dept));
    return Array.from(depts).sort();
  }, [warnings]);

  // Pagination
  const paginatedWarnings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredWarnings.slice(start, end);
  }, [filteredWarnings, currentPage]);

  const totalPages = Math.ceil(filteredWarnings.length / itemsPerPage);

  // Modal handlers
  const handleViewDetails = useCallback((warning: Warning) => {
    console.log('Opening warning details for:', warning.id);
    setSelectedWarning(warning);
    setShowDetails(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log('Closing warning details modal');
    setShowDetails(false);
    setSelectedWarning(null);
  }, []);

  // Warning action handlers
  const handleApproveWarning = useCallback(async (warningId: string) => {
    try {
      console.log('Approving warning:', warningId);
      
      // Optimistic update
      setWarnings(prev => prev.map(w => 
        w.id === warningId ? { ...w, status: 'approved', updatedAt: new Date() } : w
      ));
      
      // Update via API layer
      await API.warnings.update(warningId, { 
        status: 'approved',
        organizationId,
        updatedAt: new Date()
      });
      
      if (onApprove) {
        await onApprove(warningId);
      }
      
      console.log('✅ Warning approved successfully');
      
    } catch (error) {
      console.error('❌ Failed to approve warning:', error);
      // Revert optimistic update
      loadWarnings();
    }
  }, [onApprove, loadWarnings]);

  const handleRejectWarning = useCallback(async (warningId: string, reason?: string) => {
    try {
      console.log('Rejecting warning:', warningId, 'Reason:', reason);
      
      const rejectionNote = reason ? `\n\nRejection Reason: ${reason}` : '';
      
      // Optimistic update
      setWarnings(prev => prev.map(w => 
        w.id === warningId ? { 
          ...w, 
          status: 'rejected', 
          updatedAt: new Date(),
          additionalNotes: (w.additionalNotes || '') + rejectionNote
        } : w
      ));
      
      // Update via API layer
      await API.warnings.update(warningId, { 
        status: 'rejected',
        organizationId,
        updatedAt: new Date()
      });
      
      if (onReject) {
        await onReject(warningId, reason);
      }
      
      console.log('✅ Warning rejected successfully');
      
    } catch (error) {
      console.error('❌ Failed to reject warning:', error);
      // Revert optimistic update
      loadWarnings();
    }
  }, [warnings, onReject, loadWarnings]);

  // Loading state
  if (loading) {
    return (
      <div className="hr-card">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Warnings</h3>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="hr-card">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Warnings</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadWarnings}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="hr-card">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-orange-600" />
            Warnings Review Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Review and manage disciplinary warnings ({warnings.length} total)
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2">
            <X className="w-4 h-4" />
            Close
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search warnings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="issued">Issued</option>
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="verbal">Verbal</option>
              <option value="first_written">First Written</option>
              <option value="second_written">Second Written</option>
              <option value="final_written">Final Written</option>
              <option value="suspension">Suspension</option>
              <option value="dismissal">Dismissal</option>
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'date' | 'employee' | 'level' | 'status');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="employee-asc">Employee A-Z</option>
              <option value="employee-desc">Employee Z-A</option>
              <option value="level-asc">Level (Low to High)</option>
              <option value="level-desc">Level (High to Low)</option>
            </select>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Warnings</p>
              <p className="text-2xl font-bold text-blue-900">{warnings.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active Warnings</p>
              <p className="text-2xl font-bold text-green-900">
                {warnings.filter(w => w.isActive).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-orange-900">
                {warnings.filter(w => w.status === 'pending_review').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">High Risk</p>
              <p className="text-2xl font-bold text-red-900">
                {warnings.filter(w => w.level === 'final_written' || w.level === 'dismissal').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWarnings.length)} of {filteredWarnings.length} warnings
        </p>
        <div className="text-sm text-gray-500">
          Organization: {organizationId}
        </div>
      </div>

      {/* Warnings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedWarnings.map((warning) => (
                <tr key={warning.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {safeRenderText(warning.employeeName)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {safeRenderText(warning.employeeNumber)} • {safeRenderText(warning.department)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      warning.level === 'verbal' ? 'bg-blue-100 text-blue-800' :
                      warning.level === 'first_written' ? 'bg-yellow-100 text-yellow-800' :
                      warning.level === 'second_written' ? 'bg-orange-100 text-orange-800' :
                      warning.level === 'final_written' ? 'bg-red-100 text-red-800' :
                      warning.level === 'suspension' ? 'bg-purple-100 text-purple-800' :
                      warning.level === 'dismissal' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {safeRenderText(warning.level, 'Unknown').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safeRenderText(warning.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {warning.incidentDate instanceof Date 
                      ? warning.incidentDate.toLocaleDateString()
                      : new Date(warning.incidentDate).toLocaleDateString()
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      warning.status === 'approved' ? 'bg-green-100 text-green-800' :
                      warning.status === 'pending_review' ? 'bg-orange-100 text-orange-800' :
                      warning.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      warning.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {safeRenderText(warning.status, 'Unknown').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(warning)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {filteredWarnings.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No warnings found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' || filterLevel !== 'all' || filterDepartment !== 'all'
              ? 'Try adjusting your search criteria or filters.'
              : 'No warnings have been created yet.'}
          </p>
          {(searchTerm || filterStatus !== 'all' || filterLevel !== 'all' || filterDepartment !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterLevel('all');
                setFilterDepartment('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {filteredWarnings.length} total warnings
          </div>
        </div>
      )}

      {/* Working Modal with Full Functionality */}
      <WarningDetailsModal
        warning={selectedWarning}
        isOpen={showDetails}
        onClose={handleCloseModal}
        onApprove={handleApproveWarning}
        onReject={handleRejectWarning}
        canTakeAction={canTakeAction}
        userRole={userRole}
      />
    </div>
  );
};

export default WarningsReviewDashboard;