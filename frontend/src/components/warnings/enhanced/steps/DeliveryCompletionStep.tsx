import Logger from '../../../../utils/logger';
// frontend/src/components/warnings/enhanced/steps/DeliveryCompletionStep.tsx
// 🎯 UNIFIED DELIVERY COMPLETION STEP - THEMED COMPONENTS
// ✅ Uses unified theming with CSS variables and ThemedCard/ThemedButton system
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Proper audio URL storage after Firebase upload
// ✅ PDF preview modal integration
// ✅ Comprehensive error handling and status tracking

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  Printer,
  FileText,
  CheckCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Scale,
  Mic,
  Upload,
  Play,
  Pause,
  Volume2,
  X,
  Download,
  Shield,
  ArrowRight,
  Eye,
  Loader2,
  Check,
  RefreshCw,
  QrCode
} from 'lucide-react';

// Import Firebase functions for document updates
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

// Import unified theming components
import { ThemedCard } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';
import { ThemedBadge } from '../../../common/ThemedCard';
import { ThemedAlert } from '../../../common/ThemedCard';

// Import services
import { useAuth } from '@/auth/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { API } from '@/api';
import { DeliveryNotificationService, DeliveryInstructionsService } from '@/services/DeliveryNotificationService';
import type {
  AudioRecordingData,
  EscalationRecommendation,
  EnhancedWarningFormData
} from '@/services/WarningService';

// Import PDF service and preview modal
import { PDFPreviewModal } from '../PDFPreviewModal';
import { QRCodeDownloadModal } from '../../modals/QRCodeDownloadModal';

// Import types
import type { UseAudioRecordingReturn } from '../../../../hooks/warnings/useAudioRecording';

// ============================================
// INTERFACES
// ============================================

interface DeliveryCompletionStepProps {
  selectedEmployee: any;
  selectedCategory: any;
  formData: any;
  lraRecommendation: any;
  signatures: any;
  organizationName: string;
  currentManagerName: string;
  audioRecording?: UseAudioRecordingReturn;
  onComplete: () => void;
  onWarningCreated?: (warningId: string) => void;
  warningId?: string; // The warning ID created in step 2
  onFinalizeReady?: (data: { canFinalize: boolean; finalizeHandler: () => void }) => void; // Pass finalize state and handler
}

