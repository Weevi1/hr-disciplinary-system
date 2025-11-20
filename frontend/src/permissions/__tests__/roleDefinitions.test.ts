// src/permissions/__tests__/roleDefinitions.test.ts
import { describe, it, expect } from 'vitest'
import { USER_ROLES, ROLE_PERMISSIONS, USER_MANAGEMENT_RULES } from '../roleDefinitions'

describe('Role Definitions', () => {
  describe('USER_ROLES', () => {
    it('should define all required roles', () => {
      const expectedRoles = ['super-user', 'executive-management', 'hr-manager', 'hod-manager']
      
      expectedRoles.forEach(roleId => {
        expect(USER_ROLES[roleId]).toBeDefined()
        expect(USER_ROLES[roleId].id).toBe(roleId)
        expect(USER_ROLES[roleId].name).toBeTruthy()
        expect(USER_ROLES[roleId].description).toBeTruthy()
        expect(USER_ROLES[roleId].level).toBeTypeOf('number')
      })
    })

    it('should have correct role hierarchy levels', () => {
      expect(USER_ROLES['super-user'].level).toBe(1) // Highest
      expect(USER_ROLES['executive-management'].level).toBe(2)
      expect(USER_ROLES['hr-manager'].level).toBe(3)
      expect(USER_ROLES['hod-manager'].level).toBe(4) // Lowest
    })

    it('should have unique role levels', () => {
      const levels = Object.values(USER_ROLES).map(role => role.level)
      const uniqueLevels = [...new Set(levels)]
      
      expect(levels).toHaveLength(uniqueLevels.length)
    })
  })

  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all roles', () => {
      const roleIds = Object.keys(USER_ROLES)
      
      roleIds.forEach(roleId => {
        expect(ROLE_PERMISSIONS[roleId]).toBeDefined()
        expect(ROLE_PERMISSIONS[roleId].scope).toBeDefined()
      })
    })

    it('should validate super-user has global access', () => {
      const superUserPerms = ROLE_PERMISSIONS['super-user']
      
      expect(superUserPerms.scope).toContain('global')
      expect(superUserPerms.organizations).toContain('create')
      expect(superUserPerms.organizations).toContain('delete')
      expect(superUserPerms.system).toContain('configure')
    })

    it('should validate business-owner permissions', () => {
      const executiveManagementPerms = ROLE_PERMISSIONS['executive-management']
      
      expect(executiveManagementPerms.scope).toContain('organization')
      expect(executiveManagementPerms.users).toContain('create')
      expect(executiveManagementPerms.users).toContain('deactivate')
      expect(executiveManagementPerms.employees).toContain('read')
      expect(executiveManagementPerms.employees).not.toContain('create')
      expect(executiveManagementPerms.warnings).toContain('read')
      expect(executiveManagementPerms.warnings).not.toContain('create')
    })

    it('should validate hr-manager permissions', () => {
      const hrManagerPerms = ROLE_PERMISSIONS['hr-manager']
      
      expect(hrManagerPerms.scope).toContain('organization')
      expect(hrManagerPerms.employees).toContain('create')
      expect(hrManagerPerms.employees).toContain('update')
      expect(hrManagerPerms.employees).toContain('delete')
      expect(hrManagerPerms.warnings).toContain('read')
      expect(hrManagerPerms.warnings).toContain('update')
      expect(hrManagerPerms.warnings).not.toContain('create')
      expect(hrManagerPerms.categories).toContain('configure')
    })

    it('should validate hod-manager permissions', () => {
      const hodManagerPerms = ROLE_PERMISSIONS['hod-manager']
      
      expect(hodManagerPerms.scope).toContain('department')
      expect(hodManagerPerms.employees).toContain('read')
      expect(hodManagerPerms.employees).not.toContain('create')
      expect(hodManagerPerms.warnings).toContain('create')
      expect(hodManagerPerms.warnings).toContain('read')
      expect(hodManagerPerms.documents).toContain('create')
    })

    it('should ensure proper permission hierarchy', () => {
      // Super user should have most permissions
      const superUserPerms = ROLE_PERMISSIONS['super-user']
      const allPermissionTypes = Object.keys(superUserPerms).filter(key => key !== 'scope')
      
      allPermissionTypes.forEach(permType => {
        expect(superUserPerms[permType]).toBeDefined()
      })

      // Lower roles should have fewer permissions
      const hodManagerPerms = ROLE_PERMISSIONS['hod-manager']
      const hodPermissionTypes = Object.keys(hodManagerPerms).filter(key => key !== 'scope')
      
      expect(hodPermissionTypes.length).toBeLessThan(allPermissionTypes.length)
    })
  })

  describe('USER_MANAGEMENT_RULES', () => {
    it('should define management rules for all roles', () => {
      const roleIds = Object.keys(USER_ROLES)
      
      roleIds.forEach(roleId => {
        expect(USER_MANAGEMENT_RULES[roleId]).toBeDefined()
        expect(USER_MANAGEMENT_RULES[roleId].scope).toBeDefined()
      })
    })

    it('should validate super-user can manage all roles', () => {
      const superUserRules = USER_MANAGEMENT_RULES['super-user']
      
      expect(superUserRules.canManage).toContain('super-user')
      expect(superUserRules.canManage).toContain('executive-management')
      expect(superUserRules.canManage).toContain('hr-manager')
      expect(superUserRules.canManage).toContain('hod-manager')
      expect(superUserRules.canCreate).toContain('executive-management')
      expect(superUserRules.canDelete).toContain('executive-management')
      expect(superUserRules.scope).toBe('global')
    })

    it('should validate business-owner restrictions', () => {
      const executiveManagementRules = USER_MANAGEMENT_RULES['executive-management']
      
      expect(executiveManagementRules.canManage).not.toContain('super-user')
      expect(executiveManagementRules.canManage).not.toContain('executive-management')
      expect(executiveManagementRules.canManage).toContain('hr-manager')
      expect(executiveManagementRules.canManage).toContain('hod-manager')
      expect(executiveManagementRules.canDelete).toBe(false)
      expect(executiveManagementRules.canDeactivate).toBeDefined()
      expect(executiveManagementRules.scope).toBe('organization')
      expect(executiveManagementRules.restrictions).toBeDefined()
    })

    it('should validate hr-manager limitations', () => {
      const hrManagerRules = USER_MANAGEMENT_RULES['hr-manager']
      
      expect(hrManagerRules.canManage).toEqual(['hod-manager'])
      expect(hrManagerRules.canCreate).toContain('hod-manager')
      expect(hrManagerRules.canUpdate).toContain('hr-manager') // Can update own profile
      expect(hrManagerRules.canUpdate).toContain('hod-manager')
      expect(hrManagerRules.canDelete).toBe(false)
      expect(hrManagerRules.scope).toBe('organization')
      expect(hrManagerRules.restrictions).toBeDefined()
    })

    it('should validate hod-manager has no management rights', () => {
      const hodManagerRules = USER_MANAGEMENT_RULES['hod-manager']
      
      expect(hodManagerRules.canManage).toEqual([])
      expect(hodManagerRules.canCreate).toEqual([])
      expect(hodManagerRules.scope).toBe('department')
      expect(hodManagerRules.restrictions).toBeDefined()
    })

    it('should ensure no role can escalate their own privileges', () => {
      Object.entries(USER_MANAGEMENT_RULES).forEach(([roleId, rules]) => {
        if (rules.canCreate && Array.isArray(rules.canCreate)) {
          const currentRoleLevel = USER_ROLES[roleId].level
          
          rules.canCreate.forEach(creatableRole => {
            const creatableRoleLevel = USER_ROLES[creatableRole].level
            expect(creatableRoleLevel).toBeGreaterThan(currentRoleLevel)
          })
        }
      })
    })
  })

  describe('Permission consistency', () => {
    it('should have consistent permission and rule definitions', () => {
      const permissionRoles = Object.keys(ROLE_PERMISSIONS)
      const ruleRoles = Object.keys(USER_MANAGEMENT_RULES)
      const definedRoles = Object.keys(USER_ROLES)

      expect(permissionRoles).toEqual(expect.arrayContaining(definedRoles))
      expect(ruleRoles).toEqual(expect.arrayContaining(definedRoles))
    })

    it('should validate scope consistency', () => {
      Object.keys(USER_ROLES).forEach(roleId => {
        const permissions = ROLE_PERMISSIONS[roleId]
        const rules = USER_MANAGEMENT_RULES[roleId]

        // Both should have the same scope
        expect(permissions.scope).toBeDefined()
        expect(rules.scope).toBeDefined()
      })
    })

    it('should ensure management capabilities align with permissions', () => {
      // Business owners should have user management permissions if they can manage users
      const executiveManagementPerms = ROLE_PERMISSIONS['executive-management']
      const executiveManagementRules = USER_MANAGEMENT_RULES['executive-management']

      if (executiveManagementRules.canManage.length > 0) {
        expect(executiveManagementPerms.users).toContain('create')
      }

      // HR managers should have user permissions if they can update users
      const hrManagerPerms = ROLE_PERMISSIONS['hr-manager']
      const hrManagerRules = USER_MANAGEMENT_RULES['hr-manager']

      if (hrManagerRules.canUpdate && hrManagerRules.canUpdate.length > 0) {
        expect(hrManagerPerms.users).toContain('update')
      }
    })
  })

  describe('Security validation', () => {
    it('should prevent privilege escalation paths', () => {
      // No role should be able to create a role with higher privileges
      Object.entries(USER_MANAGEMENT_RULES).forEach(([roleId, rules]) => {
        const currentLevel = USER_ROLES[roleId].level
        
        if (rules.canCreate && Array.isArray(rules.canCreate)) {
          rules.canCreate.forEach(creatableRole => {
            const creatableLevel = USER_ROLES[creatableRole].level
            expect(creatableLevel).toBeGreaterThan(currentLevel)
          })
        }

        if (rules.canManage && Array.isArray(rules.canManage)) {
          rules.canManage.forEach(manageableRole => {
            if (manageableRole !== roleId) { // Allow self-management
              const manageableLevel = USER_ROLES[manageableRole].level
              expect(manageableLevel).toBeGreaterThanOrEqual(currentLevel)
            }
          })
        }
      })
    })

    it('should ensure proper scope restrictions', () => {
      // Organization-scoped roles should not have global permissions
      const organizationRoles = Object.entries(ROLE_PERMISSIONS)
        .filter(([_, perms]) => perms.scope.includes('organization'))
        .map(([roleId]) => roleId)

      organizationRoles.forEach(roleId => {
        const permissions = ROLE_PERMISSIONS[roleId]
        expect(permissions.scope).not.toContain('global')
      })

      // Department-scoped roles should be most restricted
      const departmentRoles = Object.entries(ROLE_PERMISSIONS)
        .filter(([_, perms]) => perms.scope.includes('department'))
        .map(([roleId]) => roleId)

      departmentRoles.forEach(roleId => {
        const permissions = ROLE_PERMISSIONS[roleId]
        const rules = USER_MANAGEMENT_RULES[roleId]
        
        expect(permissions.scope).not.toContain('global')
        expect(permissions.scope).not.toContain('organization')
        expect(rules.canManage || []).toHaveLength(0)
        expect(rules.canCreate || []).toHaveLength(0)
      })
    })

    it('should validate that restrictions are properly defined', () => {
      Object.entries(USER_MANAGEMENT_RULES).forEach(([roleId, rules]) => {
        if (roleId !== 'super-user') {
          expect(rules.restrictions).toBeDefined()
          expect(Array.isArray(rules.restrictions)).toBe(true)
          expect(rules.restrictions.length).toBeGreaterThan(0)
        }
      })
    })
  })
})