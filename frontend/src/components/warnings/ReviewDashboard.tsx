import Logger from '../../utils/logger';
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
import { ProofOfDeliveryModal } from './modals/ProofOfDeliveryModal';
import { AppealModal } from './modals/AppealModal';
import { WarningArchive } from './WarningArchive';

// Warning interface imported from API layer types

interface WarningsReviewProps {
  organizationId?: string; // Optional - will get from auth context
  onClose?: () => void;
  PDFGenerationService?: any;
  DataService?: any;
  canTakeAction?: boolean;
  userRole?: string;
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

// Helper function to check if warning is within appeal period
const isWithinAppealPeriod = (warning: Warning): boolean => {
  if (!warning.issueDate) return false;
  
  // Handle Firestore timestamp format
  const issueDate = warning.issueDate.seconds 
    ? new Date(warning.issueDate.seconds * 1000)
    : new Date(warning.issueDate);
  
  // Appeal period starts from when warning was issued, not delivered
  const appealDeadline = new Date(issueDate);
  
  // Add appeal period (typically 30 days for warnings)
  appealDeadline.setDate(appealDeadline.getDate() + 30);
  
  const now = new Date();
  
  return now <= appealDeadline;
};

export const WarningsReviewDashboard: React.FC<WarningsReviewProps> = ({
  organizationId: propOrganizationId,
  onClose,
  PDFGenerationService,
  DataService: DataServiceProp,
  canTakeAction = false,
  userRole = 'viewer',
}) => {
  const { user, organization } = useAuth();
  const organizationId = propOrganizationId || organization?.id;
  
  Logger.debug('🔧 [WarningsReviewDashboard] Using API layer version')

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
  const [showProofOfDelivery, setShowProofOfDelivery] = useState(false);
  const [deliveryWarning, setDeliveryWarning] = useState<Warning | null>(null);
  
  // Appeal modal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealWarning, setAppealWarning] = useState<Warning | null>(null);

  // View mode state - archive or main warnings
  const [viewMode, setViewMode] = useState<'warnings' | 'archive'>('warnings');

  const itemsPerPage = 10;

  // Load warnings
// Add this to your WarningsReviewDashboard.tsx file
// Replace your existing loadWarnings function with this debug version:

// Replace your loadWarnings function in WarningsReviewDashboard.tsx with this fixed version:

// Add this to your WarningsReviewDashboard.tsx - replace the existing loadWarnings function:

// Replace your loadWarnings function with this security-safe version:

const loadWarnings = useCallback(async () => {
  if (!organizationId) {
    Logger.warn('No organization ID available for loading warnings')
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    Logger.debug('🔄 Loading warnings via API layer for org:', organizationId)
    const data = await API.warnings.getAll(organizationId);
    
    // Sort by creation date (newest first)
    const sortedWarnings = data.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    
    setWarnings(sortedWarnings);
    setFilteredWarnings(sortedWarnings);
    Logger.success(4367)
    
  } catch (error) {
    Logger.error('❌ Failed to load warnings:', error)
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
    Logger.debug('Opening warning details for:', warning.id)
    setSelectedWarning(warning);
    setShowDetails(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    Logger.debug('Closing warning details modal')
    setShowDetails(false);
    setSelectedWarning(null);
  }, []);

  // Enhanced appeal submission with legal compliance
  const handleAppealSubmission = useCallback(async (appealData: {
    warningId: string;
    grounds: string;
    additionalDetails: string;
    requestedOutcome: string;
  }) => {
    try {
      setLoading(true);
      
      // Submit appeal with complete legal documentation
      await API.warnings.update(appealData.warningId, {
        appealSubmitted: true,
        appealDate: new Date(),
        status: 'appealed',
        appealDetails: {
          grounds: appealData.grounds,
          details: appealData.additionalDetails,
          requestedOutcome: appealData.requestedOutcome,
          submittedAt: new Date(),
          submittedBy: user?.email || 'Employee'
        }
      });
      
      Logger.success(`Legal appeal submitted for warning ${appealData.warningId}`)
      await loadWarnings(); // Refresh the list
      
      // Close modal and show success
      setShowAppealModal(false);
      setAppealWarning(null);
      
      // Success notification
      alert('Appeal submitted successfully. HR will review your appeal within 5 working days as per company policy.');
      
    } catch (error) {
      Logger.error('Failed to submit appeal:', error)
      throw new Error('Failed to submit appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadWarnings, user]);

  // Appeal management functions - HR Only
  const handleAppealOutcome = useCallback(async (warningId: string, outcome: 'upheld' | 'overturned' | 'modified') => {
    try {
      setLoading(true);
      
      // Update warning with appeal outcome
      await API.warnings.update(warningId, {
        status: outcome === 'overturned' ? 'expired' : 'acknowledged',
        appealOutcome: outcome,
        appealDate: new Date()
      });
      
      Logger.success(`Appeal ${outcome} for warning ${warningId}`)
      await loadWarnings(); // Refresh the list
    } catch (error) {
      Logger.error('Failed to process appeal:', error)
      setError('Failed to process appeal');
    } finally {
      setLoading(false);
    }
  }, [loadWarnings]);

  // View warning details handler
  const handleViewWarning = useCallback((warning: any) => {
    Logger.debug('Opening warning details:', warning.id)
    setSelectedWarning(warning);
    setShowDetails(true);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
          <h3 className="text-md font-medium text-gray-900 mb-1">Loading Warnings</h3>
          <p className="text-sm text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-md font-medium text-gray-900 mb-1">Error Loading Warnings</h3>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button 
            onClick={loadWarnings}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
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
    <div className="p-4">
      {/* Compact Header - Desktop Optimized */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Warning Management</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {warnings.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('archive')}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
          <button
            onClick={loadWarnings}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conditional rendering based on view mode */}
      {viewMode === 'archive' ? (
        <WarningArchive onBack={() => setViewMode('warnings')} />
      ) : (
        <>
      {/* Compact Search and Filters Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search warnings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="issued">Issued</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="appealed">Under Appeal</option>
            <option value="expired">Expired</option>
          </select>
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="verbal">Verbal</option>
            <option value="written">Written</option>
            <option value="final">Final</option>
            <option value="dismissal">Dismissal</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            More
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="employee-asc">Employee A-Z</option>
                <option value="employee-desc">Employee Z-A</option>
                <option value="level-asc">Level (Low to High)</option>
                <option value="level-desc">Level (High to Low)</option>
              </select>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium">Total</p>
              <p className="text-lg font-bold text-gray-900">{warnings.length}</p>
            </div>
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs font-medium">Active</p>
              <p className="text-lg font-bold text-green-900">
                {warnings.filter(w => w.isActive).length}
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-xs font-medium">Undelivered</p>
              <p className="text-lg font-bold text-orange-900">
                {warnings.filter(w => w.deliveryStatus !== 'delivered').length}
              </p>
            </div>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-xs font-medium">Critical</p>
              <p className="text-lg font-bold text-red-900">
                {warnings.filter(w => w.level === 'final' || w.level === 'dismissal').length}
              </p>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Compact Results Bar */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-600">
          {filteredWarnings.length} warnings {filteredWarnings.length !== warnings.length && `(filtered from ${warnings.length})`}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Modern Compact Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Warning
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedWarnings.map((warning, index) => (
                <tr key={warning.id || `warning-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {safeRenderText(warning.employeeName)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {safeRenderText(warning.employeeNumber)} • {safeRenderText(warning.department)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      warning.level === 'verbal' ? 'bg-blue-100 text-blue-800' :
                      warning.level === 'written' ? 'bg-yellow-100 text-yellow-800' :
                      warning.level === 'final' ? 'bg-red-100 text-red-800' :
                      warning.level === 'dismissal' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {warning.level === 'verbal' ? 'Verbal' :
                       warning.level === 'written' ? 'Written' :
                       warning.level === 'final' ? 'Final' :
                       warning.level === 'dismissal' ? 'Dismissal' : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {safeRenderText(warning.category)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {warning.issueDate ? 
                      new Date(warning.issueDate.seconds ? warning.issueDate.seconds * 1000 : warning.issueDate).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      warning.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                      warning.status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                      warning.status === 'appealed' ? 'bg-orange-100 text-orange-800' :
                      warning.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {warning.status === 'issued' ? 'Issued' :
                       warning.status === 'acknowledged' ? 'Acknowledged' :
                       warning.status === 'appealed' ? 'Under Appeal' :
                       warning.status === 'expired' ? 'Expired' :
                       safeRenderText(warning.status, 'Pending')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(warning)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                      >
                        View
                      </button>
                      
                      {/* Appeal Management - HR Only */}
                      {warning.status === 'appealed' && (
                        <>
                          <button
                            onClick={() => handleAppealOutcome(warning.id, 'upheld')}
                            className="text-green-600 hover:text-green-800 text-xs px-2 py-1 hover:bg-green-50 rounded transition-colors"
                            title="Uphold Warning"
                          >
                            Uphold
                          </button>
                          <button
                            onClick={() => handleAppealOutcome(warning.id, 'overturned')}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded transition-colors"
                            title="Overturn Warning"
                          >
                            Overturn
                          </button>
                        </>
                      )}
                      
                      {warning.deliveryStatus !== 'delivered' && warning.status !== 'appealed' && (
                        <button
                          onClick={() => {
                            setDeliveryWarning(warning);
                            setShowProofOfDelivery(true);
                          }}
                          className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 hover:bg-orange-50 rounded transition-colors"
                        >
                          Deliver
                        </button>
                      )}
                      
                      {warning.status !== 'appealed' && isWithinAppealPeriod(warning) && (
                        <button
                          onClick={() => {
                            setAppealWarning(warning);
                            setShowAppealModal(true);
                          }}
                          className="text-amber-600 hover:text-amber-800 text-xs px-2 py-1 hover:bg-amber-50 rounded transition-colors"
                          title={(() => {
                            const issueDate = warning.issueDate.seconds 
                              ? new Date(warning.issueDate.seconds * 1000)
                              : new Date(warning.issueDate);
                            const appealDeadline = new Date(issueDate);
                            appealDeadline.setDate(appealDeadline.getDate() + 30);
                            return `Appeal this warning (deadline: ${appealDeadline.toLocaleDateString()})`;
                          })()}
                        >
                          Appeal
                        </button>
                      )}
                      
                      {warning.status !== 'appealed' && !isWithinAppealPeriod(warning) && (
                        <span className="text-gray-500 text-xs px-2 py-1" title="Appeal period has expired">
                          Appeal Expired
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Empty State */}
      {filteredWarnings.length === 0 && !loading && (
        <div className="text-center py-8">
          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-md font-medium text-gray-900 mb-1">No warnings found</h3>
          <p className="text-sm text-gray-600 mb-3">
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
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Compact Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-4 gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
        </div>
      )}

      {/* Working Modal with Full Functionality */}
      <WarningDetailsModal
        warning={selectedWarning}
        isOpen={showDetails}
        onClose={handleCloseModal}
        canTakeAction={canTakeAction}
        userRole={userRole}
      />

      {/* Proof of Delivery Modal */}
      {deliveryWarning && (
        <ProofOfDeliveryModal
          isOpen={showProofOfDelivery}
          onClose={() => {
            setShowProofOfDelivery(false);
            setDeliveryWarning(null);
          }}
          warningId={deliveryWarning.id || ''}
          employeeName={safeRenderText(deliveryWarning.employee)}
          deliveryMethod={deliveryWarning.deliveryMethod || 'email'}
          onDeliveryConfirmed={async (proofData) => {
            try {
              // Upload proof and update warning status
              await API.warnings.updateDeliveryStatus(proofData.warningId, {
                status: 'delivered',
                deliveredAt: proofData.deliveredAt,
                deliveryMethod: proofData.deliveryMethod,
                proofImage: proofData.proofImage
              });

              // Refresh warnings list
              await loadWarnings();
              
              // Close modal
              setShowProofOfDelivery(false);
              setDeliveryWarning(null);
            } catch (error) {
              console.error('Failed to confirm delivery:', error);
              throw error;
            }
          }}
        />
      )}

      {/* Appeal Modal - Legal SA Compliant */}
      {showAppealModal && appealWarning && (
        <AppealModal
          isOpen={showAppealModal}
          onClose={() => {
            setShowAppealModal(false);
            setAppealWarning(null);
          }}
          warning={{
            id: appealWarning.id,
            employeeName: appealWarning.employeeName,
            category: appealWarning.category,
            level: appealWarning.level,
            issueDate: appealWarning.issueDate,
            description: appealWarning.description || 'No description provided'
          }}
          onAppealSubmit={handleAppealSubmission}
        />
      )}
        </>
      )}

    </div>
  );
};

export default WarningsReviewDashboard;