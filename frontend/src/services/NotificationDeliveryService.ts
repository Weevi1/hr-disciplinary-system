// frontend/src/services/NotificationDeliveryService.ts
// 🎯 ROLE-BASED NOTIFICATION DELIVERY SERVICE
// ✅ Handles notifications based on user roles and permissions

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createBulkNotification } from './RealtimeService';

// 📋 Role-based notification types
export type UserRole = 'super-user' | 'business-owner' | 'hr-manager' | 'hod-manager' | 'department-manager';

export interface NotificationRule {
  event: string;
  roles: UserRole[];
  priority: 'info' | 'success' | 'warning' | 'error';
  title: string;
  messageTemplate: string;
  category?: string;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

// 🎯 NOTIFICATION DELIVERY RULES
const NOTIFICATION_RULES: NotificationRule[] = [
  // ===================================
  // 📋 HR MANAGER NOTIFICATIONS
  // ===================================
  {
    event: 'warning_needs_delivery',
    roles: ['hr-manager', 'business-owner'],
    priority: 'warning',
    title: 'Warning Delivery Required',
    messageTemplate: 'Warning for {{employeeName}} ({{warningLevel}}) needs delivery via {{deliveryMethod}}',
    category: 'delivery',
    actions: [
      { label: 'View Warning', action: 'view_warning', variant: 'primary' },
      { label: 'Start Delivery', action: 'start_delivery', variant: 'secondary' }
    ]
  },
  {
    event: 'absence_report_submitted',
    roles: ['hr-manager', 'business-owner'],
    priority: 'info',
    title: 'New Absence Report',
    messageTemplate: '{{employeeName}} absence report submitted by {{managerName}} - requires HR review',
    category: 'hr_review',
    actions: [
      { label: 'Review Report', action: 'review_absence', variant: 'primary' }
    ]
  },
  {
    event: 'hr_meeting_requested',
    roles: ['hr-manager', 'business-owner'],
    priority: 'info',
    title: 'HR Meeting Request',
    messageTemplate: '{{managerName}} requested HR meeting for {{employeeName}} - {{reason}}',
    category: 'meetings',
    actions: [
      { label: 'Schedule Meeting', action: 'schedule_meeting', variant: 'primary' },
      { label: 'View Details', action: 'view_request', variant: 'secondary' }
    ]
  },
  {
    event: 'document_needs_approval',
    roles: ['hr-manager', 'business-owner'],
    priority: 'warning',
    title: 'Document Approval Required',
    messageTemplate: 'Warning document for {{employeeName}} needs HR approval before delivery',
    category: 'approval',
    actions: [
      { label: 'Review & Approve', action: 'approve_document', variant: 'primary' }
    ]
  },

  // ===================================
  // 👥 MANAGER NOTIFICATIONS
  // ===================================
  {
    event: 'warning_approaching_expiry',
    roles: ['hod-manager', 'department-manager'],
    priority: 'warning',
    title: 'Warning Expiring Soon',
    messageTemplate: '{{employeeName}} warning expires in {{daysRemaining}} days - consider follow-up action',
    category: 'follow_up'
  },
  {
    event: 'employee_absence_alert',
    roles: ['hod-manager', 'department-manager'],
    priority: 'info',
    title: 'Employee Absence Alert',
    messageTemplate: '{{employeeName}} has been absent for {{consecutiveDays}} consecutive days',
    category: 'absence'
  },
  {
    event: 'warning_delivered_confirmation',
    roles: ['hod-manager', 'department-manager'],
    priority: 'success',
    title: 'Warning Delivered',
    messageTemplate: 'Warning for {{employeeName}} has been successfully delivered via {{deliveryMethod}}',
    category: 'confirmation'
  },

  // ===================================
  // 🏢 BUSINESS OWNER NOTIFICATIONS
  // ===================================
  {
    event: 'high_severity_warning',
    roles: ['business-owner'],
    priority: 'error',
    title: 'High Severity Warning Issued',
    messageTemplate: '{{warningLevel}} warning issued to {{employeeName}} - immediate attention required',
    category: 'escalation',
    actions: [
      { label: 'Review Case', action: 'review_case', variant: 'danger' }
    ]
  },
  {
    event: 'compliance_deadline',
    roles: ['business-owner', 'hr-manager'],
    priority: 'warning',
    title: 'Compliance Deadline Approaching',
    messageTemplate: '{{complianceType}} deadline in {{daysRemaining}} days for {{organizationName}}',
    category: 'compliance'
  },
  {
    event: 'monthly_report_ready',
    roles: ['business-owner'],
    priority: 'info',
    title: 'Monthly HR Report Available',
    messageTemplate: 'HR disciplinary report for {{monthYear}} is now available for review',
    category: 'reports',
    actions: [
      { label: 'View Report', action: 'view_report', variant: 'primary' }
    ]
  },

  // ===================================
  // 🛡️ SUPER USER NOTIFICATIONS
  // ===================================
  {
    event: 'system_error',
    roles: ['super-user'],
    priority: 'error',
    title: 'System Error Detected',
    messageTemplate: '{{errorType}} error in organization {{organizationName}} - {{errorDetails}}',
    category: 'system'
  },
  {
    event: 'organization_deployment',
    roles: ['super-user'],
    priority: 'info',
    title: 'Organization Deployment Status',
    messageTemplate: 'Organization {{organizationName}} deployment {{status}} - {{details}}',
    category: 'deployment'
  },
  {
    event: 'user_account_issue',
    roles: ['super-user'],
    priority: 'warning',
    title: 'User Account Issue',
    messageTemplate: 'Account issue for {{userName}} in {{organizationName}} - {{issueType}}',
    category: 'user_management'
  }
];

// ============================================
// NOTIFICATION DELIVERY SERVICE
// ============================================

export class NotificationDeliveryService {

