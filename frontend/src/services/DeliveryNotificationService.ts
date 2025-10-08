import Logger from '../utils/logger';
// frontend/src/services/DeliveryNotificationService.ts
// 📬 DELIVERY NOTIFICATION SERVICE 
// ✅ Creates notifications for HR when warnings need to be delivered
// ✅ Integrates with existing notification system

import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// INTERFACES
// ============================================

export interface DeliveryNotification {
  id: string;
  organizationId: string;
  warningId: string;

  // Employee details
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;

  // Warning details
  warningLevel: string;
  warningCategory: string;
  incidentDate: string;

  // Delivery details
  employeeRequestedDeliveryMethod: 'email' | 'whatsapp' | 'printed'; // Employee's preference from wizard
  deliveryMethod?: 'email' | 'whatsapp' | 'printed'; // Actual method HR chooses (set when HR selects)
  contactDetails: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Status tracking
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  assignedTo?: string; // HR user ID
  priority: 'normal' | 'high' | 'urgent';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByName: string;

  // Delivery tracking
  deliveryAttempts: number;
  deliveryDate?: Date;
  deliveredBy?: string;
  deliveryNotes?: string;
  deliveryEvidence?: string; // For proof of delivery
}

export interface CreateDeliveryNotificationRequest {
  warningId: string;
  organizationId: string;

  // Employee info
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;

  // Warning info
  warningLevel: string;
  warningCategory: string;
  incidentDate: string;

  // Delivery info - employee's requested delivery method
  employeeRequestedDeliveryMethod: 'email' | 'whatsapp' | 'printed';

  // Creator info
  createdBy: string;
  createdByName: string;
}

// ============================================
// DELIVERY NOTIFICATION SERVICE
// ============================================

export class DeliveryNotificationService {
  
  /**
   * Create a new delivery notification for HR
   */
  static async createDeliveryNotification(
    request: CreateDeliveryNotificationRequest
  ): Promise<string> {
    try {
      Logger.debug('📬 Creating delivery notification for HR...', request)
      
      // Determine priority based on warning level
      const priority = this.determinePriority(request.warningLevel);
      
      // Prepare contact details based on delivery method
      const contactDetails = this.prepareContactDetails(request);
      
      // Create notification document
      const notificationData = {
        organizationId: request.organizationId,
        warningId: request.warningId,

        // Employee details
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        employeeEmail: request.employeeEmail,
        employeePhone: request.employeePhone,

        // Warning details
        warningLevel: request.warningLevel,
        warningCategory: request.warningCategory,
        incidentDate: request.incidentDate,

        // Delivery details
        employeeRequestedDeliveryMethod: request.employeeRequestedDeliveryMethod,
        // deliveryMethod will be set when HR selects actual method
        contactDetails,

        // Status
        status: 'pending',
        priority,
        deliveryAttempts: 0,

        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: request.createdBy,
        createdByName: request.createdByName
      };
      
      // Save to Firestore (SHARDED COLLECTION)
      const docRef = await addDoc(
        collection(db, 'organizations', request.organizationId, 'deliveryNotifications'),
        notificationData
      );
      
      Logger.success(3842)
      
      // Create system notification for HR users
      await this.createSystemNotification(request, docRef.id);
      
      return docRef.id;
      
    } catch (error) {
      Logger.error('❌ Failed to create delivery notification:', error)
      throw error;
    }
  }
  
  /**
   * Update delivery notification status
   */
  static async updateDeliveryStatus(
    notificationId: string,
    status: DeliveryNotification['status'],
    notes?: string,
    deliveredBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === 'delivered') {
        updateData.deliveryDate = serverTimestamp();
        updateData.deliveredBy = deliveredBy;
      }

      if (notes) {
        updateData.deliveryNotes = notes;
      }

