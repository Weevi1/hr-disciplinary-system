import Logger from '../utils/logger';
// frontend/src/services/WarningService.ts
// 🏆 CLEANED WARNING SERVICE - DEPENDS ON UNIVERSALCATEGORIES
// ✅ Removed duplicate escalation path logic
// ✅ Uses UniversalCategories as single source of truth
// ✅ Cleaned up and streamlined code
// ✅ Maintains all existing functionality

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DataService } from './DataService';
import { TimeService } from './TimeService';
import { DatabaseShardingService } from './DatabaseShardingService';

// Import from UniversalCategories - our single source of truth
import type { 
  WarningLevel,
  UniversalCategory
} from './UniversalCategories';
import {
  getCategoryById,
  getEscalationPath,
  getNextEscalationLevel,
  getLevelLabel,
  isValidLevelForCategory
} from './UniversalCategories';

// ============================================
// RE-EXPORT CORE TYPES
// ============================================

export type { WarningLevel, UniversalCategory } from './UniversalCategories';
export type DeliveryMethod = 'email' | 'whatsapp' | 'print' | 'hand_delivery';

// ============================================
// CORE INTERFACES
// ============================================

export interface Warning {
  id: string;
  organizationId: string;
  employeeId: string;
  categoryId: string;
  
  // Employee info (populated by DataService for HR review)
  employeeName?: string;
  employeeNumber?: string;  
  department?: string;
  category?: string; // Category name for display
  
  // Content
  level: WarningLevel;
  title: string;
  description: string;
  incidentDate: Date;
  incidentTime: string;
  incidentLocation: string;
  additionalNotes?: string;

  // 🆕 Override tracking (for custom escalation paths)
  wasOverridden?: boolean; // True if manager overrode system recommendation
  originalRecommendedLevel?: WarningLevel; // Original system recommendation for audit trail

  // Administrative
  issueDate: Date;
  expiryDate: Date;
  validityPeriod: 3 | 6 | 12; // months
  issuedBy: string; // manager/HR ID
  
  // Status
  isActive: boolean;
  isSigned: boolean;
  isDelivered: boolean;
  status?: 'issued' | 'delivered' | 'acknowledged' | 'expired';
  
  // Delivery
  deliveryMethod: DeliveryMethod;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'cancelled';
  deliveryDate?: Date;
  
  // Signatures
  managerSignature?: string;
  employeeSignature?: string;
  witnessSignatures?: string[];
  signatureDate?: Date;

  // 🔒 Progressive Discipline Context (for PDF generation and legal audit trail)
  disciplineRecommendation?: EscalationRecommendation;
  pdfGeneratorVersion?: string;
  pdfTemplateVersion?: string; // Reference to template version in versions collection (e.g., "1.9.0") - 1000x more efficient than storing full settings

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WarningCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  escalationPath: WarningLevel[];
  legalRequirements: string[];
  examples: string[];
  defaultValidityPeriod: 3 | 6 | 12;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioRecordingData {
  id: string;
  url: string;
  duration: number;
  format: string;
  size: number;
  timestamp: Date;
}

export interface EmployeeWithContext {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  deliveryPreference: 'email' | 'whatsapp' | 'print';
  recentWarnings: { count: number };
  riskIndicators: { highRisk: boolean; reasons: string[] };
}

export interface EnhancedWarningFormData {
  // Employee and category
  employeeId: string;
  categoryId: string;
  
  // Timing
  issueDate: string;
  incidentDate: string;
  incidentTime: string;
  
  // Content
  incidentLocation: string;
  incidentDescription: string;
  additionalNotes?: string;
  
  // Progressive discipline
  level: WarningLevel;
  validityPeriod: 3 | 6 | 12;
  escalationReason?: string;
  
  // Audio recording
  audioRecording?: AudioRecordingData;
}

/**
 * 🔥 CRITICAL: Simplified warning summary for PDF generation
 * Stores only essential fields to avoid Firestore document size limits
 * Full Warning objects with nested audio/signatures can exceed 1MB limit
 */
export interface SimplifiedWarningSummary {
  id: string;
  level: WarningLevel;
  category: string;
  description: string;
  issueDate: Date | string; // Support both Date and ISO string
  incidentDate: Date | string;
  employeeName?: string;
  employeeNumber?: string;
}

export interface EscalationRecommendation {
  // Core recommendation
  suggestedLevel: WarningLevel;
  recommendedLevel: string;
  reason: string;

