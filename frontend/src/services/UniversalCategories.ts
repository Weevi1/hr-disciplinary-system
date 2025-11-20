// src/services/UniversalCategories.ts
// 🏆 COMPLETE UNIVERSAL CATEGORIES - SINGLE SOURCE OF TRUTH
// ✅ Comprehensive SA-compliant warning categories with tailored escalation paths
// ✅ LRA Section 188 compliant with proper Schedule 8 procedures
// ✅ Category-based escalation logic (no generic severity mapping)
// ✅ Complete replacement for WarningService escalation logic

// ============================================
// CORE TYPES - UNIFIED SYSTEM
// ============================================

export type WarningLevel =
  | 'counselling'      // Entry-level intervention
  | 'verbal'           // Verbal warning
  | 'first_written'    // First written warning
  | 'second_written'   // Second written warning
  | 'final_written';   // Final written warning (system stops here)

export type CategorySeverity = 'minor' | 'serious' | 'gross_misconduct';

// ============================================
// CATEGORY INTERFACE
// ============================================

export interface UniversalCategory {
  id: string;
  name: string;
  description: string;
  severity: CategorySeverity;
  icon: string;
  
  // LRA Compliance
  lraSection: string;
  schedule8Reference: string;
  
  // 🎯 CATEGORY-SPECIFIC ESCALATION PATH (tailored for each category)
  escalationPath: WarningLevel[];
  escalationRationale: string;
  
  // Practical Guidance
  commonExamples: string[];
  proceduralRequirements: string[];
  evidenceRequired: string[];
  ccmaFactors: string[];
  
  // Administrative
  defaultValidityPeriod: 3 | 6 | 12; // months
  requiresImmediateAction?: boolean;
  allowsWarningSkipping?: boolean;
}

// ============================================
// 🏆 COMPREHENSIVE SA WARNING CATEGORIES
// ============================================

