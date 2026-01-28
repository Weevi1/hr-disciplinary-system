// frontend/src/components/absences/UnifiedReportAbsence.tsx
// 🚀 UNIFIED VERSION: ReportAbsence converted to use UnifiedModal system
// ✅ Maintains all existing functionality: validation, payroll impact
// 🎨 Now uses consistent theming with CSS variables and ThemedButton
// 📱 Same mobile-first approach but integrated into modal system

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserX, Calendar, Clock, FileText, CheckCircle,
  AlertCircle, DollarSign, User, ChevronDown, X
} from 'lucide-react';

// Removed UnifiedModal - using direct modal-system pattern like Enhanced Warning Wizard
import { UniversalEmployeeSelector } from '../common/UniversalEmployeeSelector';
import { CustomDatePicker } from '../common/CustomDatePicker';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { TimeService } from '../../services/TimeService';
import { API } from '../../api';
import type { Employee } from '../../types/core';
import Logger from '../../utils/logger';

interface UnifiedReportAbsenceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AbsenceReport {
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  absenceDate: string;
  absenceType: 'full-day' | 'half-day' | 'late-arrival' | 'early-departure' | 'sick-leave' | 'personal-leave';
  reason?: string;
  reportedDate: string;
  payrollImpact: boolean;
  hrReviewed: boolean;
  hrNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Absence types with payroll impact
const ABSENCE_TYPES = [
  {
    id: 'full-day',
    label: 'Full Day Absence',
    icon: '🏠',
    payrollImpact: true,
    description: 'Employee absent for entire work day'
  },
  {
    id: 'half-day',
    label: 'Half Day Absence',
    icon: '🕐',
    payrollImpact: true,
    description: 'Employee absent for half of work day'
  },
  {
    id: 'late-arrival',
    label: 'Late Arrival',
    icon: '⏰',
    payrollImpact: false,
    description: 'Employee arrived late to work'
  },
  {
    id: 'early-departure',
    label: 'Early Departure',
    icon: '🚪',
    payrollImpact: false,
    description: 'Employee left work early'
  },
  {
    id: 'sick-leave',
    label: 'Sick Leave',
    icon: '🤒',
    payrollImpact: true,
    description: 'Employee absent due to illness'
  },
  {
    id: 'personal-leave',
    label: 'Personal Leave',
    icon: '👤',
    payrollImpact: true,
    description: 'Employee absent for personal reasons'
  }
];

export const UnifiedReportAbsence: React.FC<UnifiedReportAbsenceProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceType, setAbsenceType] = useState<string>('');
  const [reason, setReason] = useState('');


  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Absence type dropdown state
  const [isAbsenceTypeOpen, setIsAbsenceTypeOpen] = useState(false);
  const [isMobileAbsenceModal, setIsMobileAbsenceModal] = useState(false);

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
          department: emp.profile?.department || emp.employment?.department || 'No Department',
          employeeNumber: emp.employeeNumber || emp.profile?.employeeNumber || '',
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


  // Get selected absence type
  const selectedAbsenceType = useMemo(() =>
    ABSENCE_TYPES.find(type => type.id === absenceType),
    [absenceType]
  );

  // Handle absence type selection
  const handleAbsenceTypeSelect = useCallback((typeId: string) => {
    setAbsenceType(typeId);
    setIsAbsenceTypeOpen(false);
    setIsMobileAbsenceModal(false);
  }, []);

  // Handle opening absence type selector (mobile vs desktop)
  const handleOpenAbsenceTypeSelector = useCallback(() => {
    // Check if mobile view
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileAbsenceModal(true);
    } else {
      setIsAbsenceTypeOpen(!isAbsenceTypeOpen);
    }
  }, [isAbsenceTypeOpen]);

  // Handle mobile modal close
  const handleMobileAbsenceModalClose = useCallback(() => {
    setIsMobileAbsenceModal(false);
  }, []);

  // Form validation
  const isFormValid = () => {
    return !!(selectedEmployee && absenceDate && absenceType);
  };

  // Submit report
  const handleSubmit = async () => {
    if (!user || !selectedEmployee || !organization?.id || !isFormValid()) return;

    try {
      setLoading(true);
      setError(null);

      const selectedAbsenceType = ABSENCE_TYPES.find(type => type.id === absenceType);

      const reportData: Omit<AbsenceReport, 'id'> = {
        organizationId: organization.id,
        managerId: user.id,
        managerName: `${user.firstName} ${user.lastName}`,
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        employeeNumber: selectedEmployee.employeeNumber || '',
        absenceDate,
        absenceType: absenceType as AbsenceReport['absenceType'],
        reason: reason.trim() || undefined,
        reportedDate: TimeService.getServerTimestamp(),
        payrollImpact: selectedAbsenceType?.payrollImpact || false,
        hrReviewed: false,
        createdAt: TimeService.getServerTimestamp(),
        updatedAt: TimeService.getServerTimestamp()
      };

      // Remove undefined fields for Firebase
      const cleanedData = Object.fromEntries(
        Object.entries(reportData).filter(([_, value]) => value !== undefined)
      );

      const docId = await DatabaseShardingService.createDocument(
        organization.id,
        'reports',
        cleanedData
      );

      setSuccess(true);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      Logger.error('Failed to submit absence report:', err);
      setError('Failed to submit absence report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee(null);
      setAbsenceDate(new Date().toISOString().split('T')[0]);
      setAbsenceType('');
      setReason('');
      setError(null);
      setSuccess(false);
      setIsAbsenceTypeOpen(false);
      setIsMobileAbsenceModal(false);
    }
  }, [isOpen]);

  const selectedAbsenceTypeData = ABSENCE_TYPES.find(type => type.id === absenceType);

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
                  Report Submitted
                </h2>
                <p className="modal-header__subtitle">
                  Absence report has been successfully submitted
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
                  Report Submitted Successfully
                </h3>

                <p className="mb-6 text-gray-600">
                  The absence report for {selectedEmployee?.firstName} {selectedEmployee?.lastName} has been
                  submitted and will be reviewed by HR.
                </p>

                {selectedAbsenceTypeData?.payrollImpact && (
                  <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)' }}>
                    <DollarSign className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>This absence may impact payroll calculations</span>
                    </div>
                  </div>
                )}
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
                Report Employee Absence
              </h2>
              <p className="modal-header__subtitle">
                Document unscheduled employee absence
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
                <div className="form-section">
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Absence Details</h3>
                      <p className="unified-section-header__subtitle">Select employee and specify absence information</p>
                    </div>
                  </div>

                  {/* Employee Selection - Universal Selector */}
                  <UniversalEmployeeSelector
                    employees={employees}
                    selectedEmployeeId={selectedEmployee?.id || null}
                    onEmployeeSelect={(employeeId) => {
                      const emp = employees.find(emp => emp.id === employeeId);
                      setSelectedEmployee(emp || null);
                    }}
                    title="Employee Selection"
                    subtitle="Choose the employee for this absence report"
                  />

                  <div className="space-y-4">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomDatePicker
                        type="date"
                        label="Absence Date"
                        value={absenceDate}
                        onChange={(value) => setAbsenceDate(value)}
                        icon={Calendar}
                        required
                      />

                      <div>
                        <label className="unified-field-label">
                          Reported Date
                        </label>
                        <input
                          type="text"
                          value={new Date().toLocaleDateString()}
                          readOnly
                          className="unified-field-input opacity-75"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Absence Type Selector - Dropdown */}
                <div className="form-section">
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Absence Type</h3>
                      <p className="unified-section-header__subtitle">Select the type of absence that occurred</p>
                    </div>
                  </div>

                {/* Absence Type Dropdown */}
                <div className="relative">
                  <div className="space-y-2">
                    {/* Selected Absence Type Display */}
                    <div
                      className={`cursor-pointer transition-all min-h-[48px] p-3 rounded border hover:border-primary`}
                      style={{
                        backgroundColor: 'var(--color-input-background)',
                        borderColor: isAbsenceTypeOpen ? 'var(--color-primary)' : 'var(--color-input-border)',
                        boxShadow: isAbsenceTypeOpen ? '0 0 0 2px var(--color-primary-light)' : undefined
                      }}
                      onClick={handleOpenAbsenceTypeSelector}
                    >
                      {selectedAbsenceType ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{selectedAbsenceType.icon}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {selectedAbsenceType.label}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {selectedAbsenceType.description}
                                </div>
                                {selectedAbsenceType.payrollImpact && (
                                  <span className="category-card__badge category-card__badge--warning">
                                    <DollarSign className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform flex-shrink-0 ${isAbsenceTypeOpen ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--color-text-tertiary)' }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              Select absence type...
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isAbsenceTypeOpen ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--color-text-tertiary)' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Dropdown Content */}
                    {isAbsenceTypeOpen && (
                      <div className="absolute top-full left-0 right-0 z-20 rounded-lg shadow-lg max-h-80 overflow-hidden"
                           style={{
                             backgroundColor: 'var(--color-background)',
                             border: '1px solid var(--color-border)'
                           }}>
                        {/* Absence Type List */}
                        <div className="max-h-60 overflow-y-auto">
                          <div className="py-2">
                            {ABSENCE_TYPES.map(type => (
                              <button
                                key={type.id}
                                onClick={() => handleAbsenceTypeSelect(type.id)}
                                className="w-full text-left px-3 py-3 transition-colors hover:bg-opacity-50"
                                style={{
                                  color: 'var(--color-text)',
                                  ':hover': { backgroundColor: 'var(--color-primary-light)' }
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg flex-shrink-0">{type.icon}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                                      {type.label}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                        {type.description}
                                      </div>
                                      {type.payrollImpact && (
                                        <span className="text-xs" style={{ color: 'var(--color-warning)' }}>
                                          $ Payroll
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Modal for Absence Type Selection */}
                {isMobileAbsenceModal && (
                  <div className="mobile-employee-modal">
                    <div className="mobile-employee-modal-backdrop" onClick={handleMobileAbsenceModalClose} />
                    <div className="mobile-employee-modal-content">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Select Absence Type</h3>
                        <button
                          onClick={handleMobileAbsenceModalClose}
                          className="p-2 rounded-full hover:bg-opacity-10"
                          style={{ backgroundColor: 'var(--color-text-tertiary)' }}
                        >
                          <X className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
                        </button>
                      </div>

                      {/* Mobile Absence Type List - Compact */}
                      <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                        <div>
                          {ABSENCE_TYPES.map(type => (
                            <button
                              key={type.id}
                              onClick={() => handleAbsenceTypeSelect(type.id)}
                              className="w-full text-left px-4 py-2.5 transition-colors flex items-center gap-2.5"
                              style={{
                                borderBottom: '1px solid var(--color-border)',
                                color: 'var(--color-text)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <span className="text-base flex-shrink-0">{type.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                                    {type.label}
                                  </span>
                                  {type.payrollImpact && (
                                    <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{
                                      backgroundColor: 'var(--color-warning-bg)',
                                      color: 'var(--color-warning)'
                                    }}>
                                      $ Payroll
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {type.description}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  </div>
                </div>

                <div className="form-section">
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Additional Notes</h3>
                      <p className="unified-section-header__subtitle">Optional context or details about the absence</p>
                    </div>
                  </div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional additional context or details about the absence..."
                    className="unified-field-input"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="unified-field-hint">
                    {reason.length}/500 characters
                  </div>
                </div>

                {/* Supporting Docs Reminder */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }}>
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <p className="text-xs" style={{ color: '#92400e' }}>
                    Keep any supporting documents (medical certificates, etc.) and hand them to HR.
                  </p>
                </div>

                {/* Payroll impact warning */}
                {selectedAbsenceTypeData?.payrollImpact && (
                  <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)' }}>
                    <DollarSign className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                    <div className="flex-1">
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>Payroll Impact Notice</span>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        This absence type may affect the employee's pay. HR will review and make appropriate adjustments.
                      </p>
                    </div>
                  </div>
                )}
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
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              className={`modal-footer__button modal-footer__button--primary ${loading ? 'modal-footer__button--loading' : ''}`}
            >
              Submit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};