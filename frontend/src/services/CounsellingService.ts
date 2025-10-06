import Logger from '../utils/logger';
// frontend/src/services/CounsellingService.ts
// 📋 COUNSELLING MANAGEMENT SERVICE
// Handles counselling lifecycle, follow-ups, and notifications

import { FirebaseService } from './FirebaseService';
import { TimeService } from './TimeService';
import { query, collection, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  CorrectiveCounselling,
  CounsellingFollowUp,
  CounsellingSummary
} from '../types/counselling';

// 🏢 COLLECTIONS
const COLLECTIONS = {
  CORRECTIVE_COUNSELLING: 'corrective_counselling',
  COUNSELLING_FOLLOWUPS: 'counselling_followups',
  NOTIFICATIONS: 'notifications'
};

export class CounsellingService {
  
  // 🔍 Get active counselling sessions for an employee
  static async getActiveCounsellingForEmployee(
    employeeId: string, 
    organizationId: string
  ): Promise<CorrectiveCounselling[]> {
    try {
      Logger.debug('🔍 Checking active counselling for employee:', employeeId)
      
      const counsellingQuery = query(
        collection(db, COLLECTIONS.CORRECTIVE_COUNSELLING),
        where('organizationId', '==', organizationId),
        where('employeeId', '==', employeeId),
        where('status', 'in', ['completed', 'follow_up_pending']),
        orderBy('dateCreated', 'desc')
      );
      
      const snapshot = await getDocs(counsellingQuery);
      const activeSessions: CorrectiveCounselling[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<CorrectiveCounselling, 'id'>;
        const session = { id: doc.id, ...data };
        
        // Check if follow-up is still due
        if (session.followUpDate) {
          const followUpDate = new Date(session.followUpDate);
          const now = new Date();
          const daysDiff = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Consider active if follow-up is within 30 days (past or future)
          if (daysDiff >= -30 && daysDiff <= 30 && !session.followUpCompleted) {
            activeSessions.push(session);
          }
        }
      });
      
      Logger.success(2097)
      return activeSessions;
    } catch (error) {
      Logger.error('❌ Error getting active counselling:', error)
      return [];
    }
  }
  
  // 📅 Get due follow-ups for a manager
  static async getDueFollowUps(
    managerId: string, 
    organizationId: string
  ): Promise<CorrectiveCounselling[]> {
    try {
      Logger.debug('📅 Getting due follow-ups for manager:', managerId)
      
      const counsellingQuery = query(
        collection(db, COLLECTIONS.CORRECTIVE_COUNSELLING),
        where('organizationId', '==', organizationId),
        where('managerId', '==', managerId),
        where('followUpCompleted', '==', false),
        orderBy('followUpDate', 'asc')
      );
      
      const snapshot = await getDocs(counsellingQuery);
      const dueFollowUps: CorrectiveCounselling[] = [];
      const now = new Date();
      
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<CorrectiveCounselling, 'id'>;
        const session = { id: doc.id, ...data };
        
        if (session.followUpDate) {
          const followUpDate = new Date(session.followUpDate);
          const daysDiff = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Include if due within 7 days or overdue
          if (daysDiff <= 7) {
            dueFollowUps.push(session);
          }
        }
      });
      
      Logger.success(3568)
      return dueFollowUps;
    } catch (error) {
      Logger.error('❌ Error getting due follow-ups:', error)
      return [];
    }
  }
  
  // ✅ Create follow-up record
  static async createFollowUp(
    counsellingId: string,
    followUpData: Omit<CounsellingFollowUp, 'id' | 'counsellingId' | 'createdDate'>
  ): Promise<string> {
    try {
      Logger.success(3983)
      
      const followUp: Omit<CounsellingFollowUp, 'id'> = {
        ...followUpData,
        counsellingId,
        createdDate: TimeService.getServerTimestamp()
      };

      const followUpId = await FirebaseService.createDocument(
        COLLECTIONS.COUNSELLING_FOLLOWUPS,
        followUp
      );

      // Update original counselling record
      await FirebaseService.updateDocument(
        COLLECTIONS.CORRECTIVE_COUNSELLING,
        counsellingId,
        {
          followUpCompleted: true,
          improvementNoted: followUpData.improvementObserved,
          lastUpdated: TimeService.getServerTimestamp()
        }
      );
      
      Logger.success(4709)
      return followUpId;
    } catch (error) {
      Logger.error('❌ Error creating follow-up:', error)
      throw error;
    }
  }
  
  // 📊 Get counselling summary for employee
  static async getEmployeeCounsellingSummary(
    employeeId: string,
    organizationId: string
  ): Promise<CounsellingSummary | null> {
    try {
      Logger.debug(5096)
      
      const counsellingQuery = query(
        collection(db, COLLECTIONS.CORRECTIVE_COUNSELLING),
        where('organizationId', '==', organizationId),
        where('employeeId', '==', employeeId),
        orderBy('dateCreated', 'desc')
      );
      
      const snapshot = await getDocs(counsellingQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const sessions: CorrectiveCounselling[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<CorrectiveCounselling, 'id'>;
        sessions.push({ id: doc.id, ...data });
      });
      
      const latestSession = sessions[0];
      const pendingFollowUps = sessions.filter(s => !s.followUpCompleted && s.followUpDate).length;
      const categories = [...new Set(sessions.map(s => s.category))];
      
      // Simple improvement trend based on recent sessions
      let improvementTrend: 'improving' | 'stable' | 'declining' | 'no_data' = 'no_data';
      if (sessions.length >= 2) {
        const recentSessions = sessions.slice(0, 3);
        const improvementCount = recentSessions.filter(s => s.improvementNoted).length;
        if (improvementCount >= 2) improvementTrend = 'improving';
        else if (improvementCount === 1) improvementTrend = 'stable';
        else improvementTrend = 'declining';
      }
      
      // Risk assessment based on frequency and categories
      let escalationRisk: 'low' | 'medium' | 'high' = 'low';
      if (sessions.length >= 5) escalationRisk = 'high';
      else if (sessions.length >= 3) escalationRisk = 'medium';
      
      const summary: CounsellingSummary = {
        employeeId,
        employeeName: latestSession.employeeName,
        totalSessions: sessions.length,
        lastSessionDate: latestSession.dateCreated,
        pendingFollowUps,
        improvementTrend,
        commonCategories: categories,
        escalationRisk
      };
      
      Logger.success(7051)
      return summary;
    } catch (error) {
      Logger.error('❌ Error getting counselling summary:', error)
      return null;
    }
  }
  
  // 🔔 Create follow-up notification
  static async createFollowUpNotification(
    managerId: string,
    organizationId: string,
    counsellingSession: CorrectiveCounselling
  ): Promise<void> {
    try {
      const notification = {
        userId: managerId,
        organizationId,
        type: 'counselling_followup_due',
        title: 'Counselling Follow-up Due',
        message: `Follow-up required for ${counsellingSession.employeeName} regarding ${counsellingSession.category}`,
        data: {
          counsellingId: counsellingSession.id,
          employeeId: counsellingSession.employeeId,
          employeeName: counsellingSession.employeeName,
          followUpDate: counsellingSession.followUpDate
        },
        read: false,
        createdAt: TimeService.getServerTimestamp()
      };

      await FirebaseService.createDocument(COLLECTIONS.NOTIFICATIONS, notification);
      Logger.debug('🔔 Follow-up notification created for manager:', managerId)
    } catch (error) {
      Logger.error('❌ Error creating follow-up notification:', error)
    }
  }
  
  // 🔄 Get follow-up records for counselling session
  static async getFollowUpRecords(counsellingId: string): Promise<CounsellingFollowUp[]> {
    try {
      const followUpQuery = query(
        collection(db, COLLECTIONS.COUNSELLING_FOLLOWUPS),
        where('counsellingId', '==', counsellingId),
        orderBy('createdDate', 'desc')
      );
      
      const snapshot = await getDocs(followUpQuery);
      const followUps: CounsellingFollowUp[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<CounsellingFollowUp, 'id'>;
        followUps.push({ id: doc.id, ...data });
      });
      
      return followUps;
    } catch (error) {
      Logger.error('❌ Error getting follow-up records:', error)
      return [];
    }
  }
}