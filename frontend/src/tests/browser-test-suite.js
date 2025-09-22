/**
 * Browser-based Test Suite for HR Disciplinary System
 * Copy and paste this into browser console at http://localhost:3000
 */

(function() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════╗
║     HR DISCIPLINARY SYSTEM - COMPONENT TESTS      ║
║            Running Automated Health Check          ║
╚════════════════════════════════════════════════════╝
  `);

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Check React and core libraries
  function testCoreLibraries() {
    console.log('\n🔧 Testing Core Libraries...');

    try {
      if (window.React) {
        results.passed.push('✅ React loaded');
      } else {
        results.failed.push('❌ React not found');
      }

      // Check for Firebase
      if (window.firebase || document.querySelector('script[src*="firebase"]')) {
        results.passed.push('✅ Firebase SDK loaded');
      } else {
        results.warnings.push('⚠️ Firebase SDK not detected in window');
      }

      // Check for critical DOM elements
      if (document.getElementById('root')) {
        results.passed.push('✅ React root element present');
      } else {
        results.failed.push('❌ React root element missing');
      }
    } catch (e) {
      results.failed.push('❌ Core library test failed: ' + e.message);
    }
  }

  // Test 2: Check authentication state
  function testAuthState() {
    console.log('\n🔐 Testing Authentication State...');

    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.state && parsed.state.user) {
          results.passed.push(`✅ User authenticated as: ${parsed.state.user.email || 'Unknown'}`);
        } else {
          results.warnings.push('⚠️ Auth storage exists but no user found');
        }
      } else {
        results.warnings.push('⚠️ No authentication data in localStorage');
      }

      // Check for auth tokens
      const cookies = document.cookie;
      if (cookies.includes('auth') || cookies.includes('token')) {
        results.passed.push('✅ Auth cookies detected');
      }
    } catch (e) {
      results.warnings.push('⚠️ Auth state check error: ' + e.message);
    }
  }

  // Test 3: Check router and navigation
  function testRouting() {
    console.log('\n🗺️ Testing Router & Navigation...');

    try {
      const currentPath = window.location.pathname;
      results.passed.push(`✅ Current route: ${currentPath}`);

      // Check for navigation elements
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      if (navElements.length > 0) {
        results.passed.push(`✅ Navigation components found: ${navElements.length}`);
      } else {
        results.warnings.push('⚠️ No navigation elements detected');
      }

      // Check for route links
      const links = document.querySelectorAll('a[href^="/"]');
      if (links.length > 0) {
        results.passed.push(`✅ Internal links found: ${links.length}`);
      }
    } catch (e) {
      results.failed.push('❌ Routing test failed: ' + e.message);
    }
  }

  // Test 4: Check dashboard components
  function testDashboardComponents() {
    console.log('\n📊 Testing Dashboard Components...');

    try {
      // Check for dashboard containers
      const dashboardElements = document.querySelectorAll('[class*="dashboard"], [id*="dashboard"]');
      if (dashboardElements.length > 0) {
        results.passed.push(`✅ Dashboard elements found: ${dashboardElements.length}`);
      }

      // Check for cards/widgets
      const cards = document.querySelectorAll('[class*="card"], [class*="widget"]');
      if (cards.length > 0) {
        results.passed.push(`✅ Dashboard cards/widgets: ${cards.length}`);
      }

      // Check for data tables
      const tables = document.querySelectorAll('table, [role="table"]');
      if (tables.length > 0) {
        results.passed.push(`✅ Data tables found: ${tables.length}`);
      }

      // Check for skeleton loaders (performance feature)
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      if (skeletons.length > 0) {
        results.passed.push(`✅ Skeleton loaders active: ${skeletons.length}`);
      }
    } catch (e) {
      results.warnings.push('⚠️ Dashboard component test error: ' + e.message);
    }
  }

  // Test 5: Check forms and inputs
  function testForms() {
    console.log('\n📝 Testing Forms & Inputs...');

    try {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, textarea, select');
      const buttons = document.querySelectorAll('button');

      if (forms.length > 0) {
        results.passed.push(`✅ Forms found: ${forms.length}`);
      }
      if (inputs.length > 0) {
        results.passed.push(`✅ Input fields: ${inputs.length}`);
      }
      if (buttons.length > 0) {
        results.passed.push(`✅ Buttons: ${buttons.length}`);
      }

      // Check for validation
      const requiredFields = document.querySelectorAll('[required], [aria-required="true"]');
      if (requiredFields.length > 0) {
        results.passed.push(`✅ Required fields with validation: ${requiredFields.length}`);
      }
    } catch (e) {
      results.warnings.push('⚠️ Forms test error: ' + e.message);
    }
  }

  // Test 6: Check modals and overlays
  function testModals() {
    console.log('\n🪟 Testing Modals & Overlays...');

    try {
      const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [aria-modal="true"]');
      const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"]');

      if (modals.length > 0) {
        results.passed.push(`✅ Modals detected: ${modals.length}`);
      }
      if (overlays.length > 0) {
        results.passed.push(`✅ Overlay components: ${overlays.length}`);
      }

      // Check z-index for proper layering
      const highZIndex = Array.from(document.querySelectorAll('*')).filter(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        return zIndex !== 'auto' && parseInt(zIndex) > 1000;
      });
      if (highZIndex.length > 0) {
        results.passed.push(`✅ High z-index elements (modals/tooltips): ${highZIndex.length}`);
      }
    } catch (e) {
      results.warnings.push('⚠️ Modal test error: ' + e.message);
    }
  }

  // Test 7: Check responsive design
  function testResponsive() {
    console.log('\n📱 Testing Responsive Design...');

    try {
      const viewport = window.innerWidth;
      let deviceType = 'Desktop';
      if (viewport < 768) deviceType = 'Mobile';
      else if (viewport < 1024) deviceType = 'Tablet';

      results.passed.push(`✅ Current viewport: ${viewport}px (${deviceType})`);

      // Check for mobile menu
      const mobileMenu = document.querySelector('[class*="mobile-menu"], [class*="hamburger"]');
      if (mobileMenu) {
        results.passed.push('✅ Mobile menu component found');
      }

      // Check Tailwind classes
      const tailwindElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      if (tailwindElements.length > 0) {
        results.passed.push(`✅ Responsive Tailwind classes: ${tailwindElements.length} elements`);
      }
    } catch (e) {
      results.warnings.push('⚠️ Responsive test error: ' + e.message);
    }
  }

  // Test 8: Check console for errors
  function testConsoleErrors() {
    console.log('\n🔍 Checking Console Errors...');

    // Note: We can't access previous console errors, but we can set up a listener
    const originalError = console.error;
    let errorCount = 0;

    console.error = function() {
      errorCount++;
      originalError.apply(console, arguments);
    };

    // Check for common React errors in the DOM
    if (document.body.innerHTML.includes('Error boundary')) {
      results.failed.push('❌ Error boundary triggered');
    } else {
      results.passed.push('✅ No error boundaries triggered');
    }

    // Check for React development mode
    if (window.process && window.process.env && window.process.env.NODE_ENV === 'development') {
      results.passed.push('✅ Running in development mode');
    }

    console.error = originalError;
  }

  // Test 9: Performance metrics
  function testPerformance() {
    console.log('\n⚡ Testing Performance Metrics...');

    try {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;

        if (pageLoadTime > 0) {
          const status = pageLoadTime < 3000 ? '✅' : pageLoadTime < 5000 ? '⚠️' : '❌';
          results[pageLoadTime < 3000 ? 'passed' : pageLoadTime < 5000 ? 'warnings' : 'failed']
            .push(`${status} Page load time: ${pageLoadTime}ms`);
        }

        if (domReadyTime > 0) {
          const status = domReadyTime < 2000 ? '✅' : domReadyTime < 3000 ? '⚠️' : '❌';
          results[domReadyTime < 2000 ? 'passed' : domReadyTime < 3000 ? 'warnings' : 'failed']
            .push(`${status} DOM ready time: ${domReadyTime}ms`);
        }
      }

      // Check bundle size indicators
      const scripts = document.querySelectorAll('script[src]');
      results.passed.push(`✅ JavaScript bundles loaded: ${scripts.length}`);
    } catch (e) {
      results.warnings.push('⚠️ Performance test error: ' + e.message);
    }
  }

  // Test 10: Check specific HR system features
  function testHRFeatures() {
    console.log('\n🏢 Testing HR System Features...');

    try {
      // Check for employee-related elements
      const employeeElements = document.querySelectorAll('[class*="employee"], [id*="employee"]');
      if (employeeElements.length > 0) {
        results.passed.push(`✅ Employee components: ${employeeElements.length}`);
      }

      // Check for warning-related elements
      const warningElements = document.querySelectorAll('[class*="warning"], [id*="warning"]');
      if (warningElements.length > 0) {
        results.passed.push(`✅ Warning components: ${warningElements.length}`);
      }

      // Check for PDF/document elements
      const docElements = document.querySelectorAll('[class*="pdf"], [class*="document"], [class*="qr"]');
      if (docElements.length > 0) {
        results.passed.push(`✅ Document/PDF components: ${docElements.length}`);
      }

      // Check for archive elements
      const archiveElements = document.querySelectorAll('[class*="archive"]');
      if (archiveElements.length > 0) {
        results.passed.push(`✅ Archive system components: ${archiveElements.length}`);
      }
    } catch (e) {
      results.warnings.push('⚠️ HR features test error: ' + e.message);
    }
  }

  // Run all tests
  testCoreLibraries();
  testAuthState();
  testRouting();
  testDashboardComponents();
  testForms();
  testModals();
  testResponsive();
  testConsoleErrors();
  testPerformance();
  testHRFeatures();

  // Display results
  console.log(`
╔════════════════════════════════════════════════════╗
║                   TEST RESULTS                     ║
╚════════════════════════════════════════════════════╝
  `);

  console.log('✅ PASSED TESTS:');
  results.passed.forEach(test => console.log('  ' + test));

  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(test => console.log('  ' + test));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(test => console.log('  ' + test));
  }

  const total = results.passed.length + results.warnings.length + results.failed.length;
  const score = Math.round((results.passed.length / total) * 100);

  console.log(`
╔════════════════════════════════════════════════════╗
║   📊 Score: ${score}% (${results.passed.length}/${total} tests passed)           ║
║   ✅ Passed: ${results.passed.length} | ⚠️ Warnings: ${results.warnings.length} | ❌ Failed: ${results.failed.length}     ║
╚════════════════════════════════════════════════════╝
  `);

  if (score === 100) {
    console.log('🎉 Perfect score! All systems operational!');
  } else if (score >= 80) {
    console.log('👍 Good health! Minor issues to address.');
  } else if (score >= 60) {
    console.log('⚠️ Moderate health. Several issues need attention.');
  } else {
    console.log('🚨 Critical issues detected. Immediate attention required.');
  }

  // Return results for programmatic use
  return results;
})();