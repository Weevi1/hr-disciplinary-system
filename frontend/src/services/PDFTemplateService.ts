// frontend/src/services/PDFTemplateService.ts
// 📄 PDF TEMPLATE SERVICE - Save, load, and manage PDF template settings
// ✅ Per-organization PDF customization persistence
// ✅ Migration utilities for existing organizations
// ✅ Default settings initialization for new organizations

import { doc, getDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PDFTemplateSettings, PDFSectionConfig } from '../types/core';
import { PDF_GENERATOR_VERSION } from './PDFGenerationService';
import Logger from '../utils/logger';

export class PDFTemplateService {
  /**
   * Increment semantic version based on change type
   * MAJOR.MINOR.PATCH
   * - PATCH: Styling changes only (colors, fonts, spacing)
   * - MINOR: Content changes (section text, bullet points)
   * - MAJOR: Breaking changes (not used for template changes)
   */
  private static incrementVersion(currentVersion: string, changeType: 'patch' | 'minor' | 'major' = 'minor'): string {
    const parts = currentVersion.split('.').map(Number);
    let [major, minor, patch] = parts;

    if (parts.length !== 3 || parts.some(isNaN)) {
      Logger.warn(`⚠️ Invalid version format: ${currentVersion}, defaulting to 1.0.0`);
      return '1.0.1';
    }

    switch (changeType) {
      case 'patch':
        patch += 1;
        break;
      case 'minor':
        minor += 1;
        patch = 0;
        break;
      case 'major':
        major += 1;
        minor = 0;
        patch = 0;
        break;
    }

    return `${major}.${minor}.${patch}`;
  }

