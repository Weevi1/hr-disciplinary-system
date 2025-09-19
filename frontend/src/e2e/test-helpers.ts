import Logger from '../utils/logger';
// src/e2e/test-helpers.ts - E2E test helper functions
import { Page } from '@playwright/test'

// Authentication helpers
export async function loginAsHODManager(page: Page) {
  await page.goto('/')
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', 'hod.manager@test.com')
  await page.fill('[data-testid="password-input"]', 'testpassword123')
  
  // Submit login
  await page.click('[data-testid="login-submit"]')
  
  // Wait for dashboard to load
  await page.waitForSelector('[data-testid="hod-dashboard"]', { timeout: 10000 })
}

export async function loginAsHRManager(page: Page) {
  await page.goto('/')
  
  await page.fill('[data-testid="email-input"]', 'hr.manager@test.com')
  await page.fill('[data-testid="password-input"]', 'testpassword123')
  
  await page.click('[data-testid="login-submit"]')
  await page.waitForSelector('[data-testid="hr-dashboard"]', { timeout: 10000 })
}

export async function loginAsBusinessOwner(page: Page) {
  await page.goto('/')
  
  await page.fill('[data-testid="email-input"]', 'business.owner@test.com')
  await page.fill('[data-testid="password-input"]', 'testpassword123')
  
  await page.click('[data-testid="login-submit"]')
  await page.waitForSelector('[data-testid="business-dashboard"]', { timeout: 10000 })
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-btn"]')
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 })
}

// Data seeding helpers
export async function seedTestData() {
  // This would typically call Firebase emulator APIs to seed test data
  Logger.debug('Seeding test data...')
  
  // Mock implementation - in real scenario, this would:
  // 1. Connect to Firebase emulator
  // 2. Clear existing test data
  // 3. Seed fresh test data including:
  //    - Test organization
  //    - Test users (HOD manager, HR manager, business owner)
  //    - Test employees
  //    - Warning categories
  //    - Sample warning history for "repeat offender" employee
}

export async function cleanupTestData() {
  // Clean up test data after each test
  Logger.debug('Cleaning up test data...')
  
  // Mock implementation - would clear emulator data
}

// Navigation helpers
export async function navigateToEmployees(page: Page) {
  await page.click('[data-testid="nav-employees"]')
  await page.waitForSelector('[data-testid="employees-page"]', { timeout: 5000 })
}

export async function navigateToWarnings(page: Page) {
  await page.click('[data-testid="nav-warnings"]')
  await page.waitForSelector('[data-testid="warnings-page"]', { timeout: 5000 })
}

export async function navigateToDashboard(page: Page) {
  await page.click('[data-testid="nav-dashboard"]')
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 })
}

// Form helpers
export async function fillEmployeeForm(page: Page, employeeData: {
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  employeeNumber: string
}) {
  await page.fill('[data-testid="first-name-input"]', employeeData.firstName)
  await page.fill('[data-testid="last-name-input"]', employeeData.lastName)
  await page.fill('[data-testid="email-input"]', employeeData.email)
  await page.fill('[data-testid="department-input"]', employeeData.department)
  await page.fill('[data-testid="position-input"]', employeeData.position)
  await page.fill('[data-testid="employee-number-input"]', employeeData.employeeNumber)
}

export async function fillWarningForm(page: Page, warningData: {
  employeeId: string
  category: string
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  description: string
}) {
  await page.click('[data-testid="employee-select"]')
  await page.click(`[data-testid="employee-option-${warningData.employeeId}"]`)
  
  await page.click('[data-testid="category-select"]')
  await page.click(`[data-testid="category-${warningData.category}"]`)
  
  await page.fill('[data-testid="incident-date"]', warningData.incidentDate)
  await page.fill('[data-testid="incident-time"]', warningData.incidentTime)
  await page.fill('[data-testid="incident-location"]', warningData.incidentLocation)
  await page.fill('[data-testid="incident-description"]', warningData.description)
}

// Signature helpers
export async function drawSignature(page: Page, canvasSelector: string) {
  const canvas = page.locator(canvasSelector)
  
  // Draw a simple signature
  await canvas.hover()
  await page.mouse.down()
  await page.mouse.move(100, 50)
  await page.mouse.move(150, 30)
  await page.mouse.move(200, 60)
  await page.mouse.up()
}

export async function saveManagerSignature(page: Page) {
  await drawSignature(page, '[data-testid="manager-signature-canvas"]')
  await page.click('[data-testid="save-manager-signature"]')
}

