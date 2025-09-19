// src/services/__tests__/WarningService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WarningService } from '../WarningService'
import { factories } from '../../test-utils/factories'
import type { Warning } from '../../types'

// Mock the UniversalCategories module
vi.mock('../UniversalCategories', () => ({
  getCategoryById: vi.fn(() => ({
    id: 'attendance',
    name: 'Attendance',
    lraSection: 'LRA Section 188',
    proceduralRequirements: ['Document incidents', 'Fair procedure'],
    commonExamples: ['Late arrival', 'Unexcused absence'],
    escalationRationale: 'Progressive discipline approach',
    defaultValidityPeriod: 6
  })),
  getEscalationPath: vi.fn(() => ['counselling', 'verbal', 'first_written', 'final_written']),
  getNextEscalationLevel: vi.fn(() => 'verbal'),
  getLevelLabel: vi.fn((level) => {
    const labels = {
      counselling: 'Counselling',
      verbal: 'Verbal Warning',
      first_written: 'First Written Warning',
      final_written: 'Final Written Warning',
      dismissal: 'Dismissal'
    }
    return labels[level] || level
  }),
  isValidLevelForCategory: vi.fn(() => true)
}))

// Mock DataService
vi.mock('../DataService', () => ({
  DataService: {
    getActiveWarningsForEmployee: vi.fn(() => Promise.resolve([]))
  }
}))

