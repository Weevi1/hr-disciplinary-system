// frontend/src/components/reseller/demos/ProspectLoginModal.tsx
// Two-step modal: (1) collect optional prospect details, (2) show generated credentials.
// Credentials display is the ONLY time the password is visible — reseller must copy it.

import React, { useState } from 'react';
import { UserPlus, Copy, Check, AlertTriangle, Loader2, KeyRound } from 'lucide-react';
import { UnifiedModal } from '../../common/UnifiedModal';
import {
  ResellerDemoService,
  CreateProspectLoginResult
} from '../../../services/ResellerDemoService';
import Logger from '../../../utils/logger';

interface ProspectLoginModalProps {
  isOpen: boolean;
  orgId: string;
  orgName: string;
  onClose: () => void;
  onCreated: () => void;
}

export const ProspectLoginModal: React.FC<ProspectLoginModalProps> = ({
  isOpen,
  orgId,
  orgName,
  onClose,
  onCreated
}) => {
  const [step, setStep] = useState<'input' | 'output'>('input');
  const [prospectEmail, setProspectEmail] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [credentials, setCredentials] = useState<CreateProspectLoginResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | 'both' | null>(null);

  const resetState = () => {
    setStep('input');
    setProspectEmail('');
    setProspectName('');
    setCredentials(null);
    setLoading(false);
    setError(null);
    setAcknowledged(false);
    setCopiedField(null);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerDemoService.createProspectLogin(
        orgId,
        prospectEmail.trim() || undefined,
        prospectName.trim() || undefined
      );
      setCredentials(result);
      setStep('output');
      onCreated();
    } catch (err: any) {
      Logger.error('Prospect login creation failed:', err);
      setError(err?.message || 'Failed to create prospect login');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    if (step === 'output' && !acknowledged) return; // force acknowledgement
    resetState();
    onClose();
  };

  const copy = async (value: string, field: 'email' | 'password' | 'both') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      Logger.error('Clipboard copy failed:', err);
    }
  };

  // STEP 1 — input
  if (step === 'input') {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={handleClose}
        title="New Prospect Login"
        subtitle={`Create a temporary login for ${orgName}`}
        size="md"
        primaryAction={{
          label: loading ? 'Creating…' : 'Generate Login',
          onClick: handleCreate,
          disabled: loading,
          loading,
          variant: 'primary'
        }}
        secondaryAction={{ label: 'Cancel', onClick: handleClose }}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How this works</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                <li>A new login is created scoped to this demo only</li>
                <li>The password is shown once — copy it before closing</li>
                <li>All prospect logins are revoked when you reset the demo</li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prospect Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={prospectName}
              onChange={e => setProspectName(e.target.value)}
              placeholder="e.g. Jane Smith"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prospect Email <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={prospectEmail}
              onChange={e => setProspectEmail(e.target.value)}
              placeholder="Leave blank to auto-generate"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              If left blank, we'll generate a unique demo email for you.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Provisioning login…</span>
            </div>
          )}
        </div>
      </UnifiedModal>
    );
  }

  // STEP 2 — output (credentials)
  const combined = credentials
    ? `Email: ${credentials.email}\nPassword: ${credentials.password}`
    : '';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Prospect Login Ready"
      subtitle="Copy these credentials now — the password cannot be retrieved later"
      size="md"
      primaryAction={{
        label: 'Done',
        onClick: handleClose,
        disabled: !acknowledged,
        variant: 'primary'
      }}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">This password is only shown once.</p>
            <p className="text-amber-800 mt-1">
              If you close this dialog without copying it, you'll have to delete this login and
              create a new one.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-gray-200">
            <div className="flex items-center justify-between p-3 bg-gray-50">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                <div className="font-mono text-sm truncate text-gray-900">
                  {credentials?.email}
                </div>
              </div>
              <button
                onClick={() => copy(credentials!.email, 'email')}
                className="ml-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Password</div>
                <div className="font-mono text-sm text-gray-900">{credentials?.password}</div>
              </div>
              <button
                onClick={() => copy(credentials!.password, 'password')}
                className="ml-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => copy(combined, 'both')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {copiedField === 'both' ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Both copied to clipboard
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Copy both to clipboard
            </>
          )}
        </button>

        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-1"
          />
          <span>
            I've copied the credentials somewhere safe. I understand the password cannot be shown
            again.
          </span>
        </label>
      </div>
    </UnifiedModal>
  );
};