export const UNIVERSAL_SA_CATEGORIES: UniversalCategory[] = [

  // 1. 📅 ATTENDANCE & PUNCTUALITY - Full Progressive Discipline
  {
    id: 'attendance_punctuality',
    name: 'Attendance & Punctuality',
    description: 'Late coming, unauthorized absence, early departure without permission',
    severity: 'minor',
    icon: '⏰',
    lraSection: 'Section 188(1)(a) - Incapacity or poor work performance',
    schedule8Reference: 'Schedule 8, Item 10 - Incapacity/poor performance procedures',
    
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'],
    escalationRationale: 'Attendance issues are typically correctable behavior problems that benefit from full progressive discipline, giving employees maximum opportunity to improve while building strong legal documentation.',
    
    commonExamples: [
      'Arriving late for work without valid reason (3+ times per month)',
      'Leaving work early without supervisor permission',
      'Unauthorized absence during working hours',
      'Excessive sick leave without proper medical certificates',
      'Not notifying supervisor of absence per company policy',
      'Consistently returning late from breaks',
      'Pattern of Monday/Friday absences without valid reasons'
    ],
    
    proceduralRequirements: [
      'Maintain accurate attendance records for minimum 6 months',
      'Investigate reasons for poor attendance before disciplinary action',
      'Consider personal circumstances (Schedule 8 factors)',
      'Provide counselling and support where appropriate',
      'Follow progressive discipline unless pattern shows willful misconduct',
      'Document all interventions and employee responses',
      'Allow employee opportunity to provide medical evidence'
    ],
    
    evidenceRequired: [
      'Daily attendance register or electronic time records',
      'Previous warnings and counselling records',
      'Medical certificates (if absence-related)',
      'Communication records about absences',
      'Witness statements from supervisors',
      'Company attendance policy documentation',
      'Impact assessment on operations'
    ],
    
    ccmaFactors: [
      'Length of service and previous disciplinary record',
      'Personal circumstances affecting attendance',
      'Whether adequate counselling and support was provided',
      'Consistency of employer response to similar cases',
      'Impact on operations and other employees',
      'Economic circumstances and job market conditions',
      'Whether alternative arrangements were considered'
    ],
    
    defaultValidityPeriod: 6
  },

  // 2. 📈 PERFORMANCE ISSUES - Full Progressive with Training Focus
  {
    id: 'performance_issues',
    name: 'Performance Issues',
    description: 'Poor work quality, failure to meet targets, lack of required skills',
    severity: 'minor',
    icon: '📈',
    lraSection: 'Section 188(1)(a) - Incapacity or poor work performance',
    schedule8Reference: 'Schedule 8, Item 10 - Poor performance procedures',
    
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'],
    escalationRationale: 'Performance issues often stem from lack of training, unclear expectations, or personal challenges. Full progressive discipline allows time for coaching, training, and performance improvement plans.',
    
    commonExamples: [
      'Consistently missing production targets despite training',
      'Work quality below acceptable company standards',
      'Failure to follow established procedures',
      'Inability to learn new skills required for position',
      'Poor customer service resulting in complaints',
      'Errors in work output affecting quality or safety',
      'Lack of productivity compared to similar employees'
    ],
    
    proceduralRequirements: [
      'Provide clear performance standards and expectations',
      'Offer training and development opportunities',
      'Implement performance improvement plans with measurable goals',
      'Regular monitoring and feedback sessions',
      'Consider whether incapacity is due to ill-health or lack of skill',
      'Explore alternative positions if performance cannot improve',
      'Document all training provided and performance measurements'
    ],
    
    evidenceRequired: [
      'Performance metrics and measurement records',
      'Training records and certificates',
      'Performance improvement plan documentation',
      'Regular performance review records',
      'Customer complaints or feedback (if applicable)',
      'Comparison with similar employees\' performance',
      'Evidence of support and resources provided'
    ],
    
    ccmaFactors: [
      'Whether clear performance standards were communicated',
      'Adequacy of training and support provided',
      'Personal circumstances affecting performance',
      'Length of service and previous performance record',
      'Whether alternative positions were considered',
      'Consistency with treatment of other employees',
      'Economic impact of dismissal on employee'
    ],
    
    defaultValidityPeriod: 6
  },

  // 3. 🚨 SAFETY VIOLATIONS - Accelerated Escalation
  {
    id: 'safety_violations',
    name: 'Safety Violations',
    description: 'Failure to follow safety procedures, endangering self or others',
    severity: 'serious',
    icon: '🚨',
    lraSection: 'Section 188(1)(b) - Misconduct',
    schedule8Reference: 'Schedule 8, Item 1 - Misconduct procedures',
    
    escalationPath: ['verbal', 'first_written', 'final_written'],
    escalationRationale: 'Safety violations can result in injury, death, or legal liability. While counselling might be appropriate for first-time minor oversights, repeated or serious safety violations require formal progressive discipline.',
    
    commonExamples: [
      'Failure to wear required Personal Protective Equipment (PPE)',
      'Operating machinery without proper authorization',
      'Ignoring safety procedures and protocols',
      'Creating unsafe working conditions for others',
      'Failure to report safety hazards or incidents',
      'Horseplay or reckless behavior in workplace',
      'Smoking in prohibited areas or fire hazard zones'
    ],
    
    proceduralRequirements: [
      'Immediate investigation of safety incidents',
      'Ensure employee understands safety requirements',
      'Provide additional safety training if needed',
      'Consider whether violation was willful or due to lack of knowledge',
      'Implement corrective measures to prevent recurrence',
      'May require temporary removal from dangerous areas',
      'Report serious incidents to relevant authorities'
    ],
    
    evidenceRequired: [
      'Incident reports and investigation findings',
      'Safety training records and certificates',
      'Photographs of safety violations or hazards',
      'Witness statements from supervisors or colleagues',
      'Safety inspection reports',
      'Company safety policies and procedures',
      'Medical reports if injury occurred'
    ],
    
    ccmaFactors: [
      'Seriousness of safety risk created',
      'Whether violation was willful or negligent',
      'Previous safety training provided',
      'Employee\'s safety record and length of service',
      'Potential consequences of the safety violation',
      'Consistency of safety enforcement',
      'Industry standards and legal requirements'
    ],
    
    defaultValidityPeriod: 12,
    requiresImmediateAction: true
  },

  // 4. 🤝 INSUBORDINATION & DISRESPECT - Progressive with Severity Consideration
  {
    id: 'insubordination_disrespect',
    name: 'Insubordination & Disrespect',
    description: 'Refusal to follow instructions, disrespectful behavior, undermining authority',
    severity: 'serious',
    icon: '🚫',
    lraSection: 'Section 188(1)(b) - Misconduct',
    schedule8Reference: 'Schedule 8, Item 1 - Misconduct procedures',
    
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
    escalationRationale: 'Insubordination varies from minor attitude issues (requiring counselling) to serious defiance. Progressive discipline allows distinction between momentary lapses and persistent defiant behavior.',
    
    commonExamples: [
      'Refusing to follow reasonable and lawful instructions',
      'Disrespectful language or behavior toward supervisors',
      'Undermining management authority in front of colleagues',
      'Aggressive or threatening behavior toward management',
      'Consistently challenging management decisions inappropriately',
      'Showing contempt for company policies or procedures',
      'Public criticism of management or company'
    ],
    
    proceduralRequirements: [
      'Distinguish between reasonable management instruction and unreasonable demands',
      'Consider employee\'s right to raise legitimate grievances',
      'Assess whether behavior was influenced by workplace stress',
      'Provide opportunity for employee to explain their perspective',
      'Consider mediation or conflict resolution where appropriate',
      'Document specific instances with dates and witnesses',
      'Ensure consistency with treatment of similar cases'
    ],
    
    evidenceRequired: [
      'Written statements from witnesses present',
      'Documentation of specific incidents with dates and times',
      'Records of instructions given and employee response',
      'Previous disciplinary records for pattern evidence',
      'Email or written communication showing insubordination',
      'Performance reviews or feedback sessions',
      'Evidence of impact on team morale or productivity'
    ],
    
    ccmaFactors: [
      'Severity of the insubordinate behavior',
      'Whether employee had legitimate grievances',
      'Length of service and previous disciplinary record',
      'Impact on workplace authority and discipline',
      'Whether behavior was out of character',
      'Workplace stress factors or personal circumstances',
      'Potential for rehabilitation and improved behavior'
    ],
    
    defaultValidityPeriod: 6
  },

  // 5. 📋 POLICY VIOLATIONS - Flexible Progressive Discipline
  {
    id: 'policy_violations',
    name: 'Policy Violations',
    description: 'Breach of company policies, procedures, or workplace rules',
    severity: 'minor',
    icon: '📋',
    lraSection: 'Section 188(1)(b) - Misconduct',
    schedule8Reference: 'Schedule 8, Item 1 - Misconduct procedures',
    
    escalationPath: ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'],
    escalationRationale: 'Policy violations vary greatly in seriousness. Progressive discipline allows proportionate responses based on policy importance and violation severity.',
    
    commonExamples: [
      'Violation of dress code or appearance standards',
      'Inappropriate use of company property or equipment',
      'Breach of confidentiality or privacy policies',
      'Unauthorized use of company internet or email',
      'Violation of social media and communication policies',
      'Failure to follow administrative procedures',
      'Breach of conflict of interest policies'
    ],
    
    proceduralRequirements: [
      'Ensure policy was clearly communicated to employee',
      'Verify employee had access to and understood policy',
      'Consider seriousness of policy violated',
      'Investigate whether violation was intentional',
      'Provide policy training if knowledge gaps identified',
      'Consider impact of violation on business operations',
      'Ensure consistent application across all employees'
    ],
    
    evidenceRequired: [
      'Copy of relevant company policy document',
      'Evidence of policy communication (training records, handbook)',
      'Documentation of the specific violation',
      'Computer logs, emails, or digital evidence if applicable',
      'Witness statements or supervisor observations',
      'Previous policy violations or training records',
      'Impact assessment on business or colleagues'
    ],
    
    ccmaFactors: [
      'Clarity and accessibility of the policy violated',
      'Seriousness of the policy and business impact',
      'Employee\'s knowledge and understanding of policy',
      'Intent behind the violation',
      'Consistency of policy enforcement',
      'Length of service and previous violations',
      'Whether remedial action is possible'
    ],
    
    defaultValidityPeriod: 6
  },

  // 6. 💰 DISHONESTY & THEFT - Serious Escalation
  {
    id: 'dishonesty_theft',
    name: 'Dishonesty & Theft',
    description: 'Stealing, fraud, falsifying records, dishonest behavior',
    severity: 'gross_misconduct',
    icon: '💰',
    lraSection: 'Section 188(1)(b) - Misconduct',
    schedule8Reference: 'Schedule 8, Item 1 - Misconduct procedures',
    
    escalationPath: ['first_written', 'final_written'],
    escalationRationale: 'Dishonesty and theft break fundamental trust required for employment. Minor dishonesty may warrant progressive discipline, but serious theft or fraud often justifies immediate dismissal after investigation.',
    
    commonExamples: [
      'Stealing company property, money, or resources',
      'Fraudulent claiming of overtime or expenses',
      'Falsifying time records, reports, or documentation',
      'Misappropriation of company funds or assets',
      'Lying about qualifications, experience, or credentials',
      'Concealing conflicts of interest or kickbacks',
      'Falsifying safety records or inspection reports'
    ],
    
    proceduralRequirements: [
      'Conduct thorough investigation before taking action',
      'Preserve evidence and maintain chain of custody',
      'Consider suspension pending investigation if necessary',
      'Distinguish between minor dishonesty and serious fraud',
      'Involve security or law enforcement if appropriate',
      'Ensure fair hearing and right to respond',
      'Consider whether criminal charges should be laid'
    ],
    
    evidenceRequired: [
      'Financial records, receipts, or transaction evidence',
      'Security camera footage or access logs',
      'Witness statements from colleagues or customers',
      'Forensic accounting or audit reports',
      'Documentation of missing inventory or assets',
      'Computer records or digital evidence',
      'Statements from employee during investigation'
    ],
    
    ccmaFactors: [
      'Value and nature of property stolen or involved',
      'Level of trust and responsibility in employee\'s position',
      'Impact on employer\'s business or reputation',
      'Length of service and previous disciplinary record',
      'Whether employee admitted wrongdoing and showed remorse',
      'Consistency with treatment of similar cases',
      'Potential for rehabilitation vs. need to deter others'
    ],
    
    defaultValidityPeriod: 12,
    requiresImmediateAction: true,
    allowsWarningSkipping: true
  },

  // 7. 🍺 SUBSTANCE ABUSE - Treatment-Focused Progressive Discipline
  {
    id: 'substance_abuse',
    name: 'Substance Abuse',
    description: 'Use of alcohol or drugs affecting work performance or safety',
    severity: 'serious',
    icon: '🍺',
    lraSection: 'Section 188(1)(b) - Misconduct',
    schedule8Reference: 'Schedule 8, Item 1 - Misconduct procedures',
    
    escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
    escalationRationale: 'Substance abuse is both a health issue and workplace safety concern. Counselling and support are prioritized initially, but safety concerns require firm boundaries.',
    
    commonExamples: [
      'Reporting to work under influence of alcohol or drugs',
      'Possession or use of illegal substances at work',
      'Performance deterioration due to substance abuse',
      'Erratic behavior suggesting intoxication',
      'Positive results on random drug/alcohol testing',
      'Alcohol odor or visible signs of intoxication',
      'Refusing to submit to required substance testing'
    ],
    
    proceduralRequirements: [
      'Follow company substance abuse policy procedures',
      'Conduct testing according to established protocols',
      'Distinguish between addiction (health issue) and misconduct',
      'Offer employee assistance programs where available',
      'Consider rehabilitation and treatment options',
      'Ensure safety of employee and colleagues',
      'Document all incidents and interventions'
    ],
    
    evidenceRequired: [
      'Drug/alcohol test results and chain of custody',
      'Witness observations of behavior and condition',
      'Supervisor reports of performance decline',
      'Medical evidence or treatment records (if disclosed)',
      'Company substance abuse policies',
      'Previous incidents or test results',
      'Evidence of impact on work performance or safety'
    ],
    
    ccmaFactors: [
      'Whether substance abuse affects work performance',
      'Safety implications for employee and colleagues',
      'Employee\'s willingness to seek treatment',
      'Length of service and previous record',
      'Availability of rehabilitation programs',
      'Consistency of policy application',
      'Balance between health support and workplace safety'
    ],
    
    defaultValidityPeriod: 6,
    requiresImmediateAction: true
  },

  // 8. ⚖️ HARASSMENT & DISCRIMINATION - Zero Tolerance Approach
  {
    id: 'harassment_discrimination',
    name: 'Harassment & Discrimination',
    description: 'Sexual harassment, racial discrimination, bullying, or creating hostile work environment',
    severity: 'gross_misconduct',
    icon: '⚖️',
    lraSection: 'Section 188(1)(b) - Misconduct',
    schedule8Reference: 'Schedule 8, Item 1 - Misconduct procedures',
    
    escalationPath: ['final_written'],
    escalationRationale: 'Harassment and discrimination create legal liability and hostile work environments. While investigation is required, proven cases often warrant immediate serious action.',
    
    commonExamples: [
      'Sexual harassment or unwanted sexual advances',
      'Racial, gender, or religious discrimination',
      'Bullying, intimidation, or creating hostile environment',
      'Inappropriate comments about appearance or personal life',
      'Displaying offensive material or making discriminatory jokes',
      'Retaliation against employees who report discrimination',
      'Creating work environment that excludes certain groups'
    ],
    
    proceduralRequirements: [
      'Immediate investigation by trained investigators',
      'Ensure complainant safety and prevent retaliation',
      'Maintain confidentiality while conducting investigation',
      'Follow company harassment and discrimination policies',
      'Consider interim measures to separate parties',
      'Provide support to affected employees',
      'Report to relevant authorities if required by law'
    ],
    
    evidenceRequired: [
      'Written complaint or incident report',
      'Witness statements from colleagues',
      'Documentation of previous similar incidents',
      'Email, text messages, or other communications',
      'Records of previous complaints or warnings',
      'Medical or psychological reports (if applicable)',
      'Evidence of impact on work environment'
    ],
    
    ccmaFactors: [
      'Seriousness and persistence of the harassment',
      'Impact on victim and workplace environment',
      'Position of power or authority of perpetrator',
      'Previous incidents or complaints',
      'Whether behavior was part of pattern',
      'Legal and reputational risk to organization',
      'Need to protect other employees and deter similar conduct'
    ],
    
    defaultValidityPeriod: 12,
    requiresImmediateAction: true,
    allowsWarningSkipping: true
  }
];

