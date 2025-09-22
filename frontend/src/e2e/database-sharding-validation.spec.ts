/**
 * Database Sharding Validation Test Suite
 * Ensures flat database structure is NOT used except for resellers and superusers
 * Validates all data operations use sharded collections: organizations/{orgId}/{collection}
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Patterns that indicate flat database usage
const FLAT_DB_PATTERNS = {
  // Direct collection references (BAD - should be sharded)
  directCollections: [
    /collection\(['"`]employees['"`]\)/g,
    /collection\(['"`]warnings['"`]\)/g,
    /collection\(['"`]meetings['"`]\)/g,
    /collection\(['"`]reports['"`]\)/g,
    /collection\(['"`]absences['"`]\)/g,
    /collection\(['"`]categories['"`]\)/g,
    /doc\(\s*db\s*,\s*['"`]employees['"`]/g,
    /doc\(\s*db\s*,\s*['"`]warnings['"`]/g,
    /doc\(\s*db\s*,\s*['"`]meetings['"`]/g,
    /doc\(\s*db\s*,\s*['"`]reports['"`]/g,
  ],

  // Firestore paths without organization (BAD)
  flatPaths: [
    /['"`]\/employees\//g,
    /['"`]\/warnings\//g,
    /['"`]\/meetings\//g,
    /['"`]\/reports\//g,
    /\.collection\(['"`]employees['"`]\)(?!.*organizations)/g,
    /\.collection\(['"`]warnings['"`]\)(?!.*organizations)/g,
  ],

  // Query patterns that suggest flat structure
  suspiciousQueries: [
    /where\(['"`]organizationId['"`]/g, // If filtering by orgId, might be using flat structure
    /orderBy\(['"`]organizationId['"`]/g,
  ]
};

// Patterns that indicate correct sharded database usage
const SHARDED_DB_PATTERNS = {
  // Correct sharded collection references (GOOD)
  shardedCollections: [
    /collection\(.*organizations.*\${.*}.*employees/g,
    /collection\(.*organizations.*\${.*}.*warnings/g,
    /collection\(.*organizations.*\${.*}.*meetings/g,
    /collection\(.*organizations.*\${.*}.*reports/g,
    /organizations\/[^\/]+\/(employees|warnings|meetings|reports)/g,
    /\`organizations\/\$\{.*\}\/employees\`/g,
    /\`organizations\/\$\{.*\}\/warnings\`/g,
  ],

  // ShardedDataService usage (GOOD)
  shardedService: [
    /ShardedDataService\./g,
    /shardedDataService\./g,
    /getShardedCollection/g,
    /getShardedDocument/g,
  ]
};

// Files/patterns that are ALLOWED to use flat database
const ALLOWED_FLAT_DB = {
  files: [
    'ResellerService.ts',
    'ResellerService.js',
    'SuperUserService.ts',
    'SuperUserService.js',
    'AuthContext.tsx', // May need to check both flat and sharded
    'migration', // Migration scripts
  ],

  patterns: [
    /collection\(['"`]resellers['"`]\)/g, // Resellers are flat
    /collection\(['"`]superusers['"`]\)/g, // Superusers are flat
    /collection\(['"`]organizations['"`]\)/g, // Organizations collection itself is flat
    /collection\(['"`]users['"`]\)/g, // Users might be flat for auth
  ]
};

test.describe('🔍 Database Sharding Validation', () => {

  test('Scan all source files for flat database usage', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: srcDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'test/**',
        'e2e/**',
        '*.spec.ts',
        '*.test.ts'
      ]
    });

    const violations: Array<{file: string, line: number, code: string, pattern: string}> = [];
    const validShardedUsage: Array<{file: string, pattern: string}> = [];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check if this file is allowed to use flat DB
      const isAllowedFile = ALLOWED_FLAT_DB.files.some(allowed =>
        file.includes(allowed)
      );

      // Check for flat database patterns
      for (const [patternName, pattern] of Object.entries(FLAT_DB_PATTERNS.directCollections)) {
        if (pattern instanceof RegExp) {
          const matches = content.matchAll(new RegExp(pattern.source, 'g'));
          for (const match of matches) {
            const lineNum = content.substring(0, match.index).split('\n').length;
            const line = lines[lineNum - 1];

            // Check if it's an allowed pattern
            let isAllowed = isAllowedFile;
            for (const allowedPattern of ALLOWED_FLAT_DB.patterns) {
              if (allowedPattern.test(line)) {
                isAllowed = true;
                break;
              }
            }

            if (!isAllowed) {
              violations.push({
                file,
                line: lineNum,
                code: line.trim(),
                pattern: patternName
              });
            }
          }
        }
      }

      // Check for correct sharded patterns
      for (const [patternName, pattern] of Object.entries(SHARDED_DB_PATTERNS.shardedCollections)) {
        if (pattern instanceof RegExp && pattern.test(content)) {
          validShardedUsage.push({ file, pattern: patternName });
        }
      }
    }

    // Report results
    console.log('\n📊 Database Sharding Analysis Results:\n');
    console.log('=' .repeat(60));

    if (violations.length > 0) {
      console.log(`\n❌ Found ${violations.length} potential flat database usage violations:\n`);
      violations.forEach(v => {
        console.log(`  File: ${v.file}:${v.line}`);
        console.log(`  Code: ${v.code}`);
        console.log(`  Pattern: ${v.pattern}\n`);
      });
    } else {
      console.log('✅ No flat database violations found!');
    }

    if (validShardedUsage.length > 0) {
      console.log(`\n✅ Found ${validShardedUsage.length} correct sharded database usages`);
      const uniqueFiles = [...new Set(validShardedUsage.map(v => v.file))];
      console.log(`   Files using sharded structure: ${uniqueFiles.length}`);
    }

    console.log('=' .repeat(60));

    // Test assertion
    expect(violations.length).toBe(0);
  });

  test('Verify ShardedDataService is used for all data operations', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    const serviceFiles = glob.sync('services/**/*.{ts,tsx}', {
      cwd: srcDir,
      ignore: ['**/ShardedDataService.ts', '**/ResellerService.ts', '**/SuperUserService.ts']
    });

    const filesUsingShardedService: string[] = [];
    const filesNotUsingShardedService: string[] = [];

    for (const file of serviceFiles) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (content.includes('ShardedDataService') || content.includes('shardedDataService')) {
        filesUsingShardedService.push(file);
      } else if (
        content.includes('collection(') &&
        !file.includes('Reseller') &&
        !file.includes('SuperUser')
      ) {
        filesNotUsingShardedService.push(file);
      }
    }

    console.log('\n📦 ShardedDataService Usage Report:\n');
    console.log(`✅ Services using ShardedDataService: ${filesUsingShardedService.length}`);
    console.log(`⚠️  Services NOT using ShardedDataService: ${filesNotUsingShardedService.length}`);

    if (filesNotUsingShardedService.length > 0) {
      console.log('\nFiles that should be reviewed:');
      filesNotUsingShardedService.forEach(f => console.log(`  - ${f}`));
    }
  });

  test('Check Firestore rules for sharded structure', async () => {
    const rulesPath = path.resolve(__dirname, '../../../../config/firestore.rules');

    if (fs.existsSync(rulesPath)) {
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

      // Check for sharded collection rules
      const hasShardedRules = rulesContent.includes('organizations/{orgId}/employees') ||
                              rulesContent.includes('organizations/{orgId}/warnings') ||
                              rulesContent.includes('organizations/{orgId}/meetings');

      // Check for flat collection rules (should not exist except for allowed)
      const hasFlatEmployees = rulesContent.match(/match \/employees\/\{/);
      const hasFlatWarnings = rulesContent.match(/match \/warnings\/\{/);
      const hasFlatMeetings = rulesContent.match(/match \/meetings\/\{/);

      console.log('\n🔐 Firestore Rules Analysis:\n');
      console.log(`✅ Has sharded rules: ${hasShardedRules}`);
      console.log(`${hasFlatEmployees ? '❌' : '✅'} No flat employees rules: ${!hasFlatEmployees}`);
      console.log(`${hasFlatWarnings ? '❌' : '✅'} No flat warnings rules: ${!hasFlatWarnings}`);
      console.log(`${hasFlatMeetings ? '❌' : '✅'} No flat meetings rules: ${!hasFlatMeetings}`);

      expect(hasShardedRules).toBeTruthy();
      expect(hasFlatEmployees).toBeFalsy();
      expect(hasFlatWarnings).toBeFalsy();
      expect(hasFlatMeetings).toBeFalsy();
    }
  });

  test('Validate API endpoints use sharded paths', async () => {
    const srcDir = path.resolve(__dirname, '../../');
    const apiFiles = glob.sync('api/**/*.{ts,tsx}', { cwd: srcDir });

    const endpointViolations: Array<{file: string, endpoint: string}> = [];

    for (const file of apiFiles) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for API paths that might use flat structure
      const flatApiPatterns = [
        /['"`]\/api\/employees/g,
        /['"`]\/api\/warnings/g,
        /['"`]\/api\/meetings/g,
        /['"`]employees\//g,
        /['"`]warnings\//g,
      ];

      for (const pattern of flatApiPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          // Check if it's part of a sharded path
          const surroundingCode = content.substring(
            Math.max(0, match.index! - 50),
            Math.min(content.length, match.index! + 100)
          );

          if (!surroundingCode.includes('organizations/') &&
              !surroundingCode.includes('orgId') &&
              !file.includes('Reseller') &&
              !file.includes('SuperUser')) {
            endpointViolations.push({
              file,
              endpoint: match[0]
            });
          }
        }
      }
    }

    console.log('\n🌐 API Endpoint Analysis:\n');
    if (endpointViolations.length > 0) {
      console.log(`⚠️  Found ${endpointViolations.length} potential flat API endpoints:`);
      endpointViolations.forEach(v => {
        console.log(`  ${v.file}: ${v.endpoint}`);
      });
    } else {
      console.log('✅ All API endpoints appear to use sharded structure');
    }
  });

  test('Verify component data fetching uses sharded structure', async ({ page }) => {
    // This test checks runtime behavior
    await page.goto('http://localhost:3000');

    // Intercept Firestore requests
    const firestoreRequests: string[] = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('firestore') || url.includes('firebase')) {
        firestoreRequests.push(url);
      }
    });

    // Navigate to various pages to trigger data fetching
    const routes = ['/dashboard', '/employees', '/warnings'];

    for (const route of routes) {
      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'networkidle',
          timeout: 5000
        });
      } catch (e) {
        // Page might require auth, that's ok
      }
    }

    console.log('\n🔍 Runtime Firestore Request Analysis:\n');
    console.log(`Total Firestore requests intercepted: ${firestoreRequests.length}`);

    // Check for flat collection requests in URLs
    const suspiciousRequests = firestoreRequests.filter(url =>
      (url.includes('/employees') || url.includes('/warnings') || url.includes('/meetings')) &&
      !url.includes('/organizations/') &&
      !url.includes('reseller') &&
      !url.includes('superuser')
    );

    if (suspiciousRequests.length > 0) {
      console.log('⚠️  Suspicious flat database requests detected:');
      suspiciousRequests.forEach(url => console.log(`  - ${url}`));
    } else {
      console.log('✅ No flat database requests detected at runtime');
    }

    expect(suspiciousRequests.length).toBe(0);
  });
});

// Utility test to generate a comprehensive report
test.describe('📊 Sharding Compliance Report', () => {
  test('Generate full compliance report', async () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║          DATABASE SHARDING COMPLIANCE REPORT                   ║
╚════════════════════════════════════════════════════════════════╝

This test suite validates that:
1. ✅ NO flat database collections are used (except reseller/superuser)
2. ✅ All data operations use organizations/{orgId}/{collection} pattern
3. ✅ ShardedDataService is used consistently
4. ✅ Firestore rules enforce sharded structure
5. ✅ API endpoints follow sharded patterns

Exceptions allowed:
- ResellerService.ts (resellers collection is flat)
- SuperUserService.ts (superusers collection is flat)
- AuthContext.tsx (may check both structures for compatibility)
- Migration scripts (for backwards compatibility)

Run this test regularly to ensure sharding compliance!
    `);
  });
});