// frontend/src/components/warnings/enhanced/phases/SignaturesPhase.tsx
//
// Signatures phase (phase 8) of UnifiedWarningWizard. Extracted in Phase 2
// Tier 3C step 3. Byte-identical JSX; state/handlers passed in via props.
// The presentational `SignatureSlot` sub-component is co-located here
// because it has no other callers.

import React from 'react';
import { CheckCircle, Eye } from 'lucide-react';
import { SignaturePadModal } from '../../../common/SignaturePadModal';
import type { SignatureData } from '../wizardTypes';

interface SignatureSlotProps {
  step: number;
  label: string;
  name: string;
  signature: string | null;
  isWitness?: boolean;
  isOptional?: boolean;
  onTap: () => void;
}

const SignatureSlot: React.FC<SignatureSlotProps> = ({
  step,
  label,
  name,
  signature,
  isWitness,
  isOptional,
  onTap,
}) => (
  <button
    onClick={onTap}
    disabled={!!signature}
    className={`w-full p-4 rounded-xl border-2 transition-all ${
      signature
        ? 'border-solid'
        : isOptional
          ? 'border-dashed opacity-70 hover:opacity-100 hover:border-solid active:scale-[0.98]'
          : 'border-dashed hover:border-solid active:scale-[0.98]'
    }`}
    style={{
      borderColor: signature
        ? 'var(--color-success)'
        : isWitness
          ? 'var(--color-warning)'
          : 'var(--color-primary)',
      backgroundColor: signature
        ? 'var(--color-alert-success-bg)'
        : 'var(--color-card-background)',
      cursor: signature ? 'default' : 'pointer',
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{
          backgroundColor: signature
            ? 'var(--color-success)'
            : isWitness
              ? 'var(--color-warning)'
              : 'var(--color-primary)',
        }}
      >
        {signature ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {label} Signature
          </p>
          {isOptional && !signature && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)' }}>
              Optional
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {signature ? `Signed by ${name}` : `Tap here for ${name} to sign`}
        </p>
      </div>
      {signature && (
        <img
          src={signature}
          alt={`${label} signature`}
          className="h-10 w-auto max-w-[80px] object-contain"
          style={{ filter: 'grayscale(0.2)' }}
        />
      )}
    </div>
  </button>
);

interface SignaturesPhaseProps {
  currentManagerName: string;
  employeeName: string;
  signatures: SignatureData;
  signatureType: 'employee' | 'witness';
  setSignatureType: (type: 'employee' | 'witness') => void;
  employeeViewedPDF: boolean;
  setEmployeeViewedPDF: (viewed: boolean) => void;
  setShowPDFPreview: (show: boolean) => void;
  activeSignatureModal: 'manager' | 'employee' | null;
  setActiveSignatureModal: (modal: 'manager' | 'employee' | null) => void;
  handleManagerSignature: (signature: string | null) => void;
  handleEmployeeSignature: (signature: string | null) => void;
  handleWitnessSignature: (signature: string | null) => Promise<void>;
}

export const SignaturesPhase: React.FC<SignaturesPhaseProps> = ({
  currentManagerName,
  employeeName,
  signatures,
  signatureType,
  setSignatureType,
  employeeViewedPDF,
  setEmployeeViewedPDF,
  setShowPDFPreview,
  activeSignatureModal,
  setActiveSignatureModal,
  handleManagerSignature,
  handleEmployeeSignature,
  handleWitnessSignature,
}) => (
  <div className="space-y-3">
    {/* Step 1: Manager Signature */}
    <SignatureSlot
      step={1}
      label="Manager"
      name={currentManagerName}
      signature={signatures.manager}
      onTap={() => setActiveSignatureModal('manager')}
    />

    {/* Show-PDF tile — tap = manager opens the document so the employee can read it
        before signing. The tap itself flags `employeeViewedPDF`; the (formerly
        standalone) confirmation checkbox is no longer needed. */}
    {signatures.manager && (
      <button
        onClick={() => {
          setEmployeeViewedPDF(true);
          setShowPDFPreview(true);
        }}
        className="w-full p-4 rounded-xl border-2 border-dashed transition-all hover:border-solid active:scale-[0.98]"
        style={{
          borderColor: employeeViewedPDF ? 'var(--color-success)' : 'var(--color-primary)',
          backgroundColor: employeeViewedPDF ? 'var(--color-alert-success-bg)' : 'var(--color-primary-light)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: employeeViewedPDF ? 'var(--color-success)' : 'var(--color-primary)',
              color: 'white',
            }}
          >
            {employeeViewedPDF ? <CheckCircle className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {employeeViewedPDF ? 'Warning shown to employee' : 'Show the warning to the employee'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {employeeViewedPDF
                ? 'Document was reviewed. Capture their signature below.'
                : 'Tap to open the warning so the employee can read it before signing.'}
            </p>
          </div>
        </div>
      </button>
    )}

    {/* Step 3: Employee OR Witness Signature */}
    {signatures.manager && employeeViewedPDF && (
      <div className="space-y-2">
        {/* Toggle: Employee or Witness */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
          <button
            onClick={() => setSignatureType('employee')}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
              signatureType === 'employee' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: signatureType === 'employee' ? 'white' : 'transparent',
              color: signatureType === 'employee' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Employee
          </button>
          <button
            onClick={() => setSignatureType('witness')}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
              signatureType === 'witness' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: signatureType === 'witness' ? 'white' : 'transparent',
              color: signatureType === 'witness' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
            }}
          >
            Witness
          </button>
        </div>

        {/* Signature slot based on toggle */}
        <SignatureSlot
          step={3}
          label={signatureType === 'employee' ? 'Employee' : 'Witness'}
          name={signatureType === 'employee' ? employeeName : 'Witness'}
          signature={signatureType === 'employee' ? signatures.employee : signatures.witness}
          isWitness={signatureType === 'witness'}
          onTap={() => setActiveSignatureModal('employee')}
        />

        {signatureType === 'witness' && (
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Use when employee refuses to sign
          </p>
        )}
      </div>
    )}

    {/* Signature Modal */}
    {activeSignatureModal && (
      <SignaturePadModal
        title={
          activeSignatureModal === 'manager'
            ? 'Manager Signature'
            : signatureType === 'employee'
              ? 'Employee Signature'
              : 'Witness Signature'
        }
        signerName={
          activeSignatureModal === 'manager'
            ? currentManagerName
            : signatureType === 'employee'
              ? employeeName
              : 'Witness'
        }
        onSave={(sig) => {
          if (activeSignatureModal === 'manager') {
            handleManagerSignature(sig);
          } else if (signatureType === 'employee') {
            handleEmployeeSignature(sig);
          } else {
            handleWitnessSignature(sig);
          }
          setActiveSignatureModal(null);
        }}
        onClose={() => setActiveSignatureModal(null)}
        initialSignature={
          activeSignatureModal === 'manager'
            ? signatures.manager
            : signatureType === 'employee'
              ? signatures.employee
              : signatures.witness
        }
      />
    )}
  </div>
);
