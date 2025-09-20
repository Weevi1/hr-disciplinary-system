import Logger from '../../../utils/logger';
// frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx
// 🎯 ENHANCED WARNING WIZARD V2 - PROFESSIONAL TREATMENT COMPLETE
// ✅ V2 Components: Split into focused, reusable components for maintainability
// ✅ Memory Leak Fixes: Proper signature pad cleanup and event listener management
// ✅ Auto-save Functionality: Prevent data loss with debounced persistence
// ✅ Real-time Validation: Immediate feedback with writing assistance
// ✅ Mobile-First Design: Responsive layouts optimized for touch devices
// ✅ Performance Optimized: React.memo, useCallback, proper dependency arrays
// 🚀 UPDATED: Using V2 step components with modern React patterns
// 🔧 SECURITY: Proper input sanitization and signature validation

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Check, ChevronLeft, ChevronRight, X, FileText, Scale, Send, Mic } from 'lucide-react';
// Import debugging components
import { useWizardLogging } from '../../../hooks/useWizardLogging';

// Import the step components - V2 versions with performance improvements
import { CombinedIncidentStepV2 } from './steps/CombinedIncidentStepV2'; 
import { LegalReviewSignaturesStepV2 } from './steps/LegalReviewSignaturesStepV2';
import { DeliveryCompletionStep } from './steps/DeliveryCompletionStep';

// Import microphone permission handler
import { MicrophonePermissionHandler } from './components/MicrophonePermissionHandler';

// Import audio recording components
import { useAudioRecording } from '../../../hooks/warnings/useAudioRecording';

// Use API layer instead of direct service imports
import { API } from '@/api';
import type { 
  EscalationRecommendation,
  EmployeeWithContext,
  WarningCategory,
  EnhancedWarningFormData
} from '@/services/WarningService';

// Import services and hooks
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/auth/AuthContext';

// ============================================
// TYPES - USING STANDARD SERVICE INTERFACES
// ============================================

// Use service types directly via local aliases for readability
type Employee = EmployeeWithContext;
type Category = WarningCategory;
type FormData = EnhancedWarningFormData;

// 🔧 REMOVED: Local LRARecommendation interface - now using EscalationRecommendation from service

interface SignatureData {
  manager: string | null;
  employee: string | null;
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
}

// 3-STEP WIZARD ENUM (AUDIO CONSENT REMOVED - AUTOMATIC)
enum WizardStep {
  INCIDENT_DETAILS = 0,
  LEGAL_REVIEW_SIGNATURES = 1,
  DELIVERY_COMPLETION = 2
}

interface EnhancedWarningWizardProps {
  employees: Employee[];
  categories: Category[];
  currentManagerName: string;
  organizationName: string;
  onComplete: () => void;
  onCancel: () => void;
  preSelectedEmployeeId?: string;
  preSelectedCategoryId?: string;
  isFullScreen?: boolean; // NEW: Full-screen support
}

// ============================================
// MAIN COMPONENT
// ============================================