// ============================================
// 🛠️ CATEGORY SERVICE FUNCTIONS
// ============================================

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): UniversalCategory | undefined {
  return UNIVERSAL_SA_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Get categories by severity level
 */
export function getCategoriesBySeverity(severity: CategorySeverity): UniversalCategory[] {
  return UNIVERSAL_SA_CATEGORIES.filter(cat => cat.severity === severity);
}

/**
 * Get escalation path for specific category
 */
export function getEscalationPath(categoryId: string): WarningLevel[] {
  const category = getCategoryById(categoryId);
  return category?.escalationPath || ['counselling', 'verbal', 'first_written', 'final_written'];
}

/**
 * Get next escalation level in category's path
 */
export function getNextEscalationLevel(categoryId: string, currentLevel: WarningLevel): WarningLevel | null {
  const category = getCategoryById(categoryId);
  if (!category) return null;
  
  const currentIndex = category.escalationPath.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === category.escalationPath.length - 1) {
    return null;
  }
  
  return category.escalationPath[currentIndex + 1];
}

/**
 * Validate if warning level is valid for category
 */
export function isValidLevelForCategory(categoryId: string, level: WarningLevel): boolean {
  const category = getCategoryById(categoryId);
  return category?.escalationPath.includes(level) || false;
}

/**
 * Get all categories with their escalation paths
 */
