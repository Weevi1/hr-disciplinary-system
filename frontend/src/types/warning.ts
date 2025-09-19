// frontend/src/types/warning.ts
// 🏆 ENHANCED WARNING TYPES - Progressive Discipline System
// ✅ Updated to support audio recordings and metadata

export type WarningLevel = 
  | 'counselling'     // ← ADD THIS
  | 'verbal'
  | 'first_written' 
  | 'second_written'
  | 'final_written'
  | 'suspension'
  | 'dismissal';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type DeliveryMethod = 'email' | 'whatsapp' | 'printed';

export interface Warning {
  id: string;
  employeeId: string;
  categoryId: string;
  category: string;
  level: WarningLevel;
  
  // Progressive discipline fields
  validityPeriod: 3 | 6 | 12; // months
  issueDate: Date;
  expiryDate: Date; // Calculated from issueDate + validityPeriod
  isActive: boolean; // Calculated field - true if not expired
  
  // Incident details
  incidentDate: Date;
  incidentTime: string;
  incidentLocation: string;
  description: string;
  
  // Organization and user
  organizationId: string;
  issuedBy: string;
  issuedByName?: string;
  
  // Employee details (snapshot)
  employeeName: string;
  employeeNumber: string;
  department: string;
  position: string;
  
  // Delivery information
  deliveryMethod: DeliveryMethod;
  deliveryChoice?: any; // From delivery modal
  deliveryStatus?: 'pending' | 'delivered' | 'failed';
  
  // Progressive discipline context
  escalationReason?: string;
  activeWarningsAtTime?: number; // How many active warnings when this was issued
  legalRequirements?: string[];
  
  // Evidence and witnesses
  witnessIds?: string[];
  evidenceItems?: EvidenceItem[];
  additionalNotes?: string;
  
  // 🎯 NEW: Audio recording fields
  audioRecording?: AudioRecordingData;
  
  // PDF and documentation
  pdfGenerated?: boolean;
  pdfFilename?: string;
  
  // Audit trail
  createdAt: Date;
  updatedAt?: Date;
  
  // Workflow status
  status?: 'issued' | 'acknowledged' | 'appealed' | 'expired';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  
  // Appeal information
  appealSubmitted?: boolean;
  appealDate?: Date;
  appealOutcome?: 'upheld' | 'overturned' | 'modified';
}

// 🎯 NEW: Audio recording data interface
export interface AudioRecordingData {
  // File information
  url?: string; // Firebase Storage download URL
  storageUrl?: string; // Alternative field name for storage URL
  storagePath?: string; // Firebase Storage path
  filename?: string; // Original filename
  size: number; // File size in bytes
  duration: number; // Duration in seconds
  
  // Recording metadata
  recordingId: string; // Unique recording identifier
  startTime: Date; // When recording started
  endTime: Date; // When recording ended
  recordedBy: string; // User ID who recorded
  recordedByName?: string; // User name who recorded
  
  // Technical details
  codec: string; // e.g., 'audio/webm;codecs=opus'
  bitrate: number; // e.g., 16000 (16kbps)
  sampleRate: number; // e.g., 8000 (8kHz)
  channels: number; // e.g., 1 (mono)
  
  // Process tracking
  uploadedAt?: Date;
  processingStatus: 'pending' | 'completed' | 'failed' | 'deleted';
  available?: boolean; // Whether file is currently available
  
  // Legal and compliance
  consentGiven: boolean; // Whether participants consented to recording
  retentionPeriod: number; // Months to retain (matches warning validity)
  autoDeleteDate: Date; // Calculated deletion date
  
  // 🎯 NEW: Deletion tracking
  deleted?: boolean; // Whether audio has been deleted
  deletedAt?: Date; // When audio was deleted
  deletedReason?: string; // Reason for deletion ('expired', 'manual', 'compliance')
  deletedBy?: string; // User ID who triggered deletion (for manual deletions)
  originalExpiredDate?: Date; // Original auto-delete date (for audit)
  
  // Quality metrics
  compressionRatio?: number; // Original size vs compressed size
  qualityScore?: number; // 1-10 quality rating
  backgroundNoiseLevel?: 'low' | 'medium' | 'high';
}

