// frontend/src/components/warnings/enhanced/phases/DeliveryPhase.tsx
//
// Delivery phase (phase 9 / final) of UnifiedWarningWizard. Extracted in
// Phase 2 Tier 3C step 2. Behaviour is byte-identical to the original
// switch-case block — only the JSX has been relocated; state and handlers
// remain owned by the wizard and are passed in via props.

import React from 'react';
import {
  Mail,
  Send,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Lock,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { ThemedAlert } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';
import type { Employee } from '../wizardTypes';

export type EmailDeliveryStatus =
  | 'idle'
  | 'generating_pdf'
  | 'uploading_pdf'
  | 'sending_email'
  | 'success'
  | 'failed';

interface DeliveryPhaseProps {
  selectedEmployee: Employee | undefined;
  selectedDeliveryMethod: string;
  setSelectedDeliveryMethod: (method: string) => void;
  finalWarningId: string;
  audioUploadWarning: boolean;
  evidenceUploadWarning: boolean;
  isEmailDelivering: boolean;
  emailDeliveryStatus: EmailDeliveryStatus;
  setEmailDeliveryStatus: (status: EmailDeliveryStatus) => void;
  emailDeliveryError: string | null;
  setEmailDeliveryError: (error: string | null) => void;
  useAlternativeEmail: boolean;
  setUseAlternativeEmail: (value: boolean) => void;
  alternativeEmail: string;
  setAlternativeEmail: (value: string) => void;
  isGeneratingQRPdf: boolean;
  handleQRCodeDelivery: () => void;
  handleEmailDelivery: () => void;
  whatsappNumber: string;
  setWhatsappNumber: (value: string) => void;
  whatsappConfirmed: boolean;
  setWhatsappConfirmed: (value: boolean) => void;
  isWhatsAppDelivering: boolean;
  whatsappDeliveryStatus: 'idle' | 'generating_link' | 'opened' | 'sent' | 'failed';
  whatsappDeliveryError: string | null;
  isValidWhatsappNumber: boolean;
  handleWhatsAppDelivery: () => void;
  handleConfirmWhatsAppSent: () => void;
  isPrintedDelivering: boolean;
  printedDeliveryStatus: 'idle' | 'sending' | 'sent' | 'failed';
  printedDeliveryError: string | null;
  handlePrintedDelivery: () => void;
}

export const DeliveryPhase: React.FC<DeliveryPhaseProps> = ({
  selectedEmployee,
  selectedDeliveryMethod,
  setSelectedDeliveryMethod,
  finalWarningId,
  audioUploadWarning,
  evidenceUploadWarning,
  isEmailDelivering,
  emailDeliveryStatus,
  setEmailDeliveryStatus,
  emailDeliveryError,
  setEmailDeliveryError,
  useAlternativeEmail,
  setUseAlternativeEmail,
  alternativeEmail,
  setAlternativeEmail,
  isGeneratingQRPdf,
  handleQRCodeDelivery,
  handleEmailDelivery,
  whatsappNumber,
  setWhatsappNumber,
  whatsappConfirmed,
  setWhatsappConfirmed,
  isWhatsAppDelivering,
  whatsappDeliveryStatus,
  whatsappDeliveryError,
  isValidWhatsappNumber,
  handleWhatsAppDelivery,
  handleConfirmWhatsAppSent,
  isPrintedDelivering,
  printedDeliveryStatus,
  printedDeliveryError,
  handlePrintedDelivery,
}) => {
  const employeeEmailOnRecord = selectedEmployee?.profile?.email || (selectedEmployee as any)?.email || '';
  const showEmailPanel = selectedDeliveryMethod === 'email';
  const showWhatsAppPanel = selectedDeliveryMethod === 'whatsapp';
  const showPrintedPanel = selectedDeliveryMethod === 'printed';
  const employeeFirstName = selectedEmployee?.profile?.firstName || 'the employee';
  const needsAlternativeEmail = !employeeEmailOnRecord || useAlternativeEmail;
  const isValidAlternativeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alternativeEmail);

  const emailStatusMessages: Record<string, string> = {
    generating_pdf: 'Generating PDF document...',
    uploading_pdf: 'Uploading PDF to secure storage...',
    sending_email: needsAlternativeEmail ? 'Notifying HR...' : 'Sending email to employee...',
  };

  return (
    <div className="space-y-4">
      <ThemedAlert variant="success">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Warning saved successfully! ID: {finalWarningId}</span>
        </div>
      </ThemedAlert>

      {audioUploadWarning && (
        <ThemedAlert variant="warning">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Audio recording failed to upload. The warning was saved without audio.</span>
          </div>
        </ThemedAlert>
      )}

      {evidenceUploadWarning && (
        <ThemedAlert variant="warning">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>Evidence files failed to upload. The warning was saved without evidence attachments.</span>
          </div>
        </ThemedAlert>
      )}

      {/* Delivery method cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'email', label: 'Email', icon: Mail },
          { key: 'whatsapp', label: 'WhatsApp', icon: Send },
          { key: 'printed', label: 'Printed', icon: FileText },
          { key: 'qr', label: 'QR Code', icon: Eye },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'qr') {
                handleQRCodeDelivery();
              } else {
                setSelectedDeliveryMethod(key);
                // Reset email state when switching methods
                if (key !== 'email') {
                  setEmailDeliveryStatus('idle');
                  setEmailDeliveryError(null);
                }
              }
            }}
            disabled={(key === 'qr' && isGeneratingQRPdf) || isEmailDelivering || isWhatsAppDelivering || isPrintedDelivering}
            className={`
              p-4 rounded-lg border text-center transition-all flex flex-col items-center gap-2
              ${selectedDeliveryMethod === key ? 'ring-2' : ''}
              ${(key === 'qr' && isGeneratingQRPdf) || isEmailDelivering || isWhatsAppDelivering || isPrintedDelivering ? 'opacity-50 cursor-wait' : ''}
            `}
            style={{
              borderColor: selectedDeliveryMethod === key
                ? 'var(--color-primary)'
                : 'var(--color-border)',
              backgroundColor: selectedDeliveryMethod === key
                ? 'var(--color-primary-light)'
                : 'var(--color-background)'
            }}
          >
            <Icon className="w-5 h-5" style={{ color: selectedDeliveryMethod === key ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {key === 'qr' && isGeneratingQRPdf ? 'Generating...' : label}
            </span>
          </button>
        ))}
      </div>

      {/* Email expanded panel */}
      {showEmailPanel && emailDeliveryStatus !== 'success' && (
        <div
          className="rounded-lg border p-4 space-y-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
        >
          {/* Active delivery progress */}
          {isEmailDelivering && emailStatusMessages[emailDeliveryStatus] && (
            <div className="flex items-center gap-3 py-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {emailStatusMessages[emailDeliveryStatus]}
              </span>
            </div>
          )}

          {/* Error state */}
          {emailDeliveryStatus === 'failed' && emailDeliveryError && (
            <ThemedAlert variant="error">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{emailDeliveryError}</span>
                </div>
                <button
                  onClick={() => {
                    setEmailDeliveryStatus('idle');
                    setEmailDeliveryError(null);
                  }}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            </ThemedAlert>
          )}

          {/* Idle state - show email options */}
          {!isEmailDelivering && emailDeliveryStatus !== 'failed' && (
            <>
              {!needsAlternativeEmail ? (
                /* Employee has email on record */
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary-light)' }}
                  >
                    <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Employee email on record</p>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {employeeEmailOnRecord}
                      </p>
                    </div>
                  </div>

                  <ThemedButton
                    onClick={handleEmailDelivery}
                    icon={Mail}
                    className="w-full"
                  >
                    Send Warning via Email
                  </ThemedButton>

                  <button
                    onClick={() => setUseAlternativeEmail(true)}
                    className="w-full text-xs text-center py-1 hover:underline"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Use a different email instead
                  </button>
                </div>
              ) : (
                /* No email on record or manager wants alternative */
                <div className="space-y-3">
                  {useAlternativeEmail && employeeEmailOnRecord && (
                    <button
                      onClick={() => {
                        setUseAlternativeEmail(false);
                        setAlternativeEmail('');
                      }}
                      className="text-xs hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      &larr; Use employee email on record ({employeeEmailOnRecord})
                    </button>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {employeeEmailOnRecord ? 'Alternative email address' : 'Employee email address'}
                    </label>
                    <input
                      type="email"
                      value={alternativeEmail}
                      onChange={(e) => setAlternativeEmail(e.target.value)}
                      placeholder="employee@example.com"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-input-bg)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>

                  <ThemedAlert variant="info">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">HR will be notified to deliver the warning to this email address.</span>
                    </div>
                  </ThemedAlert>

                  <ThemedButton
                    onClick={handleEmailDelivery}
                    disabled={!isValidAlternativeEmail}
                    icon={Send}
                    className="w-full"
                    variant="outline"
                  >
                    Notify HR for Manual Delivery
                  </ThemedButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Email success state */}
      {showEmailPanel && emailDeliveryStatus === 'success' && (
        <div
          className="rounded-lg border p-4 text-center space-y-2"
          style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4' }}
        >
          <CheckCircle className="w-8 h-8 mx-auto" style={{ color: '#16a34a' }} />
          <p className="text-sm font-medium" style={{ color: '#166534' }}>
            {needsAlternativeEmail
              ? `HR has been notified to deliver the warning to ${alternativeEmail}`
              : `Email sent to ${employeeEmailOnRecord}`
            }
          </p>
        </div>
      )}

      {/* WhatsApp expanded panel */}
      {showWhatsAppPanel && whatsappDeliveryStatus !== 'sent' && (
        <div
          className="rounded-lg border p-4 space-y-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
        >
          <ThemedAlert variant="info">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">
                WhatsApp can't attach the PDF directly, so the employee receives a secure link to
                view the warning and submit a response or appeal. The link stays valid for 6 months.
              </span>
            </div>
          </ThemedAlert>

          {/* Editable, verified number */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Employee WhatsApp number
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              disabled={whatsappDeliveryStatus === 'opened' || isWhatsAppDelivering}
              placeholder="+27 82 555 1234"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-input-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
            {whatsappNumber.length > 0 && !isValidWhatsappNumber && (
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                Enter a valid number (e.g. 082 555 1234 or +27 82 555 1234).
              </p>
            )}
          </div>

          {/* Verification checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappConfirmed}
              onChange={(e) => setWhatsappConfirmed(e.target.checked)}
              disabled={whatsappDeliveryStatus === 'opened' || isWhatsAppDelivering}
              className="mt-0.5"
            />
            <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
              I confirmed this number with the employee.
            </span>
          </label>

          {/* Error state */}
          {whatsappDeliveryStatus === 'failed' && whatsappDeliveryError && (
            <ThemedAlert variant="error">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{whatsappDeliveryError}</span>
              </div>
            </ThemedAlert>
          )}

          {/* Step 1: open WhatsApp */}
          {whatsappDeliveryStatus !== 'opened' ? (
            <ThemedButton
              onClick={handleWhatsAppDelivery}
              disabled={!isValidWhatsappNumber || !whatsappConfirmed || isWhatsAppDelivering}
              loading={isWhatsAppDelivering}
              icon={MessageCircle}
              className="w-full"
            >
              {isWhatsAppDelivering ? 'Generating link...' : 'Open WhatsApp'}
            </ThemedButton>
          ) : (
            /* Step 2: confirm it was sent */
            <div className="space-y-3">
              <ThemedAlert variant="info">
                <div className="flex items-start gap-2">
                  <Send className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">
                    WhatsApp should have opened with the message ready. Press send there, then
                    confirm below. Didn't open?{' '}
                    <button onClick={handleWhatsAppDelivery} className="underline" style={{ color: 'var(--color-primary)' }}>
                      Try again
                    </button>
                  </span>
                </div>
              </ThemedAlert>
              <ThemedButton
                onClick={handleConfirmWhatsAppSent}
                icon={CheckCircle}
                className="w-full"
              >
                I've sent it on WhatsApp
              </ThemedButton>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp success state */}
      {showWhatsAppPanel && whatsappDeliveryStatus === 'sent' && (
        <div
          className="rounded-lg border p-4 text-center space-y-2"
          style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4' }}
        >
          <CheckCircle className="w-8 h-8 mx-auto" style={{ color: '#16a34a' }} />
          <p className="text-sm font-medium" style={{ color: '#166534' }}>
            Warning sent to {whatsappNumber} via WhatsApp
          </p>
        </div>
      )}

      {/* Printed expanded panel */}
      {showPrintedPanel && printedDeliveryStatus !== 'sent' && (
        <div
          className="rounded-lg border p-4 space-y-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
        >
          <ThemedAlert variant="info">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">
                The employee collects a printed copy from HR. HR will be emailed that a copy is
                awaiting collection — they print it, hand it over, and record the collection.
              </span>
            </div>
          </ThemedAlert>

          {printedDeliveryStatus === 'failed' && printedDeliveryError && (
            <ThemedAlert variant="error">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{printedDeliveryError}</span>
              </div>
            </ThemedAlert>
          )}

          <ThemedButton
            onClick={handlePrintedDelivery}
            disabled={isPrintedDelivering}
            loading={isPrintedDelivering}
            icon={FileText}
            className="w-full"
          >
            {isPrintedDelivering ? 'Notifying HR...' : 'Notify HR & Finalize'}
          </ThemedButton>
        </div>
      )}

      {/* Printed success state */}
      {showPrintedPanel && printedDeliveryStatus === 'sent' && (
        <div
          className="rounded-lg border p-4 text-center space-y-2"
          style={{ borderColor: '#86efac', backgroundColor: '#f0fdf4' }}
        >
          <CheckCircle className="w-8 h-8 mx-auto" style={{ color: '#16a34a' }} />
          <p className="text-sm font-medium" style={{ color: '#166534' }}>
            HR notified — {employeeFirstName} can collect their printed copy from HR.
          </p>
        </div>
      )}
    </div>
  );
};