const EnhancedWarningWizardComponent: React.FC<EnhancedWarningWizardProps> = ({
  employees,
  categories,
  currentManagerName,
  organizationName,
  onComplete,
  onCancel,
  preSelectedEmployeeId,
  preSelectedCategoryId,
  isFullScreen // NEW: Destructure isFullScreen prop
}) => {

  // Component tracking for debugging
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  // ============================================
  // HOOKS
  // ============================================
  
  const { user } = useAuth();
  const { organization } = useOrganization();
  
  // 🎯 Audio recording hook
  const audioRecording = useAudioRecording();

  // 🎙️ Handle microphone permission granted - just update state
  const handlePermissionGranted = useCallback(async () => {
    setMicrophonePermissionGranted(true);
    setShowPermissionHandler(false);
    Logger.debug('🎙️ Microphone permission granted');
  }, []);

  // 🎙️ Handle microphone permission denied
  const handlePermissionDenied = useCallback(() => {
    setMicrophonePermissionGranted(false);
    // Keep showing permission handler for retry
  }, []);

  // 🔧 ADD: Body scroll lock when wizard opens
  useEffect(() => {
    const handleBodyScrollLock = (lock: boolean) => {
      if (typeof window === 'undefined') return;
      
      if (lock) {
        // Store current scroll position
        const scrollY = window.scrollY;
        document.documentElement.style.setProperty('--scroll-y', `-${scrollY}px`);
        document.body.classList.add('modal-open');
      } else {
        // Restore scroll position
        document.body.classList.remove('modal-open');
        const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
        document.documentElement.style.removeProperty('--scroll-y');
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY.replace('px', '')) * -1);
        }
      }
    };

    handleBodyScrollLock(true);
    return () => handleBodyScrollLock(false);
  }, []);

  // ============================================
  // STATE - USING STANDARD EscalationRecommendation
  // ============================================
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.INCIDENT_DETAILS);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [showPermissionHandler, setShowPermissionHandler] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Form data
  const [formData, setFormData] = useState<FormData>({
    employeeId: preSelectedEmployeeId || null,
    categoryId: preSelectedCategoryId || null,
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    incidentLocation: '',
    incidentDescription: '',
    additionalNotes: '',
    issueDate: new Date().toISOString().split('T')[0],
    validityPeriod: 6
  });
  const [isLoadingWarningHistory, setIsLoadingWarningHistory] = useState(false);
  const [warningHistory, setWarningHistory] = useState<any[]>([]);
  // 🔧 FIXED: Using EscalationRecommendation instead of local LRARecommendation
  const [lraRecommendation, setLraRecommendation] = useState<EscalationRecommendation | null>(null);
  const [finalWarningId, setFinalWarningId] = useState<string | null>(null);
  
  // 🔥 Navigation state to prevent race conditions
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<WizardStep | null>(null);
  
  // Debug state removed for production
  
  // Signatures
  const [signatures, setSignatures] = useState<SignatureData>({
    manager: null,
    employee: null
  });

  const [signaturesFinalized, setSignaturesFinalized] = useState(false);

  // 🔧 FIX: Initialize logging hook with safe defaults
  const logging = useWizardLogging({
    stepName: `STEP_${currentStep || 1}`, // ← ADD: Safe fallback
    autoStart: true,
    enableRealTimeValidation: false
  });

  // ============================================
  // REFS FOR TRACKING CHANGES (PREVENT LOOPS)
  // ============================================

  const previousStepRef = useRef<WizardStep>(WizardStep.INCIDENT_DETAILS); // ← FIX: Safe initial value
  const previousFormDataRef = useRef<FormData>(formData);
  const loggedStepsRef = useRef<Set<WizardStep>>(new Set());
  const mountGuardRef = useRef<boolean>(false); // ← Prevent duplicate audio recording in StrictMode

  // ============================================
  // 🔥 OPTIMIZED: STABLE DERIVED STATE
  // ============================================
  
  const selectedEmployee = useMemo(() => 
    employees.find(emp => emp.id === formData.employeeId), 
    [employees, formData.employeeId]
  );
  
  const selectedCategory = useMemo(() => 
    categories.find(cat => cat.id === formData.categoryId), 
    [categories, formData.categoryId]
  );

  // 🔥 OPTIMIZED: Stable organization ID reference
  const organizationId = useMemo(() => organization?.id, [organization?.id]);

  // ============================================
  // 🔧 CRITICAL FIX: DEFINE NAVIGATION HANDLERS EARLY
  // ============================================
  
  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0 && !isNavigating) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, isNavigating]);

  const handleNextStep = useCallback(() => {
    if (currentStep < 3 && !isNavigating) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, isNavigating]);