      // Update in Firestore (you'll need to implement this)
      Logger.debug('📝 Updating delivery status:', notificationId, status)

    } catch (error) {
      Logger.error('❌ Failed to update delivery status:', error)
      throw error;
    }
  }

  /**
   * Update delivery notification with HR's selected delivery method
   */
  static async updateDeliveryMethod(
    organizationId: string,
    notificationId: string,
    deliveryMethod: 'email' | 'whatsapp' | 'printed'
  ): Promise<void> {
    try {
      Logger.debug('📝 Updating delivery method:', { notificationId, deliveryMethod })

      const notificationRef = doc(
        db,
        'organizations',
        organizationId,
        'deliveryNotifications',
        notificationId
      );

      await updateDoc(notificationRef, {
        deliveryMethod: deliveryMethod,
        status: 'in_progress',
        updatedAt: serverTimestamp()
      });

      Logger.success('✅ Delivery method updated successfully');
    } catch (error) {
      Logger.error('❌ Failed to update delivery method:', error);
      throw error;
    }
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  /**
   * Determine priority based on warning level
   */
  private static determinePriority(warningLevel: string): 'normal' | 'high' | 'urgent' {
    switch (warningLevel.toLowerCase()) {
      case 'dismissal':
      case 'suspension':
        return 'urgent';
      case 'final_written':
      case 'final written warning':
        return 'high';
      default:
        return 'normal';
    }
  }
  
  /**
   * Prepare contact details - include all available contact methods
   * since HR will choose the actual delivery method later
   */
  private static prepareContactDetails(request: CreateDeliveryNotificationRequest) {
    const details: { email?: string; phone?: string; address?: string } = {};

    // Include all available contact methods
    if (request.employeeEmail) {
      details.email = request.employeeEmail;
    }
    if (request.employeePhone) {
      details.phone = request.employeePhone;
    }
    // Address will be confirmed by HR if needed for printed delivery
    details.address = 'To be confirmed by HR';

    return details;
  }
  
  /**
   * Create system notification for HR users using role-based delivery
   */
  private static async createSystemNotification(
    request: CreateDeliveryNotificationRequest,
    notificationId: string
  ): Promise<void> {
    try {
      // Import the new role-based notification service
      const { QuickNotifications } = await import('./NotificationDeliveryService');
      
      // Send role-based notification to HR managers and business owners
      await QuickNotifications.warningNeedsDelivery(
        request.organizationId,
        request.employeeName,
        request.warningLevel,
        this.getDeliveryMethodName(request.deliveryMethod)
      );
      
      Logger.debug('🔔 Role-based notification sent to HR team')
      
    } catch (error) {
      Logger.error('❌ Failed to create system notification:', error)
      // Don't throw - delivery notification creation is more important
    }
  }
  
  /**
   * Generate user-friendly notification message
   */
  private static generateNotificationMessage(request: CreateDeliveryNotificationRequest): string {
    const methodName = this.getDeliveryMethodName(request.deliveryMethod);
    const preferenceNote = request.isEmployeePreference ? 
      " (employee's preferred method)" : 
      " (selected by manager)";
    
    return `Warning issued to ${request.employeeName} requires delivery via ${methodName}${preferenceNote}. Warning level: ${request.warningLevel}.`;
  }
  
  /**
   * Get user-friendly delivery method name
   */
  private static getDeliveryMethodName(method: string): string {
    switch (method) {
      case 'email':
        return 'Email';
      case 'whatsapp':
        return 'WhatsApp';
      case 'printed':
        return 'Print & Hand Delivery';
      default:
        return method;
    }
  }
}

// ============================================
// DELIVERY INSTRUCTIONS FOR HR
// ============================================

export class DeliveryInstructionsService {
  
  /**
   * Get detailed delivery instructions for HR based on method
   */
  static getDeliveryInstructions(method: 'email' | 'whatsapp' | 'printed'): {
    title: string;
    steps: string[];
    requirements: string[];
    documentation: string[];
  } {
    switch (method) {
      case 'email':
        return {
          title: 'Email Delivery Instructions',
          steps: [
            'Download the warning PDF from the system',
            'Compose professional email with warning attached',
            'Send to employee\'s work email address',
            'Request read receipt if supported',
            'Follow up if no acknowledgment within 2 business days'
          ],
          requirements: [
            'Valid email address on file',
            'PDF warning document',
            'Professional email template'
          ],
          documentation: [
            'Screenshot of sent email',
            'Read receipt (if available)',
            'Employee acknowledgment response'
          ]
        };
        
      case 'whatsapp':
        return {
          title: 'WhatsApp Business Delivery Instructions',
          steps: [
            'Verify employee\'s WhatsApp Business number',
            'Send professional message introducing the warning',
            'Share warning PDF as document attachment',
            'Request confirmation of receipt',
            'Document the conversation for records'
          ],
          requirements: [
            'WhatsApp Business account',
            'Employee\'s valid phone number',
            'Professional communication standards'
          ],
          documentation: [
            'Screenshot of conversation',
            'Delivery receipt confirmation',
            'Employee read/response confirmation'
          ]
        };
        
      case 'printed':
        return {
          title: 'Print & Hand Delivery Instructions',
          steps: [
            'Print warning document on company letterhead',
            'Prepare delivery receipt form',
            'Locate employee at their workstation/department',
            'Hand deliver in presence of witness (if possible)',
            'Obtain signed receipt of delivery',
            'Scan and upload proof of delivery'
          ],
          requirements: [
            'Printed warning document',
            'Delivery receipt form',
            'Employee location/schedule',
            'Witness (recommended)'
          ],
          documentation: [
            'Signed delivery receipt',
            'Photo of handed document (if permitted)',
            'Witness statement (if applicable)',
            'Date, time, and location of delivery'
          ]
        };
        
      default:
        return {
          title: 'General Delivery Instructions',
          steps: ['Contact IT support for delivery method guidance'],
          requirements: ['Valid employee contact information'],
          documentation: ['Proof of delivery attempt']
        };
    }
  }
}