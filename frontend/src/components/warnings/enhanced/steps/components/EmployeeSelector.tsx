// frontend/src/components/warnings/enhanced/steps/components/EmployeeSelector.tsx
// 🎯 UNIFIED EMPLOYEE SELECTOR - THEMED V2 TREATMENT
// ✅ Uses unified theming with CSS variables and ThemedCard/ThemedButton
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Real-time search, warning history integration, mobile-first design
// ✅ Extracted from CombinedIncidentStep, optimized for performance

import React, { useState, useMemo, useCallback } from 'react';
import { User, Search, AlertTriangle, ChevronDown, ChevronUp, Clock, Shield, X } from 'lucide-react';
import type { EmployeeWithContext } from '../../../../../services/WarningService';

// Import unified theming components
import { ThemedCard, ThemedSectionHeader } from '../../../../common/ThemedCard';
import { ThemedButton } from '../../../../common/ThemedButton';
import { ThemedBadge } from '../../../../common/ThemedCard';

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
  const [showDetails, setShowDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModal, setIsMobileModal] = useState(false);

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
    setShowDetails(false);
    setIsOpen(false);
    setIsMobileModal(false);
    setSearchTerm("");
  }, [onEmployeeSelect]);

  // Handle opening selector (mobile vs desktop)
  const handleOpenSelector = useCallback(() => {
    if (disabled) return;

    // Check if mobile view
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileModal(true);
    } else {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen]);

  // Handle mobile modal close
  const handleMobileModalClose = useCallback(() => {
    setIsMobileModal(false);
    setSearchTerm("");
  }, []);

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
      <ThemedSectionHeader
        icon={User}
        title="Employee Selection"
        subtitle="Choose the employee involved in this incident"
        rightContent={
          <ThemedBadge variant="secondary" size="sm">
            {filteredEmployees.length}
          </ThemedBadge>
        }
      />

      {/* Employee Selector Dropdown */}
      <div className="relative">
        <div className="space-y-2">
          {/* Search/Selected Employee Display - Themed */}
          <ThemedCard
            hover
            padding="sm"
            className={`cursor-pointer transition-all min-h-[48px] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              borderWidth: '1px',
              borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-border)',
              boxShadow: isOpen ? '0 0 0 2px var(--color-primary-light)' : undefined
            }}
            onClick={handleOpenSelector}
          >
            {selectedEmployee ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: 'var(--color-primary-light)' }}>
                    <span className="font-semibold text-xs" style={{ color: 'var(--color-primary)' }}>
                      {selectedEmployee.firstName?.charAt(0)}{selectedEmployee.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {selectedEmployee.position} • {selectedEmployee.department}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Select an employee...
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            )}
          </ThemedCard>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
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
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900 text-sm">
                            {employee.firstName} {employee.lastName} - {employee.position}
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

      {/* Mobile Modal for Employee Selection */}
      {isMobileModal && (
        <div className="mobile-employee-modal">
          <div className="mobile-employee-modal-backdrop" onClick={handleMobileModalClose} />
          <div className="mobile-employee-modal-content">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Employee</h3>
              <button
                onClick={handleMobileModalClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Mobile Employee List */}
            <div className="mobile-category-list">
              {filteredEmployees.length > 0 ? (
                <div>
                  {filteredEmployees.map(employee => (
                    <button
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 text-base">
                        {employee.firstName} {employee.lastName} - {employee.position}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p>No employees found</p>
                  {searchTerm && (
                    <p className="text-sm text-gray-400 mt-1">
                      matching "{searchTerm}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Employee Details - Themed */}
      {selectedEmployee && showDetails && (
        <ThemedCard padding="md" className="border-2" style={{ borderColor: 'var(--color-primary-light)' }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
              Employee Details
            </h4>
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'}
            </ThemedButton>
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

              {/* Risk Indicators - Themed */}
              {selectedEmployee.riskIndicators && (
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Risk Assessment
                  </div>
                  <ThemedBadge
                    variant={selectedEmployee.riskIndicators.highRisk ? "error" : "success"}
                    size="md"
                    className="inline-flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    {selectedEmployee.riskIndicators.highRisk ? 'High Risk' : 'Low Risk'}
                  </ThemedBadge>
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
        </ThemedCard>
      )}
    </div>
  );
};