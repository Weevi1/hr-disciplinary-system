// frontend/src/services/AdminDataService.ts
//
// Cross-organization administrative and reseller operations.
//
// `ShardedDataService` handles per-org reads/writes scoped by `organizationId`
// (the canonical data path for tenant code). The methods below operate ACROSS
// orgs — listing all resellers, querying clients by reseller, logging
// deployment events, customising universal warning categories per org — and
// don't fit the sharded per-org model. They previously lived in DataService.ts
// (now deleted) alongside ~60 dead methods; this file extracts just the live
// admin/reseller surface (Phase 2 Tier 2C, 2026-05-11).
//
// Callers: components/admin/*, components/reseller/*, services/CommissionService.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShardedDataService } from './ShardedDataService';
import Logger from '../utils/logger';
import type { Organization, WarningLevel } from '../types';

// Local interface — preserved verbatim from DataService.ts to keep the
// Firestore document shape identical. Used by customizeCategory /
// createCustomCategory writes.
interface CategoryCustomization {
  id: string;
  organizationId: string;
  universalCategoryId: string;
  customName?: string;
  customDescription?: string;
  customEscalationPath?: WarningLevel[];
  customExamples?: string[];
  customExpectedStandardsTemplate?: string;
  isDisabled?: boolean;
  isCustomCategory?: boolean;
  customSeverity?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

function convertOptionalDate(dateValue: any): Date | undefined {
  if (!dateValue) return undefined;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export class AdminDataService {

  // ============================================
  // 🎨 CATEGORY CUSTOMIZATION (per-org overrides of universal categories)
  // ============================================

  /**
   * Customize an existing universal category for an organization.
   * Writes a CategoryCustomization doc to organizations/{orgId}/categories/{categoryId};
   * then invalidates ShardedDataService's category cache for that org so the next
   * read reflects the change.
   */
  static async customizeCategory(
    organizationId: string,
    universalCategoryId: string,
    customizations: Partial<CategoryCustomization>
  ): Promise<void> {
    try {
      const customizationId = universalCategoryId;
      const customizationRef = doc(db, 'organizations', organizationId, 'categories', customizationId);

      const customizationData: CategoryCustomization = {
        id: customizationId,
        organizationId,
        universalCategoryId,
        ...customizations,
        isCustomCategory: false,
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(customizationRef, customizationData);

      ShardedDataService.invalidateCache(`categories:${organizationId}`);

      Logger.debug('[AdminDataService] ✅ Category customization saved:', universalCategoryId);
    } catch (error) {
      Logger.error('[AdminDataService] Error customizing category:', error);
      throw error;
    }
  }

  /**
   * Create a completely new custom category for an organization.
   */
  static async createCustomCategory(
    organizationId: string,
    categoryData: {
      name: string;
      description: string;
      escalationPath: WarningLevel[];
      examples?: string[];
      // Caller widens severity to plain string via a `?:` ternary; accept that.
      severity?: string;
      icon?: string;
      expectedStandardsTemplate?: string;
    }
  ): Promise<string> {
    try {
      const categoryId = `custom-${Date.now()}`;
      const categoryRef = doc(db, 'organizations', organizationId, 'categories', categoryId);

      // Normalise severity to the constrained CategoryCustomization union; the
      // caller passes a wider `string` derived from a ternary.
      const normalisedSeverity: CategoryCustomization['customSeverity'] =
        (categoryData.severity === 'low' || categoryData.severity === 'medium'
          || categoryData.severity === 'high' || categoryData.severity === 'critical')
          ? categoryData.severity
          : 'medium';

      const customCategoryData: CategoryCustomization = {
        id: categoryId,
        organizationId,
        universalCategoryId: '', // not linked to a universal template
        customName: categoryData.name,
        customDescription: categoryData.description,
        customEscalationPath: categoryData.escalationPath,
        customExamples: categoryData.examples || [],
        customExpectedStandardsTemplate: categoryData.expectedStandardsTemplate || '',
        customSeverity: normalisedSeverity,
        isCustomCategory: true,
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(categoryRef, customCategoryData);

      ShardedDataService.invalidateCache(`categories:${organizationId}`);

      Logger.debug('[AdminDataService] ✅ Custom category created:', categoryData.name);
      return categoryId;
    } catch (error) {
      Logger.error('[AdminDataService] Error creating custom category:', error);
      throw error;
    }
  }

  // ============================================
  // 🏢 ORGANIZATION-LEVEL ADMIN (cross-org reads, top-level writes)
  // ============================================

  /**
   * Update top-level organization document. Per-org subcollection writes
   * (employees, warnings, categories) go through ShardedDataService instead.
   */
  static async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<void> {
    try {
      const orgRef = doc(db, 'organizations', organizationId);
      await updateDoc(orgRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      Logger.error('[AdminDataService] Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Load all organizations (super-admin dashboard).
   */
  static async loadOrganizations(): Promise<Organization[]> {
    try {
      Logger.debug('Loading organizations for SuperAdmin dashboard...');

      const orgsRef = collection(db, 'organizations');
      const q = query(orgsRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const organizations = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: convertOptionalDate(d.data().createdAt),
        updatedAt: convertOptionalDate(d.data().updatedAt),
      })) as Organization[];

      Logger.success(`✅ Loaded ${organizations.length} organizations successfully`);
      return organizations;
    } catch (error) {
      Logger.error('[AdminDataService] Error loading organizations:', error);
      throw error;
    }
  }

  // ============================================
  // 🤝 RESELLER MANAGEMENT
  // ============================================

  /**
   * Create new reseller for provincial network.
   */
  static async createReseller(resellerData: any): Promise<string> {
    try {
      const resellerId = `reseller_${Date.now()}`;
      const reseller = {
        ...resellerData,
        id: resellerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'resellers', resellerId), reseller);
      Logger.success(`✅ Reseller created: ${resellerId}`);
      return resellerId;
    } catch (error) {
      Logger.error('❌ Failed to create reseller:', error);
      throw error;
    }
  }

  /**
   * Update existing reseller.
   */
  static async updateReseller(resellerId: string, updates: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'resellers', resellerId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      Logger.success(`✅ Reseller updated: ${resellerId}`);
    } catch (error) {
      Logger.error('❌ Failed to update reseller:', error);
      throw error;
    }
  }

  /**
   * Get single reseller by ID.
   */
  static async getReseller(resellerId: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'resellers', resellerId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: convertOptionalDate(docSnap.data().createdAt),
        updatedAt: convertOptionalDate(docSnap.data().updatedAt),
      };
    } catch (error) {
      Logger.error('❌ Failed to get reseller:', error);
      throw error;
    }
  }

  /**
   * Get organizations (clients) for a specific reseller. Demo organizations
   * (`isDemo === true`) are excluded — they're tracked separately and never
   * count toward reseller metrics.
   */
  static async getResellerClients(resellerId: string): Promise<any[]> {
    try {
      const orgsRef = collection(db, 'organizations');
      const q = query(
        orgsRef,
        where('resellerId', '==', resellerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const clients = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: convertOptionalDate(d.data().createdAt),
          updatedAt: convertOptionalDate(d.data().updatedAt),
        }))
        .filter((c: any) => c.isDemo !== true);

      Logger.success(`📊 Loaded ${clients.length} clients for reseller ${resellerId}`);
      return clients;
    } catch (error) {
      Logger.error('❌ Failed to get reseller clients:', error);
      throw error;
    }
  }

  /**
   * Get all resellers.
   */
  static async getAllResellers(): Promise<any[]> {
    try {
      const resellersQuery = query(
        collection(db, 'resellers'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(resellersQuery);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: convertOptionalDate(d.data().createdAt),
        updatedAt: convertOptionalDate(d.data().updatedAt),
      }));
    } catch (error) {
      Logger.error('Failed to get all resellers:', error);
      throw error;
    }
  }

  /**
   * Get reseller deployment history since a given date — used by the
   * organization wizard's deployment rate-limiter.
   */
  static async getResellerDeployments(resellerId: string, since: Date): Promise<any[]> {
    try {
      const deploymentsQuery = query(
        collection(db, 'resellerDeployments'),
        where('resellerId', '==', resellerId),
        where('deployedAt', '>=', since),
        orderBy('deployedAt', 'desc')
      );

      const snapshot = await getDocs(deploymentsQuery);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        deployedAt: d.data().deployedAt?.toDate() || new Date(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
    } catch (error) {
      Logger.error('Failed to get reseller deployments:', error);
      return []; // empty on error so deployment can proceed
    }
  }

  /**
   * Log a reseller deployment event (audit trail). Best-effort — failures
   * are logged but do not throw, since deployment itself must not be blocked
   * by audit-log issues.
   */
  static async logResellerDeployment(deploymentData: {
    resellerId: string;
    organizationId: string;
    organizationName: string;
    adminEmail: string;
    deployedAt: any; // Firestore timestamp
    notes?: string;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'resellerDeployments'), {
        ...deploymentData,
        createdAt: deploymentData.deployedAt,
      });
      Logger.info('Reseller deployment logged successfully');
    } catch (error) {
      Logger.error('Failed to log reseller deployment:', error);
    }
  }
}
