# Recognition System - Query Examples & Use Cases

**Practical examples of how to query and use the Recognition system**

---

## 1. Employee Recognition History

### Query: Get all recognitions for an employee
```typescript
const recognitions = await db
  .collection(`organizations/${orgId}/recognitions`)
  .where('employeeId', '==', employeeId)
  .orderBy('achievementDate', 'desc')
  .get();
```

### Use Case: Display on Employee Profile
```typescript
interface EmployeeRecognitionTab {
  totalRecognitions: number;
  timeline: Recognition[];
  topCategories: { category: string; count: number }[];
  totalRewardsValue: number;
  skillsBadges: string[];
}

async function getEmployeeRecognitionSummary(
  employeeId: string,
  orgId: string
): Promise<EmployeeRecognitionTab> {
  const recognitions = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('employeeId', '==', employeeId)
    .orderBy('achievementDate', 'desc')
    .get();

  const data = recognitions.docs.map(doc => doc.data() as Recognition);

  // Calculate metrics
  const totalRewardsValue = data.reduce((sum, r) => {
    return sum + (r.rewardDetails?.bonusAmount || 0);
  }, 0);

  const categoryCounts = data.reduce((acc, r) => {
    acc[r.categoryId] = (acc[r.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const allSkills = data.flatMap(r => r.skillsDemonstrated);
  const uniqueSkills = [...new Set(allSkills)];

  return {
    totalRecognitions: data.length,
    timeline: data,
    topCategories,
    totalRewardsValue,
    skillsBadges: uniqueSkills
  };
}
```

---

## 2. Recent Recognitions Dashboard

### Query: Get recent recognitions for organization
```typescript
const recentRecognitions = await db
  .collection(`organizations/${orgId}/recognitions`)
  .where('status', 'in', ['approved', 'acknowledged'])
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();
```

### Use Case: HR Dashboard "Recent Activity" Widget
```typescript
interface RecentRecognitionWidget {
  recognitions: Array<{
    id: string;
    employeeName: string;
    type: string;
    title: string;
    achievementDate: Date;
    recognizedByName: string;
  }>;
}

async function getRecentRecognitionsWidget(
  orgId: string
): Promise<RecentRecognitionWidget> {
  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('status', 'in', ['approved', 'acknowledged'])
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const employeeIds = [...new Set(snapshot.docs.map(doc => doc.data().employeeId))];
  const employees = await Promise.all(
    employeeIds.map(id =>
      db.collection(`organizations/${orgId}/employees`).doc(id).get()
    )
  );

  const employeeMap = new Map(
    employees.map(doc => [doc.id, doc.data()])
  );

  const recognitions = snapshot.docs.map(doc => {
    const r = doc.data() as Recognition;
    const employee = employeeMap.get(r.employeeId);

    return {
      id: r.id,
      employeeName: `${employee?.profile.firstName} ${employee?.profile.lastName}`,
      type: RECOGNITION_TYPE_LABELS[r.type],
      title: r.title,
      achievementDate: r.achievementDate,
      recognizedByName: r.recognizedByName
    };
  });

  return { recognitions };
}
```

---

## 3. Top Recognized Employees

### Query: Leaderboard of most recognized employees
```typescript
// Note: This requires aggregation, typically done in a Cloud Function
// Or client-side grouping after fetching

async function getTopRecognizedEmployees(
  orgId: string,
  timeframe: 'month' | 'quarter' | 'year'
): Promise<Array<{ employeeId: string; employeeName: string; count: number }>> {

  const startDate = getStartDateForTimeframe(timeframe);

  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('achievementDate', '>=', startDate)
    .where('status', 'in', ['approved', 'acknowledged'])
    .get();

  // Group by employee
  const countsByEmployee = snapshot.docs.reduce((acc, doc) => {
    const r = doc.data() as Recognition;
    acc[r.employeeId] = (acc[r.employeeId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get employee details
  const topEmployeeIds = Object.entries(countsByEmployee)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  const employees = await Promise.all(
    topEmployeeIds.map(id =>
      db.collection(`organizations/${orgId}/employees`).doc(id).get()
    )
  );

  return topEmployeeIds.map(id => {
    const employee = employees.find(e => e.id === id)?.data();
    return {
      employeeId: id,
      employeeName: `${employee?.profile.firstName} ${employee?.profile.lastName}`,
      count: countsByEmployee[id]
    };
  });
}

function getStartDateForTimeframe(timeframe: 'month' | 'quarter' | 'year'): Date {
  const now = new Date();
  switch (timeframe) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
  }
}
```

