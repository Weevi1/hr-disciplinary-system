// frontend/src/components/counselling/CorrectiveCounselling.tsx
// 📋 CORRECTIVE COUNSELLING COMPONENT
// Preventive discipline system for training/discussions with staff members

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Calendar, FileText, CheckCircle, AlertCircle, 
  Clock, ArrowLeft, UserCheck, UserX, Send, X, RotateCcw, Plus, Minus
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { FirebaseService } from '../../services/FirebaseService';
import { DataService } from '../../services/DataService';
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

// 🏢 COLLECTIONS
const COLLECTIONS = {
  CORRECTIVE_COUNSELLING: 'corrective_counselling'
};

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

// 🎯 PROMISE TO PERFORM ITEM
interface PromiseItemProps {
  promise: Omit<PromiseToPerform, 'id' | 'completed' | 'completedDate'>;
  index: number;
  onUpdate: (index: number, promise: Omit<PromiseToPerform, 'id' | 'completed' | 'completedDate'>) => void;
  onRemove: (index: number) => void;
}

const PromiseItem: React.FC<PromiseItemProps> = ({ promise, index, onUpdate, onRemove }) => {
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-800">Promise to Perform #{index + 1}</h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commitment Description *
          </label>
          <textarea
            value={promise.description}
            onChange={(e) => onUpdate(index, { ...promise, description: e.target.value })}
            placeholder="e.g., 'I will arrive to work on time every day' or 'I will complete the customer service training course'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target / Follow-up Date *
          </label>
          <input
            type="date"
            value={promise.targetDate}
            onChange={(e) => onUpdate(index, { ...promise, targetDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min 3 days from now
            max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Max 90 days from now
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            <strong>Dual purpose:</strong> Target completion date + Follow-up review date (3-90 days from today)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Success Criteria & Notes
          </label>
          <input
            type="text"
            value={promise.notes || ''}
            onChange={(e) => onUpdate(index, { ...promise, notes: e.target.value })}
            placeholder="How will success be measured? Any additional context or resources needed?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

interface CorrectiveCounsellingProps {
  onClose?: () => void;
}

export const CorrectiveCounselling: React.FC<CorrectiveCounsellingProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();

  // 📝 FORM STATE
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<WarningCategory | null>(null);
  const [counsellingType, setCounsellingType] = useState<CounsellingType>('coaching');
  const [issueDescription, setIssueDescription] = useState('');
  const [interventionDetails, setInterventionDetails] = useState('');
  const [trainingProvided, setTrainingProvided] = useState('');
  const [resourcesProvided, setResourcesProvided] = useState<string[]>(['']);
  const [promisesToPerform, setPromisesToPerform] = useState<Omit<PromiseToPerform, 'id' | 'completed' | 'completedDate'>[]>([
    { description: '', targetDate: '', notes: '' }
  ]);
  const [employeeComments, setEmployeeComments] = useState('');
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
  const [categories, setCategories] = useState<WarningCategory[]>([]);
  const [activeCounselling, setActiveCounselling] = useState<CorrectiveCounselling[]>([]);

  // ✅ Load filtered employees and warning categories
  useEffect(() => {
    if (organization?.id && user?.id) {
      const loadData = async () => {
        console.log('📋 Loading counselling data for manager:', user.id, 'Role:', user.role?.id, 'Org:', organization.id);

        try {
          setDataLoading(true);
          setError(null);
          
          // Load employees using same pattern as BookHRMeeting
          const employeesData = await API.employees.getByManager(user?.id || '', organization.id);
          console.log('✅ Managed employees loaded:', employeesData.length);
        
          // Transform employees to the expected format
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
          
          // Load warning categories using the same method as HODDashboardSection
          let categoriesData = await DataService.getWarningCategories(organization.id);
          
          // 🔥 FALLBACK: If no categories from service, use manufacturing defaults (same as HODDashboardSection)
          if (!categoriesData || categoriesData.length === 0) {
            console.log('⚠️ No categories from service, using manufacturing defaults for counselling');
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
          
          console.log('✅ Data loaded - Employees:', transformedEmployees.length, 'Categories:', categoriesData.length);
          console.log('🔍 DEBUG Employee data:', transformedEmployees.map(emp => ({ 
            id: emp.id, 
            firstName: emp.firstName, 
            lastName: emp.lastName, 
            position: emp.position,
            fullStructure: emp 
          })));
          
        } catch (err) {
          console.error('❌ Error loading counselling data:', err);
          setError('Failed to load data. Please try again.');
          setEmployees([]);
          setCategories([]);
        } finally {
          setDataLoading(false);
        }
      };

      loadData();
    } else {
      console.log('⏳ Waiting for user or organization to load...', { userId: user?.id, orgId: organization?.id });
      setDataLoading(false);
    }
  }, [user?.id, organization?.id]);

  // 🔍 CHECK ACTIVE COUNSELLING FOR SELECTED EMPLOYEE
  const checkActiveCounselling = async (employee: Employee) => {
    if (!organization?.id) return;
    
    try {
      console.log('🔍 Checking active counselling for:', employee.firstName, employee.lastName);
      const activeSessions = await CounsellingService.getActiveCounsellingForEmployee(
        employee.id, 
        organization.id
      );
      setActiveCounselling(activeSessions);
      console.log('✅ Active counselling sessions found:', activeSessions.length);
    } catch (error) {
      console.error('❌ Error checking active counselling:', error);
      setActiveCounselling([]);
    }
  };

  // 🎯 PROMISE TO PERFORM HANDLERS
  const addPromise = () => {
    if (promisesToPerform.length < 5) {
      setPromisesToPerform([...promisesToPerform, { description: '', targetDate: '', notes: '' }]);
    }
  };

  const updatePromise = (index: number, promise: Omit<PromiseToPerform, 'id' | 'completed' | 'completedDate'>) => {
    const updated = [...promisesToPerform];
    updated[index] = promise;
    setPromisesToPerform(updated);
  };

  const removePromise = (index: number) => {
    if (promisesToPerform.length > 1) {
      setPromisesToPerform(promisesToPerform.filter((_, i) => i !== index));
    }
  };

  // 📋 RESOURCES HANDLERS
  const addResource = () => {
    setResourcesProvided([...resourcesProvided, '']);
  };

  const updateResource = (index: number, value: string) => {
    const updated = [...resourcesProvided];
    updated[index] = value;
    setResourcesProvided(updated);
  };

  const removeResource = (index: number) => {
    if (resourcesProvided.length > 1) {
      setResourcesProvided(resourcesProvided.filter((_, i) => i !== index));
    }
  };

  // ✅ VALIDATE FORM
  const isFormValid = () => {
    return selectedEmployee && 
           selectedCategory &&
           issueDescription.trim().length >= 20 &&
           interventionDetails.trim().length >= 30 &&
           promisesToPerform.length > 0 &&
           promisesToPerform.every(p => p.description.trim() && p.targetDate);
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
      submitCounsellingRecord();
    }
  };

  // ✍️ HANDLE EMPLOYEE SIGNATURE
  const handleEmployeeSignature = (signature: string) => {
    setEmployeeSignature(signature);
    if (signature) {
      submitCounsellingRecord();
    }
  };

  // 🚀 SUBMIT COUNSELLING RECORD
  const submitCounsellingRecord = async () => {
    if (!user || !selectedEmployee || !selectedCategory || !user.organizationId) return;

    try {
      setLoading(true);
      setError(null);

      // Generate promises with IDs
      const processedPromises: PromiseToPerform[] = promisesToPerform.map((p, index) => ({
        id: `${Date.now()}_${index}`,
        description: p.description.trim(),
        targetDate: p.targetDate,
        notes: p.notes?.trim() || '',
        completed: false
      }));

      // Filter out empty resources
      const filteredResources = resourcesProvided.filter(r => r.trim());

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
        trainingProvided: trainingProvided.trim(),
        resourcesProvided: filteredResources,
        promisesToPerform: processedPromises,
        improvementTimeline: '', // Legacy field - not used
        followUpDate: processedPromises.length > 0 ? processedPromises[0].targetDate : '',
        managerSignature: managerSignature || '',
        ...(employeeConsent && employeeSignature && { employeeSignature: employeeSignature }),
        employeeAcknowledged: employeeConsent || false,
        employeeComments: employeeComments.trim(),
        status: 'completed',
        improvementNoted: false,
        followUpCompleted: false,
        escalationRequired: false,
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        createdBy: user.id,
        documentVersion: 1
      };

      await FirebaseService.createDocument(COLLECTIONS.CORRECTIVE_COUNSELLING, counsellingData);
      
      setStep('complete');
      setSuccess(true);

      // Auto redirect after 5 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          navigate('/dashboard');
        }
      }, 5000);

    } catch (err) {
      console.error('❌ Error submitting counselling record:', err);
      setError('Failed to submit counselling record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🎨 RENDER LOADING STATE
  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading counselling data...</p>
          </div>
        </div>
      </div>
    );
  }

  // 🎨 RENDER MAIN FORM
  if (step === 'form') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                Corrective Counselling Session
              </h2>
              <button
                onClick={onClose || (() => navigate('/dashboard'))}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mt-2">Document training, coaching, and discussions with team members</p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Active Counselling Warning */}
            {activeCounselling.length > 0 && selectedEmployee && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-2">
                      ⚠️ Active Counselling Sessions Found
                    </h4>
                    <p className="text-amber-700 text-sm mb-3">
                      {selectedEmployee.firstName} {selectedEmployee.lastName} has {activeCounselling.length} active counselling session(s):
                    </p>
                    <div className="space-y-2">
                      {activeCounselling.map(session => (
                        <div key={session.id} className="bg-amber-100 rounded p-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-amber-900">{session.category}</span>
                              <span className="text-amber-700 ml-2">({session.counsellingType})</span>
                            </div>
                            <span className="text-amber-600">
                              {new Date(session.dateCreated).toLocaleDateString()}
                            </span>
                          </div>
                          {session.followUpDate && (
                            <div className="text-amber-600 mt-1">
                              Follow-up due: {new Date(session.followUpDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-amber-700 text-sm mt-3">
                      <strong>You can still proceed</strong> with additional counselling, but consider if follow-up on existing sessions might be more appropriate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Employee Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee *
                </label>
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find(emp => emp.id === e.target.value);
                    setSelectedEmployee(emp || null);
                    if (emp) {
                      checkActiveCounselling(emp);
                    } else {
                      setActiveCounselling([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    {dataLoading ? 'Loading employees...' : employees.length === 0 ? 'No employees found' : 'Choose an employee...'}
                  </option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Category *
                </label>
                <select
                  value={selectedCategory?.id || ''}
                  onChange={(e) => {
                    const cat = categories.find(cat => cat.id === e.target.value);
                    setSelectedCategory(cat || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* Counselling Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Counselling Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COUNSELLING_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCounsellingType(type.id)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      counsellingType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue/Topic Description *
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue, topic, or area for improvement that prompted this counselling session..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                minLength={20}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {issueDescription.length}/500 characters (minimum 20)
              </p>
            </div>

            {/* Intervention Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervention Details *
              </label>
              <textarea
                value={interventionDetails}
                onChange={(e) => setInterventionDetails(e.target.value)}
                placeholder="Describe what was discussed, taught, or addressed during the counselling session..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                minLength={30}
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {interventionDetails.length}/1000 characters (minimum 30)
              </p>
            </div>

            {/* Training & Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Provided
                </label>
                <textarea
                  value={trainingProvided}
                  onChange={(e) => setTrainingProvided(e.target.value)}
                  placeholder="Describe any specific training provided..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resources Provided
                </label>
                <div className="space-y-2">
                  {resourcesProvided.map((resource, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={resource}
                        onChange={(e) => updateResource(index, e.target.value)}
                        placeholder="Resource name or description"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {resourcesProvided.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResource(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addResource}
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Resource
                  </button>
                </div>
              </div>
            </div>

            {/* Promises to Perform */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Promises to Perform & Follow-up Schedule *
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Employee commitments with target completion and review dates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPromise}
                  disabled={promisesToPerform.length >= 5}
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Promise ({promisesToPerform.length}/5)
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">What are Promises to Perform?</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Specific, measurable commitments the employee makes to improve performance or behavior. 
                      Each promise includes <strong>what</strong> will be done and <strong>when</strong> it will be completed and reviewed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {promisesToPerform.map((promise, index) => (
                  <PromiseItem
                    key={index}
                    promise={promise}
                    index={index}
                    onUpdate={updatePromise}
                    onRemove={removePromise}
                  />
                ))}
              </div>
            </div>

            {/* Employee Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Comments
              </label>
              <textarea
                value={employeeComments}
                onChange={(e) => setEmployeeComments(e.target.value)}
                placeholder="Optional comments from the employee..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={onClose || (() => navigate('/dashboard'))}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => setStep('manager-sign')}
                disabled={!isFormValid()}
                className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <UserCheck className="w-8 h-8 text-blue-600" />
              Manager Signature Required
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Please sign to confirm that you conducted this counselling session with{' '}
                <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>.
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
                onClick={() => setStep('form')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Form
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
                <UserX className="w-8 h-8 text-blue-600" />
                Employee Acknowledgment
              </h2>
              <button
                onClick={onClose || (() => navigate('/dashboard'))}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Please ask <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> if they 
                acknowledge this counselling session and would like to provide their signature.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Employee signature is optional but recommended for documentation purposes.
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
                    <UserX className="w-4 h-4" />
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
                    onClick={() => submitCounsellingRecord()}
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
              Counselling Session Recorded
            </h2>
            
            <p className="text-gray-600 mb-6">
              The corrective counselling session with {selectedEmployee?.firstName} {selectedEmployee?.lastName} has been 
              successfully documented and will be available to HR for review.
            </p>
            
            <button
              onClick={onClose || (() => navigate('/dashboard'))}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Redirecting automatically in a few seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};