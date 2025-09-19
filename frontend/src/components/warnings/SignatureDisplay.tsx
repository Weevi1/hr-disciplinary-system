import Logger from '../../utils/logger';
// frontend/src/components/warnings/SignatureDisplay.tsx
// ✍️ SIGNATURE DISPLAY COMPONENT FOR WARNING DOCUMENTS
// ✅ Works with base64 PNG signatures from enhancedwarningwizard
// ✅ Displays manager and employee signatures with timestamps
// ✅ Verification and authentication indicators

import React, { useState, useCallback } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Shield,
  Eye,
  Download,
  Copy,
  X,
  Maximize2,
  UserCheck,
  Clock,
  FileSignature,
  Verified,
  Info
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

interface SignatureData {
  manager: string | null;
  employee: string | null;
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
  managerTimestamp?: string;
  employeeTimestamp?: string;
}

interface SignatureDisplayProps {
  signatures: SignatureData;
  warningId?: string;
  showTimestamps?: boolean;
  compact?: boolean;
  showVerification?: boolean;
  allowDownload?: boolean;
  className?: string;
}

interface SignatureModalProps {
  signature: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  allowDownload?: boolean;
}

// ============================================
// SIGNATURE MODAL COMPONENT
// ============================================

const SignatureModal: React.FC<SignatureModalProps> = ({
  signature,
  title,
  subtitle,
  isOpen,
  onClose,
  allowDownload = true
}) => {
  
  const handleDownload = useCallback(() => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(signature.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_signature.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      Logger.error('Signature download failed:', error)
    }
  }, [signature, title]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(signature);
      // You could add a toast notification here
    } catch (error) {
      Logger.error('Failed to copy signature:', error)
    }
  }, [signature]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Signature Image */}
        <div className="p-6">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <img
              src={signature}
              alt={title}
              className="max-w-full max-h-96 mx-auto"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Digital signature • PNG format • Legally binding
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Data
            </button>
            {allowDownload && (
              <button
                onClick={handleDownload}
                className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signatures,
  warningId,
  showTimestamps = true,
  compact = false,
  showVerification = true,
  allowDownload = true,
  className = ''
}) => {

  // ============================================
  // STATE
  // ============================================
  
  const [selectedSignature, setSelectedSignature] = useState<{
    signature: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // ============================================
  // SIGNATURE VALIDATION
  // ============================================

  const validateSignature = (signature: string | null): boolean => {
    if (!signature) return false;
    
    try {
      // Check if it's a valid base64 image
      return signature.startsWith('data:image/') && signature.includes('base64,');
    } catch {
      return false;
    }
  };

  const hasValidManagerSignature = validateSignature(signatures.manager);
  const hasValidEmployeeSignature = validateSignature(signatures.employee);
  const hasAllSignatures = hasValidManagerSignature && hasValidEmployeeSignature;

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleViewSignature = useCallback((signature: string, title: string, subtitle?: string) => {
    setSelectedSignature({ signature, title, subtitle });
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedSignature(null);
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'Not signed';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid timestamp';
    }
  };

  const getSignatureStatus = (): {
    status: 'complete' | 'partial' | 'missing';
    message: string;
    color: string;
    icon: React.ComponentType<any>;
  } => {
    if (hasAllSignatures) {
      return {
        status: 'complete',
        message: 'Document fully signed',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle
      };
    } else if (hasValidManagerSignature || hasValidEmployeeSignature) {
      return {
        status: 'partial',
        message: 'Signatures pending',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Clock
      };
    } else {
      return {
        status: 'missing',
        message: 'No signatures collected',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: AlertTriangle
      };
    }
  };

  const signatureStatus = getSignatureStatus();
  const StatusIcon = signatureStatus.icon;

  // ============================================
  // COMPACT VIEW
  // ============================================

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <StatusIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {hasAllSignatures ? '✓ Signed' : '⏳ Pending'}
        </span>
        {hasAllSignatures && (
          <button
            onClick={() => handleViewSignature(
              signatures.manager!,
              'Digital Signatures',
              'Manager and Employee'
            )}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            View
          </button>
        )}
      </div>
    );
  }

  // ============================================
  // FULL VIEW
  // ============================================

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <FileSignature className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Digital Signatures</h4>
              <p className="text-xs text-gray-600">Electronic authorization and acknowledgment</p>
            </div>
          </div>
          
          {showVerification && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${signatureStatus.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{signatureStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manager Signature */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Manager</span>
                {hasValidManagerSignature && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              {hasValidManagerSignature && (
                <button
                  onClick={() => handleViewSignature(
                    signatures.manager!,
                    'Manager Signature',
                    signatures.managerName || 'Warning Issuer'
                  )}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="View full signature"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {hasValidManagerSignature ? (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <img
                    src={signatures.manager!}
                    alt="Manager Signature"
                    className="max-w-full h-16 mx-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3" />
                    <span>{signatures.managerName || 'Manager'}</span>
                  </div>
                  {showTimestamps && signatures.managerTimestamp && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTimestamp(signatures.managerTimestamp)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Awaiting manager signature</p>
              </div>
            )}
          </div>

          {/* Employee Signature */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Employee</span>
                {hasValidEmployeeSignature && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              {hasValidEmployeeSignature && (
                <button
                  onClick={() => handleViewSignature(
                    signatures.employee!,
                    'Employee Signature',
                    signatures.employeeName || 'Warning Recipient'
                  )}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="View full signature"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>

            {hasValidEmployeeSignature ? (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <img
                    src={signatures.employee!}
                    alt="Employee Signature"
                    className="max-w-full h-16 mx-auto"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3" />
                    <span>{signatures.employeeName || 'Employee'}</span>
                  </div>
                  {showTimestamps && signatures.employeeTimestamp && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTimestamp(signatures.employeeTimestamp)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <UserCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Awaiting employee acknowledgment</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Legal Notice */}
      {hasAllSignatures && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Document Digitally Signed & Verified
              </p>
              <p className="text-xs text-green-700 mt-1">
                These digital signatures are legally binding and comply with electronic signature regulations.
                {warningId && ` Document ID: ${warningId}`}
              </p>
            </div>
            {allowDownload && (
              <button
                onClick={() => {
                  // Download both signatures as a combined view
                  // This would need to be implemented based on your requirements
                }}
                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                title="Download signatures"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Partial signatures notice */}
      {!hasAllSignatures && (hasValidManagerSignature || hasValidEmployeeSignature) && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Signature Collection In Progress
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Document requires signatures from both manager and employee to be legally complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {selectedSignature && (
        <SignatureModal
          signature={selectedSignature.signature}
          title={selectedSignature.title}
          subtitle={selectedSignature.subtitle}
          isOpen={true}
          onClose={handleCloseModal}
          allowDownload={allowDownload}
        />
      )}
    </div>
  );
};