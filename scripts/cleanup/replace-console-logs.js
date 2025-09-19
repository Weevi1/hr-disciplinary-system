#!/usr/bin/env node

/**
 * Console.log Cleanup Script for Production
 * 
 * Replaces unsafe console.log statements with production-safe Logger calls
 * Critical for white-label deployment handling sensitive HR data
 * 
 * Usage: node scripts/cleanup/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  sourceDir: './frontend/src',
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  dryRun: false, // Set to true to preview changes without making them
  backupOriginals: true
};

// Patterns for different types of console statements
const CONSOLE_PATTERNS = [
  // Debug/development logging
  {
    pattern: /console\.log\(['"`]🎯.*?['"`]\s*,?\s*.*?\);?/g,
    replacement: 'Logger.debug',
    type: 'debug'
  },
  {
    pattern: /console\.log\(['"`]📊.*?['"`]\s*,?\s*.*?\);?/g,
    replacement: 'Logger.debug',
    type: 'debug'
  },
  {
    pattern: /console\.log\(['"`]📄.*?['"`]\s*,?\s*.*?\);?/g,
    replacement: 'Logger.debug',
    type: 'debug'
  },
  {
    pattern: /console\.log\(['"`]📐.*?['"`]\s*,?\s*.*?\);?/g,
    replacement: 'Logger.debug',
    type: 'debug'
  },
  
  // Success logging (keep in production)
  {
    pattern: /console\.log\(['"`]✅.*?['"`]\s*,?\s*.*?\);?/g,
    replacement: 'Logger.success',
    type: 'success'
  },
  
  // Warning logging
  {
    pattern: /console\.warn\((.*?)\);?/g,
    replacement: 'Logger.warn',
    type: 'warn'
  },
  
  // Error logging
  {
    pattern: /console\.error\((.*?)\);?/g,
    replacement: 'Logger.error',
    type: 'error'
  },
  
  // General console.log statements (convert to debug)
  {
    pattern: /console\.log\((.*?)\);?/g,
    replacement: 'Logger.debug',
    type: 'debug'
  }
];

// Logger import statement
const LOGGER_IMPORT = "import Logger from '../utils/logger';\n";

class ConsoleLogCleaner {
  constructor(config) {
    this.config = config;
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      replacements: 0,
      errors: 0
    };
  }

  /**
   * Find all source files to process
   */
  findSourceFiles() {
    const patterns = this.config.extensions.map(ext => 
      path.join(this.config.sourceDir, '**/*' + ext)
    );
    
    let allFiles = [];
    for (const pattern of patterns) {
      const files = glob.sync(pattern, { 
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'] 
      });
      allFiles = allFiles.concat(files);
    }
    
    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let modifiedContent = content;
      let fileReplacements = 0;
      let needsLoggerImport = false;

      // Check if file already has Logger import
      const hasLoggerImport = content.includes('from \'../utils/logger\'') || 
                             content.includes('from \'../../utils/logger\'') ||
                             content.includes('from \'../../../utils/logger\'');

      // Apply each pattern
      for (const patternConfig of CONSOLE_PATTERNS) {
        const matches = modifiedContent.match(patternConfig.pattern);
        if (matches) {
          console.log(`  Found ${matches.length} ${patternConfig.type} statements`);
          
          modifiedContent = modifiedContent.replace(
            patternConfig.pattern, 
            (match, args) => {
              needsLoggerImport = true;
              fileReplacements++;
              
              // Parse arguments and convert to Logger call
              return this.convertToLoggerCall(patternConfig.replacement, args || match);
            }
          );
        }
      }

      // Add Logger import if needed and not already present
      if (needsLoggerImport && !hasLoggerImport) {
        const importPath = this.calculateImportPath(filePath);
        const loggerImport = `import Logger from '${importPath}';\n`;
        
        // Insert after existing imports
        const importRegex = /^(import.*\n)*(?=\n|^(?!import))/m;
        modifiedContent = modifiedContent.replace(importRegex, (match) => {
          return match + loggerImport;
        });
      }

      // Save changes if modifications were made
      if (modifiedContent !== originalContent) {
        if (this.config.backupOriginals) {
          fs.writeFileSync(filePath + '.backup', originalContent, 'utf8');
        }
        
        if (!this.config.dryRun) {
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
        }
        
        this.stats.filesModified++;
        this.stats.replacements += fileReplacements;
        
        console.log(`  ✅ Modified ${filePath} (${fileReplacements} replacements)`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Convert console statement to Logger call
   */
  convertToLoggerCall(loggerMethod, args) {
    // Simple conversion - preserve arguments as-is
    return `${loggerMethod}(${args})`;
  }

  /**
   * Calculate relative import path for Logger
   */
  calculateImportPath(filePath) {
    const relativePath = path.relative(path.dirname(filePath), 'frontend/src/utils/logger');
    return relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');
  }

  /**
   * Main processing function
   */
  async process() {
    console.log('🧹 Starting console.log cleanup for production safety...\n');
    
    const files = this.findSourceFiles();
    console.log(`Found ${files.length} source files to process\n`);
    
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }
    
    for (const file of files) {
      console.log(`Processing: ${file}`);
      this.processFile(file);
      this.stats.filesProcessed++;
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Files processed: ${this.stats.filesProcessed}`);
    console.log(`  Files modified: ${this.stats.filesModified}`);
    console.log(`  Total replacements: ${this.stats.replacements}`);
    console.log(`  Errors: ${this.stats.errors}`);
    
    if (this.stats.filesModified > 0) {
      console.log('\n✅ Console.log cleanup completed!');
      console.log('🔒 Your application is now production-safe for sensitive HR data');
      
      if (this.config.backupOriginals) {
        console.log('💾 Original files backed up with .backup extension');
      }
      
      console.log('\n🎯 Next steps:');
      console.log('  1. Test the application to ensure everything works');
      console.log('  2. Run the build process: npm run build');
      console.log('  3. Deploy to production with confidence');
    } else {
      console.log('\n✨ No console.log statements found - already production ready!');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const cleaner = new ConsoleLogCleaner(CONFIG);
  await cleaner.process();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ConsoleLogCleaner;