// frontend/src/services/warning/EscalationEngine.ts
//
// Progressive-discipline escalation logic extracted from WarningService.ts in
// Phase 2 Tier 3A. The escalation recommendation engine analyses an employee's
// active warning history against the relevant category's escalation path and
// returns a structured `EscalationRecommendation` (suggested level, reason,
// LRA legal basis, HR-intervention flag, etc.).
//
// I/O dependency: `getActiveWarnings` lives on `WarningService` (fraud-proof
// server-time validation via Cloud Function). EscalationEngine imports
// `WarningService` for that call. TypeScript handles the module cycle fine
// since the reference is inside method bodies (lazy resolution at call time)
// rather than top-level code.

import { DatabaseShardingService } from '../DatabaseShardingService';
import { getCategoryById, getLevelLabel } from '../UniversalCategories';
import Logger from '../../utils/logger';
import { WarningService } from '../WarningService';
import type {
  Warning,
  WarningLevel,
  EscalationRecommendation,
  SimplifiedWarningSummary,
} from './types';

export class EscalationEngine {

  // ============================================
  // HELPER METHODS - SIMPLIFIED WARNING SUMMARIES
  // ============================================

  /**
   * 🔥 CRITICAL: Convert full Warning object to simplified summary.
   * Prevents Firestore document size limit issues when storing recommendations.
   * Full warnings with audio recordings and signatures can exceed 1MB.
   */
  private static simplifyWarning(warning: Warning): SimplifiedWarningSummary {
    // Keep dates as Date objects — Firestore handles them correctly via Timestamps.
    // Converting to ISO strings caused timezone shifts in prior implementations.
    Logger.debug('🔍 [SIMPLIFY] Storing warning dates as Date objects:', {
      warningId: warning.id,
      issueDate: warning.issueDate,
      incidentDate: warning.incidentDate,
    });

    return {
      id: warning.id || '',
      level: warning.level,
      category: warning.category || 'Unknown Category',
      description: warning.description || warning.title || 'No description',
      issueDate: warning.issueDate,
      incidentDate: warning.incidentDate,
      employeeName: warning.employeeName,
      employeeNumber: warning.employeeNumber,
    };
  }

  /**
   * Convert array of full Warning objects to simplified summaries.
   */
  private static simplifyWarnings(warnings: Warning[]): SimplifiedWarningSummary[] {
    return warnings.map(w => this.simplifyWarning(w));
  }

  // ============================================
  // ESCALATION RECOMMENDATION ENGINE
  // ============================================

