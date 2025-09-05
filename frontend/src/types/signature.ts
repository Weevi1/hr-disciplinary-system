// frontend/src/types/signature.ts
// 🏆 ENHANCED DIGITAL SIGNATURE SYSTEM
// Complete signature capture, validation, and verification system

// ============================================
// CORE SIGNATURE TYPES
// ============================================

export interface SignatureData {
  signature: string; // Base64 image data
  signatory: {
    type: 'manager' | 'employee' | 'witness';
    name: string;
    id: string;
    role?: string;
  };
  timestamp: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    screen: {
      width: number;
      height: number;
    };
    isMobile: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  ipAddress?: string;
  sessionId?: string;
}

export interface SignatureCollection {
  warningId: string;
  signatures: {
    manager?: SignatureData;
    employee?: SignatureData;
    witnesses: SignatureData[];
  };
  completedAt?: Date;
  verificationHash?: string;
  auditTrail: SignatureAuditEntry[];
}

export interface SignatureAuditEntry {
  timestamp: Date;
  action: 'created' | 'signed' | 'verified' | 'voided';
  signatory: string;
  details: string;
  ipAddress?: string;
}

// ============================================
// SIGNATURE VALIDATION
// ============================================

export interface SignatureValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    signatureQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
    estimatedTime: number; // Time taken to sign in seconds
    strokeCount: number;
    boundingBox: {
      width: number;
      height: number;
    };
  };
}

export interface SignatureRequirements {
  managerRequired: boolean;
  employeeRequired: boolean;
  witnessesRequired: number;
  minimumStrokeCount: number;
  minimumSignatureTime: number; // Seconds
  requireLocation: boolean;
  allowMobileSignatures: boolean;
}

// ============================================
// SIGNATURE CANVAS PROPS
// ============================================

export interface SignatureCanvasProps {
  onSignatureComplete: (signature: string) => void;
  signatory: {
    type: 'manager' | 'employee' | 'witness';
    name: string;
    id: string;
  };
  required?: boolean;
  width?: number;
  height?: number;
  backgroundColor?: string;
  penColor?: string;
  penWidth?: number;
  disabled?: boolean;
}

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, quality?: number) => string;
  getSignatureData: () => SignatureData | null;
}

// ============================================
// LEGAL & COMPLIANCE
// ============================================

export interface SignatureLegalMetadata {
  jurisdiction: 'ZA' | 'UK' | 'US' | 'EU';
  complianceFramework: 'POPIA' | 'GDPR' | 'CCPA';
  retentionPeriod: number; // Days
  encryptionStandard: 'AES-256' | 'RSA-2048';
  auditRequirements: {
    mustLogAccess: boolean;
    mustLogChanges: boolean;
    mustLogDeletion: boolean;
  };
}

export interface SignatureConsent {
  consentGiven: boolean;
  consentTimestamp: Date;
  consentText: string;
  withdrawalMethod: string;
  dataProcessingPurpose: string[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const generateSignatureId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `sig_${timestamp}_${random}`;
};

export const createSignatureData = (
  signatureImage: string,
  signatory: SignatureData['signatory'],
  deviceInfo?: Partial<SignatureData['deviceInfo']>,
  location?: SignatureData['location']
): SignatureData => {
  return {
    signature: signatureImage,
    signatory,
    timestamp: new Date().toISOString(),
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      ...deviceInfo
    },
    location,
    sessionId: generateSignatureId()
  };
};

export const validateSignature = (signatureData: SignatureData): SignatureValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (!signatureData.signature || signatureData.signature.length === 0) {
    errors.push('Signature image is required');
  }
  
  if (!signatureData.signatory.name || signatureData.signatory.name.trim().length === 0) {
    errors.push('Signatory name is required');
  }
  
  if (!signatureData.signatory.id || signatureData.signatory.id.trim().length === 0) {
    errors.push('Signatory ID is required');
  }
  
  if (!signatureData.timestamp) {
    errors.push('Signature timestamp is required');
  }
  
  // Quality checks
  let signatureQuality: SignatureValidationResult['metadata']['signatureQuality'] = 'poor';
  
  try {
    // Estimate signature quality based on image data length
    const imageDataLength = signatureData.signature.length;
    if (imageDataLength > 50000) {
      signatureQuality = 'excellent';
    } else if (imageDataLength > 30000) {
      signatureQuality = 'good';
    } else if (imageDataLength > 15000) {
      signatureQuality = 'acceptable';
    } else {
      warnings.push('Signature appears too simple or small');
    }
  } catch (error) {
    warnings.push('Could not analyze signature quality');
  }
  
  // Device validation
  if (signatureData.deviceInfo.isMobile) {
    warnings.push('Signature captured on mobile device');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      signatureQuality,
      estimatedTime: 0, // Would need to track this during capture
      strokeCount: 0, // Would need to track this during capture
      boundingBox: {
        width: signatureData.deviceInfo.screen.width,
        height: signatureData.deviceInfo.screen.height
      }
    }
  };
};

