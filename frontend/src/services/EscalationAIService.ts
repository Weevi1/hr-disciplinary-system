import Logger from '../utils/logger';
// ===================================
// ESCALATION AI SERVICE - Intelligent Recommendations
// Analyzes incidents and provides escalation recommendations
// ===================================

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  DisciplinaryCategory, 
  EscalationLevel, 
  EscalationRecommendation, 
  WarningHistory,
  EmployeeRiskProfile 
} from '../types';
import { SectorService } from './SectorService';

export class EscalationAIService {
  
  // ===================================
  // MAIN ANALYSIS FUNCTION
  // ===================================
  
  /**
   * Analyze an incident and provide escalation recommendation
   */
  static async analyzeEscalation(
    employeeId: string,
    categoryId: string,
    organizationId: string,
    incidentDetails: string
  ): Promise<EscalationRecommendation | null> {
    try {
      Logger.debug(`🤖 Analyzing escalation for employee ${employeeId}, category ${categoryId}`)
      
      // Get the category details
      const category = await SectorService.findCategoryForOrganization(organizationId, categoryId);
      if (!category) {
        Logger.error(`❌ Category ${categoryId} not found for organization ${organizationId}`)
        return null;
      }
      
      // Get employee warning history
      const history = await this.getEmployeeWarningHistory(employeeId);
      
      // Calculate risk profile
      const riskProfile = this.calculateEmployeeRisk(history);
      
      // Analyze incident severity
      const incidentSeverity = this.analyzeIncidentSeverity(incidentDetails, category);
      
      // Generate recommendation
      const recommendation = this.generateRecommendation({
        category,
        history,
        riskProfile,
        incidentSeverity,
        incidentDetails
      }, category, history);
      
      Logger.success(2008)
      return recommendation;
      
    } catch (error) {
      Logger.error('❌ Error analyzing escalation:', error)
      return null;
    }
  }
  
  // ===================================
  // WARNING HISTORY ANALYSIS
  // ===================================
  
  /**
   * Get employee's warning history
   */
  private static async getEmployeeWarningHistory(employeeId: string): Promise<WarningHistory[]> {
    try {
      const warningsQuery = query(
        collection(db, 'warnings'),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc'),
        limit(20) // Last 20 warnings
      );
      
      const warningsSnapshot = await getDocs(warningsQuery);
      
      return warningsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          employeeId: data.employeeId,
          categoryId: data.categoryId,
          level: data.escalationLevel,
          date: new Date(data.createdAt),
          description: data.description || ''
        };
      });
      
    } catch (error) {
      Logger.error('❌ Error fetching warning history:', error)
      return [];
    }
  }
  
  /**
   * Calculate employee risk profile
   */
  private static calculateEmployeeRisk(history: WarningHistory[]): EmployeeRiskProfile {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentWarnings = history.filter(h => h.date >= sixMonthsAgo);
    const categories = [...new Set(history.map(h => h.categoryId))];
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    // Determine risk level
    if (recentWarnings.length >= 5) riskLevel = 'critical';
    else if (recentWarnings.length >= 3) riskLevel = 'high';
    else if (recentWarnings.length >= 1) riskLevel = 'medium';
    
    // Escalate risk for repeat categories
    const repeatCategories = categories.filter(cat => 
      history.filter(h => h.categoryId === cat).length > 1
    );
    
    if (repeatCategories.length > 0 && riskLevel === 'low') riskLevel = 'medium';
    if (repeatCategories.length > 2) riskLevel = 'high';
    
    return {
      employeeId: history[0]?.employeeId || '',
      totalWarnings: history.length,
      recentWarnings: recentWarnings.length,
      categories,
      riskLevel,
      lastWarningDate: history[0]?.date
    };
  }
  
  // ===================================
  // INCIDENT SEVERITY ANALYSIS
  // ===================================
  
  /**
   * Analyze incident severity based on description
   */
  private static analyzeIncidentSeverity(details: string, category: DisciplinaryCategory): number {
    const severityKeywords = {
      critical: ['danger', 'safety', 'injury', 'accident', 'emergency', 'critical', 'severe', 'patient', 'death'],
      high: ['serious', 'major', 'significant', 'violation', 'breach', 'damage', 'loss'],
      medium: ['mistake', 'error', 'late', 'absent', 'complaint'],
      low: ['minor', 'first time', 'unintentional']
    };

    let severityScore = 50; // Base score

    // Check for critical keywords
    const lowerDetails = details.toLowerCase();
    
    if (severityKeywords.critical.some(word => lowerDetails.includes(word))) {
      severityScore = 100;
    } else if (severityKeywords.high.some(word => lowerDetails.includes(word))) {
      severityScore = 75;
    } else if (severityKeywords.medium.some(word => lowerDetails.includes(word))) {
      severityScore = 50;
    } else if (severityKeywords.low.some(word => lowerDetails.includes(word))) {
      severityScore = 25;
    }

    // Adjust based on category severity
    if (category.severity === 'critical') severityScore = Math.max(severityScore, 75);
    if (category.severity === 'high') severityScore = Math.max(severityScore, 60);

    return severityScore;
  }
  
  // ===================================
  // RECOMMENDATION GENERATION
  // ===================================
  
  /**
   * Generate escalation recommendation
   */
  private static generateRecommendation(
    factors: any,
    category: DisciplinaryCategory,
    history: WarningHistory[]
  ): EscalationRecommendation {
    let recommendedLevelIndex = 0;
    const reasons: string[] = [];
    const complianceNotes: string[] = [];
    const requiredActions: string[] = [];

    // Determine starting level based on severity
    if (factors.category.severity === 'critical' || factors.incidentSeverity >= 75) {
      recommendedLevelIndex = Math.max(1, category.escalationPath.length - 2); // Start high
      reasons.push('Critical severity incident requires immediate serious action');
      complianceNotes.push('Document all evidence thoroughly for potential CCMA proceedings');
    }

    // Check for repeat offenses - SEVERITY-BASED ESCALATION
    const categoryHistory = history.filter(h => h.categoryId === category.id);
    if (categoryHistory.length > 0) {
      // Find the highest severity level from previous warnings in this category
      const previousSeverityLevels = categoryHistory.map(h => {
        const levelIndex = category.escalationPath.findIndex(level => level.name === h.level);
        return levelIndex >= 0 ? levelIndex : 0;
      });
      
      const highestPreviousLevel = Math.max(...previousSeverityLevels);
      
      // Escalate to next level after the highest previous level
      recommendedLevelIndex = Math.max(
        recommendedLevelIndex,
        Math.min(highestPreviousLevel + 1, category.escalationPath.length - 1)
      );
      
      const highestPreviousLevelName = category.escalationPath[highestPreviousLevel]?.name || 'Unknown';
      reasons.push(`Previous ${categoryHistory.length} warning(s) in this category - highest level: ${highestPreviousLevelName}`);
      complianceNotes.push('Progressive discipline approach - escalation based on severity of previous warnings');
    }

    // Risk profile adjustments
    if (factors.riskProfile.riskLevel === 'critical') {
      recommendedLevelIndex = Math.min(recommendedLevelIndex + 1, category.escalationPath.length - 1);
      reasons.push('Employee has critical risk profile with multiple recent warnings');
    } else if (factors.riskProfile.riskLevel === 'high') {
      reasons.push('Employee has elevated risk profile');
    }

    // Ensure we don't exceed available escalation levels
    recommendedLevelIndex = Math.min(recommendedLevelIndex, category.escalationPath.length - 1);
    recommendedLevelIndex = Math.max(0, recommendedLevelIndex); // Don't go below 0

    const recommendedLevel = category.escalationPath[recommendedLevelIndex];

    // Calculate risk score
    let riskScore = 25; // Base risk
    riskScore += factors.incidentSeverity * 0.4; // Incident contributes 40%
    riskScore += factors.riskProfile.recentWarnings * 15; // Recent warnings
    riskScore += categoryHistory.length * 10; // Category-specific history
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Generate compliance notes
    if (recommendedLevel.requiresHRApproval) {
      complianceNotes.push('HR approval required for this escalation level');
    }
    
    if (recommendedLevel.requiresSuspension) {
      complianceNotes.push('Suspension procedures must be followed as per LRA requirements');
    }

    if (category.severity === 'critical') {
      complianceNotes.push('Critical severity - ensure all safety protocols are reviewed');
    }

    // Required actions
    requiredActions.push(...recommendedLevel.documentationRequired);
    
    if (riskScore > 70) {
      requiredActions.push('Schedule follow-up meeting within 7 days');
    }
    
    if (factors.riskProfile.riskLevel === 'critical') {
      requiredActions.push('Consider performance improvement plan');
      requiredActions.push('Obtain HR approval before proceeding');
    }

    // Alternative options (one level up and down if available)
    const alternativeOptions: EscalationLevel[] = [];
    
    if (recommendedLevelIndex > 0) {
      alternativeOptions.push(category.escalationPath[recommendedLevelIndex - 1]);
    }
    
    if (recommendedLevelIndex < category.escalationPath.length - 1) {
      alternativeOptions.push(category.escalationPath[recommendedLevelIndex + 1]);
    }

    return {
      recommendedLevel,
      reason: reasons.join('. '),
      riskScore: Math.round(riskScore),
      complianceNotes,
      requiredActions: [...new Set(requiredActions)], // Remove duplicates
      alternativeOptions: alternativeOptions.length > 0 ? alternativeOptions : undefined
    };
  }
  
  // ===================================
  // UTILITY FUNCTIONS
  // ===================================
  
  /**
   * Get employee risk assessment
   */
  static async getEmployeeRiskAssessment(employeeId: string): Promise<EmployeeRiskProfile | null> {
    try {
      const history = await this.getEmployeeWarningHistory(employeeId);
      return this.calculateEmployeeRisk(history);
    } catch (error) {
      Logger.error('❌ Error getting employee risk assessment:', error)
      return null;
    }
  }
  
  /**
   * Check if escalation is required based on time
   */
  static shouldAutoEscalate(
    lastWarningDate: Date,
    timeframeDays: number,
    currentDate: Date = new Date()
  ): boolean {
    const daysSinceLastWarning = Math.floor(
      (currentDate.getTime() - lastWarningDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastWarning >= timeframeDays;
  }
}
