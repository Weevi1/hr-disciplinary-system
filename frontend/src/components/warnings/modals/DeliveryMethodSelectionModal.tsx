// frontend/src/components/warnings/modals/DeliveryMethodSelectionModal.tsx
// 🚀 DELIVERY METHOD SELECTION MODAL - CLEAN UX
// ✅ HR selects actual delivery method after seeing employee's preference
// ✅ Clear visual hierarchy and no overlapping text
// ✅ Simple, intuitive card selection

import React, { useState } from 'react';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { useModalDialog } from '../../../hooks/useFocusTrap';
import { Z_INDEX } from '../../../constants/zIndex';
import {
  X,
  Mail,
  MessageSquare,
  Printer,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  AtSign,
  ArrowRight,
  Star
} from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../../common/ThemedCard';
import { ThemedButton } from '../../common/ThemedButton';

// ============================================
// INTERFACES
// ============================================

export interface DeliveryMethodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMethodSelected: (method: 'email' | 'whatsapp' | 'printed') => void;
  employeeRequestedMethod?: 'email' | 'whatsapp' | 'printed' | null;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;
}

interface DeliveryMethodOption {
  id: 'email' | 'whatsapp' | 'printed';
  name: string;
  icon: typeof Mail;
  description: string;
  available: boolean;
  unavailableReason?: string;
  colorClass: string;
  bgClass: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const DeliveryMethodSelectionModal: React.FC<DeliveryMethodSelectionModalProps> = ({
  isOpen,
  onClose,
  onMethodSelected,
  employeeRequestedMethod,
  employeeName,
  employeeEmail,
  employeePhone
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'whatsapp' | 'printed' | null>(null);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  // Set up focus trap and ARIA
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'delivery-method-title',
    descriptionId: 'delivery-method-description',
  });

  // Define delivery method options with availability validation
  const deliveryOptions: DeliveryMethodOption[] = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      description: 'Send PDF via email client',
      available: !!employeeEmail,
      unavailableReason: !employeeEmail ? 'No email address on file' : undefined,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      description: 'Send via WhatsApp Web',
      available: !!employeePhone,
      unavailableReason: !employeePhone ? 'No phone number on file' : undefined,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50'
    },
    {
      id: 'printed',
      name: 'Print & Deliver',
      icon: Printer,
      description: 'Print and hand deliver',
      available: true,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50'
    }
  ];

  const handleMethodSelect = (method: 'email' | 'whatsapp' | 'printed') => {
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onMethodSelected(selectedMethod);
    }
  };

  const handleCancel = () => {
    setSelectedMethod(null);
    onClose();
  };

  // Get method display name
  const getMethodName = (method: 'email' | 'whatsapp' | 'printed' | null | undefined): string => {
    if (!method) return 'Not specified';
    const names = { email: 'Email', whatsapp: 'WhatsApp', printed: 'Print & Deliver' };
    return names[method];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modalNested1 }}>
      <div
        ref={containerRef}
        {...ariaProps}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 id="delivery-method-title" className="text-2xl font-bold text-gray-900 mb-1">
                Select Delivery Method
              </h2>
              <p id="delivery-method-description" className="text-sm text-gray-600">
                Choose how to deliver the warning to <span className="font-semibold">{employeeName}</span>
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close delivery method selection modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Employee's Requested Method */}
          {employeeRequestedMethod && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      Employee's Preference
                    </h3>
                    <ThemedBadge variant="info" size="xs">
                      REQUESTED
                    </ThemedBadge>
                  </div>
                  <p className="text-sm text-gray-700">
                    The employee asked to receive this warning via{' '}
                    <span className="font-bold text-blue-700">
                      {getMethodName(employeeRequestedMethod)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    You can choose a different method if their contact details are missing or incorrect
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Employee Contact Details
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AtSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 min-w-[60px]">Email:</span>
                {employeeEmail ? (
                  <span className="font-medium text-gray-900">{employeeEmail}</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Not available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 min-w-[60px]">Phone:</span>
                {employeePhone ? (
                  <span className="font-medium text-gray-900">{employeePhone}</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Not available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Method Selection */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Choose Delivery Method
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {deliveryOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedMethod === option.id;
                const isRequested = employeeRequestedMethod === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => option.available && handleMethodSelect(option.id)}
                    disabled={!option.available}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : option.available
                          ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${option.bgClass} flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${option.available ? option.colorClass : 'text-gray-400'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold text-base ${option.available ? 'text-gray-900' : 'text-gray-500'}`}>
                            {option.name}
                          </h4>
                          {isRequested && (
                            <ThemedBadge variant="success" size="xs">
                              REQUESTED
                            </ThemedBadge>
                          )}
                        </div>
                        <p className={`text-sm ${option.available ? 'text-gray-600' : 'text-gray-500'}`}>
                          {option.description}
                        </p>
                        {!option.available && option.unavailableReason && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{option.unavailableReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-50" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> After selecting a method, you'll be guided through a step-by-step delivery process with pre-written templates.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <ThemedButton
              variant="secondary"
              onClick={handleCancel}
              size="lg"
            >
              Cancel
            </ThemedButton>
            <ThemedButton
              variant="primary"
              onClick={handleConfirm}
              disabled={!selectedMethod}
              size="lg"
              className="flex items-center gap-2"
            >
              {selectedMethod ? (
                <>
                  Proceed with {getMethodName(selectedMethod)}
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Select a method to continue'
              )}
            </ThemedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMethodSelectionModal;