export const createSignatureCollection = (
  warningId: string,
  requirements: SignatureRequirements
): SignatureCollection => {
  return {
    warningId,
    signatures: {
      witnesses: []
    },
    auditTrail: [{
      timestamp: new Date(),
      action: 'created',
      signatory: 'system',
      details: `Signature collection created for warning ${warningId}`
    }]
  };
};

export const addSignatureToCollection = (
  collection: SignatureCollection,
  signature: SignatureData
): SignatureCollection => {
  const updatedCollection = { ...collection };
  
  // Add signature based on type
  switch (signature.signatory.type) {
    case 'manager':
      updatedCollection.signatures.manager = signature;
      break;
    case 'employee':
      updatedCollection.signatures.employee = signature;
      break;
    case 'witness':
      updatedCollection.signatures.witnesses.push(signature);
      break;
  }
  
  // Add audit entry
  updatedCollection.auditTrail.push({
    timestamp: new Date(),
    action: 'signed',
    signatory: signature.signatory.name,
    details: `${signature.signatory.type} signature added`,
    ipAddress: signature.ipAddress
  });
  
  // Check if collection is complete
  if (isSignatureCollectionComplete(updatedCollection)) {
    updatedCollection.completedAt = new Date();
    updatedCollection.verificationHash = generateVerificationHash(updatedCollection);
    
    updatedCollection.auditTrail.push({
      timestamp: new Date(),
      action: 'verified',
      signatory: 'system',
      details: 'All required signatures collected and verified'
    });
  }
  
  return updatedCollection;
};

export const isSignatureCollectionComplete = (
  collection: SignatureCollection,
  requirements?: SignatureRequirements
): boolean => {
  const defaultRequirements: SignatureRequirements = {
    managerRequired: true,
    employeeRequired: true,
    witnessesRequired: 0,
    minimumStrokeCount: 5,
    minimumSignatureTime: 2,
    requireLocation: false,
    allowMobileSignatures: true
  };
  
  const reqs = requirements || defaultRequirements;
  
  // Check manager signature
  if (reqs.managerRequired && !collection.signatures.manager) {
    return false;
  }
  
  // Check employee signature
  if (reqs.employeeRequired && !collection.signatures.employee) {
    return false;
  }
  
  // Check witness signatures
  if (collection.signatures.witnesses.length < reqs.witnessesRequired) {
    return false;
  }
  
  return true;
};

export const generateVerificationHash = (collection: SignatureCollection): string => {
  // Simple hash generation - in production, use a proper cryptographic hash
  const dataToHash = JSON.stringify({
    warningId: collection.warningId,
    signatures: collection.signatures,
    completedAt: collection.completedAt
  });
  
  // This is a simplified hash - use proper crypto in production
  let hash = 0;
  for (let i = 0; i < dataToHash.length; i++) {
    const char = dataToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
};

export const verifySignatureCollection = (
  collection: SignatureCollection
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!collection.verificationHash) {
    errors.push('No verification hash present');
  }
  
  if (!collection.completedAt) {
    errors.push('Collection not marked as complete');
  }
  
  // Verify each signature
  if (collection.signatures.manager) {
    const validation = validateSignature(collection.signatures.manager);
    if (!validation.isValid) {
      errors.push(`Manager signature invalid: ${validation.errors.join(', ')}`);
    }
  }
  
  if (collection.signatures.employee) {
    const validation = validateSignature(collection.signatures.employee);
    if (!validation.isValid) {
      errors.push(`Employee signature invalid: ${validation.errors.join(', ')}`);
    }
  }
  
  collection.signatures.witnesses.forEach((witness, index) => {
    const validation = validateSignature(witness);
    if (!validation.isValid) {
      errors.push(`Witness ${index + 1} signature invalid: ${validation.errors.join(', ')}`);
    }
  });
  
  // Verify hash
  const currentHash = generateVerificationHash(collection);
  if (currentHash !== collection.verificationHash) {
    errors.push('Verification hash mismatch - collection may have been tampered with');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================
// SIGNATURE CANVAS UTILITIES
// ============================================

export const getCanvasSignatureData = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png');
};

export const clearCanvas = (canvas: HTMLCanvasElement): void => {
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
};

export const isCanvasEmpty = (canvas: HTMLCanvasElement): boolean => {
  const context = canvas.getContext('2d');
  if (!context) return true;
  
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Check if any pixel has alpha > 0 (i.e., something is drawn)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return false;
  }
  
  return true;
};
