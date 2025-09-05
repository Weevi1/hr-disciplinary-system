// frontend/src/components/warnings/enhanced/steps/CombinedIncidentStep.tsx
// 🏆 FIXED COMBINED INCIDENT STEP - USES UNIVERSALCATEGORIES
// ✅ Fixed escalation path display to use actual escalation logic
// ✅ Shows correct escalation paths with counselling support
// ✅ Uses UniversalCategories as single source of truth
// ✅ No more mismatch between displayed paths and actual logic

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  User,
  Brain,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  Timer,
  PenTool,
  Target,
  Lightbulb,
  ChevronUp,
  Loader2,
  Scale,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Import from service layer
import type { 
  EscalationRecommendation,
  EmployeeWithContext,
  WarningCategory,
  EnhancedWarningFormData
} from '../../../../services/WarningService';

// Import from UniversalCategories - our single source of truth
import { 
  getEscalationPath,
  getLevelLabel,
  getCategoryById
} from '../../../../services/UniversalCategories';

// ============================================
// TYPES & INTERFACES
// ============================================

type Employee = EmployeeWithContext;
type Category = WarningCategory;
type FormData = EnhancedWarningFormData;

interface WritingAssistance {
  wordCount: number;
  isMinimumMet: boolean;
}

interface CombinedIncidentStepProps {
  employees: Employee[];
  categories: Category[];
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  selectedEmployee?: Employee;
  selectedCategory?: Category;
  warningHistory?: any[];
  isLoadingWarningHistory?: boolean;
  loadWarningHistory?: (employeeId: string) => void;
  lraRecommendation?: EscalationRecommendation | null;
  isAnalyzing?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const CombinedIncidentStep: React.FC<CombinedIncidentStepProps> = ({
  employees,
  categories,
  formData,
  updateFormData,
  selectedEmployee,
  selectedCategory,
  warningHistory = [],
  isLoadingWarningHistory = false,
  loadWarningHistory,
  lraRecommendation,
  isAnalyzing = false
}) => {
  // ============================================
  // STATE
  // ============================================
  
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(!!formData.employeeId);
  const [showCategoryDetails, setShowCategoryDetails] = useState(!!formData.categoryId);
  const [writingAssistance, setWritingAssistance] = useState<WritingAssistance | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showLRAPreview, setShowLRAPreview] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // ============================================
  // EFFECTS
  // ============================================
  
  useEffect(() => {
    setShowEmployeeDetails(!!selectedEmployee);
  }, [selectedEmployee]);

