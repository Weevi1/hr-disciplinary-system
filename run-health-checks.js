#!/usr/bin/env node

/**
 * Automated Health Check Runner for HR Disciplinary System
 * This runs various tests against the development server
 */

const fetch = require('node-fetch');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class HealthCheck {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const prefix = {
      'info': `${colors.cyan}ℹ${colors.reset}`,
      'success': `${colors.green}✓${colors.reset}`,
      'error': `${colors.red}✗${colors.reset}`,
      'warning': `${colors.yellow}⚠${colors.reset}`,
    }[type] || '';

    console.log(`${prefix} ${message}`);
  }

  async test(name, testFn) {
    try {
      const result = await testFn();
      if (result.status === 'passed') {
        this.results.passed++;
        this.log(`${name}: ${result.message}`, 'success');
      } else if (result.status === 'warning') {
        this.results.warnings++;
        this.log(`${name}: ${result.message}`, 'warning');
      } else {
        this.results.failed++;
        this.log(`${name}: ${result.message}`, 'error');
      }

      this.results.tests.push({ name, ...result });
    } catch (error) {
      this.results.failed++;
      this.log(`${name}: ${error.message}`, 'error');
      this.results.tests.push({ name, status: 'failed', message: error.message });
    }
  }

  async runAll() {
    console.log(`\n${colors.blue}╔════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║     HR DISCIPLINARY SYSTEM - HEALTH CHECK         ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Test 1: Server connectivity
    await this.test('Server Connectivity', async () => {
      const response = await fetch(BASE_URL);
      if (response.ok) {
        return { status: 'passed', message: 'Dev server is running on port 3000' };
      }
      return { status: 'failed', message: `Server returned ${response.status}` };
    });

    // Test 2: Check critical routes
    const routes = ['/', '/login', '/dashboard', '/employees', '/warnings'];
    for (const route of routes) {
      await this.test(`Route ${route}`, async () => {
        const response = await fetch(`${BASE_URL}${route}`);
        if (response.status < 400) {
          return { status: 'passed', message: 'Route accessible' };
        } else if (response.status < 500) {
          return { status: 'warning', message: `Client error (${response.status})` };
        }
        return { status: 'failed', message: `Server error (${response.status})` };
      });
    }

    // Test 3: Check HTML content
    await this.test('HTML Structure', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();

      if (html.includes('<div id="root">')) {
        return { status: 'passed', message: 'React root element found' };
      }
      return { status: 'failed', message: 'React root element missing' };
    });

    // Test 4: Check for Vite HMR
    await this.test('Vite HMR', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();

      if (html.includes('/@vite/client')) {
        return { status: 'passed', message: 'Vite HMR enabled' };
      }
      return { status: 'warning', message: 'Vite HMR not detected' };
    });

    // Test 5: Performance check
    await this.test('Response Time', async () => {
      const start = Date.now();
      await fetch(BASE_URL);
      const time = Date.now() - start;

      if (time < 500) {
        return { status: 'passed', message: `Fast response (${time}ms)` };
      } else if (time < 1000) {
        return { status: 'warning', message: `Moderate response (${time}ms)` };
      }
      return { status: 'failed', message: `Slow response (${time}ms)` };
    });

    // Test 6: Check package.json scripts
    await this.test('Build Scripts', async () => {
      try {
        const { stdout } = await execAsync('npm run | grep dev');
        if (stdout.includes('dev')) {
          return { status: 'passed', message: 'Development scripts available' };
        }
      } catch (error) {
        return { status: 'warning', message: 'Could not verify scripts' };
      }
    });

    // Display summary
    this.displaySummary();
  }

  displaySummary() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const score = Math.round((this.results.passed / total) * 100);

    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✓ Passed:${colors.reset} ${this.results.passed}`);
    console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${this.results.warnings}`);
    console.log(`${colors.red}✗ Failed:${colors.reset} ${this.results.failed}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}🎯 Health Score: ${score}%${colors.reset}\n`);

    if (score === 100) {
      console.log(`${colors.green}🎉 Perfect! All systems operational!${colors.reset}`);
    } else if (score >= 80) {
      console.log(`${colors.green}👍 Good health! Minor issues only.${colors.reset}`);
    } else if (score >= 60) {
      console.log(`${colors.yellow}⚠️  Moderate health. Review warnings.${colors.reset}`);
    } else {
      console.log(`${colors.red}🚨 Critical issues detected!${colors.reset}`);
    }

    // Recommendations
    if (this.results.failed > 0 || this.results.warnings > 0) {
      console.log(`\n${colors.cyan}📝 RECOMMENDATIONS:${colors.reset}`);
      if (this.results.tests.find(t => t.name.includes('Server') && t.status === 'failed')) {
        console.log('  • Ensure dev server is running: npm run dev');
      }
      if (this.results.tests.find(t => t.name.includes('Route') && t.status !== 'passed')) {
        console.log('  • Check routing configuration and authentication');
      }
      if (this.results.tests.find(t => t.name.includes('Response') && t.status !== 'passed')) {
        console.log('  • Consider optimizing bundle size or server performance');
      }
    }

    console.log('\n');
  }
}

// Run if executed directly
if (require.main === module) {
  const checker = new HealthCheck();
  checker.runAll().catch(console.error);
}

module.exports = HealthCheck;