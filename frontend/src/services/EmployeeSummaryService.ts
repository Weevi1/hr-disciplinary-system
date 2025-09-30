// src/services/EmployeeSummaryService.ts
// Employee Summary Document Management for Nested Data Architecture
// Maintains pre-calculated statistics for fast dashboard loading

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Logger from '../utils/logger';
import type { Warning } from '../types';
import { EmployeeSummary } from './NestedDataService';

/**
 * Employee Summary Service
 *
 * Manages employee summary documents that contain pre-calculated statistics
 * for fast dashboard loading and organization-wide analytics.
 *
 * Structure:
 * organizations/{orgId}/employees/{employeeId}/summary/stats
 */
export class EmployeeSummaryService {

  /**
   * Get employee summary statistics
   */
  static async getEmployeeSummary(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeSummary | null> {
    try {
      const summaryRef = doc(db, `organizations/${organizationId}/employees/${employeeId}/summary`, 'stats');
      const summarySnap = await getDoc(summaryRef);

      if (!summarySnap.exists()) {
        // Summary doesn't exist, calculate and create it
        Logger.debug(`📊 Summary not found for employee ${employeeId}, calculating...`);
        return await this.calculateAndStoreSummary(organizationId, employeeId);
      }

      const summary = summarySnap.data() as EmployeeSummary;

      // Check if summary is stale (older than 1 hour)
      const lastUpdated = summary.lastUpdated?.toDate?.() || new Date(summary.lastUpdated);
      const isStale = Date.now() - lastUpdated.getTime() > 60 * 60 * 1000; // 1 hour

      if (isStale) {
        Logger.debug(`📊 Summary stale for employee ${employeeId}, recalculating...`);
        return await this.calculateAndStoreSummary(organizationId, employeeId);
      }

      return summary;
    } catch (error) {
      Logger.error(`❌ Failed to get employee summary:`, error);
      return null;
    }
  }

  /**
   * Calculate employee summary from subcollections
   */
  static async calculateAndStoreSummary(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeSummary> {
    try {
      const summary: EmployeeSummary = {
        employeeId,
        warningStats: {
          total: 0,
          active: 0,
          lastIssued: undefined,
          byLevel: {},
          finalWarnings: 0
        },
        meetingStats: {
          total: 0,
          upcoming: 0,
          lastMeeting: undefined,
          pendingRequests: 0
        },
        absenceStats: {
          totalDays: 0,
          lastAbsence: undefined,
          thisMonth: 0,
          unpaidDays: 0
        },
        lastUpdated: new Date()
      };

      // Calculate warning statistics
      await this.calculateWarningStats(organizationId, employeeId, summary);

      // Calculate meeting statistics
      await this.calculateMeetingStats(organizationId, employeeId, summary);

      // Calculate absence statistics
      await this.calculateAbsenceStats(organizationId, employeeId, summary);

      // Store the calculated summary
      const summaryRef = doc(db, `organizations/${organizationId}/employees/${employeeId}/summary`, 'stats');
      await setDoc(summaryRef, summary);

      Logger.success(`📊 Calculated and stored summary for employee ${employeeId}`);
      return summary;
    } catch (error) {
      Logger.error(`❌ Failed to calculate employee summary:`, error);
      throw error;
    }
  }

  /**
   * Calculate warning statistics for employee
   */
  private static async calculateWarningStats(
    organizationId: string,
    employeeId: string,
    summary: EmployeeSummary
  ): Promise<void> {
    try {
      const warningsRef = collection(db, `organizations/${organizationId}/employees/${employeeId}/warnings`);
      const warningsQuery = query(warningsRef, orderBy('issueDate', 'desc'));
      const warningsSnap = await getDocs(warningsQuery);

      let lastIssued: Date | undefined;
      let finalWarningCount = 0;
      let activeCount = 0;
      const levelCounts: Record<string, number> = {};

      warningsSnap.docs.forEach(doc => {
        const warning = doc.data() as Warning;

        // Count by level
        const level = warning.level || 'unknown';
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        // Track final warnings
        if (level === 'final_written' || level === 'final') {
          finalWarningCount++;
        }

        // Track active warnings
        if (warning.isActive !== false && warning.status !== 'expired' && warning.status !== 'archived') {
          activeCount++;
        }

        // Track last issued date
        const issueDate = warning.issueDate?.toDate?.() || new Date(warning.issueDate || 0);
        if (!lastIssued || issueDate > lastIssued) {
          lastIssued = issueDate;
        }
      });

      summary.warningStats = {
        total: warningsSnap.size,
        active: activeCount,
        lastIssued,
        byLevel: levelCounts,
        finalWarnings: finalWarningCount
      };

      Logger.debug(`📊 Warning stats: ${warningsSnap.size} total, ${activeCount} active`);
    } catch (error) {
      Logger.error(`❌ Failed to calculate warning stats:`, error);
    }
  }

  /**
   * Calculate meeting statistics for employee
   */
  private static async calculateMeetingStats(
    organizationId: string,
    employeeId: string,
    summary: EmployeeSummary
  ): Promise<void> {
    try {
      const meetingsRef = collection(db, `organizations/${organizationId}/employees/${employeeId}/meetings`);
      const meetingsQuery = query(meetingsRef, orderBy('requestDate', 'desc'));
      const meetingsSnap = await getDocs(meetingsQuery);

      let lastMeeting: Date | undefined;
      let upcomingCount = 0;
      let pendingCount = 0;
      const now = new Date();

      meetingsSnap.docs.forEach(doc => {
        const meeting = doc.data();

        // Track pending requests
        if (meeting.status === 'pending') {
          pendingCount++;
        }

        // Track upcoming meetings
        const scheduledDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : null;
        if (scheduledDate && scheduledDate > now && meeting.status === 'scheduled') {
          upcomingCount++;
        }

        // Track last meeting date
        const meetingDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : new Date(meeting.requestDate);
        if (!lastMeeting || meetingDate > lastMeeting) {
          lastMeeting = meetingDate;
        }
      });

      summary.meetingStats = {
        total: meetingsSnap.size,
        upcoming: upcomingCount,
        lastMeeting,
        pendingRequests: pendingCount
      };

      Logger.debug(`📊 Meeting stats: ${meetingsSnap.size} total, ${upcomingCount} upcoming`);
    } catch (error) {
      Logger.error(`❌ Failed to calculate meeting stats:`, error);
    }
  }

  /**
   * Calculate absence statistics for employee
   */
  private static async calculateAbsenceStats(
    organizationId: string,
    employeeId: string,
    summary: EmployeeSummary
  ): Promise<void> {
    try {
      const absencesRef = collection(db, `organizations/${organizationId}/employees/${employeeId}/absences`);
      const absencesQuery = query(absencesRef, orderBy('absenceDate', 'desc'));
      const absencesSnap = await getDocs(absencesQuery);

      let lastAbsence: Date | undefined;
      let totalDays = 0;
      let thisMonthDays = 0;
      let unpaidDays = 0;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      absencesSnap.docs.forEach(doc => {
        const absence = doc.data();
        const absenceDate = new Date(absence.absenceDate);

        // Count days based on absence type
        let days = 1; // Default to 1 day
        if (absence.absenceType === 'half-day') {
          days = 0.5;
        } else if (absence.absenceType === 'full-day') {
          days = 1;
        }

        totalDays += days;

        // Count this month's absences
        if (absenceDate.getMonth() === currentMonth && absenceDate.getFullYear() === currentYear) {
          thisMonthDays += days;
        }

        // Count unpaid days (if payroll impact is true)
        if (absence.payrollImpact) {
          unpaidDays += days;
        }

        // Track last absence date
        if (!lastAbsence || absenceDate > lastAbsence) {
          lastAbsence = absenceDate;
        }
      });

      summary.absenceStats = {
        totalDays,
        lastAbsence,
        thisMonth: thisMonthDays,
        unpaidDays
      };

      Logger.debug(`📊 Absence stats: ${totalDays} total days, ${thisMonthDays} this month`);
    } catch (error) {
      Logger.error(`❌ Failed to calculate absence stats:`, error);
    }
  }

  /**
   * Update employee summary when data changes
   * Call this after creating/updating warnings, meetings, or absences
   */
  static async updateSummaryStats(
    organizationId: string,
    employeeId: string,
    type: 'warning' | 'meeting' | 'absence',
    operation: 'create' | 'update' | 'delete',
    data?: any
  ): Promise<void> {
    try {
      const summaryRef = doc(db, `organizations/${organizationId}/employees/${employeeId}/summary`, 'stats');

      // For now, just update the lastUpdated timestamp and trigger recalculation
      // In a production system, this would be more sophisticated with incremental updates
      await updateDoc(summaryRef, {
        lastUpdated: serverTimestamp(),
        [`${type}LastActivity`]: serverTimestamp()
      });

      // Schedule a recalculation (in a real system, this would be done via Cloud Functions)
      setTimeout(async () => {
        try {
          await this.calculateAndStoreSummary(organizationId, employeeId);
        } catch (error) {
          Logger.error(`❌ Failed to recalculate summary:`, error);
        }
      }, 1000);

      Logger.debug(`📊 Updated summary stats for employee ${employeeId} (${type} ${operation})`);
    } catch (error) {
      Logger.error(`❌ Failed to update summary stats:`, error);
    }
  }

  /**
   * Get organization-wide summary statistics
   */
  static async getOrganizationSummary(organizationId: string): Promise<{
    totalEmployees: number;
    activeWarnings: number;
    finalWarnings: number;
    upcomingMeetings: number;
    totalAbsenceDays: number;
  }> {
    try {
      // This would typically be stored in an organization-level summary document
      // For now, we'll calculate it from employee summaries

      const employeesRef = collection(db, `organizations/${organizationId}/employees`);
      const employeesSnap = await getDocs(employeesRef);

      let totalEmployees = 0;
      let activeWarnings = 0;
      let finalWarnings = 0;
      let upcomingMeetings = 0;
      let totalAbsenceDays = 0;

      for (const employeeDoc of employeesSnap.docs) {
        if (employeeDoc.id === '_metadata') continue; // Skip metadata documents

        totalEmployees++;

        const summary = await this.getEmployeeSummary(organizationId, employeeDoc.id);
        if (summary) {
          activeWarnings += summary.warningStats.active;
          finalWarnings += summary.warningStats.finalWarnings;
          upcomingMeetings += summary.meetingStats.upcoming;
          totalAbsenceDays += summary.absenceStats.totalDays;
        }
      }

      return {
        totalEmployees,
        activeWarnings,
        finalWarnings,
        upcomingMeetings,
        totalAbsenceDays
      };
    } catch (error) {
      Logger.error(`❌ Failed to get organization summary:`, error);
      return {
        totalEmployees: 0,
        activeWarnings: 0,
        finalWarnings: 0,
        upcomingMeetings: 0,
        totalAbsenceDays: 0
      };
    }
  }
}