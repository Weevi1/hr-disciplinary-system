// frontend/src/contexts/NotificationContext.tsx
// 🔔 NOTIFICATION CONTEXT PROVIDER
// ✅ Easy access to notification system throughout the app

import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { NotificationDeliveryService, QuickNotifications } from '../services/NotificationDeliveryService';
import { useNotifications } from '../services/RealtimeService';

// 📋 Context interface
interface NotificationContextType {
  // Real-time notifications
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Sending notifications
  sendUserNotification: (
    userIds: string[],
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, any>
  ) => Promise<void>;
  
  sendSystemNotification: (
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, any>
  ) => Promise<void>;
  
  // Quick notification helpers
  quickNotify: {
    // HR notifications
    warningNeedsDelivery: (employeeName: string, warningLevel: string, deliveryMethod: string) => Promise<number>;
    absenceReportSubmitted: (employeeName: string, managerName: string) => Promise<number>;
    hrMeetingRequested: (managerName: string, employeeName: string, reason: string) => Promise<number>;
    
    // Manager notifications
    warningApproachingExpiry: (employeeName: string, daysRemaining: number) => Promise<number>;
    warningDeliveredConfirmation: (employeeName: string, deliveryMethod: string) => Promise<number>;
    
    // Business owner notifications
    highSeverityWarning: (employeeName: string, warningLevel: string) => Promise<number>;
    monthlyReportReady: (monthYear: string) => Promise<number>;
    
    // System notifications
    systemError: (organizationName: string, errorType: string, errorDetails: string) => Promise<number>;
  };
}

// 🎯 Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 🎯 Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Get organization ID for notifications
  const organizationId = user?.organizationId || '';

  // Send notification to specific users
  const sendUserNotification = useCallback(async (
    userIds: string[],
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    if (!organizationId) return;
    
    await NotificationDeliveryService.sendUserNotification(
      organizationId,
      userIds,
      type,
      title,
      message,
      data
    );
  }, [organizationId]);

  // Send system-wide notification
  const sendSystemNotification = useCallback(async (
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    if (!organizationId) return;
    
    await NotificationDeliveryService.sendSystemNotification(
      organizationId,
      type,
      title,
      message,
      data
    );
  }, [organizationId]);

  // Quick notification helpers
  const quickNotify = {
    // HR notifications
    warningNeedsDelivery: useCallback(async (
      employeeName: string, 
      warningLevel: string, 
      deliveryMethod: string
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.warningNeedsDelivery(organizationId, employeeName, warningLevel, deliveryMethod);
    }, [organizationId]),

    absenceReportSubmitted: useCallback(async (
      employeeName: string, 
      managerName: string
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.absenceReportSubmitted(organizationId, employeeName, managerName);
    }, [organizationId]),

    hrMeetingRequested: useCallback(async (
      managerName: string, 
      employeeName: string, 
      reason: string
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.hrMeetingRequested(organizationId, managerName, employeeName, reason);
    }, [organizationId]),

    // Manager notifications
    warningApproachingExpiry: useCallback(async (
      employeeName: string, 
      daysRemaining: number
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.warningApproachingExpiry(organizationId, employeeName, daysRemaining);
    }, [organizationId]),

    warningDeliveredConfirmation: useCallback(async (
      employeeName: string, 
      deliveryMethod: string
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.warningDeliveredConfirmation(organizationId, employeeName, deliveryMethod);
    }, [organizationId]),

    // Business owner notifications
    highSeverityWarning: useCallback(async (
      employeeName: string, 
      warningLevel: string
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.highSeverityWarning(organizationId, employeeName, warningLevel);
    }, [organizationId]),

    monthlyReportReady: useCallback(async (monthYear: string) => {
      if (!organizationId) return 0;
      return QuickNotifications.monthlyReportReady(organizationId, monthYear);
    }, [organizationId]),

    // System notifications
    systemError: useCallback(async (
      organizationName: string, 
      errorType: string, 
      errorDetails: string
    ) => {
      if (!organizationId) return 0;
      return QuickNotifications.systemError(organizationId, organizationName, errorType, errorDetails);
    }, [organizationId])
  };

  const contextValue: NotificationContextType = {
    // Real-time notifications
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    
    // Sending notifications
    sendUserNotification,
    sendSystemNotification,
    
    // Quick helpers
    quickNotify
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// 🎯 Custom hook
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

// 🎯 Higher-order component for easy integration
export const withNotifications = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => (
    <NotificationProvider>
      <Component {...props} />
    </NotificationProvider>
  );

  WrappedComponent.displayName = `withNotifications(${Component.displayName || Component.name})`;
  return WrappedComponent;
};