---

## 4. Recognition by Category

### Query: Breakdown by category for analytics
```typescript
async function getRecognitionsByCategory(
  orgId: string,
  period: { start: Date; end: Date }
): Promise<Array<{ categoryId: string; categoryName: string; count: number }>> {

  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('achievementDate', '>=', period.start)
    .where('achievementDate', '<=', period.end)
    .get();

  // Get all categories
  const categoriesSnapshot = await db
    .collection(`organizations/${orgId}/recognitionCategories`)
    .where('isActive', '==', true)
    .get();

  const categoriesMap = new Map(
    categoriesSnapshot.docs.map(doc => [doc.id, doc.data().name])
  );

  // Count by category
  const countsByCategory = snapshot.docs.reduce((acc, doc) => {
    const r = doc.data() as Recognition;
    acc[r.categoryId] = (acc[r.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(countsByCategory)
    .map(([categoryId, count]) => ({
      categoryId,
      categoryName: categoriesMap.get(categoryId) || 'Unknown',
      count
    }))
    .sort((a, b) => b.count - a.count);
}
```

---

## 5. Pending Approvals

### Query: Recognitions awaiting manager approval
```typescript
async function getPendingApprovals(
  orgId: string
): Promise<Recognition[]> {

  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('status', '==', 'pending_approval')
    .orderBy('createdAt', 'asc') // Oldest first
    .get();

  return snapshot.docs.map(doc => doc.data() as Recognition);
}
```

### Use Case: Approval Dashboard for HR
```typescript
interface ApprovalQueueItem {
  recognition: Recognition;
  employee: Employee;
  requiresApprovalReason: string;
  daysWaiting: number;
}

async function getApprovalQueue(
  orgId: string
): Promise<ApprovalQueueItem[]> {

  const recognitions = await getPendingApprovals(orgId);

  const queue = await Promise.all(
    recognitions.map(async (r) => {
      const employee = await db
        .collection(`organizations/${orgId}/employees`)
        .doc(r.employeeId)
        .get();

      const category = await db
        .collection(`organizations/${orgId}/recognitionCategories`)
        .doc(r.categoryId)
        .get();

      const categoryData = category.data() as RecognitionCategory;

      const daysWaiting = Math.floor(
        (Date.now() - r.createdAt.toMillis()) / (1000 * 60 * 60 * 24)
      );

      return {
        recognition: r,
        employee: employee.data() as Employee,
        requiresApprovalReason: categoryData.requiresManagerApproval
          ? 'High-impact recognition'
          : 'Reward value exceeds threshold',
        daysWaiting
      };
    })
  );

  return queue.sort((a, b) => b.daysWaiting - a.daysWaiting);
}
```

---

## 6. Skills Analysis

### Query: Most demonstrated skills across organization
```typescript
async function getTopSkillsDemonstrated(
  orgId: string,
  timeframe?: { start: Date; end: Date }
): Promise<Array<{ skill: string; count: number; employees: number }>> {

  let query = db.collection(`organizations/${orgId}/recognitions`) as any;

  if (timeframe) {
    query = query
      .where('achievementDate', '>=', timeframe.start)
      .where('achievementDate', '<=', timeframe.end);
  }

  const snapshot = await query.get();

  // Count skills and track unique employees per skill
  const skillData = snapshot.docs.reduce((acc, doc) => {
    const r = doc.data() as Recognition;

    r.skillsDemonstrated.forEach(skill => {
      if (!acc[skill]) {
        acc[skill] = { count: 0, employees: new Set<string>() };
      }
      acc[skill].count++;
      acc[skill].employees.add(r.employeeId);
    });

    return acc;
  }, {} as Record<string, { count: number; employees: Set<string> }>);

  return Object.entries(skillData)
    .map(([skill, data]) => ({
      skill,
      count: data.count,
      employees: data.employees.size
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}
```