  /**
   * Generate escalation recommendation based on employee history.
   * Uses UniversalCategories as single source of truth.
   * 🔥 Returns simplified warning summaries to avoid Firestore size limits.
   */
  static async getEscalationRecommendation(
    employeeId: string,
    categoryId: string,
    organizationId?: string,
    providedCategory?: any, // 🚀 PERFORMANCE: Accept pre-loaded category to skip Firestore query
    preloadedWarnings?: any[] // 🚀 ANTICIPATORY: Accept pre-loaded warnings for instant response
  ): Promise<EscalationRecommendation> {
    try {
      Logger.debug(5184);

      // 🚀 PERFORMANCE OPTIMIZATION: Use preloaded data when available
      let allActiveWarnings: any[];
      let orgCategory: any = null;

      if (preloadedWarnings && providedCategory) {
        // ⚡⚡ FASTEST PATH: Both warnings and category preloaded - ZERO queries!
        Logger.success('⚡⚡ [ANTICIPATORY] Using preloaded warnings AND category - instant response!');
        allActiveWarnings = preloadedWarnings;
        orgCategory = providedCategory;
      } else if (preloadedWarnings) {
        // ⚡ FAST PATH: Warnings preloaded, only need category
        Logger.success('⚡ [ANTICIPATORY] Using preloaded warnings, fetching category only');
        allActiveWarnings = preloadedWarnings;
        if (organizationId) {
          const categories = await DatabaseShardingService.queryDocuments(organizationId, 'categories', []);
          if (categories.documents && categories.documents.length > 0) {
            orgCategory = categories.documents.find((cat: any) => cat.id === categoryId);
          }
        }
      } else if (providedCategory) {
        // ⚡ FAST PATH: Category provided, only fetch warnings
        Logger.debug('⚡ [PERFORMANCE] Using provided category, fetching warnings only');
        allActiveWarnings = await WarningService.getActiveWarnings(employeeId, organizationId!);
        orgCategory = providedCategory;
      } else {
        // 🔄 FALLBACK PATH: Fetch both in parallel for best performance
        Logger.debug('🔄 [PERFORMANCE] Fetching warnings and categories in parallel');
        const [warnings, categories] = await Promise.all([
          WarningService.getActiveWarnings(employeeId, organizationId!),
          organizationId
            ? DatabaseShardingService.queryDocuments(organizationId, 'categories', [])
            : Promise.resolve({ documents: [] }),
        ]);

        allActiveWarnings = warnings;
        if (categories.documents && categories.documents.length > 0) {
          orgCategory = categories.documents.find((cat: any) => cat.id === categoryId);
        }
      }

      // 🔧 Determine escalation path from category or fallback to universal
      let categoryEscalationPath: string[] | null = null;
      let categoryFound = false;
      let universalCategory: any = null;

      if (orgCategory?.escalationPath) {
        categoryEscalationPath = orgCategory.escalationPath;
        categoryFound = true;
        Logger.debug(`📋 [ESCALATION] Using organization category escalation path:`, categoryEscalationPath);
      }

      if (!categoryFound) {
        universalCategory = getCategoryById(categoryId);
        if (universalCategory) {
          categoryEscalationPath = universalCategory.escalationPath || ['counselling', 'verbal', 'first_written', 'final_written'];
          categoryFound = true;
          Logger.debug(`📋 [ESCALATION] Using universal category escalation path:`, categoryEscalationPath);
        }
      }

      const categoryForRecommendation = orgCategory || universalCategory;

      if (!categoryFound || !categoryEscalationPath) {
        Logger.warn('⚠️ [ESCALATION] Category not found in organization or universal categories, using fallback');
        return this.getFallbackRecommendation(categoryId, organizationId);
      }

      // 🔥 CRITICAL FIX: Filter warnings to only this category
      const categorySpecificWarnings = allActiveWarnings.filter(warning =>
        warning.categoryId === categoryId
      );

      Logger.debug('📋 [ESCALATION] All active warnings:', allActiveWarnings.length);
      Logger.debug('📋 [ESCALATION] Category-specific warnings:', categorySpecificWarnings.length);
      Logger.debug('📋 [ESCALATION] Category ID filter:', categoryId);

      const escalationPath = categoryEscalationPath;
      Logger.debug('📋 [ESCALATION] Final escalation path:', escalationPath);

      const suggestedLevel = this.determineSuggestedLevel(categorySpecificWarnings, escalationPath as WarningLevel[]);

      const requiresHRIntervention = suggestedLevel === 'hr_intervention';
      const isDismissalLevel = suggestedLevel === 'dismissal';
      const finalLevel = requiresHRIntervention ? 'final_written'
                       : isDismissalLevel ? 'dismissal' as WarningLevel
                       : suggestedLevel as WarningLevel;

      const recommendation: EscalationRecommendation = {
        suggestedLevel: finalLevel,
        recommendedLevel: requiresHRIntervention ? 'HR INTERVENTION REQUIRED'
                        : isDismissalLevel ? 'DISMISSAL — HR MUST HANDLE'
                        : getLevelLabel(finalLevel),
        reason: requiresHRIntervention
          ? this.generateHRInterventionReason(categorySpecificWarnings, categoryForRecommendation)
          : isDismissalLevel
          ? `This offense requires immediate HR involvement. The employee's disciplinary history and the severity of this category indicate that dismissal proceedings may be appropriate. This must be handled by HR through a formal process.`
          : this.generateEscalationReason(categorySpecificWarnings, finalLevel, categoryForRecommendation),

        requiresHRIntervention: requiresHRIntervention || isDismissalLevel,
        interventionReason: requiresHRIntervention
          ? `Employee has active final written warning for ${categoryForRecommendation?.name || 'this category'}. Next offense requires manual HR decision through dedicated intervention module.`
          : isDismissalLevel
          ? `This offense requires immediate HR involvement. The employee's disciplinary history and the severity of this category indicate that dismissal proceedings may be appropriate. This must be handled by HR through a formal process.`
          : undefined,
        interventionLevel: (requiresHRIntervention || isDismissalLevel) ? 'urgent' : undefined,

        // Context — simplified summaries to avoid Firestore size limits
        activeWarnings: this.simplifyWarnings(categorySpecificWarnings),
        escalationPath: escalationPath as WarningLevel[],
        isEscalation: categorySpecificWarnings.length > 0,

        // LRA Compliance
        category: categoryForRecommendation?.name || 'Unknown Category',
        categoryId: categoryForRecommendation?.id || categoryId,
        legalBasis: categoryForRecommendation?.lraSection || 'Schedule 8 Item 3',
        legalRequirements: categoryForRecommendation?.proceduralRequirements || [],

        // Progressive discipline context
        warningCount: allActiveWarnings.length,
        categoryWarningCount: categorySpecificWarnings.length,
        nextExpiryDate: this.calculateNextExpiryDate(suggestedLevel as WarningLevel, categoryForRecommendation?.defaultValidityPeriod || 6),
        examples: categoryForRecommendation?.commonExamples || [],
        explanation: categoryForRecommendation?.escalationRationale || 'Progressive discipline according to LRA Schedule 8',
        previousWarnings: this.simplifyWarnings(categorySpecificWarnings),
      };

      Logger.success(7929);
      return recommendation;

    } catch (error) {
      Logger.error('❌ [ESCALATION] Error generating recommendation:', error);
      return this.getFallbackRecommendation(categoryId, organizationId);
    }
  }

