// frontend/src/services/ResellerDemoService.ts
// Thin wrapper around the reseller demo Cloud Functions.
// Server-side code lives in functions/src/Reseller/demoManagement.ts.

import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import Logger from '../utils/logger';
import type { Organization } from '../types/core';

export interface DeployDemoResult {
  orgId: string;
  companyName: string;
  employeeCount: number;
  categoryCount: number;
}

export interface CreateProspectLoginResult {
  uid: string;
  email: string;
  password: string;
}

export interface ResetDemoResult {
  resetAt: string;
  resetCount: number;
  warningsDeleted: number;
  employeesDeleted: number;
  tokensDeleted: number;
  prospectLoginsRevoked: number;
}

export interface DeleteDemoResult {
  deletedAt: string;
  orgId: string;
}

export class ResellerDemoService {
  /**
   * Deploy a new pre-populated demo organization for the calling reseller.
   */
  static async deployDemo(companyName: string): Promise<DeployDemoResult> {
    const fn = httpsCallable<{ companyName: string }, DeployDemoResult>(
      functions,
      'deployDemoOrganization'
    );
    const result = await fn({ companyName });
    Logger.success(`✅ Demo org deployed: ${result.data.orgId}`);
    return result.data;
  }

  /**
   * Generate a temporary prospect login for a demo org.
   * Returns plaintext credentials ONCE — they cannot be retrieved later.
   */
  static async createProspectLogin(
    orgId: string,
    prospectEmail?: string,
    prospectName?: string
  ): Promise<CreateProspectLoginResult> {
    const fn = httpsCallable<
      { orgId: string; prospectEmail?: string; prospectName?: string },
      CreateProspectLoginResult
    >(functions, 'createDemoProspectLogin');
    const result = await fn({ orgId, prospectEmail, prospectName });
    Logger.success(`✅ Prospect login created for ${orgId}`);
    return result.data;
  }

  /**
   * Wipe warnings + employees + evidence + prospect logins, then re-seed the
   * canonical sample employees. Categories and branding are preserved.
   */
  static async resetDemo(orgId: string): Promise<ResetDemoResult> {
    const fn = httpsCallable<{ orgId: string }, ResetDemoResult>(
      functions,
      'resetDemoOrganization'
    );
    const result = await fn({ orgId });
    Logger.success(`✅ Demo reset: ${orgId} (reset #${result.data.resetCount})`);
    return result.data;
  }

  /**
   * Permanently delete a demo org and all related data, including prospect logins.
   */
  static async deleteDemo(orgId: string): Promise<DeleteDemoResult> {
    const fn = httpsCallable<{ orgId: string }, DeleteDemoResult>(
      functions,
      'deleteDemoOrganization'
    );
    const result = await fn({ orgId });
    Logger.success(`✅ Demo deleted: ${orgId}`);
    return result.data;
  }

  /**
   * List all demos owned by the current reseller.
   * Uses a direct Firestore query — faster than round-tripping through a CF.
   */
  static async listDemos(resellerId: string): Promise<Organization[]> {
    const q = query(
      collection(db, 'organizations'),
      where('resellerId', '==', resellerId),
      where('isDemo', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
  }
}

export default ResellerDemoService;
