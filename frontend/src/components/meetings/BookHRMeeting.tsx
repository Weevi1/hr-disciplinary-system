import Logger from '../../utils/logger';
// frontend/src/components/meetings/BookHRMeeting.tsx - V2 VERSION
// ✅ V2 FEATURES: Auto-save, real-time validation, enhanced UX, memory leak prevention
// ✅ FIXED: Now uses DataService.getEmployeesForWarningCreation to respect HOD manager permissions
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FileText, CheckCircle, AlertCircle, 
  Clock, ArrowLeft, UserCheck, UserX, Send, X, RotateCcw, Save, Wifi, WifiOff
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FirebaseService } from '../../services/FirebaseService';
import { DataServiceV2 } from '../../services/DataServiceV2';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { API } from '../../api';
import type { Employee } from '../../types/core';

// 🏢 SHARDED COLLECTIONS - Use organization-specific paths
// Meetings should be stored at /organizations/{orgId}/meetings/{meetingId}

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

// 🖊️ PROFESSIONAL SIGNATURE CANVAS COMPONENT - V2 ENHANCED
interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
  label: string;
  required?: boolean;
  role?: 'manager' | 'employee';
  personName?: string;
}

const ProfessionalSignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSignatureChange, 
  label, 
  required = false,
  role = 'manager',
  personName = 'User'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [isValid, setIsValid] = useState(false);

  // Get coordinate from mouse or touch event
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    setIsDrawing(true);
    setStrokeCount(prev => prev + 1);
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  // Draw
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  // Stop drawing
  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      
      // Validate signature (basic check for meaningful content)
      const isValidSig = strokeCount >= 3; // At least 3 strokes for a valid signature
      setIsValid(isValidSig);
      
      // Don't auto-save - wait for user to click save
    }
  };

  // Save signature when user clicks save
  const saveSignature = () => {
    if (isValid && canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png', 0.8);
      onSignatureChange(dataURL);
    }
  };

  // Clear signature
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupCanvas(); // Redraw guidelines
    setHasSignature(false);
    setStrokeCount(0);
    setIsValid(false);
    onSignatureChange('');
  };

  // Setup canvas with guidelines and styling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Configure drawing context
    ctx.strokeStyle = '#1f2937'; // Professional dark gray
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    
    // Draw signature line (subtle guideline)
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, rect.height * 0.75);
    ctx.lineTo(rect.width - 20, rect.height * 0.75);
    ctx.stroke();
    ctx.restore();
  }, []);

  // Initialize canvas
  useEffect(() => {
    setupCanvas();
    
    // Handle window resize
    const handleResize = () => {
      setTimeout(setupCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const roleColors = {
    manager: {
      primary: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      accent: 'text-blue-600'
    },
    employee: {
      primary: 'purple', 
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      accent: 'text-purple-600'
    }
  };
  
  const colors = roleColors[role];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-lg font-semibold text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-sm text-gray-600 mt-1">
            {role === 'manager' ? 'Please sign below to confirm this meeting request' : `${personName}, please sign below if you agree to this meeting`}
          </p>
        </div>
        
        {/* Signature Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          isValid
            ? `bg-green-100 text-green-700`
            : hasSignature
            ? `bg-amber-100 text-amber-700`
            : `bg-gray-100 text-gray-500`
        }`}>
          {isValid ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Valid Signature
            </>
          ) : hasSignature ? (
            <>
              <Clock className="w-4 h-4" />
              Needs More Detail
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              Signature Required
            </>
          )}
        </div>
      </div>
      
      {/* Signature Canvas Container */}
      <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 transition-all duration-200 ${
        isDrawing ? 'shadow-lg scale-[1.01]' : 'shadow-sm'
      }`}>
        <div ref={containerRef} className="relative">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full h-40 rounded-lg cursor-crosshair transition-all duration-200 ${
              hasSignature 
                ? 'bg-white border-2 border-gray-300' 
                : 'bg-white border-2 border-dashed border-gray-300 hover:border-gray-400'
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }} // Prevent scrolling on touch
          />
          
          {/* Instructions Overlay (only when empty) */}
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Sign here with mouse or finger</p>
                <p className="text-xs">Your signature confirms your agreement</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex justify-between items-center">
          <div className={`text-sm ${colors.text}`}>
            {isValid ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Signature ready to save
              </span>
            ) : hasSignature ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please add more detail to your signature
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                Click/tap and drag to create your signature
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSignature}
              disabled={!hasSignature}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasSignature
                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
            
            <button
              type="button"
              onClick={saveSignature}
              disabled={!isValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isValid
                  ? `bg-${colors.primary}-600 text-white hover:bg-${colors.primary}-700`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save Signature
            </button>
          </div>
        </div>
        
        {/* Professional Note */}
        <div className={`mt-3 p-3 ${colors.bg} border ${colors.border} rounded-lg`}>
          <p className={`text-xs ${colors.text}`}>
            <strong>Note:</strong> Your digital signature has the same legal validity as a handwritten signature and confirms your agreement to this meeting request.
          </p>
        </div>
      </div>
    </div>
  );
};

export const BookHRMeeting: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // 📝 FORM STATE WITH V2 AUTO-SAVE
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [context, setContext] = useState('');
  const [managerSignature, setManagerSignature] = useState<string>('');
  const [employeeSignature, setEmployeeSignature] = useState<string>('');
  const [employeeConsent, setEmployeeConsent] = useState<boolean | null>(null);
  const [showEmployeeSignature, setShowEmployeeSignature] = useState(false);
  
  // 💾 V2: AUTO-SAVE STATE
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // 🎯 UI STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'form' | 'manager-sign' | 'employee-decision' | 'complete'>('form');
  
  // 🔄 V2: REAL-TIME VALIDATION STATE
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // 🔄 DATA STATE
  const [dataLoading, setDataLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // 💾 V2: AUTO-SAVE KEY FOR LOCAL STORAGE
  const autoSaveKey = useMemo(() => 
    `hr_meeting_draft_${user?.id}_${organization?.id}`, 
    [user?.id, organization?.id]
  );

  // 💾 V2: AUTO-SAVE FUNCTIONS
  const saveToLocalStorage = useCallback(() => {
    if (!autoSaveKey) return;
    
    const draftData = {
      selectedEmployeeId: selectedEmployee?.id || '',
      context,
      step,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(autoSaveKey, JSON.stringify(draftData));
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      Logger.debug('💾 Auto-saved HR meeting draft', draftData);
    } catch (error) {
      setAutoSaveStatus('error');
      Logger.error('Failed to auto-save HR meeting draft:', error);
    }
  }, [autoSaveKey, selectedEmployee?.id, context, step]);
  
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
      
      Logger.debug('📋 Restored HR meeting draft', draftData);
      if (draftData.context) setContext(draftData.context);
      // Note: selectedEmployee will be set after employees load
      return draftData;
    } catch (error) {
      Logger.error('Failed to restore HR meeting draft:', error);
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
      case 'context':
        if (!value?.trim()) {
          errors.context = 'Context is required';
        } else if (value.length > 80) {
          errors.context = 'Context must be 80 characters or less';
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] || '' }));
    return !errors[field];
  }, []);
  
  // ✅ FIXED: Load filtered employees using the SAME service as the warning form
  useEffect(() => {
    // Use the same positive condition pattern as HODDashboardSection
    if (organization?.id && user?.id) {
      const loadFilteredEmployees = async () => {
        Logger.debug('📋 Loading employees for manager:', user.id, 'Role:', user.role?.id, 'Org:', organization.id)

        try {
          setDataLoading(true);
          setError(null);
          
          // ✅ FIXED: Use the EXACT same approach as HODDashboardSection
          const employeesData = await API.employees.getByManager(user?.id || '', organization.id);
          Logger.success(6333);
          
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
        
          Logger.debug('👥 Employee details:', transformedEmployees.map(e => `${e.firstName} ${e.lastName}`));
          setEmployees(transformedEmployees);
          
          // 💾 V2: Restore draft after employees load
          const draftData = loadFromLocalStorage();
          if (draftData?.selectedEmployeeId) {
            const savedEmployee = transformedEmployees.find(emp => emp.id === draftData.selectedEmployeeId);
            if (savedEmployee) {
              setSelectedEmployee(savedEmployee);
              Logger.debug('🔄 Restored selected employee from draft');
            }
          }
          
        } catch (err) {
          Logger.error('❌ Error loading managed employees:', err)
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
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (!dataLoading && (selectedEmployee || context.trim())) {
      setAutoSaveStatus('saving');
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveToLocalStorage();
      }, 1000); // Save after 1 second of inactivity
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedEmployee, context, dataLoading, saveToLocalStorage]);
  
  // 🧼 V2: CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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
    Logger.debug('DEBUG: User object from AuthContext:', user)
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

      // 🔧 FIXED: Use sharded structure for meetings
      await DatabaseShardingService.createDocument(
        organization.id, 
        'meetings', 
        meetingRequestData
      );
      
      // 💾 V2: Clear auto-save on successful submission
      clearAutoSave();
      
      setStep('complete');
      setSuccess(true);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      Logger.error('Failed to submit meeting request:', err)
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
        
        {/* 📱 HEADER WITH V2 AUTO-SAVE INDICATOR */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">Book HR Meeting</h1>
                  {/* 💾 V2: AUTO-SAVE INDICATOR */}
                  {autoSaveStatus === 'saving' && (
                    <div className="flex items-center gap-1 text-blue-200 text-sm">
                      <div className="w-3 h-3 border border-blue-200 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                  {autoSaveStatus === 'saved' && lastSaved && (
                    <div className="flex items-center gap-1 text-green-200 text-sm">
                      <Save className="w-3 h-3" />
                      <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {autoSaveStatus === 'error' && (
                    <div className="flex items-center gap-1 text-red-200 text-sm">
                      <WifiOff className="w-3 h-3" />
                      <span>Save failed</span>
                    </div>
                  )}
                </div>
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
                    setTouchedFields(prev => new Set(prev).add('selectedEmployee'));
                    validateField('selectedEmployee', employee);
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('selectedEmployee'));
                    validateField('selectedEmployee', selectedEmployee);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
                    touchedFields.has('selectedEmployee') && fieldErrors.selectedEmployee
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Choose a team member...</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.profile.firstName} {employee.profile.lastName} - {employee.profile.department || employee.employment.department}
                      {employee.profile.employeeNumber && ` (#${employee.profile.employeeNumber})`}
                    </option>
                  ))}
                </select>
                {touchedFields.has('selectedEmployee') && fieldErrors.selectedEmployee && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.selectedEmployee}
                  </p>
                )}
              </div>

              {/* 📝 CONTEXT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Context <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={context}
                    onChange={(e) => {
                      setContext(e.target.value);
                      setTouchedFields(prev => new Set(prev).add('context'));
                      validateField('context', e.target.value);
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => new Set(prev).add('context'));
                      validateField('context', context);
                    }}
                    placeholder="Brief reason for HR meeting (keep it concise)..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 resize-none transition-colors ${
                      touchedFields.has('context') && fieldErrors.context
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
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
                {touchedFields.has('context') && fieldErrors.context && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.context}
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
              <ProfessionalSignatureCanvas
                onSignatureChange={handleManagerSignature}
                label="Manager Authorization Signature"
                required={true}
                role="manager"
                personName={`${user?.firstName} ${user?.lastName}`}
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
                  <ProfessionalSignatureCanvas
                    onSignatureChange={handleEmployeeSignature}
                    label="Employee Consent Signature"
                    required={true}
                    role="employee"
                    personName={`${selectedEmployee?.profile?.firstName || selectedEmployee?.firstName} ${selectedEmployee?.profile?.lastName || selectedEmployee?.lastName}`}
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