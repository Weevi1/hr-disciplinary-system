# System Architecture Overview

## Project Overview

This is an HR Disciplinary System built with React/TypeScript frontend and Firebase Cloud Functions backend. The system manages employee disciplinary processes, warnings, meetings, absence reports, and organizational administration across multiple sectors (healthcare, manufacturing, retail, etc.).

## Frontend Structure (`frontend/src/`)
- **components/**: UI components organized by feature
  - `admin/`: Organization setup, user management, system administration
  - `employees/`: Employee management, import, filtering
  - `warnings/`: Warning creation workflow with sector-specific templates
  - `meetings/`: HR meeting booking system
  - `absences/`: Absence reporting system
- **services/**: Business logic and API communication
  - `enhanced/`: Sector-specific services (healthcare, manufacturing, etc.)
  - Firebase service integrations
- **hooks/**: Custom React hooks for state management
- **types/**: TypeScript type definitions
- **pages/**: Route-level components (HR dashboard, manager dashboard)
- **auth/**: Authentication context and protected routes

## Backend Structure (`functions/src/`)
- **auth/**: User creation and management services
- **audioCleanup.ts**: Cleanup services for warning audio files
- **temporaryDownload.ts**: Secure file download with temporary tokens
- **index.ts**: Main exports for all Cloud Functions

## Key Features
- **Multi-sector support**: Healthcare, manufacturing, retail, agriculture, etc.
- **Role-based access**: Super users, business owners, HR managers, department managers
- **Progressive discipline**: AI-powered escalation recommendations
- **Document management**: PDF generation with signatures
- **Audio recording**: Voice memos for warnings with automatic cleanup
- **Sector-specific templates**: Industry-tailored warning categories and processes
- **🔔 Real-time notification system**: Role-based notifications with live updates

## Firebase Configuration

### Firestore Collections
- `users` - User accounts with role-based permissions
- `organizations` - Company/organization data
- `employees` - Employee records with sector assignments
- `warnings` - Disciplinary warnings and documentation
- `hr_meeting_requests` - Meeting booking system
- `absence_reports` - Employee absence tracking
- `sectors` - Industry sector definitions
- `warningCategories` - Sector-specific warning types
- `escalationRules` - Progressive discipline rules
- **🔔 `notifications` - Real-time user notifications with role-based delivery**

### Security Rules
- Comprehensive role-based access control in `config/firestore.rules`
- Organization-level data isolation
- Audio file restrictions in `config/storage.rules`

### Emulator Ports
- Auth: 9099
- Functions: 5001
- Firestore: 8080
- Database: 9000
- Hosting: 5000
- Storage: 9199