// frontend/src/components/warnings/enhanced/steps/components/EmployeeSelector.tsx
// 🎯 FOCUSED EMPLOYEE SELECTOR - V2 TREATMENT
// ✅ Extracted from CombinedIncidentStep, optimized for performance
// ✅ Mobile-first design, real-time search, warning history integration

import React, { useState, useMemo, useCallback } from 'react';
import { User, Search, AlertTriangle, ChevronDown, ChevronUp, Clock, Shield } from 'lucide-react';
import type { EmployeeWithContext } from '../../../../../services/WarningService';

interface EmployeeSelectorProps {
  employees: EmployeeWithContext[];
  selectedEmployeeId: string | null;
  onEmployeeSelect: (employeeId: string) => void;
  warningHistory?: any[];
  isLoadingWarningHistory?: boolean;
  disabled?: boolean;
  className?: string;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployeeId,
  onEmployeeSelect,
  warningHistory = [],
  isLoadingWarningHistory = false,
  disabled = false,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetails, setShowDetails] = useState(!!selectedEmployeeId);
  const [isOpen, setIsOpen] = useState(false);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => {
      // EmployeeWithContext uses flat structure, not nested profile
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const employeeNumber = emp.id?.toLowerCase() || ''; // Use id as employee number for now
      const department = emp.department?.toLowerCase() || '';
      
      return fullName.includes(term) || 
             employeeNumber.includes(term) || 
             department.includes(term);
    });
  }, [employees, searchTerm]);

  // Get selected employee
  const selectedEmployee = useMemo(() => 
    employees.find(emp => emp.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  // Handle employee selection
  const handleEmployeeSelect = useCallback((employeeId: string) => {
    onEmployeeSelect(employeeId);
    setShowDetails(true);
    setIsOpen(false);
    setSearchTerm("");
  }, [onEmployeeSelect]);

  // Get risk assessment
  const getRiskLevel = (employee: EmployeeWithContext) => {
    if (!employee.riskIndicators) return 'low';
    return employee.riskIndicators.highRisk ? 'high' : 'medium';
  };

  // Get recent warnings summary
  const getWarningsSummary = (employee: EmployeeWithContext) => {
    if (!employee.recentWarnings) return null;
    
    const { count, lastDate, level } = employee.recentWarnings;
    return { count, lastDate, level };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Employee Selection</h3>
            <p className="text-sm text-gray-600">Choose the employee involved in this incident</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredEmployees.length} employees
        </div>
      </div>

      {/* Employee Selector Dropdown */}
      <div className="relative">
        <div className="space-y-2">
          {/* Search/Selected Employee Display */}
          <div 
            className={`
              relative border rounded-lg cursor-pointer transition-all
              ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 hover:border-gray-400'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            {selectedEmployee ? (
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {selectedEmployee.firstName?.charAt(0)}{selectedEmployee.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedEmployee.id} • {selectedEmployee.department}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">Select an employee...</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            )}
          </div>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, employee number, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Employee List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredEmployees.length > 0 ? (
                  <div className="py-2">
                    {filteredEmployees.map(employee => {
                      const riskLevel = getRiskLevel(employee);
                      const warningsSummary = getWarningsSummary(employee);
                      
                      return (
                        <button
                          key={employee.id}
                          onClick={() => handleEmployeeSelect(employee.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium text-xs">
                                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate">
                                  {employee.firstName} {employee.lastName}
                                </div>
                                <div className="text-sm text-gray-600 truncate">
                                  {employee.id} • {employee.position}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {employee.department}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {/* Risk Indicator */}
                              {riskLevel === 'high' && (
                                <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                  High Risk
                                </div>
                              )}
                              {/* Warning Count */}
                              {warningsSummary && warningsSummary.count > 0 && (
                                <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                  {warningsSummary.count} warnings
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No employees found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Employee Details */}
      {selectedEmployee && showDetails && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Employee Details</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">Contact Information</div>
                <div className="text-sm text-gray-600 mt-1">
                  📧 {selectedEmployee.email || 'No email'}<br />
                  📱 {selectedEmployee.phone || 'No phone'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Position Details</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedEmployee.position}<br />
                  {selectedEmployee.department}
                </div>
              </div>
            </div>

            {/* Warning History & Risk */}
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Warning History</div>
                {isLoadingWarningHistory ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 animate-spin" />
                    Loading history...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Warnings:</span>
                      <span className="font-medium text-gray-900">
                        {selectedEmployee.recentWarnings?.count || 0}
                      </span>
                    </div>
                    {selectedEmployee.recentWarnings?.lastDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Warning:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedEmployee.recentWarnings.lastDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Risk Indicators */}
              {selectedEmployee.riskIndicators && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Risk Assessment</div>
                  <div className={`
                    inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
                    ${selectedEmployee.riskIndicators.highRisk 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                    }
                  `}>
                    <Shield className="w-4 h-4" />
                    {selectedEmployee.riskIndicators.highRisk ? 'High Risk' : 'Low Risk'}
                  </div>
                  {selectedEmployee.riskIndicators.reasons.length > 0 && (
                    <div className="mt-2">
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedEmployee.riskIndicators.reasons.slice(0, 3).map((reason, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};