export function getAllEscalationPaths(): { [categoryId: string]: WarningLevel[] } {
  return UNIVERSAL_SA_CATEGORIES.reduce((paths, category) => {
    paths[category.id] = category.escalationPath;
    return paths;
  }, {} as { [categoryId: string]: WarningLevel[] });
}

/**
 * Validate escalation path structure
 */
export function validateEscalationPath(path: WarningLevel[]): boolean {
  const validLevels: WarningLevel[] = ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'];

  return path.every(level => validLevels.includes(level)) &&
         path.length >= 1 &&
         path[path.length - 1] === 'final_written';
}

/**
 * Get human-readable level labels
 */
export function getLevelLabel(level: WarningLevel): string {
  const labels: Record<WarningLevel, string> = {
    counselling: 'Counselling Session',
    verbal: 'Verbal Warning',
    first_written: 'Written Warning',
    second_written: 'Second Written Warning',
    final_written: 'Final Written Warning'
  };

  return labels[level] || level;
}

/**
 * Get categories suitable for specific industries/contexts
 */
export function getCategoriesForContext(context: 'manufacturing' | 'retail' | 'office' | 'healthcare'): UniversalCategory[] {
  // All categories are universal, but can filter by relevance
  switch (context) {
    case 'manufacturing':
      return UNIVERSAL_SA_CATEGORIES; // Safety is critical in manufacturing
    case 'retail':
      return UNIVERSAL_SA_CATEGORIES.filter(cat => 
        !['substance_abuse'].includes(cat.id) || cat.id === 'policy_violations'
      );
    case 'office':
      return UNIVERSAL_SA_CATEGORIES.filter(cat => 
        !['safety_violations'].includes(cat.id)
      );
    case 'healthcare':
      return UNIVERSAL_SA_CATEGORIES; // All categories relevant due to patient safety
    default:
      return UNIVERSAL_SA_CATEGORIES;
  }
}

// ============================================
// 🎯 DEFAULT EXPORT
// ============================================

export default {
  categories: UNIVERSAL_SA_CATEGORIES,
  getCategoryById,
  getCategoriesBySeverity,
  getEscalationPath,
  getNextEscalationLevel,
  isValidLevelForCategory,
  getAllEscalationPaths,
  validateEscalationPath,
  getLevelLabel,
  getCategoriesForContext
};