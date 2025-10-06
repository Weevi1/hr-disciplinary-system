// frontend/src/components/hr/PrintDeliveryGuide.tsx
// 🚀 PRINT DELIVERY GUIDE
// ✅ Direct print functionality with browser print dialog
// ✅ Hand delivery checklist and progress tracking
// ✅ PDF generation and filing instructions

import React, { useState, useCallback } from 'react';
import {
  Printer,
  Download,
  CheckCircle,
  User,
  FileText,
  Clock,
  Check,
  Loader2,
  Eye,
  MapPin,
  Signature,
  FolderOpen,
  AlertTriangle,
  Calendar,
  Building
} from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';

// Import PDF preview modal
import { PDFPreviewModal } from '../warnings/enhanced/PDFPreviewModal';
import Logger from '../../utils/logger';

// ============================================
// INTERFACES
// ============================================

interface PrintDeliveryGuideProps {
  notification: {
    id: string;
    warningId: string;
    employeeName: string;
    warningLevel: string;
    warningCategory: string;
    pdfUrl?: string;
    createdByName: string;
    createdAt: Date;
  };
  currentStep: number;
  onStepComplete: (stepIndex: number) => void;
  onDeliveryComplete: (proofData: any) => void;
  isProcessing: boolean;
}

interface DeliveryChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  description: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PrintDeliveryGuide: React.FC<PrintDeliveryGuideProps> = ({
  notification,
  currentStep,
  onStepComplete,
  onDeliveryComplete,
  isProcessing
}) => {
  const [printed, setPrinted] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [deliveryChecklist, setDeliveryChecklist] = useState<DeliveryChecklistItem[]>([
    {
      id: 'hand_delivered',
      label: 'Hand delivered to employee',
      completed: false,
      required: true,
      description: 'Personally delivered the printed warning to the employee'
    },
    {
      id: 'employee_present',
      label: 'Employee was present during delivery',
      completed: false,
      required: true,
      description: 'Confirmed employee identity and presence during delivery'
    },
    {
      id: 'signature_obtained',
      label: 'Employee signature obtained',
      completed: false,
      required: true,
      description: 'Employee signed acknowledgment of receipt on physical document'
    },
    {
      id: 'copy_filed',
      label: 'Signed copy filed in employee records',
      completed: false,
      required: true,
      description: 'Filed the signed physical copy in the employee\'s personnel file'
    }
  ]);

  const [filingChecklist, setFilingChecklist] = useState<DeliveryChecklistItem[]>([
    {
      id: 'original_filed',
      label: 'Original signed document filed',
      completed: false,
      required: true,
      description: 'Original signed warning document placed in employee\'s personnel file'
    },
    {
      id: 'copy_retained',
      label: 'Copy retained by HR',
      completed: false,
      required: true,
      description: 'Photocopy of signed document retained in HR files'
    },
    {
      id: 'system_updated',
      label: 'Digital system updated',
      completed: false,
      required: true,
      description: 'Employee record system updated to reflect warning delivery'
    }
  ]);

  const [deliveryDetails, setDeliveryDetails] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    deliveryLocation: '',
    witnessName: '',
    additionalNotes: ''
  });

  // Handle PDF preview and print
  const openPDFPreview = () => {
    setShowPDFPreview(true);
  };

  const handlePrint = () => {
    setPrinted(true);
  };

  // Direct print function
  const printDocument = useCallback(() => {
    // This would typically trigger the PDF generation and print dialog
    if (notification.pdfUrl) {
      // Open PDF in new window and trigger print
      const printWindow = window.open(notification.pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setPrinted(true);
        };
      }
    } else {
      // Fallback: Show PDF preview modal for printing
      setShowPDFPreview(true);
    }
  }, [notification.pdfUrl]);

  // Handle checklist item toggle
  const toggleChecklistItem = (checklistType: 'delivery' | 'filing', itemId: string) => {
    if (checklistType === 'delivery') {
      setDeliveryChecklist(prev => prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ));
    } else {
      setFilingChecklist(prev => prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ));
    }
  };

  // Check if all required items are completed
  const allDeliveryItemsCompleted = deliveryChecklist.filter(item => item.required).every(item => item.completed);
  const allFilingItemsCompleted = filingChecklist.filter(item => item.required).every(item => item.completed);

  // Complete step 1 (print)
  const completePrint = () => {
    if (printed) {
      onStepComplete(0);
    }
  };

  // Complete step 2 (hand delivery)
  const completeDelivery = () => {
    if (allDeliveryItemsCompleted) {
      onStepComplete(1);
    }
  };

  // Complete final step (filing)
  const completeProcess = async () => {
    if (!allFilingItemsCompleted) return;

    try {
      await onDeliveryComplete({
        warningId: notification.warningId,
        deliveryMethod: 'printed',
        deliveredAt: new Date(`${deliveryDetails.deliveryDate}T${deliveryDetails.deliveryTime}`),
        deliveryLocation: deliveryDetails.deliveryLocation,
        witnessName: deliveryDetails.witnessName,
        additionalNotes: deliveryDetails.additionalNotes,
        deliveryChecklist,
        filingChecklist
      });
    } catch (err) {
      Logger.error('Failed to complete delivery:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Print Document */}
      {currentStep === 0 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Printer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 1: Print Warning Document
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Print the official warning document for hand delivery
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ThemedAlert variant="info">
              <div className="text-sm">
                <strong>Printing Requirements:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Print on official company letterhead if available</li>
                  <li>Use high-quality paper (minimum 80gsm)</li>
                  <li>Ensure all text is clearly legible</li>
                  <li>Print multiple copies (original + HR copy)</li>
                </ul>
              </div>
            </ThemedAlert>

            {/* Document Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Employee:</span>
                <span>{notification.employeeName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Warning Type:</span>
                <span>{notification.warningLevel}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Issue Date:</span>
                <span>{notification.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Print Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <ThemedButton
                  variant="secondary"
                  onClick={openPDFPreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Document
                </ThemedButton>

                <ThemedButton
                  variant="primary"
                  onClick={printDocument}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Document
                </ThemedButton>
              </div>

              {printed && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Document printed successfully</span>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <ThemedButton
              variant="primary"
              onClick={completePrint}
              disabled={!printed}
              className="w-full"
            >
              {printed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Continue to Hand Delivery
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Print document to continue
                </>
              )}
            </ThemedButton>
          </div>
        </ThemedCard>
      )}

      {/* Step 2: Hand Delivery */}
      {currentStep === 1 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 2: Hand Delivery to Employee
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Deliver the printed document and obtain employee acknowledgment
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Delivery Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDetails.deliveryDate}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={deliveryDetails.deliveryTime}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Employee's office, HR meeting room"
                  value={deliveryDetails.deliveryLocation}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Name of witness present during delivery"
                  value={deliveryDetails.witnessName}
                  onChange={(e) => setDeliveryDetails(prev => ({ ...prev, witnessName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Delivery Checklist */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Delivery Checklist
              </h4>
              <div className="space-y-3">
                {deliveryChecklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem('delivery', item.id)}
                      className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${item.completed ? 'text-green-600' : 'text-gray-900'}`}>
                        {item.label}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                    {item.completed && <CheckCircle className="w-5 h-5 text-green-600 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={3}
                placeholder="Any additional notes about the delivery process..."
                value={deliveryDetails.additionalNotes}
                onChange={(e) => setDeliveryDetails(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Continue Button */}
            <ThemedButton
              variant="primary"
              onClick={completeDelivery}
              disabled={!allDeliveryItemsCompleted}
              className="w-full"
            >
              {allDeliveryItemsCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Continue to Filing
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Complete all required items above
                </>
              )}
            </ThemedButton>
          </div>
        </ThemedCard>
      )}

      {/* Step 3: File Documentation */}
      {currentStep === 2 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 3: File Documentation
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                File the signed documents and complete the delivery process
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ThemedAlert variant="warning">
              <div className="text-sm">
                <strong>Important:</strong> Proper filing is crucial for legal compliance and audit purposes.
                Ensure all documents are filed in the correct employee personnel file.
              </div>
            </ThemedAlert>

            {/* Filing Checklist */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                Filing Checklist
              </h4>
              <div className="space-y-3">
                {filingChecklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem('filing', item.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className={`font-medium ${item.completed ? 'text-blue-600' : 'text-gray-900'}`}>
                        {item.label}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                    {item.completed && <CheckCircle className="w-5 h-5 text-blue-600 mt-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">Delivery Summary</h5>
              <div className="space-y-1 text-sm text-blue-800">
                <div><strong>Employee:</strong> {notification.employeeName}</div>
                <div><strong>Warning Type:</strong> {notification.warningLevel}</div>
                <div><strong>Delivery Date:</strong> {deliveryDetails.deliveryDate} at {deliveryDetails.deliveryTime}</div>
                <div><strong>Location:</strong> {deliveryDetails.deliveryLocation || 'Not specified'}</div>
                {deliveryDetails.witnessName && (
                  <div><strong>Witness:</strong> {deliveryDetails.witnessName}</div>
                )}
              </div>
            </div>

            {/* Complete Process Button */}
            <ThemedButton
              variant="success"
              onClick={completeProcess}
              disabled={!allFilingItemsCompleted || isProcessing}
              size="lg"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing Process...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Print Delivery Process
                </>
              )}
            </ThemedButton>
          </div>
        </ThemedCard>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          warningData={{
            employee: {
              firstName: notification.employeeName.split(' ')[0] || notification.employeeName,
              lastName: notification.employeeName.split(' ').slice(1).join(' ') || '',
              employeeNumber: 'EMP001', // This should come from notification data
              department: 'N/A' // This should come from notification data
            },
            category: notification.warningCategory,
            level: notification.warningLevel,
            description: 'Warning document details',
            incidentDate: new Date(),
            issueDate: new Date()
          }}
          onDownload={handlePrint}
          showPrintButton={true}
        />
      )}
    </div>
  );
};

export default PrintDeliveryGuide;