---

## 7. Department Comparison

### Query: Recognition metrics by department
```typescript
async function getDepartmentRecognitionComparison(
  orgId: string
): Promise<Array<{
  department: string;
  totalRecognitions: number;
  avgPerEmployee: number;
  topCategory: string;
}>> {

  // Get all employees with departments
  const employeesSnapshot = await db
    .collection(`organizations/${orgId}/employees`)
    .where('isActive', '==', true)
    .get();

  const employees = employeesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Employee[];

  // Get all recognitions (last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const recognitionsSnapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('achievementDate', '>=', oneYearAgo)
    .get();

  const recognitions = recognitionsSnapshot.docs.map(doc =>
    doc.data() as Recognition
  );

  // Group by department
  const departments = [...new Set(employees.map(e => e.employment.department))];

  return departments.map(dept => {
    const deptEmployees = employees.filter(e => e.employment.department === dept);
    const deptRecognitions = recognitions.filter(r =>
      deptEmployees.some(e => e.id === r.employeeId)
    );

    // Find top category for department
    const categoryCounts = deptRecognitions.reduce((acc, r) => {
      acc[r.categoryId] = (acc[r.categoryId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
      department: dept,
      totalRecognitions: deptRecognitions.length,
      avgPerEmployee: deptRecognitions.length / deptEmployees.length,
      topCategory
    };
  }).sort((a, b) => b.avgPerEmployee - a.avgPerEmployee);
}
```

---

## 8. Reward Distribution Analysis

### Query: Breakdown of rewards given
```typescript
async function getRewardDistribution(
  orgId: string,
  period: { start: Date; end: Date }
): Promise<{
  byType: Array<{ rewardType: RewardType; count: number }>;
  totalMonetaryValue: number;
  avgRewardsPerRecognition: number;
}> {

  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('achievementDate', '>=', period.start)
    .where('achievementDate', '<=', period.end)
    .get();

  const recognitions = snapshot.docs.map(doc => doc.data() as Recognition);

  // Count reward types
  const rewardCounts = recognitions.reduce((acc, r) => {
    r.rewardsGiven.forEach(reward => {
      acc[reward] = (acc[reward] || 0) + 1;
    });
    return acc;
  }, {} as Record<RewardType, number>);

  const byType = Object.entries(rewardCounts)
    .map(([rewardType, count]) => ({
      rewardType: rewardType as RewardType,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate monetary value
  const totalMonetaryValue = recognitions.reduce((sum, r) => {
    return sum +
      (r.rewardDetails?.bonusAmount || 0) +
      (r.rewardDetails?.giftCardAmount || 0);
  }, 0);

  // Calculate average rewards per recognition
  const totalRewardInstances = recognitions.reduce((sum, r) =>
    sum + r.rewardsGiven.length, 0
  );
  const avgRewardsPerRecognition = totalRewardInstances / recognitions.length;

  return {
    byType,
    totalMonetaryValue,
    avgRewardsPerRecognition
  };
}
```

---

## 9. Performance Review Export