  // HR Intervention System
  requiresHRIntervention: boolean;
  interventionReason?: string;
  interventionLevel?: 'urgent' | 'standard';

  // Context - 🔥 FIXED: Use simplified summaries instead of full Warning objects
  activeWarnings: SimplifiedWarningSummary[];
  escalationPath: WarningLevel[];
  isEscalation: boolean;

  // LRA Compliance
  category: string;
  categoryId: string;
  legalBasis: string;
  legalRequirements: string[];

  // Progressive discipline context
  warningCount: number; // Total active warnings across all categories
  categoryWarningCount?: number; // Warnings in this specific category
  nextExpiryDate: Date;
  examples: string[];
  explanation: string;
  previousWarnings: SimplifiedWarningSummary[]; // 🔥 FIXED: Simplified summaries

}

// ============================================
// 🎯 WARNING SERVICE CLASS - CLEANED & STREAMLINED
// ============================================

export class WarningService {

  // ============================================
  // HELPER METHODS - SIMPLIFIED WARNING SUMMARIES
  // ============================================

  /**
   * 🔥 CRITICAL: Convert full Warning object to simplified summary
   * This prevents Firestore document size limit issues when storing recommendations
   * Full warnings with audio recordings and signatures can exceed 1MB
   */
  private static simplifyWarning(warning: Warning): SimplifiedWarningSummary {
    // 🔥 CRITICAL FIX: Keep dates as Date objects - Firestore handles them correctly
    // The issue was trying to convert to ISO strings which caused timezone shifts
    // Firestore Timestamps preserve the exact date/time when stored and retrieved
    Logger.debug('🔍 [SIMPLIFY] Storing warning dates as Date objects:', {
      warningId: warning.id,
      issueDate: warning.issueDate,
      incidentDate: warning.incidentDate
    });

    return {
      id: warning.id || '',
      level: warning.level,
      category: warning.category || 'Unknown Category',
      description: warning.description || warning.title || 'No description',
      issueDate: warning.issueDate, // Keep as Date object - Firestore converts to Timestamp correctly
      incidentDate: warning.incidentDate, // Keep as Date object - Firestore converts to Timestamp correctly
      employeeName: warning.employeeName,
      employeeNumber: warning.employeeNumber
    };
  }

  /**
   * Convert array of full Warning objects to simplified summaries
   */
  private static simplifyWarnings(warnings: Warning[]): SimplifiedWarningSummary[] {
    return warnings.map(w => this.simplifyWarning(w));
  }

  // ============================================
  // ESCALATION RECOMMENDATION ENGINE
  // ============================================