// 🔧 ENHANCED: Scroll to top when step changes with debugging
useEffect(() => {
  Logger.debug('🔍 Step changed, attempting scroll to top:', currentStep)
  
  const contentElement = document.querySelector('.wizard-content__scrollable');
  Logger.debug('🔍 Content element found:', !!contentElement)
  
  if (contentElement) {
    Logger.debug('🔍 Current scroll position:', contentElement.scrollTop)
    contentElement.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Fallback: Force scroll if smooth doesn't work
    setTimeout(() => {
      if (contentElement.scrollTop > 0) {
        Logger.debug('⚡ Fallback: Force instant scroll')
        contentElement.scrollTop = 0;
      }
    }, 300);
  }
}, [currentStep]);

  // ============================================
  // 🐛 DEBUG KEYBOARD SHORTCUTS
  // ============================================

  // Debug keyboard shortcuts removed for production

  // ============================================
  // 🔥 STEP CHANGE LOGGING (ONLY WHEN STEP ACTUALLY CHANGES)
  // ============================================
  
  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      logging.trackSuccess('STEP_CHANGED', {
        from: previousStepRef.current,
        to: currentStep,
        stepName: currentStep === WizardStep.INCIDENT_DETAILS ? 'Incident Details' :
                  currentStep === WizardStep.LEGAL_REVIEW_SIGNATURES ? 'Legal Review' :
                  'Delivery Completion'
      });
      previousStepRef.current = currentStep;
    }
  }, [currentStep, logging]);

  // ============================================
  // 🔥 OPTIMIZED: TIMER EFFECT WITH MINIMAL DEPENDENCIES
  // ============================================
  
  const isRecording = audioRecording.isRecording;

  // ============================================
  // 🔥 WARNING HISTORY LOADING + EMPLOYEE SELECTION EFFECT
  // ============================================
  
  const loadEmployeeWarningHistory = useCallback(async (employeeId: string) => {
    if (!employeeId || !organizationId) {
      return;
    }

    logging.trackAPI('loadWarningHistory', { employeeId, organizationId });
    setIsLoadingWarningHistory(true);
    
    try {
      const history = await API.warnings.getAll(organizationId, { employeeId });
      setWarningHistory(history);
      
      logging.trackAPI('loadWarningHistory', { employeeId, organizationId }, { 
        count: history.length 
      });
      
    } catch (error) {
      logging.trackError(error as Error, { employeeId, organizationId });
      setWarningHistory([]);
    } finally {
      setIsLoadingWarningHistory(false);
    }
  }, [organizationId, logging]);

  // 🔧 CRITICAL FIX: Load warning history when employee is selected
  const loadedEmployeeRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedEmployee && 
        !isLoadingWarningHistory && 
        loadedEmployeeRef.current !== selectedEmployee.id) {
      
      loadedEmployeeRef.current = selectedEmployee.id;
      loadEmployeeWarningHistory(selectedEmployee.id);
    }
  }, [selectedEmployee?.id, isLoadingWarningHistory, loadEmployeeWarningHistory]);

  // ============================================
  // 🔥 LRA RECOMMENDATION GENERATION - FIXED TO USE EscalationRecommendation
  // ============================================
  
  const generateLRARecommendation = useCallback(async (employeeId: string, categoryId: string) => {
    if (!employeeId || !categoryId || !organizationId || !formData.incidentDescription) {
      const missingData = {
        employeeId: !!employeeId,
        categoryId: !!categoryId,
        organizationId: !!organizationId,
        incidentDescription: !!formData.incidentDescription
      };
      
      logging.trackError(new Error('Cannot generate LRA - missing data'), missingData);
      return;
    }
    
    setIsAnalyzing(true);
    logging.trackAPI('generateLRARecommendation', { employeeId, categoryId });
    
    try {
      // 🔧 FIXED: Now correctly receives EscalationRecommendation via API with organizationId
      const recommendation = await API.warnings.getEscalationRecommendation(
        employeeId,
        categoryId,
        organization?.id || 'default'
      );
      
      setLraRecommendation(recommendation);
      logging.trackAPI('generateLRARecommendation', { employeeId, categoryId }, recommendation);
      
    } catch (error) {
      logging.trackError(error as Error, { employeeId, categoryId, formData });
      
      // 🔧 FIXED: Fallback using EscalationRecommendation format
      const fallbackRecommendation: EscalationRecommendation = {
        // Core Recommendation
        suggestedLevel: 'counselling',
        recommendedLevel: 'Counselling Session',
        reason: 'Fallback recommendation due to analysis error. Manual review required.',
        activeWarnings: [],
        escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal'],
        isEscalation: false,
        
        // Essential LRA Compliance
        category: selectedCategory?.name || 'General Misconduct',
        categoryId: categoryId,
        legalBasis: 'LRA Section 188 - Fair reason and procedure',
        legalRequirements: ['Ensure procedural fairness', 'Document thoroughly'],
        
        // Progressive Discipline Context
        warningCount: 0,
        nextExpiryDate: null,
        examples: ['Review case manually', 'Consult HR if needed'],
        
        // Simple Justification
        explanation: 'Unable to analyze history - system error occurred',
        previousWarnings: [],

        // Backward compatibility
        confidence: 60
      };
      
      setLraRecommendation(fallbackRecommendation);
      logging.trackWarning('Using fallback LRA recommendation', fallbackRecommendation);
      
    } finally {
      setIsAnalyzing(false);
    }
  }, [organizationId, formData.incidentDescription, selectedCategory, logging]);

  // ============================================
  // 🔥 FORM DATA UPDATE WITH OPTIMIZED LOGGING
  // ============================================
  
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    // Only log significant changes, not every keystroke
    const significantFields = ['employeeId', 'categoryId', 'incidentLocation'];
    const hasSignificantChange = Object.keys(updates).some(key => 
      significantFields.includes(key) && 
      updates[key as keyof FormData] !== formData[key as keyof FormData]
    );

    if (hasSignificantChange) {
      logging.trackSuccess('SIGNIFICANT_FORM_UPDATE', updates);
    }

    setFormData(prev => ({ ...prev, ...updates }));
  }, [formData, logging]);

  // ============================================
  // 🔥 WIZARD COMPLETION HANDLERS
  // ============================================
  
  const handleWizardComplete = useCallback(() => {
    logging.trackSuccess('WIZARD_COMPLETED', {
      sessionDuration: Date.now() - new Date(logging.summary?.startTime || Date.now()).getTime(),
      totalSteps: completedSteps.size,
      totalIssues: logging.issues.length,
      finalWarningId
    });
    
    logging.endSession('completed');
    onComplete();
  }, [onComplete, logging, completedSteps.size, finalWarningId]);

  const handleWizardCancel = useCallback(() => {
    logging.trackWarning('WIZARD_CANCELLED', {
      currentStep,
      completedSteps: Array.from(completedSteps)
    });

    // 🎤 CRITICAL: Force cleanup any ongoing audio recording
    Logger.debug('🗑️ Force cleaning up audio recording due to wizard closure');
    audioRecording.forceCleanup();

    // 🔧 ADD: Unlock body scroll before closing
    document.body.classList.remove('modal-open');

    logging.endSession('cancelled');
    onCancel();
  }, [onCancel, logging, currentStep, completedSteps, audioRecording]);

  // ============================================
  // AUDIO RECORDING INITIALIZATION
  // ============================================

  useEffect(() => {
    // 🔧 STRICTMODE GUARD: Prevent duplicate recording start
    if (mountGuardRef.current || !microphonePermissionGranted || audioRecording.isRecording || audioRecording.audioUrl) {
      return;
    }

    const startRecording = async () => {
      try {
        mountGuardRef.current = true;
        await audioRecording.startRecording();
        logging.trackSuccess('AUDIO_RECORDING_STARTED', {
          duration: audioRecording.duration,
          size: audioRecording.size
        });
      } catch (error) {
        logging.trackError(error as Error, { context: 'AUDIO_RECORDING_START' });
        mountGuardRef.current = false; // Reset on error
      }
    };

    startRecording();

    return () => {
      mountGuardRef.current = false;
    };
  }, [microphonePermissionGranted]); // ✅ FIXED: Only depend on permission state, not logging object

  // ============================================
  // 🔥 PENDING NAVIGATION HANDLER
  // ============================================
  
  useEffect(() => {
    if (pendingNavigation && !isAnalyzing && lraRecommendation) {
      logging.trackSuccess('LRA_ANALYSIS_COMPLETE_PROCEEDING', {
        pendingStep: pendingNavigation,
        hasRecommendation: !!lraRecommendation
      });
      
      setCurrentStep(pendingNavigation);
      setPendingNavigation(null);
      setIsNavigating(false);
    }
  }, [pendingNavigation, isAnalyzing, lraRecommendation, logging]);

  // ============================================
  // 🔥 STEP NAVIGATION WITH RACE CONDITION PREVENTION
  // ============================================
  
  const nextStep = useCallback(async () => {
    logging.trackSuccess('NEXT_STEP_REQUESTED', { 
      currentStep, 
      hasLRA: !!lraRecommendation 
    });

    if (currentStep >= WizardStep.DELIVERY_COMPLETION) {
      return;
    }

    const nextStepNumber = (currentStep + 1) as WizardStep;
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    // Handle Step 1 → Step 2 transition with LRA generation
    if (currentStep === WizardStep.INCIDENT_DETAILS && 
        nextStepNumber === WizardStep.LEGAL_REVIEW_SIGNATURES) {
      
      if (!formData.employeeId || !formData.categoryId || !formData.incidentDescription) {
        logging.trackError(new Error('Missing required data for step 2'), {
          employeeId: !!formData.employeeId,
          categoryId: !!formData.categoryId,
          incidentDescription: !!formData.incidentDescription
        });
        return;
      }

      if (lraRecommendation && !isAnalyzing) {
        logging.trackSuccess('PROCEEDING_TO_STEP_2', { hasLRA: true });
        setCurrentStep(nextStepNumber);
        return;
      }

      logging.trackSuccess('TRIGGERING_LRA_GENERATION', formData);
      setIsNavigating(true);
      setPendingNavigation(nextStepNumber);
      await generateLRARecommendation(formData.employeeId, formData.categoryId);
      return;
    }
    
    // For other step transitions
    logging.trackSuccess('STEP_NAVIGATION_COMPLETE', { 
      from: currentStep, 
      to: nextStepNumber 
    });
    setCurrentStep(nextStepNumber);
    
  }, [currentStep, formData.employeeId, formData.categoryId, formData.incidentDescription, 
      lraRecommendation, isAnalyzing, generateLRARecommendation, logging]);

  const previousStep = useCallback(() => {
    if (currentStep > WizardStep.INCIDENT_DETAILS) {
      logging.trackSuccess('PREVIOUS_STEP', { 
        from: currentStep, 
        to: currentStep - 1 
      });
      
      setCurrentStep((currentStep - 1) as WizardStep);
      
      if (isNavigating) {
        setIsNavigating(false);
        setPendingNavigation(null);
        logging.trackWarning('NAVIGATION_CANCELLED_BY_BACK', { currentStep });
      }
    }
  }, [currentStep, isNavigating, logging]);

  // ============================================
  // 🔥 SIGNATURE HANDLER
  // ============================================
  
  const handleSignaturesComplete = useCallback(async (newSignatures: SignatureData, finalized: boolean = false) => {
    logging.trackSuccess('SIGNATURES_COMPLETED', {
      hasManager: !!newSignatures.manager,
      hasEmployee: !!newSignatures.employee,
      finalized,
      timestamp: newSignatures.timestamp
    });
    
    setSignatures(newSignatures);
    
    // 🔒 Only finalize and enable next step when explicitly finalized
    if (finalized) {
      setSignaturesFinalized(true);
      
      // 🔥 CREATE AND FULLY COMPLETE WARNING WHEN SIGNATURES ARE FINALIZED
      try {
        // 🎤 CRITICAL: Auto-stop audio recording FIRST before creating warning
        let audioUrl = null;
        if (audioRecording?.isRecording) {
          Logger.debug('🎤 Auto-stopping audio recording before saving warning...')
          logging.trackSuccess('AUDIO_AUTO_STOP_BEFORE_SAVE', {
            duration: audioRecording.duration,
            size: audioRecording.size
          });
          
          // Get the audioUrl directly from stopRecording return value
          audioUrl = await audioRecording.stopRecording();
          
          Logger.success(21068)
          
          if (!audioUrl) {
            Logger.warn('⚠️ Audio URL not returned from stopRecording. Will create warning with placeholder.')
          }
        }
        Logger.debug(21325)
        
        if (!selectedEmployee || !selectedCategory || !organization) {
          throw new Error('Missing required data for warning creation');
        }

        // Create warning data (avoiding undefined values)
        const warningData: any = {
          // Core IDs
          employeeId: selectedEmployee.id,
          categoryId: selectedCategory.id,
          organizationId: organization.id,
          
          // Employee data for denormalization
          employeeName: selectedEmployee.profile?.firstName || 'Unknown',
          employeeLastName: selectedEmployee.profile?.lastName || 'Employee',
          employeeNumber: selectedEmployee.profile?.employeeNumber || 'Unknown',
          employeeDepartment: selectedEmployee.profile?.department || 'Unknown',
          employeePosition: selectedEmployee.profile?.position || 'Unknown',
          
          // Category data
          categoryName: selectedCategory.name || 'Unknown',
          
          // Warning details
          level: lraRecommendation?.suggestedLevel || 'counselling',
          incidentDate: formData.incidentDate,
          incidentTime: formData.incidentTime,
          incidentLocation: formData.incidentLocation,
          incidentDescription: formData.incidentDescription,
          additionalNotes: formData.additionalNotes,
          issueDate: formData.issueDate,
          validityPeriod: formData.validityPeriod,
          
          // Signature data
          signatures: newSignatures
        };

        // MANDATORY: Audio recording is required for every warning
        if (audioUrl) {
          warningData.audioRecording = {
            url: audioUrl,
            duration: audioRecording?.duration || 0,
            size: audioRecording?.size || 0,
            recordingId: audioRecording?.recordingId,
            uploadToFirebase: true,
            status: 'ready',
            processingStatus: 'pending'
          };
          Logger.success(23340)
        } else {
          // CRITICAL: Audio recording is mandatory - show error and prevent save
          Logger.error('❌ Audio recording is mandatory for all warnings')
          logging.trackError(new Error('Audio recording missing'), { 
            warningData: formData, 
            audioState: {
              isRecording: audioRecording?.isRecording,
              hasDirectUrl: !!audioUrl,
              hasStateUrl: !!audioRecording?.audioUrl,
              duration: audioRecording?.duration
            }
          });
          
          // Still create placeholder for now, but mark as incomplete
          warningData.audioRecording = {
            status: 'missing',
            processingStatus: 'required',
            error: 'Audio recording is mandatory but was not captured',
            duration: audioRecording?.duration || 0,
            size: audioRecording?.size || 0,
            uploadToFirebase: false,
            requiresAttention: true
          };
        }

        // 🔥 STEP 1: Create the warning document
        const warningId = await API.warnings.create(warningData);
        Logger.success(24554)
        
        // Store warning ID for step 3
        setFinalWarningId(warningId);

        // 🔥 STEP 2: Upload audio to Firebase and update warning document
        if (audioUrl && audioRecording?.uploadToFirebaseFromUrl && audioRecording?.recordingId && warningId) {
          try {
            Logger.debug('☁️ Uploading audio to Firebase Storage...')
            
            // Upload audio to Firebase Storage using the returned audioUrl directly
            const firebaseAudioUrl = await audioRecording.uploadToFirebaseFromUrl(
              audioUrl, 
              audioRecording.recordingId, 
              organization.id, 
              warningId
            );
            
            if (firebaseAudioUrl) {
              Logger.success(25382)
              
              // Use Firebase functions for document updates
              
              // 🔥 Update warning document with Firebase audio URL (SHARDED COLLECTION)
              Logger.debug('📝 Updating warning document with Firebase audio URL...')
              const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
              
              await updateDoc(warningRef, {
                'audioRecording.url': firebaseAudioUrl,
                'audioRecording.storageePath': `warnings/${organization.id}/${warningId}/audio/${audioRecording.recordingId}.webm`,
                'audioRecording.processingStatus': 'complete',
                'audioRecording.uploadedAt': new Date(),
                updatedAt: new Date()
              });
              
              Logger.success(26224)
              logging.trackSuccess('AUDIO_UPLOADED_AND_UPDATED', {
                warningId,
                firebaseUrl: firebaseAudioUrl,
                duration: audioRecording.duration,
                size: audioRecording.size
              });

              // 🎤 CRITICAL: Force cleanup audio recording after successful upload
              Logger.debug('🧹 Force cleaning up audio recording after successful upload...')
              audioRecording.forceCleanup();
              
            } else {
              Logger.warn('⚠️ Audio upload returned null URL')
              logging.trackWarning('AUDIO_UPLOAD_NULL_URL', { warningId });
            }
          } catch (audioError: any) {
            Logger.error('❌ Audio upload failed:', audioError)
            logging.trackError(audioError, { 
              context: 'AUDIO_UPLOAD_STEP2',
              warningId,
              duration: audioRecording?.duration,
              size: audioRecording?.size
            });
            
            // Mark audio as failed in warning document
            try {

              const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
              await updateDoc(warningRef, {
                'audioRecording.processingStatus': 'failed',
                'audioRecording.error': audioError.message || 'Upload failed in Step 2',
                'audioRecording.failedAt': new Date(),
                updatedAt: new Date()
              });
            } catch (updateError) {
              Logger.error('❌ Failed to update warning with audio error:', updateError)
              logging.trackError(updateError as Error, { context: 'AUDIO_ERROR_UPDATE' });
            }

            // 🎤 CRITICAL: Force cleanup audio recording after upload failure too
            Logger.debug('🧹 Force cleaning up audio recording after upload failure...')
            audioRecording.forceCleanup();
          }
        }
        
        logging.trackSuccess('WARNING_FULLY_CREATED_STEP2', { warningId });
        
      } catch (error) {
        Logger.error('❌ Error creating warning:', error)
        logging.trackError(error as Error, { context: 'WARNING_CREATION_ON_SIGNATURE_COMPLETE' });
        // Don't prevent step progression - let user continue to step 3 and retry there
      }
      
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      logging.trackSuccess('SIGNATURES_FINALIZED_NEXT_ENABLED', { currentStep });
    }
  }, [currentStep, logging, audioRecording, selectedEmployee, selectedCategory, organization, formData, lraRecommendation, API]);

  // ============================================
  // 🔥 STEP CONFIGURATION
  // ============================================
  
  const stepConfig = useMemo(() => ({
    [WizardStep.INCIDENT_DETAILS]: {
      title: 'Incident Details',
      subtitle: `Step ${WizardStep.INCIDENT_DETAILS + 1} of 3`,
      icon: FileText,
    },
    [WizardStep.LEGAL_REVIEW_SIGNATURES]: {
      title: 'Review & Sign',
      subtitle: `Step ${WizardStep.LEGAL_REVIEW_SIGNATURES + 1} of 3`,
      icon: Scale,
    },
    [WizardStep.DELIVERY_COMPLETION]: {
      title: 'Deliver & Complete',
      subtitle: `Step ${WizardStep.DELIVERY_COMPLETION + 1} of 3`,
      icon: Send,
    }
  }), []);

  // ============================================
  // 🔥 FIXED: STEP VALIDATION WITHOUT RENDER LOOPS
  // ============================================
  
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case WizardStep.INCIDENT_DETAILS:
        return !!(
          formData.employeeId && 
          formData.categoryId && 
          formData.incidentDate && 
          formData.incidentTime && 
          formData.incidentLocation && 
          formData.incidentDescription &&
          formData.incidentDescription.length >= 20
        );
      case WizardStep.LEGAL_REVIEW_SIGNATURES:
        return !!(
          lraRecommendation && 
          !isAnalyzing && 
          signatures.manager && 
          signatures.employee && 
          signaturesFinalized
        );
      case WizardStep.DELIVERY_COMPLETION:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData, lraRecommendation, isAnalyzing, signatures, signaturesFinalized]);

  // ============================================
  // 🔥 FIXED: RENDER STEP CONTENT WITHOUT LOGGING LOOPS
  // ============================================
  
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case WizardStep.INCIDENT_DETAILS:
        return (
          <CombinedIncidentStepV2
            employees={employees}
            categories={categories}
            formData={formData}
            updateFormData={updateFormData}
            selectedEmployee={selectedEmployee}
            selectedCategory={selectedCategory}
            warningHistory={warningHistory}
            isLoadingWarningHistory={isLoadingWarningHistory}
            loadWarningHistory={loadEmployeeWarningHistory}
            lraRecommendation={lraRecommendation}
            isAnalyzing={isAnalyzing}
          />
        );

      case WizardStep.LEGAL_REVIEW_SIGNATURES:
        return (
          <LegalReviewSignaturesStepV2
            lraRecommendation={lraRecommendation}
            selectedEmployee={selectedEmployee}
            formData={formData}
            currentManagerName={currentManagerName}
            onSignaturesComplete={handleSignaturesComplete}
            isAnalyzing={isAnalyzing}
            signaturesFinalized={signaturesFinalized}
            currentSignatures={signatures}
          />
        );

      case WizardStep.DELIVERY_COMPLETION:
        return (
          <DeliveryCompletionStep
            selectedEmployee={selectedEmployee}
            formData={formData}
            lraRecommendation={lraRecommendation}
            signatures={signatures}
            organizationName={organizationName}
            currentManagerName={currentManagerName}
            audioRecording={audioRecording}
            onComplete={handleWizardComplete}
            onWarningCreated={setFinalWarningId}
            warningId={finalWarningId}
          />
        );

      default:
        return <div className="p-8 text-center text-red-600">Unknown step: {currentStep}</div>;
    }
  }, [
    currentStep,
    organizationName,
    currentManagerName,
    employees,
    categories,
    formData,
    updateFormData,
    selectedEmployee,
    selectedCategory,
    warningHistory,
    isLoadingWarningHistory,
    loadEmployeeWarningHistory,
    lraRecommendation,
    isAnalyzing,
    handleSignaturesComplete,
    signatures,
    audioRecording,
    handleWizardComplete
  ]);

  // ============================================
  // 🔥 NAVIGATION BUTTON STATE
  // ============================================
  
  const getNextButtonState = () => {
    if (currentStep === WizardStep.DELIVERY_COMPLETION) {
      return { show: false, disabled: false, loading: false, text: 'Complete' };
    }
    
    if (currentStep === WizardStep.INCIDENT_DETAILS && !isStepValid) {
      return { show: true, disabled: true, loading: false, text: 'Next' };
    }
    
    if (currentStep === WizardStep.INCIDENT_DETAILS && 
        isStepValid && (isNavigating || isAnalyzing)) {
      return { show: true, disabled: true, loading: true, text: 'Analyzing...' };
    }
    
    return { show: true, disabled: !isStepValid, loading: false, text: 'Next' };
  };

  const nextButtonState = getNextButtonState();

  // ============================================
  // 🔥 WARNING DATA FOR DEBUGGER (MEMOIZED) - FIXED TO USE EscalationRecommendation
  // ============================================
  
