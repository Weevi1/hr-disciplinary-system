// frontend/src/hooks/dashboard/useEnhancedHRDashboard.ts
// 🚀 ENHANCED HR DASHBOARD DATA HOOK
// ✅ Integrates warnings, employees, and reports data
// 🖥️ Optimized for desktop HR workflow

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useMultiRolePermissions } from '../useMultiRolePermissions';
import { onSnapshot, query, where, collection, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🎯 ENHANCED TYPES
interface WarningStats {
  undelivered: number;
  highSeverity: number;
  totalActive: number;
  recentCount: number; // Last 30 days
}

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  newEmployees: number; // Last 30 days
  departmentBreakdown: { [department: string]: number };
}

interface ReportStats {
  absenceReports: { unread: number; total: number; };
  hrMeetings: { unread: number; total: number; };
  correctiveCounselling: { unread: number; total: number; };
}

interface TrendData {
  warningsByMonth: { month: string; count: number; }[];
  departmentWarnings: { department: string; count: number; }[];
  severityDistribution: { severity: string; count: number; }[];
}

interface SystemStats {
  totalUsers: number;
  tempFilesCount: number;
  recentNotifications: number;
}

export interface EnhancedHRDashboardData {
  // Data
  warningStats: WarningStats;
  employeeStats: EmployeeStats;
  reportStats: ReportStats;
  trendData: TrendData;
  systemStats: SystemStats;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refreshAllData: () => Promise<void>;
  exportData: (type: 'warnings' | 'employees' | 'reports') => void;
}

