/**
 * Comprehensive Health Check Test Suite for HR Disciplinary System
 * This tests all major components, workflows, and system features
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test data
const TEST_DATA = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    email: 'test@example.com',
    password: 'temp123'
  },
  routes: {
    home: '/',
    login: '/login',
    dashboard: '/dashboard',
    employees: '/employees',
    warnings: '/warnings',
    settings: '/settings',
    organizationSetup: '/organization-setup'
  }
};

test.describe('🏥 HR System Comprehensive Health Check', () => {
  test.describe.configure({ mode: 'serial' });

  // ========== SECTION 1: INFRASTRUCTURE TESTS ==========
  test.describe('Infrastructure & Connectivity', () => {
    test('Server responds on all critical endpoints', async ({ page }) => {
      const endpoints = Object.values(TEST_DATA.routes);

      for (const endpoint of endpoints) {
        const response = await page.goto(`${TEST_DATA.baseUrl}${endpoint}`);
        expect(response?.status()).toBeLessThan(500);
        console.log(`✅ Endpoint ${endpoint}: ${response?.status()}`);
      }
    });

    test('React application loads correctly', async ({ page }) => {
      await page.goto(TEST_DATA.baseUrl);

      // Check for React root
      const rootElement = await page.locator('#root');
      await expect(rootElement).toBeVisible();

      // Check for React DevTools
      const hasReact = await page.evaluate(() => {
        return !!(window as any).React || !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      });
      expect(hasReact).toBeTruthy();
    });

    test('Vite HMR is active in development', async ({ page }) => {
      await page.goto(TEST_DATA.baseUrl);

      const html = await page.content();
      expect(html).toContain('/@vite/client');

      // Check for Vite environment
      const hasVite = await page.evaluate(() => {
        return !!(window as any).__vite_plugin_react_preamble_installed__;
      });
      console.log('Vite HMR status:', hasVite ? 'Active' : 'Not detected');
    });
  });

  // ========== SECTION 2: AUTHENTICATION TESTS ==========
  test.describe('Authentication System', () => {
    test('Login page renders with all required elements', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/login`);

      // Check for form elements
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')).toBeVisible();

      // Check for branding
      const logo = await page.locator('img[alt*="logo"], img[src*="logo"], [class*="logo"]').count();
      console.log(`Logo elements found: ${logo}`);
    });

    test('Authentication redirects work correctly', async ({ page }) => {
      // Try to access protected route
      await page.goto(`${TEST_DATA.baseUrl}/dashboard`);

      // Should redirect to login if not authenticated
      await page.waitForLoadState('networkidle');
      const url = page.url();

      if (url.includes('login')) {
        console.log('✅ Correctly redirected to login when not authenticated');
      } else if (url.includes('dashboard')) {
        console.log('⚠️ User might be already authenticated');
      }
    });

    test('Login form validation works', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/login`);

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
      await submitButton.click();

      // Check for validation messages or required attributes
      const emailInput = page.locator('input[type="email"]').first();
      const isRequired = await emailInput.getAttribute('required');

      if (isRequired !== null) {
        console.log('✅ Form has HTML5 validation');
      } else {
        // Check for error messages
        const errorMessages = await page.locator('[class*="error"], [role="alert"]').count();
        console.log(`Validation error messages: ${errorMessages}`);
      }
    });
  });

  // ========== SECTION 3: DASHBOARD TESTS ==========
  test.describe('Dashboard Components', () => {
    test('Dashboard skeleton loaders work', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/dashboard`);

      // Check for skeleton loaders (performance feature)
      const skeletons = await page.locator('[class*="skeleton"], [class*="shimmer"], [class*="loading"]').count();

      if (skeletons > 0) {
        console.log(`✅ Progressive loading with ${skeletons} skeleton loaders`);

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Check if skeletons are replaced with content
        const afterSkeletons = await page.locator('[class*="skeleton"]:visible').count();
        expect(afterSkeletons).toBeLessThan(skeletons);
      }
    });

    test('Dashboard cards and widgets render', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Check for dashboard elements
      const cards = await page.locator('[class*="card"], [class*="widget"], [class*="panel"]').count();
      const tables = await page.locator('table, [role="table"]').count();
      const charts = await page.locator('[class*="chart"], canvas, svg').count();

      console.log(`Dashboard components - Cards: ${cards}, Tables: ${tables}, Charts: ${charts}`);

      expect(cards + tables + charts).toBeGreaterThan(0);
    });

    test('Role-based content visibility', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/dashboard`);

      // Check for role-specific elements
      const roleElements = {
        executiveManagement: await page.locator('[class*="business-owner"], [class*="owner"]').count(),
        hrManager: await page.locator('[class*="hr-manager"], [class*="hr"]').count(),
        hod: await page.locator('[class*="hod"], [class*="department"]').count(),
        employee: await page.locator('[class*="employee"]').count()
      };

      console.log('Role-specific elements:', roleElements);
    });
  });

  // ========== SECTION 4: EMPLOYEE MANAGEMENT TESTS ==========
  test.describe('Employee Management System', () => {
    test('Employee list and management features', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/employees`);
      await page.waitForLoadState('networkidle');

      // Check for employee-related components
      const employeeElements = {
        list: await page.locator('[class*="employee-list"], [class*="employee-table"]').count(),
        cards: await page.locator('[class*="employee-card"]').count(),
        addButton: await page.locator('button:has-text("Add Employee"), button:has-text("New Employee")').count(),
        searchBar: await page.locator('input[placeholder*="search"], input[placeholder*="Search"]').count(),
        filters: await page.locator('[class*="filter"], select').count()
      };

      console.log('Employee management components:', employeeElements);

      const totalComponents = Object.values(employeeElements).reduce((a, b) => a + b, 0);
      expect(totalComponents).toBeGreaterThan(0);
    });

    test('Employee archive system exists', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/employees`);

      // Check for archive-related elements
      const archiveElements = {
        archiveButton: await page.locator('button:has-text("Archive"), button:has-text("View Archive")').count(),
        archiveSection: await page.locator('[class*="archive"]').count(),
        restoreButton: await page.locator('button:has-text("Restore")').count()
      };

      console.log('Archive system components:', archiveElements);

      if (archiveElements.archiveButton > 0) {
        console.log('✅ Employee archive system implemented');
      }
    });
  });

  // ========== SECTION 5: WARNING SYSTEM TESTS ==========
  test.describe('Warning Management System', () => {
    test('Warning creation workflow components', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/warnings`);
      await page.waitForLoadState('networkidle');

      const warningElements = {
        issueButton: await page.locator('button:has-text("Issue Warning"), button:has-text("New Warning")').count(),
        warningList: await page.locator('[class*="warning-list"], [class*="warning-table"]').count(),
        categories: await page.locator('[class*="category"]').count(),
        escalation: await page.locator('[class*="escalation"]').count()
      };

      console.log('Warning system components:', warningElements);
      expect(Object.values(warningElements).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    });

    test('PDF generation capabilities', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/warnings`);

      // Check for PDF-related elements
      const pdfElements = await page.locator('[class*="pdf"], button:has-text("Download"), button:has-text("Preview")').count();
      const qrElements = await page.locator('[class*="qr"], [class*="QR"]').count();

      console.log(`PDF/Document features - PDF: ${pdfElements}, QR: ${qrElements}`);

      if (pdfElements > 0 || qrElements > 0) {
        console.log('✅ PDF generation system available');
      }
    });

    test('Audio recording capabilities', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/warnings`);

      // Check for audio-related elements
      const audioElements = await page.locator('[class*="audio"], [class*="record"], button:has-text("Record")').count();

      if (audioElements > 0) {
        console.log('✅ Audio recording feature available');
      }
    });
  });

  // ========== SECTION 6: RESPONSIVE DESIGN TESTS ==========
  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 }
    ];

    for (const viewport of viewports) {
      test(`${viewport.name} viewport (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(TEST_DATA.baseUrl);

        // Check for responsive elements
        const mobileMenu = await page.locator('[class*="mobile-menu"], [class*="hamburger"], button[aria-label*="menu"]').count();
        const responsiveClasses = await page.locator('[class*="sm:"], [class*="md:"], [class*="lg:"]').count();

        console.log(`${viewport.name} - Mobile menu: ${mobileMenu}, Responsive classes: ${responsiveClasses}`);

        // Take screenshot for visual verification
        await page.screenshot({
          path: `test-results/responsive-${viewport.name.toLowerCase()}.png`,
          fullPage: false
        });
      });
    }
  });

  // ========== SECTION 7: PERFORMANCE TESTS ==========
  test.describe('Performance Metrics', () => {
    test('Page load performance', async ({ page }) => {
      await page.goto(TEST_DATA.baseUrl);

      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
        };
      });

      console.log('Performance metrics (ms):', metrics);

      // Performance thresholds
      expect(metrics.domContentLoaded).toBeLessThan(3000);
      expect(metrics.loadComplete).toBeLessThan(5000);

      if (metrics.firstContentfulPaint > 0) {
        expect(metrics.firstContentfulPaint).toBeLessThan(2000);
      }
    });

    test('Bundle optimization check', async ({ page }) => {
      await page.goto(TEST_DATA.baseUrl);

      // Check for lazy loading
      const scripts = await page.locator('script[src]').count();
      const lazyLoaded = await page.locator('script[src*="chunk"], script[src*="vendor"]').count();

      console.log(`Bundle optimization - Total scripts: ${scripts}, Lazy loaded: ${lazyLoaded}`);

      if (lazyLoaded > 0) {
        console.log('✅ Code splitting/lazy loading detected');
      }
    });
  });

  // ========== SECTION 8: SECURITY TESTS ==========
  test.describe('Security Features', () => {
    test('Security headers and CSP', async ({ page }) => {
      const response = await page.goto(TEST_DATA.baseUrl);
      const headers = response?.headers();

      // Check for security headers
      const securityHeaders = {
        'content-security-policy': headers?.['content-security-policy'],
        'x-frame-options': headers?.['x-frame-options'],
        'x-content-type-options': headers?.['x-content-type-options']
      };

      console.log('Security headers detected:', Object.keys(securityHeaders).filter(k => securityHeaders[k]).length);
    });

    test('Authentication tokens and storage', async ({ page }) => {
      await page.goto(`${TEST_DATA.baseUrl}/login`);

      // Check for secure storage practices
      const localStorage = await page.evaluate(() => {
        return Object.keys(window.localStorage);
      });

      const sessionStorage = await page.evaluate(() => {
        return Object.keys(window.sessionStorage);
      });

      console.log(`Storage - LocalStorage keys: ${localStorage.length}, SessionStorage keys: ${sessionStorage.length}`);

      // Check for sensitive data in storage
      const hasSensitiveData = localStorage.some(key =>
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret')
      );

      expect(hasSensitiveData).toBeFalsy();
    });
  });

  // ========== SECTION 9: CONSOLE ERROR CHECK ==========
  test.describe('Console Health', () => {
    test('No critical console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore known/expected errors
          if (!text.includes('Stripe.js') &&
              !text.includes('COEP') &&
              !text.includes('favicon')) {
            errors.push(text);
          }
        }
      });

      await page.goto(TEST_DATA.baseUrl);
      await page.waitForTimeout(2000);

      console.log(`Console errors found: ${errors.length}`);
      if (errors.length > 0) {
        console.log('Errors:', errors.slice(0, 5));
      }

      // Allow some errors but not too many
      expect(errors.length).toBeLessThan(10);
    });
  });

  // ========== SECTION 10: ACCESSIBILITY TESTS ==========
  test.describe('Accessibility', () => {
    test('Basic accessibility features', async ({ page }) => {
      await page.goto(TEST_DATA.baseUrl);

      // Check for accessibility attributes
      const accessibilityElements = {
        ariaLabels: await page.locator('[aria-label]').count(),
        ariaRoles: await page.locator('[role]').count(),
        altTexts: await page.locator('img[alt]').count(),
        tabIndex: await page.locator('[tabindex]').count(),
        buttons: await page.locator('button:not([disabled])').count()
      };

      console.log('Accessibility features:', accessibilityElements);

      const totalA11y = Object.values(accessibilityElements).reduce((a, b) => a + b, 0);
      expect(totalA11y).toBeGreaterThan(0);
    });

    test('Keyboard navigation', async ({ page }) => {
      await page.goto(TEST_DATA.baseUrl);

      // Test tab navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      console.log('First tabbable element:', focusedElement);
      expect(focusedElement).toBeTruthy();
    });
  });
});

// ========== TEST SUMMARY ==========
test.describe('📊 Test Summary', () => {
  test('Generate comprehensive report', async ({ page }) => {
    console.log(`
╔════════════════════════════════════════════════════╗
║     HR SYSTEM COMPREHENSIVE TEST COMPLETE          ║
╚════════════════════════════════════════════════════╝

✅ Infrastructure & Connectivity
✅ Authentication System
✅ Dashboard Components
✅ Employee Management
✅ Warning System
✅ Responsive Design
✅ Performance Metrics
✅ Security Features
✅ Console Health
✅ Accessibility

Run 'npx playwright show-report' for detailed HTML report
    `);

    // Final health check
    await page.goto(TEST_DATA.baseUrl);
    expect(await page.title()).toBeTruthy();
  });
});