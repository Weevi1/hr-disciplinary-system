#!/usr/bin/env node

/**
 * Production Readiness Assessment Tool
 * Automatically checks various aspects of the system to validate production readiness
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionReadinessChecker {
  constructor(config) {
    this.config = config;
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'pending',
      sections: {},
      score: 0,
      maxScore: 0
    };
  }

  async runFullAssessment() {
    console.log('🔍 Starting Production Readiness Assessment...\n');

    const sections = [
      { name: 'infrastructure', title: '🏗️ Infrastructure & Deployment', weight: 20 },
      { name: 'security', title: '🔒 Security', weight: 25 },
      { name: 'monitoring', title: '📊 Monitoring & Observability', weight: 20 },
      { name: 'performance', title: '🚀 Performance & Scalability', weight: 15 },
      { name: 'backup', title: '💾 Backup & Disaster Recovery', weight: 10 },
      { name: 'operations', title: '📋 Operational Procedures', weight: 10 }
    ];

    for (const section of sections) {
      console.log(`\n${section.title}`);
      console.log('='.repeat(50));
      
      const sectionResult = await this.assessSection(section.name);
      this.results.sections[section.name] = {
        ...sectionResult,
        title: section.title,
        weight: section.weight
      };
      
      this.results.score += (sectionResult.score / sectionResult.maxScore) * section.weight;
      this.results.maxScore += section.weight;
    }

    // Calculate final results
    this.results.overall = this.calculateOverallStatus();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION READINESS ASSESSMENT COMPLETE');
    console.log('='.repeat(60));
    
    this.displayResults();
    await this.generateReport();
    
    return this.results;
  }

  async assessSection(sectionName) {
    const methodName = `assess${sectionName.charAt(0).toUpperCase()}${sectionName.slice(1)}`;
    
    if (typeof this[methodName] === 'function') {
      return await this[methodName]();
    } else {
      console.log(`⚠️ Assessment method not implemented: ${methodName}`);
      return { score: 0, maxScore: 1, checks: [] };
    }
  }

  async assessInfrastructure() {
    const checks = [];
    let score = 0;

    // Check Firebase configuration
    try {
      const firebaseConfig = require(path.join(process.cwd(), 'firebase.json'));
      checks.push({
        name: 'Firebase configuration exists',
        status: 'pass',
        details: 'firebase.json found and valid'
      });
      score++;
    } catch (error) {
      checks.push({
        name: 'Firebase configuration exists',
        status: 'fail',
        details: 'firebase.json not found or invalid'
      });
    }

    // Check environment configurations
    const environments = ['production', 'staging', 'development'];
    for (const env of environments) {
      const envPath = path.join(process.cwd(), 'config', 'environments', `${env}.json`);
      if (fs.existsSync(envPath)) {
        checks.push({
          name: `${env} environment config`,
          status: 'pass',
          details: `Configuration file exists`
        });
        score++;
      } else {
        checks.push({
          name: `${env} environment config`,
          status: 'fail',
          details: `Configuration file missing`
        });
      }
    }

    // Check deployment workflows
    const deployWorkflow = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
    if (fs.existsSync(deployWorkflow)) {
      checks.push({
        name: 'Deployment workflow configured',
        status: 'pass',
        details: 'GitHub Actions deployment workflow exists'
      });
      score++;
    } else {
      checks.push({
        name: 'Deployment workflow configured',
        status: 'fail',
        details: 'GitHub Actions deployment workflow missing'
      });
    }

    // Check build process
    try {
      const packageJson = require(path.join(process.cwd(), 'frontend', 'package.json'));
      if (packageJson.scripts && packageJson.scripts.build) {
        checks.push({
          name: 'Build script configured',
          status: 'pass',
          details: 'Frontend build script available'
        });
        score++;
      }
    } catch (error) {
      checks.push({
        name: 'Build script configured',
        status: 'fail',
        details: 'Frontend package.json or build script not found'
      });
    }

    const maxScore = 6; // Total number of checks
    return { score, maxScore, checks };
  }

  async assessSecurity() {
    const checks = [];
    let score = 0;

    // Check Firestore security rules
    const firestoreRules = path.join(process.cwd(), 'config', 'firestore.rules');
    if (fs.existsSync(firestoreRules)) {
      const rulesContent = fs.readFileSync(firestoreRules, 'utf8');
      
      if (rulesContent.includes('isAuthenticated()') && rulesContent.includes('belongsToOrganization')) {
        checks.push({
          name: 'Firestore security rules',
          status: 'pass',
          details: 'Authentication and organization isolation implemented'
        });
        score++;
      } else {
        checks.push({
          name: 'Firestore security rules',
          status: 'warning',
          details: 'Security rules exist but may not be comprehensive'
        });
      }
    } else {
      checks.push({
        name: 'Firestore security rules',
        status: 'fail',
        details: 'Firestore security rules file not found'
      });
    }

    // Check Storage security rules
    const storageRules = path.join(process.cwd(), 'config', 'storage.rules');
    if (fs.existsSync(storageRules)) {
      checks.push({
        name: 'Storage security rules',
        status: 'pass',
        details: 'Storage security rules configured'
      });
      score++;
    } else {
      checks.push({
        name: 'Storage security rules',
        status: 'fail',
        details: 'Storage security rules file not found'
      });
    }

    // Check for environment variables handling
    const envExample = path.join(process.cwd(), 'frontend', '.env.example');
    if (fs.existsSync(envExample)) {
      checks.push({
        name: 'Environment variables template',
        status: 'pass',
        details: 'Environment variables template exists'
      });
      score++;
    } else {
      checks.push({
        name: 'Environment variables template',
        status: 'warning',
        details: 'No environment variables template found'
      });
    }

    // Check for security-related dependencies
    try {
      const packageJson = require(path.join(process.cwd(), 'frontend', 'package.json'));
      const hasSecurityDeps = packageJson.dependencies && 
        (packageJson.dependencies['@sentry/react'] || 
         packageJson.dependencies['react-error-boundary']);
      
      if (hasSecurityDeps) {
        checks.push({
          name: 'Error tracking dependencies',
          status: 'pass',
          details: 'Error tracking libraries installed'
        });
        score++;
      } else {
        checks.push({
          name: 'Error tracking dependencies',
          status: 'warning',
          details: 'No error tracking dependencies found'
        });
      }
    } catch (error) {
      checks.push({
        name: 'Error tracking dependencies',
        status: 'fail',
        details: 'Could not check frontend dependencies'
      });
    }

    const maxScore = 4;
    return { score, maxScore, checks };
  }

  async assessMonitoring() {
    const checks = [];
    let score = 0;

    // Check monitoring configuration
    const monitoringConfig = path.join(process.cwd(), 'config', 'monitoring', 'firebase-monitoring.json');
    if (fs.existsSync(monitoringConfig)) {
      checks.push({
        name: 'Monitoring configuration',
        status: 'pass',
        details: 'Firebase monitoring configuration exists'
      });
      score++;
    } else {
      checks.push({
        name: 'Monitoring configuration',
        status: 'fail',
        details: 'Monitoring configuration not found'
      });
    }

    // Check monitoring setup workflow
    const monitoringWorkflow = path.join(process.cwd(), '.github', 'workflows', 'monitoring-setup.yml');
    if (fs.existsSync(monitoringWorkflow)) {
      checks.push({
        name: 'Monitoring setup automation',
        status: 'pass',
        details: 'Automated monitoring setup workflow exists'
      });
      score++;
    } else {
      checks.push({
        name: 'Monitoring setup automation',
        status: 'fail',
        details: 'Monitoring setup workflow missing'
      });
    }

    // Check error tracking setup
    const sentrySetup = path.join(process.cwd(), 'scripts', 'monitoring', 'setup-sentry.js');
    if (fs.existsSync(sentrySetup)) {
      checks.push({
        name: 'Error tracking setup',
        status: 'pass',
        details: 'Sentry setup script available'
      });
      score++;
    } else {
      checks.push({
        name: 'Error tracking setup',
        status: 'warning',
        details: 'Error tracking setup script not found'
      });
    }

    const maxScore = 3;
    return { score, maxScore, checks };
  }

  async assessPerformance() {
    const checks = [];
    let score = 0;

    // Check Vite configuration for performance
    const viteConfig = path.join(process.cwd(), 'frontend', 'vite.config.ts');
    if (fs.existsSync(viteConfig)) {
      const configContent = fs.readFileSync(viteConfig, 'utf8');
      
      if (configContent.includes('manualChunks')) {
        checks.push({
          name: 'Bundle optimization configured',
          status: 'pass',
          details: 'Manual chunking configured in Vite'
        });
        score++;
      } else {
        checks.push({
          name: 'Bundle optimization configured',
          status: 'warning',
          details: 'No manual chunking configuration found'
        });
      }
    } else {
      checks.push({
        name: 'Bundle optimization configured',
        status: 'fail',
        details: 'Vite configuration not found'
      });
    }

    // Check for performance monitoring dependencies
    try {
      const packageJson = require(path.join(process.cwd(), 'frontend', 'package.json'));
      const hasPerformanceDeps = packageJson.dependencies && 
        packageJson.dependencies['firebase'];
      
      if (hasPerformanceDeps) {
        checks.push({
          name: 'Performance monitoring dependencies',
          status: 'pass',
          details: 'Firebase SDK available for performance monitoring'
        });
        score++;
      }
    } catch (error) {
      checks.push({
        name: 'Performance monitoring dependencies',
        status: 'fail',
        details: 'Could not verify performance monitoring setup'
      });
    }

    const maxScore = 2;
    return { score, maxScore, checks };
  }

  async assessBackup() {
    const checks = [];
    let score = 0;

    // Check backup strategy script
    const backupScript = path.join(process.cwd(), 'scripts', 'backup', 'backup-strategy.js');
    if (fs.existsSync(backupScript)) {
      checks.push({
        name: 'Backup strategy implemented',
        status: 'pass',
        details: 'Backup strategy script exists'
      });
      score++;
    } else {
      checks.push({
        name: 'Backup strategy implemented',
        status: 'fail',
        details: 'Backup strategy script not found'
      });
    }

    // Check backup workflow
    const backupWorkflow = path.join(process.cwd(), '.github', 'workflows', 'backup.yml');
    if (fs.existsSync(backupWorkflow)) {
      checks.push({
        name: 'Automated backup workflow',
        status: 'pass',
        details: 'GitHub Actions backup workflow configured'
      });
      score++;
    } else {
      checks.push({
        name: 'Automated backup workflow',
        status: 'fail',
        details: 'Backup workflow not found'
      });
    }

    // Check disaster recovery documentation
    const drDoc = path.join(process.cwd(), 'docs', 'DISASTER_RECOVERY.md');
    if (fs.existsSync(drDoc)) {
      checks.push({
        name: 'Disaster recovery documentation',
        status: 'pass',
        details: 'Disaster recovery procedures documented'
      });
      score++;
    } else {
      checks.push({
        name: 'Disaster recovery documentation',
        status: 'fail',
        details: 'Disaster recovery documentation missing'
      });
    }

    const maxScore = 3;
    return { score, maxScore, checks };
  }

  async assessOperations() {
    const checks = [];
    let score = 0;

    // Check maintenance workflows
    const maintenanceWorkflow = path.join(process.cwd(), '.github', 'workflows', 'maintenance.yml');
    if (fs.existsSync(maintenanceWorkflow)) {
      checks.push({
        name: 'Maintenance automation',
        status: 'pass',
        details: 'Automated maintenance workflow configured'
      });
      score++;
    } else {
      checks.push({
        name: 'Maintenance automation',
        status: 'fail',
        details: 'Maintenance workflow not found'
      });
    }

    // Check dependency update workflow
    const dependencyWorkflow = path.join(process.cwd(), '.github', 'workflows', 'dependency-updates.yml');
    if (fs.existsSync(dependencyWorkflow)) {
      checks.push({
        name: 'Dependency management',
        status: 'pass',
        details: 'Automated dependency updates configured'
      });
      score++;
    } else {
      checks.push({
        name: 'Dependency management',
        status: 'fail',
        details: 'Dependency update workflow not found'
      });
    }

    // Check documentation completeness
    const requiredDocs = [
      'README.md',
      'CLAUDE.md', 
      'docs/DISASTER_RECOVERY.md',
      'docs/SCALABILITY_PLAN.md'
    ];

    let docsFound = 0;
    for (const doc of requiredDocs) {
      if (fs.existsSync(path.join(process.cwd(), doc))) {
        docsFound++;
      }
    }

    if (docsFound === requiredDocs.length) {
      checks.push({
        name: 'Documentation completeness',
        status: 'pass',
        details: 'All required documentation exists'
      });
      score++;
    } else {
      checks.push({
        name: 'Documentation completeness',
        status: 'warning',
        details: `${docsFound}/${requiredDocs.length} required documents found`
      });
    }

    const maxScore = 3;
    return { score, maxScore, checks };
  }

  calculateOverallStatus() {
    const percentage = (this.results.score / this.results.maxScore) * 100;
    
    if (percentage >= 90) return 'ready';
    if (percentage >= 75) return 'mostly-ready';
    if (percentage >= 50) return 'needs-work';
    return 'not-ready';
  }

  displayResults() {
    const percentage = ((this.results.score / this.results.maxScore) * 100).toFixed(1);
    
    console.log(`\n📊 Overall Score: ${this.results.score}/${this.results.maxScore} (${percentage}%)`);
    console.log(`🎯 Status: ${this.getStatusEmoji(this.results.overall)} ${this.results.overall.toUpperCase()}`);
    
    console.log('\n📋 Section Breakdown:');
    for (const [sectionName, section] of Object.entries(this.results.sections)) {
      const sectionPercentage = ((section.score / section.maxScore) * 100).toFixed(1);
      const status = sectionPercentage >= 80 ? '✅' : sectionPercentage >= 60 ? '⚠️' : '❌';
      
      console.log(`${status} ${section.title}: ${section.score}/${section.maxScore} (${sectionPercentage}%)`);
    }

    console.log('\n🔍 Failed or Warning Checks:');
    for (const [sectionName, section] of Object.entries(this.results.sections)) {
      const failedChecks = section.checks.filter(check => check.status !== 'pass');
      if (failedChecks.length > 0) {
        console.log(`\n${section.title}:`);
        for (const check of failedChecks) {
          const icon = check.status === 'fail' ? '❌' : '⚠️';
          console.log(`  ${icon} ${check.name}: ${check.details}`);
        }
      }
    }

    console.log('\n💡 Recommendations:');
    this.generateRecommendations();
  }

  generateRecommendations() {
    const percentage = (this.results.score / this.results.maxScore) * 100;
    
    if (percentage >= 90) {
      console.log('✅ System appears production-ready! Consider final manual testing.');
    } else if (percentage >= 75) {
      console.log('⚠️ System is mostly ready. Address warning items before production.');
      console.log('📝 Complete failed checks and perform comprehensive testing.');
    } else if (percentage >= 50) {
      console.log('🔧 Significant work needed before production deployment.');
      console.log('🎯 Focus on security and monitoring improvements first.');
    } else {
      console.log('❌ System not ready for production. Major components missing.');
      console.log('🛠️ Implement core infrastructure and security measures first.');
    }

    // Specific recommendations based on failed sections
    for (const [sectionName, section] of Object.entries(this.results.sections)) {
      const sectionPercentage = (section.score / section.maxScore) * 100;
      if (sectionPercentage < 60) {
        console.log(`🎯 Priority: Improve ${sectionName} (${sectionPercentage.toFixed(1)}% complete)`);
      }
    }
  }

  getStatusEmoji(status) {
    const emojis = {
      'ready': '🟢',
      'mostly-ready': '🟡',
      'needs-work': '🟠',
      'not-ready': '🔴'
    };
    return emojis[status] || '⚪';
  }

  async generateReport() {
    const reportDir = path.join(process.cwd(), 'reports', 'production-readiness');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportDir, `readiness-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(reportDir, `readiness-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`\n📄 Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  generateHTMLReport() {
    const percentage = ((this.results.score / this.results.maxScore) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Production Readiness Assessment</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; color: #1976d2; }
        .score { font-size: 2em; font-weight: bold; margin: 20px 0; }
        .status { padding: 10px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .ready { background: #d4edda; color: #155724; }
        .mostly-ready { background: #fff3cd; color: #856404; }
        .needs-work { background: #f8d7da; color: #721c24; }
        .not-ready { background: #f8d7da; color: #721c24; }
        .section { margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .pass { color: #28a745; }
        .warning { color: #ffc107; }
        .fail { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Production Readiness Assessment</h1>
        <p>Generated: ${this.results.timestamp}</p>
        <div class="score">${this.results.score}/${this.results.maxScore} (${percentage}%)</div>
        <div class="status ${this.results.overall}">
            ${this.getStatusEmoji(this.results.overall)} ${this.results.overall.toUpperCase()}
        </div>
    </div>

    <h2>📋 Section Results</h2>
    ${Object.entries(this.results.sections).map(([name, section]) => {
      const sectionPercentage = ((section.score / section.maxScore) * 100).toFixed(1);
      return `
        <div class="section">
            <h3>${section.title}</h3>
            <p><strong>Score:</strong> ${section.score}/${section.maxScore} (${sectionPercentage}%)</p>
            <table>
                <tr><th>Check</th><th>Status</th><th>Details</th></tr>
                ${section.checks.map(check => `
                    <tr>
                        <td>${check.name}</td>
                        <td class="${check.status}">${check.status.toUpperCase()}</td>
                        <td>${check.details}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
      `;
    }).join('')}

    <h2>💡 Next Steps</h2>
    <p>Review the failed and warning checks above and address them before production deployment.</p>
    <p>Refer to the Production Readiness Checklist for detailed requirements.</p>
</body>
</html>
    `;
  }
}

// CLI interface
async function main() {
  const config = {
    projectId: process.argv[2] || process.env.FIREBASE_PROJECT_ID || 'hr-disciplinary-system',
    environment: process.argv[3] || 'production'
  };

  console.log(`🔍 Production Readiness Assessment for ${config.projectId} (${config.environment})`);
  
  const checker = new ProductionReadinessChecker(config);
  
  try {
    const results = await checker.runFullAssessment();
    
    // Exit with appropriate code
    if (results.overall === 'ready') {
      process.exit(0);
    } else if (results.overall === 'mostly-ready') {
      process.exit(1); // Warning - review needed
    } else {
      process.exit(2); // Not ready
    }
    
  } catch (error) {
    console.error('❌ Assessment failed:', error.message);
    process.exit(3);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProductionReadinessChecker };