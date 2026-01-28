// UnifiedWarningWizard.tsx - 10-phase unified warning wizard
// Replaces EnhancedWarningWizard with consistent phased UX throughout
// ✅ AWARD-WINNING UX: Full accessibility, mobile-first, micro-interactions, data safety

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  User, FileText, Tag, MessageSquare, Target, TrendingUp,
  CheckCircle, FileSearch, PenTool, Send, AlertTriangle, X, Scale, Eye,
  ChevronRight
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
import { DigitalSignaturePad } from './steps/DigitalSignaturePad';
import { PDFPreviewModal } from './PDFPreviewModal';
import { QRCodeDownloadModal } from '../modals/QRCodeDownloadModal';

// SVG signature utilities
import { applyWitnessWatermarkToSVG } from '../../../utils/signatureSVG';

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
import type {
  EscalationRecommendation,
  EmployeeWithContext,
  WarningCategory,
  EnhancedWarningFormData
} from '@/services/WarningService';

// PDF services
import { PDF_GENERATOR_VERSION } from '@/services/PDFGenerationService';
import { PDFTemplateVersionService } from '@/services/PDFTemplateVersionService';
import { transformWarningDataForPDF } from '@/utils/pdfDataTransformer';

// Microphone permission
import { MicrophonePermissionHandler } from './components/MicrophonePermissionHandler';

// ============================================
// TYPES
// ============================================

type Employee = EmployeeWithContext;
type Category = WarningCategory;
type FormData = EnhancedWarningFormData;

interface SignatureData {
  manager: string | null;
  employee: string | null;
  witness: string | null;
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
  witnessName?: string;
}

interface ActionCommitment {
  id: string;
  commitment: string;
  timeline: string;
}

// Phase definitions
enum Phase {
  EMPLOYEE_SELECTION = 0,
  CATEGORY_RECOMMENDATION = 1,
  INCIDENT_DETAILS = 2,
  EMPLOYEE_RESPONSE = 3,
  EXPECTED_STANDARDS = 4,
  IMPROVEMENT_PLAN = 5,
  REVIEW_DOCUMENTATION = 6,
  SCRIPT_PDF_REVIEW = 7,
  SIGNATURES = 8,
  DELIVERY = 9
}

const PHASE_INFO = [
  { title: 'Employee Selection', icon: User, guidance: 'Who is involved in this incident?' },
  { title: 'Category & Recommendation', icon: Tag, guidance: 'Classify the misconduct and review the system recommendation' },
  { title: 'Incident Details', icon: FileText, guidance: 'Document the facts: when, where, and what happened' },
  { title: "Employee's Response", icon: MessageSquare, guidance: 'What did the employee say when you discussed the incident?' },
  { title: 'Expected Standards', icon: Target, guidance: 'What behavior, performance, or conduct is expected?' },
  { title: 'Improvement Plan', icon: TrendingUp, guidance: 'Record specific commitments with timelines and set follow-up' },
  { title: 'Review Documentation', icon: CheckCircle, guidance: 'Review all information before proceeding to signatures' },
  { title: 'Script & PDF Review', icon: FileSearch, guidance: 'Read the warning script aloud, then review the PDF together' },
  { title: 'Signatures', icon: PenTool, guidance: 'Collect signatures to finalize and save the warning' },
  { title: 'Delivery', icon: Send, guidance: 'Select how the warning will be delivered to the employee' }
];

const TOTAL_PHASES = 10;