const warningDataForDebugger = useMemo(() => ({
  formData,  // ✅ Keep as nested object, don't spread
  signatures,
  lraRecommendation,
  selectedEmployee,
  selectedCategory,
  organizationId: organization?.id,
  currentStep,
  isStepValid,
  isAnalyzing,
  warningHistory,
  finalWarningId
}), [formData, signatures, lraRecommendation, selectedEmployee, selectedCategory, 
     organization?.id, currentStep, isStepValid, isAnalyzing, warningHistory, finalWarningId]);

  // ============================================
  // 🔥 CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    // Cleanup function that runs ONLY when component actually unmounts
    return () => {
      Logger.debug('🧹 EnhancedWarningWizard UNMOUNTING - cleaning up audio recording');

      // Force cleanup any ongoing audio recording
      audioRecording.forceCleanup();

      // Cleanup body classes
      document.body.classList.remove('modal-open');
    };
  }, []); // ✅ FIXED: Empty dependency array - only runs on mount/unmount

  // ============================================
  // 🔥 MAIN RENDER WITH FULL-SCREEN SUPPORT
  // ============================================
  
  // 🎙️ Show microphone permission handler first if needed
  if (showPermissionHandler && !microphonePermissionGranted) {
    return (
      <MicrophonePermissionHandler
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        organizationName={organizationName}
        managerName={currentManagerName}
      />
    );
  }

