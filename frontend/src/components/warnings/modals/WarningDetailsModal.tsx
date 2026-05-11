import Logger from '../../../utils/logger';
// frontend/src/components/warnings/WarningDetailsModal.tsx
// 🚀 WARNING DETAILS MODAL V2 - PRODUCTION-READY
// ✅ Clean, professional design optimized for enterprise use
// 🖥️ Desktop-first with excellent information hierarchy
// 📋 Production-ready UX with streamlined workflows
// 🎯 Optimized for HR dashboard integration

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../../constants/zIndex';
import {
  X, AlertTriangle, Clock, CheckCircle, Eye, Shield, Scale, Building,
  Calendar, User, MapPin, FileText, Download, Share2,
  ChevronDown, ChevronUp, MessageSquare, Headphones,
  FileSignature, Badge, ExternalLink, Link, Copy, Loader2,
  Archive,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';
import { AudioPlaybackWidget } from '../AudioPlaybackWidget';
import { PDFPreviewModal } from '../enhanced/PDFPreviewModal';
import { SignatureDisplay } from '../SignatureDisplay';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { getLevelLabel } from '../../../services/UniversalCategories';

// Local helpers + theme tokens (extracted Phase 2 Tier 3D step 2)
import {
  safeText,
  safeDate,
  safeDateTime,
  toISODateString,
  getWarningTheme,
  type WarningTheme,
  type ActionState,
} from './warningDetailsHelpers';

// Nested dialog/modal components (extracted Phase 2 Tier 3D step 2)
import {
  ArchiveDialog,
  ResponseLinkPanel,
  AudioModalSimple,
  AudioModalFull,
  SignaturesModalSimple,
  SignaturesModalFull,
  IndividualSignatureModal,
} from './WarningDetailsDialogs';

// ============================================
// INTERFACES & TYPES
// ============================================

interface WarningDetailsModalProps {
  warning: any;
  isOpen: boolean;
  onClose: () => void;
  canTakeAction?: boolean;
  userRole?: string;
  className?: string;
  // Standard approval/rejection actions
  onApprove?: (warningId: string) => Promise<void>;
  onReject?: (warningId: string, reason: string) => Promise<void>;
  // HR Appeal functionality
  onAppealOutcome?: (outcome: 'upheld' | 'overturned' | 'modified') => void;
  canManageAppeals?: boolean;
  // Archive functionality
  onArchive?: (warningId: string, reason: string) => Promise<void>;
}

// ============================================
// MAIN COMPONENT
// ============================================

const WarningDetailsModal: React.FC<WarningDetailsModalProps> = ({
  warning,
  isOpen,
  onClose,
  canTakeAction = false,
  userRole = 'viewer',
  className = '',
  onApprove,
  onReject,
  onAppealOutcome,
  canManageAppeals = false,
  onArchive,
}) => {

  // ============================================
  // STATE HOOKS
  // ============================================
  
  const [currentView, setCurrentView] = useState<'overview' | 'details' | 'timeline'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [actionState, setActionState] = useState<ActionState>({ type: null, loading: false });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // 🎯 FIXED: Modal states for working buttons
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<{
    signature: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  
  // Response link state
  const [responseLink, setResponseLink] = useState<string | null>(null);
  const [responseLinkLoading, setResponseLinkLoading] = useState(false);
  const [responseLinkCopied, setResponseLinkCopied] = useState(false);

  // HR Appeal functionality state
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [appealOutcome, setAppealOutcome] = useState<'upheld' | 'overturned' | 'modified' | null>(null);
  const [appealNotes, setAppealNotes] = useState('');
  const [appealProcessing, setAppealProcessing] = useState(false);

  // Archive functionality state
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveProcessing, setArchiveProcessing] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  // ============================================
  // CONTEXT HOOKS
  // ============================================

  const { organization } = useOrganization();

  // ============================================
  // MEMOIZED DATA
  // ============================================

  const warningData = useMemo(() => {
    if (!warning) return null;
    
    return {
      id: warning.id || '',
      employeeName: safeText(warning.employeeName),
      employeeNumber: safeText(warning.employeeNumber),
      department: safeText(warning.department),
      position: safeText(warning.position),
      category: safeText(warning.category),
      level: warning.level || 'verbal',
      status: warning.status || 'issued',
      incidentDate: safeDate(warning.incidentDate),
      incidentTime: safeText(warning.incidentTime),
      incidentDateTime: safeDateTime(warning.incidentDate, warning.incidentTime),
      incidentLocation: safeText(warning.incidentLocation),
      description: safeText(warning.description),
      issueDate: safeDate(warning.issueDate),
      expiryDate: safeDate(warning.expiryDate),
      issuedByName: safeText(warning.issuedByName),
      deliveryMethod: safeText(warning.deliveryMethod),
      additionalNotes: safeText(warning.additionalNotes),
      
      // 🎯 FIXED: Enhanced data for working components
      hasAudio: Boolean(warning.audioRecording?.url),
      audioRecording: warning.audioRecording || null,
      hasPDF: Boolean(warning.pdfGenerated || warning.pdfFilename),
      hasSignatures: Boolean(warning.signatures && Object.keys(warning.signatures).length > 0),
      signatures: warning.signatures || { manager: null, employee: null },
      
      validityPeriod: warning.validityPeriod || 6,
      escalationReason: safeText(warning.escalationReason),
      acknowledgedAt: warning.acknowledgedAt ? safeDate(warning.acknowledgedAt) : null,
      acknowledgedBy: safeText(warning.acknowledgedBy),

      // Appeal information
      appealSubmitted: Boolean(warning.appealSubmitted),
      appealDate: warning.appealDate ? safeDate(warning.appealDate) : null,
      appealDetails: warning.appealDetails || null,
      appealOutcome: warning.appealOutcome || null,
      appealDecisionDate: warning.appealDecisionDate ? safeDate(warning.appealDecisionDate) : null,
      appealReasoning: safeText(warning.appealReasoning, ''),
      hrNotes: safeText(warning.hrNotes, ''),
      followUpRequired: Boolean(warning.followUpRequired),
      followUpDate: warning.followUpDate ? safeDate(warning.followUpDate) : null,

      createdAt: safeDate(warning.createdAt),
      updatedAt: safeDate(warning.updatedAt),
      isArchived: Boolean(warning.isArchived),
      archiveReason: warning.archiveReason || null,
    };
  }, [warning]);

  const theme = useMemo(() => {
    if (!warningData) return getWarningTheme('verbal', 'draft');
    return getWarningTheme(warningData.level, warningData.status);
  }, [warningData]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
      setCurrentView('overview');
      setExpandedSections(new Set(['summary']));
      setActionState({ type: null, loading: false });
      setShowRejectDialog(false);
      setRejectReason('');
      // Reset modal states
      setShowPDFPreview(false);
      setShowSignatureModal(false);
      setShowAudioModal(false);
      setSelectedSignature(null);
      setResponseLink(null);
      setResponseLinkCopied(false);
    }, 300);
  }, [onClose]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleApprove = useCallback(async () => {
    if (!onApprove || !warningData?.id) return;
    
    setActionState({ type: 'approve', loading: true });
    try {
      await onApprove(warningData.id);
      setTimeout(handleClose, 1000);
    } catch (error) {
      Logger.error('Failed to approve warning:', error)
      setActionState({ type: null, loading: false });
    }
  }, [onApprove, warningData?.id, handleClose]);

  const handleReject = useCallback(async () => {
    if (!onReject || !warningData?.id) return;
    
    setActionState({ type: 'reject', loading: true });
    try {
      await onReject(warningData.id, rejectReason);
      setTimeout(handleClose, 1000);
    } catch (error) {
      Logger.error('Failed to reject warning:', error)
      setActionState({ type: null, loading: false });
    }
  }, [onReject, warningData?.id, rejectReason, handleClose]);

  const handleRejectClick = useCallback(() => {
    setShowRejectDialog(true);
  }, []);

  // 🎯 FIXED: Working button handlers
  const handlePlayAudio = useCallback(() => {
    if (warningData?.hasAudio) {
      setShowAudioModal(true);
    }
  }, [warningData?.hasAudio]);

  const handlePreviewPDF = useCallback(() => {
    setShowPDFPreview(true);
  }, []);

  const handleGenerateResponseLink = useCallback(async () => {
    if (!warningData?.id || !organization?.id) return;
    setResponseLinkLoading(true);
    try {
      const generateToken = httpsCallable(functions, 'generateResponseToken');
      const result = await generateToken({
        warningId: warningData.id,
        organizationId: organization.id,
      });
      const data = result.data as { responseUrl: string };
      setResponseLink(data.responseUrl);
    } catch (error) {
      Logger.error('Failed to generate response link:', error);
    } finally {
      setResponseLinkLoading(false);
    }
  }, [warningData?.id, organization?.id]);

  const handleCopyResponseLink = useCallback(async () => {
    if (!responseLink) return;
    try {
      await navigator.clipboard.writeText(responseLink);
      setResponseLinkCopied(true);
      setTimeout(() => setResponseLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = responseLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setResponseLinkCopied(true);
      setTimeout(() => setResponseLinkCopied(false), 2000);
    }
  }, [responseLink]);

  const handlePrintAppealReport = useCallback(async () => {
    if (!warningData) return;

    try {
      Logger.debug('📋 Generating standalone appeal report...');

      // Appeal-report generator was extracted from PDFGenerationService in
      // Phase 2 Tier 3B and now lives in its own module.
      const { generateAppealReportPDF } = await import('../../../services/pdf/AppealReportGenerator');

      const pdfBlob = await generateAppealReportPDF({
        warningId: warning.id || 'N/A',
        employee: {
          firstName: warningData.employeeName.split(' ')[0] || 'Unknown',
          lastName: warningData.employeeName.split(' ').slice(1).join(' ') || 'Employee',
          employeeNumber: warningData.employeeNumber,
          department: warningData.department,
          position: warningData.position
        },
        category: warningData.category,
        warningLevel: warningData.level,
        issueDate: warning.issueDate?.seconds ? new Date(warning.issueDate.seconds * 1000) : new Date(),
        organization: {
          name: organization?.name || 'Organization',
          branding: organization?.branding
        },
        appealDetails: warningData.appealDetails ? {
          grounds: warningData.appealDetails.grounds,
          details: warningData.appealDetails.details,
          requestedOutcome: warningData.appealDetails.requestedOutcome,
          submittedAt: warningData.appealDetails.submittedAt ? new Date(warningData.appealDetails.submittedAt) : undefined,
          submittedBy: warningData.appealDetails.submittedBy
        } : undefined,
        appealOutcome: warningData.appealOutcome as 'upheld' | 'overturned' | 'modified' | 'reduced' | undefined,
        appealDecisionDate: warning.appealDecisionDate?.seconds ? new Date(warning.appealDecisionDate.seconds * 1000) : undefined,
        appealReasoning: warningData.appealReasoning,
        hrNotes: warningData.hrNotes,
        followUpRequired: warningData.followUpRequired,
        followUpDate: warning.followUpDate?.seconds ? new Date(warning.followUpDate.seconds * 1000) : undefined
      });

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Appeal_Report_${warning.id || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Logger.success('✅ Appeal report downloaded');
    } catch (error) {
      Logger.error('❌ Failed to generate appeal report:', error);
      console.error('Full error details:', error);
      console.error('Warning data:', warningData);
      console.error('Organization:', organization);
      alert(`Failed to generate appeal report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [warningData, warning, organization]);

  const handleViewSignatures = useCallback(() => {
    if (warningData?.hasSignatures) {
      setShowSignatureModal(true);
    }
  }, [warningData?.hasSignatures]);

  const handleViewSignature = useCallback((signatureType: 'manager' | 'employee') => {
    if (!warningData?.signatures) return;
    
    const signature = warningData.signatures[signatureType];
    if (!signature) return;

    setSelectedSignature({
      signature,
      title: `${signatureType.charAt(0).toUpperCase() + signatureType.slice(1)} Signature`,
      subtitle: `Warning ID: ${warningData.id} • ${warningData.employeeName}`
    });
    setShowSignatureModal(true);
  }, [warningData]);

  const handleArchive = useCallback(async () => {
    if (!onArchive || !warningData?.id || !archiveReason) return;
    setArchiveProcessing(true);
    try {
      await onArchive(warningData.id, archiveReason);
      setShowArchiveDialog(false);
      setArchiveReason('');
      setTimeout(handleClose, 500);
    } catch (error) {
      Logger.error('Failed to archive warning:', error);
    } finally {
      setArchiveProcessing(false);
    }
  }, [onArchive, warningData?.id, archiveReason, handleClose]);

  // ============================================
  // EARLY RETURN
  // ============================================

  if (!isOpen || !warningData) {
    return null;
  }

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderStatusBadge = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const statusConfig = {
      issued: { icon: FileText, text: 'Issued', color: 'bg-green-100 text-green-700' },
      delivered: { icon: CheckCircle, text: 'Delivered', color: 'bg-blue-100 text-blue-700' },
      acknowledged: { icon: CheckCircle, text: 'Acknowledged', color: 'bg-emerald-100 text-emerald-700' },
      appealed: { icon: Scale, text: 'Under Appeal', color: 'bg-purple-100 text-purple-700' },
      expired: { icon: FileText, text: 'Expired', color: 'bg-gray-100 text-gray-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.issued;
    const Icon = config.icon;
    
    return (
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-medium
        ${size === 'lg' ? 'text-sm' : 'text-xs'}
        ${config.color}
        backdrop-blur-sm border border-white/20
      `}>
        <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
        {config.text}
      </div>
    );
  };

  const renderLevelBadge = (level: string, size: 'sm' | 'lg' = 'sm') => {
    const levelConfig = {
      verbal: { text: 'Verbal Warning', intensity: 1 },
      first_written: { text: 'Written', intensity: 2 },
      second_written: { text: 'Second Written', intensity: 3 },
      final_written: { text: 'Final Written', intensity: 4 },
      dismissal: { text: 'Contact HR - Serious Offence', intensity: 5 }
    };

    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.verbal;
    
    return (
      <div className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold
        ${size === 'lg' ? 'text-base' : 'text-sm'}
        bg-gradient-to-r ${theme.primary} text-white
        shadow-lg backdrop-blur-sm
        relative overflow-hidden
      `}>
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
        <AlertTriangle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
        {config.text}
        <div className="flex gap-1 ml-2">
          {Array.from({ length: config.intensity }, (_, i) => (
            <div key={i} className="w-1 h-1 bg-white rounded-full" />
          ))}
        </div>
      </div>
    );
  };

  // ============================================
  // CONTENT SECTIONS
  // ============================================

  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Critical Summary Card */}
      <div className={`
        relative p-6 rounded-3xl 
        bg-gradient-to-br ${theme.secondary}
        border border-white/20 backdrop-blur-sm
        shadow-lg overflow-hidden
      `}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Incident Summary</h3>
              <p className={`text-sm ${theme.text} opacity-80`}>
                {warningData.category} • {warningData.incidentLocation}
              </p>
            </div>
            <div className={`
              w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.primary}
              flex items-center justify-center shadow-md
            `}>
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className={`
            p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20
            ${showFullDescription ? '' : 'max-h-20 overflow-hidden relative'}
          `}>
            <p className="text-gray-800 leading-relaxed">
              {warningData.description}
            </p>
            {!showFullDescription && warningData.description.length > 100 && (
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/80 to-transparent flex items-end justify-center">
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-white/80 px-3 py-1 rounded-full"
                >
                  Show more
                </button>
              </div>
            )}
            {showFullDescription && warningData.description.length > 100 && (
              <button
                onClick={() => setShowFullDescription(false)}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employee Card */}
        <div className="group p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Employee</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium text-gray-900">{warningData.employeeName}</span>
            </div>
            <div>
              <span className="text-gray-500">ID:</span>
              <span className="ml-2 font-medium text-gray-900">{warningData.employeeNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">Position:</span>
              <span className="ml-2 font-medium text-gray-900">{warningData.position}</span>
            </div>
          </div>
        </div>

        {/* Timing Card */}
        <div className="group p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Timeline</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Incident:</span>
              <span className="ml-2 font-medium text-gray-900">{warningData.incidentDate}</span>
            </div>
            <div>
              <span className="text-gray-500">Issued:</span>
              <span className="ml-2 font-medium text-gray-900">{warningData.issueDate}</span>
            </div>
            <div>
              <span className="text-gray-500">Expires:</span>
              <span className="ml-2 font-medium text-gray-900">{warningData.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="group p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Evidence</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PDF Document</span>
              <div className={`w-2 h-2 rounded-full ${warningData.hasPDF ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Audio Recording</span>
              <div className={`w-2 h-2 rounded-full ${warningData.hasAudio ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Digital Signatures</span>
              <div className={`w-2 h-2 rounded-full ${warningData.hasSignatures ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 FIXED: Quick Actions with Working Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Preview PDF', 
            icon: Eye, 
            available: true, // Always available - will generate if needed 
            color: 'blue',
            action: handlePreviewPDF
          },
          { 
            label: 'Play Audio', 
            icon: Headphones, 
            available: warningData.hasAudio, 
            color: 'purple',
            action: handlePlayAudio
          },
          {
            label: 'View Signatures',
            icon: FileSignature,
            available: warningData.hasSignatures,
            color: 'emerald',
            action: handleViewSignatures
          },
          {
            label: 'Response Link',
            icon: Link,
            available: true,
            color: 'amber',
            action: handleGenerateResponseLink,
          }
        ].map((action) => (
          <button
            key={action.label}
            disabled={!action.available}
            onClick={action.available ? action.action : undefined}
            className={`
              p-4 rounded-2xl border transition-all duration-300
              ${action.available
                ? `bg-${action.color}-50 border-${action.color}-200 hover:bg-${action.color}-100 hover:scale-105 text-${action.color}-700`
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {action.label === 'Response Link' && responseLinkLoading ? (
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
            ) : (
              <action.icon className="w-5 h-5 mx-auto mb-2" />
            )}
            <div className="text-sm font-medium">{action.label}</div>
          </button>
        ))}
      </div>

      {/* Response Link Display */}
      {responseLink && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Link className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">Employee Response Link</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            Send this link to the employee via WhatsApp or email. They can respond or appeal without needing to log in.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={responseLink}
              readOnly
              className="flex-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg text-gray-800 font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyResponseLink}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                responseLinkCopied
                  ? 'bg-green-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {responseLinkCopied ? (
                <><CheckCircle className="w-4 h-4" /> Copied</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <>
      <div
        ref={backdropRef}
        className={`
          fixed inset-0 flex items-center justify-center p-4
          bg-black/60 backdrop-blur-xl
          transition-all duration-500 ease-out
          ${isAnimating ? 'opacity-0' : 'opacity-100'}
          ${className}
        `}
        style={{ zIndex: Z_INDEX.modal }}
        onClick={(e) => e.target === backdropRef.current && handleClose()}
      >
        {/* Main Modal Container - V2 Clean Design */}
        <div 
          ref={modalRef}
          className={`
            relative w-full max-w-4xl max-h-[90vh] 
            bg-white rounded-lg shadow-xl border border-gray-200
            overflow-hidden
            transition-all duration-300 ease-out
            ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}
        >
          {/* Clean Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-lg ${theme.primary}
                flex items-center justify-center
              `}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Warning Details
                </h1>
                <p className="text-sm text-gray-600">
                  {warningData.employeeName} • {warningData.category}
                </p>
              </div>
            </div>
            
            {/* Close Button & Status Badges */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                warningData.level === 'verbal' ? 'bg-blue-100 text-blue-800' :
                warningData.level === 'written' ? 'bg-yellow-100 text-yellow-800' :
                warningData.level === 'final' ? 'bg-red-100 text-red-800' :
                warningData.level === 'dismissal' ? 'bg-red-200 text-red-900' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {getLevelLabel(warningData.level) || 'Warning'}
              </span>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              
              {/* Summary Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Incident Summary</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">{warningData.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="ml-2 text-gray-600">{warningData.incidentDate}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-600">{warningData.incidentLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    Employee Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{warningData.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-medium text-gray-900">{warningData.employeeNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium text-gray-900">{warningData.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{warningData.department}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    Warning Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium text-gray-900">{warningData.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className="font-medium text-gray-900">{warningData.expiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued By:</span>
                      <span className="font-medium text-gray-900">{warningData.issuedByName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        warningData.deliveryStatus === 'delivered' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {warningData.deliveryStatus === 'delivered' ? 'Delivered' : 'Pending Delivery'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appeal History Section */}
              {(warningData.appealSubmitted || warningData.appealOutcome) && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-600" />
                    Appeal History
                  </h4>

                  {/* Employee Appeal */}
                  {warningData.appealSubmitted && warningData.appealDetails && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-900 uppercase">Employee Appeal</span>
                        <span className="text-xs text-gray-600">{warningData.appealDate}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {warningData.appealDetails.grounds && (
                          <div>
                            <span className="font-medium text-gray-700">Grounds:</span>
                            <p className="text-gray-600 mt-1">{warningData.appealDetails.grounds}</p>
                          </div>
                        )}
                        {warningData.appealDetails.details && (
                          <div>
                            <span className="font-medium text-gray-700">Additional Details:</span>
                            <p className="text-gray-600 mt-1">{warningData.appealDetails.details}</p>
                          </div>
                        )}
                        {warningData.appealDetails.requestedOutcome && (
                          <div>
                            <span className="font-medium text-gray-700">Requested Outcome:</span>
                            <p className="text-gray-600 mt-1">{warningData.appealDetails.requestedOutcome}</p>
                          </div>
                        )}
                        {warningData.appealDetails.submittedBy && (
                          <div className="text-xs text-gray-500 mt-2">
                            Submitted by: {warningData.appealDetails.submittedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* HR Decision */}
                  {warningData.appealOutcome && (
                    <div className="p-3 bg-white rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-900 uppercase">HR Decision</span>
                        <span className="text-xs text-gray-600">{warningData.appealDecisionDate || 'Pending'}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Outcome:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            warningData.appealOutcome === 'overturned' ? 'bg-green-100 text-green-800' :
                            warningData.appealOutcome === 'upheld' ? 'bg-red-100 text-red-800' :
                            warningData.appealOutcome === 'modified' ? 'bg-blue-100 text-blue-800' :
                            warningData.appealOutcome === 'reduced' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {warningData.appealOutcome === 'overturned' ? 'Warning Overturned' :
                             warningData.appealOutcome === 'upheld' ? 'Appeal Upheld - Warning Stands' :
                             warningData.appealOutcome === 'modified' ? 'Warning Modified' :
                             warningData.appealOutcome === 'reduced' ? 'Warning Reduced' :
                             warningData.appealOutcome}
                          </span>
                        </div>
                        {warningData.appealReasoning && (
                          <div>
                            <span className="font-medium text-gray-700">HR Reasoning:</span>
                            <p className="text-gray-600 mt-1">{warningData.appealReasoning}</p>
                          </div>
                        )}
                        {warningData.hrNotes && (
                          <div>
                            <span className="font-medium text-gray-700">HR Notes:</span>
                            <p className="text-gray-600 mt-1">{warningData.hrNotes}</p>
                          </div>
                        )}
                        {warningData.followUpRequired && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <span className="text-xs font-medium text-yellow-800">
                              ⚠️ Follow-up required{warningData.followUpDate ? ` by ${warningData.followUpDate}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  {warningData.hasAudio && (
                    <button
                      onClick={handlePlayAudio}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Headphones className="w-4 h-4" />
                      Audio Recording
                    </button>
                  )}
                  
                  <button
                    onClick={handlePreviewPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    {(warningData.appealSubmitted || warningData.appealOutcome) ? 'View PDF (with Appeal)' : 'View PDF'}
                  </button>

                  {warningData.hasSignatures && (
                    <button
                      onClick={handleViewSignatures}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                    >
                      <FileSignature className="w-4 h-4" />
                      Signatures
                    </button>
                  )}

                  {/* Print Appeal Report button - only show if appeal exists */}
                  {(warningData.appealSubmitted || warningData.appealOutcome) && (
                    <button
                      onClick={handlePrintAppealReport}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <Scale className="w-4 h-4" />
                      Print Appeal Report
                    </button>
                  )}

                  {/* Response Link */}
                  <button
                    onClick={handleGenerateResponseLink}
                    disabled={responseLinkLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {responseLinkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link className="w-4 h-4" />
                    )}
                    Response Link
                  </button>
                </div>

                {/* Archive button */}
                {onArchive && !warningData.isArchived && (
                  <button
                    onClick={() => setShowArchiveDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                {warningData.isArchived && (
                  <span className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                    <Archive className="w-4 h-4" />
                    Archived{warningData.archiveReason ? ` (${warningData.archiveReason})` : ''}
                  </span>
                )}
              </div>

              {/* Archive Confirmation Dialog */}
              {showArchiveDialog && (
                <ArchiveDialog
                  archiveReason={archiveReason}
                  setArchiveReason={setArchiveReason}
                  archiveProcessing={archiveProcessing}
                  onCancel={() => { setShowArchiveDialog(false); setArchiveReason(''); }}
                  onArchive={handleArchive}
                />
              )}

              {/* Response Link Display (within action bar) */}
              {responseLink && (
                <ResponseLinkPanel
                  responseLink={responseLink}
                  responseLinkCopied={responseLinkCopied}
                  onCopy={handleCopyResponseLink}
                />
              )}
            </div>
          </div>

          {/* Reject/Approve dialog removed - not applicable for issued warnings */}
        </div>
      </div>

      {/* Nested Modals - Redesigned for V2 */}

      {/* Audio Modal — variant A (less-featured). NOTE: variant B below renders
          on top at same z-index, hiding this one. Preserved exactly until a
          separate cleanup commit. */}
      {showAudioModal && warningData?.hasAudio && (
        <AudioModalSimple
          audioRecording={warningData.audioRecording}
          onClose={() => setShowAudioModal(false)}
        />
      )}

      {/* Signatures Modal — variant A (less-featured). Same duplicate-render
          situation as Audio Modal above. */}
      {showSignatureModal && (
        <SignaturesModalSimple
          hasSignatures={warningData?.hasSignatures}
          signatures={warningData?.signatures || {}}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {/* 🎯 WORKING MODALS */}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          warningData={{
            // Direct mapping from warning fields (saved by UnifiedWarningWizard)
            selectedEmployee: {
              id: warning.employeeId || '',
              firstName: warning.employeeName || 'Unknown',
              lastName: warning.employeeLastName || 'Employee', 
              employeeId: warning.employeeNumber || '',
              employeeNumber: warning.employeeNumber || '',
              department: warning.employeeDepartment || warning.department || '',
              position: warning.employeePosition || warning.position || '',
              email: warning.employeeEmail || ''
            },
            selectedCategory: {
              id: warning.categoryId || '',
              name: warning.categoryName || warning.category || 'General',
              severity: 'medium',
              description: warning.categoryName || warning.category || 'General'
            },
            formData: {
              incidentDate: toISODateString(warning.incidentDate),
              incidentTime: warning.incidentTime || '12:00',
              incidentLocation: warning.incidentLocation || '',
              incidentDescription: warning.incidentDescription || warning.description || '',
              additionalNotes: warning.additionalNotes || '',
              validityPeriod: warning.validityPeriod || 6,
              issueDate: toISODateString(warning.issueDate),
              status: warning.status, // Pass warning status for PDF watermarking
              pdfGeneratorVersion: warning.pdfGeneratorVersion, // Pass stored PDF code version
              pdfTemplateVersion: warning.pdfTemplateVersion, // Pass stored template version for fetching from versions collection
              pdfSettings: warning.pdfSettings, // Pass stored PDF template settings (backward compatibility for old warnings)
              // Corrective discussion fields
              employeeStatement: warning.employeeStatement,
              expectedBehaviorStandards: warning.expectedBehaviorStandards,
              actionSteps: warning.actionSteps,
              reviewDate: warning.reviewDate,
              interventionDetails: warning.interventionDetails,
              resourcesProvided: warning.resourcesProvided
            },
            signatures: warning.signatures || { manager: null, employee: null },
            lraRecommendation: warning.disciplineRecommendation || {
              category: warning.categoryName || warning.category || 'General',
              recommendedLevel: warning.level || 'Counselling Session',
              suggestedLevel: warning.level || 'counselling',
              reason: 'Based on incident severity and employee history',
              warningCount: 1,
              previousWarnings: [],
              activeWarnings: [],
              legalRequirements: ['Employee consultation', 'Written documentation', 'Appeal process notification']
            },
            organizationId: warning.organizationId || ''
          }}
          onPDFGenerated={(blob, filename) => {
            Logger.debug('PDF generated for preview:', filename)
            Logger.debug('Warning data for PDF:', {
              categoryName: warning.categoryName,
              category: warning.category,
              signatures: warning.signatures
            });
            // PDF is displayed in the preview modal - no automatic download
          }}
        />
      )}


      {/* Audio Modal — variant B (with header subtitle). */}
      {showAudioModal && warningData?.hasAudio && (
        <AudioModalFull
          warningId={warningData.id}
          employeeName={warningData.employeeName}
          audioRecording={warningData.audioRecording}
          onClose={() => setShowAudioModal(false)}
        />
      )}

      {/* Signature Modal — variant B (with subtitle + per-sig buttons). */}
      {showSignatureModal && (
        <SignaturesModalFull
          warningId={warningData?.id || ''}
          employeeName={warningData?.employeeName || ''}
          hasSignatures={!!warningData?.hasSignatures}
          signatures={warningData?.signatures || { manager: null, employee: null }}
          onClose={() => setShowSignatureModal(false)}
          onViewSignature={handleViewSignature}
        />
      )}

      {/* Individual Signature View Modal */}
      {selectedSignature && (
        <IndividualSignatureModal
          signature={selectedSignature.signature}
          title={selectedSignature.title}
          subtitle={selectedSignature.subtitle}
          onClose={() => setSelectedSignature(null)}
        />
      )}
    </>
  );
};

// Export both named and default for compatibility
export { WarningDetailsModal };
export default WarningDetailsModal;