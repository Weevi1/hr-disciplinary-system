/**
 * Secure Banking Details Component
 * Shows masked banking details with option to reveal for authorized users
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Copy, Check } from 'lucide-react';
import { EncryptionService } from '../../services/EncryptionService';
import { PIIAccessLogger } from '../../services/PIIAccessLogger';
import Logger from '../../utils/logger';

interface SecureBankingDetailsProps {
  resellerId: string;
  encryptedBankDetails: any;
  isAuthorized?: boolean; // Whether user can view full details
}

export const SecureBankingDetails: React.FC<SecureBankingDetailsProps> = ({
  resellerId,
  encryptedBankDetails,
  isAuthorized = false
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [decryptedDetails, setDecryptedDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleRevealToggle = async () => {
    if (!isAuthorized) {
      alert('Access denied: Insufficient permissions to view banking details');
      return;
    }

    if (!isRevealed) {
      setLoading(true);
      try {
        // Log access for compliance
        await PIIAccessLogger.logBankingAccess(resellerId, 'view', 'Admin viewing banking details');

        // Decrypt details
        const decrypted = EncryptionService.decryptBankingDetails(encryptedBankDetails);
        setDecryptedDetails(decrypted);
        setIsRevealed(true);

        Logger.info('Banking details accessed by authorized user', { resellerId });

        // Auto-hide after 30 seconds for security
        setTimeout(() => {
          setIsRevealed(false);
          setDecryptedDetails(null);
        }, 30000);

      } catch (error) {
        Logger.error('Failed to decrypt banking details:', error);
        alert('Error decrypting banking details. Please contact IT support.');
      } finally {
        setLoading(false);
      }
    } else {
      setIsRevealed(false);
      setDecryptedDetails(null);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    if (!isRevealed || !decryptedDetails) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);

      // Log copy action for security audit
      await PIIAccessLogger.logBankingAccess(resellerId, 'view', `Copied ${field} to clipboard`);

      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      Logger.error('Failed to copy to clipboard:', error);
    }
  };

  // Get masked details for display
  const maskedDetails = EncryptionService.getMaskedBankingDetails(encryptedBankDetails);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900">Banking Details</span>
          {isRevealed && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Auto-hide in 30s
            </span>
          )}
        </div>

        {isAuthorized && (
          <button
            onClick={handleRevealToggle}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
            ) : isRevealed ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {loading ? 'Decrypting...' : isRevealed ? 'Hide' : 'Reveal'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Account Holder - always visible */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Account Holder</label>
          <div className="bg-white px-3 py-2 rounded border">
            {maskedDetails.accountHolder}
          </div>
        </div>

        {/* Bank - always visible */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Bank</label>
          <div className="bg-white px-3 py-2 rounded border">
            {maskedDetails.bank}
          </div>
        </div>

        {/* Account Number - sensitive */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Account Number</label>
          <div className="bg-white px-3 py-2 rounded border flex items-center justify-between">
            <span className="font-mono">
              {isRevealed && decryptedDetails ? decryptedDetails.accountNumber : maskedDetails.accountNumber}
            </span>
            {isRevealed && decryptedDetails && (
              <button
                onClick={() => copyToClipboard(decryptedDetails.accountNumber, 'accountNumber')}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                title="Copy account number"
              >
                {copied === 'accountNumber' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Branch Code - sensitive */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Branch Code</label>
          <div className="bg-white px-3 py-2 rounded border flex items-center justify-between">
            <span className="font-mono">
              {isRevealed && decryptedDetails ? decryptedDetails.branchCode : maskedDetails.branchCode}
            </span>
            {isRevealed && decryptedDetails && (
              <button
                onClick={() => copyToClipboard(decryptedDetails.branchCode, 'branchCode')}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                title="Copy branch code"
              >
                {copied === 'branchCode' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {!isAuthorized && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Banking details are encrypted and require elevated permissions to view
        </div>
      )}

      {isRevealed && (
        <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          ⚠️ Sensitive data visible - This access is being logged for security compliance
        </div>
      )}
    </div>
  );
};

export default SecureBankingDetails;