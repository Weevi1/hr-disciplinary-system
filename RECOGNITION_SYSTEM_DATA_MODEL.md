# Recognition & Achievement Tracking System - Data Model Design

**Version:** 1.0
**Date:** 2025-11-12
**Purpose:** Comprehensive data model for positive reinforcement system that complements the disciplinary system

---

## Executive Summary

This document defines the complete data model for a Recognition & Achievement Tracking system that balances the disciplinary system with positive reinforcement. The system enables managers to document exceptional performance, achievements, and positive behaviors, creating evidence for promotions, bonuses, awards, and performance reviews.

**Key Design Principles:**
1. **Mirror Disciplinary Patterns**: Reuse proven patterns from Warning system where applicable
2. **Simple & Practical**: Focus on HR needs without over-engineering
3. **Evidence-Based**: Create concrete records for career progression decisions
4. **Motivational**: Design encourages positive workplace culture
5. **Flexible Rewards**: Support various recognition types from verbal praise to bonuses

---

## 1. TypeScript Interface Definitions

### 1.1 Core Recognition Interface

```typescript
// frontend/src/types/recognition.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Recognition Record - Positive achievement/behavior documentation
 * Mirrors Warning interface structure for consistency and familiarity
 */
export interface Recognition {
  // ============================================
  // CORE IDENTIFICATION
  // ============================================
  id: string;
  organizationId: string;
  employeeId: string;
  categoryId: string;                    // Links to RecognitionCategory

  // ============================================
  // RECOGNITION DETAILS
  // ============================================
  type: RecognitionType;                 // Type of recognition (see enum below)
  title: string;                         // Short title (e.g., "Exceptional Customer Service")
  description: string;                   // Detailed description of what was achieved/recognized

  // Achievement Context
  achievementDate: Date | Timestamp;     // When the achievement occurred
  achievementLocation?: string;          // Where it happened (optional)
  businessImpact: string;                // Why it matters - measurable impact on business

  // ============================================
  // SKILLS & COMPETENCIES
  // ============================================
  skillsDemonstrated: string[];          // Skills shown (e.g., "Leadership", "Problem Solving")
  competencyLevel?: CompetencyLevel;     // Proficiency level demonstrated

  // ============================================
  // REWARDS & RECOGNITION
  // ============================================
  rewardsGiven: RewardType[];            // Reward(s) provided (see enum below)
  rewardDetails?: {
    bonusAmount?: number;                // Monetary bonus (if applicable)
    timeOffHours?: number;               // Paid time off hours granted
    certificateIssued?: boolean;         // Was certificate generated?
    publicPraiseDetails?: string;        // Where/how publicly recognized
    giftCardAmount?: number;             // Gift card value
    customRewardDescription?: string;    // Other rewards
  };

  // ============================================
  // FUTURE DEVELOPMENT
  // ============================================
  futureGoals?: string;                  // Stretch targets or next level objectives
  developmentOpportunities?: string[];   // Suggested training, projects, or growth paths

  // ============================================
  // DOCUMENTATION & EVIDENCE
  // ============================================
  evidenceUrls?: string[];               // Photos, documents, metrics screenshots
  witnessNames?: string[];               // Colleagues who witnessed achievement
  witnessStatements?: string[];          // Supporting statements from witnesses

  // Manager Assessment
  managerComments: string;               // Manager's detailed comments
  recognizedBy: string;                  // Manager UID who created recognition
  recognizedByName: string;              // Manager display name

  // Employee Response
  employeeAcknowledged: boolean;         // Has employee seen this?
  employeeAcknowledgedAt?: Date | Timestamp; // When acknowledged
  employeeComments?: string;             // Employee's response/gratitude

  // ============================================
  // VISIBILITY & SHARING
  // ============================================
  visibility: RecognitionVisibility;     // Who can see this recognition
  shareWithTeam: boolean;                // Share in team meetings/announcements?
  shareInNewsletter: boolean;            // Include in company newsletter?

  // ============================================
  // METADATA & AUDIT
  // ============================================
  status: RecognitionStatus;             // Current status
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;

  // PDF Generation (for certificates/formal recognition)
  pdfUrl?: string;                       // Generated certificate URL
  pdfGeneratedAt?: Date | Timestamp;
}

/**
 * Recognition Category - Similar to WarningCategory
 * Defines types of achievements that can be recognized
 */
export interface RecognitionCategory {
  id: string;
  organizationId: string;
  name: string;                          // e.g., "Customer Service Excellence"
  description: string;
  icon: string;                          // Emoji or icon identifier

  // Impact & Priority
  impactLevel: ImpactLevel;              // Business impact level

  // Suggested Rewards
  suggestedRewards: RewardType[];        // Common rewards for this category
  suggestedSkills: string[];             // Skills typically demonstrated

  // Configuration
  requiresEvidence: boolean;             // Require photo/document upload?
  requiresWitness: boolean;              // Require witness confirmation?
  requiresManagerApproval: boolean;      // Needs higher-level manager approval?

  // Performance Review Integration
  contributesToPromotion: boolean;       // Should this count toward promotion eligibility?
  contributesToBonus: boolean;           // Should this influence bonus decisions?

  // Administrative
  isActive: boolean;
  displayOrder: number;                  // Sort order in UI
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
```

