// frontend/src/components/warnings/modals/WarningDetailsDialogs.tsx
//
// Nested dialog/modal components extracted from WarningDetailsModal in
// Phase 2 Tier 3D step 2. Each component is the byte-identical JSX from
// the original, just relocated and wrapped with props for state +
// callbacks.
//
// ⚠️ KNOWN PRE-EXISTING BUG: the parent currently invokes AudioModal
// and SignaturesModal TWICE each (different visual styles, same render
// condition). Both render simultaneously; the second wins visually due
// to DOM order at equal z-index. Behaviour is preserved exactly by
// keeping both invocations — track in a follow-up commit for cleanup.

import React from 'react';
import {
  X,
  Archive,
  Link,
  Copy,
  CheckCircle,
  Loader2,
  FileSignature,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Z_INDEX } from '../../../constants/zIndex';
import { AudioPlaybackWidget } from '../AudioPlaybackWidget';
import { SignatureDisplay } from '../SignatureDisplay';

// ============================================
// ARCHIVE CONFIRMATION DIALOG (inline panel)
// ============================================

interface ArchiveDialogProps {
  archiveReason: string;
  setArchiveReason: (reason: string) => void;
  archiveProcessing: boolean;
  onCancel: () => void;
  onArchive: () => void;
}

export const ArchiveDialog: React.FC<ArchiveDialogProps> = ({
  archiveReason,
  setArchiveReason,
  archiveProcessing,
  onCancel,
  onArchive,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-3">
      <Archive className="w-4 h-4 text-red-600" />
      <span className="text-sm font-semibold text-red-900">Archive Warning</span>
    </div>
    <p className="text-xs text-red-700 mb-3">
      Archived warnings are removed from active views and will no longer affect future escalation levels. This action can be reversed by an administrator.
    </p>
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">Reason for archiving</label>
      <select
        value={archiveReason}
        onChange={(e) => setArchiveReason(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
      >
        <option value="">Select a reason...</option>
        <option value="test_data">Test data / Demo warning</option>
        <option value="issued_in_error">Issued in error</option>
        <option value="duplicate">Duplicate warning</option>
        <option value="overturned">Overturned on appeal</option>
        <option value="expired">Naturally expired</option>
        <option value="manual">Other (manual archive)</option>
      </select>
    </div>
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
      >
        Cancel
      </button>
      <button
        onClick={onArchive}
        disabled={!archiveReason || archiveProcessing}
        className="flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {archiveProcessing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Archive className="w-3 h-3" />
        )}
        Archive Warning
      </button>
    </div>
  </div>
);

// ============================================
// RESPONSE LINK PANEL
// ============================================

interface ResponseLinkPanelProps {
  responseLink: string;
  responseLinkCopied: boolean;
  onCopy: () => void;
}

export const ResponseLinkPanel: React.FC<ResponseLinkPanelProps> = ({
  responseLink,
  responseLinkCopied,
  onCopy,
}) => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Link className="w-4 h-4 text-amber-600" />
      <span className="text-sm font-semibold text-amber-900">Employee Response Link</span>
    </div>
    <p className="text-xs text-amber-700 mb-3">
      Send this link to the employee via WhatsApp or email. They can respond or appeal without needing to log in.
    </p>
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={responseLink}
        readOnly
        className="flex-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg text-gray-800 font-mono"
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <button
        onClick={onCopy}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          responseLinkCopied
            ? 'bg-green-600 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        }`}
      >
        {responseLinkCopied ? (
          <><CheckCircle className="w-4 h-4" /> Copied</>
        ) : (
          <><Copy className="w-4 h-4" /> Copy</>
        )}
      </button>
    </div>
  </div>
);

// ============================================
// AUDIO MODAL — variant A (less-featured, rendered first)
// ============================================

interface AudioModalSimpleProps {
  audioRecording: any;
  onClose: () => void;
}

