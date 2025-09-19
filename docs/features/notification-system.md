# 🔔 Notification System

## Architecture Overview
The notification system provides real-time, role-based notifications throughout the HR disciplinary workflow:

**Core Components:**
- `services/RealtimeService.ts` - Real-time Firestore integration with `useNotifications` hook
- `services/NotificationDeliveryService.ts` - Role-based notification rules and delivery
- `contexts/NotificationContext.tsx` - Application-wide notification context
- `components/dashboard/NotificationCenter.tsx` - UI component with bell icon and dropdown

## Role-Based Delivery Matrix

| Event Type | Super User | Business Owner | HR Manager | HOD/Manager |
|------------|------------|----------------|------------|-------------|
| Warning needs delivery | - | ✅ | ✅ | - |
| High severity warning | - | ✅ | - | - |
| Absence report submitted | - | ✅ | ✅ | - |
| HR meeting requested | - | ✅ | ✅ | - |
| Warning approaching expiry | - | - | - | ✅ |
| Warning delivered confirmation | - | - | - | ✅ |
| System errors | ✅ | - | - | - |
| Monthly reports ready | - | ✅ | - | - |

## Implementation Usage

```typescript
// Using the notification context
import { useNotificationContext } from '../contexts/NotificationContext';

const { quickNotify, unreadCount } = useNotificationContext();

// Send role-based notifications
await quickNotify.warningNeedsDelivery('John Doe', 'Written Warning', 'Email');
await quickNotify.absenceReportSubmitted('Jane Smith', 'Manager Name');
await quickNotify.highSeverityWarning('Bob Johnson', 'Final Written Warning');
```

## Security Rules
- Users can read/update their own notifications
- HR managers can manage notifications for their organization
- Organization-level data isolation enforced