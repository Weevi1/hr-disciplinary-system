// frontend/src/components/warnings/enhanced/steps/LegalReviewSignaturesStepV2.tsx
// 🎯 LEGAL REVIEW & SIGNATURES STEP V2 - REFACTORED WITH DIGITAL SIGNATURE PAD
// ✅ Fixed memory leaks using new DigitalSignaturePad component
// ✅ Improved mobile UX, signature validation, better error handling
// ✅ Cleaner code structure, proper cleanup

import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, FileText, CheckCircle, Users, Clock, Shield,
  Eye, EyeOff, ChevronDown, ChevronUp, Info, Calendar, User,
  Loader2, RefreshCw, MessageCircle, Volume2, Send, Play, Pause
} from 'lucide-react';
import type { EscalationRecommendation } from '../../../../services/WarningService';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { MultiLanguageWarningScript } from './components/MultiLanguageWarningScript';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  deliveryPreference: 'email' | 'whatsapp' | 'print';
  recentWarnings: { count: number; lastDate?: Date; lastCategory?: string; level?: string; };
  riskIndicators: { highRisk: boolean; reasons: string[]; };
}

interface FormData {
  employeeId: string | null;
  categoryId: string | null;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  additionalNotes?: string;
  issueDate: string;
  validityPeriod: 3 | 6 | 12;
}

interface SignatureData {
  manager: string | null;
  employee: string | null;
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
}

interface LegalReviewSignaturesStepV2Props {
  lraRecommendation: EscalationRecommendation | null;
  selectedEmployee: Employee | undefined;
  formData: FormData;
  currentManagerName: string;
  onSignaturesComplete: (signatures: SignatureData, finalized?: boolean) => void;
  isAnalyzing?: boolean;
  signaturesFinalized?: boolean;
  currentSignatures?: SignatureData;
}

const safeText = (value: any, fallback: string = 'Unknown'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return String(value.name);
  return String(value);
};

