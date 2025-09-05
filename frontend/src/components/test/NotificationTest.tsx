// frontend/src/components/test/NotificationTest.tsx
// 🧪 NOTIFICATION SYSTEM TEST COMPONENT
// ✅ Test all notification features

import React, { useState } from 'react';
import { Bell, Send, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotificationContext } from '../../contexts/NotificationContext';

export const NotificationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const {
    unreadCount,
    quickNotify,
    sendUserNotification,
    sendSystemNotification
  } = useNotificationContext();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test quick notifications
  const testQuickNotifications = async () => {
    setLoading(true);
    addTestResult('Starting quick notification tests...');

    try {
      // Test HR notification
      await quickNotify.warningNeedsDelivery('John Doe', 'Written Warning', 'Email');
      addTestResult('✅ HR notification sent successfully');

      // Test manager notification
      await quickNotify.warningApproachingExpiry('Jane Smith', 7);
      addTestResult('✅ Manager notification sent successfully');

      // Test business owner notification
      await quickNotify.highSeverityWarning('Bob Johnson', 'Final Written Warning');
      addTestResult('✅ Business owner notification sent successfully');

    } catch (error: any) {
      addTestResult(`❌ Quick notification test failed: ${error.message}`);
    }

    setLoading(false);
  };

  // Test user-specific notification
  const testUserNotification = async () => {
    setLoading(true);
    addTestResult('Testing user-specific notification...');

    try {
      // This would normally use actual user IDs
      await sendUserNotification(
        ['test-user-id'],
        'info',
        'Test User Notification',
        'This is a test notification sent to specific users.'
      );
      addTestResult('✅ User notification sent successfully');
    } catch (error: any) {
      addTestResult(`❌ User notification test failed: ${error.message}`);
    }

    setLoading(false);
  };

  // Test system notification
  const testSystemNotification = async () => {
    setLoading(true);
    addTestResult('Testing system-wide notification...');

    try {
      await sendSystemNotification(
        'success',
        'System Test Notification',
        'This is a test system-wide notification sent to all users in the organization.'
      );
      addTestResult('✅ System notification sent successfully');
    } catch (error: any) {
      addTestResult(`❌ System notification test failed: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          Notification System Test
        </h1>
        <p className="text-gray-600 mt-2">
          Test the complete notification workflow and role-based delivery system.
        </p>
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Current Status</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">
              Unread Notifications: <strong>{unreadCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testQuickNotifications}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Users className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Test Role Notifications</div>
            <div className="text-sm opacity-90">HR, Manager, Business Owner</div>
          </div>
        </button>

        <button
          onClick={testUserNotification}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Test User Notification</div>
            <div className="text-sm opacity-90">Specific Users</div>
          </div>
        </button>

        <button
          onClick={testSystemNotification}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <AlertTriangle className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Test System Notification</div>
            <div className="text-sm opacity-90">All Users</div>
          </div>
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Test Results
        </h3>
        
        <div className="max-h-60 overflow-y-auto space-y-2">
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet. Click a test button to begin.</p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm font-mono ${
                  result.includes('✅')
                    ? 'bg-green-100 text-green-800'
                    : result.includes('❌')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
        
        {testResults.length > 0 && (
          <button
            onClick={() => setTestResults([])}
            className="mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900">Running notification tests...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};