---

## 2. Enums & Constants

### 2.1 Recognition Type Enum

```typescript
/**
 * Types of recognition that can be documented
 * Covers broad spectrum from daily excellence to major achievements
 */
export enum RecognitionType {
  // Performance-Based
  EXCEPTIONAL_PERFORMANCE = 'exceptional_performance',        // Consistently exceeds expectations
  PROJECT_COMPLETION = 'project_completion',                  // Successfully completed project
  QUALITY_EXCELLENCE = 'quality_excellence',                  // High quality work/zero defects
  PRODUCTIVITY_ACHIEVEMENT = 'productivity_achievement',      // Productivity milestone reached

  // Skills & Learning
  CERTIFICATION_EARNED = 'certification_earned',              // Professional certification obtained
  SKILL_MASTERY = 'skill_mastery',                            // Mastered new skill/competency
  TRAINING_COMPLETION = 'training_completion',                // Completed training program

  // Behavioral
  POSITIVE_ATTITUDE = 'positive_attitude',                    // Consistently positive, motivates others
  TEAMWORK_COLLABORATION = 'teamwork_collaboration',          // Excellent team player
  LEADERSHIP_DEMONSTRATED = 'leadership_demonstrated',        // Showed leadership qualities
  MENTORSHIP_SUPPORT = 'mentorship_support',                  // Helped/mentored colleagues

  // Customer-Focused
  CUSTOMER_SERVICE_EXCELLENCE = 'customer_service_excellence', // Outstanding customer service
  CLIENT_SATISFACTION = 'client_satisfaction',                // Client praise/high satisfaction scores

  // Innovation & Improvement
  PROCESS_IMPROVEMENT = 'process_improvement',                // Improved workflow/process
  INNOVATION = 'innovation',                                  // New idea/solution implemented
  COST_SAVINGS = 'cost_savings',                              // Identified cost reduction opportunity

  // Safety & Compliance
  SAFETY_ACHIEVEMENT = 'safety_achievement',                  // Accident-free period/safety improvement
  COMPLIANCE_EXCELLENCE = 'compliance_excellence',            // Compliance standards exceeded

  // Attendance & Reliability
  PERFECT_ATTENDANCE = 'perfect_attendance',                  // Perfect attendance period
  RELIABILITY = 'reliability',                                // Consistently reliable/dependable

  // Special Recognition
  GOING_ABOVE_BEYOND = 'going_above_beyond',                  // Went beyond job requirements
  CRISIS_MANAGEMENT = 'crisis_management',                    // Handled crisis/emergency well
  MILESTONE_ANNIVERSARY = 'milestone_anniversary',            // Service anniversary (1yr, 5yr, 10yr)

  // Custom
  OTHER = 'other'                                             // Custom recognition type
}

/**
 * Display labels for recognition types
 */
export const RECOGNITION_TYPE_LABELS: Record<RecognitionType, string> = {
  [RecognitionType.EXCEPTIONAL_PERFORMANCE]: 'Exceptional Performance',
  [RecognitionType.PROJECT_COMPLETION]: 'Project Completion',
  [RecognitionType.QUALITY_EXCELLENCE]: 'Quality Excellence',
  [RecognitionType.PRODUCTIVITY_ACHIEVEMENT]: 'Productivity Achievement',
  [RecognitionType.CERTIFICATION_EARNED]: 'Certification Earned',
  [RecognitionType.SKILL_MASTERY]: 'Skill Mastery',
  [RecognitionType.TRAINING_COMPLETION]: 'Training Completion',
  [RecognitionType.POSITIVE_ATTITUDE]: 'Positive Attitude',
  [RecognitionType.TEAMWORK_COLLABORATION]: 'Teamwork & Collaboration',
  [RecognitionType.LEADERSHIP_DEMONSTRATED]: 'Leadership Demonstrated',
  [RecognitionType.MENTORSHIP_SUPPORT]: 'Mentorship & Support',
  [RecognitionType.CUSTOMER_SERVICE_EXCELLENCE]: 'Customer Service Excellence',
  [RecognitionType.CLIENT_SATISFACTION]: 'Client Satisfaction',
  [RecognitionType.PROCESS_IMPROVEMENT]: 'Process Improvement',
  [RecognitionType.INNOVATION]: 'Innovation',
  [RecognitionType.COST_SAVINGS]: 'Cost Savings',
  [RecognitionType.SAFETY_ACHIEVEMENT]: 'Safety Achievement',
  [RecognitionType.COMPLIANCE_EXCELLENCE]: 'Compliance Excellence',
  [RecognitionType.PERFECT_ATTENDANCE]: 'Perfect Attendance',
  [RecognitionType.RELIABILITY]: 'Reliability',
  [RecognitionType.GOING_ABOVE_BEYOND]: 'Going Above & Beyond',
  [RecognitionType.CRISIS_MANAGEMENT]: 'Crisis Management',
  [RecognitionType.MILESTONE_ANNIVERSARY]: 'Milestone Anniversary',
  [RecognitionType.OTHER]: 'Other Recognition'
};
```