export const LegalReviewSignaturesStepV2: React.FC<LegalReviewSignaturesStepV2Props> = ({
  lraRecommendation,
  selectedEmployee,
  formData,
  currentManagerName,
  onSignaturesComplete,
  isAnalyzing = false,
  signaturesFinalized = false,
  currentSignatures
}) => {
  // State management
  const [showDetails, setShowDetails] = useState(false);
  const [scriptReadConfirmed, setScriptReadConfirmed] = useState(false);
  const [readingScript, setReadingScript] = useState(false);
  const [showSignatureSection, setShowSignatureSection] = useState(false);
  const [signatures, setSignatures] = useState<SignatureData>(
    currentSignatures || { manager: null, employee: null }
  );

  // Update signatures when currentSignatures prop changes
  useEffect(() => {
    if (currentSignatures) {
      setSignatures(currentSignatures);
    }
  }, [currentSignatures]);

  // Show signature section after script is confirmed
  useEffect(() => {
    if (scriptReadConfirmed) {
      setShowSignatureSection(true);
    }
  }, [scriptReadConfirmed]);

  // Safe employee fallback
  const safeEmployee = selectedEmployee || {
    id: 'unknown',
    firstName: 'Unknown',
    lastName: 'Employee',
    position: 'Unknown Position',
    department: 'Unknown Department',
    email: 'unknown@email.com',
    phone: 'Unknown',
    deliveryPreference: 'email' as const,
    recentWarnings: { count: 0 },
    riskIndicators: { highRisk: false, reasons: [] }
  };

  // Check if all signatures are complete
  const allSignaturesComplete = !!(signatures.manager && signatures.employee);

  // Handle script reading confirmation
  const handleScriptReadConfirmation = useCallback(() => {
    setReadingScript(true);
    setTimeout(() => {
      setScriptReadConfirmed(true);
      setReadingScript(false);
    }, 1500);
  }, []);

  // Handle signature completion from DigitalSignaturePad
  const handleManagerSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, manager: signature }));
  }, []);

  const handleEmployeeSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, employee: signature }));
  }, []);

  // Handle complete signatures and finalize
  const handleCompleteSignatures = useCallback(() => {
    if (!allSignaturesComplete || signaturesFinalized) return;
    
    const finalSignatures: SignatureData = {
      ...signatures,
      timestamp: new Date().toISOString(),
      managerName: currentManagerName,
      employeeName: `${safeEmployee.firstName} ${safeEmployee.lastName}`
    };
    
    onSignaturesComplete(finalSignatures, true);
  }, [signatures, allSignaturesComplete, signaturesFinalized, currentManagerName, safeEmployee, onSignaturesComplete]);

  // Show loading state during analysis
  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Analyzing legal requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LRA Recommendation Display */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">LRA Compliant Recommendation</h3>
              <p className="text-sm text-gray-600">Progressive discipline analysis complete</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-3 py-1 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span className="text-sm font-medium text-purple-700">
              {showDetails ? 'Hide Details' : 'Show Details'}
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-purple-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-600" />
            )}
          </button>
        </div>

        {/* Recommendation Summary */}
        <div className="bg-white rounded-lg border border-purple-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                  {safeText(lraRecommendation?.recommendedLevel)}
                </div>
                {lraRecommendation?.isEscalation && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                    Escalation
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {safeText(lraRecommendation?.reason)}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-purple-600">
              {lraRecommendation?.warningCount || 0}
            </div>
            <div className="text-sm text-gray-600">Total Active</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-lg font-bold text-orange-600">
              {lraRecommendation?.activeWarnings?.length || 0}
            </div>
            <div className="text-sm text-gray-600">This Category</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-indigo-600">
              {lraRecommendation?.isEscalation ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Escalation</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-green-600">
              {safeText(lraRecommendation?.category)}
            </div>
            <div className="text-sm text-gray-600">Category</div>
          </div>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-4 border-t border-purple-200 pt-4 mt-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
              <p className="text-sm text-gray-700">
                {safeText(lraRecommendation?.explanation || lraRecommendation?.reason, 'No detailed analysis available')}
              </p>
            </div>
            
            {/* Legal Requirements */}
            {lraRecommendation?.legalRequirements && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Legal Requirements</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {lraRecommendation.legalRequirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-Language Script Reading Section */}
      <MultiLanguageWarningScript
        employeeName={`${safeEmployee.firstName} ${safeEmployee.lastName}`}
        managerName={currentManagerName}
        incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
        warningLevel={lraRecommendation?.level || 'disciplinary'}
        onScriptRead={() => setScriptReadConfirmed(true)}
        disabled={scriptReadConfirmed}
      />

      {/* Digital Signatures Section */}
      {showSignatureSection && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Digital Signatures</h3>
              <p className="text-sm text-gray-600">Both manager and employee signatures are required</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Manager Signature */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Manager Signature</span>
                </h4>
                <div className="text-xs text-gray-500">{currentManagerName}</div>
              </div>

              <DigitalSignaturePad
                onSignatureComplete={handleManagerSignature}
                disabled={signaturesFinalized}
                label="Manager Digital Signature"
                placeholder="Manager: Click and drag to sign"
                initialSignature={signatures.manager}
                width={400}
                height={150}
              />
            </div>

            {/* Employee Signature */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-green-600" />
                  <span>Employee Signature</span>
                </h4>
                <div className="text-xs text-gray-500">
                  {safeEmployee.firstName} {safeEmployee.lastName}
                </div>
              </div>

              <DigitalSignaturePad
                onSignatureComplete={handleEmployeeSignature}
                disabled={signaturesFinalized}
                label="Employee Digital Signature"
                placeholder="Employee: Click and drag to sign"
                initialSignature={signatures.employee}
                width={400}
                height={150}
              />
            </div>
          </div>

          {/* Finalize Signatures */}
          {allSignaturesComplete && !signaturesFinalized && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800">Signatures Complete</h4>
                    <p className="text-sm text-green-600">
                      Both manager and employee have signed. Click to finalize the warning.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCompleteSignatures}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  Finalize Warning
                </button>
              </div>
            </div>
          )}

          {/* Finalized State */}
          {signaturesFinalized && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800">Warning Finalized</h4>
                  <p className="text-sm text-blue-600">
                    Signatures have been captured and the warning is ready for delivery.
                  </p>
                  {signatures.timestamp && (
                    <p className="text-xs text-blue-500 mt-1">
                      Completed: {new Date(signatures.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};