export interface AudioCleanupAudit {
  id: string;
  date: string; // YYYY-MM-DD format
  timestamp: Date;
  completedAt: string; // ISO string
  result: {
    totalScanned: number;
    totalExpired: number;
    successfulDeletions: number;
    failedDeletions: number;
    errors: string[];
    organizationsProcessed: string[];
    processingTime: number; // milliseconds
  };
  version: string;
}

export interface AudioDeletionRequest {
  warningId: string;
  organizationId: string;
  recordingId: string;
  reason: 'expired' | 'manual' | 'compliance' | 'employee_request';
  requestedBy: string; // User ID
  requestedByName?: string;
  requestedAt: Date;
  notes?: string;
}



export interface WarningCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  
  // Progressive discipline configuration
  escalationPath: WarningLevel[];
  defaultValidityPeriod: 3 | 6 | 12;
  
  // 🎯 NEW: Audio recording settings
  audioRecordingEnabled?: boolean; // Whether to auto-record for this category
  audioRecordingRequired?: boolean; // Whether recording is mandatory
  
  // Legal and compliance
  requiredDocuments: string[];
  legalRequirements: string[];
  saLegalType?: string;
  
  // Usage and examples
  isActive: boolean;
  usage: number;
  lastUsed?: Date;
  exampleIncidents?: string[];
  investigationQuestions?: string[];
  
  // Categorization
  type?: string;
  tags?: string[];
  sectorId?: string;
  
  // Audit
  createdAt: Date;
  updatedAt?: Date;
}

export interface EvidenceItem {
  id: string;
  type: 'photo' | 'document' | 'video' | 'audio';
  url?: string;
  file?: File;
  thumbnail?: string;
  description: string;
  capturedAt: Date;
  captureMethod: 'upload' | 'camera' | 'microphone';
  metadata?: {
    filename?: string;
    fileSize?: number;
    mimeType?: string;
    // 🎯 NEW: Enhanced audio metadata
    audioMetadata?: {
      duration?: number;
      bitrate?: number;
      sampleRate?: number;
      channels?: number;
      codec?: string;
    };
  };
}

export interface WitnessInfo {
  id: string;
  name: string;
  type: 'employee' | 'external';
  employeeId?: string;
  contactInfo?: string;
  statement?: string;
  signatureCollected: boolean;
  statementDate?: Date;
  // 🎯 NEW: Audio consent
  audioConsentGiven?: boolean;
  audioConsentDate?: Date;
}

// Progressive discipline specific interfaces
export interface WarningEscalation {
  fromLevel: WarningLevel;
  toLevel: WarningLevel;
  triggerCondition: 'time' | 'repeat' | 'severity';
  timeframeDays?: number;
  categorySpecific: boolean;
}

export interface DisciplinaryRecord {
  employeeId: string;
  organizationId: string;
  totalWarnings: number;
  activeWarnings: number;
  currentLevel: WarningLevel | 'none';
  
  // History tracking
  warningHistory: Warning[];
  escalationHistory: WarningEscalation[];
  
  // Category-specific tracking
  warningsByCategory: { [categoryId: string]: number };
  activeByCategoryCount: { [categoryId: string]: number };
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  
  // Compliance tracking
  lastDisciplinaryAction?: Date;
  nextReviewDate?: Date;
  complianceNotes: string[];
  
  // 🎯 NEW: Audio recording compliance
  audioRecordingHistory: AudioRecordingData[];
  audioStorageUsed: number; // Total bytes used for audio
  
  // Audit
  updatedAt: Date;
}

// Form data interfaces
export interface WarningFormData {
  employeeId: string;
  categoryId: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  witnessIds: string[];
  evidenceItems: EvidenceItem[];
  additionalNotes: string;
  deliveryMethod: DeliveryMethod;
  severity: SeverityLevel;
  isIssued: boolean;
  
  // 🎯 NEW: Audio recording data
  audioRecording?: Partial<AudioRecordingData>;
}

export interface EnhancedWarningFormData extends WarningFormData {
  // Progressive discipline fields
  validityPeriod: 3 | 6 | 12;
  suggestedLevel?: WarningLevel;
  escalationReason?: string;
  legalRequirements?: string[];
  
  // AI/Progressive discipline context
  activeWarningsContext?: {
    count: number;
    mostRecent?: Warning;
    byCategory: { [categoryId: string]: number };
  };
  
