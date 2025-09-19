// src/services/__tests__/PDFGenerationService.integration.test.ts
// Firebase Emulator Integration Tests for PDFGenerationService
import { describe, it, expect, beforeEach } from 'vitest'
import { PDFGenerationService } from '../PDFGenerationService'
import { getTestEnv, seedTestData, mockUser } from '../../test-firebase-setup'
import type { Warning, Employee, Organization } from '../../types'

describe('PDFGenerationService Integration Tests', () => {
  beforeEach(async () => {
    await seedTestData()
  })

  describe('PDF Generation with Firebase Data', () => {
    it('should generate PDF from Firebase data', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      // Create comprehensive test data in Firebase
      const firestore = mockUser()!.firestore()
      
      const organization: Organization = {
        id: 'test-org',
        name: 'Integration Test Corporation',
        industry: 'technology',
        branding: {
          logo: '/test-logo.png',
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          companyName: 'Integration Test Corporation',
          domain: 'test.com'
        },
        settings: {
          timezone: 'Africa/Johannesburg',
          currency: 'ZAR',
          language: 'en',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const employee: Employee = {
        id: 'integration-employee',
        organizationId: 'test-org',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        department: 'Information Technology',
        position: 'Senior Developer',
        manager: 'Jane Smith',
        startDate: new Date('2023-01-15'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const warning: Warning = {
        id: 'integration-warning',
        organizationId: 'test-org',
        employeeId: 'integration-employee',
        categoryId: 'attendance',
        level: 'verbal',
        incidentDate: new Date('2024-01-15T09:30:00'),
        issueDate: new Date('2024-01-16T14:00:00'),
        description: 'Employee arrived 45 minutes late without prior notification',
        location: 'Main Office',
        witnesses: ['Manager Smith', 'HR Representative'],
        correctiveAction: 'Employee must improve punctuality and follow notification procedures',
        consequences: 'Continued tardiness may result in further disciplinary action',
        issuedBy: 'manager-user',
        isActive: true,
        status: 'issued',
        audioUrl: 'https://storage.example.com/audio/recording.m4a',
        signatures: {
          manager: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            name: 'Jane Smith',
            timestamp: new Date('2024-01-16T14:30:00'),
            designation: 'Department Manager'
          },
          employee: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            name: 'John Doe',
            timestamp: new Date('2024-01-16T14:45:00'),
            designation: 'Employee'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date('2024-07-16'), // 6 months for verbal warning
      }

      // Generate PDF with comprehensive data
      const pdf = await PDFGenerationService.generateWarningPDF(
        warning,
        employee,
        organization
      )

      expect(pdf).toBeTruthy()
      expect(typeof pdf.output).toBe('function')

      // Verify PDF contains expected content by checking internal state
      expect(pdf.internal.pages.length).toBeGreaterThan(1) // At least one page
    })

    it('should handle missing optional data gracefully', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const minimalWarning: Warning = {
        id: 'minimal-warning',
        organizationId: 'test-org',
        employeeId: 'test-employee',
        categoryId: 'performance',
        level: 'counselling',
        incidentDate: new Date('2024-01-15'),
        issueDate: new Date('2024-01-15'),
        description: 'Basic performance issue',
        issuedBy: 'test-manager',
        isActive: true,
        status: 'issued',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date('2024-04-15'),
      }

      const minimalEmployee: Employee = {
        id: 'minimal-employee',
        organizationId: 'test-org',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        department: 'Operations',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const minimalOrganization: Organization = {
        id: 'minimal-org',
        name: 'Basic Organization',
        industry: 'manufacturing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const pdf = await PDFGenerationService.generateWarningPDF(
        minimalWarning,
        minimalEmployee,
        minimalOrganization
      )

      expect(pdf).toBeTruthy()
      expect(pdf.internal.pages.length).toBeGreaterThan(0)
    })

    it('should apply organization branding correctly', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const brandedOrganization: Organization = {
        id: 'branded-org',
        name: 'Branded Corporation',
        industry: 'technology',
        branding: {
          logo: '/brand-logo.png',
          primaryColor: '#ff6b35', // Orange
          secondaryColor: '#004e89', // Blue
          companyName: 'Branded Corporation Ltd.',
          domain: 'branded.com',
          theme: 'modern'
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const warning: Warning = {
        id: 'branded-warning',
        organizationId: 'branded-org',
        employeeId: 'test-employee',
        categoryId: 'misconduct',
        level: 'first_written',
        incidentDate: new Date(),
        issueDate: new Date(),
        description: 'Branding test warning',
        issuedBy: 'test-manager',
        isActive: true,
        status: 'issued',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }

      const employee: Employee = {
        id: 'brand-employee',
        organizationId: 'branded-org',
        firstName: 'Brand',
        lastName: 'Tester',
        email: 'brand@branded.com',
        department: 'Marketing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const pdf = await PDFGenerationService.generateWarningPDF(
        warning,
        employee,
        brandedOrganization
      )

      expect(pdf).toBeTruthy()

      // Check that branding colors are applied (would need internal inspection)
      // For integration test, we verify the PDF generates successfully with branding
      const pdfOutput = pdf.output('datauristring')
      expect(pdfOutput).toContain('data:application/pdf')
    })

    it('should embed signatures correctly', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const warningWithSignatures: Warning = {
        id: 'signature-warning',
        organizationId: 'test-org',
        employeeId: 'test-employee',
        categoryId: 'safety',
        level: 'final_written',
        incidentDate: new Date('2024-01-20'),
        issueDate: new Date('2024-01-22'),
        description: 'Safety protocol violation requiring immediate attention',
        correctiveAction: 'Mandatory safety training and supervision',
        consequences: 'Final warning - next incident will result in dismissal',
        issuedBy: 'safety-manager',
        isActive: true,
        status: 'issued',
        signatures: {
          manager: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVBiVY2CgEWBhYGBgYmD4//8/AzYwatSoUVgVMjAwMDAwMjL+/w8G//79w6mQgYGBgZGR8f9/YMD4nwE7YGRg+A8KGBkY/jMwYAeMjAz/QQpBCrEpZGRk/A9SgE0hIyPDf0ZGxv9YLQMB//9jswyk8D8DA8N/FhYWhtevX//ftGkTw7lz5xjOnz/PcOHCBYYrV64w3Lhxg+HOnTsM9+7dY3jw4AHDo0ePGJ48ecLw9OlThufPnzO8ePGC4eXLlwyvXr1ieP36NcPbt28Z3r17x/D+/XuGDx8+MHz8+JHh06dPDJ8/f2b48uULw9evXxm+ffvG8P37d4YfP34w/Pz5k+HXr18Mv3//Zvjz5w/D379/Gf79+8fw//9/RhYWFobU1FSGpKQkhvj4eIbY2FiGmJgYhujoaIaoqCiGyMhIhvDwcIbQ0FCGkJAQhuDgYIbAwECGgIAABn9/fwY/Pz8GX19fBh8fHwZvb28GLy8vhpfPX4Ycuvfz5k2Lxj',
            name: 'Safety Manager',
            timestamp: new Date('2024-01-22T15:00:00'),
            designation: 'Health & Safety Manager'
          },
          employee: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVBiVY2CgEWBhYGBgYmD4//8/AzYwatSoUVgVMjAwMDAwMjL+/w8G//79w6mQgYGBgZGR8f9/YMD4nwE7YGRg+A8KGBkY/jMwYAeMjAz/QQpBCrEpZGRk/A9SgE0hIyPDf0ZGxv9YLQMB//9jswyk8D8DA8N/FhYWhtevX//ftGkTw7lz5xjOnz/PcOHCBYYrV64w3Lhxg+HOnTsM9+7dY3jw4AHDo0ePGJ48ecLw9OlThufPnzO8ePGC4eXLlwyvXr1ieP36NcPbt28Z3r17x/D+/XuGDx8+MHz8+JHh06dPDJ8/f2b48uULw9evXxm+ffvG8P37d4YfP34w/Pz5k+HXr18Mv3//Zvjz5w/D379/Gf79+8fw//9/RhYWFobU1FSGpKQkhvj4eIbY2FiGmJgYhujoaIaoqCiGyMhIhvDwcIbQ0FCGkJAQhuDgYIbAwECGgIAABn9/fwY/Pz8GX19fBh8fHwZvb28GLy8vhpfPX4Ycuvfz5k2Lxj',
            name: 'John Doe',
            timestamp: new Date('2024-01-22T15:15:00'),
            designation: 'Machine Operator'
          },
          witness: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVBiVY2CgEWBhYGBgYmD4//8/AzYwatSoUVgVMjAwMDAwMjL+/w8G//79w6mQgYGBgZGR8f9/YMD4nwE7YGRg+A8KGBkY/jMwYAeMjAz/QQpBCrEpZGRk/A9SgE0hIyPDf0ZGxv9YLQMB//9jswyk8D8DA8N/FhYWhtevX//ftGkTw7lz5xjOnz/PcOHCBYYrV64w3Lhxg+HOnTsM9+7dY3jw4AHDo0ePGJ48ecLw9OlThufPnzO8ePGC4eXLlwyvXr1ieP36NcPbt28Z3r17x/D+/XuGDx8+MHz8+JHh06dPDJ8/f2b48uULw9evXxm+ffvG8P37d4YfP34w/Pz5k+HXr18Mv3//Zvjz5w/D379/Gf79+8fw//9/RhYWFobU1FSGpKQkhvj4eIbY2FiGmJgYhujoaIaoqCiGyMhIhvDwcIbQ0FCGkJAQhuDgYIbAwECGgIAABn9/fwY/Pz8GX19fBh8fHwZvb28GLy8vhpfPX4Ycuvfz5k2Lxj',
            name: 'HR Witness',
            timestamp: new Date('2024-01-22T15:30:00'),
            designation: 'HR Representative'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date('2025-01-22'), // 1 year for final written
      }

      const employee: Employee = {
        id: 'signature-employee',
        organizationId: 'test-org',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        department: 'Operations',
        position: 'Machine Operator',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const organization: Organization = {
        id: 'signature-org',
        name: 'Safety First Corporation',
        industry: 'manufacturing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const pdf = await PDFGenerationService.generateWarningPDF(
        warningWithSignatures,
        employee,
        organization
      )

      expect(pdf).toBeTruthy()
      
      // Verify PDF has multiple pages (signatures section might create additional pages)
      expect(pdf.internal.pages.length).toBeGreaterThanOrEqual(1)

      // Verify PDF can be output
      const pdfBlob = pdf.output('blob')
      expect(pdfBlob.size).toBeGreaterThan(1000) // Should be substantial with signatures
    })

    it('should handle large content and create multiple pages', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const longDescription = Array.from({ length: 50 }, (_, i) => 
        `This is line ${i + 1} of a very detailed incident description that should be comprehensive enough to test multi-page PDF generation. The incident involved multiple parties and required extensive documentation.`
      ).join(' ')

      const longCorrectiveAction = Array.from({ length: 30 }, (_, i) => 
        `Action item ${i + 1}: Employee must complete specific training modules and demonstrate understanding.`
      ).join(' ')

      const largeWarning: Warning = {
        id: 'large-warning',
        organizationId: 'test-org',
        employeeId: 'test-employee',
        categoryId: 'comprehensive',
        level: 'final_written',
        incidentDate: new Date('2024-01-15'),
        issueDate: new Date('2024-01-16'),
        description: longDescription,
        location: 'Multiple locations including main office, warehouse, and client site',
        witnesses: [
          'Primary Witness - Department Manager',
          'Secondary Witness - HR Representative', 
          'Third Witness - Security Officer',
          'Fourth Witness - Client Representative',
          'Fifth Witness - Fellow Employee'
        ],
        correctiveAction: longCorrectiveAction,
        consequences: 'This is the final warning. Any further incidents of this nature will result in immediate termination of employment. Employee must also complete 40 hours of additional training within 30 days.',
        issuedBy: 'comprehensive-manager',
        isActive: true,
        status: 'issued',
        audioUrl: 'https://storage.example.com/audio/comprehensive-recording.m4a',
        attachments: [
          'witness-statement-1.pdf',
          'security-footage-summary.pdf',
          'training-requirements.pdf',
          'client-complaint-form.pdf'
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date('2025-01-16'),
      }

      const employee: Employee = {
        id: 'comprehensive-employee',
        organizationId: 'test-org',
        employeeNumber: 'COMP001',
        firstName: 'Comprehensive',
        lastName: 'Test Employee',
        email: 'comprehensive@test.com',
        department: 'Multi-Department Operations',
        position: 'Senior Operations Specialist',
        manager: 'Department Head Manager',
        startDate: new Date('2020-01-01'),
        personalDetails: {
          phone: '+1-555-0123',
          address: '123 Test Street, Test City, Test State, 12345',
          emergencyContact: 'Emergency Contact Person - +1-555-0456'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const organization: Organization = {
        id: 'comprehensive-org',
        name: 'Comprehensive Testing Corporation Limited',
        industry: 'comprehensive_testing',
        branding: {
          logo: '/comprehensive-logo.png',
          primaryColor: '#1a365d',
          secondaryColor: '#2d3748',
          companyName: 'Comprehensive Testing Corporation Limited',
          domain: 'comprehensive.testing.com'
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const pdf = await PDFGenerationService.generateWarningPDF(
        largeWarning,
        employee,
        organization
      )

      expect(pdf).toBeTruthy()

      // Large content should create multiple pages
      expect(pdf.internal.pages.length).toBeGreaterThan(1)

      // PDF should be substantial in size
      const pdfBlob = pdf.output('blob')
      expect(pdfBlob.size).toBeGreaterThan(5000) // Should be large due to comprehensive content
    })
  })

  describe('Performance and Scalability', () => {
    it('should generate PDFs efficiently', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const warning: Warning = {
        id: 'perf-warning',
        organizationId: 'test-org',
        employeeId: 'test-employee',
        categoryId: 'performance',
        level: 'verbal',
        incidentDate: new Date(),
        issueDate: new Date(),
        description: 'Performance test warning',
        issuedBy: 'test-manager',
        isActive: true,
        status: 'issued',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
      }

      const employee: Employee = {
        id: 'perf-employee',
        organizationId: 'test-org',
        firstName: 'Performance',
        lastName: 'Test',
        email: 'perf@test.com',
        department: 'Testing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const organization: Organization = {
        id: 'perf-org',
        name: 'Performance Test Org',
        industry: 'technology',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const startTime = Date.now()
      
      const pdf = await PDFGenerationService.generateWarningPDF(
        warning,
        employee,
        organization
      )

      const generationTime = Date.now() - startTime

      expect(pdf).toBeTruthy()
      expect(generationTime).toBeLessThan(2000) // Should generate within 2 seconds
    })

    it('should handle concurrent PDF generation', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const baseWarning = {
        organizationId: 'test-org',
        employeeId: 'test-employee',
        categoryId: 'concurrent',
        level: 'counselling' as const,
        incidentDate: new Date(),
        issueDate: new Date(),
        issuedBy: 'concurrent-manager',
        isActive: true,
        status: 'issued' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000),
      }

      const employee: Employee = {
        id: 'concurrent-employee',
        organizationId: 'test-org',
        firstName: 'Concurrent',
        lastName: 'Test',
        email: 'concurrent@test.com',
        department: 'Testing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const organization: Organization = {
        id: 'concurrent-org',
        name: 'Concurrent Test Org',
        industry: 'technology',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Generate multiple PDFs concurrently
      const concurrentGenerations = Array.from({ length: 5 }, (_, i) => 
        PDFGenerationService.generateWarningPDF(
          {
            ...baseWarning,
            id: `concurrent-warning-${i}`,
            description: `Concurrent test warning ${i}`,
          },
          employee,
          organization
        )
      )

      const startTime = Date.now()
      const pdfs = await Promise.all(concurrentGenerations)
      const totalTime = Date.now() - startTime

      expect(pdfs).toHaveLength(5)
      expect(pdfs.every(pdf => pdf.internal.pages.length > 0)).toBe(true)
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const invalidWarning = {
        // Missing required fields
        id: 'invalid-warning',
      } as any

      const employee: Employee = {
        id: 'test-employee',
        organizationId: 'test-org',
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@test.com',
        department: 'Test',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const organization: Organization = {
        id: 'test-org',
        name: 'Test Org',
        industry: 'technology',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Should either succeed with default values or throw descriptive error
      await expect(
        PDFGenerationService.generateWarningPDF(invalidWarning, employee, organization)
      ).rejects.toThrow()
    })

    it('should handle missing optional fields', async () => {
      const testEnv = getTestEnv()
      if (!testEnv) return

      const sparseWarning: Warning = {
        id: 'sparse-warning',
        organizationId: 'test-org',
        employeeId: 'test-employee',
        categoryId: 'minimal',
        level: 'counselling',
        incidentDate: new Date(),
        issueDate: new Date(),
        description: 'Minimal warning for testing',
        issuedBy: 'test-manager',
        isActive: true,
        status: 'issued',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiryDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000),
        // Missing: location, witnesses, correctiveAction, consequences, audioUrl, signatures, etc.
      }

      const sparseEmployee: Employee = {
        id: 'sparse-employee',
        organizationId: 'test-org',
        firstName: 'Sparse',
        lastName: 'Employee',
        email: 'sparse@test.com',
        department: 'Minimal',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Missing: employeeNumber, position, manager, startDate, personalDetails
      }

      const sparseOrganization: Organization = {
        id: 'sparse-org',
        name: 'Sparse Organization',
        industry: 'other',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Missing: branding, settings
      }

      const pdf = await PDFGenerationService.generateWarningPDF(
        sparseWarning,
        sparseEmployee,
        sparseOrganization
      )

      expect(pdf).toBeTruthy()
      expect(pdf.internal.pages.length).toBeGreaterThan(0)
    })
  })
})