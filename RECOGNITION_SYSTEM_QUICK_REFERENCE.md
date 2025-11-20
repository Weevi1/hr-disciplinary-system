# Recognition System - Quick Reference Guide

**One-page summary of the Recognition & Achievement Tracking system**

---

## Core Concept

Balance the disciplinary system with positive reinforcement. Enable managers to document exceptional performance, achievements, and behaviors to build evidence for promotions, bonuses, and performance reviews.

---

## Key Interfaces

### Recognition Record
```typescript
interface Recognition {
  // Identity
  id: string;
  organizationId: string;
  employeeId: string;
  categoryId: string;

  // What happened
  type: RecognitionType;              // e.g., 'customer_service_excellence'
  title: string;                      // "Resolved Complex Customer Complaint"
  description: string;                // Detailed narrative
  achievementDate: Date;
  businessImpact: string;             // "Retained R50k annual revenue"

  // Skills & Growth
  skillsDemonstrated: string[];       // ["Problem Solving", "Communication"]
  competencyLevel?: CompetencyLevel;  // 'basic' | 'intermediate' | 'advanced' | 'expert'
  futureGoals?: string;               // Development opportunities

  // Rewards
  rewardsGiven: RewardType[];         // ['cash_bonus', 'certificate']
  rewardDetails?: {
    bonusAmount?: number;
    timeOffHours?: number;
    certificateIssued?: boolean;
    publicPraiseDetails?: string;
    // ... more
  };

  // Evidence
  evidenceUrls?: string[];            // Photos, documents, metrics
  witnessNames?: string[];
  witnessStatements?: string[];

  // Manager & Employee
  managerComments: string;
  recognizedBy: string;
  recognizedByName: string;
  employeeAcknowledged: boolean;
  employeeComments?: string;

  // Visibility
  visibility: RecognitionVisibility;  // 'private' | 'team' | 'department' | 'organization'
  shareWithTeam: boolean;
  shareInNewsletter: boolean;

  // Metadata
  status: RecognitionStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Recognition Types (24 total)

### Performance-Based
- Exceptional Performance
- Project Completion
- Quality Excellence
- Productivity Achievement

### Skills & Learning
- Certification Earned
- Skill Mastery
- Training Completion

### Behavioral
- Positive Attitude
- Teamwork & Collaboration
- Leadership Demonstrated
- Mentorship & Support

### Customer-Focused
- Customer Service Excellence
- Client Satisfaction

### Innovation
- Process Improvement
- Innovation
- Cost Savings

### Safety & Compliance
- Safety Achievement
- Compliance Excellence

### Attendance
- Perfect Attendance
- Reliability

### Special
- Going Above & Beyond
- Crisis Management
- Milestone Anniversary
- Other

---

## Reward Types (22 total)

### Non-Monetary
- Verbal Praise
- Public Recognition
- Certificate
- Letter of Commendation
- Email from Executive

### Monetary
- Cash Bonus
- Gift Card
- Salary Increase

### Time-Based
- Paid Time Off
- Flexible Schedule
- Early Finish Day

### Development
- Training Opportunity
- Conference Attendance
- Mentorship Program
- Special Project Assignment

### Perks
- Reserved Parking Spot
- Office Upgrade
- Equipment Upgrade
- Lunch with Executive

### Team
- Team Lunch
- Team Event

### Custom
- Other

---

## Firestore Structure

```
/organizations/{orgId}/recognitions/{recognitionId}
/organizations/{orgId}/recognitionCategories/{categoryId}
```

**Mirrors warning system architecture** for consistency and scalability.

---

## Default Categories (8)

1. **Exceptional Performance** 🏆 - Exceeds expectations consistently
2. **Customer Service Excellence** 😊 - Outstanding customer satisfaction
3. **Innovation & Improvement** 💡 - New ideas/process improvements
4. **Teamwork & Collaboration** 🤝 - Supports and helps colleagues
5. **Leadership Excellence** ⭐ - Inspires and leads others
6. **Safety Achievement** 🛡️ - Safety contributions
7. **Perfect Attendance** 📅 - Perfect attendance period
8. **Milestone Achievement** 🎉 - Service anniversaries

---

## Visibility Levels

| Level | Who Can See |
|-------|-------------|
| **Private** | Manager & employee only |
| **Team** | Employee's immediate team |
| **Department** | Entire department |
| **Organization** | Company-wide |

---

## Key Indexes Needed

```javascript
// Employee's recognition history
organizations/{orgId}/recognitions
  - employeeId (ASC) + createdAt (DESC)