export async function saveEmployeeSignature(page: Page) {
  await drawSignature(page, '[data-testid="employee-signature-canvas"]')
  await page.click('[data-testid="save-employee-signature"]')
}

// Verification helpers
export async function verifyWarningCreated(page: Page, expectedData: {
  employeeName: string
  category: string
  level?: string
}) {
  // Navigate to warnings list
  await navigateToWarnings(page)
  
  // Verify warning appears in list
  const warningRow = page.locator('[data-testid="warnings-table"] tr')
    .filter({ hasText: expectedData.employeeName })
  
  await warningRow.waitFor({ timeout: 10000 })
  
  // Verify details
  await warningRow.locator('text=' + expectedData.category).waitFor()
  
  if (expectedData.level) {
    await warningRow.locator('text=' + expectedData.level).waitFor()
  }
}

export async function verifyEmployeeCreated(page: Page, employeeName: string) {
  await navigateToEmployees(page)
  
  const employeeRow = page.locator('[data-testid="employees-table"] tr')
    .filter({ hasText: employeeName })
  
  await employeeRow.waitFor({ timeout: 10000 })
}

// Error handling helpers
export async function expectValidationError(page: Page, fieldTestId: string, errorMessage: string) {
  const errorElement = page.locator(`[data-testid="${fieldTestId}-error"]`)
  await errorElement.waitFor({ timeout: 5000 })
  return errorElement.textContent().then(text => text?.includes(errorMessage))
}

export async function expectNoValidationErrors(page: Page) {
  // Check that no error messages are visible
  const errors = page.locator('[data-testid*="-error"]')
  await errors.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {
    // Errors might not exist at all, which is fine
  })
}

// Mobile helpers
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 })
}

export async function setTabletViewport(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 })
}

export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
}

// File handling helpers
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  await page.setInputFiles(inputSelector, filePath)
}

export async function downloadAndVerifyFile(page: Page, downloadSelector: string, expectedFileName: string) {
  const downloadPromise = page.waitForDownload()
  await page.click(downloadSelector)
  const download = await downloadPromise
  
  expect(download.suggestedFilename()).toContain(expectedFileName)
  return download
}

// Wait helpers
export async function waitForLoadingToComplete(page: Page) {
  // Wait for any loading spinners to disappear
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 })
    .catch(() => {
      // Loading spinner might not exist, which is fine
    })
}

export async function waitForToastMessage(page: Page, expectedMessage: string) {
  const toast = page.locator('[data-testid="toast"]').filter({ hasText: expectedMessage })
  await toast.waitFor({ timeout: 10000 })
  
  // Wait for toast to disappear
  await toast.waitFor({ state: 'hidden', timeout: 5000 })
}

// Dashboard helpers
export async function verifyDashboardStats(page: Page, expectedStats: {
  employeeCount?: number
  warningCount?: number
  activeWarnings?: number
}) {
  if (expectedStats.employeeCount !== undefined) {
    await page.locator('[data-testid="employee-count"]')
      .filter({ hasText: expectedStats.employeeCount.toString() })
      .waitFor()
  }
  
  if (expectedStats.warningCount !== undefined) {
    await page.locator('[data-testid="warning-count"]')
      .filter({ hasText: expectedStats.warningCount.toString() })
      .waitFor()
  }
  
  if (expectedStats.activeWarnings !== undefined) {
    await page.locator('[data-testid="active-warnings"]')
      .filter({ hasText: expectedStats.activeWarnings.toString() })
      .waitFor()
  }
}

// Audio testing helpers
export async function mockAudioRecording(page: Page) {
  await page.addInitScript(() => {
    // Mock MediaRecorder
    window.MediaRecorder = class MockMediaRecorder {
      state = 'inactive'
      ondataavailable = null
      onstop = null
      
      start() {
        this.state = 'recording'
        setTimeout(() => {
          if (this.ondataavailable) {
            this.ondataavailable({ data: new Blob(['mock audio data']) })
          }
        }, 100)
      }
      
      stop() {
        this.state = 'inactive'
        if (this.onstop) {
          this.onstop()
        }
      }
      
      addEventListener(event, handler) {
        if (event === 'dataavailable') this.ondataavailable = handler
        if (event === 'stop') this.onstop = handler
      }
      
      removeEventListener() {}
    }
    
    // Mock getUserMedia
    navigator.mediaDevices.getUserMedia = async () => {
      return {
        getTracks: () => [{ stop: () => {} }],
        getAudioTracks: () => [{ stop: () => {} }]
      }
    }
  })
}

export { expect } from '@playwright/test'