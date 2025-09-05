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
  
  // Administrative
  issueDate: Date;
  expiryDate: Date;
  validityPeriod: 3 | 6 | 12; // months
  issuedBy: string; // manager/HR ID
  
  // Status
  isActive: boolean;
  isSigned: boolean;
  isDelivered: boolean;
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'issued';
  
  // Delivery
  deliveryMethod: DeliveryMethod;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'cancelled';
  deliveryDate?: Date;
  
  // Signatures
  managerSignature?: string;
  employeeSignature?: string;
  witnessSignatures?: string[];
  signatureDate?: Date;
  
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

export interface EscalationRecommendation {
  // Core recommendation
  suggestedLevel: WarningLevel;
  recommendedLevel: string;
  reason: string;
  
  // Context
  activeWarnings: Warning[];
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
  previousWarnings: Warning[];
  
}

// ============================================
// 🎯 WARNING SERVICE CLASS - CLEANED & STREAMLINED
// ============================================

export class WarningService {
  
  // ============================================
  // ESCALATION RECOMMENDATION ENGINE
  // ============================================

  /**
   * Generate escalation recommendation based on employee history
   * Now uses UniversalCategories as single source of truth
   */
  static async getEscalationRecommendation(
    employeeId: string,
    categoryId: string,
    organizationId?: string
  ): Promise<EscalationRecommendation> {
    try {
      console.log('🎯 [ESCALATION] Getting recommendation...', { employeeId, categoryId });
      
      // Get all active warnings for employee
      const allActiveWarnings = await this.getActiveWarnings(employeeId, organizationId);
      
      // Get category from UniversalCategories
      const universalCategory = getCategoryById(categoryId);
      if (!universalCategory) {
        console.warn('⚠️ [ESCALATION] Category not found in UniversalCategories, using fallback');
        return this.getFallbackRecommendation(categoryId, organizationId);
      }
      
      // 🔥 CRITICAL FIX: Filter warnings to only this category
      const categorySpecificWarnings = allActiveWarnings.filter(warning => 
        warning.categoryId === categoryId
      );
      
      console.log('📋 [ESCALATION] All active warnings:', allActiveWarnings.length);
      console.log('📋 [ESCALATION] Category-specific warnings:', categorySpecificWarnings.length);
      console.log('📋 [ESCALATION] Category ID filter:', categoryId);
      
      // Get escalation path from UniversalCategories
      const escalationPath = getEscalationPath(categoryId);
      console.log('📋 [ESCALATION] Using escalation path:', escalationPath);
      
      // Determine suggested level based ONLY on category-specific warnings
      const suggestedLevel = this.determineSuggestedLevel(categorySpecificWarnings, escalationPath);
      
      // Build comprehensive recommendation
      const recommendation: EscalationRecommendation = {
        // Core recommendation
        suggestedLevel,
        recommendedLevel: getLevelLabel(suggestedLevel),
        reason: this.generateEscalationReason(categorySpecificWarnings, suggestedLevel, universalCategory),
        
        // Context - 🔥 FIXED: Now shows category-specific warnings only
        activeWarnings: categorySpecificWarnings,
        escalationPath,
        isEscalation: categorySpecificWarnings.length > 0,
        
        // LRA Compliance
        category: universalCategory.name,
        categoryId: universalCategory.id,
        legalBasis: universalCategory.lraSection,
        legalRequirements: universalCategory.proceduralRequirements,
        
        // Progressive discipline context - 🔥 FIXED: Now counts only category warnings
        warningCount: allActiveWarnings.length, // Total for context
        categoryWarningCount: categorySpecificWarnings.length, // New field for category-specific count
        nextExpiryDate: this.calculateNextExpiryDate(suggestedLevel, universalCategory.defaultValidityPeriod),
        examples: universalCategory.commonExamples,
        explanation: universalCategory.escalationRationale,
        previousWarnings: categorySpecificWarnings,
        
      };
      
      console.log('✅ [ESCALATION] Generated recommendation:', recommendation);
      return recommendation;
      
    } catch (error) {
      console.error('❌ [ESCALATION] Error generating recommendation:', error);
      return this.getFallbackRecommendation(categoryId, organizationId);
    }
  }

  /**
   * Determine suggested warning level based on active warnings and escalation path
   */
  private static determineSuggestedLevel(
    activeWarnings: Warning[],
    escalationPath: WarningLevel[]
  ): WarningLevel {
    // If no active warnings, start with first level in path
    if (activeWarnings.length === 0) {
      const firstLevel = escalationPath[0] || 'counselling';
      console.log('🆕 [ESCALATION] No active warnings - starting with:', firstLevel);
      return firstLevel;
    }
    
    // Find highest level in active warnings
    let highestCurrentLevel: WarningLevel = escalationPath[0] || 'counselling';
    let highestIndex = -1;
    
    for (const warning of activeWarnings) {
      const index = escalationPath.indexOf(warning.level);
      if (index > highestIndex) {
        highestIndex = index;
        highestCurrentLevel = warning.level;
      }
    }
    
    console.log('🎯 [ESCALATION] Highest current level:', highestCurrentLevel, 'at index:', highestIndex);
    
    // Escalate to next level
    const nextLevel = getNextEscalationLevel('', highestCurrentLevel) || 
                     escalationPath[escalationPath.length - 1];
    
    console.log('⬆️ [ESCALATION] Suggested next level:', nextLevel);
    return nextLevel;
  }

