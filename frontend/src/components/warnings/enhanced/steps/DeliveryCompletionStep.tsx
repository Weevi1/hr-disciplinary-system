import Logger from '../../../../utils/logger';
// frontend/src/components/warnings/enhanced/steps/DeliveryCompletionStep.tsx
// 🏆 COMPLETE DELIVERY COMPLETION STEP WITH AUDIO URL FIX
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
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Warning Issued Successfully!</h2>
          <p className="text-gray-600">
            Warning {createdWarningId ? `#${createdWarningId.slice(-8)}` : ''} has been created.
          </p>
          <p className="text-blue-600 font-medium mt-2">
            📬 HR has been notified to deliver via {selectedDeliveryMethod}
          </p>
          
          {audioRecording?.audioUrl && !audioUploadError && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Mic className="w-4 h-4" />
                <span className="text-sm font-medium">Audio recording saved successfully</span>
              </div>
            </div>
          )}
          
          {/* HR Notification Status */}
          {deliveryNotificationId && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">HR Team Notified</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Delivery notification #{deliveryNotificationId.slice(-8)} created for HR team
              </p>
            </div>
          )}
          
          {/* Delivery Instructions Button */}
          <div className="mt-6">
            <button
              onClick={() => setShowDeliveryInstructions(!showDeliveryInstructions)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
            >
              {showDeliveryInstructions ? 'Hide' : 'View'} Delivery Instructions for HR
            </button>
          </div>
          
          {/* Delivery Instructions */}
          {showDeliveryInstructions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">
                {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).title}
              </h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Steps to Follow:</h5>
                  <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                    {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Requirements:</h5>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Documentation Needed:</h5>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    {DeliveryInstructionsService.getDeliveryInstructions(selectedDeliveryMethod).documentation.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {audioUploadError && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-2 text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Warning created, but audio upload had issues</span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">{audioUploadError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notify HR for Delivery</h2>
        <p className="text-gray-600">
          Choose delivery method and notify HR team to deliver the warning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Delivery Options */}
        <div className="lg:col-span-2">
          
          {/* Warning Summary */}
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Warning Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-medium text-gray-900">
                  {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Warning Level</p>
                <p className="font-medium text-gray-900">
                  {lraRecommendation?.recommendedLevel || 'Counselling Session'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium text-gray-900">
                  {lraRecommendation?.category || formData.categoryId}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="font-medium text-gray-900">
                  {new Date(new Date(formData.issueDate).setMonth(
                    new Date(formData.issueDate).getMonth() + formData.validityPeriod
                  )).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Warning Status - Already Completed in Step 2 */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Warning #{warningId?.slice(-8)} created successfully
                </span>
              </div>
              {audioRecording?.audioUrl && (
                <p className="text-xs text-green-600 mt-1">
                  Audio recording and signatures saved
                </p>
              )}
            </div>
          </div>

          {/* Delivery Method Selection */}
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Choose Delivery Method
            </h3>
            
            <div className="space-y-3">
              {deliveryOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDeliveryMethod === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : option.available
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={option.id}
                      checked={selectedDeliveryMethod === option.id}
                      onChange={(e) => setSelectedDeliveryMethod(e.target.value as 'email' | 'whatsapp' | 'printed')}
                      disabled={!option.available}
                      className="sr-only"
                    />
                    
                    <Icon className={`w-5 h-5 mr-3 ${
                      option.available ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        option.available ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {option.name}
                      </p>
                      <p className={`text-sm ${
                        option.available ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {option.description}
                      </p>
                      {!option.available && option.id === 'whatsapp' && (
                        <p className="text-xs text-red-600 mt-1">
                          No phone number available for this employee
                        </p>
                      )}
                    </div>
                    
                    {selectedDeliveryMethod === option.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preview and Actions */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Final Review
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePreviewPDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Warning Document
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notify HR Team</h3>
            
            {/* Status Checks */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Warning created successfully</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Audio & signatures saved</span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedDeliveryMethod ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">Delivery method selected</span>
              </div>
              
              <div className="flex items-center gap-2">
                {deliveryNotificationId ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">HR notification {deliveryNotificationId ? 'sent' : 'pending'}</span>
              </div>
            </div>

            {/* Error Display */}
            {audioUploadError && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-xs text-red-600 mt-1">{audioUploadError}</p>
              </div>
            )}

            {/* Upload Status */}
            {isUploadingAudio && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Uploading audio recording...</span>
                </div>
              </div>
            )}
            
            {/* Delivery Notification Status */}
            {isCreatingDeliveryNotification && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Notifying HR about delivery requirements...</span>
                </div>
              </div>
            )}

            {/* Complete Button */}
            <button
              onClick={handleCreateWarning}
              disabled={!canCompleteDelivery || isCreatingWarning}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                canCompleteDelivery && !isCreatingWarning
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCreatingWarning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Notifying HR...
                </>
              ) : deliveryNotificationId ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  HR Notified Successfully
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Notify HR for Delivery
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              {deliveryNotificationId 
                ? 'HR has been notified to deliver this warning'
                : `This will notify HR to deliver via ${selectedOption?.name}`
              }
            </p>
          </div>
        </div>
      </div>

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