### 2.2 Reward Type Enum

```typescript
/**
 * Types of rewards that can be given for recognition
 * Ranges from verbal praise to monetary bonuses
 */
export enum RewardType {
  // Non-Monetary
  VERBAL_PRAISE = 'verbal_praise',                    // Verbal recognition only
  PUBLIC_RECOGNITION = 'public_recognition',          // Announced in team meeting/company-wide
  CERTIFICATE = 'certificate',                        // Certificate of recognition
  LETTER_OF_COMMENDATION = 'letter_of_commendation', // Formal letter for employee file
  EMAIL_FROM_EXECUTIVE = 'email_from_executive',     // Email from CEO/executive

  // Monetary
  CASH_BONUS = 'cash_bonus',                          // Monetary bonus
  GIFT_CARD = 'gift_card',                            // Gift card/voucher
  SALARY_INCREASE = 'salary_increase',                // Permanent salary increase

  // Time-Based
  PAID_TIME_OFF = 'paid_time_off',                    // Extra paid time off
  FLEXIBLE_SCHEDULE = 'flexible_schedule',            // Flexible working hours
  EARLY_FINISH_DAY = 'early_finish_day',              // Leave early one day

  // Development Opportunities
  TRAINING_OPPORTUNITY = 'training_opportunity',      // Paid training/course
  CONFERENCE_ATTENDANCE = 'conference_attendance',    // Conference/event attendance
  MENTORSHIP_PROGRAM = 'mentorship_program',          // Assigned mentor/coach
  SPECIAL_PROJECT = 'special_project',                // Opportunity to lead project

  // Perks & Benefits
  PARKING_SPOT = 'parking_spot',                      // Reserved parking spot
  OFFICE_UPGRADE = 'office_upgrade',                  // Better desk/office location
  EQUIPMENT_UPGRADE = 'equipment_upgrade',            // New laptop/equipment
  LUNCH_WITH_EXECUTIVE = 'lunch_with_executive',      // Lunch with senior leadership

  // Team Recognition
  TEAM_LUNCH = 'team_lunch',                          // Team lunch/outing
  TEAM_EVENT = 'team_event',                          // Team building event

  // Custom
  OTHER = 'other'                                     // Custom reward
}

/**
 * Display labels for reward types
 */
export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  [RewardType.VERBAL_PRAISE]: 'Verbal Praise',
  [RewardType.PUBLIC_RECOGNITION]: 'Public Recognition',
  [RewardType.CERTIFICATE]: 'Certificate of Recognition',
  [RewardType.LETTER_OF_COMMENDATION]: 'Letter of Commendation',
  [RewardType.EMAIL_FROM_EXECUTIVE]: 'Email from Executive',
  [RewardType.CASH_BONUS]: 'Cash Bonus',
  [RewardType.GIFT_CARD]: 'Gift Card',
  [RewardType.SALARY_INCREASE]: 'Salary Increase',
  [RewardType.PAID_TIME_OFF]: 'Paid Time Off',
  [RewardType.FLEXIBLE_SCHEDULE]: 'Flexible Schedule',
  [RewardType.EARLY_FINISH_DAY]: 'Early Finish Day',
  [RewardType.TRAINING_OPPORTUNITY]: 'Training Opportunity',
  [RewardType.CONFERENCE_ATTENDANCE]: 'Conference Attendance',
  [RewardType.MENTORSHIP_PROGRAM]: 'Mentorship Program',
  [RewardType.SPECIAL_PROJECT]: 'Special Project Assignment',
  [RewardType.PARKING_SPOT]: 'Reserved Parking Spot',
  [RewardType.OFFICE_UPGRADE]: 'Office Upgrade',
  [RewardType.EQUIPMENT_UPGRADE]: 'Equipment Upgrade',
  [RewardType.LUNCH_WITH_EXECUTIVE]: 'Lunch with Executive',
  [RewardType.TEAM_LUNCH]: 'Team Lunch',
  [RewardType.TEAM_EVENT]: 'Team Event',
  [RewardType.OTHER]: 'Other Reward'
};
```

### 2.3 Supporting Enums

