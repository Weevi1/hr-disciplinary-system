// frontend/src/components/warnings/enhanced/steps/LegalReviewSignaturesStep.tsx
// 🏆 LEGAL REVIEW & SIGNATURES STEP - CONFIDENCE LOGIC REMOVED
// ✅ Clean, complete component without duplicated code
// ✅ All signature functionality preserved

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scale, FileText, AlertTriangle, CheckCircle, Users, Clock, Shield,
  Eye, EyeOff, ChevronDown, ChevronUp, Info, Calendar, User, PenTool,
  Loader2, RefreshCw, MessageCircle, Volume2, Send
} from 'lucide-react';
import type { EscalationRecommendation } from '../../../../services/WarningService';

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

interface LegalReviewSignaturesStepProps {
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

export const LegalReviewSignaturesStep: React.FC<LegalReviewSignaturesStepProps> = ({
  lraRecommendation, selectedEmployee, formData, currentManagerName, onSignaturesComplete,
  isAnalyzing = false, signaturesFinalized = false, currentSignatures
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [scriptReadConfirmed, setScriptReadConfirmed] = useState(false);
  const [readingScript, setReadingScript] = useState(false);
  const [showSignatureSection, setShowSignatureSection] = useState(false);
  const [signatures, setSignatures] = useState<SignatureData>(currentSignatures || { manager: null, employee: null });
  const [isSigningManager, setIsSigningManager] = useState(false);
  const [isSigningEmployee, setIsSigningEmployee] = useState(false);

  const managerCanvasRef = useRef<HTMLCanvasElement>(null);
  const employeeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { if (currentSignatures) setSignatures(currentSignatures); }, [currentSignatures]);
  useEffect(() => { if (scriptReadConfirmed) setShowSignatureSection(true); }, [scriptReadConfirmed]);

  const safeRecommendation = lraRecommendation;
  const safeEmployee = selectedEmployee || {
    id: 'unknown', firstName: 'Unknown', lastName: 'Employee', position: 'Unknown Position',
    department: 'Unknown Department', email: 'unknown@email.com', phone: 'Unknown',
    deliveryPreference: 'email' as const, recentWarnings: { count: 0 }, riskIndicators: { highRisk: false, reasons: [] }
  };
  const allSignaturesComplete = !!(signatures.manager && signatures.employee);

  const startSigning = (canvasRef: React.RefObject<HTMLCanvasElement>, type: 'manager' | 'employee') => {
    if (signaturesFinalized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Premium signature styling
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    // Add subtle shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;
    
    let isDrawing = false;
    
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    
    const stopDrawing = () => { isDrawing = false; ctx.beginPath(); };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  };

  const clearSignature = (canvasRef: React.RefObject<HTMLCanvasElement>, type: 'manager' | 'employee') => {
    if (signaturesFinalized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatures(prev => ({ ...prev, [type]: null }));
  };

  const saveSignature = (canvasRef: React.RefObject<HTMLCanvasElement>, type: 'manager' | 'employee') => {
    if (signaturesFinalized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    setSignatures(prev => ({ ...prev, [type]: dataURL }));
    if (type === 'manager') setIsSigningManager(false);
    else setIsSigningEmployee(false);
  };

  const handleScriptReadConfirmation = () => {
    setReadingScript(true);
    setTimeout(() => { setScriptReadConfirmed(true); setReadingScript(false); }, 1500);
  };

  const handleCompleteSignatures = useCallback(() => {
    if (!allSignaturesComplete || signaturesFinalized) return;
    const finalSignatures = {
      ...signatures,
      timestamp: new Date().toISOString(),
      managerName: currentManagerName,
      employeeName: `${safeEmployee.firstName} ${safeEmployee.lastName}`
    };
    onSignaturesComplete(finalSignatures, true);
  }, [signatures, allSignaturesComplete, signaturesFinalized, currentManagerName, safeEmployee, onSignaturesComplete]);

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
      {/* LRA Recommendation Display - NO CONFIDENCE */}
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
          <button onClick={() => setShowDetails(!showDetails)} className="flex items-center space-x-2 px-3 py-1 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
            <span className="text-sm font-medium text-purple-700">{showDetails ? 'Hide Details' : 'Show Details'}</span>
            {showDetails ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
          </button>
        </div>

        <div className="bg-white rounded-lg border border-purple-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                  {safeText(safeRecommendation?.recommendedLevel)}
                </div>
                {safeRecommendation?.isEscalation && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">Escalation</div>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{safeText(safeRecommendation?.reason)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-purple-600">{safeRecommendation?.warningCount || 0}</div>
            <div className="text-sm text-gray-600">Total Active</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-lg font-bold text-orange-600">{safeRecommendation?.categoryWarningCount ?? (safeRecommendation?.activeWarnings?.length || 0)}</div>
            <div className="text-sm text-gray-600">This Category</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-indigo-600">{safeRecommendation?.isEscalation ? 'Yes' : 'No'}</div>
            <div className="text-sm text-gray-600">Escalation Required</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-lg font-bold text-green-600">{safeText(safeRecommendation?.category)}</div>
            <div className="text-sm text-gray-600">Category</div>
          </div>
        </div>

        {/* Escalation Details - Category-Specific */}
        {safeRecommendation?.isEscalation && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-2">Progressive Discipline Escalation</h4>
                <p className="text-sm text-amber-700 mb-3">
                  This warning level was determined based on previous warnings in this specific category.
                  {safeRecommendation.activeWarnings && safeRecommendation.activeWarnings.length > 0 && (
                    <span> Previous category warnings require escalation to the next disciplinary level.</span>
                  )}
                </p>
                {safeRecommendation.activeWarnings && safeRecommendation.activeWarnings.length > 0 && (
                  <div className="bg-white/70 rounded p-3">
                    <p className="text-xs font-medium text-amber-800 mb-2">Previous warnings in this category:</p>
                    <ul className="space-y-1 text-xs text-amber-700">
                      {safeRecommendation.activeWarnings.slice(0, 3).map((warning: any, index: number) => (
                        <li key={index} className="flex justify-between">
                          <span>{warning.level || 'Warning'}</span>
                          <span>{warning.date ? new Date(warning.date).toLocaleDateString() : 'Recent'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showDetails && (
          <div className="space-y-4 border-t border-purple-200 pt-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
              <p className="text-sm text-gray-700">{safeText(safeRecommendation?.reason || safeRecommendation?.explanation, 'No summary available')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Legal Basis</h5>
                <p className="text-sm text-gray-700">{safeText(safeRecommendation?.legalBasis)}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Escalation Reason</h5>
                <p className="text-sm text-gray-700">{safeText(safeRecommendation?.explanation, 'Standard progressive discipline applied')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pre-Signature Warning Explanation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <MessageCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Warning Explanation Before Signing</h3>
            <p className="text-sm text-gray-600">Required explanation before signature collection</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Pre-Signature Warning Explanation:</h4>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-700">1</span>
                </div>
                <p className="text-gray-800 leading-relaxed">
                  {safeEmployee.firstName}, before we proceed with signatures, let me explain what this warning entails. 
                  This is a <strong>{safeText(safeRecommendation?.recommendedLevel)}</strong> for the incident that occurred on{' '}
                  <strong>{formData.incidentDate}</strong> at <strong>{safeText(formData.incidentLocation, 'the workplace')}</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">2</span>
                </div>
                <p className="text-gray-800 leading-relaxed">
                  The incident involved: <strong>{safeText(formData.incidentDescription, 'the reported misconduct')}</strong>.
                  {(safeRecommendation?.warningCount || 0) > 0 && (
                    <> You currently have <strong>{safeRecommendation?.warningCount}</strong> active warning{(safeRecommendation?.warningCount || 0) > 1 ? 's' : ''} on your record.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-700">3</span>
                </div>
                <p className="text-gray-800 leading-relaxed">
                  This warning is valid for <strong>{formData.validityPeriod} months</strong> from today's date. 
                  During this period, any similar incidents may result in further disciplinary action.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-700">4</span>
                </div>
                <p className="text-gray-800 leading-relaxed">
                  By signing this warning, you acknowledge that you have received and understood this disciplinary action. 
                  Your signature does not necessarily mean you agree with the decision, but confirms you have been informed 
                  of the warning and its implications. You have the right to appeal this decision within 48 hours 
                  if you believe it is unfair or incorrect.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!scriptReadConfirmed && (
          <div className="flex justify-center">
            <button onClick={handleScriptReadConfirmation} disabled={readingScript}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {readingScript ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Reading Script...</span></>
              ) : (
                <><Volume2 className="w-4 h-4" /><span>I Have Read This Script to the Employee</span></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Signature Collection */}
      {showSignatureSection && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PenTool className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Digital Signatures</h3>
              <p className="text-sm text-gray-600">Both parties must sign to complete the warning process</p>
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
              
              {!isSigningManager ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-blue-200 p-8 text-center">
                  {signatures.manager ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Signature Captured</p>
                        <p className="text-sm text-green-600">Manager signature completed</p>
                      </div>
                      <button onClick={() => setIsSigningManager(true)} disabled={signaturesFinalized}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm ${signaturesFinalized ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {signaturesFinalized ? 'Finalized' : 'Update Signature'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <PenTool className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Ready to Sign</p>
                        <p className="text-sm text-gray-600">Click below to open signature pad</p>
                      </div>
                      <button onClick={() => setIsSigningManager(true)} disabled={signaturesFinalized}
                        className={`px-6 py-3 rounded-lg transition-colors font-medium ${signaturesFinalized ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'}`}
                      >
                        {signaturesFinalized ? 'Signatures Finalized' : 'Sign as Manager'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-lg">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <PenTool className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-gray-800">Manager Signature Required</p>
                      </div>
                      <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Touch or click to sign</p>
                    </div>
                    
                    {/* Premium Signature Pad */}
                    <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-300 rounded-xl p-4 shadow-inner transition-all duration-300 hover:shadow-lg">
                      {/* Signature line and guidance */}
                      <div className="absolute inset-4 flex items-end pb-8 pointer-events-none">
                        <div className="w-full border-b-2 border-dashed border-blue-200 relative">
                          <span className="absolute -bottom-6 left-0 text-xs text-gray-400">Sign above this line</span>
                        </div>
                      </div>
                      
                      <canvas ref={managerCanvasRef} width={500} height={200}
                        className="w-full h-32 cursor-crosshair bg-transparent rounded-lg transition-all duration-200 hover:bg-blue-50/30"
                        onMouseDown={() => startSigning(managerCanvasRef, 'manager')}
                        onTouchStart={() => startSigning(managerCanvasRef, 'manager')}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(243,244,246,0.7) 100%)',
                          backdropFilter: 'blur(1px)'
                        }}
                      />
                      
                      {/* Signature area enhancement */}
                      <div className="absolute top-4 right-4 pointer-events-none">
                        <div className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                          {signatures.manager ? '✓ Signed' : 'Awaiting signature'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button onClick={() => clearSignature(managerCanvasRef, 'manager')} disabled={signaturesFinalized}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Clear</span>
                    </button>
                    
                    <div className="flex space-x-2">
                      <button onClick={() => setIsSigningManager(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button onClick={() => saveSignature(managerCanvasRef, 'manager')} disabled={signaturesFinalized}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Save Signature</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Employee Signature */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-green-600" />
                  <span>Employee Signature</span>
                </h4>
                <div className="text-xs text-gray-500">{safeEmployee.firstName} {safeEmployee.lastName}</div>
              </div>
              
              {!isSigningEmployee ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-green-200 p-8 text-center">
                  {signatures.employee ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Signature Captured</p>
                        <p className="text-sm text-green-600">Employee signature completed</p>
                      </div>
                      <button onClick={() => setIsSigningEmployee(true)} disabled={signaturesFinalized}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm ${signaturesFinalized ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {signaturesFinalized ? 'Finalized' : 'Update Signature'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <PenTool className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Ready to Sign</p>
                        <p className="text-sm text-gray-600">Click below to open signature pad</p>
                      </div>
                      <button onClick={() => setIsSigningEmployee(true)} disabled={signaturesFinalized}
                        className={`px-6 py-3 rounded-lg transition-colors font-medium ${signaturesFinalized ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'}`}
                      >
                        {signaturesFinalized ? 'Signatures Finalized' : 'Sign as Employee'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-lg">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <PenTool className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-semibold text-gray-800">Employee Signature Required</p>
                      </div>
                      <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Touch or click to sign</p>
                    </div>
                    
                    {/* Premium Signature Pad */}
                    <div className="relative bg-gradient-to-br from-green-50 via-white to-green-50 border-2 border-green-300 rounded-xl p-4 shadow-inner transition-all duration-300 hover:shadow-lg">
                      {/* Signature line and guidance */}
                      <div className="absolute inset-4 flex items-end pb-8 pointer-events-none">
                        <div className="w-full border-b-2 border-dashed border-green-200 relative">
                          <span className="absolute -bottom-6 left-0 text-xs text-gray-400">Sign above this line</span>
                        </div>
                      </div>
                      
                      <canvas ref={employeeCanvasRef} width={500} height={200}
                        className="w-full h-32 cursor-crosshair bg-transparent rounded-lg transition-all duration-200 hover:bg-green-50/30"
                        onMouseDown={() => startSigning(employeeCanvasRef, 'employee')}
                        onTouchStart={() => startSigning(employeeCanvasRef, 'employee')}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(243,244,246,0.7) 100%)',
                          backdropFilter: 'blur(1px)'
                        }}
                      />
                      
                      {/* Signature area enhancement */}
                      <div className="absolute top-4 right-4 pointer-events-none">
                        <div className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                          {signatures.employee ? '✓ Signed' : 'Awaiting signature'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button onClick={() => clearSignature(employeeCanvasRef, 'employee')} disabled={signaturesFinalized}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Clear</span>
                    </button>
                    
                    <div className="flex space-x-2">
                      <button onClick={() => setIsSigningEmployee(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button onClick={() => saveSignature(employeeCanvasRef, 'employee')} disabled={signaturesFinalized}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Save Signature</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signature Status & Completion */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className={`flex items-center space-x-2 ${signatures.manager ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`w-5 h-5 ${signatures.manager ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Manager Signed</span>
                </div>
                <div className={`flex items-center space-x-2 ${signatures.employee ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className={`w-5 h-5 ${signatures.employee ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Employee Signed</span>
                </div>
              </div>

              {signaturesFinalized && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Signatures Finalized</span>
                </div>
              )}
            </div>

            {allSignaturesComplete && (
              <div className="text-center">
                {!signaturesFinalized ? (
                  <button onClick={handleCompleteSignatures}
                    className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <CheckCircle className="w-6 h-6" />
                    <span>Finalize Signatures & Enable Next Step</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center space-x-3 text-green-700 bg-green-50 rounded-xl p-4 border-2 border-green-200">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">Signatures finalized - You can now proceed to the next step</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">
                  Both signatures collected • {new Date().toLocaleString()}
                  {signaturesFinalized && " • Finalized and secured"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Steps Preview */}
      {scriptReadConfirmed && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">What Happens Next</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Document Generation</span>
              </div>
              <p className="text-xs text-blue-700">
                Warning document will be automatically generated with all details and signatures
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Delivery Options</span>
              </div>
              <p className="text-xs text-blue-700">
                Choose how to deliver the warning: email, WhatsApp, or printed copy
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Record Keeping</span>
              </div>
              <p className="text-xs text-blue-700">
                All documents will be securely stored in the employee's disciplinary file
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Compliance Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Legal Compliance Notice</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              This warning process complies with South African Labour Relations Act (LRA) requirements. 
              Both parties have been given the opportunity to review and respond to this disciplinary action. 
              All signatures are digitally recorded with timestamps for legal purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};