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
  Check
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
import { PDFGenerationService } from '@/services/PDFGenerationService';
import { PDFPreviewModal } from '../PDFPreviewModal';

// Import types
import type { UseAudioRecordingReturn } from '../../../../hooks/warnings/useAudioRecording';

// ============================================
// INTERFACES
// ============================================

interface DeliveryCompletionStepProps {
  selectedEmployee: any;
  formData: any;
  lraRecommendation: any;
  signatures: any;
  organizationName: string;
  currentManagerName: string;
  audioRecording?: UseAudioRecordingReturn;
  onComplete: () => void;
  onWarningCreated?: (warningId: string) => void;
  warningId?: string; // The warning ID created in step 2
}

interface DeliveryOption {
  id: 'email' | 'whatsapp' | 'printed';
  name: string;
  icon: typeof Mail;
  description: string;
  available: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const DeliveryCompletionStep: React.FC<DeliveryCompletionStepProps> = ({
  selectedEmployee,
  formData,
  lraRecommendation,
  signatures,
  organizationName,
  currentManagerName,
  audioRecording,
  onComplete,
  onWarningCreated,
  warningId
}) => {

  // ============================================
  // HOOKS
  // ============================================
  
  const { user } = useAuth();
  const { organization } = useOrganization();

  // ============================================
  // STATE
  // ============================================
  
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'email' | 'whatsapp' | 'printed'>('email');
  
  // PDF Preview Modal State
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  
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
      name: 'Email Delivery',
      icon: Mail,
      description: 'HR will deliver via email with read receipt tracking',
      available: !!selectedEmployee?.email
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: MessageSquare,
      description: 'HR will deliver via WhatsApp Business with confirmation',
      available: !!selectedEmployee?.phone
    },
    {
      id: 'printed',
      name: 'Print & Hand Deliver',
      icon: Printer,
      description: 'HR will print and hand deliver with signed receipt',
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
        
        // Employee details
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        employeeEmail: selectedEmployee.email,
        employeePhone: selectedEmployee.phone,
        
        // Warning details
        warningLevel: lraRecommendation?.suggestedLevel || formData.level || 'counselling',
        warningCategory: lraRecommendation?.category || formData.category || 'General',
        incidentDate: formData.incidentDate,
        
        // Delivery details
        deliveryMethod: selectedDeliveryMethod,
        isEmployeePreference: selectedEmployee?.deliveryPreference === selectedDeliveryMethod,
        
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
    <div className="space-y-4">
      {/* Header - Simplified */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Delivery & Completion</h2>
      </div>

      {/* Step 1 Style Warning Summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>Warning Summary</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Employee: {selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
          </div>
        </div>

        {/* Compact Summary Card - Step 1 Style */}
        <ThemedCard padding="sm" hover className="border-l-4" style={{ borderLeftColor: 'var(--color-success)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThemedBadge variant="success" size="sm" className="font-semibold">
                {lraRecommendation?.recommendedLevel || 'Counselling Session'}
              </ThemedBadge>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></div>
                <span className="font-medium" style={{ color: 'var(--color-success)' }}>#{warningId?.slice(-8)} created</span>
                {audioRecording?.audioUrl && <span>• Audio included</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>Ready</span>
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Delivery Method - Step 1 Style Compact */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>Delivery Method</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Choose how HR will deliver this warning</p>
          </div>
        </div>

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
        </div>
      </div>

      {/* Final Review - Step 1 Style Compact */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>Final Review</h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Preview document and complete delivery process</p>
          </div>
        </div>

        {/* Compact Action Cards */}
        <div className="grid grid-cols-1 gap-2">
          {/* Preview Button */}
          <ThemedCard
            padding="sm"
            hover
            className="cursor-pointer border-l-4"
            style={{ borderLeftColor: 'var(--color-secondary)' }}
            onClick={handlePreviewPDF}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>Preview Document</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Review warning before sending to HR</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
          </ThemedCard>

          {/* Notify HR Button */}
          <ThemedCard
            padding="sm"
            hover={!isCreatingWarning && canCompleteDelivery}
            className={`transition-all border-l-4 ${
              canCompleteDelivery && !deliveryNotificationId ? 'cursor-pointer' : ''
            } ${!canCompleteDelivery && !deliveryNotificationId ? 'opacity-50' : ''}`}
            style={{
              borderLeftColor: deliveryNotificationId
                ? 'var(--color-success)'
                : canCompleteDelivery
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
              backgroundColor: deliveryNotificationId ? 'var(--color-alert-success-bg)' : 'transparent'
            }}
            onClick={!isCreatingWarning && canCompleteDelivery ? handleCreateWarning : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCreatingWarning ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
                ) : deliveryNotificationId ? (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                ) : (
                  <Send className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                )}
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                    {isCreatingWarning ? 'Notifying HR...' :
                     deliveryNotificationId ? 'HR Notified' :
                     'Notify HR'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {deliveryNotificationId
                      ? `Delivery notification sent via ${selectedDeliveryMethod}`
                      : 'Send delivery instructions to HR team'
                    }
                  </p>
                </div>
              </div>
              {!deliveryNotificationId && canCompleteDelivery && !isCreatingWarning && (
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
              )}
            </div>
          </ThemedCard>
        </div>
      </div>

      {/* Status and Errors - Simplified */}
      {audioUploadError && (
        <ThemedAlert variant="error">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-error)' }} />
            <div>
              <span className="text-sm font-medium">Error</span>
              <p className="text-xs mt-1">{audioUploadError}</p>
            </div>
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
    </div>
  );
};