### Query: Get recognition summary for performance review period
```typescript
async function getPerformanceReviewRecognitions(
  employeeId: string,
  orgId: string,
  reviewPeriod: { start: Date; end: Date }
): Promise<PerformanceReviewRecognitionSummary> {

  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('employeeId', '==', employeeId)
    .where('achievementDate', '>=', reviewPeriod.start)
    .where('achievementDate', '<=', reviewPeriod.end)
    .orderBy('achievementDate', 'desc')
    .get();

  const recognitions = snapshot.docs.map(doc => doc.data() as Recognition);

  // Get employee details
  const employee = (await db
    .collection(`organizations/${orgId}/employees`)
    .doc(employeeId)
    .get()).data() as Employee;

  // Calculate metrics
  const byCategory = recognitions.reduce((acc, r) => {
    const category = r.categoryId; // Would lookup name in real implementation
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byImpactLevel = recognitions.reduce((acc, r) => {
    // Would lookup from category in real implementation
    const impactLevel = ImpactLevel.INDIVIDUAL; // Placeholder
    acc[impactLevel] = (acc[impactLevel] || 0) + 1;
    return acc;
  }, {} as Record<ImpactLevel, number>);

  const allSkills = recognitions.flatMap(r => r.skillsDemonstrated);
  const skillsDemonstrated = [...new Set(allSkills)];

  const competencyLevels = recognitions
    .filter(r => r.competencyLevel)
    .reduce((acc, r) => {
      acc[r.competencyLevel!] = (acc[r.competencyLevel!] || 0) + 1;
      return acc;
    }, {} as Record<CompetencyLevel, number>);

  const totalMonetaryValue = recognitions.reduce((sum, r) =>
    sum + (r.rewardDetails?.bonusAmount || 0), 0
  );

  const certificatesEarned = recognitions.filter(r =>
    r.rewardsGiven.includes(RewardType.CERTIFICATE)
  ).length;

  const developmentOpportunities = recognitions
    .flatMap(r => r.developmentOpportunities || []);

  const managerComments = recognitions.map(r =>
    `${r.title}: ${r.managerComments}`
  );

  return {
    employeeId,
    employeeName: `${employee.profile.firstName} ${employee.profile.lastName}`,
    period: reviewPeriod,
    totalRecognitions: recognitions.length,
    byCategory: Object.entries(byCategory).map(([category, count]) =>
      ({ category, count })
    ),
    byImpactLevel,
    skillsDemonstrated,
    competencyLevels,
    rewardsSummary: {
      totalRewards: recognitions.reduce((sum, r) => sum + r.rewardsGiven.length, 0),
      monetaryValue: totalMonetaryValue,
      certificatesEarned,
      developmentOpportunities
    },
    managerComments,
    recommendations: generateRecommendations(recognitions)
  };
}

function generateRecommendations(recognitions: Recognition[]): string {
  if (recognitions.length === 0) {
    return 'No recognitions during this period. Consider opportunities for development.';
  }

  const topSkills = recognitions
    .flatMap(r => r.skillsDemonstrated)
    .reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostDemonstratedSkill = Object.entries(topSkills)
    .sort(([, a], [, b]) => b - a)[0][0];

  return `Strong performance with ${recognitions.length} recognitions. ` +
    `Consistently demonstrates ${mostDemonstratedSkill}. ` +
    `Consider for promotion/advancement opportunities.`;
}
```

---

## 10. Recognition Trends Over Time

### Query: Monthly recognition trends
```typescript
async function getRecognitionTrends(
  orgId: string,
  months: number = 12
): Promise<Array<{
  month: string;
  year: number;
  count: number;
  uniqueEmployees: number;
}>> {

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const snapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('achievementDate', '>=', startDate)
    .orderBy('achievementDate', 'asc')
    .get();

  const recognitions = snapshot.docs.map(doc => doc.data() as Recognition);

  // Group by month
  const monthlyData = recognitions.reduce((acc, r) => {
    const date = r.achievementDate instanceof Date
      ? r.achievementDate
      : r.achievementDate.toDate();

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        employees: new Set<string>(),
        year: date.getFullYear(),
        month: date.toLocaleString('default', { month: 'long' })
      };
    }

    acc[key].count++;
    acc[key].employees.add(r.employeeId);

    return acc;
  }, {} as Record<string, {
    count: number;
    employees: Set<string>;
    year: number;
    month: string
  }>);

  return Object.entries(monthlyData)
    .map(([, data]) => ({
      month: data.month,
      year: data.year,
      count: data.count,
      uniqueEmployees: data.employees.size
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });
}
```

---

## 11. Employee Recognition Balance (Warning vs Recognition)