  /**
   * Generate escalation recommendation based on employee history
   * Now uses UniversalCategories as single source of truth
   * 🔥 FIXED: Returns simplified warning summaries to avoid Firestore size limits
   */
  static async getEscalationRecommendation(
    employeeId: string,
    categoryId: string,
    organizationId?: string
  ): Promise<EscalationRecommendation> {
    try {
      Logger.debug(5184)
      
      // Get all active warnings for employee
      const allActiveWarnings = await this.getActiveWarnings(employeeId, organizationId);
      
      // 🔧 NEW: First try to get category from organization, then fallback to universal
      let categoryEscalationPath: string[] | null = null;
      let categoryFound = false;
      let universalCategory: any = null;
      let orgCategory: any = null;

      // Try to get escalation path from organization's categories
      if (organizationId) {
        try {
          const orgCategories = await DatabaseShardingService.queryDocuments(organizationId, 'categories', []);
          orgCategory = orgCategories.documents.find((cat: any) => cat.id === categoryId);
          if (orgCategory?.escalationPath) {
            categoryEscalationPath = orgCategory.escalationPath;
            categoryFound = true;
            Logger.debug(`📋 [ESCALATION] Using organization category escalation path:`, categoryEscalationPath);
          }
        } catch (error) {
          Logger.warn('⚠️ [ESCALATION] Failed to load organization categories, falling back to universal');
        }
      }

      // Fallback to UniversalCategories if no organization-specific escalation path
      if (!categoryFound) {
        universalCategory = getCategoryById(categoryId);
        if (universalCategory) {
          categoryEscalationPath = universalCategory.escalationPath || ['counselling', 'verbal', 'first_written', 'final_written'];
          categoryFound = true;
          Logger.debug(`📋 [ESCALATION] Using universal category escalation path:`, categoryEscalationPath);
        }
      }

      // Set the category for use in recommendations (prefer org category, fallback to universal)
      const categoryForRecommendation = orgCategory || universalCategory;

      // If still no category found, use fallback
      if (!categoryFound || !categoryEscalationPath) {
        Logger.warn('⚠️ [ESCALATION] Category not found in organization or universal categories, using fallback')
        return this.getFallbackRecommendation(categoryId, organizationId);
      }

      // 🔥 CRITICAL FIX: Filter warnings to only this category
      const categorySpecificWarnings = allActiveWarnings.filter(warning =>
        warning.categoryId === categoryId
      );

      Logger.debug('📋 [ESCALATION] All active warnings:', allActiveWarnings.length)
      Logger.debug('📋 [ESCALATION] Category-specific warnings:', categorySpecificWarnings.length)
      Logger.debug('📋 [ESCALATION] Category ID filter:', categoryId)

      // Use the found escalation path
      const escalationPath = categoryEscalationPath;
      Logger.debug('📋 [ESCALATION] Final escalation path:', escalationPath)
      
      // Determine suggested level based ONLY on category-specific warnings
      const suggestedLevel = this.determineSuggestedLevel(categorySpecificWarnings, escalationPath);
      
      // Check if HR intervention is required
      const requiresHRIntervention = suggestedLevel === 'hr_intervention';
      const finalLevel = requiresHRIntervention ? 'final_written' : suggestedLevel as WarningLevel;
      
      // Build comprehensive recommendation
      const recommendation: EscalationRecommendation = {
        // Core recommendation
        suggestedLevel: finalLevel,
        recommendedLevel: requiresHRIntervention ? 'HR INTERVENTION REQUIRED' : getLevelLabel(finalLevel),
        reason: requiresHRIntervention
          ? this.generateHRInterventionReason(categorySpecificWarnings, categoryForRecommendation)
          : this.generateEscalationReason(categorySpecificWarnings, finalLevel, categoryForRecommendation),
        
        // HR Intervention System
        requiresHRIntervention,
        interventionReason: requiresHRIntervention
          ? `Employee has active final written warning for ${categoryForRecommendation?.name || 'this category'}. Next offense requires manual HR decision through dedicated intervention module.`
          : undefined,
        interventionLevel: requiresHRIntervention ? 'urgent' : undefined,
        
        // Context - 🔥 FIXED: Use simplified summaries to avoid Firestore size limits
        activeWarnings: this.simplifyWarnings(categorySpecificWarnings),
        escalationPath,
        isEscalation: categorySpecificWarnings.length > 0,

        // LRA Compliance
        category: categoryForRecommendation?.name || 'Unknown Category',
        categoryId: categoryForRecommendation?.id || categoryId,
        legalBasis: categoryForRecommendation?.lraSection || 'Schedule 8 Item 3',
        legalRequirements: categoryForRecommendation?.proceduralRequirements || [],

        // Progressive discipline context - 🔥 FIXED: Now counts only category warnings
        warningCount: allActiveWarnings.length, // Total for context
        categoryWarningCount: categorySpecificWarnings.length, // New field for category-specific count
        nextExpiryDate: this.calculateNextExpiryDate(suggestedLevel, categoryForRecommendation?.defaultValidityPeriod || 6),
        examples: categoryForRecommendation?.commonExamples || [],
        explanation: categoryForRecommendation?.escalationRationale || 'Progressive discipline according to LRA Schedule 8',
        previousWarnings: this.simplifyWarnings(categorySpecificWarnings), // 🔥 FIXED: Simplified summaries
        
      };
      
      Logger.success(7929)
      return recommendation;
      
    } catch (error) {
      Logger.error('❌ [ESCALATION] Error generating recommendation:', error)
      return this.getFallbackRecommendation(categoryId, organizationId);
    }
  }

