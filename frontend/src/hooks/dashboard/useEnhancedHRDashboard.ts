import Logger from '../../utils/logger';
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
    
    Logger.debug('🔄 Manual refresh of enhanced HR dashboard data')
    setError(null);
    setLastUpdated(new Date());
  }, [user?.organizationId, canManageHR]);
  
  // 📊 EXPORT FUNCTIONALITY
  const exportData = useCallback((type: 'warnings' | 'employees' | 'reports') => {
    Logger.debug(`📁 Exporting ${type} data`)
    
    try {
      let csvContent = '';
      let filename = '';
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (type) {
        case 'warnings':
          filename = `warnings-export-${timestamp}.csv`;
          csvContent = generateWarningsCSV();
          break;
        case 'employees':
          filename = `employees-export-${timestamp}.csv`;
          csvContent = generateEmployeesCSV();
          break;
        case 'reports':
          filename = `reports-export-${timestamp}.csv`;
          csvContent = generateReportsCSV();
          break;
        default:
          Logger.warn(`Unknown export type: ${type}`);
          return;
      }
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Logger.success(`✅ Successfully exported ${type} data to ${filename}`);
    } catch (error) {
      Logger.error(`❌ Error exporting ${type} data:`, error);
    }
  }, [warningStats, employeeStats, reportStats, trendData]);
  
  // Helper function to generate warnings CSV
  const generateWarningsCSV = useCallback(() => {
    const headers = [
      'Metric',
      'Value',
      'Description'
    ];
    
    const rows = [
      ['Total Active Warnings', warningStats.totalActive.toString(), 'Total number of active warnings'],
      ['Undelivered Warnings', warningStats.undelivered.toString(), 'Warnings not yet delivered to employees'],
      ['High Severity Warnings', warningStats.highSeverity.toString(), 'Final written warnings and dismissal warnings'],
      ['Recent Warnings (30 days)', warningStats.recentCount.toString(), 'Warnings issued in the last 30 days'],
      ['Department Breakdown', '', 'Warning distribution by department:'],
      ...trendData.departmentWarnings.map(dept => [
        `  ${dept.department}`,
        dept.count.toString(),
        'Warnings count for this department'
      ]),
      ['Severity Distribution', '', 'Warning distribution by severity:'],
      ...trendData.severityDistribution.map(sev => [
        `  ${sev.severity}`,
        sev.count.toString(),
        'Count of warnings at this severity level'
      ])
    ];
    
    return [headers.join(','), ...rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    )].join('\n');
  }, [warningStats, trendData]);
  
  // Helper function to generate employees CSV
  const generateEmployeesCSV = useCallback(() => {
    const headers = [
      'Metric',
      'Value',
      'Description'
    ];
    
    const rows = [
      ['Total Employees', employeeStats.totalEmployees.toString(), 'Total number of employees in organization'],
      ['Active Employees', employeeStats.activeEmployees.toString(), 'Currently active employees'],
      ['New Employees (30 days)', employeeStats.newEmployees.toString(), 'Employees added in the last 30 days'],
      ['Department Breakdown', '', 'Employee distribution by department:'],
      ...Object.entries(employeeStats.departmentBreakdown).map(([dept, count]) => [
        `  ${dept}`,
        count.toString(),
        'Number of employees in this department'
      ])
    ];
    
    return [headers.join(','), ...rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    )].join('\n');
  }, [employeeStats]);
  
  // Helper function to generate reports CSV
  const generateReportsCSV = useCallback(() => {
    const headers = [
      'Report Type',
      'Unread/Pending',
      'Total',
      'Description'
    ];
    
    const rows = [
      [
        'Absence Reports',
        reportStats.absenceReports.unread.toString(),
        reportStats.absenceReports.total.toString(),
        'Employee absence reports requiring HR review'
      ],
      [
        'HR Meeting Requests',
        reportStats.hrMeetings.unread.toString(),
        reportStats.hrMeetings.total.toString(),
        'Pending HR meeting requests from employees'
      ],
      [
        'Corrective Counselling',
        reportStats.correctiveCounselling.unread.toString(),
        reportStats.correctiveCounselling.total.toString(),
        'Recent corrective counselling records for HR review'
      ]
    ];
    
    return [headers.join(','), ...rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    )].join('\n');
  }, [reportStats]);
  
  // 🚀 MAIN EFFECT - SETUP ALL LISTENERS
  useEffect(() => {
    if (hasInitialized.current) return;
    
    isMountedRef.current = true;
    
    if (!canManageHR() || !user?.organizationId) {
      setIsLoading(false);
      hasInitialized.current = true;
      return;
    }
    
    Logger.debug('🚀 Initializing enhanced HR dashboard listeners')
    setIsLoading(true);
    setError(null);
    
    // Clear existing listeners
    unsubscribeRefs.current.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        Logger.warn('⚠️ Error unsubscribing:', error)
      }
    });
    unsubscribeRefs.current = [];
    
    try {
      setupListeners();
    } catch (error) {
      Logger.error('❌ Error setting up enhanced HR listeners:', error)
      setError('Failed to initialize dashboard data');
      setIsLoading(false);
    }
    
    hasInitialized.current = true;
    
    return () => {
      Logger.debug('🧹 Cleaning up enhanced HR dashboard listeners')
      isMountedRef.current = false;
      
      unsubscribeRefs.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          Logger.warn('⚠️ Error during cleanup:', error)
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
    Logger.debug('🔔 Setting up warnings listener')
    const warningsQuery = query(
      collection(db, 'organizations', user.organizationId, 'warnings'),
      orderBy('createdAt', 'desc')
    );
    
    const warningsUnsubscribe = onSnapshot(
      warningsQuery,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const warnings = snapshot.docs
          .filter(doc => doc.id !== '_metadata') // Exclude metadata documents
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
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
        Logger.debug(`🔔 Warnings updated: ${warnings.length} total, ${undelivered} undelivered`)
      },
      (error) => {
        Logger.error('❌ Warnings listener error:', error)
        if (isMountedRef.current) {
          setError('Failed to load warnings data');
        }
      }
    );
    
    unsubscribeRefs.current.push(warningsUnsubscribe);
    
    // 👥 2. EMPLOYEES LISTENER  
    Logger.debug('🔔 Setting up employees listener')
    const employeesQuery = query(
      collection(db, 'organizations', user.organizationId, 'employees')
    );
    
    const employeesUnsubscribe = onSnapshot(
      employeesQuery,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const employees = snapshot.docs
          .filter(doc => doc.id !== '_metadata') // Exclude metadata documents
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
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
        Logger.debug(`🔔 Employees updated: ${employees.length} total, ${activeEmployees} active`)
      },
      (error) => {
        Logger.error('❌ Employees listener error:', error)
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
        collection(db, 'organizations', user.organizationId, 'reports'),
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
        collection(db, 'organizations', user.organizationId, 'meetings'),
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
        collection(db, 'organizations', user.organizationId, 'corrective_counselling'),
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