// Recent recognitions dashboard
organizations/{orgId}/recognitions
  - status (ASC) + createdAt (DESC)

// Category breakdown
organizations/{orgId}/recognitions
  - categoryId (ASC) + achievementDate (DESC)

// Type analysis
organizations/{orgId}/recognitions
  - type (ASC) + achievementDate (DESC)

// Approval queue
organizations/{orgId}/recognitions
  - status (ASC) + createdAt (ASC)
```

---

## Security Rules Summary

```javascript
// Recognitions collection
match /organizations/{orgId}/recognitions/{recognitionId} {
  allow read: if canReadOrgData(orgId);
  allow create: if canManagerAccess(orgId);
  allow update: if canManagerAccess(orgId) && (
    resource.data.recognizedBy == request.auth.uid || isHRManager()
  );
  allow delete: if canManageOrgData(orgId);
}

// Categories collection
match /organizations/{orgId}/recognitionCategories/{categoryId} {
  allow read: if canReadOrgData(orgId);
  allow write: if canManageOrgData(orgId);
}
```

---

## Dashboard Metrics

### HR Dashboard
- Total recognitions this month/quarter/year
- Recognition by category breakdown
- Top recognized employees
- Department comparison
- Reward types distribution
- Recognition trends

### Manager Dashboard
- Recognitions given by you
- Your team's total recognitions
- Pending approvals
- Quick action: Recognize team member

### Employee Profile
- Total recognitions received
- Recognition timeline
- Skills demonstrated (badges)
- Certificates earned
- Total rewards value

---

## Integration with Employee Record

Add to Employee interface:

```typescript
interface RecognitionRecord {
  totalRecognitions: number;
  recognitionsByCategory: Record<string, number>;
  recognitionsByType: Record<RecognitionType, number>;
  lastRecognitionDate?: Date;
  recentRecognitions: RecognitionHistoryEntry[];
  totalBonusesReceived: number;
  certificatesEarned: number;
}

// Add to Employee
interface Employee {
  // ... existing fields ...
  recognitionRecord?: RecognitionRecord;
}
```

---

## Example Recognition

```typescript
{
  type: 'customer_service_excellence',
  title: 'Resolved Complex Customer Complaint',
  description: 'Customer threatened to cancel R50k contract. Sarah de-escalated...',
  businessImpact: 'Retained R50k annual revenue, customer left 5-star review',
  achievementDate: new Date('2025-11-10'),

  skillsDemonstrated: ['Problem Solving', 'Communication', 'Empathy'],
  competencyLevel: 'advanced',

  rewardsGiven: ['cash_bonus', 'public_recognition', 'certificate'],
  rewardDetails: {
    bonusAmount: 2000,
    publicPraiseDetails: 'Recognized at monthly town hall',
    certificateIssued: true
  },

  managerComments: 'Outstanding example of our values in action',
  visibility: 'organization',
  shareWithTeam: true,
  status: 'acknowledged'
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- TypeScript types
- Firestore collections
- Security rules
- Default categories

### Phase 2: Core Features (Week 2)
- Creation form
- Detail view/modal
- Employee profile integration
- Basic dashboard metrics

### Phase 3: Advanced (Week 3)
- Certificate PDF generation
- Approval workflow
- Visibility controls
- Email notifications

### Phase 4: Analytics (Week 4)
- Dashboard charts
- Performance review export
- Leaderboards
- Trend analysis

---

## Why This Design?

1. **Mirrors Warning System** - Reuses proven patterns for velocity
2. **Flexible Rewards** - Multiple reward types can be combined
3. **Visibility Control** - Different sharing levels for different contexts
4. **Skills Tracking** - Builds evidence of competencies over time
5. **Business Impact** - Forces articulation of value (not participation trophies)
6. **Evidence-Based** - Supports promotion/bonus decisions with data
7. **Balanced Culture** - Counterbalances disciplinary focus with recognition

---

## File Location

**Full Documentation:** `/home/aiguy/projects/hr-disciplinary-system/RECOGNITION_SYSTEM_DATA_MODEL.md`

---

**Last Updated:** 2025-11-12