describe('WarningService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEscalationRecommendation', () => {
    it('should recommend counselling for first offense', async () => {
      // Mock no existing warnings
      vi.spyOn(WarningService, 'getActiveWarnings').mockResolvedValue([])

      const result = await WarningService.getEscalationRecommendation(
        'employee-1', 
        'attendance', 
        'org-1'
      )

      expect(result.suggestedLevel).toBe('counselling')
      expect(result.recommendedLevel).toBe('Counselling')
      expect(result.isEscalation).toBe(false)
      expect(result.warningCount).toBe(0)
      expect(result.categoryWarningCount).toBe(0)
      expect(result.reason).toContain('First incident of Attendance')
    })

    it('should escalate based on category-specific history', async () => {
      // Mock existing warnings in the same category
      const existingWarnings: Warning[] = [
        factories.warning({
          id: 'warn-1',
          level: 'counselling',
          categoryId: 'attendance',
          employeeId: 'employee-1'
        })
      ]

      vi.spyOn(WarningService, 'getActiveWarnings').mockResolvedValue(existingWarnings)

      const result = await WarningService.getEscalationRecommendation(
        'employee-1', 
        'attendance', 
        'org-1'
      )

      expect(result.suggestedLevel).toBe('verbal')
      expect(result.isEscalation).toBe(true)
      expect(result.warningCount).toBe(1) // Total warnings
      expect(result.categoryWarningCount).toBe(1) // Category-specific warnings
      expect(result.activeWarnings).toHaveLength(1)
      expect(result.activeWarnings[0].categoryId).toBe('attendance')
    })

    it('should filter warnings by category correctly', async () => {
      // Mock warnings from different categories
      const mixedWarnings: Warning[] = [
        factories.warning({
          id: 'warn-1',
          level: 'counselling',
          categoryId: 'attendance',
          employeeId: 'employee-1'
        }),
        factories.warning({
          id: 'warn-2',
          level: 'verbal',
          categoryId: 'conduct',
          employeeId: 'employee-1'
        })
      ]

      vi.spyOn(WarningService, 'getActiveWarnings').mockResolvedValue(mixedWarnings)

      const result = await WarningService.getEscalationRecommendation(
        'employee-1', 
        'attendance', 
        'org-1'
      )

      // Should only consider attendance warnings for escalation
      expect(result.activeWarnings).toHaveLength(1)
      expect(result.activeWarnings[0].categoryId).toBe('attendance')
      expect(result.categoryWarningCount).toBe(1)
      expect(result.warningCount).toBe(2) // Total for context
    })

    it('should handle fallback for invalid category', async () => {
      // Mock UniversalCategories to return null for invalid category
      const { getCategoryById } = await import('../UniversalCategories')
      vi.mocked(getCategoryById).mockReturnValue(null)

      const result = await WarningService.getEscalationRecommendation(
        'employee-1', 
        'invalid-category', 
        'org-1'
      )

      expect(result.suggestedLevel).toBe('counselling')
      expect(result.reason).toContain('defaulting to counselling')
      expect(result.category).toBe('General Misconduct')
      expect(result.legalBasis).toBe('LRA Section 188 - Fair reason and procedure')
    })

    it('should handle errors gracefully', async () => {
      // Mock getActiveWarnings to throw an error
      vi.spyOn(WarningService, 'getActiveWarnings').mockRejectedValue(new Error('Database error'))

      const result = await WarningService.getEscalationRecommendation(
        'employee-1', 
        'attendance', 
        'org-1'
      )

      // Should return fallback recommendation
      expect(result.suggestedLevel).toBe('counselling')
      expect(result.reason).toContain('defaulting to counselling')
    })
  })

  describe('determineSuggestedLevel', () => {
    const escalationPath = ['counselling', 'verbal', 'first_written', 'final_written']

    it('should start with counselling for no warnings', () => {
      // Access private method for testing
      const result = (WarningService as any).determineSuggestedLevel([], escalationPath)
      expect(result).toBe('counselling')
    })

    it('should escalate to next level based on highest current warning', () => {
      const warnings = [
        factories.warning({ level: 'counselling' }),
        factories.warning({ level: 'verbal' })
      ]

      const result = (WarningService as any).determineSuggestedLevel(warnings, escalationPath)
      expect(result).toBe('verbal') // Should use getNextEscalationLevel
    })
  })

  describe('generateEscalationReason', () => {
    it('should generate appropriate reason for first offense', () => {
      const category = {
        name: 'Attendance',
        commonExamples: ['Late arrival'],
        defaultValidityPeriod: 6
      }

      const result = (WarningService as any).generateEscalationReason(
        [], 
        'counselling', 
        category
      )

      expect(result).toContain('First incident of Attendance')
      expect(result).toContain('Counselling')
      expect(result).toContain('progressive discipline')
    })

    it('should generate appropriate reason for escalation', () => {
      const activeWarnings = [
        factories.warning({
          issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        })
      ]

      const category = { name: 'Attendance' }

      const result = (WarningService as any).generateEscalationReason(
        activeWarnings, 
        'verbal', 
        category
      )

      expect(result).toContain('1 active warning')
      expect(result).toContain('30 days ago')
      expect(result).toContain('escalation to Verbal Warning')
    })
  })

  describe('normalizeWarningLevel', () => {
    it('should normalize string levels correctly', () => {
      expect(WarningService.normalizeWarningLevel('counselling')).toBe('counselling')
      expect(WarningService.normalizeWarningLevel('Verbal Warning')).toBe('verbal')
      expect(WarningService.normalizeWarningLevel('First Written Warning')).toBe('first_written')
      expect(WarningService.normalizeWarningLevel('final written warning')).toBe('final_written')
    })

    it('should handle invalid levels gracefully', () => {
      expect(WarningService.normalizeWarningLevel('invalid')).toBe('counselling')
      expect(WarningService.normalizeWarningLevel('')).toBe('counselling')
    })
  })

  describe('saveWarning', () => {
    it('should save warning with correct data structure', async () => {
      // Mock Firestore operations
      const mockDoc = { id: 'new-warning-id' }
      const mockSetDoc = vi.fn().mockResolvedValue(undefined)
      
      // Mock Firebase imports
      vi.doMock('firebase/firestore', () => ({
        doc: vi.fn(() => mockDoc),
        collection: vi.fn(),
        setDoc: mockSetDoc,
        updateDoc: vi.fn()
      }))

      const warningData = factories.warning()
      const result = await WarningService.saveWarning(warningData, 'org-1')

      expect(result).toBe('new-warning-id')
    })
  })

  describe('getWarningById', () => {
    it('should retrieve and transform warning data correctly', async () => {
      const mockWarningData = factories.warning()
      
      const mockDoc = {
        id: 'warn-123',
        exists: () => true,
        data: () => ({
          ...mockWarningData,
          issueDate: { toDate: () => mockWarningData.issueDate },
          expiryDate: { toDate: () => mockWarningData.expiryDate },
          incidentDate: { toDate: () => mockWarningData.incidentDate },
          createdAt: { toDate: () => mockWarningData.createdAt },
          updatedAt: { toDate: () => mockWarningData.updatedAt }
        })
      }

      // Mock Firebase doc operation
      vi.doMock('firebase/firestore', () => ({
        doc: vi.fn(),
        getDoc: vi.fn().mockResolvedValue(mockDoc)
      }))

      const result = await WarningService.getWarningById('warn-123')

      expect(result).toBeTruthy()
      expect(result?.id).toBe('warn-123')
      expect(result?.issueDate).toBeInstanceOf(Date)
    })

    it('should return null for non-existent warning', async () => {
      const mockDoc = {
        exists: () => false
      }

      vi.doMock('firebase/firestore', () => ({
        doc: vi.fn(),
        getDoc: vi.fn().mockResolvedValue(mockDoc)
      }))

      const result = await WarningService.getWarningById('non-existent')
      expect(result).toBeNull()
    })
  })
})