```typescript
/**
 * Business impact level of the recognition
 */
export enum ImpactLevel {
  INDIVIDUAL = 'individual',     // Impacts individual's work
  TEAM = 'team',                 // Impacts team performance
  DEPARTMENT = 'department',     // Impacts department
  ORGANIZATION = 'organization'  // Organization-wide impact
}

/**
 * Competency/proficiency level demonstrated
 */
export enum CompetencyLevel {
  BASIC = 'basic',               // Basic proficiency
  INTERMEDIATE = 'intermediate', // Intermediate proficiency
  ADVANCED = 'advanced',         // Advanced proficiency
  EXPERT = 'expert'              // Expert/master level
}

/**
 * Who can view this recognition
 */
export enum RecognitionVisibility {
  PRIVATE = 'private',           // Manager & employee only
  TEAM = 'team',                 // Visible to employee's team
  DEPARTMENT = 'department',     // Visible to department
  ORGANIZATION = 'organization'  // Company-wide visibility
}

/**
 * Recognition record status
 */
export enum RecognitionStatus {
  DRAFT = 'draft',               // Being created (not yet submitted)
  PENDING_APPROVAL = 'pending_approval', // Awaiting higher-level approval
  APPROVED = 'approved',         // Approved and active
  ACKNOWLEDGED = 'acknowledged', // Employee has acknowledged
  ARCHIVED = 'archived'          // Archived (historical record)
}

/**
 * Display labels for enums
 */
export const IMPACT_LEVEL_LABELS: Record<ImpactLevel, string> = {
  [ImpactLevel.INDIVIDUAL]: 'Individual Impact',
  [ImpactLevel.TEAM]: 'Team Impact',
  [ImpactLevel.DEPARTMENT]: 'Department Impact',
  [ImpactLevel.ORGANIZATION]: 'Organization-Wide Impact'
};

export const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  [CompetencyLevel.BASIC]: 'Basic Proficiency',
  [CompetencyLevel.INTERMEDIATE]: 'Intermediate Proficiency',
  [CompetencyLevel.ADVANCED]: 'Advanced Proficiency',
  [CompetencyLevel.EXPERT]: 'Expert/Master Level'
};

export const VISIBILITY_LABELS: Record<RecognitionVisibility, string> = {
  [RecognitionVisibility.PRIVATE]: 'Private (Manager & Employee)',
  [RecognitionVisibility.TEAM]: 'Team Visible',
  [RecognitionVisibility.DEPARTMENT]: 'Department Visible',
  [RecognitionVisibility.ORGANIZATION]: 'Company-Wide'
};

export const STATUS_LABELS: Record<RecognitionStatus, string> = {
  [RecognitionStatus.DRAFT]: 'Draft',
  [RecognitionStatus.PENDING_APPROVAL]: 'Pending Approval',
  [RecognitionStatus.APPROVED]: 'Approved',
  [RecognitionStatus.ACKNOWLEDGED]: 'Acknowledged',
  [RecognitionStatus.ARCHIVED]: 'Archived'
};
```

---

## 3. Firestore Collection Structure

### 3.1 Recommended Collection Path

```
organizations/{orgId}/recognitions/{recognitionId}
organizations/{orgId}/recognitionCategories/{categoryId}
```

**Rationale:**
- Mirrors existing pattern used for warnings (`organizations/{orgId}/warnings/{warningId}`)
- Sharded by organization for scalability (same architecture as warnings)
- Keeps all organization data isolated per security rules
- Enables efficient querying within organization scope
- Aligns with existing Firestore security rules structure

### 3.2 Collection Schema

#### 3.2.1 Recognitions Collection

```
/organizations/{orgId}/recognitions/{recognitionId}
```

**Document Structure:**
```javascript
{
  id: "rec_abc123",
  organizationId: "org_xyz789",
  employeeId: "emp_456",
  categoryId: "cat_customer_service",

  type: "customer_service_excellence",
  title: "Exceptional Customer Service",
  description: "Resolved complex customer complaint...",

  achievementDate: Timestamp,
  achievementLocation: "Store Floor",
  businessImpact: "Prevented customer churn, retained R50k account",

  skillsDemonstrated: ["Problem Solving", "Communication", "Empathy"],
  competencyLevel: "advanced",

  rewardsGiven: ["public_recognition", "cash_bonus", "certificate"],
  rewardDetails: {
    bonusAmount: 2000,
    certificateIssued: true,
    publicPraiseDetails: "Recognized at monthly town hall meeting"
  },

  futureGoals: "Consider for team lead role next quarter",
  developmentOpportunities: ["Customer service training certification"],

  evidenceUrls: ["gs://bucket/photo1.jpg"],
  witnessNames: ["John Doe", "Jane Smith"],
  witnessStatements: ["I saw how calmly Sarah handled..."],

  managerComments: "Outstanding example of our values in action",
  recognizedBy: "mgr_123",
  recognizedByName: "Manager Name",

  employeeAcknowledged: true,
  employeeAcknowledgedAt: Timestamp,
  employeeComments: "Thank you for recognizing my efforts!",

  visibility: "department",
  shareWithTeam: true,
  shareInNewsletter: true,

  status: "acknowledged",
  createdAt: Timestamp,
  updatedAt: Timestamp,

  pdfUrl: "https://storage.../certificate.pdf",
  pdfGeneratedAt: Timestamp
}
```