export const AudioModalSimple: React.FC<AudioModalSimpleProps> = ({ audioRecording, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: Z_INDEX.modalNested1 }}>
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Audio Recording</h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">
        <AudioPlaybackWidget
          audioRecording={audioRecording}
          compact={false}
        />
      </div>
    </div>
  </div>
);

// ============================================
// AUDIO MODAL — variant B (with header subtitle, rendered second)
// ============================================

interface AudioModalFullProps {
  warningId: string;
  employeeName: string;
  audioRecording: any;
  onClose: () => void;
}

export const AudioModalFull: React.FC<AudioModalFullProps> = ({
  warningId,
  employeeName,
  audioRecording,
  onClose,
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: Z_INDEX.modalNested1 }}>
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Audio Recording</h3>
          <p className="text-sm text-gray-600 mt-1">Warning ID: {warningId} • {employeeName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6">
        <AudioPlaybackWidget
          audioRecording={audioRecording}
          warningId={warningId}
          showDownload={true}
          showMetadata={true}
          className="w-full"
        />
      </div>
    </div>
  </div>
);

// ============================================
// SIGNATURES MODAL — variant A (rendered first)
// ============================================

interface SignaturesModalSimpleProps {
  hasSignatures: boolean;
  signatures: { manager?: string | null; employee?: string | null };
  onClose: () => void;
}

export const SignaturesModalSimple: React.FC<SignaturesModalSimpleProps> = ({
  hasSignatures,
  signatures,
  onClose,
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: Z_INDEX.modalNested1 }}>
    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Digital Signatures</h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">
        {hasSignatures ? (
          <div className="space-y-4">
            {signatures?.manager && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Manager Signature</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <img
                    src={signatures.manager}
                    alt="Manager Signature"
                    className="max-w-full h-20 mx-auto"
                  />
                </div>
              </div>
            )}

            {signatures?.employee && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Employee Signature</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <img
                    src={signatures.employee}
                    alt="Employee Signature"
                    className="max-w-full h-20 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures available</h3>
            <p className="text-gray-600">Digital signatures have not been collected for this warning.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// SIGNATURES MODAL — variant B (with header subtitle + per-sig buttons, rendered second)
// ============================================

interface SignaturesModalFullProps {
  warningId: string;
  employeeName: string;
  hasSignatures: boolean;
  signatures: { manager: string | null; employee: string | null; [key: string]: any };
  onClose: () => void;
  onViewSignature: (which: 'manager' | 'employee') => void;
}

export const SignaturesModalFull: React.FC<SignaturesModalFullProps> = ({
  warningId,
  employeeName,
  hasSignatures,
  signatures,
  onClose,
  onViewSignature,
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: Z_INDEX.modalNested1 }}>
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Digital Signatures</h3>
          <p className="text-sm text-gray-600 mt-1">Warning ID: {warningId} • {employeeName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6">
        {hasSignatures ? (
          <>
            <SignatureDisplay
              signatures={signatures}
              warningId={warningId}
              showTimestamps={true}
              showVerification={true}
              allowDownload={true}
              className="w-full mb-4"
            />

            {/* Individual Signature Buttons */}
            <div className="flex gap-3">
              {signatures.manager && (
                <button
                  onClick={() => onViewSignature('manager')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">View Manager Signature</span>
                </button>
              )}
              {signatures.employee && (
                <button
                  onClick={() => onViewSignature('employee')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">View Employee Signature</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures available</h3>
            <p className="text-gray-600">Digital signatures have not been collected for this warning.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ============================================
// INDIVIDUAL SIGNATURE VIEW MODAL
// ============================================

interface IndividualSignatureModalProps {
  signature: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const IndividualSignatureModal: React.FC<IndividualSignatureModalProps> = ({
  signature,
  title,
  subtitle,
  onClose,
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: Z_INDEX.modalNested2 }}>
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
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
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Digital signature • PNG format • Legally binding
        </div>
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = signature;
            link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_signature.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
      </div>
    </div>
  </div>
);
