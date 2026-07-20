// frontend/src/components/warnings/v2/UnifiedWarningWizardV2.tsx
//
// V2 warning wizard orchestrator. 6 phase slots (1 intro + 5 working
// steps) instead of V1's 10. Reuses all V1 phase components and the V1
// save handler — this file is composition + the new Phase 0 announcement
// + audio-on-Continue gating, NOT a logic rewrite.
//
// Key differences from V1 (intentional, per V2 plan):
//   - Phase 0 Overview announces what's coming so the rest is not a surprise.
//   - Audio recording starts when the user clicks Continue on Phase 0,
//     not silently when the wizard opens.
//   - The 5 working phases collapse V1's 10 along natural conversation lines.
//   - Sign & Save merges Review + Script + Signatures into one screen.
//   - Save handler (handleSaveWarning) and Firestore writes are identical to V1.

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../../../config/firebase';
import { X, ChevronLeft } from 'lucide-react';
import Logger from '../../../utils/logger';

// Shared wizard chrome (reused from V1)
import {
  PhaseHeader,
  PhaseGuidance,
  PhaseNavigation,
  PhaseProgress,
  SuccessCelebration,
} from '../enhanced/shared';

// Accessibility & UX hooks
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { useSwipeNavigation } from '../../../hooks/useSwipeNavigation';

// Wizard animations CSS (reused)
import '../../../styles/wizard-animations.css';

// Modals (reused)
import { PDFPreviewModal } from '../enhanced/PDFPreviewModal';
import { QRCodeDownloadModal } from '../modals/QRCodeDownloadModal';
import { MicrophonePermissionHandler } from '../enhanced/components/MicrophonePermissionHandler';

// Signature watermark utility
import { applyWitnessWatermarkToSVG } from '../../../utils/signatureSVG';

// Phone helpers (shared with employee CSV import)
import { toWhatsAppNumber, isValidPhoneNumber } from '../../../utils/phone';

// Themed components
import { ThemedCard } from '../../common/ThemedCard';
import { ThemedButton } from '../../common/ThemedButton';

// Hooks and services
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/auth/AuthContext';
import { useAudioRecording } from '../../../hooks/warnings/useAudioRecording';
import { API } from '@/api';

// Types
import type { EscalationRecommendation } from '@/services/WarningService';
import type { EvidenceItem } from '@/types/warning';

// V1 helpers (reused)
import {
  getSouthAfricanTime,
  getSouthAfricanDate,
  getWordCount,
  getWarningLevelInfo,
} from '../enhanced/wizardHelpers';

// PDF services (reused)
import { PDF_GENERATOR_VERSION } from '@/services/PDFGenerationService';
import { PDFTemplateVersionService } from '@/services/PDFTemplateVersionService';

// V2 phase components
import { WizardOverviewPhase } from './phases/WizardOverviewPhase';
import { SetupPhaseV2 } from './phases/SetupPhaseV2';
import { IncidentPhaseV2 } from './phases/IncidentPhaseV2';
import { ConversationPhaseV2 } from './phases/ConversationPhaseV2';
import { SignAndSavePhaseV2 } from './phases/SignAndSavePhaseV2';
import { DeliveryPhaseV2 } from './phases/DeliveryPhaseV2';

// V2 types
import {
  PhaseV2,
  PHASE_INFO_V2,
  TOTAL_PHASES_V2,
  VISIBLE_STEPS_V2,
  type FormData,
  type SignatureData,
  type ActionCommitment,
  type UnifiedWarningWizardProps,
} from './wizardTypesV2';

// ============================================
// PRACTICE MODE — SAMPLE EMPLOYEE
// ============================================
// Local-only. NEVER written to Firestore. Used only when the wizard is in
// practice mode so a new manager can rehearse the flow with realistic-looking
// data. The email domain is RFC-2606 reserved (example.com is safe — it can't
// be a real address).
const TEST_EMPLOYEE = {
  id: 'TEST-PRACTICE-EMPLOYEE',
  firstName: 'Test',
  lastName: 'Employee',
  employeeNumber: 'TEST-PRACTICE-001',
  position: 'Team Member',
  department: 'Operations',
  email: 'sample.employee@example.com',
  phone: '+27 00 000 0000',
  whatsappNumber: '+27 00 000 0000',
  profile: {
    firstName: 'Test',
    lastName: 'Employee',
    employeeNumber: 'TEST-PRACTICE-001',
    position: 'Team Member',
    department: 'Operations',
    email: 'sample.employee@example.com',
    phoneNumber: '+27 00 000 0000',
    whatsappNumber: '+27 00 000 0000',
  },
} as any;

// ============================================
// MAIN COMPONENT
// ============================================

