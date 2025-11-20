// frontend/src/components/dashboard/DashboardRoleSelector.tsx
// 🎯 MULTI-ROLE DASHBOARD SELECTOR
// ✅ Allows users with multiple roles to switch between dashboards
// ✅ Persists selection to localStorage
// ✅ Only shows if user has 2+ dashboard roles

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, Briefcase, Shield, Users } from 'lucide-react';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';

interface DashboardRole {
  id: 'executive-management' | 'hr-manager' | 'hod-manager';
  label: string;
  description: string;
  icon: any;
}

interface DashboardRoleSelectorProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  className?: string;
}

const STORAGE_KEY = 'hr-system-selected-dashboard-role';

export const DashboardRoleSelector = memo<DashboardRoleSelectorProps>(({
  selectedRole,
  onRoleChange,
  className = ''
}) => {
  const { canManageOrganization, canManageHR, getPrimaryRole } = useMultiRolePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build available roles based on permissions
  const availableRoles: DashboardRole[] = [];

  if (canManageOrganization()) {
    availableRoles.push({
      id: 'executive-management',
      label: 'Executive Management',
      description: 'Executive & Configuration',
      icon: Briefcase
    });
  }

  if (canManageHR()) {
    availableRoles.push({
      id: 'hr-manager',
      label: 'HR Manager',
      description: 'HR Operations & Compliance',
      icon: Shield
    });
  }

  // Show HOD option only if user has other roles beyond just being an HOD
  // Business owners and HR managers can also act as HODs
  if (canManageOrganization() || canManageHR()) {
    availableRoles.push({
      id: 'hod-manager',
      label: 'Department Manager',
      description: 'Team Management',
      icon: Users
    });
  }

  // Don't render if user has less than 2 roles
  if (availableRoles.length < 2) {
    return null;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleRoleSelect = useCallback((roleId: string) => {
    onRoleChange(roleId);
    localStorage.setItem(STORAGE_KEY, roleId);
    setIsOpen(false);
  }, [onRoleChange]);

  const selectedRoleData = availableRoles.find(r => r.id === selectedRole);
  const SelectedIcon = selectedRoleData?.icon || Briefcase;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 sm:gap-2 rounded-lg transition-all duration-200 hover:scale-105 w-full sm:w-auto"
        style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'var(--color-text-inverse)'
        }}
      >
        <SelectedIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <div className="text-left flex-1 min-w-0">
          <div className="text-[10px] sm:text-xs opacity-70 leading-none">View as</div>
          <div className="text-xs sm:text-sm font-semibold leading-tight truncate">{selectedRoleData?.label}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-72 rounded-lg shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-border)',
            zIndex: 9999
          }}
        >
          <div className="p-2">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 px-3 py-1" style={{ color: 'var(--color-text-secondary)' }}>
              Switch Dashboard View
            </div>
            {availableRoles.map((role) => {
              const Icon = role.icon;
              const isSelected = role.id === selectedRole;

              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      {role.label}
                      {isSelected && (
                        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-success)' }}>● Active</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {role.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="px-3 py-2 text-xs" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)' }}>
            💡 Your selection will be remembered for this session
          </div>
        </div>
      )}
    </div>
  );
});

DashboardRoleSelector.displayName = 'DashboardRoleSelector';

// Helper function to get initial role from storage or permissions
export function getInitialDashboardRole(
  canManageOrganization: boolean,
  canManageHR: boolean,
  getPrimaryRole: () => string
): string {
  // Get user's actual primary role
  const primaryRole = getPrimaryRole();

  // Check localStorage first
  const storedRole = localStorage.getItem(STORAGE_KEY);

  // Validate stored role against current permissions AND primary role
  // Only use stored preference if it matches user's capabilities
  if (storedRole === 'executive-management' && canManageOrganization) return storedRole;
  if (storedRole === 'hr-manager' && canManageHR) return storedRole;

  // HOD view only available if:
  // 1. User explicitly selected it before AND
  // 2. User is NOT a business-owner or hr-manager by primary role
  // This prevents Executive Managements from getting stuck in Department Manager view
  if (storedRole === 'hod-manager' &&
      (canManageOrganization || canManageHR) &&
      primaryRole !== 'executive-management' &&
      primaryRole !== 'hr-manager') {
    return storedRole;
  }

  // Default hierarchy based on primary role (no localStorage preference)
  // This ensures users always see their primary role's dashboard first
  if (primaryRole === 'executive-management' && canManageOrganization) return 'executive-management';
  if (primaryRole === 'hr-manager' && canManageHR) return 'hr-manager';
  if (primaryRole === 'hod-manager') return 'hod-manager';

  // Fallback hierarchy if primary role doesn't match permissions
  if (canManageOrganization) return 'executive-management';
  if (canManageHR) return 'hr-manager';

  return 'executive-management'; // Final fallback
}
