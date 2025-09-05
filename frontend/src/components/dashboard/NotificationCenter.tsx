// frontend/src/components/dashboard/NotificationCenter.tsx
// 🔔 NOTIFICATION CENTER COMPONENT
// ✅ Real-time notifications with smart grouping and actions

import React, { memo, useState } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNotifications } from '../../services/RealtimeService';

// Simple relative time formatter
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface NotificationCenterProps {
  className?: string;
  maxVisible?: number;
}

export const NotificationCenter = memo<NotificationCenterProps>(({ 
  className = '', 
  maxVisible = 5 
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: string, read: boolean) => {
    const baseStyles = 'border-l-4 p-4 rounded-r-lg transition-all duration-200';
    const readStyles = read ? 'bg-gray-50 opacity-75' : 'bg-white shadow-sm';
    
    switch (type) {
      case 'success': return `${baseStyles} ${readStyles} border-l-green-500`;
      case 'warning': return `${baseStyles} ${readStyles} border-l-yellow-500`;
      case 'error': return `${baseStyles} ${readStyles} border-l-red-500`;
      default: return `${baseStyles} ${readStyles} border-l-blue-500`;
    }
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={`relative ${className}`}>
      {/* 🔔 NOTIFICATION BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 📋 NOTIFICATION PANEL */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
            {/* 📊 HEADER */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 📋 NOTIFICATIONS LIST */}
            <div className="max-h-80 overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {visibleNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={getNotificationStyles(notification.type, notification.read)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-gray-400 text-xs mt-2">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📊 FOOTER */}
            {notifications.length > maxVisible && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <span className="text-sm text-gray-600">
                  Showing {maxVisible} of {notifications.length} notifications
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

NotificationCenter.displayName = 'NotificationCenter';