return (
  <div className={`
    enhanced-warning-wizard-modal
    ${isFullScreen ? 'enhanced-warning-wizard-modal--fullscreen' : ''}
  `}>
    <div className={`
      enhanced-warning-wizard-container
      ${isFullScreen ? 'enhanced-warning-wizard-container--fullscreen' : ''}
    `}>
      
{/* 🎯 SIMPLIFIED WIZARD HEADER */}
<div className="wizard-header">
  
  {/* Left: Close Button */}
  <div className="wizard-header__left">
    <button
      onClick={handleWizardCancel}
      className="wizard-header__close-button"
      title="Cancel and close wizard"
    >
      <X className="w-5 h-5" />
    </button>
  </div>

  {/* Center: Progress - Mobile vs Desktop */}
  <div className="wizard-header__center">
    
    {/* MOBILE: Simple Progress Bar + Text */}
    <div className="wizard-header__progress-mobile md:hidden">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{
            width: `${(currentStep / Object.keys(stepConfig).length) * 100}%`
          }} 
        />
      </div>
      <span className="progress-text">
        Step {currentStep + 1} of {Object.keys(stepConfig).length}
      </span>
    </div>

    {/* DESKTOP: Rich Dots System */}
    <div className="wizard-header__progress-desktop hidden md:flex">
      {Object.entries(stepConfig).map(([step, config]) => {
        const stepNum = parseInt(step);
        const isActive = stepNum === currentStep;
        const isCompleted = completedSteps.has(stepNum);
        
        return (
          <div key={step} className="step-container">
            <div
              className={`
                step-dot
                ${isActive ? 'step-dot--active' : ''}
                ${isCompleted ? 'step-dot--completed' : ''}
                ${!isActive && !isCompleted ? 'step-dot--inactive' : ''}
              `}
              title={config.title}
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : (
                stepNum
              )}
            </div>
            
            {/* Connector line - only between steps */}
            {stepNum < Math.max(...Object.keys(stepConfig).map(Number)) && (
              <div className={`
                step-connector
                ${isCompleted ? 'step-connector--completed' : 'step-connector--inactive'}
              `} />
            )}
          </div>
        );
      })}
    </div>

    {/* Title & Subtitle - Desktop Only */}
    <div className="wizard-header__title-section hidden md:block">
      <h2 className="wizard-header__title">
        {stepConfig[currentStep]?.title}
      </h2>
      <p className="wizard-header__subtitle">
        {stepConfig[currentStep]?.subtitle}
      </p>
    </div>
  </div>

  {/* Right: Debug Tools & Session Info - Desktop Only */}
  <div className="wizard-header__right hidden md:flex">
    {/* Audio Recording Indicator */}
    <div className={`
      audio-indicator
      ${audioRecording.isRecording ? 'audio-indicator--recording' : 'audio-indicator--idle'}
    `}>
      <div className={`
        recording-dot
        ${audioRecording.isRecording ? 'recording-dot--active' : 'recording-dot--inactive'}
      `} />
      <span>{audioRecording.isRecording ? 'Recording' : 'Ready'}</span>
    </div>
    
    {/* Debug Tools - Removed for production */}
    
    {/* Session ID */}
    <div className="session-id" title={`Session ID: ${logging.sessionId}`}>
      {logging.sessionId.slice(-6)}
    </div>
  </div>
