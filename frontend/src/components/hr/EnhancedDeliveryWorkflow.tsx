// frontend/src/components/hr/EnhancedDeliveryWorkflow.tsx
// 🚀 ENHANCED HR DELIVERY WORKFLOW
// ✅ Guided step-by-step delivery process for WhatsApp, Email, and Print
// ✅ One-click actions with pre-filled templates and scripts
// ✅ Progress tracking and status updates

import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Printer,
  Copy,
  ExternalLink,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  Shield,
  X,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';

// Import delivery guides
import { WhatsAppDeliveryGuide } from './WhatsAppDeliveryGuide';
import { EmailDeliveryGuide } from './EmailDeliveryGuide';
import { PrintDeliveryGuide } from './PrintDeliveryGuide';

// ============================================
// INTERFACES
// ============================================

interface DeliveryNotification {
  id: string;
  warningId: string;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;
  warningLevel: string;
  warningCategory: string;
  deliveryMethod: 'email' | 'whatsapp' | 'printed';
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  createdAt: Date;
  createdByName: string;
  pdfUrl?: string;
  contactDetails: {
    email?: string;
    phone?: string;
  };
}

interface DeliveryStep {
  id: string;
  label: string;
  completed: boolean;
  inProgress: boolean;
  description: string;
}

interface EnhancedDeliveryWorkflowProps {
  notification: DeliveryNotification;
  onDeliveryComplete: (notificationId: string, proofData: any) => void;
  onClose: () => void;
  isOpen: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const EnhancedDeliveryWorkflow: React.FC<EnhancedDeliveryWorkflowProps> = ({
  notification,
  onDeliveryComplete,
  onClose,
  isOpen
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [deliverySteps, setDeliverySteps] = useState<DeliveryStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize delivery steps based on method
  useEffect(() => {
    const initializeSteps = () => {
      switch (notification.deliveryMethod) {
        case 'whatsapp':
          return [
            { id: 'prepare', label: 'Prepare Message', completed: false, inProgress: true, description: 'Copy pre-written script and download PDF' },
            { id: 'send', label: 'Send via WhatsApp', completed: false, inProgress: false, description: 'Open WhatsApp and send message with attachment' },
            { id: 'confirm', label: 'Confirm Delivery', completed: false, inProgress: false, description: 'Upload screenshot proof and complete delivery' }
          ];
        case 'email':
          return [
            { id: 'prepare', label: 'Prepare Email', completed: false, inProgress: true, description: 'Copy email template and download PDF attachment' },
            { id: 'send', label: 'Send Email', completed: false, inProgress: false, description: 'Open email client and send message' },
            { id: 'confirm', label: 'Confirm Delivery', completed: false, inProgress: false, description: 'Upload screenshot proof and complete delivery' }
          ];
        case 'printed':
          return [
            { id: 'print', label: 'Print Document', completed: false, inProgress: true, description: 'Print warning PDF document' },
            { id: 'deliver', label: 'Hand Deliver', completed: false, inProgress: false, description: 'Deliver to employee and obtain signature' },
            { id: 'file', label: 'File Documentation', completed: false, inProgress: false, description: 'File signed copy and confirm completion' }
          ];
        default:
          return [];
      }
    };

    setDeliverySteps(initializeSteps());
  }, [notification.deliveryMethod]);

  // Get delivery method configuration
  const getMethodConfig = () => {
    switch (notification.deliveryMethod) {
      case 'whatsapp':
        return {
          icon: MessageSquare,
          name: 'WhatsApp Business',
          color: 'green',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-700'
        };
      case 'email':
        return {
          icon: Mail,
          name: 'Email',
          color: 'blue',
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-700'
        };
      case 'printed':
        return {
          icon: Printer,
          name: 'Print & Hand Delivery',
          color: 'purple',
          bgClass: 'bg-purple-50 border-purple-200',
          textClass: 'text-purple-700'
        };
      default:
        return {
          icon: FileText,
          name: 'Unknown',
          color: 'gray',
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-700'
        };
    }
  };

  const methodConfig = getMethodConfig();

  // Handle step completion
  const completeStep = (stepIndex: number) => {
    setDeliverySteps(prev => prev.map((step, index) => {
      if (index === stepIndex) {
        return { ...step, completed: true, inProgress: false };
      } else if (index === stepIndex + 1) {
        return { ...step, inProgress: true };
      }
      return step;
    }));

    if (stepIndex < deliverySteps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  // Handle final delivery completion
  const handleDeliveryComplete = async (proofData: any) => {
    setIsProcessing(true);
    try {
      await onDeliveryComplete(notification.id, {
        ...proofData,
        deliveryMethod: notification.deliveryMethod,
        completedAt: new Date(),
        steps: deliverySteps
      });
      onClose();
    } catch (err) {
      setError('Failed to complete delivery. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get priority styling
  const getPriorityStyle = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b ${methodConfig.bgClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                <methodConfig.icon className={`w-6 h-6 ${methodConfig.textClass}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {methodConfig.name} Delivery
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Guided delivery workflow for {notification.employeeName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemedBadge variant={notification.priority as any} size="sm">
                {notification.priority.toUpperCase()}
              </ThemedBadge>
              <ThemedButton
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </ThemedButton>
            </div>
          </div>
        </div>

        {/* Employee Info Bar */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900">{notification.employeeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{notification.warningLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{notification.warningCategory}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {notification.createdAt.toLocaleDateString()}
            </div>
          </div>

          {/* Contact Info */}
          {(notification.contactDetails.email || notification.contactDetails.phone) && (
            <div className="mt-3 flex items-center gap-4">
              {notification.contactDetails.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{notification.contactDetails.email}</span>
                </div>
              )}
              {notification.contactDetails.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{notification.contactDetails.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            {deliverySteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${step.completed
                      ? 'bg-green-500 text-white'
                      : step.inProgress
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.inProgress ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      step.completed || step.inProgress ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-32">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < deliverySteps.length - 1 && (
                  <ArrowRight className={`w-5 h-5 mx-4 ${
                    step.completed ? 'text-green-500' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4">
            <ThemedAlert variant="error">
              {error}
            </ThemedAlert>
          </div>
        )}

        {/* Delivery Method Specific Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {notification.deliveryMethod === 'whatsapp' && (
            <WhatsAppDeliveryGuide
              notification={notification}
              currentStep={currentStep}
              onStepComplete={completeStep}
              onDeliveryComplete={handleDeliveryComplete}
              isProcessing={isProcessing}
            />
          )}

          {notification.deliveryMethod === 'email' && (
            <EmailDeliveryGuide
              notification={notification}
              currentStep={currentStep}
              onStepComplete={completeStep}
              onDeliveryComplete={handleDeliveryComplete}
              isProcessing={isProcessing}
            />
          )}

          {notification.deliveryMethod === 'printed' && (
            <PrintDeliveryGuide
              notification={notification}
              currentStep={currentStep}
              onStepComplete={completeStep}
              onDeliveryComplete={handleDeliveryComplete}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {deliverySteps.length}
          </div>
          <div className="flex items-center gap-3">
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </ThemedButton>
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDeliveryWorkflow;