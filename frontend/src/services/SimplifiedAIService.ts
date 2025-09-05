// src/services/simplified/SimplifiedAIService.ts
// =============================================
// 🔧 COMPLETE FIXED SIMPLIFIED AI SERVICE - PROPER VALIDITY & TRANSPARENCY
// ✅ Includes proper warning validity checking (expiry dates)
// ✅ Only counts warnings for the SAME CATEGORY (progressive discipline per category)
// ✅ Shows WHY recommendation was made (active warnings with details)
// ✅ Complete feature set + enhanced functionality
// =============================================
import { auth } from '../../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UniversalEscalationService, UNIVERSAL_SA_CATEGORIES } from './UniversalCategories';

export interface LRACompliantRecommendation {
  // Core recommendation
  recommendedLevel: WarningLevel;
  category: string;
  
  // LRA Compliance
  legalBasis: string;
  proceduralSteps: string[];
  evidenceRequired: string[];
  
  // Progressive Discipline
  progressivePath: WarningLevel[];
  canSkipSteps: boolean;
  
  // CCMA Readiness
  ccmaReadiness: 'high' | 'medium' | 'low';
  ccmaRiskFactors: string[];
  
  // Timing
  minimumNotice: number; // hours
  hearingRequired: boolean;
  
  // Documentation
  requiredDocuments: string[];
  templateSuggestions: string[];
  
  // User-friendly explanation
  summary: string;
  nextSteps: string[];
  
  // ✅ NEW: Enhanced Transparency - Show WHY recommendation was made
  escalationJustification: {
    activeWarningsCount: number;
    activeWarningsForCategory: number;
    previousWarnings: Array<{
      id: string;
      level: string;
      levelLabel: string;
      date: Date;
      category: string;
      description: string;
      expiryDate: Date;
      daysRemaining: number;
      issuedBy: string;
      issuedByName?: string;
      formattedDate: string;
    }>;
    explanation: string;
    detailedExplanation: string;
    isEscalation: boolean;
    escalationReason: string;
  };
}

export type WarningLevel = 
  | 'counselling' 
  | 'verbal_warning' 
  | 'first_written' 
  | 'final_written' 
  | 'suspension' 
  | 'dismissal';

// =============================================
// 🔧 COMPLETE SIMPLIFIED AI SERVICE WITH PROPER VALIDITY
// =============================================

export class SimplifiedAIService {
  
  /**
   * 🔧 MAIN AI RECOMMENDATION - NOW WITH PROPER VALIDITY & CATEGORY-SPECIFIC ESCALATION
   */
  static async getRecommendation(
    employeeId: string,
    categoryId: string,
    incidentDescription: string,
    organizationId: string,
    employeeData?: {
      warningHistory: any[];
      lengthOfService: number; // months
      position: string;
      department: string;
    }
  ): Promise<LRACompliantRecommendation> {
    
    try {
      console.log('🎯 Using simplified LRA-compliant analysis');
      console.log('📊 Input data:', { employeeId, categoryId, organizationId });
      
      // ✅ CRITICAL FIX: FETCH AND FILTER EMPLOYEE WARNING HISTORY PROPERLY
      const { validCategoryWarnings, allValidWarnings, allWarnings } = await this.fetchAndFilterWarningHistory(
        employeeId, 
        organizationId, 
        categoryId
      );
      
      console.log('📋 Warning history breakdown:', {
        total: allWarnings.length,
        valid: allValidWarnings.length,
        validForCategory: validCategoryWarnings.length
      });
      
      // Get category details
      const category = UNIVERSAL_SA_CATEGORIES.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error(`Invalid category: ${categoryId}`);
      }

      // Analyze incident severity
      const incidentSeverity = this.analyzeIncidentSeverity(incidentDescription, category);
      console.log('🔍 Incident severity:', incidentSeverity);
      
      // Get employee context
      const lengthOfService = employeeData?.lengthOfService || 0;
      
      // ✅ CRITICAL FIX: USE ONLY VALID WARNINGS FOR THE SAME CATEGORY
      const escalationAnalysis = UniversalEscalationService.analyzeEscalation(
        categoryId,
        validCategoryWarnings, // <- NOW PASSING ONLY VALID CATEGORY-SPECIFIC WARNINGS!
        incidentSeverity,
        lengthOfService
      );
      
      console.log('🚀 Escalation analysis result:', escalationAnalysis.recommendedLevel);
      console.log('📊 Based on', validCategoryWarnings.length, 'valid warnings for category', categoryId);
      
      // ✅ NEW: Build escalation justification for transparency
      const escalationJustification = this.buildEscalationJustification(
        validCategoryWarnings,
        allValidWarnings,
        escalationAnalysis,
        category
      );

      // Build comprehensive recommendation
      const recommendation: LRACompliantRecommendation = {
        recommendedLevel: escalationAnalysis.recommendedLevel,
        category: category.name,
        
        legalBasis: escalationAnalysis.legalBasis,
        proceduralSteps: this.getProceduralSteps(escalationAnalysis.recommendedLevel, category),
        evidenceRequired: category.evidenceRequired,
        
        progressivePath: category.escalationPath,
        canSkipSteps: category.severity === 'gross_misconduct',
        
        ccmaReadiness: escalationAnalysis.ccmaReadiness,
        ccmaRiskFactors: escalationAnalysis.riskFactors,
        
        minimumNotice: this.getMinimumNotice(escalationAnalysis.recommendedLevel),
        hearingRequired: this.requiresHearing(escalationAnalysis.recommendedLevel),
        
        requiredDocuments: this.getRequiredDocuments(escalationAnalysis.recommendedLevel, category),
        templateSuggestions: this.getTemplateSuggestions(escalationAnalysis.recommendedLevel),
        
        summary: this.generateSummary(escalationAnalysis, category, incidentSeverity),
        nextSteps: this.generateNextSteps(escalationAnalysis.recommendedLevel, category),
        
        // ✅ NEW: Show why recommendation was made
        escalationJustification
      };

      console.log('✅ Generated LRA-compliant recommendation:', recommendation.recommendedLevel);
      console.log('💡 Justification:', escalationJustification.explanation);
      
      return recommendation;
      
    } catch (error) {
      console.error('❌ Error in simplified AI recommendation:', error);
      
      // Fallback to safe recommendation
      return this.getFallbackRecommendation(categoryId);
    }
  }

  /**
   * 🔧 NEW: FETCH AND PROPERLY FILTER WARNING HISTORY
   * Handles validity (expiry dates) and category filtering correctly
   */
  private static async fetchAndFilterWarningHistory(
    employeeId: string,
    organizationId: string,
    targetCategoryId: string
  ): Promise<{
    validCategoryWarnings: any[];
    allValidWarnings: any[];
    allWarnings: any[];
  }> {
    try {
      console.log('🔍 Fetching and filtering warning history for employee:', employeeId);
      
      // Query all warnings for this employee in this organization
// Query all warnings for this employee in this organization
// Add logging for debugging permissions
console.log('🔧 SimplifiedAI Query params:', { employeeId, organizationId });
console.log('🔧 Current user organization from auth:', auth.currentUser?.uid);

const warningsQuery = query(
  collection(db, 'warnings'),
  where('employeeId', '==', employeeId),
  where('organizationId', '==', organizationId),
  orderBy('createdAt', 'desc')
);
      
      const querySnapshot = await getDocs(warningsQuery);
      
      const allWarnings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to regular dates
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const issueDate = data.issueDate?.toDate ? data.issueDate.toDate() : new Date(data.issueDate);
        const expiryDate = data.expiryDate?.toDate ? data.expiryDate.toDate() : null;
        
        return {
          id: doc.id,
          employeeId: data.employeeId,
          categoryId: data.categoryId,
          category: data.category || 'Unknown Category',
          level: data.level,
          date: issueDate,
          createdAt: createdAt,
          description: data.description || '',
          expiryDate: expiryDate,
          isActive: data.isActive !== false, // Default to active if not specified
          validityPeriod: data.validityPeriod || 6, // Default 6 months if not specified
          issuedBy: data.issuedBy || 'Unknown',
          issuedByName: data.issuedByName || 'Unknown Manager'
        };
      });
      
      console.log('📊 Raw warnings fetched:', allWarnings.length);
      
      const now = new Date();
      
      // ✅ CRITICAL: Filter for VALID warnings only (not expired)
      const allValidWarnings = allWarnings.filter(warning => {
        // If no expiry date, calculate it from issue date + validity period
        let expiryDate = warning.expiryDate;
        if (!expiryDate && warning.date && warning.validityPeriod) {
          expiryDate = new Date(warning.date);
          expiryDate.setMonth(expiryDate.getMonth() + warning.validityPeriod);
        }
        
        // Check if warning is still valid
        const isNotExpired = expiryDate ? expiryDate > now : true;
        const isMarkedActive = warning.isActive !== false;
        
        const isValid = isNotExpired && isMarkedActive;
        
        if (!isValid) {
          console.log('⏰ Excluding expired/inactive warning:', {
            id: warning.id,
            level: warning.level,
            category: warning.categoryId,
            issueDate: warning.date,
            expiryDate: expiryDate,
            isExpired: !isNotExpired,
            isInactive: !isMarkedActive
          });
        }
        
        return isValid;
      });
      
      // ✅ CRITICAL: Filter valid warnings for the SAME CATEGORY only
      const validCategoryWarnings = allValidWarnings.filter(warning => {
        const matchesCategory = warning.categoryId === targetCategoryId;
        if (matchesCategory) {
          console.log('✅ Including valid category warning:', {
            id: warning.id,
            level: warning.level,
            category: warning.categoryId,
            date: warning.date,
            expiryDate: warning.expiryDate
          });
        }
        return matchesCategory;
      });
      
      console.log('📊 Final filtering results:', {
        totalWarnings: allWarnings.length,
        validWarnings: allValidWarnings.length,
        validCategoryWarnings: validCategoryWarnings.length,
        targetCategory: targetCategoryId
      });
      
      return {
        validCategoryWarnings,
        allValidWarnings,
        allWarnings
      };
      
    } catch (error) {
      console.error('❌ Error fetching/filtering warning history:', error);
      return {
        validCategoryWarnings: [],
        allValidWarnings: [],
        allWarnings: []
      };
    }
  }

  /**
   * ✅ NEW: BUILD ENHANCED ESCALATION JUSTIFICATION WITH DETAILED MANAGER INFO
   * Shows exactly why the recommendation was made with full previous offense details
   */
  private static buildEscalationJustification(
    validCategoryWarnings: any[],
    allValidWarnings: any[],
    escalationAnalysis: any,
    category: any
  ): LRACompliantRecommendation['escalationJustification'] {
    
    const now = new Date();
    
    // Helper function to get level labels
    const getLevelLabel = (level: string): string => {
      const levelLabels = {
        'counselling': 'Counselling',
        'verbal_warning': 'Verbal Warning',
        'first_written': 'First Written Warning', 
        'final_written': 'Final Written Warning',
        'suspension': 'Suspension',
        'dismissal': 'Dismissal'
      };
      return levelLabels[level as keyof typeof levelLabels] || level;
    };
    
    // Helper function to format dates nicely
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    // Build previous warnings array with enhanced details
    const previousWarnings = validCategoryWarnings.map(warning => {
      const expiryDate = warning.expiryDate || new Date(warning.date.getTime() + (warning.validityPeriod * 30 * 24 * 60 * 60 * 1000));
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      return {
        id: warning.id,
        level: warning.level,
        levelLabel: getLevelLabel(warning.level),
        date: warning.date,
        category: warning.category,
        description: warning.description.substring(0, 100) + (warning.description.length > 100 ? '...' : ''),
        expiryDate: expiryDate,
        daysRemaining: Math.max(0, daysRemaining),
        issuedBy: warning.issuedBy,
        issuedByName: warning.issuedByName,
        formattedDate: formatDate(warning.date)
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
    
    // Generate basic explanation
    let explanation = '';
    let detailedExplanation = '';
    let escalationReason = '';
    let isEscalation = false;
    
    if (validCategoryWarnings.length === 0) {
      explanation = `No active warnings for ${category.name}. Starting with ${escalationAnalysis.recommendedLevel}.`;
      detailedExplanation = `This is the first recorded offense for ${category.name}. Following progressive discipline principles, we begin with ${getLevelLabel(escalationAnalysis.recommendedLevel)}.`;
      escalationReason = 'First offense for this category';
    } else {
      isEscalation = true;
      const mostRecent = previousWarnings[0];
      const daysSinceRecent = Math.floor((now.getTime() - mostRecent.date.getTime()) / (24 * 60 * 60 * 1000));
      
      explanation = `Employee has ${validCategoryWarnings.length} active warning${validCategoryWarnings.length > 1 ? 's' : ''} for ${category.name}. ` +
                   `Most recent: ${mostRecent.levelLabel} (${daysSinceRecent} days ago). ` +
                   `Progressive discipline requires escalation to ${getLevelLabel(escalationAnalysis.recommendedLevel)}.`;
      
      // Build detailed explanation with full manager and date info
      if (validCategoryWarnings.length === 1) {
        detailedExplanation = `**Previous Offense History for ${category.name}:**\n\n` +
                             `• **${mostRecent.levelLabel}** issued on **${mostRecent.formattedDate}** by **${mostRecent.issuedByName}**\n` +
                             `  - Incident: ${mostRecent.description}\n` +
                             `  - Warning expires: ${formatDate(mostRecent.expiryDate)} (${mostRecent.daysRemaining} days remaining)\n\n` +
                             `**Progressive Discipline Escalation:**\n` +
                             `Based on the previous ${mostRecent.levelLabel} issued ${daysSinceRecent} days ago, progressive discipline requires escalation to **${getLevelLabel(escalationAnalysis.recommendedLevel)}** for this repeat offense in the same category.`;
      } else {
        detailedExplanation = `**Previous Offense History for ${category.name}:**\n\n`;
        
        previousWarnings.forEach((warning, index) => {
          const daysSinceWarning = Math.floor((now.getTime() - warning.date.getTime()) / (24 * 60 * 60 * 1000));
          detailedExplanation += `${index + 1}. **${warning.levelLabel}** issued on **${warning.formattedDate}** by **${warning.issuedByName}**\n` +
                                `   - Incident: ${warning.description}\n` +
                                `   - Warning expires: ${formatDate(warning.expiryDate)} (${warning.daysRemaining} days remaining)\n` +
                                `   - Issued ${daysSinceWarning} days ago\n\n`;
        });
        
        detailedExplanation += `**Progressive Discipline Escalation:**\n` +
                              `With ${validCategoryWarnings.length} active warnings for ${category.name}, progressive discipline requires escalation to **${getLevelLabel(escalationAnalysis.recommendedLevel)}** for this repeat offense pattern.`;
      }
      
      escalationReason = `Progressive discipline - ${validCategoryWarnings.length} previous valid warning${validCategoryWarnings.length > 1 ? 's' : ''} in same category`;
    }
    
    return {
      activeWarningsCount: allValidWarnings.length,
      activeWarningsForCategory: validCategoryWarnings.length,
      previousWarnings,
      explanation,
      detailedExplanation,
      isEscalation,
      escalationReason
    };
  }

  /**
   * Analyze incident severity from description
   */
  private static analyzeIncidentSeverity(
    description: string, 
    category: any
  ): 'minor' | 'moderate' | 'severe' {
    
    const text = description.toLowerCase();
    
    // Severity keywords
    const severeKeywords = [
      'violent', 'assault', 'theft', 'fraud', 'criminal', 'illegal', 
      'dangerous', 'safety', 'injury', 'damage', 'destroyed', 'stolen'
    ];
    
    const moderateKeywords = [
      'repeated', 'multiple', 'serious', 'significant', 'major', 
      'violation', 'breach', 'refused', 'ignored', 'defied'
    ];

    // Check for severe indicators
    if (severeKeywords.some(keyword => text.includes(keyword))) {
      return 'severe';
    }
    
    // Check for moderate indicators
    if (moderateKeywords.some(keyword => text.includes(keyword))) {
      return 'moderate';
    }
    
    // Default based on category severity
    if (category.severity === 'gross_misconduct') return 'severe';
    if (category.severity === 'serious') return 'moderate';
    
    return 'minor';
  }

  /**
   * Get LRA-compliant procedural steps
   */
  private static getProceduralSteps(level: WarningLevel, category: any): string[] {
    const baseSteps = [
      'Conduct preliminary investigation to establish facts',
      'Notify employee in writing of allegations and disciplinary hearing',
      'Provide employee with right to representation',
      'Hold fair disciplinary hearing allowing employee to respond'
    ];

    if (level === 'suspension' || level === 'dismissal') {
      baseSteps.splice(1, 0, 'Consider precautionary suspension if necessary');
      baseSteps.push('Apply mind to all relevant factors before final decision');
      baseSteps.push('Communicate decision in writing with reasons');
    }

    if (level === 'dismissal') {
      baseSteps.push('Inform employee of right to appeal within specified timeframe');
      baseSteps.push('Consider alternative sanctions if circumstances warrant');
    }

    return baseSteps;
  }

  /**
   * Calculate minimum notice required (LRA compliance)
   */
  private static getMinimumNotice(level: WarningLevel): number {
    switch (level) {
      case 'counselling':
      case 'verbal_warning':
        return 24; // 24 hours
      case 'first_written':
      case 'final_written':
        return 48; // 48 hours
      case 'suspension':
      case 'dismissal':
        return 72; // 72 hours for serious matters
      default:
        return 48;
    }
  }

  /**
   * Determine if formal hearing is required
   */
  private static requiresHearing(level: WarningLevel): boolean {
    // All written warnings and above require formal hearing
    return !['counselling', 'verbal_warning'].includes(level);
  }

  /**
   * Get required documents for compliance
   */
  private static getRequiredDocuments(level: WarningLevel, category: any): string[] {
    const docs = [
      'Investigation report and findings',
      'Notice of disciplinary hearing',
      'Employee disciplinary record'
    ];

    if (level !== 'counselling') {
      docs.push('Formal charge sheet in clear language');
      docs.push('Evidence supporting the charges');
    }

    if (['suspension', 'dismissal'].includes(level)) {
      docs.push('Consideration of alternative sanctions');
      docs.push('Written decision with detailed reasons');
    }

    // Add category-specific evidence
    docs.push(...category.evidenceRequired);

    return docs;
  }

  /**
   * Get template suggestions
   */
  private static getTemplateSuggestions(level: WarningLevel): string[] {
    const templates = [
      'Investigation checklist template',
      'Disciplinary hearing notice template'
    ];

    switch (level) {
      case 'counselling':
        templates.push('Counselling session record template');
        break;
      case 'verbal_warning':
        templates.push('Verbal warning confirmation template');
        break;
      case 'first_written':
      case 'final_written':
        templates.push('Written warning letter template');
        templates.push('Employee acknowledgment form');
        break;
      case 'suspension':
        templates.push('Suspension letter template');
        templates.push('Return to work clearance form');
        break;
      case 'dismissal':
        templates.push('Dismissal letter template');
        templates.push('Appeal process notification');
        break;
    }

    return templates;
  }

  /**
   * Calculate CCMA risk level (removed numerical scores)
   */
  private static calculateRiskScore(escalationAnalysis: any): number {
    // Keep minimal risk assessment for CCMA readiness
    if (escalationAnalysis.ccmaReadiness === 'low') return 60;
    if (escalationAnalysis.ccmaReadiness === 'medium') return 40;
    return 20; // high readiness = low risk
  }

  /**
   * Generate user-friendly summary
   */
  private static generateSummary(
    escalationAnalysis: any, 
    category: any, 
    severity: string
  ): string {
    const level = escalationAnalysis.recommendedLevel;
    const levelLabels = {
      counselling: 'Informal Counselling',
      verbal_warning: 'Verbal Warning',
      first_written: 'First Written Warning',
      final_written: 'Final Written Warning',
      suspension: 'Suspension',
      dismissal: 'Dismissal'
    };

    return `Recommended action: ${levelLabels[level]} for ${category.name}. ` +
           `${escalationAnalysis.reason}. This recommendation follows LRA Schedule 8 ` +
           `progressive discipline requirements and is ${escalationAnalysis.ccmaReadiness} risk for CCMA arbitration.`;
  }

  /**
   * Generate actionable next steps
   */
  private static generateNextSteps(level: WarningLevel, category: any): string[] {
    const steps = [
      'Review and gather all relevant evidence',
      'Schedule disciplinary hearing with appropriate notice',
      'Prepare formal documentation using provided templates'
    ];

    if (level === 'dismissal') {
      steps.push('Consider if alternative sanctions are appropriate');
      steps.push('Ensure appeal process is clearly communicated');
    }

    if (['suspension', 'dismissal'].includes(level)) {
      steps.push('Consider precautionary measures if ongoing risk exists');
    }

    return steps;
  }

  /**
   * Fallback recommendation for errors
   */
  private static getFallbackRecommendation(categoryId: string): LRACompliantRecommendation {
    return {
      recommendedLevel: 'verbal_warning',
      category: 'General Misconduct',
      legalBasis: 'LRA Section 188 - Disciplinary procedures',
      proceduralSteps: [
        'Conduct investigation to establish facts',
        'Notify employee of disciplinary hearing',
        'Hold fair hearing with right to representation'
      ],
      evidenceRequired: ['Incident documentation', 'Witness statements'],
      progressivePath: ['verbal_warning', 'first_written', 'final_written', 'dismissal'],
      canSkipSteps: false,
      ccmaReadiness: 'medium',
      ccmaRiskFactors: ['Ensure procedural fairness', 'Gather sufficient evidence'],
      minimumNotice: 48,
      hearingRequired: false,
      requiredDocuments: ['Investigation report', 'Hearing notice'],
      templateSuggestions: ['Basic warning templates'],
      summary: 'Fallback recommendation due to analysis error. Manual review required.',
      nextSteps: ['Manual review of case facts', 'Consult HR specialist if needed'],
      escalationJustification: {
        activeWarningsCount: 0,
        activeWarningsForCategory: 0,
        previousWarnings: [],
        explanation: 'Fallback recommendation - unable to analyze warning history',
        detailedExplanation: 'System error occurred during analysis. Manual review of employee\'s warning history is recommended before proceeding.',
        isEscalation: false,
        escalationReason: 'Error in analysis'
      }
    };
  }

  /**
   * Get smart suggestions for incident details
   */
  static getSmartSuggestions(categoryId: string): string[] {
    const category = UniversalEscalationService.getCategory(categoryId);
    if (!category) return [];

    // Return common examples as suggestions
    return category.commonExamples.slice(0, 3); // Top 3 examples
  }

  /**
   * Validate LRA compliance
   */
  static validateLRACompliance(recommendationData: any): {
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check minimum notice
    if (!recommendationData.minimumNotice || recommendationData.minimumNotice < 24) {
      issues.push('Insufficient notice period for disciplinary action');
      suggestions.push('Provide minimum 24-48 hours notice for disciplinary hearing');
    }

    // Check investigation requirement
    if (!recommendationData.evidenceRequired || recommendationData.evidenceRequired.length === 0) {
      issues.push('No evidence requirements specified');
      suggestions.push('Gather factual evidence before proceeding with disciplinary action');
    }

    // Check progressive discipline
    if (recommendationData.recommendedLevel === 'dismissal' && 
        (!recommendationData.warningHistory || recommendationData.warningHistory.length === 0)) {
      issues.push('Dismissal without prior warnings may violate progressive discipline');
      suggestions.push('Consider if progressive discipline steps were followed');
    }

    // Check right to representation
    if (recommendationData.hearingRequired && 
        !recommendationData.proceduralSteps.some(step => step.includes('representation'))) {
      issues.push('Right to representation not clearly specified');
      suggestions.push('Ensure employee knows they can bring a representative');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// =============================================
// 🔧 COMPLETE SMART GUIDANCE SYSTEM - ALL METHODS INCLUDED
// =============================================

export class SmartGuidanceService {
  
  /**
   * Get contextual guidance based on category and incident details
   */
  static getContextualGuidance(
    categoryId: string,
    incidentDescription: string,
    employeeHistory: any[]
  ): {
    legalTips: string[];
    proceduralTips: string[];
    evidenceTips: string[];
    ccmaTips: string[];
  } {
    
    const category = UniversalEscalationService.getCategory(categoryId);
    if (!category) {
      return this.getGenericGuidance();
    }

    const recentWarnings = employeeHistory.length;
    const incidentSeverity = SimplifiedAIService['analyzeIncidentSeverity'](incidentDescription, category);

    return {
      legalTips: this.getLegalTips(category, incidentSeverity),
      proceduralTips: this.getProceduralTips(category, recentWarnings),
      evidenceTips: this.getEvidenceTips(category, incidentDescription),
      ccmaTips: this.getCCMATips(category, recentWarnings)
    };
  }

  /**
   * ✅ CRITICAL FIX: getCategoryGuidance method that CategoryAnalysisStep needs!
   */
  static getCategoryGuidance(categoryId: string): {
    description: string;
    commonScenarios: string[];
    keyEvidenceNeeded: string[];
    legalConsiderations: string[];
  } {
    const category = UniversalEscalationService.getCategory(categoryId);
    if (!category) {
      return {
        description: 'General workplace misconduct',
        commonScenarios: ['General misconduct case'],
        keyEvidenceNeeded: ['Incident documentation', 'Witness statements'],
        legalConsiderations: ['Follow LRA procedures', 'Ensure fair hearing']
      };
    }

    return {
      description: category.description,
      commonScenarios: category.commonExamples,
      keyEvidenceNeeded: category.evidenceRequired,
      legalConsiderations: category.proceduralRequirements
    };
  }

  /**
   * Get smart suggestions for incident details step
   */
  static getSmartSuggestions(categoryId: string, formData?: any): string[] {
    const category = UniversalEscalationService.getCategory(categoryId);
    if (!category) return [];

    const suggestions = [
      ...category.commonExamples.slice(0, 3), // Top 3 examples
      ...category.evidenceRequired.slice(0, 2).map(evidence => 
        `Remember to gather: ${evidence.toLowerCase()}`
      ),
      ...category.proceduralRequirements.slice(0, 2)
    ];

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Get writing assistance for incident description
   */
  static getWritingAssistance(categoryId: string, currentText: string): {
    suggestions: string[];
    improvements: string[];
    legalTips: string[];
  } {
    const category = UniversalEscalationService.getCategory(categoryId);
    if (!category) {
      return {
        suggestions: [],
        improvements: [],
        legalTips: []
      };
    }

    const suggestions = [];
    const improvements = [];
    const legalTips = [];

    // Analyze current text
    const text = currentText.toLowerCase();
    const wordCount = currentText.split(' ').length;

    // Suggestions based on text analysis
    if (wordCount < 10) {
      improvements.push('Add more detail - minimum 10 words for compliance');
    }

    if (!text.includes('date') && !text.includes('time')) {
      suggestions.push('Include specific date and time when possible');
    }

    if (!text.includes('witness') && category.evidenceRequired.includes('witness_statements')) {
      suggestions.push('Were there any witnesses to the incident?');
    }

    // Category-specific suggestions
    if (categoryId === 'attendance_punctuality') {
      if (!text.includes('time') && !text.includes('late')) {
        suggestions.push('Specify exact time of late arrival or absence');
      }
      if (!text.includes('reason')) {
        suggestions.push('Was any reason given for the attendance issue?');
      }
    } else if (categoryId === 'insubordination') {
      if (!text.includes('instruction')) {
        suggestions.push('Describe the specific instruction that was refused');
      }
      if (!text.includes('witness')) {
        suggestions.push('Were there witnesses to the insubordination?');
      }
    } else if (categoryId === 'safety_violations') {
      if (!text.includes('safety') && !text.includes('ppe')) {
        suggestions.push('Specify which safety procedures were violated');
      }
      if (!text.includes('risk') && !text.includes('danger')) {
        suggestions.push('Describe the safety risk created by the violation');
      }
    }

    // Legal tips
    legalTips.push('Be factual and objective - avoid opinions or assumptions');
    legalTips.push('Include specific details that can be verified');
    if (category.severity === 'gross_misconduct') {
      legalTips.push('Gross misconduct requires strong evidence and clear documentation');
    }

    return {
      suggestions: suggestions.slice(0, 4),
      improvements: improvements.slice(0, 3),
      legalTips: legalTips.slice(0, 3)
    };
  }

  private static getLegalTips(category: any, severity: string): string[] {
    const tips = [
      `This falls under ${category.lraSection}`,
      `Follow ${category.schedule8Reference} procedures`
    ];

    if (category.severity === 'gross_misconduct') {
      tips.push('Gross misconduct may justify skipping progressive discipline steps');
      tips.push('Ensure evidence is strong enough to support serious allegations');
    }

    if (severity === 'severe') {
      tips.push('Severe incidents require thorough investigation and documentation');
    }

    return tips;
  }

  private static getProceduralTips(category: any, warningCount: number): string[] {
    const tips = [
      'Conduct fair investigation before disciplinary hearing',
      'Provide written notice with specific allegations',
      'Allow employee to respond to charges'
    ];

    if (warningCount === 0) {
      tips.push('First offense - consider counselling or verbal warning');
    } else if (warningCount >= 2) {
      tips.push('Multiple warnings - document pattern of behavior');
    }

    return tips;
  }

  private static getEvidenceTips(category: any, description: string): string[] {
    const tips = [...category.evidenceRequired];
    
    // Add smart tips based on description
    if (description.toLowerCase().includes('witness')) {
      tips.push('Obtain written witness statements');
    }
    
    if (description.toLowerCase().includes('time') || description.toLowerCase().includes('late')) {
      tips.push('Gather attendance records and time logs');
    }

    if (description.toLowerCase().includes('instruction') || description.toLowerCase().includes('refuse')) {
      tips.push('Document the specific instruction that was given');
    }

    return tips;
  }

  private static getCCMATips(category: any, warningCount: number): string[] {
    const tips = [
      'Ensure consistency in how similar cases are handled',
      'Document all steps taken and reasons for decisions'
    ];

    if (warningCount === 0) {
      tips.push('CCMA will expect progressive discipline unless gross misconduct');
    }

    tips.push(...category.ccmaFactors.slice(0, 2)); // Top 2 CCMA factors

    return tips;
  }

  private static getGenericGuidance() {
    return {
      legalTips: ['Follow LRA Section 188 requirements', 'Ensure procedural fairness'],
      proceduralTips: ['Investigate before acting', 'Provide fair hearing'],
      evidenceTips: ['Gather factual evidence', 'Document everything'],
      ccmaTips: ['Be consistent', 'Follow progressive discipline']
    };
  }
}

// =============================================
// INTEGRATION HELPER
// =============================================

export class SimplifiedIntegrationService {
  
  /**
   * Replace your existing EscalationAIService.analyzeEscalation with this
   */
  static async analyzeEscalation(
    employeeId: string,
    categoryId: string,
    organizationId: string,
    incidentDetails: string,
    // Additional context (optional)
    formData?: any,
    employee?: any,
    organization?: any
  ): Promise<LRACompliantRecommendation> {
    
    console.log('🎯 Using simplified LRA-compliant analysis');
    
    // Extract employee data
    const employeeData = employee ? {
      warningHistory: employee.warningHistory || [],
      lengthOfService: employee.lengthOfService || 0,
      position: employee.position || 'Unknown',
      department: employee.department || 'Unknown'
    } : undefined;

    // Get recommendation using simplified service with proper history fetch
    return SimplifiedAIService.getRecommendation(
      employeeId,
      categoryId,
      incidentDetails,
      organizationId,
      employeeData
    );
  }

  /**
   * Get smart suggestions for the incident details step
   */
  static getSmartSuggestions(categoryId: string): string[] {
    return SimplifiedAIService.getSmartSuggestions(categoryId);
  }

  /**
   * Validate recommendation for legal compliance
   */
  static validateRecommendation(recommendationData: any) {
    return SimplifiedAIService.validateLRACompliance(recommendationData);
  }
}

export default {
  SimplifiedAIService,
  SmartGuidanceService,
  SimplifiedIntegrationService
};