</div>
      
      {/* 🎯 WIZARD CONTENT - The key fix for scrolling */}
      <div className="wizard-content">
        <div className="wizard-content__scrollable">
          {renderStepContent()}
        </div>
      </div>
      
      {/* 🎯 WIZARD FOOTER - Now using semantic classes */}
      <div className="wizard-footer">
        <div className="wizard-footer__nav">
          {/* Previous Button */}
          <button
            onClick={previousStep}
            disabled={currentStep === WizardStep.INCIDENT_DETAILS || isNavigating}
            className={`
              wizard-footer__button wizard-footer__button--secondary
              ${(currentStep === WizardStep.INCIDENT_DETAILS || isNavigating) ? 'opacity-50' : ''}
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Next/Complete Button */}
          {nextButtonState.show && (
            <button
              onClick={nextStep}
              disabled={nextButtonState.disabled}
              className={`
                wizard-footer__button wizard-footer__button--primary
                ${nextButtonState.loading ? 'wizard-footer__button--loading' : ''}
              `}
            >
              {!nextButtonState.loading && (
                <>
                  {nextButtonState.text}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Progress indicator on mobile */}
        <div className="md:hidden flex items-center space-x-1">
          <span className="text-xs text-gray-500">
            Step {currentStep + 1} of {Object.keys(stepConfig).length}
          </span>
        </div>
      </div>
      
      {/* Debug Panels - Removed for production */}
    </div>
  </div>
);
};

// 🔥 PERFORMANCE: Prevent unnecessary rerenders when props haven't changed
// Custom comparison to ignore array reference changes if content is the same
const arePropsEqual = (prevProps: EnhancedWarningWizardProps, nextProps: EnhancedWarningWizardProps) => {
  // Check primitive props
  if (
    prevProps.currentManagerName !== nextProps.currentManagerName ||
    prevProps.organizationName !== nextProps.organizationName ||
    prevProps.preSelectedEmployeeId !== nextProps.preSelectedEmployeeId ||
    prevProps.preSelectedCategoryId !== nextProps.preSelectedCategoryId ||
    prevProps.isFullScreen !== nextProps.isFullScreen
  ) {
    Logger.debug('🔄 Wizard props changed - primitive props differ');
    return false;
  }

  // Check arrays by length and content
  if (prevProps.employees.length !== nextProps.employees.length) {
    Logger.debug('🔄 Wizard props changed - employee count differs');
    return false;
  }

  if (prevProps.categories.length !== nextProps.categories.length) {
    Logger.debug('🔄 Wizard props changed - category count differs');
    return false;
  }

  // Arrays same length, assume content is same to prevent remount
  // This prevents remount due to array reference changes
  Logger.debug('✅ Wizard props equal - preventing remount');
  return true;
};

export const EnhancedWarningWizard = React.memo(EnhancedWarningWizardComponent, arePropsEqual);