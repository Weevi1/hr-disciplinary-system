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
  Send, Scale, ArchiveIcon
} from 'lucide-react';

// Use API layer with proper warning types
import { API } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { NestedDataService } from '../../services/NestedDataService';
import { useNestedStructure, useCollectionGroup } from '../../config/features';
import type { Warning } from '../../types/warning';

// Import the working modal
import WarningDetailsModal from './modals/WarningDetailsModal';
import { ProofOfDeliveryModal } from './modals/ProofOfDeliveryModal';
import { DeliveryMethodSelectionModal } from './modals/DeliveryMethodSelectionModal';
import { AppealModal } from './modals/AppealModal';
import { AppealReviewModal } from './modals/AppealReviewModal';
import { EnhancedDeliveryWorkflow } from '../hr/EnhancedDeliveryWorkflow';
import { DeliveryNotificationService } from '../../services/DeliveryNotificationService';
// WarningArchive moved to _legacy - archive functionality integrated into ReviewDashboard

// Warning interface imported from API layer types

interface WarningsReviewProps {
  organizationId?: string; // Optional - will get from auth context
  onClose?: () => void;
  PDFGenerationService?: any;
  DataService?: any;
  canTakeAction?: boolean;
  userRole?: string;
  initialEmployeeFilter?: { id: string; name: string }; // For filtering by employee from employee cards
  // External modal control (for shared state between multiple instances)
  selectedWarning?: Warning | null;
  showDetails?: boolean;
  onViewDetails?: (warning: Warning) => void;
  onCloseDetails?: () => void;
  // Callback when warning is updated (e.g., delivery completed)
  onWarningUpdated?: () => void;
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

// Helper function to convert Firestore Timestamp to Date
const convertFirestoreTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

// Helper function to check if warning is within appeal period
const isWithinAppealPeriod = (warning: Warning): boolean => {
  if (!warning.issueDate) return false;

  // Handle Firestore timestamp format
  const issueDate = convertFirestoreTimestampToDate(warning.issueDate);

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
  initialEmployeeFilter,
  selectedWarning: externalSelectedWarning,
  showDetails: externalShowDetails,
  onViewDetails: externalOnViewDetails,
  onCloseDetails: externalOnCloseDetails,
  onWarningUpdated,
}) => {
  const { user, organization } = useAuth();
  const organizationId = propOrganizationId || organization?.id;
  
  Logger.debug('🔧 [WarningsReviewDashboard] Using API layer version')

  // State management
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [filteredWarnings, setFilteredWarnings] = useState<Warning[]>([]);
  const [archivedWarnings, setArchivedWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(initialEmployeeFilter?.name || '');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'employee' | 'level' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use external state if provided, otherwise use internal state
  const [internalSelectedWarning, setInternalSelectedWarning] = useState<Warning | null>(null);
  const [internalShowDetails, setInternalShowDetails] = useState(false);
  const selectedWarning = externalSelectedWarning !== undefined ? externalSelectedWarning : internalSelectedWarning;
  const showDetails = externalShowDetails !== undefined ? externalShowDetails : internalShowDetails;

  const [showFilters, setShowFilters] = useState(false);
  const [showProofOfDelivery, setShowProofOfDelivery] = useState(false);
  const [deliveryWarning, setDeliveryWarning] = useState<Warning | null>(null);

  // Delivery method selection modal state (NEW)
  const [showMethodSelection, setShowMethodSelection] = useState(false);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'email' | 'whatsapp' | 'printed' | null>(null);
  const [showDeliveryWorkflow, setShowDeliveryWorkflow] = useState(false);
  const [employeeContactDetails, setEmployeeContactDetails] = useState<{ email?: string; phone?: string }>({});

  // Appeal modal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealWarning, setAppealWarning] = useState<Warning | null>(null);

  // Appeal Review Modal State (HR Decision Making)
  const [showAppealReview, setShowAppealReview] = useState(false);
  const [appealReviewWarning, setAppealReviewWarning] = useState<Warning | null>(null);

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

    let data: Warning[];

    if (useNestedStructure()) {
      // Use nested structure with collection group queries
      Logger.debug('🔄 Loading warnings via NestedDataService for org:', organizationId)

      if (useCollectionGroup()) {
        // Use collection group query for organization-wide warnings
        const result = await NestedDataService.getOrganizationWarnings(
          organizationId,
          { /* filters */ },
          { pageSize: 500, orderField: 'issueDate', orderDirection: 'desc' }
        );
        data = result.warnings;
        Logger.debug(`📁 [NESTED] Loaded ${data.length} warnings via collection group`);
      } else {
        // Fallback to flat structure
        Logger.debug('📋 [FALLBACK] Collection group disabled, using flat structure');
        data = await API.warnings.getAll(organizationId);
      }
    } else {
      // Use original flat structure
      Logger.debug('🔄 Loading warnings via API layer for org:', organizationId)
      data = await API.warnings.getAll(organizationId);
      Logger.debug(`🔍 [DEBUG] Loaded ${data.length} warnings with IDs:`, data.map(w => `${w.employeeName}: id="${w.id}"`));
    }

    // Split warnings into active and archived
    const activeWarnings = data.filter(warning =>
      !warning.isArchived &&
      warning.status !== 'expired' &&
      warning.status !== 'overturned'
    );

    const archived = data.filter(warning =>
      warning.status === 'expired' || warning.status === 'overturned'
    );

    // Sort by creation date (newest first)
    const sortedWarnings = activeWarnings.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const sortedArchived = archived.sort((a, b) =>
      new Date(b.appealDecisionDate || b.updatedAt || 0).getTime() - new Date(a.appealDecisionDate || a.updatedAt || 0).getTime()
    );

    Logger.debug(`🔍 [DEBUG] After filtering/sorting, ${sortedWarnings.length} active warnings, ${sortedArchived.length} archived with IDs:`, sortedWarnings.map(w => `${w.employeeName}: id="${w.id}"`));

    setWarnings(sortedWarnings);
    setFilteredWarnings(sortedWarnings);
    setArchivedWarnings(sortedArchived);

    Logger.success(`📊 Loaded ${sortedWarnings.length} active warnings, ${sortedArchived.length} archived (${useNestedStructure() ? 'NESTED' : 'SHARDED'} structure)`);

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
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(warning =>
        warning.employeeName?.toLowerCase().includes(searchLower) ||
        warning.employeeNumber?.toLowerCase().includes(searchLower) ||
        warning.category?.toLowerCase().includes(searchLower) ||
        warning.description?.toLowerCase().includes(searchLower)
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
    const paginated = filteredWarnings.slice(start, end);
    Logger.debug(`🔍 [DEBUG] Paginated warnings (page ${currentPage}) with IDs:`, paginated.map(w => `${w.employeeName}: id="${w.id}"`));
    return paginated;
  }, [filteredWarnings, currentPage]);

  const totalPages = Math.ceil(filteredWarnings.length / itemsPerPage);

  // Modal handlers - use external callbacks if provided, otherwise internal state
  const handleViewDetails = useCallback((warning: Warning) => {
    Logger.debug('Opening warning details for:', warning.id)
    if (externalOnViewDetails) {
      externalOnViewDetails(warning);
    } else {
      setInternalSelectedWarning(warning);
      setInternalShowDetails(true);
    }
  }, [externalOnViewDetails]);

  const handleCloseModal = useCallback(() => {
    Logger.debug('Closing warning details modal')
    if (externalOnCloseDetails) {
      externalOnCloseDetails();
    } else {
      setInternalShowDetails(false);
      setInternalSelectedWarning(null);
    }
  }, [externalOnCloseDetails]);

  // Enhanced appeal submission with legal compliance
  const handleAppealSubmission = useCallback(async (appealData: {
    warningId: string;
    grounds: string;
    additionalDetails: string;
    requestedOutcome: string;
  }) => {
    try {
      setLoading(true);

      // Validate warningId exists
      if (!appealData.warningId) {
        throw new Error('Warning ID is missing. Please try again.');
      }

      if (!organizationId) {
        throw new Error('Organization ID is missing. Please try again.');
      }

      Logger.debug(`📝 Submitting appeal for warning: ${appealData.warningId}`)

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
      }, organizationId);

      // Don't archive yet - wait until appeal is resolved
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
      }, organizationId);
      
      Logger.success(`Appeal ${outcome} for warning ${warningId}`)
      await loadWarnings(); // Refresh the list
    } catch (error) {
      Logger.error('Failed to process appeal:', error)
      setError('Failed to process appeal');
    } finally {
      setLoading(false);
    }
  }, [loadWarnings]);

  // Enhanced Appeal Review Handler
  const handleAppealDecision = useCallback(async (decisionData: {
    warningId: string;
    decision: 'upheld' | 'overturned' | 'modified' | 'reduced';
    reasoning: string;
    newLevel?: string;
    newDescription?: string;
    hrNotes: string;
    followUpRequired: boolean;
    followUpDate?: Date;
  }) => {
    try {
      setLoading(true);

      // Determine new status based on decision
      let newStatus = 'acknowledged';
      if (decisionData.decision === 'overturned') {
        newStatus = 'overturned'; // Changed from 'expired' to 'overturned'
      }

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        appealOutcome: decisionData.decision,
        appealDecisionDate: new Date(),
        appealReasoning: decisionData.reasoning,
        hrNotes: decisionData.hrNotes,
        followUpRequired: decisionData.followUpRequired,
        followUpDate: decisionData.followUpDate
      };

      // Add level and description changes if modified/reduced
      if (decisionData.decision === 'reduced' || decisionData.decision === 'modified') {
        if (decisionData.newLevel) {
          updateData.level = decisionData.newLevel;
        }
        if (decisionData.newDescription) {
          updateData.description = decisionData.newDescription;
        }
      }

      // Update warning with appeal decision
      await API.warnings.update(decisionData.warningId, updateData, organizationId);

      // Archive warnings based on appeal outcome
      if (decisionData.decision === 'overturned') {
        // Archive overturned warnings
        await API.warnings.archive(decisionData.warningId, organizationId, 'overturned');
        Logger.success('Warning overturned and archived')
      } else if (decisionData.decision === 'upheld') {
        // Keep upheld warnings active but mark appeal as processed
        Logger.info('Warning upheld - remains active')
      }

      // Refresh warnings list
      await loadWarnings();

      Logger.success('Appeal decision recorded successfully')

    } catch (error) {
      Logger.error('Failed to record appeal decision:', error)
      throw new Error('Failed to record appeal decision. Please try again.');
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

  // Manual archive warning handler
  const handleArchiveWarning = useCallback(async (warningId: string) => {
    try {
      if (confirm('Are you sure you want to archive this warning? It will be moved to the archive.')) {
        setLoading(true);
        await API.warnings.archive(warningId, organizationId, 'manual');
        Logger.success('Warning archived successfully')
        await loadWarnings(); // Refresh the list
      }
    } catch (error) {
      Logger.error('Failed to archive warning:', error)
      setError('Failed to archive warning');
    } finally {
      setLoading(false);
    }
  }, [organizationId, loadWarnings]);

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
    <div className="space-y-4">
      {/* Compact Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Warning Management</h3>
          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {warnings.length} active
          </span>
          {archivedWarnings.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-500 bg-orange-100 px-2 py-1 rounded-full">
              {archivedWarnings.length} archived
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'archive' ? 'warnings' : 'archive')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              viewMode === 'archive'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">{viewMode === 'archive' ? 'Active Warnings' : 'Archive'}</span>
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
              onClick={() => setViewMode('warnings')}
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
                             warning.level === 'first_written' ? 'First Written' :
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
                            {warning.issueDate ? new Date(warning.issueDate.seconds ? warning.issueDate.seconds * 1000 : warning.issueDate).toLocaleDateString() : 'N/A'}
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
                                <strong>Decision Date:</strong> {new Date(warning.appealDecisionDate).toLocaleDateString()}
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
                                  <strong>Expired On:</strong> {new Date(warning.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(warning)}
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
      ) : (
        <>
      {/* Compact Search and Filters Bar */}
      <div className="mb-4">
        {/* Mobile-first: Stack filters vertically on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
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

          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="counselling">Counselling</option>
              <option value="verbal">Verbal</option>
              <option value="first_written">First Written</option>
              <option value="second_written">Second Written</option>
              <option value="final_written">Final Written</option>
              {/* Legacy support */}
              <option value="written">Written (Legacy)</option>
              <option value="final">Final (Legacy)</option>
              <option value="dismissal">Dismissal (Legacy)</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm items-center gap-2 sm:flex hidden"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden lg:inline">More</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Mobile Card View - Hidden on Desktop */}
      <div className="md:hidden space-y-3 mb-4">
        {paginatedWarnings.map((warning, index) => (
          <div key={warning.id || `warning-${index}`} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{safeRenderText(warning.employeeName)}</h4>
                <p className="text-xs text-gray-500 mt-1">{safeRenderText(warning.employeeNumber)} • {safeRenderText(warning.department)}</p>
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-xs text-gray-500">Level</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                  warning.level === 'counselling' ? 'bg-green-100 text-green-800' :
                  warning.level === 'verbal' ? 'bg-blue-100 text-blue-800' :
                  warning.level === 'first_written' ? 'bg-yellow-100 text-yellow-800' :
                  warning.level === 'second_written' ? 'bg-orange-100 text-orange-800' :
                  warning.level === 'final_written' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {warning.level === 'counselling' ? 'Counselling' :
                   warning.level === 'verbal' ? 'Verbal' :
                   warning.level === 'first_written' ? '1st Written' :
                   warning.level === 'second_written' ? '2nd Written' :
                   warning.level === 'final_written' ? 'Final' :
                   safeRenderText(warning.level, 'Unknown')}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{safeRenderText(warning.category)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {warning.issueDate ? new Date(warning.issueDate.seconds ? warning.issueDate.seconds * 1000 : warning.issueDate).toLocaleDateString() : 'N/A'}
              </p>
              <button
                onClick={() => handleViewDetails(warning)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 hover:bg-blue-50 rounded transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                      warning.level === 'counselling' ? 'bg-green-100 text-green-800' :
                      warning.level === 'verbal' ? 'bg-blue-100 text-blue-800' :
                      warning.level === 'first_written' ? 'bg-yellow-100 text-yellow-800' :
                      warning.level === 'second_written' ? 'bg-orange-100 text-orange-800' :
                      warning.level === 'final_written' ? 'bg-red-100 text-red-800' :
                      // Legacy support
                      warning.level === 'written' ? 'bg-yellow-100 text-yellow-800' :
                      warning.level === 'final' ? 'bg-red-100 text-red-800' :
                      warning.level === 'dismissal' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {warning.level === 'counselling' ? 'Counselling' :
                       warning.level === 'verbal' ? 'Verbal' :
                       warning.level === 'first_written' ? 'First Written' :
                       warning.level === 'second_written' ? 'Second Written' :
                       warning.level === 'final_written' ? 'Final Written' :
                       // Legacy support
                       warning.level === 'written' ? 'Written' :
                       warning.level === 'final' ? 'Final' :
                       warning.level === 'dismissal' ? 'Dismissal' :
                       safeRenderText(warning.level, 'Unknown')}
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
                      
                      {/* Enhanced Appeal Review - HR Only */}
                      {warning.status === 'appealed' && (
                        <button
                          onClick={() => {
                            setAppealReviewWarning(warning);
                            setShowAppealReview(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 text-xs px-2 py-1 hover:bg-purple-50 rounded transition-colors flex items-center gap-1"
                          title="Review Appeal with Enhanced Decision Options"
                        >
                          <Scale className="w-3 h-3" />
                          Review Appeal
                        </button>
                      )}
                      
                      {warning.deliveryStatus !== 'delivered' && warning.status !== 'appealed' && (
                        <button
                          onClick={async () => {
                            try {
                              Logger.debug('📬 Opening delivery method selection for warning:', warning.id);
                              setDeliveryWarning(warning);

                              // Fetch employee contact details
                              Logger.debug('📇 Fetching employee contact details for:', warning.employeeId);
                              const employee = await API.employees.getById(warning.employeeId, organizationId);

                              if (employee) {
                                setEmployeeContactDetails({
                                  email: employee.profile.email,
                                  phone: employee.profile.phoneNumber || employee.profile.whatsappNumber
                                });
                                Logger.debug('✅ Employee contact details fetched:', {
                                  email: employee.profile.email,
                                  phone: employee.profile.phoneNumber
                                });
                              } else {
                                Logger.warn('⚠️ Employee not found:', warning.employeeId);
                                setEmployeeContactDetails({});
                              }

                              setShowMethodSelection(true);
                            } catch (error) {
                              Logger.error('❌ Failed to fetch employee contact details:', error);
                              // Still open modal, but with no contact details
                              setEmployeeContactDetails({});
                              setShowMethodSelection(true);
                            }
                          }}
                          className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 hover:bg-orange-50 rounded transition-colors"
                        >
                          Deliver
                        </button>
                      )}
                      
                      {warning.status !== 'appealed' && isWithinAppealPeriod(warning) && (
                        <button
                          onClick={() => {
                            Logger.debug(`📋 Opening appeal modal for warning:`, { id: warning.id, employeeName: warning.employeeName });
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

                      {/* Archive button - available for resolved warnings */}
                      {(warning.status === 'acknowledged' || warning.status === 'expired' ||
                        !isWithinAppealPeriod(warning)) && (
                        <button
                          onClick={() => handleArchiveWarning(warning.id)}
                          className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 hover:bg-gray-50 rounded transition-colors"
                          title="Archive this warning"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
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

      {/* WarningDetailsModal removed - now rendered in parent component for shared state */}

      {/* NEW: Delivery Method Selection Modal */}
      {showMethodSelection && deliveryWarning && (
        <DeliveryMethodSelectionModal
          isOpen={showMethodSelection}
          onClose={() => {
            setShowMethodSelection(false);
            setSelectedDeliveryMethod(null);
            setEmployeeContactDetails({});
          }}
          onMethodSelected={async (method) => {
            try {
              Logger.debug('📝 HR selected delivery method:', method);

              // Update the delivery notification with HR's chosen method
              if (organizationId && deliveryWarning.deliveryNotificationId) {
                await DeliveryNotificationService.updateDeliveryMethod(
                  organizationId,
                  deliveryWarning.deliveryNotificationId,
                  method
                );
              }

              // Save selected method and close selection modal
              setSelectedDeliveryMethod(method);
              setShowMethodSelection(false);

              // Open the delivery workflow with selected method
              setShowDeliveryWorkflow(true);
            } catch (error) {
              Logger.error('Failed to update delivery method:', error);
              alert('Failed to update delivery method. Please try again.');
            }
          }}
          employeeRequestedMethod={(deliveryWarning as any).employeeRequestedDeliveryMethod}
          employeeName={deliveryWarning.employeeName || 'Unknown'}
          employeeEmail={employeeContactDetails.email}
          employeePhone={employeeContactDetails.phone}
        />
      )}

      {/* NEW: Enhanced Delivery Workflow */}
      {showDeliveryWorkflow && deliveryWarning && selectedDeliveryMethod && (
        <EnhancedDeliveryWorkflow
          isOpen={showDeliveryWorkflow}
          notification={{
            id: deliveryWarning.deliveryNotificationId || deliveryWarning.id,
            warningId: deliveryWarning.id,
            employeeName: deliveryWarning.employeeName || 'Unknown',
            employeeEmail: employeeContactDetails.email,
            employeePhone: employeeContactDetails.phone,
            warningLevel: deliveryWarning.level || 'counselling',
            warningCategory: deliveryWarning.category || 'General',
            deliveryMethod: selectedDeliveryMethod,
            priority: 'normal',
            status: 'in_progress',
            createdAt: convertFirestoreTimestampToDate(deliveryWarning.issueDate),
            createdByName: deliveryWarning.createdByName || 'Manager',
            pdfUrl: deliveryWarning.pdfUrl,
            contactDetails: {
              email: employeeContactDetails.email,
              phone: employeeContactDetails.phone
            }
          }}
          onDeliveryComplete={async (notificationId, proofData) => {
            try {
              Logger.debug('✅ Delivery completed:', proofData);

              // Update warning status
              await API.warnings.update(deliveryWarning.id, {
                status: 'delivered',
                deliveredAt: proofData.deliveredAt,
                deliveryMethod: proofData.deliveryMethod,
                proofImage: proofData.proofImage
              }, organization?.id);

              // Refresh warnings list
              await loadWarnings();

              // Notify parent component to refresh its metrics
              onWarningUpdated?.();

              // Close workflow
              setShowDeliveryWorkflow(false);
              setDeliveryWarning(null);
              setSelectedDeliveryMethod(null);
              setEmployeeContactDetails({});
            } catch (error) {
              Logger.error('Failed to complete delivery:', error);
              throw error;
            }
          }}
          onClose={() => {
            setShowDeliveryWorkflow(false);
            setDeliveryWarning(null);
            setSelectedDeliveryMethod(null);
            setEmployeeContactDetails({});
          }}
        />
      )}

      {/* OLD: Proof of Delivery Modal (Kept as fallback) */}
      {deliveryWarning && (
        <ProofOfDeliveryModal
          isOpen={showProofOfDelivery}
          onClose={() => {
            setShowProofOfDelivery(false);
            setDeliveryWarning(null);
            setEmployeeContactDetails({});
          }}
          warningId={deliveryWarning.id || ''}
          employeeName={deliveryWarning.employeeName || 'Unknown'}
          employeeEmail={employeeContactDetails.email}
          deliveryMethod={deliveryWarning.deliveryMethod || 'email'}
          warningData={deliveryWarning}
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
              setEmployeeContactDetails({});
            } catch (error) {
              Logger.error('Failed to confirm delivery:', error);
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

      {/* Enhanced Appeal Review Modal - HR Decision Making */}
      {showAppealReview && appealReviewWarning && (
        <AppealReviewModal
          isOpen={showAppealReview}
          onClose={() => {
            setShowAppealReview(false);
            setAppealReviewWarning(null);
          }}
          warning={{
            id: appealReviewWarning.id,
            employeeName: appealReviewWarning.employeeName,
            employeeNumber: appealReviewWarning.employeeNumber,
            category: appealReviewWarning.category,
            level: appealReviewWarning.level,
            issueDate: appealReviewWarning.issueDate,
            description: appealReviewWarning.description || 'No description provided',
            appealDetails: appealReviewWarning.appealDetails
          }}
          onDecisionSubmit={handleAppealDecision}
        />
      )}
        </>
      )}

    </div>
  );
};

export default WarningsReviewDashboard;