**Firestore Indexes Required:**
```javascript
// Query: Get all recognitions for an employee
organizations/{orgId}/recognitions
  - employeeId (Ascending)
  - createdAt (Descending)

// Query: Get recognitions by category
organizations/{orgId}/recognitions
  - categoryId (Ascending)
  - achievementDate (Descending)

// Query: Get recent recognitions for dashboard
organizations/{orgId}/recognitions
  - status (Ascending)
  - createdAt (Descending)

// Query: Get recognitions by type
organizations/{orgId}/recognitions
  - type (Ascending)
  - achievementDate (Descending)

// Query: Get recognitions awaiting approval
organizations/{orgId}/recognitions
  - status (Ascending)
  - createdAt (Ascending)
```

#### 3.2.2 Recognition Categories Collection

```
/organizations/{orgId}/recognitionCategories/{categoryId}
```

**Document Structure:**
```javascript
{
  id: "cat_customer_service",
  organizationId: "org_xyz789",
  name: "Customer Service Excellence",
  description: "Outstanding customer service delivery",
  icon: "😊",

  impactLevel: "organization",

  suggestedRewards: ["cash_bonus", "certificate", "public_recognition"],
  suggestedSkills: ["Communication", "Problem Solving", "Empathy"],

  requiresEvidence: false,
  requiresWitness: false,
  requiresManagerApproval: false,

  contributesToPromotion: true,
  contributesToBonus: true,

  isActive: true,
  displayOrder: 1,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4. Firestore Security Rules

```javascript
// Add to /config/firestore.rules

// ============================================
// RECOGNITION SYSTEM RULES
// ============================================

// Recognition records - Similar to warnings permissions
match /organizations/{organizationId}/recognitions/{recognitionId} {
  // Read: All managers and employees in organization can read recognitions
  // (Visibility filtering handled in application layer)
  allow read: if canReadOrgData(organizationId);

  // Create: All managers can create recognitions for their team members
  allow create: if canManagerAccess(organizationId);

  // Update: Only creator or HR can update
  allow update: if canManagerAccess(organizationId) && (
    resource.data.recognizedBy == request.auth.uid ||
    isHRManager()
  );

  // Delete: Only HR or super-user can delete
  allow delete: if canManageOrgData(organizationId);
}

