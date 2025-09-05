// frontend/src/components/hr/DeliveryNotificationsPanel.tsx
// 📬 HR DELIVERY NOTIFICATIONS PANEL
// ✅ Shows pending warning deliveries that need HR attention
// ✅ Provides delivery instructions and status tracking

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Printer,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Eye,
  Play,
  Download,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';

// ============================================
// MOCK DATA (Replace with real Firestore integration)
// ============================================

interface DeliveryNotification {
  id: string;
  warningId: string;
  employeeName: string;
  warningLevel: string;
  warningCategory: string;
  deliveryMethod: 'email' | 'whatsapp' | 'printed';
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  contactDetails: {
    email?: string;
    phone?: string;
  };
  createdAt: Date;
  createdByName: string;
  deliveryPreference: 'employee_choice' | 'manager_choice';
}

// Mock data - replace with Firestore hook
const mockDeliveryNotifications: DeliveryNotification[] = [
  {
    id: 'dn_001',
    warningId: 'warn_123',
    employeeName: 'John Smith',
    warningLevel: 'Final Written Warning',
    warningCategory: 'Attendance & Punctuality',
    deliveryMethod: 'email',
    priority: 'high',
    status: 'pending',
    contactDetails: { email: 'john.smith@company.com' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdByName: 'Sarah Manager',
    deliveryPreference: 'employee_choice'
  },
  {
    id: 'dn_002',
    warningId: 'warn_124',
    employeeName: 'Jane Doe',
    warningLevel: 'Dismissal',
    warningCategory: 'Dishonesty & Theft',
    deliveryMethod: 'printed',
    priority: 'urgent',
    status: 'in_progress',
    contactDetails: {},
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    createdByName: 'Mike Director',
    deliveryPreference: 'manager_choice'
  },
  {
    id: 'dn_003',
    warningId: 'warn_125',
    employeeName: 'Bob Wilson',
    warningLevel: 'Verbal Warning',
    warningCategory: 'Performance Issues',
    deliveryMethod: 'whatsapp',
    priority: 'normal',
    status: 'pending',
    contactDetails: { phone: '+27123456789' },
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    createdByName: 'Lisa Supervisor',
    deliveryPreference: 'employee_choice'
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

export const DeliveryNotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState(mockDeliveryNotifications);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  // Filter and search logic
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.status === filter;
    const matchesSearch = !searchTerm || 
      notification.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.warningCategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Get icon for delivery method
  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'printed': return <Printer className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  // Get priority styling
  const getPriorityStyles = (priority: string, status: string) => {
    const isCompleted = status === 'delivered';
    
    if (isCompleted) {
      return 'bg-green-50 border-green-200 text-green-700';
    }
    
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200 text-red-700';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">In Progress</span>;
      case 'delivered':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Delivered</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Warning Delivery Tasks</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              {filteredNotifications.length}
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by employee name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No delivery tasks found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 ${getPriorityStyles(notification.priority, notification.status)} border-l-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {getDeliveryIcon(notification.deliveryMethod)}
                      <span className="font-medium text-sm capitalize">
                        {notification.deliveryMethod === 'whatsapp' ? 'WhatsApp' : notification.deliveryMethod}
                      </span>
                    </div>
                    {getStatusBadge(notification.status)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      notification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {notification.priority}
                    </span>
                  </div>

                  {/* Employee and Warning Info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{notification.employeeName}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{notification.warningLevel}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Category: {notification.warningCategory}
                    </p>
                    <p className="text-sm text-gray-500">
                      Issued by {notification.createdByName} • {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Contact Details */}
                  {(notification.contactDetails.email || notification.contactDetails.phone) && (
                    <div className="mb-3 p-2 bg-white bg-opacity-50 rounded text-sm">
                      <p className="text-gray-600">
                        <strong>Contact:</strong>{' '}
                        {notification.contactDetails.email && (
                          <span>{notification.contactDetails.email}</span>
                        )}
                        {notification.contactDetails.phone && (
                          <span>{notification.contactDetails.phone}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Preference Note */}
                  <p className="text-xs text-gray-500 mb-3">
                    {notification.deliveryPreference === 'employee_choice' ? 
                      '👤 Employee\'s preferred delivery method' : 
                      '👔 Selected by manager'
                    }
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    <Eye className="w-3 h-3" />
                    View Warning
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                    <Download className="w-3 h-3" />
                    Download PDF
                  </button>
                  {notification.status === 'pending' && (
                    <button className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      <Play className="w-3 h-3" />
                      Start Process
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryNotificationsPanel;