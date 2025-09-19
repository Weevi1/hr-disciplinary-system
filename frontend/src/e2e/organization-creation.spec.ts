// E2E Test: Organization Creation with Dev Wizard
import { test, expect } from '@playwright/test';

test.describe('Organization Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should create a test organization successfully', async ({ page }) => {
    // Step 1: Handle login flow
    // Check if we're on login page or dashboard
    const isLoginPage = await page.locator('text="Access Dashboard"').isVisible({ timeout: 5000 });
    
    if (isLoginPage) {
      console.log('Login page detected, logging in...');
      
      // Clear and fill email field slowly
      await page.fill('input[type="email"]', '');
      await page.type('input[type="email"]', 'superuser@hrdignitysystem.com', { delay: 100 });
      
      // Clear and fill password field slowly  
      await page.fill('input[type="password"]', '');
      await page.type('input[type="password"]', 'test123', { delay: 100 });
      
      // Wait a moment for validation
      await page.waitForTimeout(1000);
      
      // Click login button
      await page.click('button:has-text("Access Dashboard")');
      console.log('Clicked login button, waiting for dashboard...');
      
      // Wait for dashboard to load after successful login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Give extra time for Firebase auth and dashboard to load
    }
    
    // Wait for dashboard or any main content to be visible
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Step 2: Navigate to organization creation  
    // Look for the "Test Org" button specifically (for dev testing without Stripe)
    const deployButton = page.locator('text="Test Org"').or(
      page.locator('button:has-text("Test Org")')
    ).or(
      page.locator('button:has-text("Test")')
    );
    
    // Wait for dashboard to be ready and look for the button
    await page.waitForTimeout(3000);
    await expect(deployButton).toBeVisible({ timeout: 10000 });
    console.log('Found deploy button, clicking...');
    await deployButton.click();
    
    // Step 3: Wait for and interact with DevOrganizationWizard modal
    await page.waitForSelector('[data-testid="dev-organization-wizard"]', { 
      timeout: 5000 
    }).catch(() => {
      // If no test id, look for modal content
      return page.waitForSelector('text="Company Information"', { timeout: 5000 });
    });
    
    // Step 4: Fill out organization form
    // Company Name
    await page.fill('input[name="companyName"]', 'E2E Test Company');
    
    // Employee Count
    await page.fill('input[name="employeeCount"]', '25');
    
    // Industry (if dropdown)
    const industrySelect = page.locator('select[name="industry"]');
    if (await industrySelect.isVisible()) {
      await industrySelect.selectOption('Technology');
    } else {
      // If it's an input field
      await page.fill('input[name="industry"]', 'Technology');
    }
    
    // Province
    const provinceSelect = page.locator('select[name="province"]');
    if (await provinceSelect.isVisible()) {
      await provinceSelect.selectOption('Gauteng');
    }
    
    // City
    await page.fill('input[name="city"]', 'Johannesburg');
    
    // Contact Information
    await page.fill('input[name="contactPerson"]', 'John Doe');
    await page.fill('input[name="contactEmail"]', 'john@e2etest.com');
    await page.fill('input[name="contactPhone"]', '+27123456789');
    
    // Admin Information
    await page.fill('input[name="adminFirstName"]', 'Admin');
    await page.fill('input[name="adminLastName"]', 'User');
    await page.fill('input[name="adminEmail"]', 'admin@e2etest.com');
    
    // Step 5: Submit the form
    const createButton = page.locator('text="Create Test Organization"').or(
      page.locator('button[type="submit"]')
    ).or(
      page.locator('text="Deploy Organization"')
    );
    
    await createButton.click();
    
    // Step 6: Wait for creation to complete and verify success
    // Look for success message or redirect
    const successIndicator = page.locator('text="Organization created successfully"').or(
      page.locator('text="✅"')
    ).or(
      page.locator('[data-testid="creation-success"]')
    );
    
    await expect(successIndicator).toBeVisible({ timeout: 30000 });
    
    // Step 7: Verify no error messages appear
    const errorMessage = page.locator('text="Missing or insufficient permissions"');
    await expect(errorMessage).not.toBeVisible();
    
    // Step 8: Verify organization appears in dashboard (if applicable)
    // This might require navigating back to main dashboard
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Look for the newly created organization
    await expect(page.locator('text="E2E Test Company"')).toBeVisible({ timeout: 5000 });
  });

  test('should handle form validation', async ({ page }) => {
    // Login first
    const isLoginPage = await page.locator('text="Access Dashboard"').isVisible({ timeout: 5000 });
    if (isLoginPage) {
      await page.type('input[type="email"]', 'superuser@hrdignitysystem.com', { delay: 50 });
      await page.type('input[type="password"]', 'test123', { delay: 50 });
      await page.click('button:has-text("Access Dashboard")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to organization creation using Test Org button
    const deployButton = page.locator('text="Test Org"');
    await deployButton.click();
    
    // Try to submit empty form
    const createButton = page.locator('text="Create Test Organization"');
    await createButton.click();
    
    // Should see validation errors
    await expect(page.locator('text="required"').or(page.locator('text="Please"'))).toBeVisible();
  });

  test('should display proper error handling for network issues', async ({ page, context }) => {
    // Login first
    const isLoginPage = await page.locator('text="Access Dashboard"').isVisible({ timeout: 5000 });
    if (isLoginPage) {
      await page.type('input[type="email"]', 'superuser@hrdignitysystem.com', { delay: 50 });
      await page.type('input[type="password"]', 'test123', { delay: 50 });
      await page.click('button:has-text("Access Dashboard")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Block Firebase requests to simulate network issues
    await context.route('**/*firestore.googleapis.com/**', route => route.abort());
    
    // Navigate to organization creation using Test Org button
    const deployButton = page.locator('text="Test Org"');
    await deployButton.click();
    
    // Fill minimal form data
    await page.fill('input[name="companyName"]', 'Network Test Org');
    await page.fill('input[name="adminEmail"]', 'admin@networktest.com');
    
    // Submit form
    const createButton = page.locator('text="Create Test Organization"');
    await createButton.click();
    
    // Should show error message
    await expect(page.locator('text="Failed"').or(page.locator('text="Error"'))).toBeVisible({
      timeout: 15000
    });
  });
});

test.describe('Organization Creation - Visual Tests', () => {
  test('should display organization wizard correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Login first
    const isLoginPage = await page.locator('text="Access Dashboard"').isVisible({ timeout: 5000 });
    if (isLoginPage) {
      await page.type('input[type="email"]', 'superuser@hrdignitysystem.com', { delay: 50 });
      await page.type('input[type="password"]', 'test123', { delay: 50 });
      await page.click('button:has-text("Access Dashboard")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Open organization wizard using Test Org button
    const deployButton = page.locator('text="Test Org"');
    await deployButton.click();
    
    // Take screenshot of the wizard
    await expect(page).toHaveScreenshot('organization-wizard.png');
  });
});