// Recognition categories - Same pattern as warning categories
match /organizations/{organizationId}/recognitionCategories/{categoryId} {
  allow read: if canReadOrgData(organizationId);
  allow write: if canManageOrgData(organizationId);
}
```

---

## 5. Default Recognition Categories

**Pre-populated categories for new organizations (similar to warning categories):**

```typescript
export const DEFAULT_RECOGNITION_CATEGORIES: Omit<RecognitionCategory, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Exceptional Performance',
    description: 'Consistently exceeds performance expectations and delivers outstanding results',
    icon: '🏆',
    impactLevel: ImpactLevel.INDIVIDUAL,
    suggestedRewards: [RewardType.CASH_BONUS, RewardType.PUBLIC_RECOGNITION, RewardType.CERTIFICATE],
    suggestedSkills: ['Excellence', 'Dedication', 'Quality Focus'],
    requiresEvidence: false,
    requiresWitness: false,
    requiresManagerApproval: false,
    contributesToPromotion: true,
    contributesToBonus: true,
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Customer Service Excellence',
    description: 'Outstanding customer service delivery resulting in high satisfaction',
    icon: '😊',
    impactLevel: ImpactLevel.ORGANIZATION,
    suggestedRewards: [RewardType.CASH_BONUS, RewardType.CERTIFICATE, RewardType.PUBLIC_RECOGNITION],
    suggestedSkills: ['Communication', 'Empathy', 'Problem Solving'],
    requiresEvidence: false,
    requiresWitness: true,
    requiresManagerApproval: false,
    contributesToPromotion: true,
    contributesToBonus: true,
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Innovation & Improvement',
    description: 'Implemented new ideas or process improvements that benefit the organization',
    icon: '💡',
    impactLevel: ImpactLevel.DEPARTMENT,
    suggestedRewards: [RewardType.CASH_BONUS, RewardType.SPECIAL_PROJECT, RewardType.PUBLIC_RECOGNITION],
    suggestedSkills: ['Innovation', 'Critical Thinking', 'Initiative'],
    requiresEvidence: true,
    requiresWitness: false,
    requiresManagerApproval: true,
    contributesToPromotion: true,
    contributesToBonus: true,
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'Teamwork & Collaboration',
    description: 'Exceptional team player who helps and supports colleagues',
    icon: '🤝',
    impactLevel: ImpactLevel.TEAM,
    suggestedRewards: [RewardType.PUBLIC_RECOGNITION, RewardType.CERTIFICATE, RewardType.TEAM_LUNCH],
    suggestedSkills: ['Collaboration', 'Communication', 'Support'],
    requiresEvidence: false,
    requiresWitness: true,
    requiresManagerApproval: false,
    contributesToPromotion: true,
    contributesToBonus: false,
    isActive: true,
    displayOrder: 4
  },
  {
    name: 'Leadership Excellence',
    description: 'Demonstrated exceptional leadership qualities and inspired others',
    icon: '⭐',
    impactLevel: ImpactLevel.DEPARTMENT,
    suggestedRewards: [RewardType.SPECIAL_PROJECT, RewardType.MENTORSHIP_PROGRAM, RewardType.CASH_BONUS],
    suggestedSkills: ['Leadership', 'Motivation', 'Decision Making'],
    requiresEvidence: false,
    requiresWitness: true,
    requiresManagerApproval: true,
    contributesToPromotion: true,
    contributesToBonus: true,
    isActive: true,
    displayOrder: 5
  },
  {
    name: 'Safety Achievement',
    description: 'Significant contribution to workplace safety and accident prevention',
    icon: '🛡️',
    impactLevel: ImpactLevel.ORGANIZATION,
    suggestedRewards: [RewardType.CERTIFICATE, RewardType.CASH_BONUS, RewardType.PUBLIC_RECOGNITION],
    suggestedSkills: ['Safety Awareness', 'Attention to Detail', 'Responsibility'],
    requiresEvidence: true,
    requiresWitness: false,
    requiresManagerApproval: false,
    contributesToPromotion: true,
    contributesToBonus: true,
    isActive: true,
    displayOrder: 6
  },
  {
    name: 'Perfect Attendance',
    description: 'Perfect attendance record for specified period',
    icon: '📅',
    impactLevel: ImpactLevel.INDIVIDUAL,
    suggestedRewards: [RewardType.PAID_TIME_OFF, RewardType.GIFT_CARD, RewardType.CERTIFICATE],
    suggestedSkills: ['Reliability', 'Commitment', 'Dedication'],
    requiresEvidence: false,
    requiresWitness: false,
    requiresManagerApproval: false,
    contributesToPromotion: false,
    contributesToBonus: true,
    isActive: true,
    displayOrder: 7
  },
  {
    name: 'Milestone Achievement',
    description: 'Service anniversary or significant career milestone',
    icon: '🎉',
    impactLevel: ImpactLevel.INDIVIDUAL,
    suggestedRewards: [RewardType.CERTIFICATE, RewardType.GIFT_CARD, RewardType.PUBLIC_RECOGNITION],
    suggestedSkills: ['Loyalty', 'Dedication', 'Commitment'],
    requiresEvidence: false,
    requiresWitness: false,
    requiresManagerApproval: false,
    contributesToPromotion: false,
    contributesToBonus: false,
    isActive: true,
    displayOrder: 8
  }
];
```

---

## 6. Integration with Existing Employee System

### 6.1 Updates to Employee Interface

Add recognition summary to `Employee` interface in `/home/aiguy/projects/hr-disciplinary-system/frontend/src/types/employee.ts`:

```typescript
export interface RecognitionRecord {
  totalRecognitions: number;
  recognitionsByCategory: Record<string, number>; // categoryId -> count
  recognitionsByType: Record<RecognitionType, number>;
  lastRecognitionDate?: Date;
  recentRecognitions: RecognitionHistoryEntry[];

  // Aggregate rewards received
  totalBonusesReceived: number;
  totalRewardsCount: number;
  certificatesEarned: number;
}

export interface RecognitionHistoryEntry {
  id: string;
  categoryId: string;
  type: RecognitionType;
  title: string;
  achievementDate: Date;
  recognizedBy: string;
  recognizedByName: string;
  rewardsGiven: RewardType[];
  impactLevel: ImpactLevel;
}

// Add to Employee interface
export interface Employee {
  // ... existing fields ...

  recognitionRecord?: RecognitionRecord; // Optional, calculated field
}
```

### 6.2 Dashboard Metrics

Add to employee profile card and manager dashboards:

```typescript
// Recognition metrics for dashboard
interface EmployeeRecognitionMetrics {
  totalRecognitions: number;
  recognitionsThisMonth: number;
  recognitionsThisYear: number;
  lastRecognitionDate?: Date;
  topCategories: Array<{ categoryId: string; count: number }>;
  totalRewardsValue: number; // If monetary rewards tracked
}
```

---

## 7. Visibility & Permission Logic

### 7.1 Who Can See What?

**Application-layer visibility filtering** (security rules allow broad read, application filters by visibility setting):

```typescript
/**
 * Determines if a user can view a recognition record
 * Based on recognition.visibility and user's role/department
 */
