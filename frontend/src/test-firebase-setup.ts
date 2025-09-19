import Logger from './utils/logger';
// src/test-firebase-setup.ts - Firebase Emulator Integration Setup
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let testEnv: RulesTestEnvironment

export const getTestEnv = () => testEnv

// Initialize Firebase emulator environment before all integration tests
beforeAll(async () => {
  try {
    // Read Firestore security rules
    const rulesPath = resolve(__dirname, '../../config/firestore.rules')
    const firestoreRules = readFileSync(rulesPath, 'utf8')

    testEnv = await initializeTestEnvironment({
      projectId: 'demo-test-project',
      firestore: {
        rules: firestoreRules,
        host: 'localhost',
        port: 8080,
      },
      auth: {
        host: 'localhost',
        port: 9099,
      },
      storage: {
        rules: readFileSync(resolve(__dirname, '../../config/storage.rules'), 'utf8'),
        host: 'localhost',
        port: 9199,
      },
    })
  } catch (error) {
    Logger.warn('Firebase emulator setup failed - tests will use mocks:', error.message)
  }
})

// Clean up after all integration tests
afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
})

// Clear data between tests
beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore()
  }
})

// Helper functions for integration tests
export const seedTestData = async () => {
  if (!testEnv) return

  const adminContext = testEnv.authenticatedContext('admin', {
    role: 'super-user'
  })
  
  const firestore = adminContext.firestore()

  // Seed basic test data
  await Promise.all([
    firestore.doc('organizations/test-org').set({
      name: 'Test Organization',
      active: true,
      createdAt: new Date(),
    }),
    
    firestore.doc('employees/test-employee').set({
      organizationId: 'test-org',
      firstName: 'John',
      lastName: 'Doe',
      department: 'IT',
      position: 'Developer',
      email: 'john.doe@test.com',
      active: true,
      createdAt: new Date(),
    }),

    firestore.doc('warning_categories/attendance').set({
      organizationId: 'test-org',
      name: 'Attendance',
      severity: 'medium',
      escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
      active: true,
      createdAt: new Date(),
    }),
  ])
}

export const mockUser = (userClaims = {}) => {
  if (!testEnv) return null
  
  const defaultClaims = {
    uid: 'test-user',
    organizationId: 'test-org',
    role: 'hr-manager',
    ...userClaims
  }
  
  return testEnv.authenticatedContext(defaultClaims.uid, defaultClaims)
}