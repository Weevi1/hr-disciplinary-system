// src/services/__tests__/WarningService.integration.test.ts
// Firebase Emulator Integration Tests for WarningService
import { describe, it, expect, beforeEach } from 'vitest'
import { WarningService } from '../WarningService'
import { getTestEnv, seedTestData, mockUser } from '../../test-firebase-setup'
import type { Warning } from '../../types'

describe('WarningService Integration Tests', () => {
  beforeEach(async () => {
    await seedTestData()
  })

  describe('Warning CRUD Operations', () => {
    it('should save warning to Firebase with proper structure', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return // Skip if emulator not available

      const warningData: Partial<Warning> = {
        employeeId: 'test-employee',
        organizationId: 'test-org',
        categoryId: 'attendance',
        level: 'counselling',
        incidentDate: new Date('2024-01-15'),
        description: 'Integration test warning',
        location: 'Test Office',
        witnesses: ['Manager Smith'],
        issuedBy: 'test-user',
        isActive: true,
      }

      // Save warning using WarningService
      const warningId = await WarningService.saveWarning(warningData, 'test-org')
      expect(warningId).toBeTruthy()

      // Verify warning was saved correctly
      const savedWarning = await WarningService.getWarningById(warningId)
      expect(savedWarning).toBeTruthy()
      expect(savedWarning!.employeeId).toBe('test-employee')
      expect(savedWarning!.categoryId).toBe('attendance')
      expect(savedWarning!.level).toBe('counselling')
      expect(savedWarning!.organizationId).toBe('test-org')
    })

    it('should retrieve active warnings for employee', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create multiple warnings for employee
      const warnings = [
        {
          employeeId: 'test-employee',
          organizationId: 'test-org',
          categoryId: 'attendance',
          level: 'counselling' as const,
          incidentDate: new Date('2024-01-10'),
          description: 'First warning',
          issuedBy: 'test-user',
          isActive: true,
        },
        {
          employeeId: 'test-employee',
          organizationId: 'test-org', 
          categoryId: 'performance',
          level: 'verbal' as const,
          incidentDate: new Date('2024-01-15'),
          description: 'Second warning',
          issuedBy: 'test-user',
          isActive: true,
        },
        {
          employeeId: 'test-employee',
          organizationId: 'test-org',
          categoryId: 'attendance',
          level: 'verbal' as const,
          incidentDate: new Date('2024-01-01'),
          description: 'Expired warning',
          issuedBy: 'test-user',
          isActive: false, // Inactive
        }
      ]

      // Save all warnings
      for (const warning of warnings) {
        await WarningService.saveWarning(warning, 'test-org')
      }

      // Retrieve active warnings
      const activeWarnings = await WarningService.getActiveWarnings('test-employee', 'test-org')
      
      expect(activeWarnings).toHaveLength(2)
      expect(activeWarnings.every(w => w.isActive)).toBe(true)
      expect(activeWarnings.every(w => w.employeeId === 'test-employee')).toBe(true)
      expect(activeWarnings.every(w => w.organizationId === 'test-org')).toBe(true)

      // Should be ordered by issueDate desc (most recent first)
      const dates = activeWarnings.map(w => w.incidentDate.getTime())
      expect(dates).toEqual(dates.slice().sort((a, b) => b - a))
    })

    it('should enforce organization isolation', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create warning for different organization
      const warningData = {
        employeeId: 'other-employee',
        organizationId: 'other-org',
        categoryId: 'attendance',
        level: 'counselling' as const,
        incidentDate: new Date('2024-01-15'),
        description: 'Different org warning',
        issuedBy: 'other-user',
        isActive: true,
      }

      await WarningService.saveWarning(warningData, 'other-org')

      // Retrieving warnings for test-org should not return other-org warnings
      const testOrgWarnings = await WarningService.getActiveWarnings('other-employee', 'test-org')
      expect(testOrgWarnings).toHaveLength(0)

      // But retrieving for correct org should work
      const otherOrgWarnings = await WarningService.getActiveWarnings('other-employee', 'other-org')
      expect(otherOrgWarnings).toHaveLength(1)
    })
  })

  describe('Escalation Recommendations', () => {
    it('should recommend counselling for first offense', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const recommendation = await WarningService.getEscalationRecommendation(
        'test-employee',
        'attendance',
        'test-org'
      )

      expect(recommendation.suggestedLevel).toBe('counselling')
      expect(recommendation.isEscalation).toBe(false)
      expect(recommendation.activeWarnings).toHaveLength(0)
      expect(recommendation.warningCount).toBe(0)
      expect(recommendation.reason).toContain('First incident')
    })

    it('should escalate based on existing warnings', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create existing counselling warning
      await WarningService.saveWarning({
        employeeId: 'test-employee',
        organizationId: 'test-org',
        categoryId: 'attendance',
        level: 'counselling',
        incidentDate: new Date('2024-01-10'),
        description: 'Previous attendance issue',
        issuedBy: 'test-user',
        isActive: true,
      }, 'test-org')

      const recommendation = await WarningService.getEscalationRecommendation(
        'test-employee', 
        'attendance',
        'test-org'
      )

      expect(recommendation.suggestedLevel).toBe('verbal')
      expect(recommendation.isEscalation).toBe(true)
      expect(recommendation.activeWarnings).toHaveLength(1)
      expect(recommendation.warningCount).toBe(1)
      expect(recommendation.reason).toContain('active warning')
    })

    it('should handle category-specific escalation paths', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create safety violation (high severity category)
      const recommendation = await WarningService.getEscalationRecommendation(
        'test-employee',
        'safety',
        'test-org'
      )

      expect(recommendation.categoryId).toBe('safety')
      expect(recommendation.escalationPath).toBeDefined()
      expect(recommendation.legalBasis).toBeDefined()
      expect(recommendation.legalRequirements).toBeDefined()
    })
  })

  describe('Firebase Security Rules Integration', () => {
    it('should respect Firestore security rules for warning creation', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Test unauthorized access should fail
      const unauthorizedContext = testEnv.unauthenticatedContext()
      const firestore = unauthorizedContext.firestore()

      const warningRef = firestore.collection('warnings').doc()
      
      await expect(
        warningRef.set({
          employeeId: 'test-employee',
          organizationId: 'test-org',
          level: 'counselling'
        })
      ).rejects.toThrow() // Should fail due to security rules
    })

    it('should allow authorized managers to create warnings', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const managerContext = mockUser({
        role: 'hod-manager',
        organizationId: 'test-org'
      })

      const firestore = managerContext!.firestore()
      const warningRef = firestore.collection('warnings').doc()

      // This should succeed with proper role and organization
      await expect(
        warningRef.set({
          employeeId: 'test-employee',
          organizationId: 'test-org',
          categoryId: 'attendance',
          level: 'counselling',
          incidentDate: new Date(),
          description: 'Authorized warning creation',
          issuedBy: 'test-user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).resolves.not.toThrow()
    })

    it('should prevent cross-organization access', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const managerContext = mockUser({
        role: 'hod-manager',
        organizationId: 'test-org'
      })

      const firestore = managerContext!.firestore()
      
      // Try to create warning for different organization
      const warningRef = firestore.collection('warnings').doc()
      
      await expect(
        warningRef.set({
          employeeId: 'other-employee',
          organizationId: 'other-org', // Different org
          categoryId: 'attendance',
          level: 'counselling',
          issuedBy: 'test-user',
        })
      ).rejects.toThrow() // Should fail due to belongsToOrganization check
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create multiple warnings for performance test
      const warnings = Array.from({ length: 50 }, (_, i) => ({
        employeeId: `employee-${i}`,
        organizationId: 'test-org',
        categoryId: 'attendance',
        level: 'counselling' as const,
        incidentDate: new Date(2024, 0, i + 1),
        description: `Performance test warning ${i}`,
        issuedBy: 'test-user',
        isActive: true,
      }))

      // Measure bulk insert performance
      const startTime = Date.now()
      
      await Promise.all(
        warnings.map(warning => WarningService.saveWarning(warning, 'test-org'))
      )

      const insertTime = Date.now() - startTime
      
      // Should complete within reasonable time (adjust based on emulator performance)
      expect(insertTime).toBeLessThan(10000) // 10 seconds max

      // Verify retrieval performance
      const retrievalStart = Date.now()
      const activeWarnings = await WarningService.getActiveWarnings('employee-25', 'test-org')
      const retrievalTime = Date.now() - retrievalStart

      expect(retrievalTime).toBeLessThan(1000) // 1 second max
      expect(activeWarnings).toHaveLength(1)
    })

    it('should handle concurrent warning creation', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create concurrent warning operations
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        WarningService.saveWarning({
          employeeId: 'test-employee',
          organizationId: 'test-org',
          categoryId: 'attendance',
          level: 'counselling',
          incidentDate: new Date(),
          description: `Concurrent warning ${i}`,
          issuedBy: 'test-user',
          isActive: true,
        }, 'test-org')
      )

      // All operations should complete successfully
      const warningIds = await Promise.all(concurrentOperations)
      
      expect(warningIds).toHaveLength(10)
      expect(warningIds.every(id => typeof id === 'string')).toBe(true)

      // Verify all warnings were created
      const activeWarnings = await WarningService.getActiveWarnings('test-employee', 'test-org')
      expect(activeWarnings).toHaveLength(10)
    })
  })

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create warning with valid references
      const warningId = await WarningService.saveWarning({
        employeeId: 'test-employee', // Must exist in test data
        organizationId: 'test-org',   // Must exist in test data
        categoryId: 'attendance',     // Must exist in test data
        level: 'counselling',
        incidentDate: new Date(),
        description: 'Referential integrity test',
        issuedBy: 'test-user',
        isActive: true,
      }, 'test-org')

      const savedWarning = await WarningService.getWarningById(warningId)
      
      expect(savedWarning).toBeTruthy()
      expect(savedWarning!.employeeId).toBe('test-employee')
      expect(savedWarning!.organizationId).toBe('test-org')
      expect(savedWarning!.categoryId).toBe('attendance')

      // Verify timestamps are properly set
      expect(savedWarning!.createdAt).toBeInstanceOf(Date)
      expect(savedWarning!.updatedAt).toBeInstanceOf(Date)
      expect(savedWarning!.incidentDate).toBeInstanceOf(Date)
    })

    it('should handle invalid references gracefully', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Test with non-existent employee
      await expect(
        WarningService.getActiveWarnings('non-existent-employee', 'test-org')
      ).resolves.toEqual([]) // Should return empty array, not throw

      // Test escalation for non-existent category
      const recommendation = await WarningService.getEscalationRecommendation(
        'test-employee',
        'non-existent-category',
        'test-org'
      )

      // Should return fallback recommendation
      expect(recommendation).toBeTruthy()
      expect(recommendation.suggestedLevel).toBe('counselling')
      expect(recommendation.reason).toContain('Unable to analyze')
    })
  })
})