function canViewRecognition(
  recognition: Recognition,
  currentUser: User,
  employee: Employee
): boolean {
  // Creator can always view
  if (recognition.recognizedBy === currentUser.uid) {
    return true;
  }

  // Subject employee can always view
  if (recognition.employeeId === currentUser.uid) {
    return true;
  }

  // HR and Super-users can view all
  if (currentUser.role.id === 'hr-manager' || currentUser.role.id === 'super-user') {
    return true;
  }

  // Check visibility level
  switch (recognition.visibility) {
    case RecognitionVisibility.PRIVATE:
      return false; // Only creator and employee

    case RecognitionVisibility.TEAM:
      // Check if user is on same team (shares a manager)
      return employee.employment.managerIds?.some(
        managerId => currentUser.departmentIds?.includes(managerId)
      );

    case RecognitionVisibility.DEPARTMENT:
      // Check if user is in same department
      return currentUser.departmentIds?.includes(employee.employment.department);

    case RecognitionVisibility.ORGANIZATION:
      // All organization members can view
      return currentUser.organizationId === recognition.organizationId;

    default:
      return false;
  }
}
```

---

## 8. Metrics & Reporting

### 8.1 Dashboard Metrics

**For HR Dashboard:**
- Total recognitions this month/quarter/year
- Recognition by category breakdown (chart)
- Recognition by type breakdown (chart)
- Top recognized employees (leaderboard)
- Department recognition comparison
- Reward types distribution
- Average recognitions per employee
- Recognition trend over time

**For Manager Dashboard:**
- Recognitions given by you this month
- Your team's total recognitions
- Pending approvals (if applicable)
- Quick action: Recognize team member

**For Employee Profile:**
- Total recognitions received
- Recognition timeline
- Skills demonstrated (word cloud or badges)
- Total rewards value (if monetary)
- Certificates earned

### 8.2 Performance Review Export

```typescript
interface PerformanceReviewRecognitionSummary {
  employeeId: string;
  employeeName: string;
  period: { start: Date; end: Date };

  totalRecognitions: number;
  byCategory: Array<{ category: string; count: number }>;
  byImpactLevel: Record<ImpactLevel, number>;

  skillsDemonstrated: string[]; // Unique list
  competencyLevels: Record<CompetencyLevel, number>;

  rewardsSummary: {
    totalRewards: number;
    monetaryValue?: number;
    certificatesEarned: number;
    developmentOpportunities: string[];
  };

  managerComments: string[]; // All manager comments from period

