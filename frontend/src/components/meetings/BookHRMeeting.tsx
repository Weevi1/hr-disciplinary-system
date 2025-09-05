// frontend/src/components/meetings/BookHRMeeting.tsx - FIXED VERSION
// ✅ FIXED: Now uses DataService.getEmployeesForWarningCreation to respect HOD manager permissions
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FileText, CheckCircle, AlertCircle, 
  Clock, ArrowLeft, UserCheck, UserX, Send, X, RotateCcw
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FirebaseService } from '../../services/FirebaseService';
import { DataService } from '../../services/DataService';
import { API } from '../../api';
import type { Employee } from '../../types/core';

// 🏢 COLLECTIONS
const COLLECTIONS = {
  HR_MEETING_REQUESTS: 'hr_meeting_requests'
};

// 🌟 TYPES
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
  scheduledDate?: string;
  scheduledTime?: string;
  hrNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 🖊️ INLINE SIGNATURE CANVAS COMPONENT
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

  useEffect(() => {
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
          className="w-full h-32 border border-dashed border-gray-400 rounded cursor-crosshair bg-gray-50"
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

export const BookHRMeeting: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // 📝 FORM STATE
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [context, setContext] = useState('');
  const [managerSignature, setManagerSignature] = useState<string>('');
  const [employeeSignature, setEmployeeSignature] = useState<string>('');
  const [employeeConsent, setEmployeeConsent] = useState<boolean | null>(null);
  const [showEmployeeSignature, setShowEmployeeSignature] = useState(false);
  
  // 🎯 UI STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'form' | 'manager-sign' | 'employee-decision' | 'complete'>('form');

  // 🔄 DATA STATE
  const [dataLoading, setDataLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // ✅ FIXED: Load filtered employees using the SAME service as the warning form
  useEffect(() => {
    // Use the same positive condition pattern as HODDashboardSection
    if (organization?.id && user?.id) {
      const loadFilteredEmployees = async () => {
        console.log('📋 Loading employees for manager:', user.id, 'Role:', user.role?.id, 'Org:', organization.id);

        try {
          setDataLoading(true);
          setError(null);
          
          // ✅ FIXED: Use the EXACT same approach as HODDashboardSection
          const employeesData = await API.employees.getByManager(user?.id || '', organization.id);
        console.log('✅ Managed employees loaded:', employeesData.length);
        
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
        
          console.log('👥 Employee details:', transformedEmployees.map(e => `${e.firstName} ${e.lastName}`));
          setEmployees(transformedEmployees);
          
        } catch (err) {
          console.error('❌ Error loading managed employees:', err);
          setError('Failed to load your team members. Please try again.');
          setEmployees([]);
        } finally {
          setDataLoading(false);
        }
      };

      loadFilteredEmployees();
    } else {
      console.log('⏳ Waiting for user or organization to load...', { userId: user?.id, orgId: organization?.id });
      setDataLoading(false);
    }
  }, [user?.id, organization?.id]);

  // ✅ VALIDATE FORM
  const isFormValid = () => {
    return selectedEmployee && context.trim().length > 0 && context.length <= 80;
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
      submitMeetingRequest();
    }
  };

  // ✍️ HANDLE EMPLOYEE SIGNATURE
  const handleEmployeeSignature = (signature: string) => {
    setEmployeeSignature(signature);
    if (signature) {
      submitMeetingRequest();
    }
  };

  // 🚀 SUBMIT MEETING REQUEST
  const submitMeetingRequest = async () => {
    if (!user || !selectedEmployee || !user.organizationId) return;

    // ===============================================
    // ==== ADD THIS LINE FOR DEBUGGING ====
    console.log('DEBUG: User object from AuthContext:', user);
    // ===============================================

    try {
      setLoading(true);
      setError(null);

      // ✅ FIXED: Prevent undefined values in Firebase document
      const meetingRequestData: any = {
        organizationId: user.organizationId,
        managerId: user.id,
        managerName: `${user.firstName} ${user.lastName}`,
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.profile.firstName} ${selectedEmployee.profile.lastName}`,
        context: context.trim(),
        managerSignature: managerSignature || '',
        employeeConsent: employeeConsent || false,
        status: 'pending',
        requestDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Only add employeeSignature if employee consented and provided signature
      if (employeeConsent && employeeSignature) {
        meetingRequestData.employeeSignature = employeeSignature;
      }

      await FirebaseService.createDocument(COLLECTIONS.HR_MEETING_REQUESTS, meetingRequestData);
      
      setStep('complete');
      setSuccess(true);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Failed to submit meeting request:', err);
      setError('Failed to submit meeting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 GET REMAINING CHARACTERS
  const remainingChars = 80 - context.length;
  const isContextValid = context.length > 0 && context.length <= 80;

  // 🔄 LOADING STATE
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Team...</h2>
          <p className="text-gray-600">Finding employees you can book meetings for...</p>
        </div>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (!user?.organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-6">You don't seem to be associated with an organization.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Found</h2>
          <p className="text-gray-600 mb-6">
            {user.role?.id === 'hod-manager' 
              ? 'You don\'t have any direct reports assigned to book meetings with. Contact HR to assign team members.'
              : 'There are no employees you can book meetings with based on your role permissions.'
            }
          </p>
          <div className="space-y-3">
            {(user.role?.id === 'hr-manager' || user.role?.id === 'business-owner') && (
              <button
                onClick={() => navigate('/employees')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* 📱 HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Book HR Meeting</h1>
                <p className="text-blue-100">Request meeting with HR department</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ✅ SUCCESS STATE */}
        {step === 'complete' && success && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              HR has been notified and will schedule your meeting soon.
            </p>
            
            <div className="bg-green-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Employee:</span>
                  <span className="text-green-600">{selectedEmployee?.profile.firstName} {selectedEmployee?.profile.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Context:</span>
                  <span className="text-green-600">"{context}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Employee Consent:</span>
                  <span className="text-green-600">
                    {employeeConsent ? '✅ Agreed' : '❌ Manager-requested only'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">Redirecting to dashboard in 3 seconds...</p>
          </div>
        )}

        {/* 📝 FORM STEP */}
        {step === 'form' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Meeting Details
              </h2>
              <p className="text-gray-600 text-sm">
                ✅ Found {employees.length} team member{employees.length !== 1 ? 's' : ''} you can book meetings for.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* 👤 EMPLOYEE SELECTION - Now filtered to team members only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    setSelectedEmployee(employee || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a team member...</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.profile.firstName} {employee.profile.lastName} - {employee.profile.department || employee.employment.department}
                      {employee.profile.employeeNumber && ` (#${employee.profile.employeeNumber})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 📝 CONTEXT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Context <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Brief reason for HR meeting (keep it concise)..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                      isContextValid ? 'border-gray-300 focus:border-blue-500' : 'border-red-300 focus:border-red-500'
                    }`}
                    rows={3}
                    maxLength={80}
                  />
                  <div className={`absolute bottom-2 right-2 text-xs font-medium ${
                    remainingChars < 10 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {remainingChars} chars left
                  </div>
                </div>
                {!isContextValid && context.length > 0 && (
                  <p className="text-red-600 text-sm mt-1">
                    Please keep context between 1-80 characters
                  </p>
                )}
              </div>
            </div>

            {/* 🚀 CONTINUE BUTTON */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>
              
              <button
                onClick={() => setStep('manager-sign')}
                disabled={!isFormValid()}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  isFormValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue to Signatures
                <UserCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ✍️ MANAGER SIGNATURE STEP */}
        {step === 'manager-sign' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Manager Signature Required
              </h2>
              <p className="text-gray-600 text-sm">
                As the requesting manager, please sign below to confirm this meeting request.
              </p>
            </div>

            <div className="space-y-6">
              {/* Meeting Summary */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Meeting Request Summary</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-blue-700">Employee:</span>
                    <span className="text-blue-600">{selectedEmployee?.profile.firstName} {selectedEmployee?.profile.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-blue-700">Department:</span>
                    <span className="text-blue-600">{selectedEmployee?.profile.department || selectedEmployee?.employment.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-blue-700">Context:</span>
                    <span className="text-blue-600">"{context}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-blue-700">Requested by:</span>
                    <span className="text-blue-600">{user?.firstName} {user?.lastName}</span>
                  </div>
                </div>
              </div>

              {/* Manager Signature */}
              <InlineSignatureCanvas
                onSignatureChange={handleManagerSignature}
                label="Manager Signature"
                required={true}
              />
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep('form')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>
              
              <div className="text-sm text-gray-500">
                Sign above to continue to employee consent
              </div>
            </div>
          </div>
        )}

        {/* 👤 EMPLOYEE DECISION STEP */}
        {step === 'employee-decision' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Employee Consent
              </h2>
              <p className="text-gray-600 text-sm">
                {selectedEmployee?.profile.firstName}, do you agree to this HR meeting request?
              </p>
            </div>

            {/* Employee Info */}
            <div className="bg-purple-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-purple-900 mb-4">Meeting Request for You</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-purple-700">Requested by:</span>
                  <span className="text-purple-600">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-purple-700">Context:</span>
                  <span className="text-purple-600">"{context}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-purple-700">Date Requested:</span>
                  <span className="text-purple-600">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Employee Decision Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => handleEmployeeDecision(true)}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <UserCheck className="w-5 h-5" />
                I Agree to This Meeting
              </button>
              
              <button
                onClick={() => handleEmployeeDecision(false)}
                className="w-full bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <UserX className="w-5 h-5" />
                I Do Not Consent (Manager Request Only)
              </button>
            </div>

            {showEmployeeSignature && (
              <div className="mt-8 space-y-6">
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Employee Signature Required</h3>
                  <InlineSignatureCanvas
                    onSignatureChange={handleEmployeeSignature}
                    label="Employee Signature"
                    required={true}
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <p className="text-sm text-gray-500">
                Your response will be recorded and sent to HR
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};