  /**
   * Determine suggested warning level based on active warnings and escalation path.
   * 🆕 RESPECTS OVERRIDES: Uses actual issued level (system-recommended or manager-overridden).
   * Returns 'hr_intervention' when employee has final written warning with nothing after it in the path.
   */
  private static determineSuggestedLevel(
    activeWarnings: Warning[],
    escalationPath: WarningLevel[]
  ): WarningLevel | 'hr_intervention' {
    if (activeWarnings.length === 0) {
      const firstLevel = escalationPath[0] || 'counselling';
      Logger.debug('🆕 [ESCALATION] No active warnings - starting with:', firstLevel);
      return firstLevel;
    }

    // Check if employee already has final written warning.
    // Only trigger hr_intervention if the path has no step after final_written
    // (paths with 'dismissal' after 'final_written' should traverse naturally).
    const hasFinalWritten = activeWarnings.some(warning => warning.level === 'final_written');
    if (hasFinalWritten) {
      const finalIndex = escalationPath.indexOf('final_written');
      const hasNextStep = finalIndex >= 0 && finalIndex < escalationPath.length - 1;
      if (!hasNextStep) {
        Logger.warn('🚨 [HR INTERVENTION] Employee has final written warning - HR intervention required');
        return 'hr_intervention' as any;
      }
    }

    // 🆕 Find highest level in active warnings (respects overridden levels)
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

    Logger.debug(9224);

    const currentIndex = escalationPath.indexOf(highestCurrentLevel);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= escalationPath.length) {
      const lastLevel = escalationPath[escalationPath.length - 1];
      Logger.debug('⚠️ [ESCALATION] At end of escalation path, returning:', lastLevel);
      return lastLevel;
    }

