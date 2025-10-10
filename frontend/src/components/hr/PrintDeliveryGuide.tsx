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
import Logger from '../../utils/logger';
import { API } from '../../api';
import { useAuth } from '../../auth/AuthContext';

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
  const { organization } = useAuth();
  const [printed, setPrinted] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [deliveryChecklist, setDeliveryChecklist] = useState<DeliveryChecklistItem[]>([
    {
      id: 'hand_delivered',
      label: 'Hand delivered to employee',
      completed: false,
      required: true,
      description: 'Personally delivered the printed warning to the employee'
    }
  ]);

  const [filingChecklist, setFilingChecklist] = useState<DeliveryChecklistItem[]>([
    {
      id: 'delivery_complete',
      label: 'Delivery process completed',
      completed: false,
      required: true,
      description: 'Confirm warning has been delivered to employee'
    }
  ]);

  const [deliveryDetails, setDeliveryDetails] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
    deliveryLocation: '',
    witnessName: '',
    additionalNotes: ''
  });

  // Fetch full warning data and generate PDF
  const generatePDFForWarning = useCallback(async () => {
    if (!organization) {
      alert('Organization data not loaded');
      return null;
    }

    try {
      setIsGeneratingPDF(true);
      Logger.debug('📄 Fetching warning data to generate PDF:', notification.warningId);

      // Fetch warning data
      const warningData = await API.warnings.getById(notification.warningId, organization.id);

      if (!warningData) {
        throw new Error('Warning data not found');
      }

      Logger.debug('✅ Warning data fetched, fetching employee data...');

      // Fetch employee data
      const employee = await API.employees.getById(warningData.employeeId, organization.id);

      if (!employee) {
        throw new Error('Employee data not found');
      }

      Logger.debug('✅ Employee data fetched, generating PDF...');

      // Transform nested employee structure to flat structure expected by PDFGenerationService
      const flattenedEmployee = {
        firstName: employee.profile?.firstName || '',
        lastName: employee.profile?.lastName || '',
        employeeNumber: employee.employment?.employeeNumber || employee.id,
        department: employee.profile?.department || employee.employment?.department || '',
        position: employee.employment?.position || '',
        email: employee.profile?.email || '',
        phone: employee.profile?.phone || ''
      };

      Logger.debug('👤 Flattened employee for PDF:', flattenedEmployee);

      // Helper function to convert Firestore Timestamp to Date
      const convertTimestampToDate = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        // Check if it's a Firestore Timestamp with seconds property
        if (timestamp.seconds) {
          return new Date(timestamp.seconds * 1000);
        }
        // Check if it's already a Date object
        if (timestamp instanceof Date) {
          return timestamp;
        }
        // Try to parse as date string
        const parsed = new Date(timestamp);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      };

      // Map warning data fields to match PDFGenerationService interface
      const pdfData = {
        warningId: warningData.id || notification.warningId,
        warningLevel: warningData.level || 'counselling',
        category: warningData.category || 'General',
        description: warningData.description || '',
        incidentDate: convertTimestampToDate(warningData.incidentDate || warningData.issueDate),
        incidentTime: warningData.incidentTime || '',
        incidentLocation: warningData.incidentLocation || '',
        issuedDate: convertTimestampToDate(warningData.issueDate || warningData.createdAt),
        validityPeriod: warningData.validityPeriod || 6,
        employee: flattenedEmployee,
        organization: organization,
        signatures: warningData.signatures || {},
        additionalNotes: warningData.additionalNotes || ''
      };

      Logger.debug('📄 Mapped PDF data:', pdfData);

      // Import PDF service and generate
      const { PDFGenerationService } = await import('../../services/PDFGenerationService');

      const pdfBlob = await PDFGenerationService.generateWarningPDF(pdfData);

      Logger.success('✅ PDF generated successfully');

      return pdfBlob;
    } catch (error) {
      Logger.error('❌ Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [notification.warningId, organization]);

  // Handle PDF preview
  const openPDFPreview = async () => {
    // If PDF URL exists, open it directly in a new tab
    if (notification.pdfUrl) {
      window.open(notification.pdfUrl, '_blank');
      return;
    }

    // Generate PDF and open it
    const pdfBlob = await generatePDFForWarning();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    setPrinted(true);
  };

  // Direct print function
  const printDocument = useCallback(async () => {
    // If PDF URL exists, use it directly
    if (notification.pdfUrl) {
      const printWindow = window.open(notification.pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setPrinted(true);
        };
      }
      return;
    }

    // Generate PDF and print it
    const pdfBlob = await generatePDFForWarning();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setPrinted(true);
        };
      }
    }
  }, [notification.pdfUrl, generatePDFForWarning]);

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
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview Document
                    </>
                  )}
                </ThemedButton>

                <ThemedButton
                  variant="primary"
                  onClick={printDocument}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Print Document
                    </>
                  )}
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
                Step 3: Finalize Delivery
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Confirm delivery completion
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Completion Checklist */}
            <div>
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
                  Complete Delivery
                </>
              )}
            </ThemedButton>
          </div>
        </ThemedCard>
      )}
    </div>
  );
};

export default PrintDeliveryGuide;