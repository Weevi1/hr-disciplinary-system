/**
 * PDFTemplateVersionService.ts
 *
 * Manages PDF template versions for organizations.
 *
 * **ARCHITECTURE DECISION: Template Version Normalization**
 *
 * Instead of storing full pdfSettings (5-10KB) with every warning, we:
 * 1. Store each template version once in: organizations/{orgId}/pdfTemplateVersions/{version}
 * 2. Warnings store only version string: pdfTemplateVersion: "1.9.0" (5 bytes)
 * 3. When regenerating PDFs, fetch template from versions collection
 *
 * **BENEFITS:**
 * - 1000x storage reduction per warning (5KB → 5 bytes)
 * - Centralized template management (one source of truth)
 * - Significantly lower Firestore costs
 * - Faster warning creation
 *
 * **DATABASE STRUCTURE:**
 * organizations/{orgId}/pdfTemplateVersions/{version}
 * {
 *   version: "1.9.0",
 *   settings: { ...complete pdfSettings object... },
 *   activatedAt: Timestamp,
 *   activatedBy: string,
 *   reason: string,
 *   previousVersion?: string
 * }
 */

import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PDFTemplateSettings } from '../types/core';
import Logger from '../utils/logger';

export interface PDFTemplateVersion {
  version: string;
  settings: PDFTemplateSettings;
  activatedAt: Date;
  activatedBy: string;
  reason?: string;
  previousVersion?: string;
}

export class PDFTemplateVersionService {
  /**
   * Save a template version to Firestore
   *
   * This is called when:
   * 1. Organization first creates their PDF template
   * 2. SuperAdmin updates template settings
   * 3. Creating a warning (to ensure template version exists)
   */
  static async saveTemplateVersion(
    organizationId: string,
    version: string,
    settings: PDFTemplateSettings,
    metadata: {
      activatedBy: string;
      reason?: string;
      previousVersion?: string;
    }
  ): Promise<void> {
    try {
      const versionRef = doc(
        db,
        'organizations',
        organizationId,
        'pdfTemplateVersions',
        version
      );

      // Check if version already exists
      const existingDoc = await getDoc(versionRef);
      if (existingDoc.exists()) {
        Logger.debug(`📋 Template version ${version} already exists for ${organizationId}`);
        return;
      }

      const templateVersion: PDFTemplateVersion = {
        version,
        settings,
        activatedAt: new Date(),
        activatedBy: metadata.activatedBy,
        reason: metadata.reason || 'Template version saved',
        ...(metadata.previousVersion ? { previousVersion: metadata.previousVersion } : {})
      };

      await setDoc(versionRef, templateVersion);

      Logger.info(`✅ Saved template version ${version} for organization ${organizationId}`);
    } catch (error) {
      Logger.error('Failed to save template version:', error);
      throw new Error('Failed to save PDF template version');
    }
  }

  /**
   * Retrieve a specific template version
   *
   * @param organizationId - Organization ID
   * @param version - Template version (e.g., "1.9.0")
   * @returns Template version document or null if not found
   */
  static async getTemplateVersion(
    organizationId: string,
    version: string
  ): Promise<PDFTemplateVersion | null> {
    try {
      const versionRef = doc(
        db,
        'organizations',
        organizationId,
        'pdfTemplateVersions',
        version
      );

      const docSnap = await getDoc(versionRef);

      if (!docSnap.exists()) {
        Logger.warn(`⚠️ Template version ${version} not found for ${organizationId}`);
        return null;
      }

      return docSnap.data() as PDFTemplateVersion;
    } catch (error) {
      Logger.error(`Failed to retrieve template version ${version}:`, error);
      throw new Error('Failed to retrieve PDF template version');
    }
  }

  /**
   * Get the current active template version for an organization
   *
   * This reads from organization.pdfSettings.generatorVersion
   * and fetches the corresponding template from the versions collection.
   */
  static async getCurrentTemplateVersion(
    organizationId: string
  ): Promise<PDFTemplateVersion | null> {
    try {
      // Get organization document to find current version
      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);

      if (!orgSnap.exists()) {
        Logger.error(`Organization ${organizationId} not found`);
        return null;
      }

      const orgData = orgSnap.data();
      const currentVersion = orgData.pdfSettings?.generatorVersion;

      if (!currentVersion) {
        Logger.warn(`No current template version found for ${organizationId}`);
        return null;
      }

      return this.getTemplateVersion(organizationId, currentVersion);
    } catch (error) {
      Logger.error('Failed to get current template version:', error);
      throw new Error('Failed to retrieve current PDF template version');
    }
  }

  /**
   * Ensure template version exists in collection
   *
   * Called during warning creation to guarantee the template version
   * is saved before storing the reference in the warning.
   *
   * @returns The version string that was saved
   */
  static async ensureTemplateVersionExists(
    organizationId: string,
    settings: PDFTemplateSettings,
    userId: string
  ): Promise<string> {
    const version = settings.generatorVersion || '1.0.0';

    await this.saveTemplateVersion(
      organizationId,
      version,
      settings,
      {
        activatedBy: userId,
        reason: 'Template version saved during warning creation'
      }
    );

    return version;
  }

  /**
   * Get all template versions for an organization
   * Useful for template version history displays
   */
  static async getAllTemplateVersions(
    organizationId: string
  ): Promise<PDFTemplateVersion[]> {
    try {
      const versionsRef = collection(
        db,
        'organizations',
        organizationId,
        'pdfTemplateVersions'
      );

      const q = query(versionsRef, orderBy('activatedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data() as PDFTemplateVersion);
    } catch (error) {
      Logger.error('Failed to get all template versions:', error);
      throw new Error('Failed to retrieve PDF template versions');
    }
  }
}