export const useEnhancedHRDashboard = (): EnhancedHRDashboardData => {
  const { user } = useAuth();
  const { canManageHR } = useMultiRolePermissions();
  
  // 🎯 STATE MANAGEMENT
  const [warningStats, setWarningStats] = useState<WarningStats>({
    undelivered: 0,
    highSeverity: 0,
    totalActive: 0,
    recentCount: 0
  });
  
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    newEmployees: 0,
    departmentBreakdown: {}
  });
  
  const [reportStats, setReportStats] = useState<ReportStats>({
    absenceReports: { unread: 0, total: 0 },
    hrMeetings: { unread: 0, total: 0 },
    correctiveCounselling: { unread: 0, total: 0 }
  });
  
  const [trendData, setTrendData] = useState<TrendData>({
    warningsByMonth: [],
    departmentWarnings: [],
    severityDistribution: []
  });
  
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    tempFilesCount: 0,
    recentNotifications: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // 🎯 REFS FOR CLEANUP
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const isMountedRef = useRef(true);
  const hasInitialized = useRef(false);
  
  // 🔄 MANUAL REFRESH FUNCTION
  const refreshAllData = useCallback(async () => {
    if (!user?.organizationId || !canManageHR()) return;
    
    console.log('🔄 Manual refresh of enhanced HR dashboard data');
    setError(null);
    setLastUpdated(new Date());
  }, [user?.organizationId, canManageHR]);
  
  // 📊 EXPORT FUNCTIONALITY
  const exportData = useCallback((type: 'warnings' | 'employees' | 'reports') => {
    console.log(`📁 Exporting ${type} data`);
    // TODO: Implement export functionality
  }, []);
  
  // 🚀 MAIN EFFECT - SETUP ALL LISTENERS
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMountedRef.current = true;
    
    if (!canManageHR() || !user?.organizationId) {
      setIsLoading(false);
      hasInitialized.current = true;
      return;
    }
    
    console.log('🚀 Initializing enhanced HR dashboard listeners');
    setIsLoading(true);
    setError(null);
    
    // Clear existing listeners
    unsubscribeRefs.current.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        console.warn('⚠️ Error unsubscribing:', error);
      }
    });
    unsubscribeRefs.current = [];
    
    try {
      setupListeners();
    } catch (error) {
      console.error('❌ Error setting up enhanced HR listeners:', error);
      setError('Failed to initialize dashboard data');
      setIsLoading(false);
    }
    
    hasInitialized.current = true;
    
    return () => {
      console.log('🧹 Cleaning up enhanced HR dashboard listeners');
      isMountedRef.current = false;
      
      unsubscribeRefs.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn('⚠️ Error during cleanup:', error);
        }
      });
      unsubscribeRefs.current = [];
      hasInitialized.current = false;
    };
  }, []);
  
  // 🔥 SETUP ALL DATA LISTENERS
  const setupListeners = () => {
    if (!user?.organizationId) return;
    
    // 📋 1. WARNINGS LISTENER
    console.log('🔔 Setting up warnings listener');
    const warningsQuery = query(
      collection(db, 'warnings'),
      where('organizationId', '==', user.organizationId),
      orderBy('createdAt', 'desc')
    );
    
    const warningsUnsubscribe = onSnapshot(
      warningsQuery,
      (snapshot) => {
        if (!isMountedRef.current) return;
        
        const warnings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calculate warning stats
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const undelivered = warnings.filter(w => !w.deliveredAt).length;
        const highSeverity = warnings.filter(w => 
          w.severity === 'final-written' || w.severity === 'dismissal'
        ).length;
        const recentCount = warnings.filter(w => 
          new Date(w.createdAt.toDate ? w.createdAt.toDate() : w.createdAt) > thirtyDaysAgo
        ).length;
        
        // Department breakdown
        const departmentWarnings: { [key: string]: number } = {};
        warnings.forEach(w => {
          if (w.department) {
            departmentWarnings[w.department] = (departmentWarnings[w.department] || 0) + 1;
          }
        });
        
        // Severity distribution
        const severityCount: { [key: string]: number } = {};
        warnings.forEach(w => {
          if (w.severity) {
            severityCount[w.severity] = (severityCount[w.severity] || 0) + 1;
          }
        });
        
        setWarningStats({
          undelivered,
          highSeverity,
          totalActive: warnings.length,
          recentCount
        });
        
        setTrendData(prev => ({
          ...prev,
          departmentWarnings: Object.entries(departmentWarnings).map(([department, count]) => ({
            department,
            count
          })),
          severityDistribution: Object.entries(severityCount).map(([severity, count]) => ({
            severity,
            count
          }))
        }));
        
        setLastUpdated(new Date());
        console.log(`🔔 Warnings updated: ${warnings.length} total, ${undelivered} undelivered`);
      },
      (error) => {
        console.error('❌ Warnings listener error:', error);
        if (isMountedRef.current) {
          setError('Failed to load warnings data');
        }
      }
    );
    
    unsubscribeRefs.current.push(warningsUnsubscribe);
    
    // 👥 2. EMPLOYEES LISTENER  
    console.log('🔔 Setting up employees listener');
    const employeesQuery = query(
      collection(db, 'employees'),
      where('organizationId', '==', user.organizationId)
    );
    
    const employeesUnsubscribe = onSnapshot(
      employeesQuery,
      (snapshot) => {
        if (!isMountedRef.current) return;
        
        const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const activeEmployees = employees.filter(e => e.status === 'active').length;
        const newEmployees = employees.filter(e => {
          const createdAt = new Date(e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt);
          return createdAt > thirtyDaysAgo;
        }).length;
        
        // Department breakdown
        const departmentBreakdown: { [key: string]: number } = {};
        employees.forEach(e => {
          if (e.department) {
            departmentBreakdown[e.department] = (departmentBreakdown[e.department] || 0) + 1;
          }
        });
        
        setEmployeeStats({
          totalEmployees: employees.length,
          activeEmployees,
          newEmployees,
          departmentBreakdown
        });
        
        setLastUpdated(new Date());
        console.log(`🔔 Employees updated: ${employees.length} total, ${activeEmployees} active`);
      },
      (error) => {
        console.error('❌ Employees listener error:', error);
        if (isMountedRef.current) {
          setError('Failed to load employees data');
        }
      }
    );
    
    unsubscribeRefs.current.push(employeesUnsubscribe);
    
    // 📋 3. ABSENCE REPORTS LISTENER
    const setupReportsListeners = () => {
      // Absence Reports
      const absenceQuery = query(
        collection(db, 'absence_reports'),
        where('organizationId', '==', user.organizationId),
        orderBy('absenceDate', 'desc')
      );
      
      const absenceUnsubscribe = onSnapshot(absenceQuery, (snapshot) => {
        if (!isMountedRef.current) return;
        
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const unreadCount = reports.filter(report => !report.hrReviewed).length;
        
        setReportStats(prev => ({
          ...prev,
          absenceReports: { unread: unreadCount, total: reports.length }
        }));
      });
      
      // HR Meetings  
      const meetingsQuery = query(
        collection(db, 'hr_meeting_requests'),
        where('organizationId', '==', user.organizationId),
        orderBy('createdAt', 'desc')
      );
      
      const meetingsUnsubscribe = onSnapshot(meetingsQuery, (snapshot) => {
        if (!isMountedRef.current) return;
        
        const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pendingCount = meetings.filter(meeting => meeting.status === 'pending').length;
        
        setReportStats(prev => ({
          ...prev,
          hrMeetings: { unread: pendingCount, total: meetings.length }
        }));
      });
      
      // Corrective Counselling
      const counsellingQuery = query(
        collection(db, 'corrective_counselling'),
        where('organizationId', '==', user.organizationId),
        orderBy('dateCreated', 'desc')
      );
      
      const counsellingUnsubscribe = onSnapshot(counsellingQuery, (snapshot) => {
        if (!isMountedRef.current) return;
        
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = records.filter(record => {
          const recordDate = new Date(record.dateCreated);
          return recordDate > weekAgo && !record.hrReviewed;
        }).length;
        
        setReportStats(prev => ({
          ...prev,
          correctiveCounselling: { unread: recentCount, total: records.length }
        }));
      });
      
      unsubscribeRefs.current.push(absenceUnsubscribe, meetingsUnsubscribe, counsellingUnsubscribe);
    };
    
    setupReportsListeners();
    
    // Set loading to false after listeners are setup
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }, 1500);
  };
  
  // 🎯 ROLE CHANGE HANDLER
  useEffect(() => {
    if (!canManageHR() || !user?.organizationId) {
      // Reset state when permissions change
      setWarningStats({ undelivered: 0, highSeverity: 0, totalActive: 0, recentCount: 0 });
      setEmployeeStats({ totalEmployees: 0, activeEmployees: 0, newEmployees: 0, departmentBreakdown: {} });
      setReportStats({
        absenceReports: { unread: 0, total: 0 },
        hrMeetings: { unread: 0, total: 0 },
        correctiveCounselling: { unread: 0, total: 0 }
      });
      setIsLoading(false);
      setError(null);
      setLastUpdated(null);
      
      hasInitialized.current = false;
    }
  }, [canManageHR(), user?.organizationId]);
  
  return {
    warningStats,
    employeeStats,
    reportStats,
    trendData,
    systemStats,
    isLoading,
    error,
    lastUpdated,
    refreshAllData,
    exportData
  };
};