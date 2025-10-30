// frontend/src/hooks/useMultiRolePermissions.ts
// 🏆 ENHANCED MULTI-ROLE PERMISSION SYSTEM
// ✅ BACKWARDS COMPATIBLE with existing single-role system
// 🚀 SUPPORTS future multi-role users

import { useAuth } from '../auth/AuthContext';

interface MultiRolePermissions {
  // 🏢 Business Owner Functions
  canViewBusinessMetrics: () => boolean;
  canManageOrganization: () => boolean;
  canViewComplianceReports: () => boolean;
  canManageOrganizationSettings: () => boolean;

  // 👥 HR Manager Functions
  canManageEmployees: () => boolean;
  canManageHR: () => boolean;
  canReviewWarnings: () => boolean;
  canReviewDocuments: () => boolean;
  canManageUsers: () => boolean;
  canManageDepartments: () => boolean;
  canCreateHRManagers: () => boolean;
  canCreateHODManagers: () => boolean;

  // ⚠️ HOD Manager Functions
  canCreateWarnings: () => boolean;
  canCaptureDocuments: () => boolean;
  canViewTeamMembers: () => boolean;
  canManageTeam: () => boolean;

  // 📋 Category Management Functions
  canManageCategories: boolean;
  canViewAnalytics: boolean;

  // 🛡️ Utility Functions
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  getPrimaryRole: () => string;
  getAllRoles: () => string[];
}

export const useMultiRolePermissions = (): MultiRolePermissions => {
  const { user } = useAuth();

  // 🔧 BACKWARDS COMPATIBLE: Extract roles from user
  const getUserRoles = (): string[] => {
    if (!user) return [];
    
    // Handle current single-role system
    const primaryRole = user.role?.id || user.role;
    if (!primaryRole) return [];
    
    // 🚀 FUTURE: Support multi-role system
    // When user.additionalRoles is implemented, merge them:
    // return [primaryRole, ...(user.additionalRoles || [])];
    
    // For now, return single role as array
    return [primaryRole];
  };

  const userRoles = getUserRoles();

  // 🛡️ Core role checking functions
  const hasRole = (role: string): boolean => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => userRoles.includes(role));
  };

  const getPrimaryRole = (): string => {
    return userRoles[0] || 'unknown';
  };

  const getAllRoles = (): string[] => {
    return [...userRoles];
  };

  // 🏢 BUSINESS OWNER PERMISSIONS
  const canViewBusinessMetrics = (): boolean => {
    return hasRole('business-owner') || hasRole('super-user');
  };

  const canManageOrganization = (): boolean => {
    return hasRole('business-owner') || hasRole('super-user');
  };

  const canViewComplianceReports = (): boolean => {
    return hasAnyRole(['business-owner', 'hr-manager', 'super-user']);
  };

  const canManageOrganizationSettings = (): boolean => {
    return hasRole('business-owner') || hasRole('super-user');
  };

  // 👥 HR MANAGER PERMISSIONS
  const canManageEmployees = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  const canManageHR = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  const canReviewWarnings = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  const canReviewDocuments = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  const canManageDepartments = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  const canCreateHRManagers = (): boolean => {
    return hasRole('business-owner') || hasRole('super-user');
  };

  const canCreateHODManagers = (): boolean => {
    return hasAnyRole(['hr-manager', 'business-owner', 'super-user']);
  };

  // ⚠️ HOD MANAGER PERMISSIONS
  const canCreateWarnings = (): boolean => {
    return hasAnyRole(['hod-manager', 'hr-manager', 'business-owner', 'super-user']);
  };

  const canCaptureDocuments = (): boolean => {
    return hasAnyRole(['hod-manager', 'hr-manager', 'super-user']);
  };

  const canViewTeamMembers = (): boolean => {
    return hasAnyRole(['hod-manager', 'hr-manager', 'business-owner', 'super-user']);
  };

  const canManageTeam = (): boolean => {
    return hasAnyRole(['hod-manager', 'hr-manager', 'business-owner', 'super-user']);
  };

  // 📋 CATEGORY MANAGEMENT PERMISSIONS
  // Resellers can manage their client's categories
  // HR managers and business owners can manage their organization's categories
  // Super users can manage any organization's categories
  const canManageCategories = hasAnyRole(['reseller', 'hr-manager', 'business-owner', 'super-user']);
  const canViewAnalytics = hasAnyRole(['reseller', 'hr-manager', 'business-owner', 'super-user']);

  return {
    // Business Owner Functions
    canViewBusinessMetrics,
    canManageOrganization,
    canViewComplianceReports,
    canManageOrganizationSettings,

    // HR Manager Functions
    canManageEmployees,
    canManageHR,
    canReviewWarnings,
    canReviewDocuments,
    canManageUsers,
    canManageDepartments,
    canCreateHRManagers,
    canCreateHODManagers,

    // HOD Manager Functions
    canCreateWarnings,
    canCaptureDocuments,
    canViewTeamMembers,
    canManageTeam,

    // Category Management Functions
    canManageCategories,
    canViewAnalytics,

    // Utility Functions
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getPrimaryRole,
    getAllRoles
  };
};
