# Development Commands

## Frontend (React + Vite + TypeScript)
```bash
# Navigate to frontend directory
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Lint the code
npm run lint

# Preview production build
npm run preview

# Deploy (builds and deploys to Firebase)
npm run deploy
```

## Backend (Firebase Cloud Functions)
```bash
# Navigate to functions directory
cd functions

# Build TypeScript
npm run build

# Watch mode for development
npm run build:watch

# Start Firebase emulators (functions only)
npm run serve

# Deploy functions only
npm run deploy
```

## Firebase Services
```bash
# Start all Firebase emulators
firebase emulators:start

# Deploy entire project
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Development Workflow

### Common Tasks
1. **Adding new sectors**: Extend `services/enhanced/` with sector-specific logic
2. **Modifying permissions**: Update `permissions/roleDefinitions.ts` and Firestore rules
3. **Warning workflow changes**: Focus on `components/warnings/enhanced/` directory
4. **Testing changes**: Use Firebase emulators for local development
5. **🔔 Adding notifications**: Use `NotificationDeliveryService` for role-based delivery

### Build Process Requirements
- **Build Timeout**: Use `timeout=300000` (5 minutes) for `npm run build` commands
- **Reason**: Vite processes 2081+ modules and can take 2+ minutes for full builds
- **Command**: `npm run build --timeout 300000` or extend bash timeout to 5 minutes

### Key Dependencies
- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router, Firebase v11
- **Backend**: Firebase Functions v4, Firebase Admin v11, TypeScript
- **UI**: Headless UI, Heroicons, Lucide React
- **Forms**: React Hook Form with Zod validation
- **PDF**: jsPDF for document generation