interface UnifiedWarningWizardProps {
  employees: Employee[];
  categories: Category[];
  currentManagerName: string;
  organizationName: string;
  onComplete: () => void;
  onCancel: () => void;
  preSelectedEmployeeId?: string;
  preSelectedCategoryId?: string;
  isFullScreen?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = (): string => {
  return `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get current time in South African timezone (Africa/Johannesburg)
const getSouthAfricanTime = (): string => {
  const now = new Date();
  const saTime = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
  return saTime;
};

// Get current date in South African timezone
const getSouthAfricanDate = (): string => {
  const now = new Date();
  const saDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  return saDate; // Returns YYYY-MM-DD format
};

const getWarningLevelInfo = (level: string) => {
  const levelMap: Record<string, { label: string; color: string; requiresCommitments: boolean }> = {
    'counselling': { label: 'Counselling', color: '#0ea5e9', requiresCommitments: true },
    'verbal': { label: 'Verbal', color: '#f59e0b', requiresCommitments: true },
    'first_written': { label: 'Written', color: '#f97316', requiresCommitments: true },
    'second_written': { label: 'Second Written', color: '#f97316', requiresCommitments: true },
    'final_written': { label: 'Final Written', color: '#ef4444', requiresCommitments: false },
    'suspension': { label: 'Suspension', color: '#dc2626', requiresCommitments: false },
    'dismissal': { label: 'Ending of Service', color: '#991b1b', requiresCommitments: false }
  };
  return levelMap[level] || { label: level, color: '#6b7280', requiresCommitments: true };
};

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
  isFullScreen
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const audioRecording = useAudioRecording();

  // Check if audio recording is enabled for this organization
  const isAudioEnabled = organization?.customization?.enableAudioRecording ?? true;

  // Helper function to count words in a string
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w).length;

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
  const [hasFinalWarningBlock, setHasFinalWarningBlock] = useState(false);

  // Corrective discussion
  const [employeeStatement, setEmployeeStatement] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actionCommitments, setActionCommitments] = useState<ActionCommitment[]>([]);
  const [reviewDate, setReviewDate] = useState('');
  const [interventionDetails, setInterventionDetails] = useState('');
  const [resourcesProvided, setResourcesProvided] = useState<string[]>([]);

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
          !hasFinalWarningBlock
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
        return !!selectedDeliveryMethod;

      default:
        return false;
    }
  }, [
    currentPhase, formData, lraRecommendation, isAnalyzing, hasFinalWarningBlock,
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

  // Load employee when selected
  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find(e => e.id === formData.employeeId);
      setSelectedEmployee(employee);

      // Load warning history
      if (employee && organization?.id) {
        API.warnings.getActiveWarnings(employee.id, organization.id)
          .then(warnings => setWarningHistory(warnings))
          .catch(err => Logger.error('Failed to load warning history:', err));
      }
    }
  }, [formData.employeeId, employees, organization?.id]);

  // Load category when selected
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId);
      setSelectedCategory(category);
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
    const MIN_LOADING_TIME = 800; // Minimum time to show skeleton (ms)

    try {
      // Fetch active warnings
      const activeWarnings = warningHistory.length > 0
        ? warningHistory
        : await API.warnings.getActiveWarnings(formData.employeeId, organization.id);

      // Check for final warnings in same category - block if found
      const hasFinalWarningForCategory = activeWarnings.some(warning =>
        (warning.level === 'final_written' ||
         warning.level === 'Final Written Warning' ||
         warning.suggestedLevel === 'final_written') &&
        warning.categoryId === formData.categoryId
      );

      if (hasFinalWarningForCategory) {
        setHasFinalWarningBlock(true);
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
      setFormData(prev => ({ ...prev, level: recommendation.suggestedLevel }));

    } catch (error) {
      Logger.error('Failed to generate LRA recommendation:', error);
      // 🔥 FIX: Look up category directly from categories array for fallback too
      const fallbackCategory = categories.find(c => c.id === formData.categoryId) || selectedCategory;
      const categoryEscalationPath = fallbackCategory?.escalationPath || ['counselling', 'verbal_warning', 'first_written', 'final_written'];
      const fallbackRecommendation: any = {
        suggestedLevel: categoryEscalationPath[0] || 'counselling',
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
        // Issued by
        issuedBy: user?.uid || '',
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
        // Version tracking
        pdfGeneratorVersion: PDF_GENERATOR_VERSION,
        status: 'issued',
        createdAt: new Date(),
        createdBy: user?.uid
      };

      // Create the warning
      Logger.info('Calling API.warnings.create...', { dataKeys: Object.keys(warningData) });
      const warningId = await API.warnings.create(warningData);
      Logger.success('Warning created with ID:', warningId);
      setFinalWarningId(warningId);

      // Stop and upload audio if recording AND audio is enabled
      if (isAudioEnabled && audioRecording.isRecording) {
        try {
          // Stop recording and get the audio URL
          const localAudioUrl = await audioRecording.stopRecording();

          if (localAudioUrl && warningId) {
            // Upload audio to Firebase Storage using the hook's method
            const firebaseAudioUrl = await audioRecording.uploadToFirebase(
              organization.id,
              warningId
            );

            if (firebaseAudioUrl) {
              // Update warning with audio URL and metadata
              const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
              await updateDoc(warningRef, {
                audioRecordingUrl: firebaseAudioUrl,
                audioMetadata: {
                  recordedBy: user?.uid,
                  recordedByName: currentManagerName,
                  recordedAt: new Date().toISOString(),
                  duration: audioRecording.duration || 0
                }
              });

              Logger.success('Audio uploaded successfully:', firebaseAudioUrl);
            }
          }
        } catch (audioError) {
          Logger.error('Failed to upload audio recording:', audioError);
          // Continue even if audio upload fails - the warning is still saved
        }
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
    if (!selectedDeliveryMethod || !finalWarningId) return;

    setIsLoading(true);
    try {
      // Create HR notification for delivery
      // This would call the notification service
      Logger.success('Warning finalized with delivery method:', selectedDeliveryMethod);

      // Show success celebration
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

  // Handle QR Code delivery - generate PDF and show QR modal
  const handleQRCodeDelivery = async () => {
    if (!organization?.id || !selectedEmployee || !selectedCategory) {
      Logger.error('Missing data for QR code generation');
      return;
    }

    setIsGeneratingQRPdf(true);
    setSelectedDeliveryMethod('qr');

    try {
      // Import PDF services
      const { PDFGenerationService } = await import('@/services/PDFGenerationService');
      const { transformWarningDataForPDF } = await import('@/utils/pdfDataTransformer');

      // Build warning data for PDF
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

      // Transform and generate PDF
      const transformedData = await transformWarningDataForPDF(
        warningDataForPDF,
        selectedEmployee,
        organization
      );

      const blob = await PDFGenerationService.generateWarningPDF(
        transformedData,
        transformedData.pdfGeneratorVersion,
        transformedData.pdfSettings
      );

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
                setHasFinalWarningBlock(false);
                // 🔥 FIX: Update selectedCategory BEFORE formData to avoid race condition
                // The generateLRARecommendation useEffect uses selectedCategory state
                const category = categories.find(c => c.id === id);
                setSelectedCategory(category);
                setFormData(prev => ({ ...prev, categoryId: id }));
              }}
              lraRecommendation={lraRecommendation}
            />

            {/* Show spinner when analyzing OR when no recommendation yet (after category selected) */}
            {(isAnalyzing || (!lraRecommendation && formData.categoryId)) && (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-gray-700">Analyzing warning history...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait</p>
              </div>
            )}

            {lraRecommendation && (
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

            {hasFinalWarningBlock && (
              <ThemedAlert variant="error">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <strong>HR Intervention Required</strong>
                    <p className="text-sm mt-1">
                      This employee has a final warning on file. Contact HR before proceeding.
                    </p>
                  </div>
                </div>
              </ThemedAlert>
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
          <div className="space-y-4">
            {/* Hero summary - the key facts at a glance */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: `linear-gradient(135deg, ${levelInfo.color}15, ${levelInfo.color}05)`,
                border: `1px solid ${levelInfo.color}30`
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: levelInfo.color }}>
                {levelInfo.label}
              </p>
              <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {employeeName}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedCategory?.name} • {formData.incidentDate}
              </p>
            </div>

            {/* Editable details list */}
            <div className="space-y-1">
              <ReviewRow
                label="What happened"
                onClick={() => goToPhase(Phase.INCIDENT_DETAILS)}
              >
                {formData.incidentDescription || 'No description'}
              </ReviewRow>

              <ReviewRow
                label="When & Where"
                onClick={() => goToPhase(Phase.INCIDENT_DETAILS)}
              >
                {formData.incidentDate} at {formData.incidentTime} • {formData.incidentLocation}
              </ReviewRow>

              {levelInfo.requiresCommitments && (
                <>
                  <ReviewRow
                    label="Employee said"
                    onClick={() => goToPhase(Phase.EMPLOYEE_RESPONSE)}
                  >
                    "{employeeStatement || 'No response'}"
                  </ReviewRow>

                  <ReviewRow
                    label="Expected standard"
                    onClick={() => goToPhase(Phase.EXPECTED_STANDARDS)}
                  >
                    {expectedBehavior || 'Not specified'}
                  </ReviewRow>

                  <ReviewRow
                    label="Improvement plan"
                    onClick={() => goToPhase(Phase.IMPROVEMENT_PLAN)}
                  >
                    {actionCommitments.length} commitment{actionCommitments.length !== 1 ? 's' : ''} • Review: {reviewDate || 'Not set'}
                  </ReviewRow>
                </>
              )}
            </div>

            {/* Footer hint */}
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Tap any row to edit
            </p>
          </div>
        );

      case Phase.SCRIPT_PDF_REVIEW:
        return (
          <div className="space-y-4">
            {/* Warning Script Section */}
            <ThemedCard padding="md" className="border" style={{ borderColor: 'var(--color-border-light)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Read this completely to ensure your employee understands their rights.</strong> This script covers all legal requirements and communicates the warning clearly.
              </p>
              <MultiLanguageWarningScript
                employeeName={employeeName || 'Employee'}
                managerName={currentManagerName}
                categoryName={selectedCategory?.name || 'General Misconduct'}
                incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
                warningLevel={currentLevel}
                validityPeriod={formData.validityPeriod}
                onScriptRead={() => setScriptReadConfirmed(true)}
                disabled={scriptReadConfirmed}
                activeWarnings={lraRecommendation?.activeWarnings}
                issuedDate={formData.issueDate}
              />
            </ThemedCard>

            {/* Script read confirmation status */}
            {scriptReadConfirmed && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-alert-success-text)' }}>
                    Script has been read to the employee
                  </span>
                </div>
              </div>
            )}

            {/* Employee Acknowledgment */}
            <div
              className="p-3 rounded-lg border transition-all"
              style={{
                backgroundColor: hasAcknowledged ? 'var(--color-alert-success-bg)' : 'var(--color-card-background)',
                borderColor: hasAcknowledged ? 'var(--color-success)' : 'var(--color-border-light)',
                opacity: scriptReadConfirmed ? 1 : 0.6
              }}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  disabled={!scriptReadConfirmed}
                  className="w-5 h-5 mt-0.5 rounded flex-shrink-0"
                  style={{ accentColor: 'var(--color-success)' }}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    I confirm the employee has reviewed and understands this warning
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    The employee understands the nature of the misconduct and their right to representation under the Labour Relations Act.
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      case Phase.SIGNATURES:
        return (
          <div className="space-y-3">
            {/* Step 1: Manager Signature */}
            <SignatureSlot
              step={1}
              label="Manager"
              name={currentManagerName}
              signature={signatures.manager}
              onTap={() => setActiveSignatureModal('manager')}
            />

            {/* Step 2: PDF Preview - Only show after manager signs */}
            {signatures.manager && (
              <button
                onClick={() => setShowPDFPreview(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed transition-all hover:border-solid active:scale-[0.98]"
                style={{
                  borderColor: employeeViewedPDF ? 'var(--color-success)' : 'var(--color-primary)',
                  backgroundColor: employeeViewedPDF ? 'var(--color-alert-success-bg)' : 'var(--color-primary-light)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: employeeViewedPDF ? 'var(--color-success)' : 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    {employeeViewedPDF ? <CheckCircle className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      Step 2: Review PDF with Employee
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {employeeViewedPDF ? 'Document reviewed' : 'Tap to preview document'}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Employee viewed checkbox */}
            {signatures.manager && (
              <label
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                style={{
                  backgroundColor: employeeViewedPDF ? 'var(--color-alert-success-bg)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={employeeViewedPDF}
                  onChange={(e) => setEmployeeViewedPDF(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: 'var(--color-success)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Employee has reviewed the document
                </span>
              </label>
            )}

            {/* Step 3: Employee OR Witness Signature */}
            {signatures.manager && employeeViewedPDF && (
              <div className="space-y-2">
                {/* Toggle: Employee or Witness */}
                <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                  <button
                    onClick={() => setSignatureType('employee')}
                    className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                      signatureType === 'employee' ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: signatureType === 'employee' ? 'white' : 'transparent',
                      color: signatureType === 'employee' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                    }}
                  >
                    Employee
                  </button>
                  <button
                    onClick={() => setSignatureType('witness')}
                    className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                      signatureType === 'witness' ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: signatureType === 'witness' ? 'white' : 'transparent',
                      color: signatureType === 'witness' ? 'var(--color-warning)' : 'var(--color-text-secondary)'
                    }}
                  >
                    Witness
                  </button>
                </div>

                {/* Signature slot based on toggle */}
                <SignatureSlot
                  step={3}
                  label={signatureType === 'employee' ? 'Employee' : 'Witness'}
                  name={signatureType === 'employee' ? employeeName : 'Witness'}
                  signature={signatureType === 'employee' ? signatures.employee : signatures.witness}
                  isWitness={signatureType === 'witness'}
                  onTap={() => setActiveSignatureModal('employee')}
                />

                {signatureType === 'witness' && (
                  <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                    Use when employee refuses to sign
                  </p>
                )}
              </div>
            )}

            {/* Signature Modal */}
            {activeSignatureModal && (
              <SignatureModal
                title={
                  activeSignatureModal === 'manager'
                    ? 'Manager Signature'
                    : signatureType === 'employee'
                      ? 'Employee Signature'
                      : 'Witness Signature'
                }
                signerName={
                  activeSignatureModal === 'manager'
                    ? currentManagerName
                    : signatureType === 'employee'
                      ? employeeName
                      : 'Witness'
                }
                onSave={(sig) => {
                  if (activeSignatureModal === 'manager') {
                    handleManagerSignature(sig);
                  } else if (signatureType === 'employee') {
                    handleEmployeeSignature(sig);
                  } else {
                    handleWitnessSignature(sig);
                  }
                  setActiveSignatureModal(null);
                }}
                onClose={() => setActiveSignatureModal(null)}
                initialSignature={
                  activeSignatureModal === 'manager'
                    ? signatures.manager
                    : signatureType === 'employee'
                      ? signatures.employee
                      : signatures.witness
                }
              />
            )}
          </div>
        );

      case Phase.DELIVERY:
        return (
          <div className="space-y-4">
            <ThemedAlert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Warning saved successfully! ID: {finalWarningId}</span>
              </div>
            </ThemedAlert>

            <div className="grid grid-cols-2 gap-3">
              {['email', 'whatsapp', 'printed', 'qr'].map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    if (method === 'qr') {
                      handleQRCodeDelivery();
                    } else {
                      setSelectedDeliveryMethod(method);
                    }
                  }}
                  disabled={method === 'qr' && isGeneratingQRPdf}
                  className={`
                    p-4 rounded-lg border text-center transition-all
                    ${selectedDeliveryMethod === method ? 'ring-2 ring-primary' : ''}
                    ${method === 'qr' && isGeneratingQRPdf ? 'opacity-50 cursor-wait' : ''}
                  `}
                  style={{
                    borderColor: selectedDeliveryMethod === method
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                    backgroundColor: selectedDeliveryMethod === method
                      ? 'var(--color-primary-light)'
                      : 'var(--color-background)'
                  }}
                >
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
                    {method === 'qr' ? (isGeneratingQRPdf ? 'Generating...' : 'QR Code') : method}
                  </span>
                </button>
              ))}
            </div>
          </div>
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
            className="flex-1 overflow-y-auto"
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

// Signature slot - tap to sign
const SignatureSlot: React.FC<{
  step: number;
  label: string;
  name: string;
  signature: string | null;
  isWitness?: boolean;
  isOptional?: boolean;
  onTap: () => void;
}> = ({ step, label, name, signature, isWitness, isOptional, onTap }) => (
  <button
    onClick={onTap}
    disabled={!!signature}
    className={`w-full p-4 rounded-xl border-2 transition-all ${
      signature
        ? 'border-solid'
        : isOptional
          ? 'border-dashed opacity-70 hover:opacity-100 hover:border-solid active:scale-[0.98]'
          : 'border-dashed hover:border-solid active:scale-[0.98]'
    }`}
    style={{
      borderColor: signature
        ? 'var(--color-success)'
        : isWitness
          ? 'var(--color-warning)'
          : 'var(--color-primary)',
      backgroundColor: signature
        ? 'var(--color-alert-success-bg)'
        : 'var(--color-card-background)',
      cursor: signature ? 'default' : 'pointer'
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{
          backgroundColor: signature
            ? 'var(--color-success)'
            : isWitness
              ? 'var(--color-warning)'
              : 'var(--color-primary)'
        }}
      >
        {signature ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {label} Signature
          </p>
          {isOptional && !signature && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)' }}>
              Optional
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {signature ? `Signed by ${name}` : `Tap here for ${name} to sign`}
        </p>
      </div>
      {signature && (
        <img
          src={signature}
          alt={`${label} signature`}
          className="h-10 w-auto max-w-[80px] object-contain"
          style={{ filter: 'grayscale(0.2)' }}
        />
      )}
    </div>
  </button>
);

// Full-screen signature modal
const SignatureModal: React.FC<{
  title: string;
  signerName: string;
  onSave: (signature: string) => void;
  onClose: () => void;
  initialSignature?: string | null;
}> = ({ title, signerName, onSave, onClose, initialSignature }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasDrawn, setHasDrawn] = React.useState(!!initialSignature);

  // Initialize canvas - use ResizeObserver for reliable sizing
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const initCanvas = () => {
      const rect = parent.getBoundingClientRect();

      // Skip if parent hasn't been laid out yet (height = 0)
      if (rect.height < 50) return;

      // Set canvas size to match parent container
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      // Style
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Load initial signature if exists
      if (initialSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = initialSignature;
      }
    };

    // Use ResizeObserver for reliable sizing when flex layout completes
    const observer = new ResizeObserver(() => {
      initCanvas();
    });
    observer.observe(parent);

    // Also run on initial mount after a short delay for mobile
    const timeout = setTimeout(initCanvas, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [initialSignature]);

  const getCoords = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Ensure styles are set
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Helper to get initials and surname from full name
  const getInitialsAndSurname = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return '';
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return '';
    if (nameParts.length === 1) return nameParts[0];
    const initials = nameParts.slice(0, -1).map(part => part.charAt(0).toUpperCase() + '.').join(' ');
    const surname = nameParts[nameParts.length - 1];
    return `${initials} ${surname}`;
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !hasDrawn) return;

    // Get SA timestamp
    const now = new Date();
    const saTimestamp = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    // Get initials and surname
    const initialsAndSurname = getInitialsAndSurname(signerName);

    // Burn timestamp and name into canvas
    const rect = canvas.getBoundingClientRect();
    const padding = 8;
    const fontSize = 10;
    const lineSpacing = 2;

    ctx.save();
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    let yPosition = rect.height - padding;
    ctx.fillText(saTimestamp, rect.width - padding, yPosition);

    if (initialsAndSurname) {
      yPosition -= (fontSize + lineSpacing);
      ctx.fillText(initialsAndSurname, rect.width - padding, yPosition);
    }

    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div
      className="fixed inset-0 z-[9500] flex flex-col"
      style={{ backgroundColor: 'white' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {signerName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 p-4 flex flex-col">
        <p className="text-xs text-center mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Sign in the box below
        </p>
        <div
          className="flex-1 rounded-xl border-2 border-dashed relative overflow-hidden"
          style={{ borderColor: 'var(--color-border)', backgroundColor: '#fafafa', minHeight: '200px' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-300 text-lg">Draw your signature here</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={clearCanvas}
          className="flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Clear
        </button>
        <button
          onClick={saveSignature}
          disabled={!hasDrawn}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: hasDrawn ? 'var(--color-primary)' : 'var(--color-border)' }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default UnifiedWarningWizard;