interface DeliveryOption {
  id: 'email' | 'whatsapp' | 'printed';
  name: string;
  icon: typeof Mail;
  description: string;
  available: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format warning level from system code to display name
 */
const formatWarningLevel = (level: string | undefined): string => {
  if (!level) return 'Counselling Session';

  const levelMap: Record<string, string> = {
    'counselling': 'Counselling Session',
    'verbal': 'Verbal Warning',
    'first_written': 'First Written Warning',
    'second_written': 'Second Written Warning',
    'final_written': 'Final Written Warning'
  };

  return levelMap[level] || level;
};

// ============================================
// COMPONENT
// ============================================

export const DeliveryCompletionStep: React.FC<DeliveryCompletionStepProps> = ({
  selectedEmployee,
  selectedCategory,
  formData,
  lraRecommendation,
  signatures,
  organizationName,
  currentManagerName,
  audioRecording,
  onComplete,
  onWarningCreated,
  warningId,
  onFinalizeReady
}) => {

  // ============================================
  // HOOKS
  // ============================================

  const { user } = useAuth();
  const { organization } = useOrganization();

  // DEBUG: Log employee data
  useEffect(() => {
    Logger.debug('🔍 DeliveryCompletionStep - Props:', {
      selectedEmployee,
      selectedCategory,
      employeeName: selectedEmployee ? `${selectedEmployee.profile?.firstName} ${selectedEmployee.profile?.lastName}` : 'NONE',
      categoryName: selectedCategory?.name || 'NONE',
      formDataEmployeeId: formData?.employeeId,
      formDataCategoryId: formData?.categoryId
    });
  }, [selectedEmployee, selectedCategory, formData]);

  // ============================================
  // STATE
  // ============================================
  
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'email' | 'whatsapp' | 'printed'>('email');
  
  // PDF Preview Modal State
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // QR Code Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPdfBlob, setQrPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Warning creation state
  const [isCreatingWarning, setIsCreatingWarning] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [warningCreated, setWarningCreated] = useState(false);
  const [createdWarningId, setCreatedWarningId] = useState<string | null>(null);
  
  // Delivery notification state
  const [isCreatingDeliveryNotification, setIsCreatingDeliveryNotification] = useState(false);
  const [deliveryNotificationId, setDeliveryNotificationId] = useState<string | null>(null);
  const [showDeliveryInstructions, setShowDeliveryInstructions] = useState(false);

  // ============================================
  // DELIVERY OPTIONS
  // ============================================
  
  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      description: 'Receive warning document via email',
      available: !!selectedEmployee?.email
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      description: 'Receive warning document via WhatsApp',
      available: !!selectedEmployee?.phone
    },
    {
      id: 'printed',
      name: 'Printed Copy',
      icon: Printer,
      description: 'Receive a printed physical copy',
      available: true
    }
  ];

  // ============================================
  // PDF GENERATION - Handled by PDFPreviewModal
  // ============================================

  // ============================================
  // PDF PREVIEW HANDLERS
  // ============================================

  const handlePreviewPDF = useCallback(async () => {
    try {
      Logger.debug('🔄 Opening PDF preview modal...')

      // Let PDFPreviewModal handle PDF generation - no duplicate generation
      setShowPDFPreview(true);
    } catch (error) {
      Logger.error('❌ Error opening PDF preview:', error)
      setAudioUploadError('Failed to generate PDF preview');
    }
  }, []);

  // ============================================
  // QR CODE GENERATION HANDLER
  // ============================================

  const handleQRDownload = useCallback(async () => {
    if (!selectedEmployee || !selectedCategory || !organization) {
      setAudioUploadError('Missing required data for QR code generation');
      return;
    }

    setIsGeneratingQR(true);

    try {
      // Transform data for PDF using the unified transformer
      const { transformWarningDataForPDF } = await import('../../../../utils/pdfDataTransformer');

      const warningDataStructure = {
        id: formData.id || formData.warningId || warningId || `WRN_${Date.now()}`,
        organizationId: organization.id,
        level: formData.level || lraRecommendation?.suggestedLevel || 'counselling',
        category: selectedCategory?.name || formData.category || 'General Misconduct',
        description: formData.incidentDescription || formData.description || '',
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime || '09:00',
        incidentLocation: formData.incidentLocation || '',
        issueDate: formData.issueDate || formData.issuedDate,
        validityPeriod: formData.validityPeriod || 6,
        signatures: signatures,
        additionalNotes: formData.additionalNotes || '',
        status: formData.status,
        disciplineRecommendation: lraRecommendation,
        legalCompliance: {
          isCompliant: true,
          framework: 'LRA Section 188',
          requirements: lraRecommendation?.legalRequirements || []
        }
      };

      const pdfData = transformWarningDataForPDF(
        warningDataStructure,
        selectedEmployee,
        organization
      );

      const { PDFGenerationService } = await import('@/services/PDFGenerationService');

      // 🔒 VERSIONING: Pass version for new warning QR code generation
      // 🎨 TEMPLATE SETTINGS: Pass stored template settings for consistent styling
      const qrBlob = await PDFGenerationService.generateWarningPDF(
        pdfData,
        pdfData.pdfGeneratorVersion,
        pdfData.pdfSettings
      );

      setQrPdfBlob(qrBlob);
      setShowQRModal(true);

      Logger.success('✅ QR PDF generated successfully');

    } catch (error) {
      Logger.error('❌ QR PDF generation failed:', error)
      setAudioUploadError(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingQR(false);
    }
  }, [selectedEmployee, selectedCategory, organization, formData, lraRecommendation, signatures, warningId]);

  // ============================================
  // 🔥 ENHANCED WARNING CREATION WITH AUDIO URL FIX
  // ============================================

const handleCreateHRNotification = useCallback(async (blob?: Blob, filename?: string) => {
  if (!selectedEmployee || !organization || !user || !warningId) {
    setAudioUploadError('Missing required data for HR notification');
    return;
  }

  try {
    setIsCreatingWarning(true);
    setAudioUploadError(null);

    Logger.debug('📬 Creating HR delivery notification for warning:', warningId)
    
    // 🔔 Create delivery notification for HR
    try {
      setIsCreatingDeliveryNotification(true);
      Logger.debug('📬 Creating delivery notification for HR...')
      
      const deliveryNotificationId = await DeliveryNotificationService.createDeliveryNotification({
        warningId,
        organizationId: organization.id,

        // Employee details - using nested profile structure with fallbacks
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.profile?.firstName || selectedEmployee.firstName || 'Unknown'} ${selectedEmployee.profile?.lastName || selectedEmployee.lastName || 'Employee'}`,
        employeeEmail: selectedEmployee.profile?.email || selectedEmployee.email || '',
        employeePhone: selectedEmployee.profile?.phoneNumber || selectedEmployee.phone || '',
        
        // Warning details
        warningLevel: lraRecommendation?.suggestedLevel || formData.level || 'counselling',
        warningCategory: lraRecommendation?.category || formData.category || 'General',
        incidentDate: formData.incidentDate,
        
        // Delivery details - save as employee's requested method
        employeeRequestedDeliveryMethod: selectedDeliveryMethod,
        
        // Creator details
        createdBy: user.id,
        createdByName: currentManagerName
      });
      
      setDeliveryNotificationId(deliveryNotificationId);
      Logger.success(9578)
      
      // Mark as completed
      setWarningCreated(true);
      
    } catch (deliveryError: any) {
      Logger.error('❌ Failed to create delivery notification:', deliveryError)
      setAudioUploadError(deliveryError.message || 'Failed to notify HR about delivery');
    } finally {
      setIsCreatingDeliveryNotification(false);
    }

    Logger.success(10016)

  } catch (error: any) {
    Logger.error('❌ Error creating HR notification:', error)
    setAudioUploadError(error.message || 'Failed to create HR notification');
  } finally {
    setIsCreatingWarning(false);
  }
}, [
  selectedEmployee, organization, user, warningId, selectedDeliveryMethod,
  lraRecommendation, formData, currentManagerName
]);

  const handleCreateWarning = useCallback(async () => {
    // Simplified method - only handles HR notification now
    return handleCreateHRNotification();
  }, [handleCreateHRNotification]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const canCompleteDelivery = useMemo(() => {
    return !!(
      warningId &&
      selectedDeliveryMethod &&
      !isCreatingWarning &&
      !deliveryNotificationId // Only allow if notification hasn't been sent yet
    );
  }, [warningId, selectedDeliveryMethod, isCreatingWarning, deliveryNotificationId]);

  const selectedOption = deliveryOptions.find(opt => opt.id === selectedDeliveryMethod);

  // ============================================
  // EXPOSE FINALIZATION STATE TO PARENT
  // ============================================

  // Notify parent with finalize state and handler
  useEffect(() => {
    onFinalizeReady?.({
      canFinalize: canCompleteDelivery,
      finalizeHandler: handleCreateWarning
    });
  }, [canCompleteDelivery, handleCreateWarning, onFinalizeReady]);

  // Auto-close wizard after successful warning creation
  useEffect(() => {
    if (warningCreated && deliveryNotificationId) {
      // Wait 2 seconds to show success message, then close
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [warningCreated, deliveryNotificationId, onComplete]);

  // ============================================
  // RENDER
  // ============================================

  if (warningCreated) {
    return (
      <ThemedCard padding="xl" className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ backgroundColor: 'var(--color-success-light)' }}>
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'var(--color-success)' }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Warning Issued Successfully!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Warning {createdWarningId ? `#${createdWarningId.slice(-8)}` : ''} has been created.
          </p>
          <p className="font-medium mt-2" style={{ color: 'var(--color-primary)' }}>
            📬 HR has been notified to deliver via {selectedDeliveryMethod}
          </p>
          
          {audioRecording?.audioUrl && !audioUploadError && (
            <ThemedAlert variant="success" className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Mic className="w-4 h-4" />
                <span className="text-sm font-medium">Audio recording saved successfully</span>
              </div>
            </ThemedAlert>
          )}

          {/* HR Notification Status - Themed */}
          {deliveryNotificationId && (
            <ThemedAlert variant="info" className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">HR Team Notified</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Delivery notification #{deliveryNotificationId.slice(-8)} created for HR team
              </p>
            </ThemedAlert>
          )}
          
          {/* Delivery Instructions Button - Themed */}
          <div className="mt-6">
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={() => setShowDeliveryInstructions(!showDeliveryInstructions)}
              className="text-sm font-medium underline min-h-[40px]" // Mobile touch target
            >
              {showDeliveryInstructions ? 'Hide' : 'View'} Delivery Instructions for HR
            </ThemedButton>
          </div>
          
          {/* Delivery Instructions */}
          {showDeliveryInstructions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).title}
              </h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Steps to Follow:</h5>
                  <ol className="text-sm list-decimal list-inside space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Requirements:</h5>
                  <ul className="text-sm list-disc list-inside space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Documentation Needed:</h5>
                  <ul className="text-sm list-disc list-inside space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).documentation.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {audioUploadError && (
            <div className="mt-4 p-3 rounded-lg border" style={{
              backgroundColor: 'var(--color-alert-warning-bg)',
              borderColor: 'var(--color-alert-warning-border)'
            }}>
              <div className="flex items-center justify-center gap-2" style={{ color: 'var(--color-alert-warning-text)' }}>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Warning created, but audio upload had issues</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-alert-warning-text)' }}>{audioUploadError}</p>
            </div>
          )}
        </div>
      </ThemedCard>
    );
  }

  return (
    <div className="space-y-3">
      {/* Success Banner - Warning Already Saved */}
      <ThemedCard padding="md" className="border-l-4" style={{ borderLeftColor: 'var(--color-success)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-success)' }}>
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>Warning Successfully Recorded</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Warning #{warningId?.slice(-8)} • Signatures captured • Audio uploaded
            </p>
          </div>
        </div>
      </ThemedCard>

      {/* Simplified Header - No Workflow Guide */}
      <ThemedCard padding="md" className="border-l-4" style={{ borderLeftColor: 'var(--color-success)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          <div className="flex-1">
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Ready to Hand Off to HR
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Choose delivery method and notify your HR team
            </p>
          </div>
        </div>
      </ThemedCard>

      {/* Warning Summary - Employee & Level */}
      <ThemedCard padding="sm" className="border-l-4" style={{ borderLeftColor: 'var(--color-success)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Employee</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {selectedEmployee?.profile?.firstName} {selectedEmployee?.profile?.lastName}
              </p>
            </div>
          </div>
          <ThemedBadge variant="success" size="sm" className="font-semibold">
            {formatWarningLevel(formData.level) || 'Counselling Session'}
          </ThemedBadge>
        </div>
      </ThemedCard>

      {/* Delivery Method - Employee Preference */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          How would the employee like to receive this warning?
        </h3>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Ask the employee their preference. HR can adjust this later if needed.
        </p>

        {/* Compact Delivery Options */}
        <div className="grid grid-cols-1 gap-2">
          {deliveryOptions.map((option) => {
            const Icon = option.icon;
            return (
              <ThemedCard
                key={option.id}
                padding="sm"
                hover={option.available}
                className={`cursor-pointer transition-all border-l-4 ${
                  !option.available ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  borderLeftColor: selectedDeliveryMethod === option.id ? 'var(--color-primary)' : 'transparent',
                  backgroundColor: selectedDeliveryMethod === option.id ? 'var(--color-alert-info-bg)' : 'transparent'
                }}
                onClick={() => option.available && setSelectedDeliveryMethod(option.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                        {option.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {option.description}
                      </p>
                      {!option.available && option.id === 'whatsapp' && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-error)' }}>No phone number available</p>
                      )}
                    </div>
                  </div>

                  {selectedDeliveryMethod === option.id && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Selected</span>
                    </div>
                  )}

                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={option.id}
                    checked={selectedDeliveryMethod === option.id}
                    onChange={() => {}} // Handled by card click
                    disabled={!option.available}
                    className="sr-only"
                  />
                </div>
              </ThemedCard>
            );
          })}

          {/* QR Code Action - Styled like delivery options */}
          <ThemedCard
            padding="sm"
            hover={true}
            className="cursor-pointer transition-all border-l-4"
            style={{
              borderLeftColor: 'transparent'
            }}
            onClick={handleQRDownload}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                    QR Code
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Download warning with QR code
                  </p>
                </div>
              </div>

              {isGeneratingQR && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
              )}
            </div>
          </ThemedCard>
        </div>
      </div>

      {/* Secondary Actions - Preview (Optional) */}
      {!deliveryNotificationId && (
        <div className="space-y-3">
          <button
            onClick={handlePreviewPDF}
            className="w-full py-3 px-4 rounded-lg border transition-all hover:shadow-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-card-background)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Preview</span>
            </div>
          </button>

          {/* What Happens Next Info */}
          <div className="text-xs text-center px-4" style={{ color: 'var(--color-text-secondary)' }}>
            Your HR team will handle delivery and proof of receipt
          </div>
        </div>
      )}

      {/* Status and Errors - Simplified */}
      {audioUploadError && (
        <ThemedAlert variant="error">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-error)' }} />
              <div>
                <span className="text-sm font-medium">Error</span>
                <p className="text-xs mt-1">{audioUploadError}</p>
              </div>
            </div>
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setAudioUploadError(null);
                handleCreateWarning();
              }}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </ThemedButton>
          </div>
        </ThemedAlert>
      )}

      {isUploadingAudio && (
        <ThemedAlert variant="info">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Uploading audio...</span>
          </div>
        </ThemedAlert>
      )}

      {isCreatingDeliveryNotification && (
        <ThemedAlert variant="info">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Notifying HR...</span>
          </div>
        </ThemedAlert>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          warningData={{
            selectedEmployee: selectedEmployee,
            selectedCategory: selectedCategory,
            formData: formData,
            lraRecommendation: lraRecommendation,
            signatures: signatures,
            deliveryChoice: {
              method: selectedDeliveryMethod,
              timestamp: new Date(),
              chosenBy: currentManagerName
            },
            organizationName: organizationName,
            currentManagerName: currentManagerName,
            employee: selectedEmployee,
            organization: organization
          }}
          onPDFGenerated={(blob, filename) => {
            Logger.debug('PDF generated for preview:', filename)
            // Don't trigger HR notification on preview - user needs to explicitly click "Notify HR"
          }}
          isCompleted={false}
        />
      )}

      {/* QR Code Modal */}
      {qrPdfBlob && (
        <QRCodeDownloadModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setQrPdfBlob(null);
          }}
          pdfBlob={qrPdfBlob}
          filename={`Warning_QR_${selectedEmployee?.profile?.firstName}_${selectedEmployee?.profile?.lastName}_${new Date().toISOString().split('T')[0]}.pdf`}
          employeeId={selectedEmployee?.id}
          warningId={warningId || formData.id || formData.warningId}
          organizationId={organization?.id}
          employeeName={
            selectedEmployee &&
            `${selectedEmployee.profile?.firstName || selectedEmployee.firstName || ''} ${selectedEmployee.profile?.lastName || selectedEmployee.lastName || ''}`.trim()
          }
          onLinkGenerated={(linkData) => {
            Logger.debug('🔗 QR download link generated:', linkData)
          }}
        />
      )}
    </div>
  );
};