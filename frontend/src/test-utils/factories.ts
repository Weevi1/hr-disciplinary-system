// src/test-utils/factories.ts - Mock data factories for consistent testing
import type { Warning, Employee, WarningCategory } from '../types'
import type { EscalationRecommendation } from '../services/WarningService'

// Employee factory
export const mockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-123',
  organizationId: 'org-1',
  firstName: 'John',
  lastName: 'Doe',
  employeeNumber: 'EMP001',
  department: 'IT',
  position: 'Developer',
  email: 'john.doe@company.com',
  phone: '+27123456789',
  startDate: new Date('2023-01-01'),
  status: 'active',
  managerId: 'mgr-1',
  deliveryPreference: 'email',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Warning factory
export const mockWarning = (overrides: Partial<Warning> = {}): Warning => ({
  id: 'warn-123',
  organizationId: 'org-1',
  employeeId: 'emp-123',
  categoryId: 'attendance',
  level: 'verbal',
  title: 'Attendance Warning',
  description: 'Late arrival to work',
  incidentDate: new Date(),
  incidentTime: '09:30',
  incidentLocation: 'Office',
  issueDate: new Date(),
  expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
  validityPeriod: 6,
  issuedBy: 'mgr-1',
  isActive: true,
  isSigned: false,
  isDelivered: false,
  deliveryMethod: 'email',
  deliveryStatus: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'mgr-1',
  ...overrides
})

// Warning category factory
export const mockWarningCategory = (overrides: Partial<WarningCategory> = {}): WarningCategory => ({
  id: 'attendance',
  organizationId: 'org-1',
  name: 'Attendance',
  description: 'Issues related to punctuality and attendance',
  severity: 'medium',
  escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
  legalRequirements: ['Document all incidents', 'Provide written notice'],
  examples: ['Late arrival', 'Early departure', 'Unexcused absence'],
  defaultValidityPeriod: 6,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// Escalation recommendation factory
export const mockEscalationRecommendation = (
  overrides: Partial<EscalationRecommendation> = {}
): EscalationRecommendation => ({
  suggestedLevel: 'counselling',
  recommendedLevel: 'Counselling',
  reason: 'First incident of attendance issues',
  activeWarnings: [],
  escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
  isEscalation: false,
  category: 'Attendance',
  categoryId: 'attendance',
  legalBasis: 'LRA Section 188',
  legalRequirements: ['Ensure fair procedure', 'Document thoroughly'],
  warningCount: 0,
  nextExpiryDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000),
  examples: ['Late arrival', 'Early departure'],
  explanation: 'Progressive discipline process',
  previousWarnings: [],
  ...overrides
})

// Organization factory
export const mockOrganization = (overrides = {}) => ({
  id: 'org-1',
  name: 'Test Company',
  industry: 'Technology',
  size: 'medium',
  address: '123 Test Street, Test City',
  phone: '+27123456789',
  email: 'info@testcompany.com',
  registrationNumber: 'REG123456',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    warningValidityPeriods: {
      counselling: 3,
      verbal: 6,
      first_written: 12,
      final_written: 24
    },
    deliveryMethods: ['email', 'whatsapp', 'print'],
    requireSignatures: true,
    audioRecording: true
  },
  branding: {
    colors: {
      primary: '#1f2937',
      secondary: '#3b82f6'
    }
  },
  ...overrides
})

// User factory
export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  organizationId: 'org-1',
  email: 'user@testcompany.com',
  firstName: 'Test',
  lastName: 'User',
  role: {
    id: 'hr-manager',
    name: 'HR Manager',
    description: 'Human Resources Manager',
    level: 3
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// PDF generation data factory
export const mockPDFData = (overrides = {}) => ({
  warningId: 'warn-123',
  issuedDate: new Date(),
  organizationId: 'org-1',
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
  incidentDate: new Date(),
  incidentTime: '09:30',
  incidentLocation: 'Office premises',
  description: 'Employee arrived 30 minutes late without prior notice',
  organization: mockOrganization(),
  signatures: {
    manager: 'data:image/png;base64,mock-manager-signature',
    employee: null
  },
  additionalNotes: 'Employee acknowledged the incident',
  validityPeriod: 6,
  disciplineRecommendation: mockEscalationRecommendation(),
  ...overrides
})

// Firebase document snapshot factory
export const mockDocSnapshot = (data: any, id: string) => ({
  id,
  exists: () => true,
  data: () => data,
  ref: { id },
})

// Firebase query snapshot factory
export const mockQuerySnapshot = (docs: any[]) => ({
  docs: docs.map((doc, index) => mockDocSnapshot(doc, `doc-${index}`)),
  size: docs.length,
  empty: docs.length === 0,
  forEach: (callback: Function) => docs.forEach(callback)
})

// Audio recording factory
export const mockAudioRecording = (overrides = {}) => ({
  id: 'audio-123',
  url: 'blob:mock-audio-url',
  duration: 30000, // 30 seconds
  format: 'audio/webm',
  size: 120000, // 120KB
  timestamp: new Date(),
  ...overrides
})

// Form data factory for warning wizard
export const mockWarningFormData = (overrides = {}) => ({
  employeeId: 'emp-123',
  categoryId: 'attendance',
  issueDate: new Date().toISOString().split('T')[0],
  incidentDate: new Date().toISOString().split('T')[0],
  incidentTime: '09:30',
  incidentLocation: 'Office premises',
  incidentDescription: 'Late arrival without notice',
  level: 'verbal' as const,
  validityPeriod: 6 as const,
  additionalNotes: 'First occurrence',
  ...overrides
})

// Collection of all factories for easy import
export const factories = {
  employee: mockEmployee,
  warning: mockWarning,
  category: mockWarningCategory,
  escalation: mockEscalationRecommendation,
  organization: mockOrganization,
  user: mockUser,
  pdfData: mockPDFData,
  docSnapshot: mockDocSnapshot,
  querySnapshot: mockQuerySnapshot,
  audioRecording: mockAudioRecording,
  formData: mockWarningFormData
}