  /**
   * Save PDF template settings for an organization
   *
   * @param organizationId - Organization ID
   * @param settings - PDF template settings to save
   * @param updatedBy - UID of user making the change (typically SuperAdmin)
   * @returns Success status
   */
  static async saveTemplate(
    organizationId: string,
    settings: PDFTemplateSettings,
    updatedBy: string
  ): Promise<void> {
    try {
      Logger.debug('💾 Saving PDF template for organization:', organizationId);

      // Get current settings from Firestore to compare
      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);

      let newVersion = settings.generatorVersion;
      const currentSettings = orgSnap.exists() ? orgSnap.data()?.pdfSettings : null;

      // Auto-increment version if settings changed
      if (currentSettings) {
        const currentVersion = currentSettings.generatorVersion || '1.0.0';

        // Detect change type by comparing settings
        const hasContentChanges = JSON.stringify(settings.content) !== JSON.stringify(currentSettings.content) ||
                                   JSON.stringify(settings.sections) !== JSON.stringify(currentSettings.sections);
        const hasStylingChanges = JSON.stringify(settings.styling) !== JSON.stringify(currentSettings.styling);

        if (hasContentChanges) {
          // Content changes = MINOR version bump (1.2.0 → 1.3.0)
          newVersion = this.incrementVersion(currentVersion, 'minor');
          Logger.debug(`📈 Content changed, incrementing version: ${currentVersion} → ${newVersion}`);
        } else if (hasStylingChanges) {
          // Styling changes = PATCH version bump (1.2.0 → 1.2.1)
          newVersion = this.incrementVersion(currentVersion, 'patch');
          Logger.debug(`🎨 Styling changed, incrementing version: ${currentVersion} → ${newVersion}`);
        } else {
          Logger.debug(`ℹ️ No changes detected, keeping version: ${currentVersion}`);
          newVersion = currentVersion;
        }
      }

      // Update timestamps and metadata
      const updatedSettings: PDFTemplateSettings = {
        ...settings,
        generatorVersion: newVersion, // Use incremented version
        lastUpdated: new Date(),
        updatedBy: updatedBy,
      };

      // Add to version history
      if (!updatedSettings.versionHistory) {
        updatedSettings.versionHistory = [];
      }

      updatedSettings.versionHistory.push({
        version: newVersion,
        activatedAt: new Date(),
        activatedBy: updatedBy,
        previousVersion: currentSettings?.generatorVersion,
        reason: 'Template updated via SuperAdmin dashboard'
      });

      // Save to Firestore
      await updateDoc(orgRef, {
        pdfSettings: updatedSettings,
        updatedAt: new Date()
      });

      Logger.success('✅ PDF template saved successfully:', {
        organizationId,
        version: newVersion,
        versionHistoryLength: updatedSettings.versionHistory.length
      });

    } catch (error) {
      Logger.error('❌ Failed to save PDF template:', error);
      throw new Error(`Failed to save PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize default PDF settings for an organization
   * Used when:
   * - Creating a new organization
   * - Migrating existing organizations without PDF settings
   *
   * @param organizationId - Organization ID
   * @param createdBy - UID of user creating the settings
   * @returns Default PDF template settings
   */
  static getDefaultSettings(createdBy: string = 'system'): PDFTemplateSettings {
    return {
      generatorVersion: PDF_GENERATOR_VERSION,
      lastUpdated: new Date(),
      updatedBy: createdBy,

      styling: {
        headerBackground: '#3B82F6',
        sectionHeaderColor: '#333333',
        bodyTextColor: '#000000',
        borderColor: '#C8C8C8',
        useBrandColors: true,
        fontSize: 11,
        fontFamily: 'Helvetica',
        lineHeight: 1.4,
        pageSize: 'A4',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      },

      content: {
        showLogo: true,
        logoPosition: 'top-left',
        logoMaxHeight: 20,
        enabledSections: [
          'employee-info',
          'incident',
          'previous-warnings',
          'consequences',
          'rights',
          'signatures'
        ],
        showWatermark: true,
        watermarkText: 'CONFIDENTIAL',
        watermarkOpacity: 0.1,
        footerText: 'Confidential & Privileged',
        showPageNumbers: true,
        legalTextVersion: 'south-africa-lra'
      },

      features: {
        enablePreviousWarnings: true,
        enableConsequences: true,
        enableEmployeeRights: true,
        enableAppealSection: true,
        enableSignatures: true
      },

      // 🆕 SECTION CONFIGURATIONS - Default sections for new organizations
      sections: [
        {
          id: 'previous-disciplinary-actions',
          type: 'standard',
          name: 'Previous Disciplinary Actions',
          enabled: true,
          order: 0,
          content: {
            heading: 'PREVIOUS DISCIPLINARY ACTION (Still Valid on File)',
            // 🆕 BODY: Optional explanatory text above warning list
            // Warning list format is FIXED and cannot be customized (consistency required)
            body: 'The following disciplinary actions are still active and valid on file:'
          },
          description: 'Displays employee\'s previous warnings for progressive discipline tracking (gray box with numbered list)',
          isLocked: false,
          requiredFields: [],
          createdAt: new Date(),
          createdBy: createdBy
        },
        {
          id: 'consequences-section',
          type: 'standard',
          name: 'Consequences Section',
          enabled: true,
          order: 1,
          content: {
            heading: 'WARNING: CONSEQUENCES IF EMPLOYEE\nDOES NOT CHANGE BEHAVIOUR',
            // 🆕 BODY: Default consequences text (v1.1.0 format)
            // Supports {{placeholder}} replacement (e.g., {{issuedDate}})
            body: 'Any further transgressions related or unrelated to the offences shall result in further disciplinary action which can lead to a disciplinary hearing and it can result in dismissal. Refer to counselling dated {{issuedDate}}.',
            // 🆕 BULLET POINTS: Alternative consequences format (optional, empty by default)
            bulletPoints: []
          },
          description: 'Warning box about consequences of continued behavior (red warning box)',
          isLocked: false,
          requiredFields: ['issuedDate'],
          createdAt: new Date(),
          createdBy: createdBy
        },
        {
          id: 'employee-rights-lra',
          type: 'standard',
          name: 'Employee Rights and Next Steps',
          enabled: true,
          order: 2,
          content: {
            heading: 'EMPLOYEE RIGHTS AND NEXT STEPS',
            // 🆕 SUBSECTIONS: Structured content for Employee Rights section
            // Used by v1.1.0 rendering method with custom content support
            subsections: [
              {
                title: 'Your Rights:',
                content: [
                  '• Right to Appeal: You may appeal this warning within 48 hours by submitting a written appeal to HR. If your internal appeal is unsuccessful, you may refer the matter to the CCMA within 30 days.',
                  '• Right to Representation: You have the right to be represented by a fellow employee or shop steward during disciplinary proceedings.',
                  '• Signing This Document: Your signature acknowledges that this warning has been explained to you. It does NOT mean you agree with the warning.',
                  '• Confidentiality: All information will be kept confidential and shared only with relevant management and HR personnel.'
                ]
              },
              {
                title: 'What Happens Next:',
                content: [
                  '• This warning remains valid for {{validityPeriod}} months from the date of issue.',
                  '• During this period, similar conduct may result in further disciplinary action, up to and including dismissal.',
                  '• You are expected to demonstrate immediate and sustained improvement in your conduct.'
                ]
              },
              {
                title: 'Important Notice:',
                content: 'If you believe this warning is procedurally unfair or unjust, you have recourse through your company\'s internal appeal process or the Commission for Conciliation, Mediation and Arbitration (CCMA).'
              }
            ]
          },
          description: 'LRA-compliant employee rights section with next steps (legally required in South Africa)',
          isLocked: true,
          requiredFields: ['validityPeriod'],
          createdAt: new Date(),
          createdBy: createdBy
        },
        {
          id: 'appeal-history',
          type: 'standard',
          name: 'Appeal History Section',
          enabled: true,
          order: 3,
          content: {
            heading: 'Appeal Information',
            body: 'If you wish to appeal this warning, you must submit your appeal in writing to {{organization.name}} within 7 days of receiving this document.',
            bulletPoints: [
              'Appeals must be submitted in writing',
              'Appeals must be received within 7 calendar days',
              'State clear grounds for your appeal',
              'Appeal will be reviewed by management not involved in original decision',
              'Decision on appeal is final'
            ]
          },
          description: 'Information about the employee\'s right to appeal the warning',
          isLocked: false,
          requiredFields: ['organization.name'],
          createdAt: new Date(),
          createdBy: createdBy
        },
        {
          id: 'signatures',
          type: 'standard',
          name: 'Signature Section',
          enabled: true,
          order: 4,
          content: {
            heading: 'Acknowledgment of Receipt',
            body: 'By signing below, you acknowledge receipt of this warning and confirm that you have been given an opportunity to respond.',
            bulletPoints: []
          },
          description: 'Signature blocks for manager and employee acknowledgment',
          isLocked: false,
          requiredFields: [],
          createdAt: new Date(),
          createdBy: createdBy
        }
      ],

      versionHistory: [{
        version: PDF_GENERATOR_VERSION,
        activatedAt: new Date(),
        activatedBy: createdBy,
        reason: 'Initial template creation'
      }],

      autoUpgrade: true,
      betaFeatures: false
    };
  }

  /**
   * Initialize PDF settings for a new organization
   * Called during organization creation process
   *
   * @param organizationId - Organization ID
   * @param createdBy - UID of user creating the organization
   * @returns Success status
   */
  static async initializeForNewOrganization(
    organizationId: string,
    createdBy: string
  ): Promise<void> {
    try {
      Logger.debug('🎨 Initializing PDF template for new organization:', organizationId);

      const defaultSettings = this.getDefaultSettings(createdBy);

      const orgRef = doc(db, 'organizations', organizationId);
      await updateDoc(orgRef, {
        pdfSettings: defaultSettings
      });

      Logger.success('✅ PDF template initialized for new organization:', organizationId);

    } catch (error) {
      Logger.error('❌ Failed to initialize PDF template:', error);
      throw new Error(`Failed to initialize PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔧 MIGRATION UTILITY: Add default PDF settings to all organizations without them
   *
   * WARNING: This is a bulk operation that updates multiple organizations.
   * Should only be called by SuperAdmin from the dashboard.
   *
   * @param migratedBy - UID of SuperAdmin performing the migration
   * @returns Migration statistics
   */
  static async migrateExistingOrganizations(migratedBy: string): Promise<{
    total: number;
    migrated: number;
    skipped: number;
    errors: number;
  }> {
    try {
      Logger.debug('🚀 Starting PDF template migration for existing organizations...');

      const stats = {
        total: 0,
        migrated: 0,
        skipped: 0,
        errors: 0
      };

      // Get all organizations
      const orgsRef = collection(db, 'organizations');
      const orgsSnapshot = await getDocs(orgsRef);
      stats.total = orgsSnapshot.size;

      Logger.debug(`📊 Found ${stats.total} organizations to process`);

      // Use batched writes for better performance (max 500 per batch)
      const batch = writeBatch(db);
      let batchCount = 0;
      const BATCH_LIMIT = 500;

      for (const orgDoc of orgsSnapshot.docs) {
        const orgData = orgDoc.data();

        // Skip organizations that already have PDF settings
        if (orgData.pdfSettings) {
          stats.skipped++;
          Logger.debug(`⏭️ Skipping ${orgData.name} - already has PDF settings`);
          continue;
        }

        try {
          // Create default settings
          const defaultSettings = this.getDefaultSettings(migratedBy);

          // Add to batch
          const orgRef = doc(db, 'organizations', orgDoc.id);
          batch.update(orgRef, {
            pdfSettings: defaultSettings,
            updatedAt: new Date()
          });

          batchCount++;
          stats.migrated++;

          // Commit batch if we hit the limit
          if (batchCount >= BATCH_LIMIT) {
            await batch.commit();
            Logger.debug(`✅ Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }

        } catch (error) {
          stats.errors++;
          Logger.error(`❌ Failed to migrate ${orgData.name}:`, error);
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
        Logger.debug(`✅ Committed final batch of ${batchCount} updates`);
      }

      Logger.success('🎉 PDF template migration complete:', stats);

      return stats;

    } catch (error) {
      Logger.error('❌ PDF template migration failed:', error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clone template from one organization to another
   * Useful for organizations that want to use the same template
   *
   * @param sourceOrgId - Organization ID to copy from
   * @param targetOrgId - Organization ID to copy to
   * @param copiedBy - UID of user performing the clone
   * @returns Success status
   */
  static async cloneTemplate(
    sourceOrgId: string,
    targetOrgId: string,
    copiedBy: string
  ): Promise<void> {
    try {
      Logger.debug('📋 Cloning PDF template:', {
        from: sourceOrgId,
        to: targetOrgId
      });

      // Get source organization's settings
      const sourceRef = doc(db, 'organizations', sourceOrgId);
      const sourceSnap = await getDoc(sourceRef);

      if (!sourceSnap.exists()) {
        throw new Error(`Source organization ${sourceOrgId} not found`);
      }

      const sourceData = sourceSnap.data();
      if (!sourceData.pdfSettings) {
        throw new Error(`Source organization has no PDF settings to clone`);
      }

      // Clone settings with updated metadata
      const clonedSettings: PDFTemplateSettings = {
        ...sourceData.pdfSettings,
        lastUpdated: new Date(),
        updatedBy: copiedBy,
        versionHistory: [
          ...(sourceData.pdfSettings.versionHistory || []),
          {
            version: sourceData.pdfSettings.generatorVersion,
            activatedAt: new Date(),
            activatedBy: copiedBy,
            reason: `Template cloned from organization ${sourceOrgId}`
          }
        ]
      };

      // Save to target organization
      const targetRef = doc(db, 'organizations', targetOrgId);
      await updateDoc(targetRef, {
        pdfSettings: clonedSettings,
        updatedAt: new Date()
      });

      Logger.success('✅ PDF template cloned successfully:', {
        from: sourceOrgId,
        to: targetOrgId
      });

    } catch (error) {
      Logger.error('❌ Failed to clone PDF template:', error);
      throw new Error(`Failed to clone template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset organization's PDF settings to defaults
   * Useful for troubleshooting or reverting changes
   *
   * @param organizationId - Organization ID
   * @param resetBy - UID of user performing the reset
   * @returns Success status
   */
  static async resetToDefaults(
    organizationId: string,
    resetBy: string
  ): Promise<void> {
    try {
      Logger.debug('🔄 Resetting PDF template to defaults:', organizationId);

      const defaultSettings = this.getDefaultSettings(resetBy);

      // Preserve existing version history if any
      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        if (orgData.pdfSettings?.versionHistory) {
          defaultSettings.versionHistory = [
            ...orgData.pdfSettings.versionHistory,
            {
              version: PDF_GENERATOR_VERSION,
              activatedAt: new Date(),
              activatedBy: resetBy,
              reason: 'Template reset to system defaults'
            }
          ];
        }
      }

      await updateDoc(orgRef, {
        pdfSettings: defaultSettings,
        updatedAt: new Date()
      });

      Logger.success('✅ PDF template reset to defaults:', organizationId);

    } catch (error) {
      Logger.error('❌ Failed to reset PDF template:', error);
      throw new Error(`Failed to reset template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
