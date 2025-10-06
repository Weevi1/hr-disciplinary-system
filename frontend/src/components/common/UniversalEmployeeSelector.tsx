// frontend/src/components/common/UniversalEmployeeSelector.tsx
// 🎯 UNIVERSAL EMPLOYEE SELECTOR - Based on Enhanced Warning Wizard Step 1
// ✅ Uses modal-system.css for consistent styling across all modals
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Real-time search, dropdown, and mobile modal patterns
// 🎨 CSS variables for theming consistency

import React, { useState, useMemo, useCallback } from 'react';
import { User, Search, ChevronDown, ChevronUp, X } from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email?: string;
  phone?: string;
}

interface UniversalEmployeeSelectorProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onEmployeeSelect: (employeeId: string) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const UniversalEmployeeSelector: React.FC<UniversalEmployeeSelectorProps> = ({
  employees,
  selectedEmployeeId,
  onEmployeeSelect,
  disabled = false,
  className = "",
  title = "Employee Selection",
  subtitle = "Choose the employee for this action"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModal, setIsMobileModal] = useState(false);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;

    const term = searchTerm.toLowerCase();
    return employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const department = emp.department?.toLowerCase() || '';

      return fullName.includes(term) ||
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

  return (
    <div className={`form-section ${className}`}>
      {/* Section Header - Modal System */}
      <div className="unified-section-header">
        <div className="unified-section-header__icon">
          <User className="w-5 h-5" />
        </div>
        <div className="unified-section-header__content">
          <h3 className="unified-section-header__title">{title}</h3>
          <p className="unified-section-header__subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Employee Selector Dropdown */}
      <div className="relative">
        <div className="space-y-2">
          {/* Selected Employee Display - Modal System */}
          <div
            className={`cursor-pointer transition-all min-h-[48px] p-3 rounded border ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}`}
            style={{
              backgroundColor: 'var(--color-input-background)',
              borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-input-border)',
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
          </div>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="fixed top-20 left-4 right-4 z-[10001] rounded-lg shadow-lg max-h-80 overflow-hidden md:absolute md:top-full md:left-0 md:right-0"
                 style={{
                   backgroundColor: 'var(--color-background)',
                   border: '1px solid var(--color-border)'
                 }}>
              {/* Search Input */}
              <div className="p-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: 'var(--color-text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded border text-sm focus:ring-2"
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text)',
                      '--ring-color': 'var(--color-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Employee List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredEmployees.length > 0 ? (
                  <div className="py-2">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => handleEmployeeSelect(employee.id)}
                        className="w-full text-left px-3 py-2 transition-colors hover:bg-opacity-50"
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
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                               style={{ backgroundColor: 'var(--color-primary-light)' }}>
                            <span className="font-semibold text-xs" style={{ color: 'var(--color-primary)' }}>
                              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                              {employee.position} • {employee.department}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <User className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees available'}
                    </p>
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
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Select Employee</h3>
              <button
                onClick={handleMobileModalClose}
                className="p-2 rounded-full hover:bg-opacity-10"
                style={{ backgroundColor: 'var(--color-text-tertiary)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                        style={{ color: 'var(--color-text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>
            </div>

            {/* Mobile Employee List */}
            <div className="mobile-category-list">
              {filteredEmployees.length > 0 ? (
                <div>
                  {filteredEmployees.map(employee => (
                    <button
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee.id)}
                      className="w-full text-left px-4 py-3 transition-colors"
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: 'var(--color-primary-light)' }}>
                          <span className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                            {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-base" style={{ color: 'var(--color-text)' }}>
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {employee.position} • {employee.department}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <User className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {searchTerm ? `No employees found matching "${searchTerm}"` : 'No employees available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};