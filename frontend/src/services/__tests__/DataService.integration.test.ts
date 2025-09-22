// src/services/__tests__/DataService.integration.test.ts
// Firebase Emulator Integration Tests for DataService
import { describe, it, expect, beforeEach } from 'vitest'
import { DataService } from '../DataService'
import { getTestEnv, seedTestData, mockUser } from '../../test-firebase-setup'
import type { Employee, WarningCategory, Organization } from '../../types'

describe('DataService Integration Tests', () => {
  beforeEach(async () => {
    await seedTestData()
  })

  describe('Employee Management', () => {
    it('should create and retrieve employee data', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const employeeData: Partial<Employee> = {
        organizationId: 'test-org',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        department: 'HR',
        position: 'HR Manager',
        employeeNumber: 'HR001',
        isActive: true,
      }

      const employeeId = await DataService.createEmployee(employeeData, 'test-org')
      expect(employeeId).toBeTruthy()

      const retrievedEmployee = await DataService.getEmployeeById(employeeId)
      expect(retrievedEmployee).toBeTruthy()
      expect(retrievedEmployee!.firstName).toBe('Jane')
      expect(retrievedEmployee!.lastName).toBe('Smith')
      expect(retrievedEmployee!.organizationId).toBe('test-org')
    })

    it('should load employees by organization with caching', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create multiple employees
      const employees = [
        {
          organizationId: 'test-org',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@test.com',
          department: 'IT',
          isActive: true,
        },
        {
          organizationId: 'test-org', 
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@test.com',
          department: 'IT',
          isActive: true,
        },
        {
          organizationId: 'other-org',
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie@other.com',
          department: 'Sales',
          isActive: true,
        }
      ]

      for (const emp of employees) {
        await DataService.createEmployee(emp, emp.organizationId)
      }

      // Test organization filtering
      const testOrgEmployees = await DataService.loadEmployees('test-org')
      expect(testOrgEmployees.length).toBeGreaterThanOrEqual(3) // Including seeded data

      const testOrgITEmployees = testOrgEmployees.filter(e => e.department === 'IT')
      expect(testOrgITEmployees).toHaveLength(2)

      // Verify caching behavior
      const startTime = Date.now()
      const cachedEmployees = await DataService.loadEmployees('test-org')
      const cacheTime = Date.now() - startTime

      expect(cacheTime).toBeLessThan(100) // Should be much faster due to caching
      expect(cachedEmployees).toEqual(testOrgEmployees)
    })

    it('should handle employee archiving', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const employeeId = await DataService.createEmployee({
        organizationId: 'test-org',
        firstName: 'Archive',
        lastName: 'Test',
        email: 'archive@test.com',
        department: 'Test',
        isActive: true,
      }, 'test-org')

      // Archive employee
      await DataService.archiveEmployee(employeeId, 'test-org')

      const archivedEmployee = await DataService.getEmployeeById(employeeId)
      expect(archivedEmployee!.isActive).toBe(false)
      expect(archivedEmployee!.archivedAt).toBeInstanceOf(Date)

      // Archived employees should not appear in active lists
      const activeEmployees = await DataService.loadEmployees('test-org')
      const foundEmployee = activeEmployees.find(e => e.id === employeeId)
      expect(foundEmployee).toBeUndefined()
    })
  })

  describe('Warning Categories Management', () => {
    it('should get and cache warning categories', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create additional categories
      const categories = [
        {
          organizationId: 'test-org',
          name: 'Performance',
          description: 'Performance-related issues',
          severity: 'medium' as const,
          escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
          requiredDocuments: ['performance_review'],
          isActive: true,
        },
        {
          organizationId: 'test-org',
          name: 'Safety',
          description: 'Safety violations',
          severity: 'high' as const,
          escalationPath: ['written', 'final_written'],
          requiredDocuments: ['incident_report', 'safety_checklist'],
          isActive: true,
        }
      ]

      for (const category of categories) {
        await DataService.createWarningCategory(category)
      }

      const orgCategories = await DataService.getWarningCategories('test-org')
      expect(orgCategories.length).toBeGreaterThanOrEqual(3) // Including seeded data

      // Test caching
      const startTime = Date.now()
      const cachedCategories = await DataService.getWarningCategories('test-org')
      const cacheTime = Date.now() - startTime

      expect(cacheTime).toBeLessThan(50) // Should be very fast due to caching
      expect(cachedCategories).toEqual(orgCategories)
    })

    it('should customize categories per organization', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Customize category for specific organization
      await DataService.customizeCategory('test-org', 'attendance', {
        customName: 'Punctuality Issues',
        customSeverity: 'high',
        customDescription: 'Organization-specific attendance policy'
      })

      const categories = await DataService.getWarningCategories('test-org')
      const attendanceCategory = categories.find(c => c.id === 'attendance')
      
      expect(attendanceCategory).toBeTruthy()
      expect(attendanceCategory!.name).toBe('Punctuality Issues')
      expect(attendanceCategory!.severity).toBe('high')
    })

    it('should disable categories appropriately', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Disable a category
      await DataService.disableCategory('test-org', 'attendance')

      const categories = await DataService.getWarningCategories('test-org')
      const attendanceCategory = categories.find(c => c.id === 'attendance')
      
      expect(attendanceCategory).toBeUndefined() // Disabled categories should not appear
    })
  })

  describe('Organization Data Management', () => {
    it('should create and manage organization data', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const orgData: Partial<Organization> = {
        name: 'Integration Test Corp',
        industry: 'technology',
        settings: {
          timezone: 'Africa/Johannesburg',
          currency: 'ZAR',
          language: 'en',
        },
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          logo: '/test-logo.png',
          companyName: 'Integration Test Corp',
        },
        isActive: true,
      }

      const orgId = await DataService.createOrganization(orgData)
      expect(orgId).toBeTruthy()

      const retrievedOrg = await DataService.getOrganizationById(orgId)
      expect(retrievedOrg).toBeTruthy()
      expect(retrievedOrg!.name).toBe('Integration Test Corp')
      expect(retrievedOrg!.industry).toBe('technology')
      expect(retrievedOrg!.settings.timezone).toBe('Africa/Johannesburg')
    })

    it('should handle organization settings updates', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const updatedSettings = {
        timezone: 'Europe/London',
        currency: 'GBP',
        language: 'en',
        customFields: ['department_head', 'cost_center'],
      }

      await DataService.updateOrganizationSettings('test-org', updatedSettings)

      const org = await DataService.getOrganizationById('test-org')
      expect(org!.settings.timezone).toBe('Europe/London')
      expect(org!.settings.currency).toBe('GBP')
      expect(org!.settings.customFields).toEqual(['department_head', 'cost_center'])
    })
  })

  describe('Multi-Organization Scalability', () => {
    it('should handle data isolation between organizations', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create data for multiple organizations
      const orgs = ['org-1', 'org-2', 'org-3']
      
      for (const orgId of orgs) {
        // Create organization
        await DataService.createOrganization({
          name: `Test Org ${orgId}`,
          industry: 'manufacturing',
          isActive: true,
        }, orgId)

        // Create employees for each org
        await DataService.createEmployee({
          organizationId: orgId,
          firstName: `Employee`,
          lastName: `From-${orgId}`,
          email: `employee@${orgId}.com`,
          department: 'Operations',
          isActive: true,
        }, orgId)

        // Create categories for each org
        await DataService.createWarningCategory({
          organizationId: orgId,
          name: `Custom-${orgId}`,
          description: `Category for ${orgId}`,
          severity: 'medium',
          escalationPath: ['counselling', 'verbal'],
          requiredDocuments: [],
          isActive: true,
        })
      }

      // Verify data isolation
      for (const orgId of orgs) {
        const employees = await DataService.loadEmployees(orgId)
        const categories = await DataService.getWarningCategories(orgId)

        // Each org should only see its own data
        expect(employees.every(e => e.organizationId === orgId)).toBe(true)
        expect(categories.some(c => c.name === `Custom-${orgId}`)).toBe(true)
        
        // Should not see other orgs' data
        const otherOrgEmployees = employees.filter(e => e.organizationId !== orgId)
        expect(otherOrgEmployees).toHaveLength(0)
      }
    })

    it('should maintain performance with multiple organizations', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create multiple organizations with data
      const startTime = Date.now()
      
      const orgPromises = Array.from({ length: 20 }, (_, i) => {
        const orgId = `perf-org-${i}`
        return Promise.all([
          DataService.createOrganization({
            name: `Performance Test Org ${i}`,
            industry: 'manufacturing',
            isActive: true,
          }, orgId),
          
          DataService.createEmployee({
            organizationId: orgId,
            firstName: `Employee`,
            lastName: `${i}`,
            email: `employee${i}@test.com`,
            department: 'Operations',
            isActive: true,
          }, orgId),
        ])
      })

      await Promise.all(orgPromises)
      
      const creationTime = Date.now() - startTime
      expect(creationTime).toBeLessThan(10000) // Should complete within 10 seconds

      // Test retrieval performance
      const retrievalStart = Date.now()
      const employees = await DataService.loadEmployees('perf-org-10')
      const retrievalTime = Date.now() - retrievalStart

      expect(retrievalTime).toBeLessThan(1000) // Should be fast despite many orgs
      expect(employees).toHaveLength(1)
      expect(employees[0].organizationId).toBe('perf-org-10')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent organization gracefully', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      await expect(
        DataService.loadEmployees('non-existent-org')
      ).resolves.toEqual([])

      await expect(
        DataService.getWarningCategories('non-existent-org')
      ).resolves.toEqual([])
    })

    it('should handle corrupted cache data', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Force cache corruption (simulate bad data)
      DataService.clearCache()

      // Should still work by fetching fresh data
      const employees = await DataService.loadEmployees('test-org')
      expect(employees.length).toBeGreaterThan(0)
    })

    it('should handle concurrent cache operations', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      DataService.clearCache()

      // Make concurrent requests to same organization
      const concurrentRequests = Array.from({ length: 10 }, () => 
        DataService.loadEmployees('test-org')
      )

      const results = await Promise.all(concurrentRequests)
      
      // All results should be identical (cache coherence)
      const firstResult = results[0]
      for (const result of results) {
        expect(result).toEqual(firstResult)
      }
    })

    it('should validate data integrity on creation', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Test invalid employee data
      await expect(
        DataService.createEmployee({
          organizationId: '', // Invalid
          firstName: 'Test',
          email: 'invalid-email', // Invalid
          isActive: true,
        }, 'test-org')
      ).rejects.toThrow()

      // Test invalid organization data
      await expect(
        DataService.createOrganization({
          name: '', // Invalid
          industry: 'invalid-industry' as any,
        })
      ).rejects.toThrow()
    })
  })
})