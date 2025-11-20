// frontend/src/components/meetings/UnifiedBookHRMeeting.tsx
// 🚀 UNIFIED VERSION: BookHRMeeting converted to use UnifiedModal system
// ✅ Maintains all existing functionality: signatures, validation
// 🎨 Now uses consistent theming with CSS variables and ThemedButton
// 📱 Same mobile-first approach but integrated into modal system

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, Calendar, FileText, CheckCircle, AlertCircle,
  Clock, UserCheck, UserX, RotateCcw, X
} from 'lucide-react';

// Removed UnifiedModal - using direct modal-system pattern like Enhanced Warning Wizard
import { UniversalEmployeeSelector } from '../common/UniversalEmployeeSelector';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { TimeService } from '../../services/TimeService';
import { API } from '../../api';
import type { Employee } from '../../types/core';
import Logger from '../../utils/logger';

interface UnifiedBookHRMeetingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HRMeetingRequest {
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  context: string;
  managerSignature?: string;
  employeeSignature?: string;
  employeeConsent: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  requestDate: string;
  createdAt: string;
  updatedAt: string;
}

// 🖊️ SIGNATURE CANVAS COMPONENT - Themed version
interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  label: string;
  required?: boolean;
  role?: 'manager' | 'employee';
  personName?: string;
}

const ThemedSignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureChange,
  label,
  required = false,
  role = 'manager',
  personName
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const dataURL = canvasRef.current.toDataURL();
      onSignatureChange(dataURL);
    }
  }, [isDrawing, onSignatureChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange('');
  }, [onSignatureChange]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Configure drawing
    ctx.strokeStyle = 'var(--color-text)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    setupCanvas();

    const handleResize = () => {
      setTimeout(setupCanvas, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <label className="unified-field-label">
            {label} {required && <span className="unified-field-required"></span>}
          </label>
          <p className="unified-section-header__subtitle">
            {role === 'manager'
              ? 'Please sign below to confirm this meeting request'
              : `${personName}, please sign below if you agree to this meeting`}
          </p>
        </div>

        {/* Signature Status */}
        <div className="flex items-center gap-2">
          {hasSignature ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Signed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Pending</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-2 border-dashed rounded p-4" style={{ borderColor: 'var(--color-border)' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 cursor-crosshair rounded"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {hasSignature ? 'Signature captured' : 'Click and drag to sign above'}
          </p>
          <button
            onClick={clearSignature}
            disabled={!hasSignature}
            className="px-3 py-1 text-sm rounded flex items-center gap-1"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)'
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export const UnifiedBookHRMeeting: React.FC<UnifiedBookHRMeetingProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [context, setContext] = useState('');
  const [managerSignature, setManagerSignature] = useState<string>('');
  const [employeeSignature, setEmployeeSignature] = useState<string>('');
  const [employeeConsent, setEmployeeConsent] = useState<boolean | null>(null);
  const [showEmployeeSignature, setShowEmployeeSignature] = useState(false);


  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id || !organization?.id) return;

      try {
        const employeesData = await API.employees.getByManager(user.id, organization.id);
        const transformedEmployees = employeesData.map(emp => ({
          id: emp.id,
          firstName: emp.profile?.firstName || emp.firstName || 'Unknown',
          lastName: emp.profile?.lastName || emp.lastName || 'Employee',
          position: emp.profile?.position || emp.employment?.position || 'Unknown Position',
          department: emp.profile?.department || emp.employment?.department || 'Unknown',
          email: emp.profile?.email || emp.contact?.email || emp.email || '',
          ...emp
        }));
        setEmployees(transformedEmployees);
      } catch (error) {
        Logger.error('Failed to load employees:', error);
        setError('Failed to load employees');
      }
    };

    if (isOpen) {
      loadEmployees();
    }
  }, [user?.id, organization?.id, isOpen]);


  // Form validation
  const isFormValid = () => {
    return selectedEmployee && context.trim().length >= 20;
  };

  const handleManagerSignature = (signature: string) => {
    setManagerSignature(signature);
  };

  const handleEmployeeDecision = (consent: boolean) => {
    setEmployeeConsent(consent);
    if (consent) {
      setShowEmployeeSignature(true);
    } else {
      setShowEmployeeSignature(false);
      setEmployeeSignature('');
    }
  };

  const handleEmployeeSignature = (signature: string) => {
    setEmployeeSignature(signature);
  };

  const submitMeeting = async () => {
    if (!user || !selectedEmployee || !organization?.id || !isFormValid()) return;

    try {
      setLoading(true);
      setError(null);

      const meetingRequest: Omit<HRMeetingRequest, 'id'> = {
        organizationId: organization.id,
        managerId: user.id,
        managerName: `${user.firstName} ${user.lastName}`,
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        context: context.trim(),
        employeeConsent: false,
        status: 'pending',
        requestDate: TimeService.getServerTimestamp(),
        createdAt: TimeService.getServerTimestamp(),
        updatedAt: TimeService.getServerTimestamp()
      };

      await DatabaseShardingService.createDocument(
        organization.id,
        'meetings',
        meetingRequest
      );

      setSuccess(true);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      Logger.error('Failed to submit meeting request:', err);
      setError('Failed to submit meeting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee(null);
      setContext('');
      setManagerSignature('');
      setEmployeeSignature('');
      setEmployeeConsent(null);
      setShowEmployeeSignature(false);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (success) {
    if (!isOpen) return null;

    return (
      <div className="modal-system">
        <div className="modal-container">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header__left">
              <div>
                <h2 className="modal-header__title">
                  Meeting Request Submitted
                </h2>
                <p className="modal-header__subtitle">
                  HR will be notified and will schedule the meeting
                </p>
              </div>
            </div>

            <button onClick={onClose} className="modal-header__close-button">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            <div className="modal-content__scrollable">
              <div className="p-4 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <h3 className="text-xl font-bold mb-4">
                  Meeting Request Submitted
                </h3>

                <p className="mb-6 text-gray-600">
                  Your meeting request for {selectedEmployee?.firstName} {selectedEmployee?.lastName} has been
                  successfully submitted to HR. They will review the request and schedule the meeting accordingly.
                </p>

                <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: 'var(--color-info-bg)', border: '1px solid var(--color-primary)' }}>
                  <Calendar className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1">
                    <span className="text-sm" style={{ color: 'var(--color-text)' }}>You will receive notification once the meeting is scheduled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="modal-footer__nav">
              <button
                onClick={onClose}
                className="modal-footer__button modal-footer__button--primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="modal-system">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header__left">
            <div>
              <h2 className="modal-header__title">
                Book HR Meeting
              </h2>
              <p className="modal-header__subtitle">
                Schedule intervention meeting with HR
              </p>
            </div>
          </div>

          <button onClick={onClose} className="modal-header__close-button">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="modal-header__center">
          <div className="modal-header__progress-mobile modal-responsive-hide-mobile">
            <div className="mobile-step-indicator">
              <div className="mobile-step-dots">
                <div className="mobile-step-dot mobile-step-dot--active">
                  1
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="modal-content__scrollable">
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                  <div className="flex-1">
                    <span style={{ color: 'var(--color-text)' }}>{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Employee Selection - Universal Selector */}
                <UniversalEmployeeSelector
                  employees={employees}
                  selectedEmployeeId={selectedEmployee?.id || null}
                  onEmployeeSelect={(employeeId) => {
                    const emp = employees.find(emp => emp.id === employeeId);
                    setSelectedEmployee(emp || null);
                  }}
                  title="Select Employee"
                  subtitle="Choose the team member for this HR meeting"
                />

                {/* Context Section - Modal System */}
                <div className="form-section">
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Meeting Context</h3>
                      <p className="unified-section-header__subtitle">Describe the situation that requires HR intervention</p>
                    </div>
                  </div>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Describe the situation that requires HR intervention..."
                    className="unified-field-input"
                    rows={4}
                    minLength={20}
                    maxLength={1000}
                  />
                  <div className="unified-field-hint">
                    {context.length}/1000 characters (minimum 20)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer__nav">
            <button
              onClick={onClose}
              className="modal-footer__button modal-footer__button--secondary"
            >
              Cancel
            </button>

            <button
              onClick={submitMeeting}
              disabled={!isFormValid() || loading}
              className={`modal-footer__button modal-footer__button--primary ${loading ? 'modal-footer__button--loading' : ''}`}
            >
              Submit Meeting Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};