  /**
   * Generate human-readable escalation reason
   */
  private static generateEscalationReason(
    activeWarnings: Warning[],
    suggestedLevel: WarningLevel,
    category: UniversalCategory
  ): string {
    if (activeWarnings.length === 0) {
      return `First incident of ${category.name}. Starting with ${getLevelLabel(suggestedLevel)} follows standard progressive discipline procedures.`;
    }

    const warningCount = activeWarnings.length;
    const lastWarning = activeWarnings[0];
    const daysSince = Math.floor((Date.now() - lastWarning.issueDate.getTime()) / (1000 * 60 * 60 * 24));

    return `Employee has ${warningCount} active warning${warningCount > 1 ? 's' : ''} on record. Most recent warning was issued ${daysSince} days ago. Progressive discipline policy requires escalation to ${getLevelLabel(suggestedLevel)}.`;
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
    if (activeWarnings.length >= 2 && suggestedLevel === 'dismissal') {
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
   * Get active warnings for employee
   */
  static async getActiveWarnings(employeeId: string, organizationId?: string): Promise<Warning[]> {
    try {
      console.log('📋 [WARNINGS] Getting active warnings for employee:', employeeId);
      
      if (!organizationId) {
        console.warn('⚠️ [WARNINGS] No organizationId provided, using DataService fallback');
        return await DataService.getActiveWarningsForEmployee(employeeId);
      }
      
      const warningsRef = collection(db, 'warnings');
      const q = query(
        warningsRef,
        where('employeeId', '==', employeeId),
        where('organizationId', '==', organizationId),
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
      
      console.log('✅ [WARNINGS] Found active warnings:', warnings.length);
      return warnings;
      
    } catch (error) {
      console.error('❌ [WARNINGS] Error getting active warnings:', error);
      return [];
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
      escalationPath: ['counselling', 'verbal', 'first_written', 'final_written', 'dismissal'],
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
      'final_written_warning': 'final_written',
      'suspension': 'suspension',
      'dismissal': 'dismissal'
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
      console.log('💾 [SAVE] Saving warning to database...');
      
      const warningRef = warningData.id ? 
        doc(db, 'warnings', warningData.id) : 
        doc(collection(db, 'warnings'));

      const dataToSave = {
        ...warningData,
        organizationId,
        updatedAt: new Date(),
        ...(warningData.id ? {} : { createdAt: new Date() })
      };

      if (warningData.id) {
        // Update existing document
        await updateDoc(warningRef, dataToSave as any);
      } else {
        // Create new document
        await setDoc(warningRef, dataToSave as any);
      }
      
      console.log('✅ [SAVE] Warning saved successfully:', warningRef.id);
      return warningRef.id;
      
    } catch (error) {
      console.error('❌ [SAVE] Error saving warning:', error);
      throw error;
    }
  }

  /**
   * Get warning by ID
   */
  static async getWarningById(warningId: string): Promise<Warning | null> {
    try {
      const warningRef = doc(db, 'warnings', warningId);
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
      console.error('❌ [GET] Error getting warning by ID:', error);
      return null;
    }
  }
}

// ============================================
// 🎯 SIMPLIFIED AI SERVICE
// ============================================

export class SimplifiedAIService {
  /**
   * Generate smart suggestions for incident description
   */
  static generateSmartSuggestions(
    categoryId: string, 
    employeeHistory: Warning[] = []
  ): string[] {
    const category = getCategoryById(categoryId);
    
    if (!category) {
      return [
        'Include date, time, and location of the incident',
        'Describe the observed behavior objectively',
        'Note any witnesses present during the incident',
        'Reference any relevant company policies violated'
      ];
    }

    const suggestions = [
      `Consider these common ${category.name.toLowerCase()} examples:`,
      ...category.commonExamples.slice(0, 3),
      'Include specific details with dates and times',
      'Note any witnesses present during the incident'
    ];

    if (employeeHistory.length > 0) {
      suggestions.push(
        'Reference any patterns from previous incidents',
        'Note if this represents an escalation in severity'
      );
    }

    return suggestions;
  }

  /**
   * Generate category-specific legal guidance
   */
  static generateLegalGuidance(categoryId: string, level: WarningLevel): string[] {
    const category = getCategoryById(categoryId);
    
    if (!category) {
      return [
        'Ensure fair and consistent application of disciplinary procedures',
        'Maintain confidentiality throughout the process',
        'Allow employee opportunity to respond',
        'Document all interactions thoroughly'
      ];
    }

    return [
      ...category.proceduralRequirements.slice(0, 4),
      `Level: ${getLevelLabel(level)} - ensure appropriate escalation`,
      'Document all interactions thoroughly'
    ];
  }
}