  /**
   * Determine suggested warning level based on active warnings and escalation path
   * 🆕 RESPECTS OVERRIDES: Uses actual issued level, whether system-recommended or manager-overridden
   * Returns 'hr_intervention' when employee has final written warning
   */
  private static determineSuggestedLevel(
    activeWarnings: Warning[],
    escalationPath: WarningLevel[]
  ): WarningLevel | 'hr_intervention' {
    // If no active warnings, start with first level in path
    if (activeWarnings.length === 0) {
      const firstLevel = escalationPath[0] || 'counselling';
      Logger.debug('🆕 [ESCALATION] No active warnings - starting with:', firstLevel)
      return firstLevel;
    }

    // Check if employee already has final written warning
    const hasFinalWritten = activeWarnings.some(warning => warning.level === 'final_written');
    if (hasFinalWritten) {
      Logger.warn('🚨 [HR INTERVENTION] Employee has final written warning - HR intervention required')
      return 'hr_intervention' as any; // Signal for HR intervention
    }

    // 🆕 Find highest level in active warnings (respects overridden levels)
    // This automatically handles custom escalation paths because it uses the ACTUAL level issued,
    // whether that was the system recommendation or a manager override
    let highestCurrentLevel: WarningLevel = escalationPath[0] || 'counselling';
    let highestIndex = -1;
    let wasOverridden = false;

    for (const warning of activeWarnings) {
      const index = escalationPath.indexOf(warning.level);
      if (index > highestIndex) {
        highestIndex = index;
        highestCurrentLevel = warning.level;
        wasOverridden = warning.wasOverridden || false;
      }
    }

    if (wasOverridden) {
      Logger.debug('⚖️ [ESCALATION] Highest warning was manager-overridden, respecting custom path');
    }
    
    Logger.debug(9224)
    
    // Get next level in escalation path
    const currentIndex = escalationPath.indexOf(highestCurrentLevel);
    const nextIndex = currentIndex + 1;
    
    // If we're at or beyond the last step in path, cap at final_written
    if (nextIndex >= escalationPath.length) {
      const finalLevel = 'final_written';
      Logger.debug('⚠️ [ESCALATION] Capping at final written warning:', finalLevel)
      return finalLevel;
    }
    
    const nextLevel = escalationPath[nextIndex];
    Logger.debug('⬆️ [ESCALATION] Suggested next level:', nextLevel)
    return nextLevel;
  }

  /**
   * Generate human-readable escalation reason
   * 🆕 Mentions if previous warnings were overridden
   */
  private static generateEscalationReason(
    activeWarnings: Warning[],
    suggestedLevel: WarningLevel,
    category: any
  ): string {
    if (activeWarnings.length === 0) {
      return `First incident of ${category?.name || 'this category'}. Starting with ${getLevelLabel(suggestedLevel)} follows standard progressive discipline procedures.`;
    }

    const warningCount = activeWarnings.length;
    const lastWarning = activeWarnings[0];
    const daysSince = Math.floor((Date.now() - lastWarning.issueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check if any warnings were overridden
    const hasOverrides = activeWarnings.some(w => w.wasOverridden);
    const overrideNote = hasOverrides ? ' Note: Previous warnings include manager-overridden levels.' : '';

    return `Employee has ${warningCount} active warning${warningCount > 1 ? 's' : ''} on record. Most recent warning was issued ${daysSince} days ago. Progressive discipline policy requires escalation to ${getLevelLabel(suggestedLevel)}.${overrideNote}`;
  }

  /**
   * Generate HR intervention reason when employee has final written warning
   */
  private static generateHRInterventionReason(
    activeWarnings: Warning[],
    category: any
  ): string {
    const finalWarning = activeWarnings.find(w => w.level === 'final_written');
    if (!finalWarning) {
      return `🚨 URGENT: Employee requires HR intervention for ${category?.name || 'this category'} violation.`;
    }

    const daysSinceFinal = Math.floor((Date.now() - finalWarning.issueDate.getTime()) / (1000 * 60 * 60 * 24));
    const warningCount = activeWarnings.length;

    return `🚨 URGENT HR INTERVENTION REQUIRED: Employee has active final written warning for ${category?.name || 'this category'} (issued ${daysSinceFinal} days ago) and has committed another offense. Total active warnings: ${warningCount}. HR must use dedicated intervention module to decide next steps. System cannot escalate beyond final written warning.`;
  }

  /**
   * Calculate next expiry date based on warning level and category defaults
   */
  private static calculateNextExpiryDate(level: WarningLevel, defaultPeriod: number): Date {
    const months = level === 'counselling' ? 3 : 
                  level === 'verbal' ? 6 : 
                  level === 'final_written' ? 12 : 
                  defaultPeriod;
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate;
  }

  /**
   * Assess CCMA readiness based on escalation context
   */
  private static assessCCMAReadiness(
    activeWarnings: Warning[],
    escalationPath: WarningLevel[],
    suggestedLevel: WarningLevel
  ): 'high' | 'medium' | 'low' {
    // High readiness: Following proper progressive discipline
    if (activeWarnings.length >= 2 && suggestedLevel === 'final_written') {
      return 'high';
    }
    
    // Medium readiness: Some warnings but not final stage
    if (activeWarnings.length >= 1) {
      return 'medium';
    }
    
    // Low readiness: First offense
    return 'low';
  }

  // ============================================
  // ACTIVE WARNINGS RETRIEVAL
  // ============================================

  /**
   * Get active warnings for employee using SERVER-SIDE time validation
   * 🔒 FRAUD-PROOF: Uses server time to prevent device clock manipulation
   */
  static async getActiveWarnings(employeeId: string, organizationId?: string): Promise<Warning[]> {
    try {
      Logger.debug('📋 [WARNINGS] Getting active warnings for employee:', employeeId)

      if (!organizationId) {
        Logger.warn('⚠️ [WARNINGS] No organizationId provided, using DataService fallback')
        const org = await DataService.getOrganization();
        organizationId = org.id;
      }

      // 🔒 USE SERVER-SIDE FUNCTION for fraud-proof validation
      const functions = await import('firebase/functions');
      const { getFunctions, httpsCallable } = functions;
      const functionsInstance = getFunctions();
      const getActiveWarningsServerSide = httpsCallable(functionsInstance, 'getActiveWarningsServerSide');

      const result = await getActiveWarningsServerSide({
        employeeId,
        organizationId
      });

      if (result.data && typeof result.data === 'object' && 'success' in result.data && result.data.success) {
        const data = result.data as { success: boolean; warnings: any[]; serverTime: string };
        const warnings = data.warnings.map(w => ({
          ...w,
          issueDate: new Date(w.issueDate),
          expiryDate: new Date(w.expiryDate),
          incidentDate: new Date(w.incidentDate),
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt),
          deliveryDate: w.deliveryDate ? new Date(w.deliveryDate) : undefined,
          signatureDate: w.signatureDate ? new Date(w.signatureDate) : undefined
        })) as Warning[];

        Logger.success(`📋 [WARNINGS] Retrieved ${warnings.length} active warnings using SERVER time (${data.serverTime})`);
        return warnings;
      }

      Logger.warn('⚠️ [WARNINGS] Server function returned unexpected result, using fallback');
      return [];

    } catch (error) {
      Logger.error('❌ [WARNINGS] Error getting active warnings from server, using client fallback:', error)

      // Fallback to client-side query if server function fails
      try {
        const warningsRef = collection(db, 'organizations', organizationId!, 'warnings');
        const q = query(
          warningsRef,
          where('employeeId', '==', employeeId),
          where('isActive', '==', true),
          orderBy('issueDate', 'desc')
        );

        const snapshot = await getDocs(q);
        const warnings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          issueDate: doc.data().issueDate?.toDate() || new Date(),
          expiryDate: doc.data().expiryDate?.toDate() || new Date(),
          incidentDate: doc.data().incidentDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Warning[];

        Logger.warn(`⚠️ [WARNINGS] Fallback succeeded with ${warnings.length} warnings (client time)`);
        return warnings;
      } catch (fallbackError) {
        Logger.error('❌ [WARNINGS] Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Fallback recommendation when errors occur
   */
  private static getFallbackRecommendation(
    categoryId: string, 
    organizationId?: string
  ): EscalationRecommendation {
    const defaultLevel: WarningLevel = 'counselling';
    
    return {
      // Core fields
      suggestedLevel: defaultLevel,
      recommendedLevel: getLevelLabel(defaultLevel),
      reason: 'Unable to analyze warning history - defaulting to counselling for safety',
      activeWarnings: [],
      escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
      isEscalation: false,

      // LRA compliance
      category: 'General Misconduct',
      categoryId: categoryId || 'general',
      legalBasis: 'LRA Section 188 - Fair reason and procedure',
      legalRequirements: ['Ensure fair and consistent application of disciplinary procedures'],

      // Progressive discipline context
      warningCount: 0,
      nextExpiryDate: this.calculateNextExpiryDate(defaultLevel, 6),
      examples: ['System error occurred - manual review required'],
      explanation: 'System error occurred - defaulting to safest disciplinary option',
      previousWarnings: [],

      // CCMA compliance
      ccmaReadiness: 'low',
      ccmaFactors: ['Follow basic progressive discipline principles']
    };
  }

  /**
   * Normalize warning level strings to standard format
   */
  static normalizeWarningLevel(level: string): WarningLevel {
    const normalized = level.toLowerCase().replace(/\s+/g, '_');
    
    const mapping: Record<string, WarningLevel> = {
      'counselling': 'counselling',
      'counseling': 'counselling',
      'verbal': 'verbal',
      'verbal_warning': 'verbal',
      'first_written': 'first_written',
      'first_written_warning': 'first_written',
      'second_written': 'second_written',
      'second_written_warning': 'second_written',
      'final_written': 'final_written',
      'final_written_warning': 'final_written'
    };
    
    return mapping[normalized] || 'counselling';
  }

  // ============================================
  // WARNING CRUD OPERATIONS
  // ============================================

  /**
   * Save warning to database
   */
  static async saveWarning(warningData: Partial<Warning>, organizationId: string): Promise<string> {
    try {
      Logger.debug('💾 [SAVE] Saving warning to database...')

      const warningRef = warningData.id ?
        doc(db, 'organizations', organizationId, 'warnings', warningData.id) :
        doc(collection(db, 'organizations', organizationId, 'warnings'));

      // Convert date strings to proper Timestamps
      const issueDate = warningData.issueDate
        ? (typeof warningData.issueDate === 'string' ? new Date(warningData.issueDate) : warningData.issueDate)
        : new Date();

      const incidentDate = warningData.incidentDate
        ? (typeof warningData.incidentDate === 'string' ? new Date(warningData.incidentDate) : warningData.incidentDate)
        : new Date();

      // Calculate expiry date based on validity period (default 6 months)
      const validityMonths = warningData.validityPeriod || 6;
      const expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

      const dataToSave = {
        ...warningData,
        organizationId,
        issueDate: Timestamp.fromDate(issueDate),
        expiryDate: Timestamp.fromDate(expiryDate),
        incidentDate: Timestamp.fromDate(incidentDate),
        updatedAt: TimeService.getServerTimestamp(),
        ...(warningData.id ? {} : { createdAt: TimeService.getServerTimestamp() })
      };

      if (warningData.id) {
        // Update existing document
        await updateDoc(warningRef, dataToSave as any);
      } else {
        // Create new document
        await setDoc(warningRef, dataToSave as any);
      }

      Logger.success(16339)
      return warningRef.id;

    } catch (error) {
      Logger.error('❌ [SAVE] Error saving warning:', error)
      throw error;
    }
  }

  /**
   * Get warning by ID
   */
  static async getWarningById(warningId: string): Promise<Warning | null> {
    try {
      // Need organizationId to construct sharded path - get from user context
      const organization = await DataService.getOrganization();
      const warningRef = doc(db, 'organizations', organization.id, 'warnings', warningId);
      const warningDoc = await getDoc(warningRef);
      
      if (!warningDoc.exists()) {
        return null;
      }
      
      return {
        id: warningDoc.id,
        ...warningDoc.data(),
        issueDate: warningDoc.data().issueDate?.toDate() || new Date(),
        expiryDate: warningDoc.data().expiryDate?.toDate() || new Date(),
        incidentDate: warningDoc.data().incidentDate?.toDate() || new Date(),
        createdAt: warningDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: warningDoc.data().updatedAt?.toDate() || new Date()
      } as Warning;
      
    } catch (error) {
      Logger.error('❌ [GET] Error getting warning by ID:', error)
      return null;
    }
  }
}

