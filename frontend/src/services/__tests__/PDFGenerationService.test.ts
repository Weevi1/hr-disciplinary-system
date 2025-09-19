// src/services/__tests__/PDFGenerationService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFGenerationService } from '../PDFGenerationService'
import { factories } from '../../test-utils/factories'

// Mock jsPDF
const mockJsPDF = {
  text: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  addPage: vi.fn(),
  addImage: vi.fn(),
  rect: vi.fn(),
  line: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297
    },
    pages: ['page1', 'page2'] // Mock multi-page document
  },
  save: vi.fn(),
  output: vi.fn(() => 'mock-pdf-blob')
}

vi.mock('jspdf', () => ({
  default: vi.fn(() => mockJsPDF)
}))

describe('PDFGenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateWarningPDF', () => {
    it('should generate PDF with all required fields', async () => {
      const mockData = factories.pdfData({
        employee: {
          firstName: 'John',
          lastName: 'Doe',
          employeeNumber: 'EMP001',
          department: 'IT',
          position: 'Developer',
          email: 'john.doe@company.com',
          phone: '+27123456789'
        },
        warningLevel: 'Verbal Warning',
        category: 'Attendance',
        incidentDate: new Date('2024-01-15'),
        incidentTime: '09:30',
        incidentLocation: 'Office premises',
        description: 'Employee arrived 30 minutes late without prior notice'
      })

      const pdf = await PDFGenerationService.generateWarningPDF(mockData)

      // Verify PDF instance was created
      expect(pdf).toBe(mockJsPDF)
      
      // Verify header information was added
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('DISCIPLINARY WARNING'),
        expect.any(Number),
        expect.any(Number)
      )

      // Verify employee details were included
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
        expect.any(Number),
        expect.any(Number)
      )

      // Verify warning level was included
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Verbal Warning'),
        expect.any(Number),
        expect.any(Number)
      )

      // Verify incident details were included
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Office premises'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should handle missing signature data gracefully', async () => {
      const mockDataWithoutSignatures = factories.pdfData({
        signatures: undefined
      })

      expect(async () => {
        await PDFGenerationService.generateWarningPDF(mockDataWithoutSignatures)
      }).not.toThrow()

      // Should still generate PDF successfully
      expect(mockJsPDF.text).toHaveBeenCalled()
    })

    it('should embed manager signature when available', async () => {
      const mockDataWithSignatures = factories.pdfData({
        signatures: {
          manager: 'data:image/png;base64,mock-manager-signature-data',
          employee: null
        }
      })

      await PDFGenerationService.generateWarningPDF(mockDataWithSignatures)

      // Verify image was added to PDF
      expect(mockJsPDF.addImage).toHaveBeenCalledWith(
        'data:image/png;base64,mock-manager-signature-data',
        'PNG',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should embed employee signature when available', async () => {
      const mockDataWithEmployeeSignature = factories.pdfData({
        signatures: {
          manager: null,
          employee: 'data:image/png;base64,mock-employee-signature-data'
        }
      })

      await PDFGenerationService.generateWarningPDF(mockDataWithEmployeeSignature)

      // Verify employee signature was added
      expect(mockJsPDF.addImage).toHaveBeenCalledWith(
        'data:image/png;base64,mock-employee-signature-data',
        'PNG',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should handle signature embedding errors gracefully', async () => {
      // Mock addImage to throw an error
      mockJsPDF.addImage.mockImplementationOnce(() => {
        throw new Error('Image embedding failed')
      })

      const mockDataWithSignatures = factories.pdfData({
        signatures: {
          manager: 'data:image/png;base64,invalid-data',
          employee: null
        }
      })

      // Should not throw, should fallback to text
      expect(async () => {
        await PDFGenerationService.generateWarningPDF(mockDataWithSignatures)
      }).not.toThrow()

      // Should fallback to "Digitally Signed" text
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Digitally Signed'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should include disciplinary recommendation when available', async () => {
      const mockDataWithRecommendation = factories.pdfData({
        disciplineRecommendation: {
          suggestedLevel: 'verbal',
          reason: 'Progressive discipline approach',
          warningCount: 1,
          activeWarnings: [],
          legalRequirements: ['Document thoroughly', 'Fair procedure']
        }
      })

      await PDFGenerationService.generateWarningPDF(mockDataWithRecommendation)

      // Verify recommendation details were included
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Progressive discipline approach'),
        expect.any(Number),
        expect.any(Number)
      )

      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Document thoroughly'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should format dates correctly', async () => {
      const specificDate = new Date('2024-01-15T14:30:00')
      const mockDataWithDates = factories.pdfData({
        issuedDate: specificDate,
        incidentDate: specificDate
      })

      await PDFGenerationService.generateWarningPDF(mockDataWithDates)

      // Should format date as DD/MM/YYYY
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('15/01/2024'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should create multi-page document for large content', async () => {
      const mockDataLarge = factories.pdfData({
        description: 'Very long incident description '.repeat(100),
        additionalNotes: 'Very long additional notes '.repeat(100)
      })

      await PDFGenerationService.generateWarningPDF(mockDataLarge)

      // Should have created additional pages for large content
      expect(mockJsPDF.addPage).toHaveBeenCalled()
    })

    it('should handle missing organization data gracefully', async () => {
      const mockDataMinimal = factories.pdfData({
        organization: {
          name: 'Test Company',
          // Missing other organization fields
        }
      })

      expect(async () => {
        await PDFGenerationService.generateWarningPDF(mockDataMinimal)
      }).not.toThrow()
    })

    it('should apply organization branding when available', async () => {
      const mockDataWithBranding = factories.pdfData({
        organization: {
          ...factories.organization(),
          branding: {
            colors: {
              primary: '#1f2937',
              secondary: '#3b82f6'
            }
          }
        }
      })

      await PDFGenerationService.generateWarningPDF(mockDataWithBranding)

      // Should set text color based on branding
      expect(mockJsPDF.setTextColor).toHaveBeenCalledWith('#1f2937')
    })
  })

  describe('PDF performance', () => {
    it('should generate PDF within reasonable time limits', async () => {
      const mockData = factories.pdfData()
      const start = performance.now()

      await PDFGenerationService.generateWarningPDF(mockData)

      const duration = performance.now() - start
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should handle large datasets efficiently', async () => {
      const mockDataWithLargeHistory = factories.pdfData({
        disciplineRecommendation: {
          suggestedLevel: 'final_written',
          reason: 'Multiple violations',
          warningCount: 10,
          activeWarnings: Array(10).fill(null).map(() => factories.warning()),
          legalRequirements: Array(20).fill('Legal requirement text')
        }
      })

      const start = performance.now()
      await PDFGenerationService.generateWarningPDF(mockDataWithLargeHistory)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(3000) // Allow more time for large datasets
    })
  })

  describe('PDF output validation', () => {
    it('should return valid jsPDF instance', async () => {
      const mockData = factories.pdfData()
      const result = await PDFGenerationService.generateWarningPDF(mockData)

      expect(result).toBe(mockJsPDF)
      expect(result.output).toBeTypeOf('function')
      expect(result.save).toBeTypeOf('function')
    })

    it('should be able to output PDF blob', async () => {
      const mockData = factories.pdfData()
      const pdf = await PDFGenerationService.generateWarningPDF(mockData)

      const output = pdf.output('blob')
      expect(output).toBe('mock-pdf-blob')
    })
  })
})