// UnifiedWarningWizard.tsx - 10-phase unified warning wizard
// Replaces EnhancedWarningWizard with consistent phased UX throughout
// ✅ AWARD-WINNING UX: Full accessibility, mobile-first, micro-interactions, data safety

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../../../config/firebase';
import {
  User, FileText, Tag, MessageSquare, Target, TrendingUp,
  CheckCircle, FileSearch, PenTool, Send, AlertTriangle, AlertCircle, X, Scale, Eye,
  ChevronLeft, ChevronRight, Info, Paperclip, Mail, Loader2, Lock, RefreshCw
} from 'lucide-react';
import Logger from '../../../utils/logger';

// Shared phase components
import {
  PhaseHeader,
  PhaseGuidance,
  PhaseNavigation,
  PhaseProgress,
  SuccessCelebration,
  WizardSkeleton
} from './shared';

// Accessibility & UX hooks
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { useSwipeNavigation } from '../../../hooks/useSwipeNavigation';

// Wizard animations CSS
import '../../../styles/wizard-animations.css';

// Existing step components (reuse internal logic)
import { EmployeeSelector } from './steps/components/EmployeeSelector';
import { CategorySelector } from './steps/components/CategorySelector';
import { IncidentDetailsForm } from './steps/components/IncidentDetailsForm';
import { MultiLanguageWarningScript } from './steps/components/MultiLanguageWarningScript';
import { PDFPreviewModal } from './PDFPreviewModal';
import { QRCodeDownloadModal } from '../modals/QRCodeDownloadModal';

// SVG signature utilities
import { applyWitnessWatermarkToSVG } from '../../../utils/signatureSVG';

// Signature pad modal
import { SignaturePadModal } from '../../common/SignaturePadModal';

// Themed components
import { ThemedCard } from '../../common/ThemedCard';
import { ThemedButton } from '../../common/ThemedButton';
import { ThemedAlert } from '../../common/ThemedCard';

// Hooks and services
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/auth/AuthContext';
import { useAudioRecording } from '../../../hooks/warnings/useAudioRecording';
import { API } from '@/api';

// Types
import type { EscalationRecommendation } from '@/services/WarningService';
import type { EvidenceItem } from '@/types/warning';

// Wizard-local phase components (extracted Phase 2 Tier 3C)
import { DeliveryPhase } from './phases/DeliveryPhase';
import { SignaturesPhase } from './phases/SignaturesPhase';
import { ReviewDocumentationPhase } from './phases/ReviewDocumentationPhase';
import { ScriptPdfReviewPhase } from './phases/ScriptPdfReviewPhase';

// Wizard-local types, constants, and helpers (extracted Phase 2 Tier 3C step 1)
import {
  Phase,
  PHASE_INFO,
  TOTAL_PHASES,
  type Employee,
  type Category,
  type FormData,
  type SignatureData,
  type ActionCommitment,
  type UnifiedWarningWizardProps,
} from './wizardTypes';
import {
  generateId,
  getSouthAfricanTime,
  getSouthAfricanDate,
  getWordCount,
  getWarningLevelInfo,
} from './wizardHelpers';

// PDF services
import { PDF_GENERATOR_VERSION } from '@/services/PDFGenerationService';
import { PDFTemplateVersionService } from '@/services/PDFTemplateVersionService';
import { transformWarningDataForPDF } from '@/utils/pdfDataTransformer';

// Microphone permission
import { MicrophonePermissionHandler } from './components/MicrophonePermissionHandler';

// ============================================
// MAIN COMPONENT
// ============================================

