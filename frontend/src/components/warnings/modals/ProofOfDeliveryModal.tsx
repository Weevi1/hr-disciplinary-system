// frontend/src/components/warnings/modals/ProofOfDeliveryModal.tsx
// 🚀 PROOF OF DELIVERY MODAL
// ✅ Screenshot upload for email/WhatsApp deliveries
// ✅ Simple "printed" confirmation for print deliveries
// ✅ Screenshot capture instructions

import React, { useState, useRef, useCallback } from 'react';
import { 
  X, 
  Upload, 
  Image, 
  Check, 
  AlertTriangle, 
  Info, 
  Mail, 
  MessageSquare, 
  Printer,
  Camera,
  FileImage,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warningId: string;
  employeeName: string;
  deliveryMethod: 'email' | 'whatsapp' | 'printed';
  onDeliveryConfirmed: (proofData: {
    warningId: string;
    deliveryMethod: string;
    deliveredAt: Date;
    proofImage?: File;
  }) => void;
}

const deliveryMethodConfig = {
  email: {
    icon: Mail,
    name: 'Email',
    color: 'blue',
    requiresProof: true,
    instructions: [
      'Send the warning document via email',
      'Take a screenshot of the sent email',
      'Include timestamp and recipient email visible',
      'Upload the screenshot as proof of delivery'
    ],
    screenshotTips: [
      'Windows: Press Ctrl + Shift + S',
      'Mac: Press Cmd + Shift + 4', 
      'Chrome: Press Ctrl + Shift + Alt + 3'
    ]
  },
  whatsapp: {
    icon: MessageSquare,
    name: 'WhatsApp Business',
    color: 'green',
    requiresProof: true,
    instructions: [
      'Send the warning document via WhatsApp Business',
      'Wait for delivery confirmation (double blue ticks)',
      'Take a screenshot showing the sent message',
      'Include timestamp and delivery status visible',
      'Upload the screenshot as proof of delivery'
    ],
    screenshotTips: [
      'Windows: Press Ctrl + Shift + S',
      'Mac: Press Cmd + Shift + 4',
      'Phone: Use screenshot function (varies by device)'
    ]
  },
  printed: {
    icon: Printer,
    name: 'Print & Hand Delivery',
    color: 'purple',
    requiresProof: false,
    instructions: [
      'Print the warning document',
      'Hand deliver to the employee',
      'Get employee acknowledgment signature on physical copy',
      'File the signed copy in employee records',
      'Confirm delivery completion below'
    ]
  }
};

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  warningId,
  employeeName,
  deliveryMethod,
  onDeliveryConfirmed
}) => {
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = deliveryMethodConfig[deliveryMethod];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setProofImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const syntheticEvent = {
          target: { files: [file] }
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileSelect(syntheticEvent);
      }
    }
  }, [handleFileSelect]);

  const handleConfirmDelivery = useCallback(async () => {
    if (config.requiresProof && !proofImage) {
      setError('Please upload proof of delivery screenshot');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onDeliveryConfirmed({
        warningId,
        deliveryMethod,
        deliveredAt: new Date(),
        proofImage: proofImage || undefined
      });
      
      // Success - modal will close from parent
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm delivery');
    } finally {
      setIsUploading(false);
    }
  }, [config.requiresProof, proofImage, onDeliveryConfirmed, warningId, deliveryMethod]);

  const removeImage = useCallback(() => {
    setProofImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (!isOpen) return null;

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${config.color}-600 to-${config.color}-700 p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirm Delivery</h2>
                <p className="text-sm opacity-90">
                  {config.name} delivery for {employeeName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Delivery Instructions
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="space-y-2">
                {config.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Screenshot Instructions (for email/whatsapp) */}
          {config.requiresProof && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-600" />
                Screenshot Instructions
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {config.screenshotTips?.map((tip, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <kbd className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                        {tip.split(': ')[1]}
                      </kbd>
                      <span className="text-xs">{tip.split(': ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload Area (for email/whatsapp) */}
          {config.requiresProof && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Upload Proof of Delivery
              </h4>
              
              {!proofImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drop screenshot here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Proof of delivery"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{proofImage.name}</p>
                          <p className="text-sm text-gray-500">
                            {(proofImage.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">Ready to upload</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirmDelivery}
              disabled={isUploading || (config.requiresProof && !proofImage)}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-${config.color}-600 to-${config.color}-700 hover:from-${config.color}-700 hover:to-${config.color}-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Delivery
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};