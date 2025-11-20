// frontend/src/permissions/roleDefinitions.ts
import type { UserRole, Permission } from '../types';

export const USER_ROLES: Record<string, UserRole> = {
  'super-user': {
    id: 'super-user',
    name: 'Super User',
    description: 'System administrator with global access',
    level: 1
  },
  'reseller': {
    id: 'reseller',
    name: 'Reseller',
    description: 'Provincial sales partner with client management',
    level: 1.5
  },
  'executive-management': {
    id: 'executive-management',
    name: 'Executive Management',
    description: 'Senior leadership with organization overview',
    level: 2
  },
  'hr-manager': {
    id: 'hr-manager',
    name: 'HR Manager',
    description: 'Human Resources with employee management',
    level: 3
  },
  'hod-manager': {
    id: 'hod-manager',
    name: 'HOD/Manager',
    description: 'Department head with warning creation',
    level: 4
  }
};

export const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  'super-user': {
    organizations: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    system: ['configure', 'deploy', 'monitor'],
    employees: ['create', 'read', 'update', 'delete'],
    warnings: ['create', 'read', 'update', 'delete'],
    documents: ['create', 'read', 'update', 'delete'],
    analytics: ['read', 'export'],
    resellers: ['create', 'read', 'update', 'delete'],
    scope: ['global']
  },
  'reseller': {
    clients: ['read', 'update'], // Can view and edit limited client info
    organizations: ['create', 'read'], // Can deploy and view their client organizations
    commissions: ['read', 'export'], // View their earnings and statements
    analytics: ['read'], // View their performance metrics
    reports: ['read', 'export'], // Generate commission reports
    contacts: ['update'], // Can update client contact details
    billing: ['read', 'update'], // Can view and update billing preferences
    deployment: ['create'], // Can deploy new client organizations
    scope: ['assigned-clients'] // Limited to assigned client organizations
  },
  'executive-management': {
    organization: ['read'],
    users: ['create', 'read', 'update', 'deactivate'], // ✅ NEW: Organization user management
    employees: ['read'],
    warnings: ['read'],
    documents: ['read'],
    analytics: ['read', 'export'],
    reports: ['read', 'export'],
    scope: ['organization']
  },
  'hr-manager': {
    employees: ['create', 'read', 'update', 'delete'],
    users: ['read', 'update'], // ✅ NEW: Limited user management (profile updates only)
    warnings: ['read', 'update'],
    documents: ['read'],
    categories: ['configure'],
    analytics: ['read'],
    reports: ['read', 'export'],
    scope: ['organization']
  },
  'hod-manager': {
    employees: ['read'], // Only their department
    warnings: ['create', 'read'], // Only for their reports
    documents: ['create'], // Photo capture
    analytics: ['read'], // Limited to their department
    scope: ['department']
  }
};

// ✅ NEW: User Management Constraints
export const USER_MANAGEMENT_RULES = {
  'super-user': {
    canManage: ['super-user', 'reseller', 'executive-management', 'hr-manager', 'hod-manager'],
    canCreate: ['reseller', 'executive-management', 'hr-manager', 'hod-manager'],
    canDelete: ['reseller', 'executive-management', 'hr-manager', 'hod-manager'],
    scope: 'global'
  },
  'reseller': {
    canManage: [], // Cannot manage user accounts
    canCreate: false,
    canDelete: false,
    canUpdate: false,
    scope: 'assigned-clients',
    restrictions: [
      'Cannot create or manage user accounts',
      'Cannot access employee data or warnings',
      'Can only view and update assigned client organizations',
      'Limited to commission and billing information'
    ]
  },
  'executive-management': {
    canManage: ['hr-manager', 'hod-manager'], // Cannot manage other executives
    canCreate: ['hr-manager', 'hod-manager'],
    canDelete: false, // Can only deactivate, not delete
    canDeactivate: ['hr-manager', 'hod-manager'],
    scope: 'organization',
    restrictions: [
      'Cannot create users for other organizations',
      'Cannot modify super-user accounts',
      'Cannot modify other executive-management accounts',
      'Can only deactivate, not permanently delete users'
    ]
  },
  'hr-manager': {
    canManage: ['hod-manager'], // Can only manage department heads
    canCreate: ['hod-manager'],
    canUpdate: ['hr-manager', 'hod-manager'], // Can update profiles, not roles
    canDelete: false,
    scope: 'organization',
    restrictions: [
      'Cannot modify business-owner accounts',
      'Cannot change user roles',
      'Cannot create HR manager accounts',
      'Profile updates only (name, email, departments)'
    ]
  }
} as const;

export const getPermissionsForRole = (roleId: string): Permission[] => {
  const rolePerms = ROLE_PERMISSIONS[roleId];
  if (!rolePerms) return [];

  return Object.entries(rolePerms).map(([resource, actions]) => ({
    resource,
    actions: actions as any[],
    scope: rolePerms.scope[0] as any,
    conditions: []
  }));
};

export const getRoleLevel = (roleId: string): number => {
  return USER_ROLES[roleId]?.level || 999;
};

export const canAccessRole = (userRole: string, targetRole: string): boolean => {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  return userLevel <= targetLevel;
};

