#!/usr/bin/env node

/**
 * Console Cleanup Script
 *
 * Replaces console.* calls with Logger.* calls in production code
 * Excludes: test files, scripts, legacy code
 */

const fs = require('fs');
const path = require('path');

// Files to clean (production code only)
const targetFiles = [
  'src/auth/AuthContext.tsx',
  'src/components/reseller/ResellerDashboard.tsx',
  'src/components/admin/SuperAdminDashboard.tsx',
  'src/components/warnings/enhanced/PDFPreviewModal.tsx',
  'src/config/performance.ts',
  'src/services/versionedApi.ts',
  'src/config/apiVersion.ts',
  'src/components/warnings/ReviewDashboard.tsx',
  'src/components/employees/EmployeeManagement.tsx',
  'src/components/warnings/modals/SimplePDFDownloadModal.tsx',
  'src/config/sentry.ts',
  'src/layouts/MainLayout.tsx',
  'src/components/dashboard/HRDashboardSection.tsx',
  'src/types/employee.ts',
  'src/components/dashboard/HODDashboardSection.tsx',
  'src/components/warnings/ManualWarningEntry.tsx',
  'src/components/employees/EmployeePromotionModal.tsx',
  'src/services/EmployeeService.ts',
  'src/components/warnings/enhanced/components/MicrophonePermissionHandler.tsx',
  'src/hooks/warnings/useAudioRecording.ts',
  'src/components/absences/UnifiedReportAbsence.tsx',
  'src/components/meetings/UnifiedBookHRMeeting.tsx',
  'src/components/warnings/enhanced/steps/components/IncidentDetailsForm.tsx',
  'src/components/employees/MobileEmployeeManagement.tsx',
  'src/utils/progressiveEnhancement.ts',
  'src/utils/errorHandling.ts',
  'src/services/PDFGenerationService.ts',
  'src/utils/deviceDetection.ts',
  'src/config/features.ts',
  'src/components/hr/PrintDeliveryGuide.tsx',
  'src/components/hr/EmailDeliveryGuide.tsx',
  'src/components/hr/WhatsAppDeliveryGuide.tsx',
  'src/components/warnings/modals/AppealReviewModal.tsx',
  'src/services/DataService.ts',
  'src/components/common/BrandedLogo.tsx',
  'src/components/warnings/AudioPlaybackWidget.tsx',
  'src/components/warnings/modals/WarningDetailsModal.tsx',
  'src/components/common/Logo.tsx',
  'src/components/employees/EmployeeArchiveModal.tsx',
  'src/hooks/counselling/useCounsellingFollowUps.ts',
  'src/services/AudioCleanupService.ts',
  'src/services/PDFStorageService.ts',
  'src/services/TemporaryLinkService.ts',
];

const projectRoot = path.join(__dirname, '..');

let totalReplacements = 0;
let filesModified = 0;

console.log('🧹 Console Cleanup Script - Starting...\n');

targetFiles.forEach(relativeFilePath => {
  const filePath = path.join(projectRoot, relativeFilePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativeFilePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileReplacements = 0;

  // Check if Logger is already imported
  const hasLoggerImport = /import.*Logger.*from.*['"](\.\.\/)*utils\/logger['"]/.test(content);

  // Replace console.debug -> Logger.debug
  content = content.replace(/console\.debug\(/g, () => {
    fileReplacements++;
    return 'Logger.debug(';
  });

  // Replace console.log -> Logger.debug (most console.logs are debug info)
  content = content.replace(/console\.log\(/g, () => {
    fileReplacements++;
    return 'Logger.debug(';
  });

  // Replace console.info -> Logger.info
  content = content.replace(/console\.info\(/g, () => {
    fileReplacements++;
    return 'Logger.info(';
  });

  // Replace console.warn -> Logger.warn
  content = content.replace(/console\.warn\(/g, () => {
    fileReplacements++;
    return 'Logger.warn(';
  });

  // Replace console.error -> Logger.error
  content = content.replace(/console\.error\(/g, () => {
    fileReplacements++;
    return 'Logger.error(';
  });

  // Add Logger import if needed and replacements were made
  if (fileReplacements > 0 && !hasLoggerImport) {
    // Find the best place to add the import (after other imports)
    const importRegex = /^import .+ from .+;$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      // Add after last import
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.indexOf(lastImport) + lastImport.length;

      // Calculate relative path to logger.ts
      const depth = relativeFilePath.split('/').length - 2; // -2 for src/ and filename
      const relativePath = '../'.repeat(depth) + 'utils/logger';

      content =
        content.slice(0, lastImportIndex) +
        `\nimport Logger from '${relativePath}';` +
        content.slice(lastImportIndex);

      console.log(`✅ ${relativeFilePath}: ${fileReplacements} replacements + Logger import added`);
    } else {
      // No imports found, add at top
      const depth = relativeFilePath.split('/').length - 2;
      const relativePath = '../'.repeat(depth) + 'utils/logger';

      content = `import Logger from '${relativePath}';\n\n${content}`;
      console.log(`✅ ${relativeFilePath}: ${fileReplacements} replacements + Logger import added (at top)`);
    }
  } else if (fileReplacements > 0) {
    console.log(`✅ ${relativeFilePath}: ${fileReplacements} replacements`);
  }

  // Write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalReplacements += fileReplacements;
    filesModified++;
  }
});

console.log(`\n✅ Cleanup complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`\n⚠️  Note: Logger.* calls are production-safe and auto-filtered`);