  // 🎯 NEW: Audio recording preferences
  audioRecordingEnabled?: boolean;
  audioConsentGiven?: boolean;
}

// Employee context for warnings
export interface EmployeeWithContext {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email: string;
  department: string;
  position: string;
  
  // Warning context
  recentWarnings: {
    count: number;
    lastCategory?: string;
    lastDate?: Date;
    level?: string;
  };
  
  // Risk indicators
  riskIndicators: {
    highRisk: boolean;
    reasons: string[];
  };
  
  // 🎯 NEW: Audio preferences
  audioRecordingConsent?: {
    given: boolean;
    date?: Date;
    expires?: Date;
  };
}

// 🎯 NEW: Audio service interfaces
export interface AudioUploadRequest {
  organizationId: string;
  warningId: string;
  recordingData: AudioRecordingData;
  audioBlob: Blob;
}

export interface AudioUploadResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    size: number;
    duration: number;
    storageQuotaUsed: number;
  };
}

// 🎯 NEW: Organization audio settings
export interface OrganizationAudioSettings {
  enabled: boolean;
  autoRecordWarnings: boolean;
  maxRecordingDuration: number; // minutes
  maxStoragePerWarning: number; // MB
  compressionLevel: 'low' | 'medium' | 'high';
  retentionPolicy: 'match_warning' | 'fixed_period' | 'permanent';
  consentRequired: boolean;
  qualityThreshold: number; // 1-10
  
  // 🎯 NEW: Auto-deletion settings
  autoDeletionEnabled: boolean;
  deletionGracePeriod: number; // Days after expiry before deletion
  notifyBeforeDeletion: boolean; // Whether to send notifications
  notificationDays: number; // Days before deletion to notify
  auditRetentionMonths: number; // How long to keep deletion audit logs
  allowManualDeletion: boolean; // Whether managers can manually delete
}

// Export helper functions
export const createEmptyAudioRecording = (): Partial<AudioRecordingData> => ({
  recordingId: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startTime: new Date(),
  codec: 'audio/webm;codecs=opus',
  bitrate: 16000,
  sampleRate: 8000,
  channels: 1,
  consentGiven: false,
  processingStatus: 'pending'
});

export const calculateAudioRetention = (warningValidityPeriod: 3 | 6 | 12): Date => {
  const now = new Date();
  now.setMonth(now.getMonth() + warningValidityPeriod);
  return now;
};

export const isAudioExpired = (audioRecording: AudioRecordingData): boolean => {
  if (!audioRecording.autoDeleteDate) return false;
  return new Date() > new Date(audioRecording.autoDeleteDate);
};

export const isAudioDeleted = (audioRecording: AudioRecordingData): boolean => {
  return audioRecording.deleted === true || audioRecording.processingStatus === 'deleted';
};

export const canPlayAudio = (audioRecording: AudioRecordingData): boolean => {
  return (
    !isAudioDeleted(audioRecording) &&
    audioRecording.available === true &&
    (audioRecording.storageUrl || audioRecording.url) &&
    audioRecording.processingStatus === 'completed'
  );
};

export const getAudioStatus = (audioRecording: AudioRecordingData): {
  status: 'available' | 'expired' | 'deleted' | 'processing' | 'failed';
  message: string;
} => {
  if (isAudioDeleted(audioRecording)) {
    return {
      status: 'deleted',
      message: `Audio deleted on ${audioRecording.deletedAt?.toLocaleDateString()} - ${audioRecording.deletedReason || 'Unknown reason'}`
    };
  }
  
  if (audioRecording.processingStatus === 'failed') {
    return {
      status: 'failed',
      message: 'Audio processing failed'
    };
  }
  
  if (audioRecording.processingStatus === 'pending') {
    return {
      status: 'processing',
      message: 'Audio is being processed...'
    };
  }
  
  if (isAudioExpired(audioRecording)) {
    return {
      status: 'expired',
      message: `Audio expired on ${new Date(audioRecording.autoDeleteDate).toLocaleDateString()} and will be deleted soon`
    };
  }
  
  if (canPlayAudio(audioRecording)) {
    return {
      status: 'available',
      message: `Audio available until ${new Date(audioRecording.autoDeleteDate).toLocaleDateString()}`
    };
  }
  
  return {
    status: 'failed',
    message: 'Audio status unknown'
  };
};

export const formatAudioDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatAudioSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};