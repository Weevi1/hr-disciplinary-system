import Logger from '../../utils/logger';
// frontend/src/components/absences/ReportAbsence.tsx - V2 VERSION
// ✅ V2 FEATURES: Auto-save, real-time validation, enhanced UX, memory leak prevention
// ✅ FIXED: Removes undefined fields and properly handles optional data for Firebase
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserX, Calendar, Clock, FileText, Send, X, CheckCircle, 
  AlertCircle, DollarSign, User, Save, Wifi, WifiOff
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FirebaseService } from '../../services/FirebaseService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { API } from '../../api';
import type { Employee } from '../../types/core';

// Import unified components
import { ThemedSectionHeader } from '../common/ThemedCard';
import { CustomDatePicker } from '../common/CustomDatePicker';

// 🏢 SHARDED COLLECTIONS - Reports stored at /organizations/{orgId}/reports/{reportId}

// 🌟 TYPES - Based on project knowledge structure
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

// 📋 ABSENCE TYPES WITH PAYROLL IMPACT
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
    icon: '⏰', 
    payrollImpact: true,
    description: 'Employee absent for half of work day'
  },
  { 
    id: 'late-arrival', 
    label: 'Late Arrival', 
    icon: '🕐', 
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
] as const;

export const ReportAbsence: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // 📝 FORM STATE
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceType, setAbsenceType] = useState<string>('');
  const [reason, setReason] = useState('');

  // 🎯 UI STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // 🔄 DATA STATE
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // 💾 V2: AUTO-SAVE STATE
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // 🔄 V2: REAL-TIME VALIDATION STATE
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  // 💾 V2: AUTO-SAVE KEY FOR LOCAL STORAGE
  const autoSaveKey = useMemo(() => 
    `absence_report_draft_${user?.id}_${organization?.id}`, 
    [user?.id, organization?.id]
  );

  // 💾 V2: AUTO-SAVE FUNCTIONS
  const saveToLocalStorage = useCallback(() => {
    if (!autoSaveKey) return;
    
    const draftData = {
      selectedEmployeeId: selectedEmployee?.id || '',
      absenceDate,
      absenceType,
      reason,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(autoSaveKey, JSON.stringify(draftData));
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      Logger.debug('💾 Auto-saved absence report draft', draftData);
    } catch (error) {
      setAutoSaveStatus('error');
      Logger.error('Failed to auto-save absence report draft:', error);
    }
  }, [autoSaveKey, selectedEmployee?.id, absenceDate, absenceType, reason]);
  
  const loadFromLocalStorage = useCallback(() => {
    if (!autoSaveKey) return;
    
    try {
      const saved = localStorage.getItem(autoSaveKey);
      if (!saved) return;
      
      const draftData = JSON.parse(saved);
      // Only restore if saved within last 24 hours
      if (Date.now() - draftData.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(autoSaveKey);
        return;
      }
      
      Logger.debug('📋 Restored absence report draft', draftData);
      if (draftData.absenceDate) setAbsenceDate(draftData.absenceDate);
      if (draftData.absenceType) setAbsenceType(draftData.absenceType);
      if (draftData.reason) setReason(draftData.reason);
      // Note: selectedEmployee will be set after employees load
      return draftData;
    } catch (error) {
      Logger.error('Failed to restore absence report draft:', error);
      localStorage.removeItem(autoSaveKey);
    }
  }, [autoSaveKey]);
  
  const clearAutoSave = useCallback(() => {
    if (autoSaveKey) {
      localStorage.removeItem(autoSaveKey);
      setAutoSaveStatus('idle');
      setLastSaved(null);
    }
  }, [autoSaveKey]);
  
  // 📁 V2: REAL-TIME VALIDATION
  const validateField = useCallback((field: string, value: any) => {
    const errors: {[key: string]: string} = {};
    
    switch (field) {
      case 'selectedEmployee':
        if (!value) errors.selectedEmployee = 'Please select an employee';
        break;
      case 'absenceDate':
        if (!value) errors.absenceDate = 'Please select an absence date';
        break;
      case 'absenceType':
        if (!value) errors.absenceType = 'Please select an absence type';
        break;
      case 'reason':
        if (value && value.length > 80) {
          errors.reason = 'Reason must be 80 characters or less';
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] || '' }));
    return !errors[field];
  }, []);
  
  // ✅ FIXED: Load filtered employees using the SAME pattern as HODDashboardSection
  useEffect(() => {
    // Use the same positive condition pattern as HODDashboardSection
    if (organization?.id && user?.id) {
      const loadFilteredEmployees = async () => {
        Logger.debug('📋 Loading employees for absence reporting. Manager:', user.id, 'Role:', user.role?.id, 'Org:', organization.id)

        try {
          setDataLoading(true);
          setError(null);
          
          // ✅ FIXED: Use the EXACT same approach as HODDashboardSection
          const employeesData = await API.employees.getByManager(user?.id || '', organization.id);
          Logger.success(3871)
          
          // Transform employees to the expected format (same as HODDashboardSection)
          const transformedEmployees = employeesData.map(emp => ({
            id: emp.id,
            firstName: emp.profile?.firstName || emp.firstName || 'Unknown',
            lastName: emp.profile?.lastName || emp.lastName || 'Employee',
            position: emp.profile?.position || emp.employment?.position || 'Unknown Position',
            department: emp.profile?.department || emp.employment?.department || 'Unknown',
            email: emp.profile?.email || emp.contact?.email || emp.email || '',
            phone: emp.profile?.phone || emp.contact?.phone || emp.phone || '',
            deliveryPreference: (emp.deliveryPreference || 'email') as 'email' | 'whatsapp' | 'print',
            ...emp // Keep all original properties
          }));
          
          Logger.debug('👥 Employee details for absence reporting:', transformedEmployees.map(e => `${e.firstName} ${e.lastName}`));
          setEmployees(transformedEmployees);
          
          // 💾 V2: Restore draft after employees load
          const draftData = loadFromLocalStorage();
          if (draftData?.selectedEmployeeId) {
            const savedEmployee = transformedEmployees.find(emp => emp.id === draftData.selectedEmployeeId);
            if (savedEmployee) {
              setSelectedEmployee(savedEmployee);
              Logger.debug('📋 Restored selected employee from draft:', savedEmployee.firstName, savedEmployee.lastName);
            }
          }
          
        } catch (err) {
          Logger.error('❌ Error loading managed employees for absence reporting:', err)
          setError('Failed to load your team members. Please try again.');
          setEmployees([]);
        } finally {
          setDataLoading(false);
        }
      };

      loadFilteredEmployees();
    } else {
      Logger.debug('⏳ Waiting for user or organization to load...', { userId: user?.id, orgId: organization?.id })
      setDataLoading(false);
    }
  }, [user?.id, organization?.id, loadFromLocalStorage]);

  // 💾 V2: AUTO-SAVE TRIGGER
  useEffect(() => {
    if (selectedEmployee || absenceDate || absenceType || reason) {
      setAutoSaveStatus('saving');
      
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Save after 1 second of inactivity
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveToLocalStorage();
      }, 1000);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedEmployee, absenceDate, absenceType, reason, saveToLocalStorage]);
  
  // 💾 V2: CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // ✅ VALIDATE FORM
  const isFormValid = () => {
    return selectedEmployee && absenceDate && absenceType;
  };

  // 🎨 GET SELECTED ABSENCE TYPE INFO
  const selectedAbsenceType = ABSENCE_TYPES.find(type => type.id === absenceType);

  // 🚀 SUBMIT ABSENCE REPORT - FIXED: Properly handle optional fields
  const submitAbsenceReport = async () => {
    if (!user || !selectedEmployee || !user.organizationId || !selectedAbsenceType) return;

    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED: Build the data object conditionally to avoid undefined values
      const absenceReport: Partial<AbsenceReport> = {
        organizationId: user.organizationId,
        managerId: user.id,
        managerName: `${user.firstName} ${user.lastName}`,
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.profile.firstName} ${selectedEmployee.profile.lastName}`,
        absenceDate: absenceDate,
        absenceType: absenceType as AbsenceReport['absenceType'],
        reportedDate: new Date().toISOString(),
        payrollImpact: selectedAbsenceType.payrollImpact,
        hrReviewed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // ✅ FIXED: Only add optional fields if they have values
      if (selectedEmployee.profile.employeeNumber) {
        absenceReport.employeeNumber = selectedEmployee.profile.employeeNumber;
      }

      if (reason.trim()) {
        absenceReport.reason = reason.trim();
      }

      // 🔧 FIXED: Use sharded structure for absence reports
      await DatabaseShardingService.createDocument(
        organization.id, 
        'reports', 
        absenceReport as AbsenceReport
      );
      
      // 💾 V2: Clear auto-save on successful submission
      clearAutoSave();
      
      setSuccess(true);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      Logger.error('Failed to submit absence report:', err)
      setError('Failed to submit absence report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 GET REMAINING CHARACTERS FOR REASON
  const remainingChars = 80 - reason.length;

  // 🔄 LOADING STATE
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Team...</h2>
          <p className="text-gray-600">Finding employees you can report absences for...</p>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE - No organization
  if (!user?.organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-6">You don't seem to be associated with an organization.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ✅ IMPROVED: Better messaging for HOD managers with no team
  if (employees.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Found</h2>
          <p className="text-gray-600 mb-6">
            {user.role?.id === 'hod-manager' 
              ? 'You don\'t have any direct reports assigned to report absences for. Contact HR to assign team members.'
              : 'There are no employees you can report absences for based on your role permissions.'
            }
          </p>
          <div className="space-y-3">
            {(user.role?.id === 'hr-manager' || user.role?.id === 'business-owner') && (
              <button
                onClick={() => navigate('/employees')}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Manage Employees
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">

        {/* 📱 HEADER - Mobile Optimized */}
        <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <UserX className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Report Absence</h1>
                <p className="text-orange-100 text-sm sm:text-base">Log employee absence for HR notification</p>
                
                {/* 💾 V2: AUTO-SAVE INDICATOR */}
                {(selectedEmployee || absenceDate || absenceType || reason) && (
                  <div className="flex items-center gap-2 text-xs text-orange-100 mt-2">
                    {autoSaveStatus === 'saving' && (
                      <>
                        <div className="w-3 h-3 border border-orange-200 border-t-transparent rounded-full animate-spin" />
                        <span>Saving draft...</span>
                      </>
                    )}
                    {autoSaveStatus === 'saved' && lastSaved && (
                      <>
                        <Save className="w-3 h-3" />
                        <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
                      </>
                    )}
                    {autoSaveStatus === 'error' && (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>Save failed - check connection</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* ⚠️ ERROR ALERT - Mobile Optimized */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 font-medium text-sm sm:text-base">Error</span>
            </div>
            <p className="text-red-600 mt-1 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* ✅ SUCCESS STATE - Mobile Optimized */}
        {success && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 text-center">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Absence Reported Successfully!</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              HR has been notified of this absence for payroll processing.
            </p>
            
            <div className="bg-green-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Employee:</span>
                  <span className="text-green-600">{selectedEmployee?.profile.firstName} {selectedEmployee?.profile.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Date:</span>
                  <span className="text-green-600">{new Date(absenceDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Type:</span>
                  <span className="text-green-600">{selectedAbsenceType?.icon} {selectedAbsenceType?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Payroll Impact:</span>
                  <span className={selectedAbsenceType?.payrollImpact ? "text-red-600" : "text-green-600"}>
                    {selectedAbsenceType?.payrollImpact ? '💰 Yes - Affects Pay' : '✅ No Impact'}
                  </span>
                </div>
                {reason && (
                  <div className="flex justify-between">
                    <span className="font-medium text-green-700">Reason:</span>
                    <span className="text-green-600">"{reason}"</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500">Redirecting to dashboard in 3 seconds...</p>
          </div>
        )}

        {/* 📝 FORM - Mobile Optimized */}
        {!success && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                Absence Information
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                ✅ Found {employees.length} team member{employees.length !== 1 ? 's' : ''} you can report absences for.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">

              {/* 👤 EMPLOYEE SELECTION - Unified Design */}
              <div>
                <ThemedSectionHeader
                  icon={User}
                  title="Select Employee"
                  subtitle="Choose the team member to report absence for"
                />
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find(emp => emp.id === e.target.value);
                    setSelectedEmployee(emp || null);
                    setTouchedFields(prev => new Set(prev).add('selectedEmployee'));
                    validateField('selectedEmployee', emp);
                  }}
                  className={`w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${
                    touchedFields.has('selectedEmployee') && fieldErrors.selectedEmployee
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: touchedFields.has('selectedEmployee') && fieldErrors.selectedEmployee
                      ? 'var(--color-alert-error-bg)'
                      : 'var(--color-input-background)',
                    borderColor: touchedFields.has('selectedEmployee') && fieldErrors.selectedEmployee
                      ? 'var(--color-alert-error-border)'
                      : 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                  required
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.profile.firstName} {employee.profile.lastName}
                      {employee.profile.employeeNumber && ` (${employee.profile.employeeNumber})`}
                    </option>
                  ))}
                </select>
                {touchedFields.has('selectedEmployee') && fieldErrors.selectedEmployee && (
                  <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--color-error)' }}>
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.selectedEmployee}
                  </div>
                )}
              </div>

              {/* 📅 ABSENCE DATE - Unified Design */}
              <CustomDatePicker
                type="date"
                label="Absence Date"
                value={absenceDate}
                onChange={(value) => {
                  setAbsenceDate(value);
                  setTouchedFields(prev => new Set(prev).add('absenceDate'));
                  validateField('absenceDate', value);
                }}
                icon={Calendar}
                required
                error={touchedFields.has('absenceDate') && fieldErrors.absenceDate ? fieldErrors.absenceDate : undefined}
              />

              {/* 🏠 ABSENCE TYPE DROPDOWN - Mobile Optimized */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Type of Absence <span className="text-red-500">*</span>
                </label>
                <select
                  value={absenceType}
                  onChange={(e) => {
                    setAbsenceType(e.target.value);
                    setTouchedFields(prev => new Set(prev).add('absenceType'));
                    validateField('absenceType', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('absenceType'));
                    validateField('absenceType', absenceType);
                  }}
                  className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base border rounded-lg focus:ring-2 transition-colors min-h-[44px] ${
                    touchedFields.has('absenceType') && fieldErrors.absenceType
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                  }`}
                >
                  <option value="">Select type of absence...</option>
                  {ABSENCE_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}{type.payrollImpact ? ' (Affects Pay)' : ''}
                    </option>
                  ))}
                </select>
                
                {/* Selected Type Details - Mobile Optimized */}
                {selectedAbsenceType && (
                  <div className="mt-3 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">{selectedAbsenceType.icon}</span>
                        <span className="font-medium text-orange-900 text-sm sm:text-base">{selectedAbsenceType.label}</span>
                      </div>
                      {selectedAbsenceType.payrollImpact && (
                        <span className="flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                          Affects Pay
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-orange-700">{selectedAbsenceType.description}</p>
                    {selectedAbsenceType.payrollImpact && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        This absence type will affect the employee's payroll calculation
                      </p>
                    )}
                  </div>
                )}
                
                {touchedFields.has('absenceType') && fieldErrors.absenceType && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {fieldErrors.absenceType}
                  </p>
                )}
              </div>

              {/* 📝 REASON (OPTIONAL) - Mobile Optimized */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    const newReason = e.target.value.slice(0, 80);
                    setReason(newReason);
                    setTouchedFields(prev => new Set(prev).add('reason'));
                    validateField('reason', newReason);
                  }}
                  placeholder="Brief explanation if needed..."
                  rows={3}
                  maxLength={80}
                  className={`w-full px-3 sm:px-4 py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none min-h-[80px] ${
                    touchedFields.has('reason') && fieldErrors.reason
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between items-center text-xs mt-1">
                  {touchedFields.has('reason') && fieldErrors.reason && (
                    <p className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {fieldErrors.reason}
                    </p>
                  )}
                  <div className={`text-xs sm:text-sm ml-auto ${
                    remainingChars < 10 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {remainingChars} chars left
                  </div>
                </div>
              </div>

              {/* 🚀 SUBMIT BUTTON - Mobile Optimized */}
              <button
                onClick={submitAbsenceReport}
                disabled={!isFormValid() || loading}
                className={`w-full px-4 sm:px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 min-h-[48px] text-sm sm:text-base ${
                  isFormValid() && !loading
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Report Absence</span>
                  </>
                )}
              </button>

              {/* 📋 FORM SUMMARY - Mobile Optimized */}
              {selectedEmployee && selectedAbsenceType && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="w-4 h-4" />
                    Report Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Employee:</span>
                      <p className="text-gray-600">{selectedEmployee.profile.firstName} {selectedEmployee.profile.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <p className="text-gray-600">{new Date(absenceDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600">{selectedAbsenceType.icon} {selectedAbsenceType.label}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Impact:</span>
                      <p className={selectedAbsenceType.payrollImpact ? "text-red-600" : "text-green-600"}>
                        {selectedAbsenceType.payrollImpact ? 'Affects Pay' : 'No Impact'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};