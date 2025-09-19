#!/usr/bin/env node

/**
 * Comprehensive backup and disaster recovery strategy for HR Disciplinary System
 * Handles Firestore, Storage, and configuration backups
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_CONFIG = {
  // Firestore backup settings
  firestore: {
    collections: [
      'users',
      'organizations', 
      'employees',
      'warnings',
      'hr_meeting_requests',
      'absence_reports',
      'corrective_counselling',
      'notifications',
      'sectors',
      'warningCategories',
      'escalationRules'
    ],
    excludeCollections: [
      'auditLogs', // Too large and can be regenerated
      'analytics', // Ephemeral data
      'systemLogs' // System-generated logs
    ]
  },
  
  // Storage backup settings
  storage: {
    includeFolders: [
      'warnings/', // Audio files and PDFs
      'temp-downloads/', // Temporary files (last 24h only)
      'documents/' // Important documents
    ],
    excludeFolders: [
      'cache/',
      'logs/'
    ],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    tempFileRetention: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Retention policy
  retention: {
    daily: 7,
    weekly: 4, 
    monthly: 12,
    yearly: 5
  }
};

class BackupManager {
  constructor(projectId, environment = 'production') {
    this.projectId = projectId;
    this.environment = environment;
    this.backupTimestamp = new Date().toISOString();
    this.backupPath = path.join(process.cwd(), 'backups', environment, this.backupTimestamp);
    
    // Initialize Firebase Admin
    this.app = initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
      storageBucket: `${projectId}.appspot.com`
    });
    
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app).bucket();
    
    // Ensure backup directory exists
    fs.mkdirSync(this.backupPath, { recursive: true });
  }

  async createFullBackup() {
    console.log(`🔄 Starting full backup for ${this.projectId} (${this.environment})...`);
    
    const backupManifest = {
      timestamp: this.backupTimestamp,
      environment: this.environment,
      projectId: this.projectId,
      type: 'full',
      components: {},
      status: 'in_progress'
    };

    try {
      // 1. Backup Firestore data
      console.log('📊 Backing up Firestore data...');
      const firestoreBackup = await this.backupFirestore();
      backupManifest.components.firestore = firestoreBackup;

      // 2. Backup Storage files
      console.log('💾 Backing up Storage files...');
      const storageBackup = await this.backupStorage();
      backupManifest.components.storage = storageBackup;

      // 3. Backup configuration
      console.log('⚙️ Backing up configuration...');
      const configBackup = await this.backupConfiguration();
      backupManifest.components.configuration = configBackup;

      // 4. Generate backup verification
      console.log('✅ Generating backup verification...');
      const verification = await this.generateVerification(backupManifest);
      backupManifest.verification = verification;
      backupManifest.status = 'completed';

      // Save backup manifest
      fs.writeFileSync(
        path.join(this.backupPath, 'backup-manifest.json'),
        JSON.stringify(backupManifest, null, 2)
      );

      console.log(`✅ Full backup completed successfully!`);
      console.log(`📍 Backup location: ${this.backupPath}`);
      
      return backupManifest;

    } catch (error) {
      console.error('❌ Backup failed:', error);
      backupManifest.status = 'failed';
      backupManifest.error = error.message;
      
      fs.writeFileSync(
        path.join(this.backupPath, 'backup-manifest.json'),
        JSON.stringify(backupManifest, null, 2)
      );
      
      throw error;
    }
  }

  async backupFirestore() {
    const firestorePath = path.join(this.backupPath, 'firestore');
    fs.mkdirSync(firestorePath, { recursive: true });

    const backup = {
      collections: {},
      totalDocuments: 0,
      totalSize: 0,
      timestamp: new Date().toISOString()
    };

    for (const collectionName of BACKUP_CONFIG.firestore.collections) {
      console.log(`  📄 Backing up collection: ${collectionName}`);
      
      try {
        const collectionRef = this.db.collection(collectionName);
        const snapshot = await collectionRef.get();
        
        const documents = [];
        snapshot.forEach(doc => {
          documents.push({
            id: doc.id,
            data: doc.data(),
            createTime: doc.createTime,
            updateTime: doc.updateTime
          });
        });

        const collectionBackup = {
          count: documents.length,
          size: JSON.stringify(documents).length,
          documents: documents
        };

        fs.writeFileSync(
          path.join(firestorePath, `${collectionName}.json`),
          JSON.stringify(collectionBackup, null, 2)
        );

        backup.collections[collectionName] = {
          count: collectionBackup.count,
          size: collectionBackup.size
        };

        backup.totalDocuments += collectionBackup.count;
        backup.totalSize += collectionBackup.size;

        console.log(`    ✅ ${collectionBackup.count} documents (${(collectionBackup.size / 1024).toFixed(2)} KB)`);

      } catch (error) {
        console.error(`    ❌ Failed to backup collection ${collectionName}:`, error.message);
        backup.collections[collectionName] = { error: error.message };
      }
    }

    return backup;
  }

  async backupStorage() {
    const storagePath = path.join(this.backupPath, 'storage');
    fs.mkdirSync(storagePath, { recursive: true });

    const backup = {
      folders: {},
      totalFiles: 0,
      totalSize: 0,
      timestamp: new Date().toISOString()
    };

    for (const folder of BACKUP_CONFIG.storage.includeFolders) {
      console.log(`  📁 Backing up storage folder: ${folder}`);
      
      try {
        const [files] = await this.storage.getFiles({ prefix: folder });
        
        const folderBackup = {
          files: [],
          count: 0,
          size: 0
        };

        for (const file of files) {
          const [metadata] = await file.getMetadata();
          const fileSize = parseInt(metadata.size);

          // Skip files that are too large
          if (fileSize > BACKUP_CONFIG.storage.maxFileSize) {
            console.log(`    ⚠️  Skipping large file: ${file.name} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
            continue;
          }

          // Skip old temp files
          if (folder === 'temp-downloads/' && this.isFileExpired(metadata.timeCreated)) {
            continue;
          }

          // Download and save file
          const localFilePath = path.join(storagePath, file.name);
          const localFileDir = path.dirname(localFilePath);
          
          if (!fs.existsSync(localFileDir)) {
            fs.mkdirSync(localFileDir, { recursive: true });
          }

          await file.download({ destination: localFilePath });

          folderBackup.files.push({
            name: file.name,
            size: fileSize,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated
          });

          folderBackup.count++;
          folderBackup.size += fileSize;
        }

        backup.folders[folder] = {
          count: folderBackup.count,
          size: folderBackup.size
        };

        backup.totalFiles += folderBackup.count;
        backup.totalSize += folderBackup.size;

        console.log(`    ✅ ${folderBackup.count} files (${(folderBackup.size / 1024 / 1024).toFixed(2)} MB)`);

      } catch (error) {
        console.error(`    ❌ Failed to backup storage folder ${folder}:`, error.message);
        backup.folders[folder] = { error: error.message };
      }
    }

    return backup;
  }

  async backupConfiguration() {
    const configPath = path.join(this.backupPath, 'configuration');
    fs.mkdirSync(configPath, { recursive: true });

    const backup = {
      files: {},
      timestamp: new Date().toISOString()
    };

    // Configuration files to backup
    const configFiles = [
      'firebase.json',
      'config/firestore.rules',
      'config/storage.rules', 
      'config/firestore.indexes.json',
      `config/environments/${this.environment}.json`
    ];

    for (const configFile of configFiles) {
      const sourcePath = path.join(process.cwd(), configFile);
      
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(configPath, path.basename(configFile));
        fs.copyFileSync(sourcePath, destPath);
        
        backup.files[configFile] = {
          size: fs.statSync(sourcePath).size,
          modified: fs.statSync(sourcePath).mtime
        };
        
        console.log(`    ✅ ${configFile}`);
      } else {
        console.log(`    ⚠️  ${configFile} not found`);
        backup.files[configFile] = { error: 'File not found' };
      }
    }

    return backup;
  }

  async generateVerification(manifest) {
    const verification = {
      timestamp: new Date().toISOString(),
      checksums: {},
      integrity: 'verified'
    };

    // Generate checksums for critical files
    const crypto = require('crypto');
    
    try {
      // Verify Firestore backup integrity
      const firestorePath = path.join(this.backupPath, 'firestore');
      if (fs.existsSync(firestorePath)) {
        const files = fs.readdirSync(firestorePath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(firestorePath, file);
            const content = fs.readFileSync(filePath);
            verification.checksums[`firestore/${file}`] = crypto
              .createHash('sha256')
              .update(content)
              .digest('hex');
          }
        }
      }

      // Verify configuration backup
      const configPath = path.join(this.backupPath, 'configuration');
      if (fs.existsSync(configPath)) {
        const files = fs.readdirSync(configPath);
        for (const file of files) {
          const filePath = path.join(configPath, file);
          const content = fs.readFileSync(filePath);
          verification.checksums[`configuration/${file}`] = crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
        }
      }

    } catch (error) {
      console.error('⚠️  Verification generation failed:', error.message);
      verification.integrity = 'failed';
      verification.error = error.message;
    }

    return verification;
  }

  isFileExpired(timeCreated) {
    const createdTime = new Date(timeCreated).getTime();
    const now = Date.now();
    return (now - createdTime) > BACKUP_CONFIG.storage.tempFileRetention;
  }

  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    const backupsDir = path.join(process.cwd(), 'backups', this.environment);
    
    if (!fs.existsSync(backupsDir)) {
      return;
    }

    const backupDirs = fs.readdirSync(backupsDir)
      .map(dir => ({
        name: dir,
        path: path.join(backupsDir, dir),
        timestamp: new Date(dir)
      }))
      .filter(backup => !isNaN(backup.timestamp.getTime()))
      .sort((a, b) => b.timestamp - a.timestamp);

    // Keep backups according to retention policy
    const toKeep = new Set();
    const now = new Date();

    // Daily backups (last 7 days)
    for (let i = 0; i < BACKUP_CONFIG.retention.daily && i < backupDirs.length; i++) {
      toKeep.add(backupDirs[i].name);
    }

    // Weekly backups (last 4 weeks)
    const weeklyBackups = backupDirs.filter(backup => {
      const daysDiff = Math.floor((now - backup.timestamp) / (1000 * 60 * 60 * 24));
      return daysDiff % 7 === 0;
    });
    for (let i = 0; i < BACKUP_CONFIG.retention.weekly && i < weeklyBackups.length; i++) {
      toKeep.add(weeklyBackups[i].name);
    }

    // Monthly backups (last 12 months)
    const monthlyBackups = backupDirs.filter(backup => {
      return backup.timestamp.getDate() === 1;
    });
    for (let i = 0; i < BACKUP_CONFIG.retention.monthly && i < monthlyBackups.length; i++) {
      toKeep.add(monthlyBackups[i].name);
    }

    // Delete old backups
    let deletedCount = 0;
    for (const backup of backupDirs) {
      if (!toKeep.has(backup.name)) {
        fs.rmSync(backup.path, { recursive: true, force: true });
        deletedCount++;
        console.log(`  🗑️  Deleted old backup: ${backup.name}`);
      }
    }

    console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups.`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  const environment = args[1] || 'production';
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    console.error('❌ Project ID not found. Set GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID environment variable.');
    process.exit(1);
  }

  const backupManager = new BackupManager(projectId, environment);

  try {
    switch (command) {
      case 'backup':
        const manifest = await backupManager.createFullBackup();
        console.log('\n📋 Backup Summary:');
        console.log(`   Environment: ${manifest.environment}`);
        console.log(`   Firestore: ${manifest.components.firestore.totalDocuments} documents`);
        console.log(`   Storage: ${manifest.components.storage.totalFiles} files`);
        console.log(`   Status: ${manifest.status}`);
        break;

      case 'cleanup':
        await backupManager.cleanupOldBackups();
        break;

      case 'verify':
        // TODO: Implement backup verification
        console.log('🔍 Backup verification not yet implemented');
        break;

      default:
        console.log('Usage: node backup-strategy.js [backup|cleanup|verify] [environment]');
        console.log('');
        console.log('Commands:');
        console.log('  backup   - Create full backup (default)');
        console.log('  cleanup  - Remove old backups according to retention policy');
        console.log('  verify   - Verify backup integrity');
        console.log('');
        console.log('Environments: development, staging, production (default: production)');
    }

  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BackupManager, BACKUP_CONFIG };