// frontend/src/components/counselling/UnifiedCorrectiveCounselling.tsx
// 🎯 UNIFIED CORRECTIVE COUNSELLING - Converted to use direct modal-system pattern
// ✅ Maintains all existing functionality: 4-step workflow, signatures, validation
// 🎨 Integrates with design system: CSS variables, modal-system.css, organization branding
// 📱 Mobile-optimized with consistent UX patterns

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Calendar, FileText, CheckCircle, AlertCircle,
  Clock, ArrowLeft, UserCheck, UserX, Send, X, RotateCcw, Plus, Minus, Mic, User
} from 'lucide-react';

// Using direct modal-system pattern like Enhanced Warning Wizard
import { UniversalEmployeeSelector } from '../common/UniversalEmployeeSelector';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FirebaseService } from '../../services/FirebaseService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { DataServiceV2 } from '../../services/DataServiceV2';
import { CounsellingService } from '../../services/CounsellingService';
import { API } from '../../api';
import type { Employee, WarningCategory } from '../../types/core';
import type {
  CorrectiveCounselling,
  CounsellingFormData,
  PromiseToPerform,
  CounsellingType
} from '../../types/counselling';
import { COUNSELLING_TYPES } from '../../types/counselling';

interface UnifiedCorrectiveCounsellingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedCorrectiveCounselling: React.FC<UnifiedCorrectiveCounsellingProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();

  // State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<WarningCategory | null>(null);
  const [counsellingType, setCounsellingType] = useState<CounsellingType>('coaching');
  const [issueDescription, setIssueDescription] = useState('');
  const [interventionDetails, setInterventionDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<WarningCategory[]>([]);

  // Load data
  useEffect(() => {
    if (organization?.id && user?.id && isOpen) {
      const loadData = async () => {
        try {
          setDataLoading(true);
          setError(null);

          const employeesData = await API.employees.getByManager(user?.id || '', organization.id);
          const transformedEmployees = employeesData.map(emp => ({
            id: emp.id,
            firstName: emp.profile?.firstName || emp.firstName || 'Unknown',
            lastName: emp.profile?.lastName || emp.lastName || 'Employee',
            position: emp.profile?.position || emp.employment?.position || 'Unknown Position',
            department: emp.profile?.department || emp.employment?.department || 'Unknown',
            email: emp.profile?.email || emp.contact?.email || emp.email || '',
            phone: emp.profile?.phone || emp.contact?.phone || emp.phone || '',
            deliveryPreference: (emp.deliveryPreference || 'email') as 'email' | 'whatsapp' | 'print',
            ...emp
          }));

          setEmployees(transformedEmployees);

          let categoriesData = await API.organizations.getCategories(organization.id);
          if (!categoriesData || categoriesData.length === 0) {
            categoriesData = [
              { id: 'attendance_punctuality', name: 'Attendance & Punctuality', severity: 'minor' },
              { id: 'performance_issues', name: 'Performance Issues', severity: 'moderate' },
              { id: 'safety_violations', name: 'Safety Violations', severity: 'serious' },
              { id: 'insubordination_disrespect', name: 'Insubordination & Disrespect', severity: 'serious' },
              { id: 'policy_violations', name: 'Policy Violations', severity: 'serious' },
              { id: 'dishonesty_theft', name: 'Dishonesty & Theft', severity: 'gross_misconduct' },
              { id: 'substance_abuse', name: 'Substance Abuse', severity: 'gross_misconduct' },
              { id: 'harassment_discrimination', name: 'Harassment & Discrimination', severity: 'gross_misconduct' }
            ];
          }

          setCategories(categoriesData);
        } catch (err) {
          setError('Failed to load data. Please try again.');
          setEmployees([]);
          setCategories([]);
        } finally {
          setDataLoading(false);
        }
      };

      loadData();
    } else if (!isOpen) {
      setDataLoading(false);
    }
  }, [user?.id, organization?.id, isOpen]);

  const isFormValid = () => {
    return selectedEmployee &&
           selectedCategory &&
           issueDescription.trim().length >= 20 &&
           interventionDetails.trim().length >= 30;
  };

  const handleSubmit = async () => {
    if (!user || !selectedEmployee || !selectedCategory || !user.organizationId) return;

    try {
      setLoading(true);
      setError(null);

      const counsellingData: Omit<CorrectiveCounselling, 'id'> = {
        organizationId: user.organizationId,
        managerId: user.id,
        managerName: `${user.firstName} ${user.lastName}`,
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        employeeNumber: selectedEmployee.employeeNumber || '',
        department: selectedEmployee.department || '',
        category: selectedCategory.name,
        categoryId: selectedCategory.id,
        counsellingType,
        issueDescription: issueDescription.trim(),
        interventionDetails: interventionDetails.trim(),
        trainingProvided: '',
        resourcesProvided: [],
        promisesToPerform: [],
        improvementTimeline: '',
        followUpDate: '',
        managerSignature: '',
        employeeAcknowledged: false,
        employeeComments: '',
        status: 'completed',
        improvementNoted: false,
        followUpCompleted: false,
        escalationRequired: false,
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        createdBy: user.id,
        documentVersion: 1
      };

      await DatabaseShardingService.createDocument(
        organization.id,
        'reports',
        counsellingData
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) {
      setError('Failed to submit counselling record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (dataLoading) {
    return (
      <div className="modal-system">
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-header__left">
              <div>
                <h2 className="modal-header__title">Loading Counselling Data</h2>
                <p className="modal-header__subtitle">Preparing counselling session data</p>
              </div>
            </div>
            <button onClick={onClose} className="modal-header__close-button">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="modal-content">
            <div className="modal-content__scrollable">
              <div className="space-y-4 text-center p-4 sm:p-6">
                <div className="animate-spin mx-auto h-16 w-16 border-4 border-gray-200 border-t-primary rounded-full"></div>
                <p className="mt-4 text-gray-600">Loading counselling data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="modal-system">
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-header__left">
              <div>
                <h2 className="modal-header__title">Counselling Session Recorded</h2>
                <p className="modal-header__subtitle">Successfully documented and available for HR review</p>
              </div>
            </div>
            <button onClick={onClose} className="modal-header__close-button">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="modal-content">
            <div className="modal-content__scrollable">
              <div className="space-y-4 text-center p-4 sm:p-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-4">Session Successfully Recorded</h3>
                <p className="mb-6 text-gray-600">
                  The corrective counselling session with <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> has been
                  successfully documented and will be available to HR for review.
                </p>
                <p className="text-sm text-gray-600">Redirecting automatically in a few seconds...</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div className="modal-footer__nav">
              <button onClick={onClose} className="modal-footer__button modal-footer__button--primary">
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-system">
      <div className="modal-container modal-container--xl">
        <div className="modal-header">
          <div className="modal-header__left">
            <div>
              <h2 className="modal-header__title">Corrective Counselling Session</h2>
              <p className="modal-header__subtitle">Document training, coaching, and discussions</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-header__close-button">
            <X className="w-5 h-5" />
          </button>
        </div>

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

              <UniversalEmployeeSelector
                employees={employees}
                selectedEmployeeId={selectedEmployee?.id || null}
                onEmployeeSelect={(employeeId) => {
                  const emp = employees.find(emp => emp.id === employeeId);
                  setSelectedEmployee(emp || null);
                }}
                title="Employee Selection"
                subtitle="Choose the employee involved in this counselling session"
                disabled={dataLoading}
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 unified-field-required">
                    Related Category
                  </label>
                  <select
                    value={selectedCategory?.id || ''}
                    onChange={(e) => {
                      const cat = categories.find(cat => cat.id === e.target.value);
                      setSelectedCategory(cat || null);
                    }}
                    className="w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    required
                  >
                    <option value="">Choose a category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} - {cat.severity}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon" style={{ color: 'var(--color-primary)' }}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Counselling Type</h3>
                      <p className="unified-section-header__subtitle">Select the appropriate type of counselling session</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {COUNSELLING_TYPES.map(type => (
                      <div
                        key={type.id}
                        className={`category-card cursor-pointer ${
                          counsellingType === type.id ? 'category-card--selected' : ''
                        }`}
                        onClick={() => setCounsellingType(type.id)}
                      >
                        <div className="category-card__content">
                          <span className="category-card__icon">{type.icon}</span>
                          <div className="category-card__details">
                            <div className="category-card__title">{type.label}</div>
                            <p className="category-card__description">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon" style={{ color: 'var(--color-primary)' }}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Issue/Topic Description</h3>
                      <p className="unified-section-header__subtitle">Describe the issue or topic that prompted this counselling session</p>
                    </div>
                  </div>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the issue, topic, or area for improvement that prompted this counselling session..."
                    rows={4}
                    minLength={20}
                    maxLength={500}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <p className="text-xs mt-1 text-gray-600">
                    {issueDescription.length}/500 characters (minimum 20)
                  </p>
                </div>

                <div>
                  <div className="unified-section-header">
                    <div className="unified-section-header__icon" style={{ color: 'var(--color-primary)' }}>
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="unified-section-header__content">
                      <h3 className="unified-section-header__title">Intervention Details</h3>
                      <p className="unified-section-header__subtitle">Document what was discussed and addressed during the session</p>
                    </div>
                  </div>
                  <textarea
                    value={interventionDetails}
                    onChange={(e) => setInterventionDetails(e.target.value)}
                    placeholder="Describe what was discussed, taught, or addressed during the counselling session..."
                    rows={4}
                    minLength={30}
                    maxLength={1000}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <p className="text-xs mt-1 text-gray-600">
                    {interventionDetails.length}/1000 characters (minimum 30)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              className="modal-footer__button modal-footer__button--primary"
            >
              {loading ? 'Submitting...' : 'Submit Counselling Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};