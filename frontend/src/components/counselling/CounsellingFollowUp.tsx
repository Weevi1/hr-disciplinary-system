// frontend/src/components/counselling/CounsellingFollowUp.tsx
// 📋 COUNSELLING FOLLOW-UP COMPONENT
// Allows managers to conduct follow-up reviews on counselling sessions

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, CheckCircle, AlertCircle, 
  Clock, ArrowLeft, UserCheck, X, RotateCcw, User, FileText
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CounsellingService } from '../../services/CounsellingService';
import type { 
  CorrectiveCounselling, 
  CounsellingFollowUp
} from '../../types/counselling';

// 🖊️ INLINE SIGNATURE CANVAS COMPONENT (reused from CorrectiveCounselling)
interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  label: string;
  required?: boolean;
}

const InlineSignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSignatureChange, 
  label, 
  required = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const dataURL = canvasRef.current.toDataURL();
      onSignatureChange(dataURL);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange('');
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-24 border border-dashed border-gray-400 rounded cursor-crosshair bg-gray-50"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        
        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {hasSignature ? 'Signature captured' : 'Click and drag to sign above'}
          </p>
          <button
            type="button"
            onClick={clearSignature}
            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            disabled={!hasSignature}
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

interface CounsellingFollowUpProps {
  counsellingSession: CorrectiveCounselling;
  onClose: () => void;
  onComplete: () => void;
}

