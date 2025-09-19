// E2E Test: Dashboard Exploration - See what's actually available
import { test, expect } from '@playwright/test';

test.describe('Dashboard Exploration', () => {
  test('should login and explore dashboard elements', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Handle login
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
      console.log('Clicked login button, waiting for response...');
      
      // Wait for either dashboard or error
      await page.waitForTimeout(5000);
      
      // Check if login was successful by looking for error or dashboard
      const authError = await page.locator('text="Authentication Failed"').isVisible();
      if (authError) {
        console.log('Authentication failed - credentials may be incorrect');
        const errorText = await page.locator('text="Auth error"').textContent();
        console.log('Error details:', errorText);
      } else {
        console.log('Login appears successful, checking for dashboard...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    // Take screenshot of the dashboard
    await expect(page).toHaveScreenshot('dashboard-after-login.png');
    
    // Log all buttons and clickable elements
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on the page`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const visible = await button.isVisible();
      console.log(`Button ${i}: "${text}" (visible: ${visible})`);
    }
    
    // Look for any text containing "organization"
    const orgElements = await page.locator('text=/organization/i').all();
    console.log(`Found ${orgElements.length} elements containing "organization"`);
    
    for (const element of orgElements.slice(0, 5)) {
      const text = await element.textContent();
      console.log(`Organization element: "${text}"`);
    }
    
    // Look for any clickable elements with "deploy", "create", or "new"
    const actionElements = await page.locator('button:has-text(/deploy|create|new/i)').all();
    console.log(`Found ${actionElements.length} action buttons`);
    
    for (const element of actionElements) {
      const text = await element.textContent();
      const visible = await element.isVisible();
      console.log(`Action button: "${text}" (visible: ${visible})`);
    }
  });
});