    const nextLevel = escalationPath[nextIndex];
    Logger.debug('⬆️ [ESCALATION] Suggested next level:', nextLevel);
    return nextLevel;
  }

  /**
   * Generate human-readable escalation reason.
   * 🆕 Mentions if previous warnings were overridden.
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
    const daysSince = Math.floor((Date.now() - (lastWarning.issueDate as Date).getTime()) / (1000 * 60 * 60 * 24));

    const hasOverrides = activeWarnings.some(w => w.wasOverridden);
    const overrideNote = hasOverrides ? ' Note: Previous warnings include manager-overridden levels.' : '';

    return `Employee has ${warningCount} active warning${warningCount > 1 ? 's' : ''} on record. Most recent warning was issued ${daysSince} days ago. Progressive discipline policy requires escalation to ${getLevelLabel(suggestedLevel)}.${overrideNote}`;
  }

  /**
   * Generate HR intervention reason when employee has final written warning.
   */
  private static generateHRInterventionReason(
    activeWarnings: Warning[],
    category: any
  ): string {
    const finalWarning = activeWarnings.find(w => w.level === 'final_written');
    if (!finalWarning) {
      return `🚨 URGENT: Employee requires HR intervention for ${category?.name || 'this category'} violation.`;
    }

    const daysSinceFinal = Math.floor((Date.now() - (finalWarning.issueDate as Date).getTime()) / (1000 * 60 * 60 * 24));
    const warningCount = activeWarnings.length;

    return `🚨 URGENT HR INTERVENTION REQUIRED: Employee has active final written warning for ${category?.name || 'this category'} (issued ${daysSinceFinal} days ago) and has committed another offense. Total active warnings: ${warningCount}. HR must use dedicated intervention module to decide next steps. System cannot escalate beyond final written warning.`;
  }

  /**
   * Calculate next expiry date based on warning level and category defaults.
   */
  private static calculateNextExpiryDate(level: WarningLevel, defaultPeriod: number): Date {
    const months = level === 'counselling' ? 3
                 : level === 'verbal' ? 6
                 : level === 'final_written' ? 12
                 : defaultPeriod;

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate;
  }

  /**
   * Assess CCMA readiness based on escalation context.
   * NOTE: Currently unreferenced by `getEscalationRecommendation` — preserved
   *       verbatim from the pre-3A code in case external callers ever invoke it.
   */
  private static assessCCMAReadiness(
    activeWarnings: Warning[],
    _escalationPath: WarningLevel[],
    suggestedLevel: WarningLevel
  ): 'high' | 'medium' | 'low' {
    if (activeWarnings.length >= 2 && suggestedLevel === 'final_written') return 'high';
    if (activeWarnings.length >= 1) return 'medium';
    return 'low';
  }

  /**
   * Fallback recommendation when errors occur. Preserves the pre-3A return
   * shape verbatim — note `ccmaReadiness`/`ccmaFactors` are not declared on
   * `EscalationRecommendation`; the cast tolerates the extra fields. Cleanup
   * candidate for a future sitting that either adds those fields to the
   * interface or removes them here.
   */
  private static getFallbackRecommendation(
    categoryId: string,
    _organizationId?: string
  ): EscalationRecommendation {
    const defaultLevel: WarningLevel = 'counselling';

    return {
      suggestedLevel: defaultLevel,
      recommendedLevel: getLevelLabel(defaultLevel),
      reason: 'Unable to analyze warning history - defaulting to counselling for safety',
      requiresHRIntervention: false,
      activeWarnings: [],
      escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
      isEscalation: false,

      category: 'General Misconduct',
      categoryId: categoryId || 'general',
      legalBasis: 'LRA Section 188 - Fair reason and procedure',
      legalRequirements: ['Ensure fair and consistent application of disciplinary procedures'],

      warningCount: 0,
      nextExpiryDate: this.calculateNextExpiryDate(defaultLevel, 6),
      examples: ['System error occurred - manual review required'],
      explanation: 'System error occurred - defaulting to safest disciplinary option',
      previousWarnings: [],

      // Extra fields preserved from pre-3A shape — see method-level comment
      ccmaReadiness: 'low',
      ccmaFactors: ['Follow basic progressive discipline principles'],
    } as EscalationRecommendation;
  }
}
