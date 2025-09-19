// src/e2e/warning-creation.spec.ts - E2E test for complete warning creation workflow
import { test, expect } from '@playwright/test'
import { loginAsHODManager, seedTestData, cleanupTestData } from './test-helpers'

test.describe('Warning Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData()
    await page.goto('/')
  })

  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('Complete warning creation and delivery flow', async ({ page }) => {
    // Login as HOD Manager
    await loginAsHODManager(page)

    // Navigate to dashboard
    await expect(page.locator('[data-testid="hod-dashboard"]')).toBeVisible()

    // Click "Issue Warning" button
    await page.click('[data-testid="issue-warning-btn"]')

    // Audio consent modal should appear
    await expect(page.locator('[data-testid="audio-consent-modal"]')).toBeVisible()
    await page.click('[data-testid="audio-consent-accept"]')

    // Warning wizard should open
    await expect(page.locator('[data-testid="warning-wizard"]')).toBeVisible()

    // Step 1: Combined Incident Step
    await test.step('Fill incident details', async () => {
      // Select employee
      await page.click('[data-testid="employee-select"]')
      await page.click('[data-testid="employee-option-john-doe"]')

      // Select category
      await page.click('[data-testid="category-select"]')
      await page.click('[data-testid="category-attendance"]')

      // Fill incident details
      await page.fill('[data-testid="incident-date"]', '2024-01-15')
      await page.fill('[data-testid="incident-time"]', '09:30')
      await page.fill('[data-testid="incident-location"]', 'Office premises')
      await page.fill('[data-testid="incident-description"]', 'Employee arrived 30 minutes late without prior notice')

      // Verify escalation recommendation appears
      await expect(page.locator('[data-testid="escalation-recommendation"]')).toBeVisible()
      await expect(page.locator('[data-testid="suggested-level"]')).toContainText('Counselling')

      // Click Next
      await page.click('[data-testid="wizard-next-btn"]')
    })

    // Step 2: Signatures
    await test.step('Capture signatures', async () => {
      await expect(page.locator('[data-testid="signatures-step"]')).toBeVisible()

      // Manager signature
      const managerCanvas = page.locator('[data-testid="manager-signature-canvas"]')
      await expect(managerCanvas).toBeVisible()
      
      // Simulate signature drawing
      await managerCanvas.hover()
      await page.mouse.down()
      await page.mouse.move(100, 50)
      await page.mouse.move(150, 100)
      await page.mouse.up()

      await page.click('[data-testid="save-manager-signature"]')

      // Verify signature saved
      await expect(page.locator('[data-testid="manager-signature-status"]')).toContainText('Signed')

      // Employee signature (optional for this test)
      const employeeCanvas = page.locator('[data-testid="employee-signature-canvas"]')
      await employeeCanvas.hover()
      await page.mouse.down()
      await page.mouse.move(200, 60)
      await page.mouse.move(250, 110)
      await page.mouse.up()

      await page.click('[data-testid="save-employee-signature"]')

      // Click Next
      await page.click('[data-testid="wizard-next-btn"]')
    })

    // Step 3: Delivery and Completion
    await test.step('Complete delivery', async () => {
      await expect(page.locator('[data-testid="delivery-step"]')).toBeVisible()

      // Select delivery method
      await page.click('[data-testid="delivery-email"]')

      // Generate PDF preview
      await page.click('[data-testid="generate-pdf-btn"]')
      
      // Wait for PDF generation
      await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible({ timeout: 10000 })

      // Verify PDF contains expected content
      await expect(page.locator('[data-testid="pdf-content"]')).toContainText('John Doe')
      await expect(page.locator('[data-testid="pdf-content"]')).toContainText('Attendance')
      await expect(page.locator('[data-testid="pdf-content"]')).toContainText('Counselling')

      // Complete the warning
      await page.click('[data-testid="complete-warning-btn"]')

      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Warning created successfully')
    })

    // Verify warning appears in dashboard
    await test.step('Verify warning in dashboard', async () => {
      await page.goto('/dashboard')
      
      // Check warning statistics updated
      await expect(page.locator('[data-testid="warnings-count"]')).not.toContainText('0')
      
      // Check recent warnings list
      await expect(page.locator('[data-testid="recent-warnings"]')).toContainText('John Doe')
      await expect(page.locator('[data-testid="recent-warnings"]')).toContainText('Attendance')
    })
  })

  test('Warning creation with audio recording', async ({ page }) => {
    await loginAsHODManager(page)
    
    // Mock getUserMedia for audio recording
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        return {
          getTracks: () => [{ stop: () => {} }],
          getAudioTracks: () => [{ stop: () => {} }]
        } as MediaStream
      }
    })

    await page.click('[data-testid="issue-warning-btn"]')
    await page.click('[data-testid="audio-consent-accept"]')

    // Start audio recording
    await page.click('[data-testid="start-recording-btn"]')
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()

    // Wait for recording
    await page.waitForTimeout(2000)

    // Stop recording
    await page.click('[data-testid="stop-recording-btn"]')
    
    // Verify audio recorded
    await expect(page.locator('[data-testid="audio-playback"]')).toBeVisible()

    // Continue with rest of form...
    await page.click('[data-testid="employee-select"]')
    await page.click('[data-testid="employee-option-john-doe"]')
    
    await page.click('[data-testid="category-select"]')
    await page.click('[data-testid="category-attendance"]')

    await page.fill('[data-testid="incident-date"]', '2024-01-15')
    await page.fill('[data-testid="incident-description"]', 'Test incident with audio recording')

    await page.click('[data-testid="wizard-next-btn"]')
    
    // Skip signatures for this test
    await page.click('[data-testid="wizard-next-btn"]')

    // Complete delivery
    await page.click('[data-testid="delivery-email"]')
    await page.click('[data-testid="complete-warning-btn"]')

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Warning creation validation errors', async ({ page }) => {
    await loginAsHODManager(page)
    
    await page.click('[data-testid="issue-warning-btn"]')
    await page.click('[data-testid="audio-consent-accept"]')

    // Try to proceed without filling required fields
    await page.click('[data-testid="wizard-next-btn"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="employee-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="incident-date-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="description-error"]')).toBeVisible()

    // Should not advance to next step
    await expect(page.locator('[data-testid="signatures-step"]')).not.toBeVisible()

    // Fill minimum required fields
    await page.click('[data-testid="employee-select"]')
    await page.click('[data-testid="employee-option-john-doe"]')
    
    await page.click('[data-testid="category-select"]')
    await page.click('[data-testid="category-attendance"]')

    await page.fill('[data-testid="incident-date"]', '2024-01-15')
    await page.fill('[data-testid="incident-description"]', 'Valid incident description')

    // Should now advance
    await page.click('[data-testid="wizard-next-btn"]')
    await expect(page.locator('[data-testid="signatures-step"]')).toBeVisible()
  })

  test('Escalation recommendation accuracy', async ({ page }) => {
    await loginAsHODManager(page)

    // Create a warning for employee with existing history
    await page.click('[data-testid="issue-warning-btn"]')
    await page.click('[data-testid="audio-consent-accept"]')

    // Select employee with warning history
    await page.click('[data-testid="employee-select"]')
    await page.click('[data-testid="employee-option-repeat-offender"]')

    await page.click('[data-testid="category-select"]')
    await page.click('[data-testid="category-attendance"]')

    // Wait for escalation recommendation to load
    await expect(page.locator('[data-testid="escalation-recommendation"]')).toBeVisible()

    // Should recommend higher level for repeat offender
    await expect(page.locator('[data-testid="suggested-level"]')).toContainText('Verbal Warning')
    await expect(page.locator('[data-testid="escalation-reason"]')).toContainText('active warning')
    
    // Should show warning history
    await expect(page.locator('[data-testid="warning-history"]')).toBeVisible()
    await expect(page.locator('[data-testid="previous-warnings-count"]')).toContainText('1')
  })

  test('Mobile responsive warning creation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await loginAsHODManager(page)
    
    // Mobile dashboard should be visible
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
    
    await page.click('[data-testid="issue-warning-btn"]')
    await page.click('[data-testid="audio-consent-accept"]')

    // Mobile wizard layout should adapt
    await expect(page.locator('[data-testid="mobile-wizard-layout"]')).toBeVisible()

    // Form fields should be properly sized
    const employeeSelect = page.locator('[data-testid="employee-select"]')
    await expect(employeeSelect).toBeVisible()
    
    const boundingBox = await employeeSelect.boundingBox()
    expect(boundingBox?.width).toBeLessThan(375) // Should fit in mobile screen

    // Signature canvas should be mobile-optimized
    await page.click('[data-testid="employee-select"]')
    await page.click('[data-testid="employee-option-john-doe"]')
    
    await page.click('[data-testid="category-select"]')
    await page.click('[data-testid="category-attendance"]')

    await page.fill('[data-testid="incident-date"]', '2024-01-15')
    await page.fill('[data-testid="incident-description"]', 'Mobile test incident')

    await page.click('[data-testid="wizard-next-btn"]')

    // Mobile signature canvas
    const mobileCanvas = page.locator('[data-testid="mobile-signature-canvas"]')
    await expect(mobileCanvas).toBeVisible()
    
    const canvasBounds = await mobileCanvas.boundingBox()
    expect(canvasBounds?.width).toBeLessThan(375)
  })

  test('PDF generation and QR code download', async ({ page }) => {
    await loginAsHODManager(page)
    
    // Complete warning creation
    await page.click('[data-testid="issue-warning-btn"]')
    await page.click('[data-testid="audio-consent-accept"]')

    await page.click('[data-testid="employee-select"]')
    await page.click('[data-testid="employee-option-john-doe"]')
    
    await page.click('[data-testid="category-select"]')
    await page.click('[data-testid="category-attendance"]')

    await page.fill('[data-testid="incident-date"]', '2024-01-15')
    await page.fill('[data-testid="incident-description"]', 'PDF test incident')

    await page.click('[data-testid="wizard-next-btn"]')
    await page.click('[data-testid="wizard-next-btn"]') // Skip signatures

    // Generate PDF
    await page.click('[data-testid="generate-pdf-btn"]')
    await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible()

    // Test QR code generation
    await page.click('[data-testid="generate-qr-btn"]')
    
    // QR modal should appear
    await expect(page.locator('[data-testid="qr-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible()
    
    // Download link should be available
    await expect(page.locator('[data-testid="download-link"]')).toBeVisible()
    
    // Verify link is valid (should contain temp-downloads)
    const downloadLink = await page.locator('[data-testid="download-link"]').getAttribute('href')
    expect(downloadLink).toContain('temp-downloads')
    
    await page.click('[data-testid="close-qr-modal"]')

    // Complete warning
    await page.click('[data-testid="complete-warning-btn"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})