### Query: Compare warnings vs recognitions for employee
```typescript
async function getEmployeeBalance(
  employeeId: string,
  orgId: string,
  period: { start: Date; end: Date }
): Promise<{
  warnings: number;
  recognitions: number;
  ratio: number; // recognitions per warning
  status: 'excellent' | 'good' | 'concerning' | 'critical';
}> {

  // Get warnings
  const warningsSnapshot = await db
    .collection(`organizations/${orgId}/warnings`)
    .where('employeeId', '==', employeeId)
    .where('issueDate', '>=', period.start)
    .where('issueDate', '<=', period.end)
    .get();

  // Get recognitions
  const recognitionsSnapshot = await db
    .collection(`organizations/${orgId}/recognitions`)
    .where('employeeId', '==', employeeId)
    .where('achievementDate', '>=', period.start)
    .where('achievementDate', '<=', period.end)
    .get();

  const warnings = warningsSnapshot.size;
  const recognitions = recognitionsSnapshot.size;
  const ratio = warnings === 0 ? recognitions : recognitions / warnings;

  let status: 'excellent' | 'good' | 'concerning' | 'critical';
  if (warnings === 0 && recognitions > 0) {
    status = 'excellent';
  } else if (ratio >= 2) {
    status = 'good';
  } else if (ratio >= 1) {
    status = 'concerning';
  } else {
    status = 'critical';
  }

  return {
    warnings,
    recognitions,
    ratio,
    status
  };
}
```

---

## 12. Batch Operations

### Create Multiple Recognitions (e.g., Perfect Attendance for Multiple Employees)
```typescript
async function bulkCreateRecognitions(
  orgId: string,
  employeeIds: string[],
  recognitionTemplate: Partial<Recognition>
): Promise<string[]> {

  const batch = db.batch();
  const recognitionIds: string[] = [];

  for (const employeeId of employeeIds) {
    const docRef = db
      .collection(`organizations/${orgId}/recognitions`)
      .doc();

    const recognition: Recognition = {
      id: docRef.id,
      organizationId: orgId,
      employeeId,
      ...recognitionTemplate,
      status: RecognitionStatus.APPROVED,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    } as Recognition;

    batch.set(docRef, recognition);
    recognitionIds.push(docRef.id);
  }

  await batch.commit();
  return recognitionIds;
}

// Usage: Recognize all employees with perfect attendance
const perfectAttendanceEmployees = ['emp1', 'emp2', 'emp3'];
await bulkCreateRecognitions(orgId, perfectAttendanceEmployees, {
  categoryId: 'cat_perfect_attendance',
  type: RecognitionType.PERFECT_ATTENDANCE,
  title: 'Perfect Attendance - Q4 2025',
  description: 'No absences or late arrivals for the entire quarter',
  achievementDate: new Date('2025-12-31'),
  businessImpact: 'Consistent reliability ensures smooth operations',
  skillsDemonstrated: ['Reliability', 'Commitment', 'Dedication'],
  rewardsGiven: [RewardType.PAID_TIME_OFF, RewardType.CERTIFICATE],
  rewardDetails: {
    timeOffHours: 8,
    certificateIssued: true
  },
  managerComments: 'Thank you for your consistent reliability this quarter',
  recognizedBy: 'mgr_123',
  recognizedByName: 'Manager Name',
  employeeAcknowledged: false,
  visibility: RecognitionVisibility.TEAM,
  shareWithTeam: true,
  shareInNewsletter: true
});
```

---

## Summary

These query examples demonstrate:

1. **Employee-centric queries** - Recognition history, skills, rewards
2. **Organizational analytics** - Trends, comparisons, distributions
3. **Approval workflows** - Pending items, queue management
4. **Performance integration** - Review exports, balance metrics
5. **Batch operations** - Bulk recognition creation

**Performance Tips:**
- Add composite indexes for frequently used query combinations
- Cache category/employee lookups for dashboard queries
- Use Cloud Functions for heavy aggregations
- Implement pagination for large result sets
- Consider materialized views for dashboard metrics

**Security Reminders:**
- Always verify user has permission before returning data
- Apply visibility filters in application layer
- Sanitize user inputs in queries
- Use security rules as first line of defense

---

**Last Updated:** 2025-11-12