export const UnifiedWarningWizardV2: React.FC<UnifiedWarningWizardProps> = ({
  employees,
  categories,
  currentManagerName,
  organizationName,
  onComplete,
  onCancel,
  preSelectedEmployeeId,
  preSelectedCategoryId,
  isFullScreen: _isFullScreen,
  preloadedWarnings,
  startInPracticeMode,
  onPracticeComplete,
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const audioRecording = useAudioRecording();

  const isAudioEnabled = organization?.customization?.enableAudioRecording ?? true;

  // ============================================
  // REFS & ENHANCED HOOKS
  // ============================================

  const contentContainerRef = useRef<HTMLDivElement>(null);
  const previousPhaseRef = useRef<number>(0);

  const focusTrapRef = useFocusTrap({
    isActive: true,
    onEscape: onCancel,
    autoFocus: true,
    returnFocus: true,
  });

  // ============================================
  // STATE
  // ============================================

  const [currentPhase, setCurrentPhase] = useState<PhaseV2>(PhaseV2.OVERVIEW);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());

  // Enhanced UX state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next');
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [audioUploadWarning, setAudioUploadWarning] = useState(false);
  const [evidenceUploadWarning, setEvidenceUploadWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Practice mode: full UX rehearsal with a sample employee, nothing is saved
  // or sent. Toggled on from the Phase 0 "Try a test warning" card and cleared
  // when the manager steps back to Phase 0.
  const [isTestMode, setIsTestMode] = useState(false);

  // Form data
  const [formData, setFormData] = useState<FormData>(() => ({
    employeeId: preSelectedEmployeeId || '',
    categoryId: preSelectedCategoryId || '',
    incidentDate: getSouthAfricanDate(),
    incidentTime: getSouthAfricanTime(),
    incidentLocation: '',
    incidentDescription: '',
    level: 'counselling',
    issueDate: getSouthAfricanDate(),
    validityPeriod: 6,
  }));

  // Selected objects
  const [selectedEmployee, setSelectedEmployee] = useState<any>();
  const [selectedCategory, setSelectedCategory] = useState<any>();

  // LRA Analysis
  const [lraRecommendation, setLraRecommendation] = useState<EscalationRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overrideLevel] = useState<string | null>(null);
  const [warningHistory, setWarningHistory] = useState<any[]>([]);
  const warningHistoryLoaded = useRef(false);
  const [hrInterventionRequired, setHrInterventionRequired] =
    useState<false | 'final_warning' | 'dismissal'>(false);

  // Corrective discussion
  const [employeeStatement, setEmployeeStatement] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  // Tracks the last category template auto-applied to `expectedBehavior` so we
  // can tell whether the field is "untouched" (still equal to that template)
  // and safe to refresh when the user switches category, vs user-typed text
  // that we must preserve.
  const previousCategoryTemplateRef = useRef<string | undefined>(undefined);
  const [actionCommitments, setActionCommitments] = useState<ActionCommitment[]>([]);
  const [reviewDate, setReviewDate] = useState('');
  const [interventionDetails] = useState('');
  const [resourcesProvided] = useState<string[]>([]);

  // Evidence files
  const [pendingEvidenceItems, setPendingEvidenceItems] = useState<EvidenceItem[]>([]);

  // Signatures
  const [signatures, setSignatures] = useState<SignatureData>({
    manager: null,
    employee: null,
    witness: null,
    managerName: currentManagerName,
  });
  const [signatureType, setSignatureType] = useState<'employee' | 'witness'>('employee');
  const [employeeViewedPDF, setEmployeeViewedPDF] = useState(false);
  const [activeSignatureModal, setActiveSignatureModal] = useState<'manager' | 'employee' | null>(null);

  // PDF & Script
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [scriptReadConfirmed, setScriptReadConfirmed] = useState(false);

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

  // WhatsApp delivery state. The PDF can't be pre-attached to a click-to-chat
  // link, so we send the durable respond/appeal link (180-day token) in the
  // message text. Manager confirms the number with the employee (present in the
  // meeting) before WhatsApp opens, then attests they sent it.
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
  const [isWhatsAppDelivering, setIsWhatsAppDelivering] = useState(false);
  const [whatsappDeliveryStatus, setWhatsappDeliveryStatus] = useState<
    'idle' | 'generating_link' | 'opened' | 'sent' | 'failed'
  >('idle');
  const [whatsappDeliveryError, setWhatsappDeliveryError] = useState<string | null>(null);
  const [whatsappResponseUrl, setWhatsappResponseUrl] = useState('');

  // Printed delivery state. Printed means "the employee will collect a physical
  // copy from HR" — the warning is recorded as awaiting collection and HR is
  // emailed to print it and have it ready.
  const [isPrintedDelivering, setIsPrintedDelivering] = useState(false);
  const [printedDeliveryStatus, setPrintedDeliveryStatus] = useState<
    'idle' | 'sending' | 'sent' | 'failed'
  >('idle');
  const [printedDeliveryError, setPrintedDeliveryError] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // V2: permission handler is OFF by default. Triggered only when user clicks
  // Continue on Phase 0 Overview AND audio is enabled.
  const [showPermissionHandler, setShowPermissionHandler] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPdfBlob, setQrPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingQRPdf, setIsGeneratingQRPdf] = useState(false);
  const [selectedWarningDetails, setSelectedWarningDetails] = useState<any>(null);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentLevel = useMemo(
    () => overrideLevel || lraRecommendation?.suggestedLevel || 'counselling',
    [overrideLevel, lraRecommendation],
  );

  const levelInfo = useMemo(() => getWarningLevelInfo(currentLevel), [currentLevel]);

  const employeeName = useMemo(() => {
    if (!selectedEmployee) return '';
    const firstName = selectedEmployee.profile?.firstName || selectedEmployee.firstName || '';
    const lastName = selectedEmployee.profile?.lastName || selectedEmployee.lastName || '';
    return `${firstName} ${lastName}`.trim();
  }, [selectedEmployee]);

  // Pre-fill the WhatsApp number from the employee's record (WhatsApp number
  // preferred, falling back to their phone number). Manager can still edit it.
  useEffect(() => {
    const onRecord =
      selectedEmployee?.profile?.whatsappNumber ||
      selectedEmployee?.profile?.phoneNumber ||
      selectedEmployee?.whatsappNumber ||
      selectedEmployee?.phoneNumber ||
      '';
    setWhatsappNumber(onRecord);
  }, [selectedEmployee]);

  // ============================================
  // PHASE VALIDATION
  // ============================================

  const isPhaseValid = useMemo(() => {
    switch (currentPhase) {
      case PhaseV2.OVERVIEW:
        return true;

      case PhaseV2.SETUP:
        return !!(
          formData.employeeId &&
          formData.categoryId &&
          !isAnalyzing &&
          !hrInterventionRequired
        );

      case PhaseV2.INCIDENT: {
        const words = (formData.incidentDescription || '').trim().split(/\s+/).filter((w) => w.length > 0);
        return !!(
          formData.incidentDate &&
          formData.incidentTime &&
          formData.incidentLocation?.length >= 3 &&
          words.length >= 6
        );
      }

      case PhaseV2.CONVERSATION: {
        // Expected standards always required.
        if (getWordCount(expectedBehavior) < 6) return false;
        // Employee response + improvement plan only required when level requires commitments.
        if (levelInfo.requiresCommitments) {
          if (getWordCount(employeeStatement) < 6) return false;
          if (actionCommitments.length === 0) return false;
          if (!reviewDate) return false;
          if (!formData.issueDate) return false;
        }
        return true;
      }

      case PhaseV2.SIGN_AND_SAVE:
        return !!(
          scriptReadConfirmed &&
          hasAcknowledged &&
          signatures.manager &&
          employeeViewedPDF &&
          (signatures.employee || signatures.witness) &&
          selectedEmployee &&
          selectedCategory &&
          organization?.id
        );

      case PhaseV2.DELIVERY:
        // Email, WhatsApp and Printed self-finalize inside their own panels, so
        // the shared Finalize button stays disabled for them.
        return !!selectedDeliveryMethod
          && selectedDeliveryMethod !== 'email'
          && selectedDeliveryMethod !== 'whatsapp'
          && selectedDeliveryMethod !== 'printed';

      default:
        return false;
    }
  }, [
    currentPhase, formData, isAnalyzing, hrInterventionRequired, levelInfo,
    expectedBehavior, employeeStatement, actionCommitments, reviewDate,
    scriptReadConfirmed, hasAcknowledged, signatures, employeeViewedPDF,
    selectedEmployee, selectedCategory, organization?.id, selectedDeliveryMethod,
  ]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hardware back button confirmation
  useEffect(() => {
    window.history.pushState({ wizardOpen: true }, '');
    const handlePopState = () => {
      if (window.confirm('Are you sure you want to exit? Any unsaved progress will be lost.')) {
        onCancel();
      } else {
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
      if ('vibrate' in navigator && isMobile) navigator.vibrate(10);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      previousPhaseRef.current = currentPhase;
      return () => clearTimeout(timer);
    }
  }, [currentPhase, isMobile]);

  // Prefetch warning history when employee selected
  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find((e) => e.id === formData.employeeId);
      setSelectedEmployee(employee);
      warningHistoryLoaded.current = false;
      setWarningHistory([]);
      if (employee && organization?.id) {
        if (preloadedWarnings) {
          const employeeWarnings = preloadedWarnings.filter(
            (w: any) =>
              w.employeeId === employee.id &&
              w.isActive !== false &&
              w.status !== 'expired' &&
              w.status !== 'overturned',
          );
          setWarningHistory(employeeWarnings);
          warningHistoryLoaded.current = true;
        } else {
          API.warnings.getActiveWarnings(employee.id, organization.id)
            .then((warnings) => {
              setWarningHistory(warnings);
              warningHistoryLoaded.current = true;
            })
            .catch((err) => {
              warningHistoryLoaded.current = true;
              Logger.error('Failed to prefetch warning history:', err);
            });
        }
      }
    }
  }, [formData.employeeId, employees, organization?.id, preloadedWarnings]);

  // Load category when selected. Auto-fill Expected Standards from the
  // category's template — and refresh that fill if the user switches category
  // later, as long as they haven't typed custom text.
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find((c) => c.id === formData.categoryId);
      setSelectedCategory(category);

      const newTemplate = category?.expectedStandardsTemplate;
      const prevTemplate = previousCategoryTemplateRef.current;

      if (newTemplate) {
        // Replace if field is empty OR it still holds the previous category's
        // template (untouched). Preserve user-typed customisations.
        if (!expectedBehavior || expectedBehavior === prevTemplate) {
          setExpectedBehavior(newTemplate);
        }
      }

      previousCategoryTemplateRef.current = newTemplate;
    }
  }, [formData.categoryId, categories]);

  // Trigger LRA analysis when employee + category selected
  useEffect(() => {
    if (formData.employeeId && formData.categoryId && organization?.id && !lraRecommendation && !isAnalyzing) {
      generateLRARecommendation();
    }
  }, [formData.employeeId, formData.categoryId, organization?.id]);

  // V2: Primary start path runs inline in onPermissionGranted (see render below).
  // This effect is a backstop for cases where permission was already cached (singleton
  // fired the callback before we mounted) or where the user reached the Setup phase
  // through some other path without recording having started.
  useEffect(() => {
    if (!isAudioEnabled) return;
    if (currentPhase < PhaseV2.SETUP) return;
    if (!microphonePermissionGranted) return;
    if (audioRecording.isRecording) return;
    audioRecording.startRecording().catch((err) => {
      Logger.error('Failed to start audio recording (backstop):', err);
    });
  }, [isAudioEnabled, currentPhase, microphonePermissionGranted, audioRecording.isRecording]);

  // ============================================
  // HANDLERS
  // ============================================

  const generateLRARecommendation = async () => {
    if (!formData.employeeId || !formData.categoryId || !organization?.id) return;
    setIsAnalyzing(true);
    const startTime = Date.now();
    const MIN_LOADING_TIME = 300;
    try {
      const activeWarnings = warningHistoryLoaded.current
        ? warningHistory
        : await API.warnings.getActiveWarnings(formData.employeeId, organization.id);

      const currentCategoryForCheck = categories.find((c) => c.id === formData.categoryId) || selectedCategory;
      const categoryPath = currentCategoryForCheck?.escalationPath || [];
      const finalWrittenIdx = categoryPath.indexOf('final_written');
      const pathHasStepAfterFinal = finalWrittenIdx >= 0 && finalWrittenIdx < categoryPath.length - 1;

      const hasFinalWarningForCategory = activeWarnings.some((warning: any) =>
        (warning.level === 'final_written' ||
         warning.level === 'Final Written Warning' ||
         warning.suggestedLevel === 'final_written') &&
        warning.categoryId === formData.categoryId,
      );

      if (hasFinalWarningForCategory && !pathHasStepAfterFinal) {
        setHrInterventionRequired('final_warning');
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADING_TIME) {
          await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
        }
        setIsAnalyzing(false);
        return;
      }

      const currentCategory = categories.find((c) => c.id === formData.categoryId) || selectedCategory;
      const recommendation = await API.warnings.getEscalationRecommendation(
        formData.employeeId,
        formData.categoryId,
        organization.id,
        currentCategory,
        activeWarnings,
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      setLraRecommendation(recommendation);

      if (recommendation.suggestedLevel === 'dismissal') {
        setHrInterventionRequired('dismissal');
        setIsAnalyzing(false);
        return;
      }

      setFormData((prev) => ({ ...prev, level: recommendation.suggestedLevel }));
    } catch (error) {
      Logger.error('Failed to generate LRA recommendation:', error);
      const fallbackCategory = categories.find((c) => c.id === formData.categoryId) || selectedCategory;
      const categoryEscalationPath = fallbackCategory?.escalationPath || ['counselling', 'verbal_warning', 'first_written', 'final_written'];
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
          warningCount: 0,
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
        warningCount: 0,
      };
      setLraRecommendation(fallbackRecommendation);
      setFormData((prev) => ({ ...prev, level: fallbackRecommendation.suggestedLevel }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreviousPhase = useCallback(() => {
    if (currentPhase > 0) {
      // Stepping back to the Overview cancels a practice run — clear the dummy
      // employee so the manager can either re-enter practice mode or take the
      // real Continue path with a clean slate.
      if (currentPhase === PhaseV2.SETUP && isTestMode) {
        setIsTestMode(false);
        setSelectedEmployee(undefined);
        setSelectedCategory(undefined);
        setLraRecommendation(null);
        setFormData((prev) => ({ ...prev, employeeId: '', employeeName: '', categoryId: '' }));
      }
      setCurrentPhase((currentPhase - 1) as PhaseV2);
    }
  }, [currentPhase, isTestMode]);

  const handleNextPhase = useCallback(() => {
    if (!isPhaseValid || currentPhase >= TOTAL_PHASES_V2 - 1) return;

    // Special: leaving Phase 0 (Overview) triggers audio permission flow if enabled.
    if (currentPhase === PhaseV2.OVERVIEW) {
      setCompletedPhases((prev) => new Set([...prev, currentPhase]));
      if (isAudioEnabled && !microphonePermissionGranted) {
        // Open permission handler. Recording auto-starts via useEffect once granted
        // AND the handler closes (showPermissionHandler === false).
        setShowPermissionHandler(true);
      }
      setCurrentPhase(PhaseV2.SETUP);
      return;
    }

    // In practice mode, finishing Phase 4 (Sign & Save) is the end of the
    // rehearsal — Phase 5 (Delivery) is skipped because it would call real
    // Cloud Functions. The Phase 4 footer reroutes to handleFinishTestRun
    // (see PhaseNavigation wiring below), so this guard is belt-and-braces.
    if (isTestMode && currentPhase === PhaseV2.SIGN_AND_SAVE) {
      setShowSuccessCelebration(true);
      return;
    }

    setCompletedPhases((prev) => new Set([...prev, currentPhase]));
    setCurrentPhase((currentPhase + 1) as PhaseV2);
  }, [currentPhase, isPhaseValid, isAudioEnabled, microphonePermissionGranted, isTestMode]);

  const handleStartTestRun = useCallback(() => {
    setIsTestMode(true);
    setSelectedEmployee(TEST_EMPLOYEE);
    setFormData((prev) => ({
      ...prev,
      employeeId: TEST_EMPLOYEE.id,
      employeeName: `${TEST_EMPLOYEE.firstName} ${TEST_EMPLOYEE.lastName}`,
    }));
    setCompletedPhases((prev) => new Set([...prev, PhaseV2.OVERVIEW]));
    setCurrentPhase(PhaseV2.SETUP);
    // Deliberately skip the audio permission flow — practice is a UX rehearsal,
    // not a compliance recording, and a browser permission prompt mid-tutorial
    // is noisy.
  }, []);

  const handleFinishTestRun = useCallback(() => {
    setShowSuccessCelebration(true);
  }, []);

  // Setup-checklist entry (/warnings/create?practice=1): jump straight into practice
  const practiceStartedRef = useRef(false);
  useEffect(() => {
    if (startInPracticeMode && !practiceStartedRef.current) {
      practiceStartedRef.current = true;
      handleStartTestRun();
    }
  }, [startInPracticeMode, handleStartTestRun]);

  const goToPhase = useCallback((phase: PhaseV2) => {
    if (phase <= currentPhase || completedPhases.has(phase)) {
      setCurrentPhase(phase);
    }
  }, [currentPhase, completedPhases]);

  // Swipe navigation (mobile)
  const swipeContainerRef = useSwipeNavigation({
    onSwipeLeft: () => {
      if (isPhaseValid && currentPhase < TOTAL_PHASES_V2 - 1) handleNextPhase();
    },
    onSwipeRight: () => {
      if (currentPhase > 0) handlePreviousPhase();
    },
    enabled: isMobile,
    allowLeft: isPhaseValid && currentPhase < TOTAL_PHASES_V2 - 1,
    allowRight: currentPhase > 0,
  });

  const handleSaveWarning = async () => {
    // Belt-and-braces: the Phase 4 footer reroutes practice runs to
    // handleFinishTestRun, but if anything (keyboard shortcut, future
    // refactor, regression) calls this path while in practice mode the save
    // still must NOT reach Firestore or any Cloud Function.
    if (isTestMode) {
      Logger.warn('handleSaveWarning called in practice mode — short-circuiting');
      setShowSuccessCelebration(true);
      return;
    }

    if (!organization?.id) { Logger.error('Cannot save warning: No organization ID'); return; }
    if (!selectedEmployee) { Logger.error('Cannot save warning: No employee selected'); return; }
    if (!selectedCategory) { Logger.error('Cannot save warning: No category selected'); return; }

    Logger.info('Saving warning V2...', { employeeId: formData.employeeId, categoryId: formData.categoryId });
    setIsSaving(true);
    try {
      let pdfTemplateVersion: string | undefined;
      if (organization?.pdfSettings && user?.uid) {
        try {
          pdfTemplateVersion = await PDFTemplateVersionService.ensureTemplateVersionExists(
            organization.id, organization.pdfSettings, user.uid,
          );
        } catch (error) {
          Logger.error('Failed to save PDF template version:', error);
        }
      }

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
        employeeName,
        employeeLastName: selectedEmployee.profile?.lastName || selectedEmployee.lastName || '',
        employeeNumber: selectedEmployee.profile?.employeeNumber || selectedEmployee.employeeNumber || '',
        employeeDepartment: selectedEmployee.employment?.department || selectedEmployee.department || '',
        employeePosition: selectedEmployee.employment?.position || selectedEmployee.position || '',
        employeeEmail: selectedEmployee.profile?.email || selectedEmployee.email || '',
        issuedBy: user?.uid || user?.id || '',
        issuedByName: currentManagerName,
        signatures: {
          manager: signatures.manager,
          employee: signatures.employee || null,
          witness: signatures.witness || null,
          managerName: signatures.managerName || currentManagerName,
          ...(signatureType === 'employee' && { employeeName }),
          ...(signatureType === 'witness' && signatures.witnessName && { witnessName: signatures.witnessName }),
          signedAt: new Date().toISOString(),
        },
        employeeStatement,
        expectedBehaviorStandards: expectedBehavior,
        actionSteps: actionCommitments.map((c) => ({ action: c.commitment, timeline: c.timeline })),
        reviewDate,
        interventionDetails,
        resourcesProvided,
        disciplineRecommendation: lraRecommendation,
        wasOverridden: !!overrideLevel,
        originalRecommendedLevel: lraRecommendation?.suggestedLevel,
        evidenceCount: pendingEvidenceItems.length,
        pdfGeneratorVersion: PDF_GENERATOR_VERSION,
        ...(pdfTemplateVersion ? { pdfTemplateVersion } : {}),
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
        createdBy: user?.uid,
        // V2 trace marker — useful for filtering V2-issued warnings during testing.
        wizardVersion: 'v2',
      };

      const warningId = await API.warnings.create(warningData);
      Logger.success('Warning V2 created with ID:', warningId);
      setFinalWarningId(warningId);

      // Upload audio (identical logic to V1)
      let audioUploadFailed = false;
      const hasActiveRecording = audioRecording.isRecording;
      const hasStoppedRecordingWithData = !audioRecording.isRecording && audioRecording.audioUrl && audioRecording.recordingId;

      if (isAudioEnabled && (hasActiveRecording || hasStoppedRecordingWithData)) {
        try {
          const recordingId = audioRecording.recordingId;
          let localAudioUrl: string | null = null;
          if (hasActiveRecording) {
            localAudioUrl = await audioRecording.stopRecording();
          } else {
            localAudioUrl = audioRecording.audioUrl;
          }
          const finalDuration = audioRecording.duration || 0;
          const finalSize = audioRecording.size || 0;
          const issuerId = user?.uid || user?.id || '';
          if (localAudioUrl && recordingId && warningId) {
            const firebaseAudioUrl = await audioRecording.uploadToFirebaseFromUrl(
              localAudioUrl, recordingId, organization.id, warningId, finalDuration,
            );
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
                  autoDeleteDate: autoDeleteDate.toISOString(),
                },
              });
            } else {
              audioUploadFailed = true;
              await updateDoc(warningRef, {
                audioRecording: {
                  recordingId,
                  processingStatus: 'failed',
                  recordedBy: issuerId,
                  recordedByName: currentManagerName,
                  recordedAt: new Date().toISOString(),
                  consentGiven: true,
                },
              });
            }
          }
        } catch (audioError) {
          audioUploadFailed = true;
          Logger.error('Failed to upload audio recording:', audioError);
        }
      }

      // Upload evidence (identical logic to V1)
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
                contentType: item.metadata?.mimeType || item.file.type,
              });
              const downloadUrl = await getDownloadURL(storageRef);
              uploadedItems.push({
                id: item.id,
                type: item.type,
                url: downloadUrl,
                description: item.description,
                capturedAt: item.capturedAt instanceof Date ? item.capturedAt.toISOString() : item.capturedAt,
                captureMethod: item.captureMethod,
                metadata: item.metadata,
              });
            }
          }
          if (uploadedItems.length > 0) {
            const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
            await updateDoc(warningRef, { evidenceItems: uploadedItems });
          }
        } catch (evidenceError) {
          Logger.error('Failed to upload evidence:', evidenceError);
          setEvidenceUploadWarning(true);
          try {
            const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
            await updateDoc(warningRef, { evidenceCount: 0 });
          } catch (_) { /* best effort */ }
        }
      }

      if (audioUploadFailed) setAudioUploadWarning(true);

      setCompletedPhases((prev) => new Set([...prev, PhaseV2.SIGN_AND_SAVE]));
      setCurrentPhase(PhaseV2.DELIVERY);
    } catch (error: any) {
      Logger.error('Failed to save warning V2:', error);
      alert(`Failed to save warning: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedDeliveryMethod || !finalWarningId || !organization?.id) return;
    // Email, WhatsApp and Printed record their own delivery inside their panels.
    if (
      selectedDeliveryMethod === 'email' ||
      selectedDeliveryMethod === 'whatsapp' ||
      selectedDeliveryMethod === 'printed'
    ) return;
    setIsLoading(true);
    try {
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
      setShowSuccessCelebration(true);
    } catch (error) {
      Logger.error('Failed to finalize:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCelebrationComplete = useCallback(() => {
    setShowSuccessCelebration(false);
    if (isTestMode) {
      onPracticeComplete?.();
    }
    onComplete();
  }, [onComplete, onPracticeComplete, isTestMode]);

  // PDF blob generator (used by QR + email — identical to V1)
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
        employeeName,
        signedAt: new Date().toISOString(),
      },
      employeeStatement,
      expectedBehaviorStandards: expectedBehavior,
      actionSteps: actionCommitments.map((c) => ({ action: c.commitment, timeline: c.timeline })),
      reviewDate,
      disciplineRecommendation: lraRecommendation,
      pdfGeneratorVersion: PDF_GENERATOR_VERSION,
    };
    const transformedData = await transformWarningDataForPDF(warningDataForPDF, selectedEmployee, organization);
    return PDFGenerationService.generateWarningPDF(
      transformedData,
      transformedData.pdfGeneratorVersion,
      transformedData.pdfSettings,
    );
  };

  const handleQRCodeDelivery = async () => {
    setIsGeneratingQRPdf(true);
    setSelectedDeliveryMethod('qr');
    try {
      const blob = await generatePDFBlob();
      setQrPdfBlob(blob);
      setShowQRModal(true);
    } catch (error) {
      Logger.error('Failed to generate PDF for QR code:', error);
      alert('Failed to generate PDF for QR code. Please try again.');
    } finally {
      setIsGeneratingQRPdf(false);
    }
  };

  const handleEmailDelivery = async () => {
    if (!organization?.id || !finalWarningId) return;
    const employeeEmailOnRecord = selectedEmployee?.profile?.email || selectedEmployee?.email || '';
    const isManualPath = useAlternativeEmail || !employeeEmailOnRecord;
    setIsEmailDelivering(true);
    setEmailDeliveryError(null);
    try {
      if (!isManualPath) {
        setEmailDeliveryStatus('generating_pdf');
        const blob = await generatePDFBlob();
        setEmailDeliveryStatus('uploading_pdf');
        const pdfFilename = `Warning_${selectedCategory?.name || 'Document'}_${employeeName}_${formData.issueDate}.pdf`;
        const storagePath = `warnings/${organization.id}/${finalWarningId}/pdfs/${pdfFilename}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
        const warningRef = doc(db, 'organizations', organization.id, 'warnings', finalWarningId);
        await updateDoc(warningRef, { pdfGenerated: true, pdfFilename });
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
          setTimeout(() => setShowSuccessCelebration(true), 1500);
        } else {
          setEmailDeliveryStatus('failed');
          setEmailDeliveryError(data.error || 'Email delivery failed');
        }
      } else {
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
          : error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsEmailDelivering(false);
    }
  };

  // WhatsApp delivery — mint the durable respond link (180-day token) and open
  // WhatsApp pointed at the confirmed number with the message + link pre-filled.
  // WhatsApp can't pre-attach the PDF, so the employee taps the link to view/
  // download it and submit a response or appeal on the respond page.
  const handleWhatsAppDelivery = async () => {
    if (!organization?.id || !finalWarningId) return;
    if (!isValidPhoneNumber(whatsappNumber) || !whatsappConfirmed) return;
    setIsWhatsAppDelivering(true);
    setWhatsappDeliveryError(null);
    setWhatsappDeliveryStatus('generating_link');
    try {
      let responseUrl = whatsappResponseUrl;
      if (!responseUrl) {
        const generateFn = httpsCallable(functions, 'generateResponseToken');
        const result = await generateFn({
          warningId: finalWarningId,
          organizationId: organization.id,
          expiryDays: 180,
        });
        responseUrl = (result.data as any)?.responseUrl || '';
        if (!responseUrl) throw new Error('Could not generate a response link.');
        setWhatsappResponseUrl(responseUrl);
      }

      const firstName = selectedEmployee?.profile?.firstName || employeeName || 'there';
      const orgName = organization?.name || 'your employer';
      const categoryName = selectedCategory?.name || 'a workplace matter';
      const levelLabel = (levelInfo?.label || currentLevel || 'formal warning').toLowerCase();
      const message =
        `Hi ${firstName}, this is ${currentManagerName} from ${orgName}. ` +
        `A formal ${levelLabel} has been issued regarding ${categoryName}. ` +
        `Please review the document and submit any response or appeal here: ${responseUrl}`;

      const waUrl = `https://wa.me/${toWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setWhatsappDeliveryStatus('opened');
    } catch (error: any) {
      Logger.error('WhatsApp delivery failed:', error);
      setWhatsappDeliveryStatus('failed');
      setWhatsappDeliveryError(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsWhatsAppDelivering(false);
    }
  };

  // Manager attests they sent the WhatsApp message → record honest delivery.
  const handleConfirmWhatsAppSent = async () => {
    if (!organization?.id || !finalWarningId) return;
    setIsLoading(true);
    try {
      const warningRef = doc(db, 'organizations', organization.id, 'warnings', finalWarningId);
      const historyEntry = {
        method: 'whatsapp',
        whatsappNumber,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        attemptedBy: user?.uid || '',
        attemptedByName: currentManagerName,
        type: 'whatsapp',
        responseUrl: whatsappResponseUrl,
      };
      await updateDoc(warningRef, {
        deliveryMethod: 'whatsapp',
        deliveryStatus: 'delivered',
        deliveryHistory: [historyEntry],
        updatedAt: new Date(),
      });
      setWhatsappDeliveryStatus('sent');
      setShowSuccessCelebration(true);
    } catch (error) {
      Logger.error('Failed to record WhatsApp delivery:', error);
      setWhatsappDeliveryError('Failed to record delivery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Printed delivery — record the warning as awaiting collection from HR and
  // email HR to print it and have it ready. The employee collects it later;
  // HR records the hand-over from the Review dashboard.
  const handlePrintedDelivery = async () => {
    if (!organization?.id || !finalWarningId) return;
    setIsPrintedDelivering(true);
    setPrintedDeliveryError(null);
    setPrintedDeliveryStatus('sending');
    try {
      const warningRef = doc(db, 'organizations', organization.id, 'warnings', finalWarningId);
      const historyEntry = {
        method: 'printed',
        timestamp: new Date().toISOString(),
        status: 'awaiting_collection',
        attemptedBy: user?.uid || '',
        attemptedByName: currentManagerName,
        type: 'printed',
      };
      await updateDoc(warningRef, {
        deliveryMethod: 'printed',
        deliveryStatus: 'awaiting_collection',
        deliveryHistory: [historyEntry],
        updatedAt: new Date(),
      });

      // Best-effort HR email — don't fail the finalize if the notice errors.
      try {
        const notifyFn = httpsCallable(functions, 'notifyHRPrintedCollection');
        await notifyFn({ warningId: finalWarningId, organizationId: organization.id });
      } catch (notifyError) {
        Logger.warn('HR printed-collection notice failed (non-critical):', notifyError);
      }

      setPrintedDeliveryStatus('sent');
      setShowSuccessCelebration(true);
    } catch (error) {
      Logger.error('Failed to record printed delivery:', error);
      setPrintedDeliveryStatus('failed');
      setPrintedDeliveryError('Failed to record delivery. Please try again.');
    } finally {
      setIsPrintedDelivering(false);
    }
  };

  // Signature handlers (identical to V1)
  const handleManagerSignature = useCallback((signature: string | null) => {
    setSignatures((prev) => ({ ...prev, manager: signature }));
  }, []);

  const addWitnessWatermark = useCallback((signatureDataUrl: string): Promise<string> => {
    return Promise.resolve(applyWitnessWatermarkToSVG(signatureDataUrl));
  }, []);

  const handleEmployeeSignature = useCallback((signature: string | null) => {
    setSignatures((prev) => ({ ...prev, employee: signature, witness: null }));
  }, []);

  const handleWitnessSignature = useCallback(async (signature: string | null) => {
    if (signature) {
      try {
        const watermarkedSignature = await addWitnessWatermark(signature);
        setSignatures((prev) => ({ ...prev, witness: watermarkedSignature, employee: null }));
      } catch (error) {
        Logger.error('Failed to apply witness watermark:', error);
        setSignatures((prev) => ({ ...prev, witness: signature, employee: null }));
      }
    } else {
      setSignatures((prev) => ({ ...prev, witness: null }));
    }
  }, [addWitnessWatermark]);

  const handleCancel = useCallback(() => {
    if (audioRecording.isRecording) {
      audioRecording.forceCleanup();
    }
    onCancel();
  }, [audioRecording, onCancel]);

  // ============================================
  // PHASE RENDER DISPATCH
  // ============================================

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case PhaseV2.OVERVIEW:
        return (
          <WizardOverviewPhase
            isAudioEnabled={isAudioEnabled}
            organizationName={organizationName || organization?.name || ''}
            onStartTestRun={handleStartTestRun}
          />
        );

      case PhaseV2.SETUP:
        return (
          <SetupPhaseV2
            employees={employees}
            formData={formData}
            setFormData={setFormData}
            warningHistory={warningHistory}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            lraRecommendation={lraRecommendation}
            setLraRecommendation={setLraRecommendation}
            isAnalyzing={isAnalyzing}
            hrInterventionRequired={hrInterventionRequired}
            setHrInterventionRequired={setHrInterventionRequired}
            expectedBehavior={expectedBehavior}
            setExpectedBehavior={setExpectedBehavior}
            setSelectedWarningDetails={setSelectedWarningDetails}
            isTestMode={isTestMode}
          />
        );

      case PhaseV2.INCIDENT:
        return (
          <IncidentPhaseV2
            formData={formData}
            setFormData={setFormData}
            pendingEvidenceItems={pendingEvidenceItems}
            setPendingEvidenceItems={setPendingEvidenceItems}
          />
        );

      case PhaseV2.CONVERSATION:
        return (
          <ConversationPhaseV2
            levelInfo={levelInfo}
            employeeStatement={employeeStatement}
            setEmployeeStatement={setEmployeeStatement}
            expectedBehavior={expectedBehavior}
            setExpectedBehavior={setExpectedBehavior}
            selectedCategory={selectedCategory}
            actionCommitments={actionCommitments}
            setActionCommitments={setActionCommitments}
            reviewDate={reviewDate}
            setReviewDate={setReviewDate}
            formData={formData}
            setFormData={setFormData}
          />
        );

      case PhaseV2.SIGN_AND_SAVE:
        return (
          <SignAndSavePhaseV2
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
            currentManagerName={currentManagerName}
            currentLevel={currentLevel}
            scriptReadConfirmed={scriptReadConfirmed}
            setScriptReadConfirmed={setScriptReadConfirmed}
            hasAcknowledged={hasAcknowledged}
            setHasAcknowledged={setHasAcknowledged}
            lraRecommendation={lraRecommendation}
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

      case PhaseV2.DELIVERY:
        return (
          <DeliveryPhaseV2
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
            whatsappNumber={whatsappNumber}
            setWhatsappNumber={setWhatsappNumber}
            whatsappConfirmed={whatsappConfirmed}
            setWhatsappConfirmed={setWhatsappConfirmed}
            isWhatsAppDelivering={isWhatsAppDelivering}
            whatsappDeliveryStatus={whatsappDeliveryStatus}
            whatsappDeliveryError={whatsappDeliveryError}
            isValidWhatsappNumber={isValidPhoneNumber(whatsappNumber)}
            handleWhatsAppDelivery={handleWhatsAppDelivery}
            handleConfirmWhatsAppSent={handleConfirmWhatsAppSent}
            isPrintedDelivering={isPrintedDelivering}
            printedDeliveryStatus={printedDeliveryStatus}
            printedDeliveryError={printedDeliveryError}
            handlePrintedDelivery={handlePrintedDelivery}
          />
        );

      default:
        return null;
    }
  };

  const phaseInfo = PHASE_INFO_V2[currentPhase];
  const isOverview = currentPhase === PhaseV2.OVERVIEW;
  // User-facing step label: hide step number on Overview, show "Step X of 5"
  // on working phases (currentPhase 1–5 → step 1–5).
  const stepLabel = isOverview ? null : `Step ${currentPhase} of ${VISIBLE_STEPS_V2}`;

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <>
      <SuccessCelebration
        isVisible={showSuccessCelebration}
        message={isTestMode ? 'Practice Complete!' : 'Warning Issued Successfully!'}
        subMessage={
          isTestMode
            ? "Nice work. When you're ready, start a real warning from the dashboard."
            : `${employeeName} has been notified via ${selectedDeliveryMethod}`
        }
        onComplete={handleCelebrationComplete}
        duration={3000}
        showConfetti={true}
      />

      <div
        ref={focusTrapRef}
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000]
          flex items-center justify-center
          ${isMobile ? 'p-0' : 'p-4'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-v2-title"
        aria-describedby="wizard-v2-guidance"
      >
        <div
          ref={swipeContainerRef as React.RefObject<HTMLDivElement>}
          className={`
            bg-white shadow-2xl w-full
            ${isMobile
              ? 'h-full rounded-none wizard-mobile-enter'
              : 'max-w-2xl h-[90vh] rounded-xl'
            }
            overflow-hidden flex flex-col
          `}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  id="wizard-v2-title"
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Issue Warning
                </h2>
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

            {/* Progress bar only shows on working phases (skip Overview) */}
            {!isOverview && (
              <div className="mt-3">
                <PhaseProgress
                  currentPhase={currentPhase - 1}
                  totalPhases={VISIBLE_STEPS_V2}
                  completedPhases={completedPhases}
                  onPhaseClick={(p) => goToPhase((p + 1) as PhaseV2)}
                />
                {stepLabel && (
                  <p
                    className="text-[11px] mt-1 text-center"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {stepLabel}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Persistent practice-mode banner — pinned above scroll area so the
              manager can never lose track of the fact that nothing is being
              saved. Amber palette so it's clearly distinct from real-flow chrome. */}
          {isTestMode && (
            <div
              className="px-4 py-2 flex items-center gap-2 text-xs font-semibold border-b"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderBottomColor: 'rgba(245, 158, 11, 0.3)',
                color: '#92400e',
              }}
              role="status"
              aria-live="polite"
            >
              <span aria-hidden>🧪</span>
              <span>
                <strong>Practice run</strong> — Sample employee. Nothing will be saved or sent.
              </span>
            </div>
          )}

          {/* Scrollable content. Inline overflow rules so this works reliably
              under any compiled-CSS ordering. overscroll-contain stops wheel
              events from scrolling the page behind the backdrop at scroll-end. */}
          <div
            ref={contentContainerRef}
            style={{
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="p-4">
              <ThemedCard padding="md">
                <PhaseHeader
                  title={phaseInfo.title}
                  icon={phaseInfo.icon}
                  phaseNumber={isOverview ? 0 : currentPhase}
                  totalPhases={VISIBLE_STEPS_V2}
                  employeeName={currentPhase > PhaseV2.SETUP ? employeeName : undefined}
                  incidentDate={currentPhase > PhaseV2.INCIDENT ? formData.incidentDate : undefined}
                />

                <PhaseGuidance>
                  <span id="wizard-v2-guidance">{phaseInfo.guidance}</span>
                </PhaseGuidance>

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
              </ThemedCard>
            </div>
          </div>

          {/* Fixed footer navigation — pinned below the scroll zone so Back/Continue/Save
              stay reachable on mobile without scrolling back up (tall phases like
              Conversation & Sign-and-Save). */}
          <div
            className="flex-shrink-0 px-4 py-3 border-t"
            style={{ borderColor: 'var(--color-border-light)' }}
          >
            {hrInterventionRequired && currentPhase === PhaseV2.SETUP ? (
              <div className="flex items-center justify-between">
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
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  I Understand
                </button>
              </div>
            ) : (
              <PhaseNavigation
                currentPhase={currentPhase}
                totalPhases={TOTAL_PHASES_V2}
                isValid={isPhaseValid}
                isLoading={isSaving || isLoading}
                onPrevious={handlePreviousPhase}
                onNext={
                  currentPhase === PhaseV2.SIGN_AND_SAVE
                    ? (isTestMode ? handleFinishTestRun : handleSaveWarning)
                    : handleNextPhase
                }
                customNextText={
                  currentPhase === PhaseV2.OVERVIEW
                    ? (isAudioEnabled && !isTestMode ? 'Continue & start recording' : 'Continue')
                    : currentPhase === PhaseV2.SIGN_AND_SAVE
                      ? (isTestMode ? 'Finish Practice' : 'Save Warning')
                      : undefined
                }
                showFinalize={currentPhase === PhaseV2.DELIVERY && !isTestMode}
                onFinalize={handleFinalize}
              />
            )}

            {/* Save validation feedback */}
            {currentPhase === PhaseV2.SIGN_AND_SAVE && !isPhaseValid && (
              <p className="text-xs text-center mt-2" style={{ color: 'var(--color-error)' }}>
                {!scriptReadConfirmed ? 'Read the script aloud (section B)' :
                 !hasAcknowledged ? 'Confirm the employee acknowledged understanding (section B)' :
                 !signatures.manager ? 'Manager signature required (section C)' :
                 !employeeViewedPDF ? 'Employee must view PDF first (section C)' :
                 !(signatures.employee || signatures.witness) ? 'Employee or witness signature required (section C)' :
                 'Please complete all required steps'}
              </p>
            )}
          </div>
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
                actionSteps: actionCommitments.map((c) => ({ action: c.commitment, timeline: c.timeline })),
                reviewDate,
                interventionDetails,
                resourcesProvided,
              },
              signatures,
              lraRecommendation,
              organizationId: organization?.id || '',
            },
            selectedEmployee,
            selectedCategory,
            organizationId: organization?.id,
          }}
          title="Warning Document Preview"
        />

        {/* QR Code Modal */}
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

        {/* Microphone Permission Handler — triggered from Overview Continue */}
        {showPermissionHandler && isAudioEnabled && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <MicrophonePermissionHandler
                organizationName={organization?.name || ''}
                managerName={currentManagerName || ''}
                onPermissionGranted={() => {
                  setMicrophonePermissionGranted(true);
                  setShowPermissionHandler(false);
                  if (!audioRecording.isRecording) {
                    audioRecording.startRecording().catch((err) => {
                      Logger.error('Failed to start audio recording after permission grant:', err);
                    });
                  }
                }}
                onPermissionDenied={() => setShowPermissionHandler(false)}
                onSkip={() => setShowPermissionHandler(false)}
              />
            </div>
          </div>
        )}

        {/* Warning Details Modal (from setSelectedWarningDetails clicks in Setup phase) */}
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
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : 'Not recorded'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWarningDetails(null)}
                className="w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-colors wizard-touch-target wizard-button-tap"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
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

export default UnifiedWarningWizardV2;