// ✅ NEW: Permission checker for user management
export const canManageUser = (
  currentUserRole: string,
  currentUserOrgId: string | undefined,
  targetUserRole: string,
  targetUserOrgId: string | undefined,
  action: 'create' | 'read' | 'update' | 'delete' | 'deactivate'
): boolean => {
  const rules = USER_MANAGEMENT_RULES[currentUserRole as keyof typeof USER_MANAGEMENT_RULES];
  if (!rules) return false;

  // Scope check - organization users can only manage within their org
  if (rules.scope === 'organization') {
    if (!currentUserOrgId || currentUserOrgId !== targetUserOrgId) {
      return false;
    }
  }

  // Action-specific checks
  switch (action) {
    case 'create':
      return rules.canCreate?.includes(targetUserRole) || false;
    
    case 'read':
      return rules.canManage?.includes(targetUserRole) || false;
    
    case 'update':
      return rules.canManage?.includes(targetUserRole) || false;
    
    case 'delete':
      return rules.canDelete === true && rules.canManage?.includes(targetUserRole) || false;
    
    case 'deactivate':
      return rules.canDeactivate?.includes(targetUserRole) || false;
    
    default:
      return false;
  }
};

// ✅ NEW: Get available roles for user creation
export const getCreatableRoles = (currentUserRole: string): UserRole[] => {
  const rules = USER_MANAGEMENT_RULES[currentUserRole as keyof typeof USER_MANAGEMENT_RULES];
  if (!rules?.canCreate) return [];

  return rules.canCreate.map(roleId => USER_ROLES[roleId]).filter(Boolean);
};

// Navigation items based on role
export const getRoleNavigation = (roleId: string) => {
  const baseItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['super-user', 'reseller', 'executive-management', 'hr-manager', 'hod-manager'] }
  ];

  const allNavItems = [
    // Super User Navigation
    { path: '/organizations', label: 'Organizations', icon: '🏢', roles: ['super-user'] },
    { path: '/resellers', label: 'Reseller Network', icon: '🤝', roles: ['super-user'] },
    { path: '/deploy', label: 'Deploy Client', icon: '🚀', roles: ['super-user'] },
    { path: '/system-analytics', label: 'Global Analytics', icon: '📈', roles: ['super-user'] },
    { path: '/system-settings', label: 'System Settings', icon: '⚙️', roles: ['super-user'] },
    
    // Reseller Navigation
    { path: '/my-clients', label: 'My Clients', icon: '🏢', roles: ['reseller'] },
    { path: '/deploy-client', label: 'Deploy Client', icon: '🚀', roles: ['reseller'] },
    { path: '/commissions', label: 'Commissions', icon: '💰', roles: ['reseller'] },
    { path: '/performance', label: 'Performance', icon: '📈', roles: ['reseller'] },
    { path: '/client-support', label: 'Client Support', icon: '🎯', roles: ['reseller'] },
    
    // Executive Management Navigation
    { path: '/business-overview', label: 'Business Overview', icon: '📊', roles: ['executive-management'] },
    { path: '/compliance-reports', label: 'Compliance Reports', icon: '⚖️', roles: ['executive-management'] },
    { path: '/business-analytics', label: 'HR Analytics', icon: '📈', roles: ['executive-management'] },
    { path: '/user-management', label: 'User Management', icon: '👤', roles: ['executive-management'] }, // ✅ NEW
    
    // HR Manager Navigation
    { path: '/employees', label: 'Employee Management', icon: '👥', roles: ['hr-manager'] },
    { path: '/warnings', label: 'Warning Management', icon: '⚠️', roles: ['hr-manager'] },
    { path: '/documents', label: 'Document Review', icon: '📸', roles: ['hr-manager'] },
    { path: '/hr-settings', label: 'HR Settings', icon: '⚙️', roles: ['hr-manager'] },
    { path: '/hr-analytics', label: 'Analytics', icon: '📊', roles: ['hr-manager'] },
    { path: '/user-profiles', label: 'User Profiles', icon: '👤', roles: ['hr-manager'] }, // ✅ NEW
    
    // HOD/Manager Navigation
    { path: '/my-team', label: 'My Team', icon: '👥', roles: ['hod-manager'] },
    { path: '/create-warning', label: 'Create Warning', icon: '⚠️', roles: ['hod-manager'] },
    { path: '/capture-document', label: 'Capture Document', icon: '📸', roles: ['hod-manager'] },
    { path: '/my-analytics', label: 'Team Analytics', icon: '📊', roles: ['hod-manager'] }
  ];

  return [...baseItems, ...allNavItems.filter(item => item.roles.includes(roleId))];
};

// ✅ NEW: User Management Feature Definitions
export const USER_MANAGEMENT_FEATURES = {
  'executive-management': {
    capabilities: [
      '✅ Create HR Manager accounts',
      '✅ Create Department Manager accounts', 
      '✅ Update user profiles and departments',
      '✅ Deactivate user accounts',
      '✅ Reset user passwords',
      '✅ View user activity logs',
      '❌ Cannot manage other Executive Managements',
      '❌ Cannot permanently delete users',
      '❌ Cannot access Super User accounts'
    ],
    actions: ['create', 'read', 'update', 'deactivate'],
    manageable_roles: ['hr-manager', 'hod-manager']
  },
  'hr-manager': {
    capabilities: [
      '✅ Update user profiles (name, email)',
      '✅ Update department assignments',
      '✅ View user activity',
      '✅ Create Department Manager accounts',
      '❌ Cannot change user roles',
      '❌ Cannot create HR Manager accounts',
      '❌ Cannot deactivate users'
    ],
    actions: ['read', 'update'],
    manageable_roles: ['hod-manager']
  }
} as const;
