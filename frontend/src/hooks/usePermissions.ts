// frontend/src/hooks/usePermissions.ts
import { useAuth } from '../auth/AuthContext';
import { ROLE_PERMISSIONS } from '../permissions/roleDefinitions';

export interface PermissionCheck {
  canAccess: (resource: string, action: string, targetId?: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  hasRole: (roleId: string) => boolean;
  isHigherRoleThan: (roleId: string) => boolean;
  getScope: () => 'global' | 'organization' | 'department' | 'self';
}

export const usePermissions = (): PermissionCheck => {
  const { user, organization } = useAuth();

  const canAccess = (resource: string, action: string, targetId?: string): boolean => {
    if (!user) return false;

    const rolePermissions = ROLE_PERMISSIONS[user.role.id];
    if (!rolePermissions) return false;

    // Check if the role has permission for this resource and action
    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions || !resourcePermissions.includes(action)) {
      return false;
    }

    // Check scope restrictions
    const scope = rolePermissions.scope?.[0];
    
    switch (scope) {
      case 'global':
        // Super users have global access
        return true;
        
      case 'organization':
        // Business owners and HR managers are restricted to their organization
        if (!user.organizationId || !organization) return false;
        if (targetId && !targetId.startsWith(user.organizationId)) return false;
        return true;
        
      case 'department':
        // HOD/Managers are restricted to their departments
        if (!user.organizationId || !user.departmentIds) return false;
        if (targetId) {
          // Check if target belongs to one of their departments
          return user.departmentIds.some(deptId => targetId.includes(deptId));
        }
        return true;
        
      case 'self':
        // User can only access their own data
        if (targetId && targetId !== user.id) return false;
        return true;
        
      default:
        return false;
    }
  };

  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;

    // Route-based access control
    const routePermissions: Record<string, string[]> = {
      '/dashboard': ['super-user', 'executive-management', 'hr-manager', 'hod-manager'],
      
      // Super User routes
      '/organizations': ['super-user'],
      '/deploy': ['super-user'],
      '/system-analytics': ['super-user'],
      '/system-settings': ['super-user'],
      
      // Executive Management routes
      '/business-overview': ['executive-management'],
      '/compliance-reports': ['executive-management'],
      '/business-analytics': ['executive-management'],
      
      // HR Manager routes
      '/employees': ['hr-manager'],
      '/warnings': ['hr-manager'],
      '/documents': ['hr-manager'],
      '/hr-settings': ['hr-manager'],
      '/hr-analytics': ['hr-manager'],
      
      // HOD/Manager routes
      '/my-team': ['hod-manager'],
      '/create-warning': ['hod-manager'],
      '/capture-document': ['hod-manager'],
      '/my-analytics': ['hod-manager']
    };

    const allowedRoles = routePermissions[route];
    if (!allowedRoles) return false;

    return allowedRoles.includes(user.role.id);
  };

  const hasRole = (roleId: string): boolean => {
    return user?.role.id === roleId;
  };

  const isHigherRoleThan = (roleId: string): boolean => {
    if (!user) return false;
    
    const roleLevels: Record<string, number> = {
      'super-user': 1,
      'executive-management': 2,
      'hr-manager': 3,
      'hod-manager': 4
    };

    const userLevel = roleLevels[user.role.id] || 999;
    const targetLevel = roleLevels[roleId] || 999;

    return userLevel < targetLevel;
  };

  const getScope = (): 'global' | 'organization' | 'department' | 'self' => {
    if (!user) return 'self';
    
    const rolePermissions = ROLE_PERMISSIONS[user.role.id];
    return (rolePermissions?.scope?.[0] as any) || 'self';
  };

  return {
    canAccess,
    canAccessRoute,
    hasRole,
    isHigherRoleThan,
    getScope
  };
};