export const CounsellingFollowUp: React.FC<CounsellingFollowUpProps> = ({ 
  counsellingSession, 
  onClose, 
  onComplete 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // 📝 FORM STATE
  const [improvementObserved, setImprovementObserved] = useState<boolean | null>(null);
  const [improvementDetails, setImprovementDetails] = useState('');
  const [additionalConcerns, setAdditionalConcerns] = useState('');
  const [nextAction, setNextAction] = useState<'continue_monitoring' | 'additional_training' | 'formal_warning' | 'no_further_action'>('continue_monitoring');
  const [nextActionDate, setNextActionDate] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [employeeFeedback, setEmployeeFeedback] = useState('');
  const [managerSignature, setManagerSignature] = useState<string>('');
  const [employeeSignature, setEmployeeSignature] = useState<string>('');
  const [employeeConsent, setEmployeeConsent] = useState<boolean | null>(null);
  const [showEmployeeSignature, setShowEmployeeSignature] = useState(false);
  
  // 🎯 UI STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'manager-sign' | 'employee-decision' | 'complete'>('review');

  // ✅ VALIDATE FORM
  const isFormValid = () => {
    return improvementObserved !== null &&
           managerNotes.trim().length >= 10 &&
           (improvementObserved === false ? improvementDetails.trim().length >= 10 : true) &&
           (nextAction !== 'no_further_action' ? nextActionDate : true);
  };

  // ✍️ HANDLE MANAGER SIGNATURE
  const handleManagerSignature = (signature: string) => {
    setManagerSignature(signature);
    if (signature) {
      setStep('employee-decision');
    }
  };

  // 👤 HANDLE EMPLOYEE DECISION
  const handleEmployeeDecision = (consent: boolean) => {
    setEmployeeConsent(consent);
    if (consent) {
      setShowEmployeeSignature(true);
    } else {
      // Employee declined - proceed without their signature
      submitFollowUp();
    }
  };

  // ✍️ HANDLE EMPLOYEE SIGNATURE
  const handleEmployeeSignature = (signature: string) => {
    setEmployeeSignature(signature);
    if (signature) {
      submitFollowUp();
    }
  };

  // 🚀 SUBMIT FOLLOW-UP
  const submitFollowUp = async () => {
    if (!user || !user.organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const followUpData: Omit<CounsellingFollowUp, 'id' | 'counsellingId' | 'createdDate'> = {
        followUpDate: new Date().toISOString(),
        improvementObserved: improvementObserved || false,
        improvementDetails: improvementDetails.trim(),
        additionalConcerns: additionalConcerns.trim(),
        nextAction,
        nextActionDate: nextActionDate || undefined,
        managerNotes: managerNotes.trim(),
        employeeFeedback: employeeFeedback.trim(),
        createdBy: user.id
      };

      await CounsellingService.createFollowUp(counsellingSession.id, followUpData);
      
      setStep('complete');

      // Auto redirect after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);

    } catch (err) {
      console.error('❌ Error submitting follow-up:', err);
      setError('Failed to submit follow-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 RENDER MAIN REVIEW FORM
  if (step === 'review') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-green-600" />
                Counselling Follow-up Review
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mt-2">Review progress and document outcomes</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Original Session Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Original Counselling Session
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Employee:</span>
                  <span className="ml-2 text-blue-600">{counsellingSession.employeeName}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Date:</span>
                  <span className="ml-2 text-blue-600">{new Date(counsellingSession.dateCreated).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Category:</span>
                  <span className="ml-2 text-blue-600">{counsellingSession.category}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Type:</span>
                  <span className="ml-2 text-blue-600 capitalize">{counsellingSession.counsellingType}</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium text-blue-700">Issue:</span>
                <p className="text-blue-600 text-sm mt-1">{counsellingSession.issueDescription}</p>
              </div>
              {counsellingSession.promisesToPerform.length > 0 && (
                <div className="mt-3">
                  <span className="font-medium text-blue-700">Promises to Perform:</span>
                  <ul className="text-blue-600 text-sm mt-1 space-y-1">
                    {counsellingSession.promisesToPerform.map((promise, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{promise.description} (Due: {new Date(promise.targetDate).toLocaleDateString()})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Improvement Assessment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Has the employee shown improvement? *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setImprovementObserved(true)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all ${
                    improvementObserved === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                  Yes, Improvement Noted
                </button>
                <button
                  type="button"
                  onClick={() => setImprovementObserved(false)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all ${
                    improvementObserved === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                  No, Concerns Remain
                </button>
              </div>
            </div>

            {/* Improvement Details */}
            {improvementObserved !== null && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {improvementObserved ? 'Improvement Details *' : 'Ongoing Concerns *'}
                </label>
                <textarea
                  value={improvementDetails}
                  onChange={(e) => setImprovementDetails(e.target.value)}
                  placeholder={
                    improvementObserved 
                      ? "Describe the specific improvements observed..."
                      : "Describe the ongoing concerns or lack of improvement..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  minLength={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {improvementDetails.length}/500 characters (minimum 10)
                </p>
              </div>
            )}

            {/* Additional Concerns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Concerns or Notes
              </label>
              <textarea
                value={additionalConcerns}
                onChange={(e) => setAdditionalConcerns(e.target.value)}
                placeholder="Any additional concerns, observations, or context..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Next Action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recommended Next Action *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNextAction('continue_monitoring')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    nextAction === 'continue_monitoring'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Clock className="w-5 h-5 mb-2" />
                  <div className="font-medium">Continue Monitoring</div>
                  <div className="text-sm opacity-70">Keep observing progress</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNextAction('additional_training')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    nextAction === 'additional_training'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-2" />
                  <div className="font-medium">Additional Training</div>
                  <div className="text-sm opacity-70">Provide more support</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNextAction('formal_warning')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    nextAction === 'formal_warning'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mb-2" />
                  <div className="font-medium">Escalate to Formal Warning</div>
                  <div className="text-sm opacity-70">Begin formal discipline</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNextAction('no_further_action')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    nextAction === 'no_further_action'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mb-2" />
                  <div className="font-medium">Close Successfully</div>
                  <div className="text-sm opacity-70">Issue resolved</div>
                </button>
              </div>
            </div>

            {/* Next Action Date */}
            {nextAction !== 'no_further_action' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Review Date *
                </label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {/* Manager Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Notes *
              </label>
              <textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Document your overall assessment and any specific observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                minLength={10}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {managerNotes.length}/500 characters (minimum 10)
              </p>
            </div>

            {/* Employee Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Feedback
              </label>
              <textarea
                value={employeeFeedback}
                onChange={(e) => setEmployeeFeedback(e.target.value)}
                placeholder="Optional feedback from the employee during this review..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => setStep('manager-sign')}
                disabled={!isFormValid()}
                className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue to Signatures
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎨 RENDER MANAGER SIGNATURE STEP
  if (step === 'manager-sign') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              Manager Signature Required
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Please sign to confirm this follow-up review with{' '}
                <strong>{counsellingSession.employeeName}</strong>.
              </p>
            </div>
            
            <InlineSignatureCanvas
              onSignatureChange={handleManagerSignature}
              label="Manager Signature"
              required
            />
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep('review')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎨 RENDER EMPLOYEE DECISION STEP
  if (step === 'employee-decision') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <User className="w-8 h-8 text-green-600" />
                Employee Acknowledgment
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Please ask <strong>{counsellingSession.employeeName}</strong> if they 
                acknowledge this follow-up review and would like to provide their signature.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  <strong>Note:</strong> Employee signature confirms they participated in this follow-up review.
                </p>
              </div>
            </div>
            
            {!showEmployeeSignature ? (
              <div className="space-y-4">
                <p className="text-gray-700 font-medium">Does the employee consent to sign?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleEmployeeDecision(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Yes, employee will sign
                  </button>
                  <button
                    onClick={() => handleEmployeeDecision(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    No, proceed without signature
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <InlineSignatureCanvas
                  onSignatureChange={handleEmployeeSignature}
                  label="Employee Signature"
                />
                
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeSignature(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back to Decision
                  </button>
                  <button
                    type="button"
                    onClick={() => submitFollowUp()}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Skip Signature & Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🎨 RENDER COMPLETION STEP
  if (step === 'complete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Follow-up Review Completed
            </h2>
            
            <p className="text-gray-600 mb-6">
              The follow-up review for {counsellingSession.employeeName} has been successfully 
              documented and is available to HR for review.
            </p>
            
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Return to Dashboard
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Redirecting automatically...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};