  recommendations: string; // Generated recommendations based on recognitions
}
```

---

## 9. Migration & Rollout Strategy

### 9.1 Phase 1: Foundation (Week 1)
1. Create TypeScript types in `/frontend/src/types/recognition.ts`
2. Create Firestore collections structure
3. Add security rules to `/config/firestore.rules`
4. Create default recognition categories

### 9.2 Phase 2: Core Features (Week 2)
1. Build recognition creation form (similar to warning wizard)
2. Build recognition detail view/modal
3. Add recognition list to employee profile
4. Add recognition metrics to dashboard

### 9.3 Phase 3: Advanced Features (Week 3)
1. Certificate PDF generation
2. Recognition approval workflow (if needed)
3. Recognition sharing/visibility controls
4. Email notifications for recognitions

### 9.4 Phase 4: Analytics & Export (Week 4)
1. Dashboard charts and metrics
2. Performance review export
3. Recognition leaderboards
4. Trend analysis reports

---

## 10. Design Decisions & Rationale

### 10.1 Why Mirror Warning System?

**Reusing proven patterns from Warning system:**
- Development velocity (familiar patterns)
- Consistency in codebase
- Reuse of existing UI components (modals, forms, cards)
- Similar workflow (manager documents event → employee acknowledges)
- Same security model (organization-scoped, role-based)

### 10.2 Why Flexible Rewards Array?

Multiple reward types can be given simultaneously:
- Real-world scenario: Manager gives verbal praise + certificate + bonus
- Allows tracking of total rewards value
- Better analytics on reward effectiveness
- Flexible for different organization policies

### 10.3 Why Visibility Levels?

Different recognitions have different sharing appropriateness:
- **Private**: Personal growth recognition, sensitive achievements
- **Team**: Team-level accomplishments
- **Department**: Department-wide impact
- **Organization**: Company-wide inspiration, major achievements

### 10.4 Why Skills Demonstrated Array?

Building employee skill profiles over time:
- Tracks demonstrated competencies
- Supports promotion decisions (evidence-based)
- Identifies training needs (inverse - what's missing?)
- Creates "proof" of capabilities beyond job description

### 10.5 Why Business Impact Required?

Differentiates recognition from participation trophies:
- Forces manager to articulate value
- Creates tangible justification for rewards
- Builds case for promotions/bonuses
- Educates employees on business thinking
- Demonstrates ROI of employee contributions

### 10.6 Why Optional Evidence?

Some recognitions need proof, others don't:
- Innovation/improvement: Need before/after metrics
- Customer service: Customer email/feedback
- Safety: Incident reports, audit results
- Attitude/teamwork: Witness statements sufficient
- Flexibility prevents administrative burden

---

## 11. Example Use Cases

### Use Case 1: Customer Service Excellence
```typescript
{
  type: RecognitionType.CUSTOMER_SERVICE_EXCELLENCE,
  title: "Resolved Complex Customer Complaint",
  description: "Customer threatened to cancel R50k annual contract. Sarah...",
  businessImpact: "Retained R50k annual revenue, customer left 5-star review",
  skillsDemonstrated: ["Problem Solving", "Communication", "Empathy", "Negotiation"],
  rewardsGiven: [RewardType.CASH_BONUS, RewardType.PUBLIC_RECOGNITION],
  rewardDetails: {
    bonusAmount: 2000,
    publicPraiseDetails: "Recognized at monthly town hall"
  },
  evidenceUrls: ["gs://bucket/customer-email.pdf"],
  visibility: RecognitionVisibility.ORGANIZATION
}
```

### Use Case 2: Process Improvement
```typescript
{
  type: RecognitionType.PROCESS_IMPROVEMENT,
  title: "Automated Invoice Processing",
  description: "John created Excel macro that automated manual invoice entry...",
  businessImpact: "Saves 10 hours per week, reduces errors by 95%",
  skillsDemonstrated: ["Innovation", "Technical Skills", "Efficiency"],
  rewardsGiven: [RewardType.CASH_BONUS, RewardType.SPECIAL_PROJECT],
  rewardDetails: {
    bonusAmount: 5000,
    customRewardDescription: "Asked to lead department automation initiative"
  },
  futureGoals: "Consider for IT liaison role, explore more automation opportunities",
  requiresManagerApproval: true, // High-impact recognition
  visibility: RecognitionVisibility.ORGANIZATION
}
```

### Use Case 3: Perfect Attendance
```typescript
{
  type: RecognitionType.PERFECT_ATTENDANCE,
  title: "6 Months Perfect Attendance",
  description: "No absences, late arrivals, or early departures for 6 months",
  businessImpact: "Reliability ensures consistent production output",
  skillsDemonstrated: ["Reliability", "Commitment", "Dedication"],
  rewardsGiven: [RewardType.PAID_TIME_OFF, RewardType.CERTIFICATE],
  rewardDetails: {
    timeOffHours: 8,
    certificateIssued: true
  },
  visibility: RecognitionVisibility.TEAM
}
```

---

## 12. Implementation Checklist

### Data Layer
- [ ] Create `/frontend/src/types/recognition.ts` with all interfaces and enums
- [ ] Add recognition collections to Firestore
- [ ] Update Firestore security rules
- [ ] Create recognition service class (similar to WarningService)
- [ ] Add indexes for common queries

### UI Components
- [ ] Recognition creation wizard/form
- [ ] Recognition detail modal
- [ ] Recognition list component
- [ ] Recognition card component
- [ ] Category selector
- [ ] Reward selector (multi-select)
- [ ] Skills selector (autocomplete/tags)
- [ ] Evidence upload component

### Dashboard Integration
- [ ] Add recognition metrics to HR dashboard
- [ ] Add recognition metrics to manager dashboard
- [ ] Add recognition history to employee profile
- [ ] Create recognition analytics page
- [ ] Add "Recognize Employee" quick action button

### Features
- [ ] Certificate PDF generation
- [ ] Email notifications
- [ ] Recognition approval workflow (if needed)
- [ ] Recognition export for performance reviews
- [ ] Recognition leaderboard
- [ ] Recognition trends/analytics

### Testing
- [ ] Unit tests for visibility logic
- [ ] Integration tests for CRUD operations
- [ ] E2E tests for recognition workflow
- [ ] Security rules tests

---

## 13. Conclusion

This Recognition & Achievement Tracking system provides a comprehensive, balanced complement to the disciplinary system. By documenting positive behaviors and achievements, organizations can:

1. **Motivate employees** through formal recognition
2. **Build evidence** for promotions and bonuses
3. **Create culture** of appreciation and excellence
4. **Track development** of skills and competencies
5. **Support decisions** with concrete data
6. **Improve retention** through recognition programs
7. **Balance perspective** alongside disciplinary records

The data model leverages proven patterns from the existing Warning system while introducing recognition-specific features like flexible rewards, visibility controls, and business impact tracking.

**Key Strengths:**
- Simple and practical for everyday HR use
- Flexible reward system suits different organization types
- Evidence-based approach supports fair promotion decisions
- Integrates seamlessly with existing employee records
- Scalable architecture mirrors proven warning system
- Strong visibility controls respect privacy while enabling sharing

**Next Steps:**
1. Review and approve data model
2. Prioritize features for MVP (core creation/viewing)
3. Begin implementation starting with types and services
4. Iterate based on user feedback from HR managers

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Author:** Claude Code (Opus 4.1)
**Status:** Ready for Review & Implementation