  /**
   * Send notification to specific roles based on event type
   */
  static async sendRoleBasedNotification(
    organizationId: string,
    event: string,
    data: Record<string, any>
  ): Promise<number> {
    try {
      const rule = NOTIFICATION_RULES.find(r => r.event === event);
      
      if (!rule) {
        console.warn(`📭 No notification rule found for event: ${event}`);
        return 0;
      }

      const message = this.processMessageTemplate(rule.messageTemplate, data);
      
      console.log(`🔔 Sending ${event} notification to roles:`, rule.roles);
      
      const notificationCount = await createBulkNotification(
        organizationId,
        rule.roles,
        rule.priority,
        rule.title,
        message,
        {
          event,
          category: rule.category,
          actions: rule.actions,
          ...data
        }
      );

      console.log(`✅ Sent ${notificationCount} notifications for event: ${event}`);
      return notificationCount;

    } catch (error) {
      console.error(`❌ Failed to send role-based notification for event: ${event}`, error);
      throw error;
    }
  }

  /**
   * Send notification to specific users
   */
  static async sendUserNotification(
    organizationId: string,
    userIds: string[],
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        organizationId,
        type,
        title,
        message,
        read: false,
        timestamp: serverTimestamp(),
        data: data || {}
      }));

      const notificationsRef = collection(db, 'notifications');
      const promises = notifications.map(notification => 
        addDoc(notificationsRef, notification)
      );

      await Promise.all(promises);
      console.log(`✅ Sent notifications to ${userIds.length} specific users`);

    } catch (error) {
      console.error('❌ Failed to send user notifications:', error);
      throw error;
    }
  }

  /**
   * Send system-wide notification to all users in organization
   */
  static async sendSystemNotification(
    organizationId: string,
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Get all users in the organization
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('organizationId', '==', organizationId)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const userIds = usersSnapshot.docs.map(doc => doc.id);

      await this.sendUserNotification(organizationId, userIds, type, title, message, data);
      console.log(`✅ Sent system notification to ${userIds.length} users`);

    } catch (error) {
      console.error('❌ Failed to send system notification:', error);
      throw error;
    }
  }

  /**
   * Get notification rules for a specific role
   */
  static getNotificationRulesForRole(role: UserRole): NotificationRule[] {
    return NOTIFICATION_RULES.filter(rule => rule.roles.includes(role));
  }

  /**
   * Get all available notification events
   */
  static getAvailableEvents(): string[] {
    return NOTIFICATION_RULES.map(rule => rule.event);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Process message template with data placeholders
   */
  private static processMessageTemplate(template: string, data: Record<string, any>): string {
    let message = template;
    
    // Replace {{variable}} placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return message;
  }

  /**
   * Determine notification priority based on context
   */
  private static determinePriority(
    warningLevel?: string, 
    severity?: string
  ): 'info' | 'success' | 'warning' | 'error' {
    if (warningLevel) {
      switch (warningLevel.toLowerCase()) {
        case 'dismissal':
        case 'suspension':
          return 'error';
        case 'final_written':
        case 'final written warning':
          return 'warning';
        default:
          return 'info';
      }
    }
    
    if (severity) {
      switch (severity.toLowerCase()) {
        case 'critical':
        case 'urgent':
          return 'error';
        case 'high':
          return 'warning';
        case 'low':
          return 'info';
        default:
          return 'info';
      }
    }
    
    return 'info';
  }
}

// ============================================
// PREDEFINED NOTIFICATION HELPERS
// ============================================

export class QuickNotifications {
  
  // HR Notifications
  static async warningNeedsDelivery(
    organizationId: string, 
    employeeName: string, 
    warningLevel: string, 
    deliveryMethod: string
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'warning_needs_delivery',
      { employeeName, warningLevel, deliveryMethod }
    );
  }

  static async absenceReportSubmitted(
    organizationId: string, 
    employeeName: string, 
    managerName: string
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'absence_report_submitted',
      { employeeName, managerName }
    );
  }

  static async hrMeetingRequested(
    organizationId: string, 
    managerName: string, 
    employeeName: string, 
    reason: string
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'hr_meeting_requested',
      { managerName, employeeName, reason }
    );
  }

  // Manager Notifications
  static async warningApproachingExpiry(
    organizationId: string, 
    employeeName: string, 
    daysRemaining: number
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'warning_approaching_expiry',
      { employeeName, daysRemaining }
    );
  }

  static async warningDeliveredConfirmation(
    organizationId: string, 
    employeeName: string, 
    deliveryMethod: string
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'warning_delivered_confirmation',
      { employeeName, deliveryMethod }
    );
  }

  // Business Owner Notifications
  static async highSeverityWarning(
    organizationId: string, 
    employeeName: string, 
    warningLevel: string
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'high_severity_warning',
      { employeeName, warningLevel }
    );
  }

  static async monthlyReportReady(organizationId: string, monthYear: string) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'monthly_report_ready',
      { monthYear }
    );
  }

  // System Notifications
  static async systemError(
    organizationId: string, 
    organizationName: string, 
    errorType: string, 
    errorDetails: string
  ) {
    return NotificationDeliveryService.sendRoleBasedNotification(
      organizationId,
      'system_error',
      { organizationName, errorType, errorDetails }
    );
  }
}