export const UnifiedWarningWizard: React.FC<UnifiedWarningWizardProps> = ({
  employees,
  categories,
  currentManagerName,
  organizationName,
  onComplete,
  onCancel,
  preSelectedEmployeeId,
  preSelectedCategoryId,
  isFullScreen,
  preloadedWarnings
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const audioRecording = useAudioRecording();

  // Check if audio recording is enabled for this organization
  const isAudioEnabled = organization?.customization?.enableAudioRecording ?? true;

  // ============================================
  // REFS & ENHANCED HOOKS
  // ============================================

  const wizardContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const previousPhaseRef = useRef<number>(0);

  // Focus trap for accessibility (WCAG 2.1 AA)
  const focusTrapRef = useFocusTrap({
    isActive: true,
    onEscape: onCancel,
    autoFocus: true,
    returnFocus: true
  });

  // ============================================
  // STATE
  // ============================================

  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.EMPLOYEE_SELECTION);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());

  // Enhanced UX state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next');
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [audioUploadWarning, setAudioUploadWarning] = useState(false);
  const [evidenceUploadWarning, setEvidenceUploadWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Form data - use South African timezone for dates/times
  const [formData, setFormData] = useState<FormData>(() => ({
    employeeId: preSelectedEmployeeId || '',
    categoryId: preSelectedCategoryId || '',
    incidentDate: getSouthAfricanDate(),
    incidentTime: getSouthAfricanTime(),
    incidentLocation: '',
    incidentDescription: '',
    level: 'counselling',
    issueDate: getSouthAfricanDate(),
    validityPeriod: 6
  }));

  // Selected objects
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  // LRA Analysis
  const [lraRecommendation, setLraRecommendation] = useState<EscalationRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<string | null>(null);
  const [warningHistory, setWarningHistory] = useState<any[]>([]);
  const warningHistoryLoaded = useRef(false); // Tracks if prefetch completed (even if result is empty)
  const [hrInterventionRequired, setHrInterventionRequired] = useState<false | 'final_warning' | 'dismissal'>(false);

  // Corrective discussion
  const [employeeStatement, setEmployeeStatement] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actionCommitments, setActionCommitments] = useState<ActionCommitment[]>([]);
  const [reviewDate, setReviewDate] = useState('');
  const [interventionDetails, setInterventionDetails] = useState('');
  const [resourcesProvided, setResourcesProvided] = useState<string[]>([]);

  // Evidence files (collected locally, uploaded after warning save)
  const [pendingEvidenceItems, setPendingEvidenceItems] = useState<EvidenceItem[]>([]);

  // Signatures
  const [signatures, setSignatures] = useState<SignatureData>({
    manager: null,
    employee: null,
    witness: null,
    managerName: currentManagerName
  });
  const [signatureType, setSignatureType] = useState<'employee' | 'witness'>('employee');
  const [employeeViewedPDF, setEmployeeViewedPDF] = useState(false);
  const [activeSignatureModal, setActiveSignatureModal] = useState<'manager' | 'employee' | null>(null);

  // PDF & Script
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [scriptReadConfirmed, setScriptReadConfirmed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  // Delivery
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>('');
  const [finalWarningId, setFinalWarningId] = useState<string>('');

  // Email delivery state
  const [isEmailDelivering, setIsEmailDelivering] = useState(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<
    'idle' | 'generating_pdf' | 'uploading_pdf' | 'sending_email' | 'success' | 'failed'
  >('idle');
  const [useAlternativeEmail, setUseAlternativeEmail] = useState(false);
  const [alternativeEmail, setAlternativeEmail] = useState('');
  const [emailDeliveryError, setEmailDeliveryError] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPermissionHandler, setShowPermissionHandler] = useState(true);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPdfBlob, setQrPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingQRPdf, setIsGeneratingQRPdf] = useState(false);
  const [selectedWarningDetails, setSelectedWarningDetails] = useState<any>(null);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentLevel = useMemo(() => {
    return overrideLevel || lraRecommendation?.suggestedLevel || 'counselling';
  }, [overrideLevel, lraRecommendation]);

  const levelInfo = useMemo(() => getWarningLevelInfo(currentLevel), [currentLevel]);

  const employeeName = useMemo(() => {
    if (!selectedEmployee) return '';
    const firstName = selectedEmployee.profile?.firstName || selectedEmployee.firstName || '';
    const lastName = selectedEmployee.profile?.lastName || selectedEmployee.lastName || '';
    return `${firstName} ${lastName}`.trim();
  }, [selectedEmployee]);

  // ============================================
  // PHASE VALIDATION
  // ============================================

  const isPhaseValid = useMemo(() => {
    switch (currentPhase) {
      case Phase.EMPLOYEE_SELECTION:
        return !!formData.employeeId;

      case Phase.INCIDENT_DETAILS: {
        // Word count validation (minimum 6 words) - matches IncidentDetailsForm
        const words = (formData.incidentDescription || '').trim().split(/\s+/).filter(w => w.length > 0);
        return !!(
          formData.incidentDate &&
          formData.incidentTime &&
          formData.incidentLocation?.length >= 3 &&
          words.length >= 6
        );
      }

      case Phase.CATEGORY_RECOMMENDATION:
        // Only require category selection - LRA recommendation is helpful but not blocking
        return !!(
          formData.categoryId &&
          !isAnalyzing &&
          !hrInterventionRequired
        );

      case Phase.EMPLOYEE_RESPONSE:
        if (!levelInfo.requiresCommitments) return true;
        return getWordCount(employeeStatement) >= 6;

      case Phase.EXPECTED_STANDARDS:
        return getWordCount(expectedBehavior) >= 6;

      case Phase.IMPROVEMENT_PLAN:
        if (!levelInfo.requiresCommitments) return true;
        return !!(
          actionCommitments.length > 0 &&
          reviewDate &&
          formData.issueDate
        );

      case Phase.REVIEW_DOCUMENTATION:
        return true;

      case Phase.SCRIPT_PDF_REVIEW:
        return scriptReadConfirmed && hasAcknowledged;

      case Phase.SIGNATURES:
        return !!(
          signatures.manager &&
          employeeViewedPDF &&
          (signatures.employee || signatures.witness) &&
          selectedEmployee &&
          selectedCategory &&
          organization?.id
        );

      case Phase.DELIVERY:
        // Email has its own Send button, so only enable Finalize for non-email methods
        return !!selectedDeliveryMethod && selectedDeliveryMethod !== 'email';

      default:
        return false;
    }
  }, [
    currentPhase, formData, lraRecommendation, isAnalyzing, hrInterventionRequired,
    levelInfo, employeeStatement, expectedBehavior, actionCommitments, reviewDate,
    scriptReadConfirmed, hasAcknowledged, signatures, selectedDeliveryMethod, employeeViewedPDF,
    selectedEmployee, selectedCategory, organization?.id
  ]);

  // ============================================
  // EFFECTS
  // ============================================

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle hardware back button (mobile) - show confirmation before exiting
  useEffect(() => {
    // Push a history state when wizard opens
    window.history.pushState({ wizardOpen: true }, '');

    const handlePopState = () => {
      // User pressed back button (hardware or browser)
      if (window.confirm('Are you sure you want to exit? Any unsaved progress will be lost.')) {
        onCancel();
      } else {
        // User cancelled - push state back to prevent navigation
        window.history.pushState({ wizardOpen: true }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onCancel]);

  // Phase transition animation
  useEffect(() => {
    if (currentPhase !== previousPhaseRef.current) {
      setTransitionDirection(currentPhase > previousPhaseRef.current ? 'next' : 'prev');
      setIsTransitioning(true);

      // Trigger haptic feedback on mobile
      if ('vibrate' in navigator && isMobile) {
        navigator.vibrate(10);
      }

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      previousPhaseRef.current = currentPhase;
      return () => clearTimeout(timer);
    }
  }, [currentPhase, isMobile]);

  // Load employee when selected — prefetch warning history immediately
  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find(e => e.id === formData.employeeId);
      setSelectedEmployee(employee);

      // Reset prefetch flag for new employee
      warningHistoryLoaded.current = false;
      setWarningHistory([]);

      // Prefetch warning history so it's ready before category selection
      if (employee && organization?.id) {
        // 🚀 OPTIMIZATION: Use preloaded warnings from dashboard when available
        if (preloadedWarnings) {
          const employeeWarnings = preloadedWarnings.filter(
            (w: any) => w.employeeId === employee.id && w.isActive !== false && w.status !== 'expired' && w.status !== 'overturned'
          );
          setWarningHistory(employeeWarnings);
          warningHistoryLoaded.current = true;
          Logger.debug('[Wizard] Warning history from preloaded data:', employeeWarnings.length, 'active warnings');
        } else {
          // Fallback: Call Cloud Function when preloaded data not available
          Logger.debug('[Wizard] Prefetching warning history for', employee.id);
          API.warnings.getActiveWarnings(employee.id, organization.id)
            .then(warnings => {
              setWarningHistory(warnings);
              warningHistoryLoaded.current = true;
              Logger.debug('[Wizard] Warning history prefetched:', warnings.length, 'active warnings');
            })
            .catch(err => {
              warningHistoryLoaded.current = true; // Mark loaded even on error so we don't block LRA
              Logger.error('Failed to prefetch warning history:', err);
            });
        }
      }
    }
  }, [formData.employeeId, employees, organization?.id, preloadedWarnings]);

  // Load category when selected
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId);
      setSelectedCategory(category);
      // Pre-populate expected standards if empty
      if (category?.expectedStandardsTemplate && !expectedBehavior) {
        setExpectedBehavior(category.expectedStandardsTemplate);
      }
    }
  }, [formData.categoryId, categories]);

  // Trigger LRA analysis when employee and category are selected
  // Note: Also called directly from onCategorySelect for immediate feedback
  useEffect(() => {
    if (formData.employeeId && formData.categoryId && organization?.id && !lraRecommendation && !isAnalyzing) {
      generateLRARecommendation();
    }
  }, [formData.employeeId, formData.categoryId, organization?.id]);

  // Start audio recording when microphone permission is granted (only if audio is enabled)
  useEffect(() => {
    if (!isAudioEnabled) return; // Skip if audio recording is disabled for this organization

    if (microphonePermissionGranted && !audioRecording.isRecording && !showPermissionHandler) {
      // Auto-start recording after permission granted
      Logger.info('Starting audio recording - permission granted');
      audioRecording.startRecording().catch(err => {
        Logger.error('Failed to start audio recording:', err);
      });
    }
  }, [isAudioEnabled, microphonePermissionGranted, showPermissionHandler, audioRecording.isRecording, audioRecording.startRecording]);

  // ============================================
  // HANDLERS
  // ============================================

  const generateLRARecommendation = async () => {
    if (!formData.employeeId || !formData.categoryId || !organization?.id) return;

    setIsAnalyzing(true);
    const startTime = Date.now();
    const MIN_LOADING_TIME = 300; // Brief flash so user sees analysis happened

    try {
      // Use prefetched warnings if available, otherwise fetch now
      const activeWarnings = warningHistoryLoaded.current
        ? warningHistory
        : await API.warnings.getActiveWarnings(formData.employeeId, organization.id);

      // Check for final warnings in same category - block if found
      // BUT only if the category's escalation path doesn't have a step after final_written (e.g. dismissal)
      const currentCategoryForCheck = categories.find(c => c.id === formData.categoryId) || selectedCategory;
      const categoryPath = currentCategoryForCheck?.escalationPath || [];
      const finalWrittenIdx = categoryPath.indexOf('final_written');
      const pathHasStepAfterFinal = finalWrittenIdx >= 0 && finalWrittenIdx < categoryPath.length - 1;

      const hasFinalWarningForCategory = activeWarnings.some(warning =>
        (warning.level === 'final_written' ||
         warning.level === 'Final Written Warning' ||
         warning.suggestedLevel === 'final_written') &&
        warning.categoryId === formData.categoryId
      );

      if (hasFinalWarningForCategory && !pathHasStepAfterFinal) {
        setHrInterventionRequired('final_warning');
        // Ensure minimum loading time
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADING_TIME) {
          await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
        }
        setIsAnalyzing(false);
        return;
      }

      // 🔥 FIX: Look up category directly from categories array to avoid stale state
      const currentCategory = categories.find(c => c.id === formData.categoryId) || selectedCategory;

      // Use correct API method with proper parameters
      const recommendation = await API.warnings.getEscalationRecommendation(
        formData.employeeId,
        formData.categoryId,
        organization.id,
        currentCategory, // Pass the category object (fresh lookup, not stale state)
        activeWarnings // Pass preloaded warnings
      );

      // Ensure minimum loading time for UX
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      setLraRecommendation(recommendation);

      // Check if dismissal level — redirect to HR instead of proceeding
      if (recommendation.suggestedLevel === 'dismissal') {
        setHrInterventionRequired('dismissal');
        setIsAnalyzing(false);
        return;
      }

      setFormData(prev => ({ ...prev, level: recommendation.suggestedLevel }));

    } catch (error) {
      Logger.error('Failed to generate LRA recommendation:', error);
      // 🔥 FIX: Look up category directly from categories array for fallback too
      const fallbackCategory = categories.find(c => c.id === formData.categoryId) || selectedCategory;
      const categoryEscalationPath = fallbackCategory?.escalationPath || ['counselling', 'verbal_warning', 'first_written', 'final_written'];
      // Check if fallback path starts with dismissal (e.g. category with ['dismissal'] only)
      const fallbackFirstLevel = categoryEscalationPath[0] || 'counselling';
      if (fallbackFirstLevel === 'dismissal') {
        const dismissalRecommendation: any = {
          suggestedLevel: 'dismissal',
          recommendedLevel: 'DISMISSAL — HR MUST HANDLE',
          reason: 'This offense requires immediate HR involvement.',
          activeWarnings: [],
          escalationPath: categoryEscalationPath,
          isEscalation: false,
          category: fallbackCategory?.name || 'General Misconduct',
          categoryId: formData.categoryId,
          warningCount: 0
        };
        setLraRecommendation(dismissalRecommendation);
        setHrInterventionRequired('dismissal');
        setIsAnalyzing(false);
        return;
      }
      const fallbackRecommendation: any = {
        suggestedLevel: fallbackFirstLevel,
        recommendedLevel: categoryEscalationPath[0] === 'counselling' ? 'Counselling Session' :
                         categoryEscalationPath[0] === 'verbal_warning' ? 'Verbal Warning' :
                         'Counselling Session',
        reason: 'Unable to analyze history - using default first step.',
        activeWarnings: [],
        escalationPath: categoryEscalationPath,
        isEscalation: false,
        category: fallbackCategory?.name || 'General Misconduct',
        categoryId: formData.categoryId,
        warningCount: 0
      };
      setLraRecommendation(fallbackRecommendation);
      setFormData(prev => ({ ...prev, level: fallbackRecommendation.suggestedLevel }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreviousPhase = useCallback(() => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
    }
  }, [currentPhase]);

  const handleNextPhase = useCallback(() => {
    if (isPhaseValid && currentPhase < TOTAL_PHASES - 1) {
      // Mark current phase as completed
      setCompletedPhases(prev => new Set([...prev, currentPhase]));
      setCurrentPhase(currentPhase + 1);
    }
  }, [currentPhase, isPhaseValid]);

  const goToPhase = useCallback((phase: number) => {
    if (phase <= currentPhase || completedPhases.has(phase)) {
      setCurrentPhase(phase);
    }
  }, [currentPhase, completedPhases]);

  // ============================================
  // SWIPE NAVIGATION (Priority 2: Mobile-First)
  // Must be after isPhaseValid and handlers are defined
  // ============================================

  const swipeContainerRef = useSwipeNavigation({
    onSwipeLeft: () => {
      if (isPhaseValid && currentPhase < TOTAL_PHASES - 1) {
        handleNextPhase();
      }
    },
    onSwipeRight: () => {
      if (currentPhase > 0) {
        handlePreviousPhase();
      }
    },
    enabled: isMobile,
    allowLeft: isPhaseValid && currentPhase < TOTAL_PHASES - 1,
    allowRight: currentPhase > 0
  });

  const handleSaveWarning = async () => {
    // Validation with logging
    if (!organization?.id) {
      Logger.error('Cannot save warning: No organization ID');
      return;
    }
    if (!selectedEmployee) {
      Logger.error('Cannot save warning: No employee selected', { employeeId: formData.employeeId });
      return;
    }
    if (!selectedCategory) {
      Logger.error('Cannot save warning: No category selected', { categoryId: formData.categoryId });
      return;
    }

    Logger.info('Saving warning...', { employeeId: formData.employeeId, categoryId: formData.categoryId });
    setIsSaving(true);
    try {
      // Save template version snapshot (logo + layout settings) for reproducible reprints
      let pdfTemplateVersion: string | undefined;
      if (organization?.pdfSettings && user?.uid) {
        try {
          pdfTemplateVersion = await PDFTemplateVersionService.ensureTemplateVersionExists(
            organization.id,
            organization.pdfSettings,
            user.uid
          );
          Logger.success(`✅ PDF template version ${pdfTemplateVersion} saved/verified`);
        } catch (error) {
          Logger.error('❌ Failed to save PDF template version:', error);
        }
      }

      // Build warning data - must match EnhancedWarningFormData structure
      const warningData = {
        organizationId: organization.id,
        employeeId: formData.employeeId,
        categoryId: formData.categoryId,
        categoryName: selectedCategory.name,
        level: currentLevel,
        incidentDescription: formData.incidentDescription,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentLocation: formData.incidentLocation,
        issueDate: formData.issueDate,
        validityPeriod: formData.validityPeriod,
        // Employee snapshot data
        employeeName: employeeName,
        employeeLastName: selectedEmployee.profile?.lastName || selectedEmployee.lastName || '',
        employeeNumber: selectedEmployee.profile?.employeeNumber || selectedEmployee.employeeNumber || '',
        employeeDepartment: selectedEmployee.employment?.department || selectedEmployee.department || '',
        employeePosition: selectedEmployee.employment?.position || selectedEmployee.position || '',
        employeeEmail: selectedEmployee.profile?.email || selectedEmployee.email || '',
        // Issued by
        issuedBy: user?.uid || user?.id || '',
        issuedByName: currentManagerName,
        // Signatures - only include defined values (Firestore doesn't allow undefined)
        signatures: {
          manager: signatures.manager,
          employee: signatures.employee || null,
          witness: signatures.witness || null,
          managerName: signatures.managerName || currentManagerName,
          ...(signatureType === 'employee' && { employeeName: employeeName }),
          ...(signatureType === 'witness' && signatures.witnessName && { witnessName: signatures.witnessName }),
          signedAt: new Date().toISOString()
        },
        // Corrective discussion
        employeeStatement,
        expectedBehaviorStandards: expectedBehavior,
        actionSteps: actionCommitments.map(c => ({
          action: c.commitment,
          timeline: c.timeline
        })),
        reviewDate,
        interventionDetails,
        resourcesProvided,
        // LRA data
        disciplineRecommendation: lraRecommendation,
        wasOverridden: !!overrideLevel,
        originalRecommendedLevel: lraRecommendation?.suggestedLevel,
        // Evidence count (files uploaded after save)
        evidenceCount: pendingEvidenceItems.length,
        // Version tracking
        pdfGeneratorVersion: PDF_GENERATOR_VERSION,
        ...(pdfTemplateVersion ? { pdfTemplateVersion } : {}),
        // Organization header snapshot — frozen at creation for identical reprints
        organizationSnapshot: {
          companyName: organization.branding?.companyName || organization.name,
          address: organization.address || null,
          phone: organization.phone || null,
          email: organization.email || null,
          registrationNumber: organization.branding?.registrationNumber || null,
          website: organization.branding?.website || null,
          primaryColor: organization.branding?.primaryColor || '#3b82f6',
          logoUrl: organization.branding?.logo || null,
        },
        status: 'issued',
        createdAt: new Date(),
        createdBy: user?.uid
      };

      // Create the warning
      Logger.info('Calling API.warnings.create...', { dataKeys: Object.keys(warningData) });
      const warningId = await API.warnings.create(warningData);
      Logger.success('Warning created with ID:', warningId);
      setFinalWarningId(warningId);

      // Stop and upload audio if audio is enabled AND (recording is active OR already-stopped recording has data)
      let audioUploadFailed = false;
      const hasActiveRecording = audioRecording.isRecording;
      const hasStoppedRecordingWithData = !audioRecording.isRecording && audioRecording.audioUrl && audioRecording.recordingId;

      if (isAudioEnabled && (hasActiveRecording || hasStoppedRecordingWithData)) {
        try {
          // Capture recordingId before stopping (won't change)
          const recordingId = audioRecording.recordingId;
          let localAudioUrl: string | null = null;

          if (hasActiveRecording) {
            // Recording still active — stop it and get blob URL
            localAudioUrl = await audioRecording.stopRecording();
          } else {
            // Recording already stopped (e.g. auto-stop at 5 min) — use existing blob URL
            Logger.debug('📼 Using already-stopped recording data for upload');
            localAudioUrl = audioRecording.audioUrl;
          }

          // Capture duration/size AFTER stop completes (onstop handler has updated state)
          const finalDuration = audioRecording.duration || 0;
          const finalSize = audioRecording.size || 0;

          const issuerId = user?.uid || user?.id || '';

          if (localAudioUrl && recordingId && warningId) {
            const firebaseAudioUrl = await audioRecording.uploadToFirebaseFromUrl(
              localAudioUrl,
              recordingId,
              organization.id,
              warningId,
              finalDuration
            );

            // Calculate auto-delete date in UTC to avoid timezone off-by-one
            const autoDeleteDate = new Date();
            autoDeleteDate.setUTCMonth(autoDeleteDate.getUTCMonth() + (formData.validityPeriod || 12));

            const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);

            if (firebaseAudioUrl) {
              await updateDoc(warningRef, {
                audioRecording: {
                  recordingId,
                  storageUrl: firebaseAudioUrl,
                  url: firebaseAudioUrl,
                  duration: finalDuration,
                  size: finalSize,
                  codec: 'audio/webm;codecs=opus',
                  bitrate: 24000,
                  sampleRate: 16000,
                  channels: 1,
                  recordedBy: issuerId,
                  recordedByName: currentManagerName,
                  recordedAt: new Date().toISOString(),
                  uploadedAt: new Date().toISOString(),
                  consentGiven: true,
                  available: true,
                  processingStatus: 'completed',
                  retentionPeriod: formData.validityPeriod || 12,
                  autoDeleteDate: autoDeleteDate.toISOString()
                }
              });
              Logger.debug('✅ Audio uploaded and saved to warning:', warningId);
            } else {
              audioUploadFailed = true;
              await updateDoc(warningRef, {
                audioRecording: {
                  recordingId,
                  processingStatus: 'failed',
                  recordedBy: issuerId,
                  recordedByName: currentManagerName,
                  recordedAt: new Date().toISOString(),
                  consentGiven: true
                }
              });
              Logger.error('Audio upload returned null — marked as failed on warning:', warningId);
            }
          }
        } catch (audioError) {
          audioUploadFailed = true;
          Logger.error('Failed to upload audio recording:', audioError);
          // Continue even if audio upload fails - the warning is still saved
        }
      }

      // Upload evidence files if any were collected during the wizard
      if (pendingEvidenceItems.length > 0 && warningId) {
        try {
          const uploadedItems: any[] = [];
          for (const item of pendingEvidenceItems) {
            if (item.file) {
              const extension = item.file.name.split('.').pop() || 'file';
              const fileName = `${item.id}.${extension}`;
              const storagePath = `warnings/${organization.id}/${warningId}/evidence/${fileName}`;
              const storageRef = ref(storage, storagePath);
              await uploadBytes(storageRef, item.file, {
                contentType: item.metadata?.mimeType || item.file.type
              });
              const downloadUrl = await getDownloadURL(storageRef);
              uploadedItems.push({
                id: item.id,
                type: item.type,
                url: downloadUrl,
                description: item.description,
                capturedAt: item.capturedAt instanceof Date ? item.capturedAt.toISOString() : item.capturedAt,
                captureMethod: item.captureMethod,
                metadata: item.metadata
              });
            }
          }
          if (uploadedItems.length > 0) {
            const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
            await updateDoc(warningRef, { evidenceItems: uploadedItems });
            Logger.success('Evidence uploaded:', uploadedItems.length, 'files');
          }
        } catch (evidenceError) {
          Logger.error('Failed to upload evidence:', evidenceError);
          setEvidenceUploadWarning(true);
          // Reconcile evidenceCount since upload failed
          try {
            const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
            await updateDoc(warningRef, { evidenceCount: 0 });
          } catch (_) { /* best effort */ }
        }
      }

      // Track audio upload failure for user feedback
      if (audioUploadFailed) {
        setAudioUploadWarning(true);
      }

      // Mark phase complete and advance
      setCompletedPhases(prev => new Set([...prev, Phase.SIGNATURES]));
      setCurrentPhase(Phase.DELIVERY);

      Logger.success('Warning saved successfully:', warningId);
    } catch (error: any) {
      Logger.error('Failed to save warning:', error);
      Logger.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 500)
      });
      alert(`Failed to save warning: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedDeliveryMethod || !finalWarningId || !organization?.id) return;

    // Email delivery is handled separately via handleEmailDelivery
    if (selectedDeliveryMethod === 'email') return;

    setIsLoading(true);
    try {
      // Save delivery method and status to warning document
      const warningRef = doc(db, 'organizations', organization.id, 'warnings', finalWarningId);
      const historyEntry = {
        method: selectedDeliveryMethod,
        timestamp: new Date().toISOString(),
        status: selectedDeliveryMethod === 'qr' ? 'delivered' : 'pending',
        attemptedBy: user?.uid || '',
        attemptedByName: currentManagerName,
        type: selectedDeliveryMethod,
      };

      await updateDoc(warningRef, {
        deliveryMethod: selectedDeliveryMethod,
        deliveryStatus: selectedDeliveryMethod === 'qr' ? 'delivered' : 'pending',
        deliveryHistory: [historyEntry],
        updatedAt: new Date(),
      });

      Logger.success('Warning finalized with delivery method:', selectedDeliveryMethod);
      setShowSuccessCelebration(true);
    } catch (error) {
      Logger.error('Failed to finalize:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle success celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setShowSuccessCelebration(false);
    onComplete();
  }, [onComplete]);

  // Shared PDF generation helper - used by QR code and email delivery
  const generatePDFBlob = async (): Promise<Blob> => {
    if (!organization?.id || !selectedEmployee || !selectedCategory) {
      throw new Error('Missing data for PDF generation');
    }

    const { PDFGenerationService } = await import('@/services/PDFGenerationService');
    const { transformWarningDataForPDF } = await import('@/utils/pdfDataTransformer');

    const warningDataForPDF = {
      id: finalWarningId,
      organizationId: organization.id,
      level: currentLevel,
      category: selectedCategory.name,
      description: formData.incidentDescription,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      incidentLocation: formData.incidentLocation,
      issueDate: formData.issueDate,
      validityPeriod: formData.validityPeriod,
      signatures: {
        manager: signatures.manager,
        employee: signatures.employee,
        witness: signatures.witness,
        managerName: currentManagerName,
        employeeName: employeeName,
        signedAt: new Date().toISOString()
      },
      employeeStatement,
      expectedBehaviorStandards: expectedBehavior,
      actionSteps: actionCommitments.map(c => ({
        action: c.commitment,
        timeline: c.timeline
      })),
      reviewDate,
      disciplineRecommendation: lraRecommendation,
      pdfGeneratorVersion: PDF_GENERATOR_VERSION
    };

    const transformedData = await transformWarningDataForPDF(
      warningDataForPDF,
      selectedEmployee,
      organization
    );

    return PDFGenerationService.generateWarningPDF(
      transformedData,
      transformedData.pdfGeneratorVersion,
      transformedData.pdfSettings
    );
  };

  // Handle QR Code delivery - generate PDF and show QR modal
  const handleQRCodeDelivery = async () => {
    setIsGeneratingQRPdf(true);
    setSelectedDeliveryMethod('qr');

    try {
      const blob = await generatePDFBlob();
      setQrPdfBlob(blob);
      setShowQRModal(true);
      Logger.success('PDF generated for QR code delivery');
    } catch (error) {
      Logger.error('Failed to generate PDF for QR code:', error);
      alert('Failed to generate PDF for QR code. Please try again.');
    } finally {
      setIsGeneratingQRPdf(false);
    }
  };

  // Handle email delivery
  const handleEmailDelivery = async () => {
    if (!organization?.id || !finalWarningId) return;

    const employeeEmailOnRecord = selectedEmployee?.profile?.email || selectedEmployee?.email || '';
    const isManualPath = useAlternativeEmail || !employeeEmailOnRecord;

    setIsEmailDelivering(true);
    setEmailDeliveryError(null);

    try {
      if (!isManualPath) {
        // === AUTOMATED PATH: generate PDF, upload, send email ===
        setEmailDeliveryStatus('generating_pdf');
        const blob = await generatePDFBlob();

        // Upload PDF to Storage
        setEmailDeliveryStatus('uploading_pdf');
        const pdfFilename = `Warning_${selectedCategory?.name || 'Document'}_${employeeName}_${formData.issueDate}.pdf`;
        const storagePath = `warnings/${organization.id}/${finalWarningId}/pdfs/${pdfFilename}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });

        // Update warning doc with PDF info
        const warningRef = doc(db, 'organizations', organization.id, 'warnings', finalWarningId);
        await updateDoc(warningRef, {
          pdfGenerated: true,
          pdfFilename,
        });

        // Call Cloud Function to send email
        setEmailDeliveryStatus('sending_email');
        const deliverFn = httpsCallable(functions, 'deliverWarningByEmail');
        const result = await deliverFn({
          warningId: finalWarningId,
          organizationId: organization.id,
          employeeEmail: employeeEmailOnRecord,
          pdfFilename,
        });

        const data = result.data as any;
        if (data.success) {
          setEmailDeliveryStatus('success');
          setSelectedDeliveryMethod('email');
          // Show celebration after a brief delay
          setTimeout(() => setShowSuccessCelebration(true), 1500);
        } else {
          setEmailDeliveryStatus('failed');
          setEmailDeliveryError(data.error || 'Email delivery failed');
        }
      } else {
        // === MANUAL PATH: just notify HR ===
        setEmailDeliveryStatus('sending_email');
        const deliverFn = httpsCallable(functions, 'deliverWarningByEmail');
        const result = await deliverFn({
          warningId: finalWarningId,
          organizationId: organization.id,
          alternativeEmail: alternativeEmail || undefined,
        });

        const data = result.data as any;
        if (data.success) {
          setEmailDeliveryStatus('success');
          setSelectedDeliveryMethod('email');
          // Show celebration after a brief delay
          setTimeout(() => setShowSuccessCelebration(true), 1500);
        } else {
          setEmailDeliveryStatus('failed');
          setEmailDeliveryError(data.error || 'Failed to notify HR');
        }
      }
    } catch (error: any) {
      Logger.error('Email delivery failed:', error);
      setEmailDeliveryStatus('failed');
      setEmailDeliveryError(
        error?.message?.includes('already-exists')
          ? 'This warning has already been delivered via email.'
          : error?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsEmailDelivering(false);
    }
  };

  // Handle manager signature completion
  const handleManagerSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, manager: signature }));
  }, []);

  // Helper function to add "WITNESS" watermark to SVG signature
  const addWitnessWatermark = useCallback((signatureDataUrl: string): Promise<string> => {
    return Promise.resolve(applyWitnessWatermarkToSVG(signatureDataUrl));
  }, []);

  // Handle employee signature (clears witness)
  const handleEmployeeSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, employee: signature, witness: null }));
  }, []);

  // Handle witness signature with watermark (clears employee)
  const handleWitnessSignature = useCallback(async (signature: string | null) => {
    if (signature) {
      try {
        const watermarkedSignature = await addWitnessWatermark(signature);
        setSignatures(prev => ({ ...prev, witness: watermarkedSignature, employee: null }));
      } catch (error) {
        Logger.error('Failed to apply witness watermark:', error);
        setSignatures(prev => ({ ...prev, witness: signature, employee: null }));
      }
    } else {
      setSignatures(prev => ({ ...prev, witness: null }));
    }
  }, [addWitnessWatermark]);

  // ============================================
  // PHASE RENDERERS
  // ============================================

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case Phase.EMPLOYEE_SELECTION:
        return (
          <div className="space-y-4">
            <EmployeeSelector
              employees={employees}
              selectedEmployeeId={formData.employeeId}
              onEmployeeSelect={(id) => setFormData(prev => ({ ...prev, employeeId: id }))}
              warningHistory={warningHistory}
            />
          </div>
        );

      case Phase.INCIDENT_DETAILS:
        return (
          <IncidentDetailsForm
            formData={formData}
            onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            evidenceItems={pendingEvidenceItems}
            onEvidenceAdd={(item) => setPendingEvidenceItems(prev => [...prev, item])}
            onEvidenceRemove={(id) => setPendingEvidenceItems(prev => prev.filter(i => i.id !== id))}
          />
        );

      case Phase.CATEGORY_RECOMMENDATION:
        return (
          <div className="space-y-4">
            <CategorySelector
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onCategorySelect={(id) => {
                // Reset state and trigger analysis via useEffect
                setLraRecommendation(null);
                setHrInterventionRequired(false);
                // 🔥 FIX: Update selectedCategory BEFORE formData to avoid race condition
                // The generateLRARecommendation useEffect uses selectedCategory state
                const category = categories.find(c => c.id === id);
                setSelectedCategory(category);
                setFormData(prev => ({ ...prev, categoryId: id }));
                // Pre-populate expected standards template if available and field is empty
                if (category?.expectedStandardsTemplate && !expectedBehavior) {
                  setExpectedBehavior(category.expectedStandardsTemplate);
                }
              }}
              lraRecommendation={lraRecommendation}
            />

            {/* Show spinner when analyzing OR when no recommendation yet (after category selected) */}
            {!hrInterventionRequired && (isAnalyzing || (!lraRecommendation && formData.categoryId)) && (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-gray-700">Analyzing warning history...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait</p>
              </div>
            )}

            {lraRecommendation && !hrInterventionRequired && (
              <ThemedCard padding="md" className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      Recommended: {lraRecommendation.recommendedLevel || getWarningLevelInfo(lraRecommendation.suggestedLevel).label}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {lraRecommendation.reason}
                    </p>

                    {/* Active warnings on file - clickable for details */}
                    {lraRecommendation.activeWarnings && lraRecommendation.activeWarnings.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          Active Warnings ({lraRecommendation.activeWarnings.length}):
                        </p>
                        <div className="space-y-1.5">
                          {lraRecommendation.activeWarnings.slice(0, 3).map((warning: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedWarningDetails(warning)}
                              className="group w-full text-left text-xs flex items-center gap-2 p-2 rounded-lg border transition-all duration-150 cursor-pointer hover:shadow-sm active:scale-[0.98]"
                              style={{
                                backgroundColor: 'var(--color-card-background)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-bg)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.backgroundColor = 'var(--color-card-background)';
                              }}
                              title="Tap to view warning details"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
                              <span className="flex-1 group-hover:text-blue-600 transition-colors">
                                {getWarningLevelInfo(warning.level || warning.suggestedLevel).label} - {warning.categoryName || warning.category || 'General'}
                                {warning.issueDate && ` (${new Date(warning.issueDate).toLocaleDateString('en-ZA')})`}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                          {lraRecommendation.activeWarnings.length > 3 && (
                            <p className="text-xs pl-2" style={{ color: 'var(--color-text-tertiary)' }}>
                              +{lraRecommendation.activeWarnings.length - 3} more warnings
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No warnings - clean record */}
                    {(!lraRecommendation.activeWarnings || lraRecommendation.activeWarnings.length === 0) && (
                      <div className="mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                          No active warnings on file
                        </span>
                      </div>
                    )}

                    {/* Escalation indicator */}
                    {lraRecommendation.isEscalation && (
                      <div className="mt-2 px-2 py-1 rounded text-xs inline-flex items-center gap-1" style={{
                        backgroundColor: 'var(--color-alert-warning-bg)',
                        color: 'var(--color-alert-warning-text)'
                      }}>
                        <AlertTriangle className="w-3 h-3" />
                        Escalation from previous warning
                      </div>
                    )}
                  </div>
                </div>
              </ThemedCard>
            )}

            {hrInterventionRequired && (
              <div className="rounded-xl border-2 p-5 space-y-4"
                style={{
                  borderColor: '#dc2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.05)'
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#dc2626' }}>
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#dc2626' }}>
                      {hrInterventionRequired === 'final_warning'
                        ? 'HR Intervention Required'
                        : 'Serious Matter — Immediate HR Involvement Required'}
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      This cannot be handled through the warning system
                    </p>
                  </div>
                </div>

                <div className="rounded-lg p-4 space-y-3"
                  style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    What you must do:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-sm mt-0.5" style={{ color: '#dc2626' }}>1.</span>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        <strong>Take the employee to HR immediately</strong> to report this incident.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-sm mt-0.5" style={{ color: '#dc2626' }}>2.</span>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        If the employee <strong>refuses or is unable to accompany you</strong>, report the incident to HR yourself immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {hrInterventionRequired === 'final_warning'
                    ? 'This employee already has a final written warning on file for this category. Any further action must be conducted by HR.'
                    : 'Based on the severity of this offense and the employee\'s disciplinary history, this matter may require formal dismissal proceedings which must be conducted by HR.'}
                </p>
              </div>
            )}
          </div>
        );

      case Phase.EMPLOYEE_RESPONSE:
        return (
          <div className="space-y-4">
            {!levelInfo.requiresCommitments && (
              <ThemedAlert variant="info">
                For {levelInfo.label} warnings, this section is optional.
              </ThemedAlert>
            )}
            <textarea
              value={employeeStatement}
              onChange={(e) => setEmployeeStatement(e.target.value)}
              placeholder="Record the employee's response to the incident discussion..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: getWordCount(employeeStatement) > 0 && getWordCount(employeeStatement) < 6
                  ? 'var(--color-alert-error-bg)'
                  : 'var(--color-background)',
                borderColor: getWordCount(employeeStatement) > 0 && getWordCount(employeeStatement) < 6
                  ? 'var(--color-alert-error-border)'
                  : 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
            <div className="flex items-center justify-between text-xs" style={{
              color: getWordCount(employeeStatement) > 0 && getWordCount(employeeStatement) < 6
                ? 'var(--color-error)'
                : 'var(--color-text-secondary)'
            }}>
              <span>{getWordCount(employeeStatement)}/6 words minimum</span>
              {getWordCount(employeeStatement) >= 6 && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          </div>
        );

      case Phase.EXPECTED_STANDARDS:
        return (
          <div className="space-y-4">
            {selectedCategory?.expectedStandardsTemplate && expectedBehavior === selectedCategory.expectedStandardsTemplate && (
              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit"
                style={{ backgroundColor: 'var(--color-alert-info-bg)', color: 'var(--color-alert-info-text)' }}>
                <Info className="w-3 h-3" />
                Pre-filled from category template — edit as needed
              </div>
            )}
            <textarea
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="Document the expected behavior, performance, or conduct standards..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: getWordCount(expectedBehavior) > 0 && getWordCount(expectedBehavior) < 6
                  ? 'var(--color-alert-error-bg)'
                  : 'var(--color-background)',
                borderColor: getWordCount(expectedBehavior) > 0 && getWordCount(expectedBehavior) < 6
                  ? 'var(--color-alert-error-border)'
                  : 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
            <div className="flex items-center justify-between text-xs" style={{
              color: getWordCount(expectedBehavior) > 0 && getWordCount(expectedBehavior) < 6
                ? 'var(--color-error)'
                : 'var(--color-text-secondary)'
            }}>
              <span>{getWordCount(expectedBehavior)}/6 words minimum</span>
              {getWordCount(expectedBehavior) >= 6 && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          </div>
        );

      case Phase.IMPROVEMENT_PLAN:
        return (
          <div className="space-y-4">
            {!levelInfo.requiresCommitments && (
              <ThemedAlert variant="info">
                For {levelInfo.label} warnings, improvement commitments are optional.
              </ThemedAlert>
            )}

            {/* Commitments */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
                Action Commitments
              </label>
              {actionCommitments.map((commitment, index) => (
                <div
                  key={commitment.id}
                  className="mb-3 p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">What will be done</label>
                      <input
                        type="text"
                        value={commitment.commitment}
                        onChange={(e) => {
                          const updated = [...actionCommitments];
                          updated[index].commitment = e.target.value;
                          setActionCommitments(updated);
                        }}
                        placeholder="e.g., Arrive 10 minutes early"
                        className="w-full px-3 py-2 rounded border text-sm"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setActionCommitments(actionCommitments.filter(c => c.id !== commitment.id))}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      aria-label="Remove commitment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">By when</label>
                    <input
                      type="text"
                      value={commitment.timeline}
                      onChange={(e) => {
                        const updated = [...actionCommitments];
                        updated[index].timeline = e.target.value;
                        setActionCommitments(updated);
                      }}
                      placeholder="e.g., Immediately, Within 1 week"
                      className="w-full px-3 py-2 rounded border text-sm"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                </div>
              ))}
              <ThemedButton
                variant="outline"
                size="sm"
                onClick={() => setActionCommitments([...actionCommitments, { id: generateId(), commitment: '', timeline: '' }])}
              >
                + Add Commitment
              </ThemedButton>
            </div>

            {/* Review Date */}
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
                Follow-up Review Date
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            {/* Issue Date & Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
                  Validity Period
                </label>
                <select
                  value={formData.validityPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) as 3 | 6 | 12 }))}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </div>
          </div>
        );

      case Phase.REVIEW_DOCUMENTATION:
        return (
          <ReviewDocumentationPhase
            levelInfo={levelInfo}
            employeeName={employeeName}
            selectedCategory={selectedCategory}
            formData={formData}
            pendingEvidenceItems={pendingEvidenceItems}
            employeeStatement={employeeStatement}
            expectedBehavior={expectedBehavior}
            actionCommitments={actionCommitments}
            reviewDate={reviewDate}
            goToPhase={goToPhase}
          />
        );

      case Phase.SCRIPT_PDF_REVIEW:
        return (
          <ScriptPdfReviewPhase
            employeeName={employeeName}
            currentManagerName={currentManagerName}
            selectedCategory={selectedCategory}
            formData={formData}
            currentLevel={currentLevel}
            scriptReadConfirmed={scriptReadConfirmed}
            setScriptReadConfirmed={setScriptReadConfirmed}
            hasAcknowledged={hasAcknowledged}
            setHasAcknowledged={setHasAcknowledged}
            lraRecommendation={lraRecommendation}
          />
        );

      case Phase.SIGNATURES:
        return (
          <SignaturesPhase
            currentManagerName={currentManagerName}
            employeeName={employeeName}
            signatures={signatures}
            signatureType={signatureType}
            setSignatureType={setSignatureType}
            employeeViewedPDF={employeeViewedPDF}
            setEmployeeViewedPDF={setEmployeeViewedPDF}
            setShowPDFPreview={setShowPDFPreview}
            activeSignatureModal={activeSignatureModal}
            setActiveSignatureModal={setActiveSignatureModal}
            handleManagerSignature={handleManagerSignature}
            handleEmployeeSignature={handleEmployeeSignature}
            handleWitnessSignature={handleWitnessSignature}
          />
        );

      case Phase.DELIVERY:
        return (
          <DeliveryPhase
            selectedEmployee={selectedEmployee}
            selectedDeliveryMethod={selectedDeliveryMethod}
            setSelectedDeliveryMethod={setSelectedDeliveryMethod}
            finalWarningId={finalWarningId}
            audioUploadWarning={audioUploadWarning}
            evidenceUploadWarning={evidenceUploadWarning}
            isEmailDelivering={isEmailDelivering}
            emailDeliveryStatus={emailDeliveryStatus}
            setEmailDeliveryStatus={setEmailDeliveryStatus}
            emailDeliveryError={emailDeliveryError}
            setEmailDeliveryError={setEmailDeliveryError}
            useAlternativeEmail={useAlternativeEmail}
            setUseAlternativeEmail={setUseAlternativeEmail}
            alternativeEmail={alternativeEmail}
            setAlternativeEmail={setAlternativeEmail}
            isGeneratingQRPdf={isGeneratingQRPdf}
            handleQRCodeDelivery={handleQRCodeDelivery}
            handleEmailDelivery={handleEmailDelivery}
          />
        );

      default:
        return null;
    }
  };

  // Handle cancel with audio cleanup (must be before any early returns)
  const handleCancel = useCallback(() => {
    // Stop any ongoing recording
    if (audioRecording.isRecording) {
      audioRecording.forceCleanup();
    }
    onCancel();
  }, [audioRecording, onCancel]);

  const phaseInfo = PHASE_INFO[currentPhase];

  // ============================================
  // MAIN RENDER
  // ============================================

  // Show microphone permission handler first (only if audio recording is enabled)
  if (isAudioEnabled && showPermissionHandler && !microphonePermissionGranted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <MicrophonePermissionHandler
            onPermissionGranted={() => {
              setMicrophonePermissionGranted(true);
              setShowPermissionHandler(false);
            }}
            onPermissionDenied={() => setShowPermissionHandler(false)}
            onSkip={() => setShowPermissionHandler(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success Celebration */}
      <SuccessCelebration
        isVisible={showSuccessCelebration}
        message="Warning Issued Successfully!"
        subMessage={`${employeeName} has been notified via ${selectedDeliveryMethod}`}
        onComplete={handleCelebrationComplete}
        duration={3000}
        showConfetti={true}
      />

      {/* Main Wizard Container */}
      <div
        ref={focusTrapRef}
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000]
          flex items-center justify-center
          ${isMobile ? 'p-0' : 'p-4'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        aria-describedby="wizard-guidance"
      >
        <div
          ref={swipeContainerRef as React.RefObject<HTMLDivElement>}
          className={`
            bg-white shadow-2xl w-full
            ${isMobile
              ? 'h-full rounded-none wizard-mobile-enter'
              : 'max-w-2xl max-h-[90vh] rounded-xl'
            }
            overflow-hidden flex flex-col
          `}
        >
          {/* Fixed header - stays visible on scroll */}
          <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
            {/* Header with close button - WCAG touch targets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2
                  id="wizard-title"
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Issue Warning
                </h2>
                {/* Recording indicator - only show if audio is enabled */}
                {isAudioEnabled && audioRecording.isRecording && (
                  <div
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full wizard-recording-indicator"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 wizard-recording-dot" />
                    <span className="text-xs font-medium tabular-nums" style={{ color: '#dc2626' }}>
                      {audioRecording.formatDuration(audioRecording.duration)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="wizard-touch-target p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors wizard-button-tap"
                aria-label="Close wizard"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Progress indicator - also fixed */}
            <div className="mt-3">
              <PhaseProgress
                currentPhase={currentPhase}
                totalPhases={TOTAL_PHASES}
                completedPhases={completedPhases}
                onPhaseClick={goToPhase}
              />
            </div>
          </div>

          {/* Scrollable content area */}
          <div
            ref={contentContainerRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="enhanced-warning-wizard-container p-4">
              {/* Phase content with transition animation */}
              <ThemedCard padding="md">
                <PhaseHeader
                  title={phaseInfo.title}
                  icon={phaseInfo.icon}
                  phaseNumber={currentPhase + 1}
                  totalPhases={TOTAL_PHASES}
                  employeeName={currentPhase > 0 ? employeeName : undefined}
                  incidentDate={currentPhase > 1 ? formData.incidentDate : undefined}
                />

                <PhaseGuidance>
                  <span id="wizard-guidance">{phaseInfo.guidance}</span>
                </PhaseGuidance>

                {/* Animated phase content */}
                <div
                  className={`
                    ${isTransitioning
                      ? transitionDirection === 'next'
                        ? 'wizard-phase-enter-next'
                        : 'wizard-phase-enter-prev'
                      : ''
                    }
                  `}
                >
                  {renderPhaseContent()}
                </div>

                {/* HR intervention: replace navigation with Back + I Understand */}
                {hrInterventionRequired && currentPhase === Phase.CATEGORY_RECOMMENDATION ? (
                  <div
                    className="flex items-center justify-between mt-6 pt-4 border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <ThemedButton
                      variant="outline"
                      onClick={handlePreviousPhase}
                      icon={ChevronLeft}
                    >
                      Back
                    </ThemedButton>
                    <button
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.97]"
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                      }}
                    >
                      I Understand
                    </button>
                  </div>
                ) : (
                  <PhaseNavigation
                    currentPhase={currentPhase}
                    totalPhases={TOTAL_PHASES}
                    isValid={isPhaseValid}
                    isLoading={isSaving || isLoading}
                    onPrevious={handlePreviousPhase}
                    onNext={currentPhase === Phase.SIGNATURES ? handleSaveWarning : handleNextPhase}
                    customNextText={currentPhase === Phase.SIGNATURES ? 'Save Warning' : undefined}
                    showFinalize={currentPhase === Phase.DELIVERY}
                    onFinalize={handleFinalize}
                  />
                )}

                {/* Save Warning feedback when button is disabled */}
                {currentPhase === Phase.SIGNATURES && !isPhaseValid && (
                  <p className="text-xs text-center mt-2" style={{ color: 'var(--color-error)' }}>
                    {!signatures.manager ? 'Manager signature required' :
                     !employeeViewedPDF ? 'Employee must view PDF first' :
                     !(signatures.employee || signatures.witness) ? 'Employee or witness signature required' :
                     'Please complete all required steps'}
                  </p>
                )}
              </ThemedCard>
            </div>
          </div>

          {/* Mobile swipe hint - only show on first phase on mobile */}
          {isMobile && currentPhase === 0 && (
            <div
              className="px-4 py-2 text-center text-xs border-t"
              style={{
                backgroundColor: 'var(--color-alert-info-bg)',
                color: 'var(--color-alert-info-text)',
                borderColor: 'var(--color-border-light)'
              }}
            >
              💡 Swipe left/right to navigate between phases
            </div>
          )}
        </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        warningData={{
          wizardState: {
            currentStep: currentPhase,
            selectedEmployee,
            selectedCategory,
            formData: {
              ...formData,
              employeeStatement,
              expectedBehaviorStandards: expectedBehavior,
              actionSteps: actionCommitments.map(c => ({
                action: c.commitment,
                timeline: c.timeline
              })),
              reviewDate,
              interventionDetails,
              resourcesProvided
            },
            signatures,
            lraRecommendation,
            organizationId: organization?.id || ''
          },
          selectedEmployee,
          selectedCategory,
          organizationId: organization?.id
        }}
        title="Warning Document Preview"
      />

      {/* QR Code Download Modal */}
      {qrPdfBlob && (
        <QRCodeDownloadModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          pdfBlob={qrPdfBlob}
          filename={`Warning_${selectedCategory?.name || 'Document'}_${employeeName}_${formData.issueDate}.pdf`}
          employeeId={formData.employeeId}
          warningId={finalWarningId}
          organizationId={organization?.id}
          employeeName={employeeName}
        />
      )}

      {/* Warning Details Modal */}
      {selectedWarningDetails && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9100] flex items-center justify-center p-4"
          onClick={() => setSelectedWarningDetails(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                Warning Details
              </h3>
              <button
                onClick={() => setSelectedWarningDetails(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Level</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {getWarningLevelInfo(selectedWarningDetails.level || selectedWarningDetails.suggestedLevel).label}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {selectedWarningDetails.categoryName || selectedWarningDetails.category || 'General'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Issue Date</p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {selectedWarningDetails.issueDate
                    ? new Date(selectedWarningDetails.issueDate).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Not recorded'}
                </p>
              </div>

              {selectedWarningDetails.expiryDate && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Expiry Date</p>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {new Date(selectedWarningDetails.expiryDate).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {selectedWarningDetails.description && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Description</p>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {selectedWarningDetails.description}
                  </p>
                </div>
              )}

              {selectedWarningDetails.issuedByName && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Issued By</p>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {selectedWarningDetails.issuedByName}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedWarningDetails(null)}
              className="w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-colors wizard-touch-target wizard-button-tap"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

// Minimal review row - clean, scannable, tappable
const ReviewRow: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group flex items-start gap-3"
    aria-label={`Edit ${label}`}
  >
    <span
      className="text-xs font-medium w-24 flex-shrink-0 pt-0.5"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {label}
    </span>
    <span
      className="flex-1 text-sm leading-relaxed"
      style={{
        color: 'var(--color-text-primary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {children}
    </span>
    <ChevronRight
      className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5"
      style={{ color: 'var(--color-text-secondary)' }}
    />
  </button>
);


export default UnifiedWarningWizard;
