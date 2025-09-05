// frontend/src/services/RealtimeService.ts
// 🔔 REAL-TIME NOTIFICATION SERVICE
// ✅ Complete notification system with Firebase integration

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  limit,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../auth/AuthContext';

// 📋 Notification Types
export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  data?: Record<string, any>;
  category?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

// 🎯 useNotifications Hook
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 📊 Real-time subscription
  useEffect(() => {
    if (!user?.uid || !user?.organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('userId', '==', user.uid),
        where('organizationId', '==', user.organizationId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const notificationData: Notification[] = [];
          
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            notificationData.push({
              id: doc.id,
              userId: data.userId,
              organizationId: data.organizationId,
              type: data.type || 'info',
              title: data.title || 'Notification',
              message: data.message || '',
              read: data.read || false,
              timestamp: data.timestamp?.toDate() || new Date(),
              data: data.data || {},
              category: data.category,
              actions: data.actions || []
            });
          });

          setNotifications(notificationData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching notifications:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (err: any) {
      console.error('Error setting up notifications subscription:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [user?.uid, user?.organizationId]);

  // 🧹 Cleanup
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // 📊 Computed values
  const unreadCount = notifications.filter(n => !n.read).length;

  // 🔔 Add notification
  const addNotification = useCallback(async (
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>,
    actions?: NotificationAction[]
  ) => {
    if (!user?.uid || !user?.organizationId) return;

    try {
      const notificationData = {
        userId: user.uid,
        organizationId: user.organizationId,
        type,
        title,
        message,
        read: false,
        timestamp: serverTimestamp(),
        data: data || {},
        actions: actions || []
      };

      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (err: any) {
      console.error('Error adding notification:', err);
      setError(err.message);
    }
  }, [user?.uid, user?.organizationId]);

  // ✅ Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  }, []);

  // ✅ Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const promises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });

      await Promise.all(promises);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead
  };
};

// 🎯 HR Reports Real-time Hook (placeholder for existing implementation)
export const useRealtimeHRReports = (organizationId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    // Implementation for HR reports
    setLastUpdated(new Date());
  }, []);

  return { data, loading, error, lastUpdated, refresh };
};

// 🎯 HR Meetings Real-time Hook (placeholder for existing implementation)
export const useRealtimeHRMeetings = (organizationId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    // Implementation for HR meetings
    setLastUpdated(new Date());
  }, []);

  return { data, loading, error, lastUpdated, refresh };
};

// 🎯 BULK NOTIFICATION SYSTEM for System-wide Notifications
export const createBulkNotification = async (
  organizationId: string,
  roles: string[],
  type: Notification['type'],
  title: string,
  message: string,
  data?: Record<string, any>
) => {
  try {
    // Get users with specified roles in organization
    const usersRef = collection(db, 'users');
    const usersQuery = query(
      usersRef,
      where('organizationId', '==', organizationId),
      where('role', 'in', roles)
    );

    const usersSnapshot = await getDocs(usersQuery);
    const notifications = usersSnapshot.docs.map(userDoc => ({
      userId: userDoc.id,
      organizationId,
      type,
      title,
      message,
      read: false,
      timestamp: serverTimestamp(),
      data: data || {}
    }));

    // Batch create notifications
    const notificationsRef = collection(db, 'notifications');
    const promises = notifications.map(notification => 
      addDoc(notificationsRef, notification)
    );

    await Promise.all(promises);
    return notifications.length;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};