  useEffect(() => {
    setShowCategoryDetails(!!selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (formData.incidentDescription) {
      const wordCount = formData.incidentDescription.trim().split(/\s+/).length;
      const isMinimumMet = wordCount >= 10 && formData.incidentDescription.length >= 20;
      
      setWritingAssistance({
        wordCount,
        isMinimumMet
      });
    } else {
      setWritingAssistance(null);
    }
  }, [formData.incidentDescription]);

  // ============================================
  // 🎯 FIXED: GET ACTUAL ESCALATION PATH FROM UNIVERSALCATEGORIES
  // ============================================
  
  const actualEscalationPath = useMemo(() => {
    if (!selectedCategory?.id) {
      return [];
    }
    
    // Use UniversalCategories as the single source of truth
    const actualPath = getEscalationPath(selectedCategory.id);
    console.log('🎯 [ESCALATION PATH] Using UniversalCategories path for', selectedCategory.id, ':', actualPath);
    
    return actualPath;
  }, [selectedCategory?.id]);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleEmployeeSelect = useCallback((employee: Employee) => {
    updateFormData({ employeeId: employee.id });
    
    if (loadWarningHistory && !isLoadingWarningHistory) {
      console.log('🔍 Loading warning history for employee:', employee.id);
      loadWarningHistory(employee.id);
    }
  }, [updateFormData, loadWarningHistory, isLoadingWarningHistory]);

  const handleCategorySelect = useCallback((category: Category) => {
    updateFormData({ categoryId: category.id });
    console.log('📋 Selected category:', category.name, 'ID:', category.id);
    
    // Log the actual escalation path that will be used
    const actualPath = getEscalationPath(category.id);
    console.log('🎯 Actual escalation path from UniversalCategories:', actualPath);
  }, [updateFormData]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ incidentDescription: e.target.value });
  }, [updateFormData]);

  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderEscalationPath = () => {
    if (!actualEscalationPath.length) {
      return (
        <div className="text-sm text-gray-500">
          Select a category to see escalation path
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
        {actualEscalationPath.map((level, index) => (
          <React.Fragment key={level || index}>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
              {getLevelLabel(level)}
            </span>
            {index < actualEscalationPath.length - 1 && (
              <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* 👤 EMPLOYEE SELECTION */}
      {/* ============================================ */}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Employee Selection</h3>
              <p className="text-sm text-gray-600">Choose the employee for this warning</p>
            </div>
          </div>
          
          {selectedEmployee && (
            <div className="text-sm text-green-600 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Selected</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="relative">
            <select
              value={formData.employeeId}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === e.target.value);
                if (employee) {
                  handleEmployeeSelect(employee);
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select an employee...</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName} - {employee.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Details */}
        {selectedEmployee && showEmployeeDetails && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Employee Details</h4>
              <button
                onClick={() => setShowEmployeeDetails(!showEmployeeDetails)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
              >
                <span>{showEmployeeDetails ? 'Hide' : 'Show'} Details</span>
                {showEmployeeDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
              </div>
              <div>
                <span className="text-gray-600">Position:</span>
                <div className="font-medium">{selectedEmployee.position}</div>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <div className="font-medium">{selectedEmployee.department}</div>
              </div>
            </div>

            {/* Warning History Loading */}
            {isLoadingWarningHistory && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading warning history...</span>
              </div>
            )}

            {/* Risk Indicators */}
            {selectedEmployee.riskIndicators.highRisk && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>High Risk Employee - {selectedEmployee.riskIndicators.reasons.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* 📋 CATEGORY SELECTION */}
      {/* ============================================ */}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Category Selection</h3>
              <p className="text-sm text-gray-600">Choose the appropriate warning category</p>
            </div>
          </div>
          
          {selectedCategory && (
            <div className="text-sm text-green-600 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Selected</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <select
            value={formData.categoryId}
            onChange={(e) => {
              const category = categories.find(cat => cat.id === e.target.value);
              if (category) {
                handleCategorySelect(category);
              }
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.severity?.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Category Details */}
        {selectedCategory && showCategoryDetails && (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Category Details</h4>
              <button
                onClick={() => setShowCategoryDetails(!showCategoryDetails)}
                className="text-purple-600 hover:text-purple-700 text-sm flex items-center space-x-1"
              >
                <span>{showCategoryDetails ? 'Hide' : 'Show'} Details</span>
                {showCategoryDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="text-sm text-gray-900">{selectedCategory.description}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-sm text-gray-600">Severity:</span>
                  <div className={`
                    inline-block ml-2 px-2 py-1 rounded text-xs font-medium
                    ${selectedCategory.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedCategory.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedCategory.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }
                  `}>
                    {selectedCategory.severity?.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* 🎯 FIXED: ACTUAL ESCALATION PATH FROM UNIVERSALCATEGORIES */}
              <div className="mt-3">
                <span className="font-medium text-gray-700 text-xs">Actual Escalation Path:</span>
                {renderEscalationPath()}
                
                {/* Show comparison if there's a mismatch */}
                {selectedCategory.escalationPath && 
                 JSON.stringify(selectedCategory.escalationPath) !== JSON.stringify(actualEscalationPath) && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs text-yellow-700">
                      <strong>Note:</strong> The escalation logic uses a different path than the category data.
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Category data: {selectedCategory.escalationPath?.map(level => getLevelLabel(level)).join(' → ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Universal Category Info */}
              {getCategoryById(selectedCategory.id) && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs text-blue-700">
                    <strong>✅ LRA Compliant:</strong> This category follows South African labor law requirements
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {getCategoryById(selectedCategory.id)?.lraSection}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* 📝 INCIDENT DETAILS */}
      {/* ============================================ */}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Incident Details</h3>
            <p className="text-sm text-gray-600">Document the specific incident information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Incident Date
            </label>
            <input
              type="date"
              value={formData.incidentDate}
              onChange={(e) => updateFormData({ incidentDate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Incident Time
            </label>
            <input
              type="time"
              value={formData.incidentTime}
              onChange={(e) => updateFormData({ incidentTime: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Incident Location
          </label>
          <input
            type="text"
            value={formData.incidentLocation}
            onChange={(e) => updateFormData({ incidentLocation: e.target.value })}
            placeholder="e.g., Production Floor, Office, Reception"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              <PenTool className="w-4 h-4 inline mr-2" />
              Incident Description
            </label>
            
            {writingAssistance && (
              <div className={`text-xs px-2 py-1 rounded ${
                writingAssistance.isMinimumMet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {writingAssistance.wordCount} words {writingAssistance.isMinimumMet ? '✓' : '(min 10)'}
              </div>
            )}
          </div>

          <textarea
            ref={descriptionRef}
            value={formData.incidentDescription}
            onChange={handleDescriptionChange}
            placeholder="Provide a detailed, objective description of what happened. Include specific actions, times, and any relevant context..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[120px] resize-y"
          />

          {/* Writing Tips */}
          <div className="mt-2">
            <button
              onClick={() => setShowGuidance(!showGuidance)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{showGuidance ? 'Hide' : 'Show'} Writing Tips</span>
            </button>
            
            {showGuidance && (
              <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <div className="font-medium mb-2">Writing Tips:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Be objective and factual - avoid opinions or assumptions</li>
                  <li>• Include specific dates, times, and locations</li>
                  <li>• Describe what you observed, not what you think happened</li>
                  <li>• Mention any witnesses present</li>
                  <li>• Reference relevant company policies if applicable</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={formData.additionalNotes || ''}
            onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
            placeholder="Any additional context, mitigating factors, or relevant information..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[80px] resize-y"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* 🎯 LRA RECOMMENDATION PREVIEW */}
      {/* ============================================ */}
      
      {lraRecommendation && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Scale className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">LRA Recommendation Preview</h3>
                <p className="text-sm text-gray-600">AI-powered progressive discipline analysis</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowLRAPreview(!showLRAPreview)}
              className="text-orange-600 hover:text-orange-700 text-sm flex items-center space-x-1"
            >
              <span>{showLRAPreview ? 'Hide' : 'Show'} Details</span>
              {showLRAPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {lraRecommendation.recommendedLevel || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Recommended Action</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {lraRecommendation.isEscalation ? 'YES' : 'NO'}
              </div>
              <div className="text-sm text-gray-600">Escalation Required</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {lraRecommendation.legalRequirements?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Legal Requirements</div>
            </div>
          </div>

          {showLRAPreview && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Escalation Reason</h4>
                <p className="text-sm text-gray-700">{lraRecommendation.reason || 'No reason provided'}</p>
              </div>
              
              {lraRecommendation.legalRequirements && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Legal Requirements</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {lraRecommendation.legalRequirements.slice(0, 3).map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* 📅 WARNING VALIDITY */}
      {/* ============================================ */}
      
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Timer className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Warning Validity</h3>
            <p className="text-sm text-gray-600">Set the duration this warning will remain active</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => updateFormData({ issueDate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Validity Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validity Period
            </label>
            <select
              value={formData.validityPeriod}
              onChange={(e) => updateFormData({ validityPeriod: parseInt(e.target.value) as 3 | 6 | 12 })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <h4 className="font-medium text-blue-900">Analyzing Incident</h4>
              <p className="text-sm text-blue-700">Applying progressive discipline matrix and LRA compliance checks...</p>
            </div>
          </div>
          
          <div className="mt-3 space-y-2 text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Employee history reviewed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Incident severity assessed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
              <span>Applying LRA escalation matrix...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};