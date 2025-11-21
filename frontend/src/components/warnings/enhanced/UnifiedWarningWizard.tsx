// UnifiedWarningWizard.tsx - 10-phase unified warning wizard
// Replaces EnhancedWarningWizard with consistent phased UX throughout

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  User, FileText, Tag, MessageSquare, Target, TrendingUp,
  CheckCircle, FileSearch, PenTool, Send, AlertTriangle, X, Scale, Eye
} from 'lucide-react';
import Logger from '../../../utils/logger';

// Shared phase components
import { PhaseProgress, PhaseHeader, PhaseGuidance, PhaseNavigation } from './shared';

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
  const levelMap: Record<string, { label: string; requiresCommitments: boolean }> = {
    'counselling': { label: 'Counselling', requiresCommitments: true },
    'verbal': { label: 'Verbal', requiresCommitments: true },
    'first_written': { label: 'Written', requiresCommitments: true },
    'second_written': { label: 'Second Written', requiresCommitments: true },
    'final_written': { label: 'Final Written', requiresCommitments: false },
    'suspension': { label: 'Suspension', requiresCommitments: false },
    'dismissal': { label: 'Ending of Service', requiresCommitments: false }
  };
  return levelMap[level] || { label: level, requiresCommitments: true };
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

  // ============================================
  // STATE
  // ============================================

  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.EMPLOYEE_SELECTION);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());

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
        return employeeStatement.length >= 20;

      case Phase.EXPECTED_STANDARDS:
        return expectedBehavior.length >= 20;

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
  useEffect(() => {
    if (formData.employeeId && formData.categoryId && organization?.id && !isAnalyzing) {
      generateLRARecommendation();
    }
  }, [formData.employeeId, formData.categoryId, organization?.id]);

  // Start audio recording when microphone permission is granted
  useEffect(() => {
    if (microphonePermissionGranted && !audioRecording.isRecording && !showPermissionHandler) {
      // Auto-start recording after permission granted
      audioRecording.startRecording().catch(err => {
        Logger.error('Failed to start audio recording:', err);
      });
    }
  }, [microphonePermissionGranted, showPermissionHandler]);

  // ============================================
  // HANDLERS
  // ============================================

  const generateLRARecommendation = async () => {
    if (!formData.employeeId || !formData.categoryId || !organization?.id) return;

    setIsAnalyzing(true);
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
        setIsAnalyzing(false);
        return;
      }

      // Use correct API method with proper parameters
      const recommendation = await API.warnings.getEscalationRecommendation(
        formData.employeeId,
        formData.categoryId,
        organization.id,
        selectedCategory, // Pass the category object
        activeWarnings // Pass preloaded warnings
      );

      setLraRecommendation(recommendation);
      setFormData(prev => ({ ...prev, level: recommendation.suggestedLevel }));

    } catch (error) {
      Logger.error('Failed to generate LRA recommendation:', error);
      // Provide fallback recommendation with proper structure
      const categoryEscalationPath = selectedCategory?.escalationPath || ['counselling', 'verbal_warning', 'first_written', 'final_written'];
      const fallbackRecommendation: any = {
        suggestedLevel: categoryEscalationPath[0] || 'counselling',
        recommendedLevel: categoryEscalationPath[0] === 'counselling' ? 'Counselling Session' :
                         categoryEscalationPath[0] === 'verbal_warning' ? 'Verbal Warning' :
                         'Counselling Session',
        reason: 'Unable to analyze history - using default first step.',
        activeWarnings: [],
        escalationPath: categoryEscalationPath,
        isEscalation: false,
        category: selectedCategory?.name || 'General Misconduct',
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

      // Stop and upload audio if recording
      if (audioRecording.isRecording) {
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

      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      Logger.error('Failed to finalize:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handle employee/witness signature completion
  const handleEmployeeSignature = useCallback(async (signature: string | null) => {
    if (signatureType === 'witness') {
      // Witness signature - apply watermark and save to witness field
      if (signature) {
        try {
          const watermarkedSignature = await addWitnessWatermark(signature);
          setSignatures(prev => ({ ...prev, witness: watermarkedSignature, employee: null }));
        } catch (error) {
          Logger.error('Failed to apply witness watermark:', error);
          // Fall back to original signature if watermarking fails
          setSignatures(prev => ({ ...prev, witness: signature, employee: null }));
        }
      } else {
        setSignatures(prev => ({ ...prev, witness: null }));
      }
    } else {
      // Normal employee signature - no watermark, save to employee field
      setSignatures(prev => ({ ...prev, employee: signature, witness: null }));
    }
  }, [signatureType, addWitnessWatermark]);

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
                setFormData(prev => ({ ...prev, categoryId: id }));
                // Reset recommendation - effect will trigger new analysis
                setLraRecommendation(null);
              }}
              lraRecommendation={lraRecommendation}
            />

            {isAnalyzing && (
              <ThemedAlert variant="info">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>Analyzing warning history...</span>
                </div>
              </ThemedAlert>
            )}

            {lraRecommendation && !isAnalyzing && (
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

                    {/* Active warnings on file */}
                    {lraRecommendation.activeWarnings && lraRecommendation.activeWarnings.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          Active Warnings ({lraRecommendation.activeWarnings.length}):
                        </p>
                        <div className="space-y-1">
                          {lraRecommendation.activeWarnings.slice(0, 3).map((warning: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedWarningDetails(warning)}
                              className="w-full text-left text-xs flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
                              <span className="hover:underline">
                                {getWarningLevelInfo(warning.level || warning.suggestedLevel).label} - {warning.categoryName || warning.category || 'General'}
                                {warning.issueDate && ` (${new Date(warning.issueDate).toLocaleDateString('en-ZA')})`}
                              </span>
                            </button>
                          ))}
                          {lraRecommendation.activeWarnings.length > 3 && (
                            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
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
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>{employeeStatement.length}/20 characters minimum</span>
              {employeeStatement.length >= 20 && (
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
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>{expectedBehavior.length}/20 characters minimum</span>
              {expectedBehavior.length >= 20 && (
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
                <div key={commitment.id} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={commitment.commitment}
                    onChange={(e) => {
                      const updated = [...actionCommitments];
                      updated[index].commitment = e.target.value;
                      setActionCommitments(updated);
                    }}
                    placeholder="What will be done..."
                    className="flex-1 px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <input
                    type="text"
                    value={commitment.timeline}
                    onChange={(e) => {
                      const updated = [...actionCommitments];
                      updated[index].timeline = e.target.value;
                      setActionCommitments(updated);
                    }}
                    placeholder="By when..."
                    className="w-32 px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <button
                    onClick={() => setActionCommitments(actionCommitments.filter(c => c.id !== commitment.id))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
          <div className="space-y-3">
            <ThemedAlert variant="success">
              Review all information below. Click any section to edit.
            </ThemedAlert>

            {/* Summary cards */}
            <div className="space-y-2">
              <ReviewCard title="Employee" onClick={() => goToPhase(Phase.EMPLOYEE_SELECTION)}>
                {employeeName || 'Not selected'}
              </ReviewCard>
              <ReviewCard title="Incident" onClick={() => goToPhase(Phase.INCIDENT_DETAILS)}>
                {formData.incidentDate} at {formData.incidentTime} - {formData.incidentLocation}
              </ReviewCard>
              <ReviewCard title="Category" onClick={() => goToPhase(Phase.CATEGORY_RECOMMENDATION)}>
                {selectedCategory?.name || 'Not selected'} → {levelInfo.label}
              </ReviewCard>
              {levelInfo.requiresCommitments && (
                <>
                  <ReviewCard title="Employee Response" onClick={() => goToPhase(Phase.EMPLOYEE_RESPONSE)}>
                    {employeeStatement.substring(0, 100)}{employeeStatement.length > 100 ? '...' : ''}
                  </ReviewCard>
                  <ReviewCard title="Expected Standards" onClick={() => goToPhase(Phase.EXPECTED_STANDARDS)}>
                    {expectedBehavior.substring(0, 100)}{expectedBehavior.length > 100 ? '...' : ''}
                  </ReviewCard>
                  <ReviewCard title="Improvement Plan" onClick={() => goToPhase(Phase.IMPROVEMENT_PLAN)}>
                    {actionCommitments.length} commitment(s) - Review: {reviewDate || 'Not set'}
                  </ReviewCard>
                </>
              )}
            </div>
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
          <div className="space-y-4">
            {/* Step 1: Manager signature */}
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Step 1: Manager Signature
                  </span>
                </div>
                {signatures.manager && (
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                )}
              </div>
              <DigitalSignaturePad
                onSignatureComplete={handleManagerSignature}
                disabled={isSaving}
                label="Manager Signature"
                placeholder="Sign here"
                initialSignature={signatures.manager}
                width={300}
                height={100}
                signerName={currentManagerName}
              />
            </div>

            {/* Step 2: PDF Preview - Only show after manager signs */}
            {signatures.manager && (
              <div className="space-y-3">
                <ThemedCard
                  padding="md"
                  hover
                  className="cursor-pointer transition-all duration-200 active:scale-95"
                  onClick={() => setShowPDFPreview(true)}
                  style={{
                    border: '2px dashed var(--color-primary)',
                    backgroundColor: 'var(--color-primary-light)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSearch className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <span className="font-semibold text-sm block" style={{ color: 'var(--color-primary)' }}>
                          Step 2: Preview Warning PDF
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Pass device to employee to review the complete document
                        </span>
                      </div>
                    </div>
                    <Eye className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                </ThemedCard>

                {/* Employee confirmation checkbox */}
                <div
                  className="p-3 rounded-lg border transition-all"
                  style={{
                    backgroundColor: employeeViewedPDF ? 'var(--color-alert-success-bg)' : 'var(--color-card-background)',
                    borderColor: employeeViewedPDF ? 'var(--color-success)' : 'var(--color-border-light)'
                  }}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={employeeViewedPDF}
                      onChange={(e) => setEmployeeViewedPDF(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded flex-shrink-0"
                      style={{ accentColor: 'var(--color-success)' }}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        I have reviewed the warning document
                      </span>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Employee confirms they have viewed and understood the complete PDF document
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Employee/Witness signature - Only show after PDF viewed */}
            {signatures.manager && employeeViewedPDF && (
              <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Step 3: {signatureType === 'employee' ? 'Employee' : 'Witness'} Signature
                    </span>
                  </div>
                  {(signatures.employee || signatures.witness) && (
                    <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                  )}
                </div>

                {/* Signature Type Toggle */}
                <div className="mb-3 p-2 rounded border" style={{
                  backgroundColor: 'var(--color-card-background)',
                  borderColor: 'var(--color-border-light)'
                }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Signature Type:
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureType"
                        value="employee"
                        checked={signatureType === 'employee'}
                        onChange={() => setSignatureType('employee')}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--color-success)' }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                        Employee Signature
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureType"
                        value="witness"
                        checked={signatureType === 'witness'}
                        onChange={() => setSignatureType('witness')}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--color-warning)' }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                        Witness Signature
                      </span>
                    </label>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {signatureType === 'employee'
                      ? 'Employee signs to acknowledge the warning'
                      : 'Use witness if employee refuses to sign'
                    }
                  </div>
                </div>

                <DigitalSignaturePad
                  onSignatureComplete={handleEmployeeSignature}
                  disabled={isSaving}
                  label={signatureType === 'employee' ? 'Employee Signature' : 'Witness Signature'}
                  placeholder="Sign here"
                  initialSignature={signatures.employee || signatures.witness}
                  width={300}
                  height={100}
                  signerName={employeeName}
                />
              </div>
            )}

            {/* Waiting states */}
            {!signatures.manager && (
              <div className="p-3 rounded-lg border" style={{
                backgroundColor: 'var(--color-alert-warning-bg)',
                borderColor: 'var(--color-warning)'
              }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-alert-warning-text)' }}>
                    Manager must sign first before proceeding
                  </span>
                </div>
              </div>
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

  // Show microphone permission handler first
  if (showPermissionHandler && !microphonePermissionGranted) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="enhanced-warning-wizard-container p-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Issue Warning
              </h2>
              {/* Recording indicator */}
              {audioRecording.isRecording && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                    {audioRecording.formatDuration(audioRecording.duration)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

      {/* Progress indicator */}
      <PhaseProgress
        currentPhase={currentPhase}
        totalPhases={TOTAL_PHASES}
        completedPhases={completedPhases}
        onPhaseClick={goToPhase}
      />

      {/* Phase content */}
      <ThemedCard padding="md" className="mt-4">
        <PhaseHeader
          title={phaseInfo.title}
          icon={phaseInfo.icon}
          phaseNumber={currentPhase + 1}
          totalPhases={TOTAL_PHASES}
          employeeName={currentPhase > 0 ? employeeName : undefined}
          incidentDate={currentPhase > 1 ? formData.incidentDate : undefined}
        />

        <PhaseGuidance>
          {phaseInfo.guidance}
        </PhaseGuidance>

        {renderPhaseContent()}

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
      </ThemedCard>
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
              className="w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
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
  );
};

// Helper component for review cards
const ReviewCard: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({
  title,
  onClick,
  children
}) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
      {title}
    </span>
    <p className="text-sm mt-1" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </p>
  </button>
);

export default UnifiedWarningWizard;
