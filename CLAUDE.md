# CLAUDE.md

Essential guidance for Claude Code when working with this HR Disciplinary System repository.

---

## Quick Start

### Development Commands
```bash
# Frontend development
cd frontend && npm run dev

# Build with extended timeout (handles 2081+ modules)
npm run build --timeout 300000

# Firebase emulators (all services)
firebase emulators:start

# Deploy to production
firebase deploy
```

### Current System Status
- **✅ Production**: Online at https://hr-disciplinary-system.web.app
- **✅ Development**: Ubuntu environment at http://localhost:3003/ (dev server running)
- **✅ Enterprise Ready**: A-grade security, production monitoring, 2,700+ org scalability
- **✅ Sharded Architecture**: Database sharding implemented for multi-thousand organization support
- **✅ Progressive Enhancement**: Complete 2012-2025 device compatibility with zero performance punishment
- **✅ Unified Design System**: Complete visual unification with consistent typography, spacing, and theming
- **✅ Unified Admin Dashboards**: Business Owner, HR, and SuperAdmin dashboards follow identical structure - Greeting → Metrics → Tabs → Quote

---

## Architecture Summary

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase Cloud Functions + Firestore + Storage
- **Firebase Regions**:
  - **Primary**: `us-central1` (most functions, main server)
  - **Secondary**: `us-east1` (super user functions only - new server)
- **Key Features**: Multi-sector HR management, multi-manager employee assignments, role-based access, real-time notifications, QR code document delivery

---

## Development Workflow

1. **Code Changes**: Use existing patterns and design system
2. **Testing**: Manual testing preferred for development efficiency
   - E2E Playwright framework available: `npm run test:e2e` (use only when specifically requested)
   - Firebase emulator testing: `npm run test:firebase`
3. **Builds**: Allow 5+ minutes for full production builds
4. **Never commit**: Unless explicitly requested by user
5. **🚫 FIRESTORE INDEXES**: Never programmatically deploy indexes via firebase.json - user creates them manually in Firebase Console using error links

---

## ⚠️ CRITICAL: Firebase Functions Deployment Regions

### **Server Configuration**
- **PRIMARY SERVER: `us-central1`** - Main deployment region (most functions)
- **SECONDARY SERVER: `us-east1`** - New server (super user functions only)

### **Frontend Configuration**
- **Current**: `frontend/src/config/firebase.ts` uses `us-central1`
- **⚠️ WARNING**: Only change region if deploying to different server
- **Rule**: Always match frontend region with target function's deployment region

### **Current Function Distribution**
```bash
us-central1: Most functions (reseller, organization, auth, billing, audio, etc.)
us-east1:    getSuperUserInfo, manageSuperUser (super user functions only)
```

---

## Important Files

### Core Architecture
- `frontend/src/types/core.ts` - Core type definitions (includes 3-color branding support, multi-manager employment details)
- `frontend/src/types/employee.ts` - Employee type definitions and utilities including **`getManagerIds()` helper** for backward compatibility
- `frontend/src/types/billing.ts` - Billing and reseller type definitions (ZAR pricing)
- `frontend/src/utils/saLocale.ts` - South African localization utilities (currency, dates, timezone)
- `frontend/src/services/` - Business logic and Firebase integration
- `frontend/src/constants/zIndex.ts` - **Standardized z-index scale** (9000-9999) for modal stacking and conflict prevention

### Design System & Theming
- `frontend/src/contexts/BrandingContext.tsx` - White-label branding system with dynamic CSS injection
- `frontend/src/contexts/ThemeContext.tsx` - Theme management system with localStorage persistence
- `frontend/src/config/themes.ts` - Theme color definitions (light, dark, branded) with dynamic CSS variables
- `frontend/src/components/common/ThemedCard.tsx` - **ENHANCED** unified design system components:
  - `ThemedCard` - Standardized card component with `rounded-lg` consistency
  - `ThemedSectionHeader` - Unified section headers across all wizard steps
  - `ThemedFormInput` - Standardized form inputs with error states and theming
  - `ThemedBadge` - Status indicators with semantic color usage
- `frontend/src/components/common/UnifiedModal.tsx` - **GOLD STANDARD** modal wrapper component
- `frontend/src/components/common/ThemeSelector.tsx` - Context-aware theme selector (hides branded theme for super users)
- `frontend/src/components/dashboard/QuotesSection.tsx` - Unified quotes component with theme selector integration

### Progressive Enhancement System
- `frontend/src/utils/deviceDetection.ts` - Comprehensive device capability detection system
- `frontend/src/utils/progressiveEnhancement.ts` - Progressive enhancement engine with performance tier classification
- `frontend/src/components/common/SmartComponentLoader.tsx` - Intelligent component selection based on device capabilities
- `frontend/src/index.css` - Comprehensive progressive enhancement CSS system (1,328 lines)

### Key Services
- `frontend/src/services/DatabaseShardingService.ts` - Core sharding engine
- `frontend/src/services/ShardedDataService.ts` - High-level sharded data operations
- `frontend/src/services/TimeService.ts` - Secure timestamp service preventing fraud (A+ security compliant)
- `frontend/src/services/PDFGenerationService.ts` - **VERSIONED PDF GENERATION** - See detailed section below
- `frontend/src/services/PDFTemplateVersionService.ts` - **PDF TEMPLATE VERSION STORAGE** - 1000x storage reduction through centralized template management
- `frontend/src/services/EmployeeLifecycleService.ts` - Complete employee archive/restore system
- `frontend/src/services/DepartmentService.ts` - Department CRUD operations with real-time sync and employee count management
- `frontend/src/utils/pdfDataTransformer.ts` - **UNIFIED PDF DATA TRANSFORMER** - Single source of truth for PDF data transformation (async, fetches templates)

### Custom Hooks
- `frontend/src/hooks/useHistoricalWarningCountdown.ts` - **60-day countdown** for historical warning entry feature with urgency indicators
- `frontend/src/hooks/dashboard/useDashboardData.ts` - Unified dashboard data loading with parallel fetching
- `frontend/src/hooks/useMultiRolePermissions.ts` - Role-based permission system
- `frontend/src/hooks/usePreventBodyScroll.ts` - **Modal body scroll prevention** hook (all 21+ modals use this)
- `frontend/src/hooks/useFocusTrap.ts` - **Focus trap & keyboard navigation** hook with `useModalDialog()` helper for WCAG 2.1 AA compliance

### Security & Permissions
- `frontend/src/permissions/roleDefinitions.ts` - Role-based access control including reseller permissions
- `config/firestore.rules` - Security rules (requires review)

### Component Systems
- `frontend/src/auth/` - Authentication system (login, password reset)
  - `LoginForm.tsx` - Professional login screen with progressive loading
  - `ForgotPasswordModal.tsx` - **Password reset modal** with WCAG 2.1 AA accessibility and email enumeration prevention
  - `AuthContext.tsx` - Auth state management with Firebase integration
- `frontend/src/components/warnings/enhanced/` - Main warning workflow (mobile-optimized)
- `frontend/src/components/warnings/ManualWarningEntry.tsx` - **Historical Warning Entry System** for digitizing paper records
- `frontend/src/components/warnings/HistoricalWarningDisclaimer.tsx` - Legal compliance warnings for manual entry
- `frontend/src/components/reseller/` - Reseller dashboard, client management, and organization deployment
- `frontend/src/components/hr/EnhancedDeliveryWorkflow.tsx` - Complete HR delivery workflow system
- `frontend/src/components/hr/PrintDeliveryGuide.tsx` - Print & hand delivery workflow with on-demand PDF generation
- `frontend/src/components/admin/DepartmentManagement.tsx` - Complete department CRUD management with stats dashboard
- `frontend/src/components/admin/SuperAdminDashboard.tsx` - **UNIFIED** SuperAdmin dashboard with real metrics (growth, storage usage)
- `frontend/src/components/admin/EnhancedOrganizationWizard.tsx` - Organization deployment wizard with logo upload & JPG→PNG conversion
- `frontend/src/components/dashboard/DashboardRoleSelector.tsx` - **Multi-role dashboard switcher** with localStorage persistence
- `frontend/src/components/dashboard/WelcomeSection.tsx` - Unified greeting component with role selector integration
- `frontend/src/pages/business/BusinessDashboard.tsx` - Main dashboard router with role-based section rendering
- `frontend/src/warning-wizard.css` - Comprehensive mobile CSS optimizations (1,600+ lines) with S8 compatibility

---

## Critical Operational Guidelines

### **🚫 NEVER DO**
- **Never commit** unless explicitly requested
- **Never update git config**
- **Never use git commands with -i flag** (interactive input not supported)
- **Never programmatically deploy Firestore indexes** - user creates manually via console
- **Never push to remote** unless user explicitly asks

### **✅ ALWAYS DO**
- Use existing patterns and design system
- Check for similar code in components before adding new code
- Run lint and typecheck commands after significant changes if available
- Use absolute file paths in tools
- Prefer editing existing files over creating new ones
- Use defensive programming with null checks

### **Development Server Status**
- **Current**: Running at http://localhost:3003/
- **Status**: Fully optimized for 2012-era devices with progressive enhancement
- **Compatibility**: 95% compatible with Android 4.0+ and iOS 6+ devices
- **✅ Mobile Dashboard**: Samsung S8 era mobile optimizations implemented
- **✅ Mobile Layout**: MainLayout header optimized - removed hamburger menu, consolidated navigation into profile dropdown
- **✅ Mobile Components**: Created MobileEmployeeManagement component with dedicated mobile UX patterns

---

## 🔒 PDF Generator Versioning System - SECURITY CRITICAL

### **Overview**

The PDF generation system uses semantic versioning to ensure **legal compliance** and **document integrity**. Historical warnings must regenerate **identically** years later for appeals, audits, or legal proceedings.

### **⚠️⚠️⚠️ CRITICAL: NEVER MODIFY FROZEN VERSIONS ⚠️⚠️⚠️**

**Frozen versions** are PERMANENTLY LOCKED and must **NEVER** be changed. Modifying them breaks legal document integrity and could invalidate historical warnings in court.

### **Current Version Status**

- **v1.0.0** - [FROZEN] - Used by warnings created before 2025-10-14
  - Previous Action shows: `Date | Offense | Level`
  - ⚠️ **DO NOT MODIFY** `generateWarningPDF_v1_0_0()` or `addPreviousDisciplinaryActionSection_v1_0_0()`

- **v1.1.0** - [CURRENT] - Used by all new warnings
  - Previous Action shows: `Date | Incident Description | Level`
  - ⚠️ Will become FROZEN when v1.2.0 is released

### **How It Works**

1. **New Warnings**: Store `pdfGeneratorVersion: '1.1.0'` in Firestore when created
2. **Regeneration**: Read stored version from Firestore, route to correct version handler
3. **Consistency**: Old warnings use v1.0.0 code, new warnings use v1.1.0 code
4. **Legal Compliance**: PDFs always look identical regardless of when regenerated

### **Key Files**

- **`frontend/src/services/PDFGenerationService.ts`**
  - Main entry point: `generateWarningPDF(data, requestedVersion)`
  - Version routing switch (lines 206-228)
  - Frozen methods: `generateWarningPDF_v1_0_0()`, `addPreviousDisciplinaryActionSection_v1_0_0()`
  - Current method: `generateWarningPDF_v1_1_0()`
  - **100+ lines of protective comments**

- **`frontend/src/utils/pdfDataTransformer.ts`**
  - `transformWarningDataForPDF()` - Adds `pdfGeneratorVersion` to all PDFs
  - Single source of truth for data transformation

- **`frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`**
  - Stores `pdfGeneratorVersion` when creating warnings (line 887)
  - 27 lines of comprehensive comments explaining system

### **Updated Components (All pass stored version)**

All 6 PDF regeneration points now pass the stored version:
1. `SimplePDFDownloadModal.tsx` (line 212-215)
2. `PDFPreviewModal.tsx` (line 219-222)
3. `PrintDeliveryGuide.tsx` (line 149-152)
4. `DeliveryCompletionStep.tsx` (line 275-278)
5. `ProofOfDeliveryModal.tsx` (line 279-282)
6. `PDFViewerModal.tsx` (line 184-187)

### **🚫 DO NOT:**

- Modify `generateWarningPDF_v1_0_0()` method
- Modify `addPreviousDisciplinaryActionSection_v1_0_0()` method
- Change format strings in frozen versions (e.g., line 865 in v1.0.0)
- "Fix bugs" in frozen versions
- Remove cases from version routing switch
- Modify `generateWarningPDF_v1_1_0()` once it becomes frozen

### **✅ HOW TO ADD A NEW VERSION (e.g., v1.2.0):**

1. **Increment Version**: Update `PDF_GENERATOR_VERSION` in `PDFGenerationService.ts` (line 63)
   ```typescript
   export const PDF_GENERATOR_VERSION = '1.2.0'; // Changed from 1.1.0
   ```

2. **Create New Method**: Copy v1.1.0 method and create `generateWarningPDF_v1_2_0()`
   ```typescript
   private static async generateWarningPDF_v1_2_0(data: WarningPDFData): Promise<Blob> {
     // Your new implementation
   }
   ```

3. **Create New Format Method** (if format changed):
   ```typescript
   private static addPreviousDisciplinaryActionSection_v1_2_0(...) {
     // Your new format
   }
   ```

4. **Update Version Routing** (add new case, KEEP all old ones):
   ```typescript
   switch (version) {
     case '1.0.0':
       return this.generateWarningPDF_v1_0_0(data);
     case '1.1.0':
       return this.generateWarningPDF_v1_1_0(data);
     case '1.2.0':  // ADD THIS
       return this.generateWarningPDF_v1_2_0(data);
     default:
       return this.generateWarningPDF_v1_2_0(data); // Update fallback
   }
   ```

5. **Mark Previous Version as FROZEN**:
   - Update v1.1.0 method comment to say [FROZEN]
   - Add ⚠️ DO NOT MODIFY warnings to v1.1.0

6. **Update Version History** (lines 40-51):
   ```typescript
   * - v1.2.0 (2025-XX-XX): Description of changes [CURRENT]
   *   - What changed and why
   ```

7. **Update CLAUDE.md**: Add v1.2.0 to version status list

8. **Test Thoroughly**:
   - Create new warning, verify it stores v1.2.0
   - Regenerate old v1.0.0 warning, verify format unchanged
   - Regenerate old v1.1.0 warning, verify format unchanged
   - Download, preview, print all versions

### **Semantic Versioning Rules**

- **MAJOR (X.0.0)**: Breaking changes to PDF structure (page layout, sections)
- **MINOR (0.X.0)**: Content changes (field additions, formatting tweaks, text changes)
- **PATCH (0.0.X)**: Bug fixes that don't affect visible output (code refactoring only)

### **Testing Checklist**

When versioning changes are made:

- [ ] New warnings store current version in Firestore
- [ ] Old warnings regenerate with their original version
- [ ] All 6 regeneration points pass stored version
- [ ] Version routing works for all versions
- [ ] No modifications to frozen version methods
- [ ] Comments updated with [FROZEN] or [CURRENT] status
- [ ] CLAUDE.md updated with version information
- [ ] Build succeeds without errors
- [ ] Production deployment successful

### **Legal Compliance Impact**

This versioning system is **CRITICAL** for:
- **Court proceedings**: Historical warnings must match original documents
- **Audits**: Consistency required for labor law compliance
- **Appeals**: Documents must be identical across time
- **CCMA cases**: Document tampering allegations avoided

**Modifying frozen versions could result in:**
- ❌ Documents being challenged in court
- ❌ Losing CCMA/labor disputes
- ❌ Legal liability for the organization
- ❌ Loss of document integrity and trust

---

## 🎨 PDF Template Customization System - PER-ORGANIZATION STYLING

### **Overview**

The PDF template customization system allows **each organization** to have unique PDF styling (colors, fonts, margins, logos) while maintaining the **same global PDF generator code version**. This separation enables visual customization without compromising legal compliance.

### **Architecture: Two-Layer System**

1. **PDF Generator Version** (Global Code) - Routes to frozen code handlers for legal consistency
2. **PDF Template Settings** (Per-Org Styling) - Visual customization layer applied by the handler

**Think of it like Microsoft Word:**
- Generator Version = Word application (v1.0.0, v1.1.0) - same for everyone
- Template Settings = `.docx` template file - different for each organization

### **How It Works**

1. **Warning Creation**: Stores BOTH `pdfGeneratorVersion` AND `pdfSettings` snapshot in Firestore
2. **Regeneration**: Reads both fields, routes to correct code version, applies stored template settings
3. **Consistency**: Old warnings regenerate with their original code version AND original visual styling
4. **Customization**: Each organization can customize colors, fonts, margins, logos independently

### **Key Files**

- **`frontend/src/types/core.ts`**
  - `PDFTemplateSettings` interface (lines 75-154) - Complete template configuration structure
  - `Warning` interface (lines 334-335) - Stores both `pdfGeneratorVersion` and `pdfSettings` fields

- **`frontend/src/services/PDFGenerationService.ts`**
  - Method signature: `generateWarningPDF(data, version?, settings?)` (lines 198-202)
  - Settings merge logic (lines 380-415) - Merges custom settings with defaults
  - PDF configuration (lines 436-452) - Applies settings to page size, fonts, margins

- **`frontend/src/utils/pdfDataTransformer.ts`**
  - Lines 196-199: Extracts `pdfSettings` from warning data or organization data
  - Priority: Stored snapshot → Org's current settings → Defaults

- **`frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`**
  - Lines 909-912: Stores organization's `pdfSettings` snapshot when creating warning

- **`frontend/src/components/admin/PDFTemplateManager.tsx`**
  - SuperAdmin interface for managing per-organization PDF templates
  - Live preview, version management, bulk operations

- **`frontend/src/components/admin/PDFTemplateEditor.tsx`**
  - Visual editor for customizing PDF template settings
  - Color pickers, font selectors, margin controls

- **`frontend/src/components/admin/PDFTemplatePreview.tsx`**
  - Real-time PDF preview with sample data
  - Debounced regeneration (500ms) when settings change

- **`frontend/src/services/PDFTemplateService.ts`**
  - Save/load PDF template settings for organizations
  - Version history tracking

### **All PDF Generation Points (7 Total)**

All 7 components now pass the 3-parameter pattern:

```typescript
PDFGenerationService.generateWarningPDF(
  pdfData,                    // 1st param: Warning data
  pdfData.pdfGeneratorVersion,  // 2nd param: Code version (routing)
  pdfData.pdfSettings          // 3rd param: Template settings (styling)
)
```

1. **DeliveryCompletionStep.tsx** (lines 276-279) - QR code generation
2. **PDFPreviewModal.tsx** (lines 220-223) - Wizard preview
3. **SimplePDFDownloadModal.tsx** (lines 213-216) - Simple download
4. **PDFViewerModal.tsx** (lines 185-188) - Full-screen viewer
5. **ProofOfDeliveryModal.tsx** (lines 280-283) - Delivery workflow
6. **PrintDeliveryGuide.tsx** (lines 150-153) - Print & hand delivery
7. **PDFTemplatePreview.tsx** (lines 51-54) - SuperAdmin template preview

### **Template Settings Structure**

```typescript
PDFTemplateSettings {
  // Version Control
  generatorVersion: string;        // Links to PDF_GENERATOR_VERSION
  templateId?: string;
  lastUpdated: Date;
  updatedBy: string;

  // Visual Styling
  styling: {
    headerBackground: string;      // HEX color
    sectionHeaderColor: string;
    bodyTextColor: string;
    borderColor: string;
    useBrandColors: boolean;
    fontSize: number;              // 10-12pt
    fontFamily: 'Helvetica' | 'Times' | 'Arial';
    lineHeight: number;            // 1.0-2.0
    pageSize: 'A4' | 'Letter';
    margins: { top, bottom, left, right };
  };

  // Content Configuration
  content: {
    showLogo: boolean;
    logoPosition: 'top-left' | 'top-center' | 'top-right';
    logoMaxHeight: number;
    enabledSections: string[];
    showWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    footerText: string;
    showPageNumbers: boolean;
    legalTextVersion: 'south-africa-lra' | 'custom';
  };

  // Feature Flags
  features: {
    enablePreviousWarnings: boolean;
    enableConsequences: boolean;
    enableEmployeeRights: boolean;
    enableAppealSection: boolean;
    enableSignatures: boolean;
  };

  // Version History
  versionHistory: Array<{
    version: string;
    activatedAt: Date;
    activatedBy: string;
    previousVersion?: string;
    reason?: string;
    changes?: string[];
  }>;

  // Rollout Control
  autoUpgrade: boolean;
  betaFeatures: boolean;
}
```

### **Benefits**

✅ **Legal Compliance**: Code version ensures consistent regeneration across time
✅ **Visual Flexibility**: Each organization can have unique PDF branding
✅ **Snapshot Pattern**: Warnings store template settings at creation time
✅ **Backward Compatible**: Old warnings without settings use org's current settings
✅ **SuperAdmin Control**: Central management interface for all organizations
✅ **Live Preview**: Real-time preview when editing template settings
✅ **No Breaking Changes**: Optional third parameter, graceful fallbacks

### **Example Use Case**

**Scenario**: ABC Corp wants blue headers, DEF Corp wants green headers

1. SuperAdmin opens PDF Template Manager
2. Selects ABC Corp, sets `headerBackground: '#0000FF'` (blue)
3. Selects DEF Corp, sets `headerBackground: '#00FF00'` (green)
4. Both organizations use the same PDF generator version (v1.1.0)
5. Warnings regenerate with their organization's unique colors
6. Legal format stays identical (same code version), only styling differs

### **Migration Path**

**Existing Warnings** (before this feature):
- Have `pdfGeneratorVersion` but no `pdfSettings` field
- Regenerate using org's current template settings as fallback
- No visual changes unless org customizes settings

**New Warnings** (after this feature):
- Store both `pdfGeneratorVersion` and `pdfSettings` snapshot
- Regenerate with exact styling from creation time
- Visual consistency guaranteed across time

---

## 💾 PDF Template Version Storage Optimization - DATABASE EFFICIENCY

### **Overview**

The PDF template version storage system prevents **database bloat** by storing template configurations centrally instead of duplicating them with every warning document. This achieves a **1000x storage reduction** per warning while maintaining the ability to regenerate PDFs with their original template settings.

### **Problem Identified**

**Before optimization**, each warning document stored the complete `pdfSettings` object (5-10KB) duplicated in Firestore:

```typescript
// ❌ OLD APPROACH (BLOATED)
warnings/{warningId} {
  pdfSettings: {
    styling: { ... },        // ~2KB
    content: { ... },        // ~2KB
    features: { ... },       // ~1KB
    versionHistory: [ ... ]  // ~2-3KB
  },
  // Other warning fields...
}
// Total: 5-10KB per warning × 1000 warnings = 5-10MB of duplicate data
```

**With 1,000 warnings**, this resulted in **5-10MB of redundant storage** for the same template settings.

### **Solution: Database Normalization**

**After optimization**, warnings store only a version string reference (5 bytes):

```typescript
// ✅ NEW APPROACH (OPTIMIZED)
warnings/{warningId} {
  pdfTemplateVersion: "1.3.0",  // 5 bytes
  // Other warning fields...
}

// Template stored ONCE in centralized collection:
organizations/{orgId}/pdfTemplateVersions/1.3.0 {
  version: "1.3.0",
  settings: { /* complete pdfSettings object */ },
  activatedAt: Timestamp,
  activatedBy: "user123",
  reason: "Updated header colors"
}
// Total: 5 bytes per warning × 1000 warnings = 5KB (0.0005% of original size)
```

### **Architecture**

**Database Structure:**
```
organizations/{orgId}/
  └── pdfTemplateVersions/{version}
      ├── version: "1.3.0"
      ├── settings: PDFTemplateSettings (5-10KB)
      ├── activatedAt: Timestamp
      ├── activatedBy: string
      ├── reason: string
      └── previousVersion?: string
```

**Workflow:**
1. **Warning Creation**: Wizard calls `PDFTemplateVersionService.ensureTemplateVersionExists()` to save template to versions collection
2. **Version Storage**: Warning stores only `pdfTemplateVersion: "1.3.0"` field (5 bytes)
3. **PDF Regeneration**: `pdfDataTransformer.transformWarningDataForPDF()` fetches template from versions collection using stored version
4. **Fallback**: Old warnings without version field use organization's current settings for backward compatibility

### **Key Files**

- **`frontend/src/services/PDFTemplateVersionService.ts`** (219 lines)
  - `saveTemplateVersion()` - Store template version in Firestore
  - `getTemplateVersion()` - Fetch specific version from collection
  - `ensureTemplateVersionExists()` - Called during warning creation (idempotent)
  - `getCurrentTemplateVersion()` - Get organization's active template version
  - `getAllTemplateVersions()` - Retrieve version history for organization

- **`frontend/src/utils/pdfDataTransformer.ts`** (lines 192-220)
  - Made `transformWarningDataForPDF()` **async** to fetch templates from Firestore
  - Fetches template using `PDFTemplateVersionService.getTemplateVersion()`
  - Falls back to organization's current settings for old warnings
  - Logs success: `✅ Fetched template version 1.3.0 from collection`

- **`frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx`** (lines 855-948)
  - Calls `PDFTemplateVersionService.ensureTemplateVersionExists()` before creating warning
  - Stores `pdfTemplateVersion` field in warning document

- **`frontend/src/services/WarningService.ts`** (line 105)
  - Updated `Warning` interface from `pdfSettings?: any` to `pdfTemplateVersion?: string`

- **`frontend/src/api/index.ts`** (line 213)
  - Updated API layer to handle `pdfTemplateVersion` field passthrough

- **`config/firestore.rules`** (lines 604-617)
  - Security rules for `pdfTemplateVersions` subcollection
  - Read access: Organization members, resellerManagesOrganization, or superUser
  - Write access: SuperUser or organization managers

### **PDF Regeneration Components**

All components updated to pass `pdfTemplateVersion` through to `pdfDataTransformer`:

1. **EnhancedWarningWizard.tsx** - Stores version during creation
2. **PDFPreviewModal.tsx** (lines 199-201) - Passes version to transformer
3. **WarningDetailsModal.tsx** (line 1109) - Passes version in formData
4. **SimplePDFDownloadModal.tsx** - Uses transformer with version
5. **PrintDeliveryGuide.tsx** - Uses transformer with version
6. **ProofOfDeliveryModal.tsx** - Uses transformer with version

### **Benefits**

✅ **1000x Storage Reduction**: 5 bytes vs 5-10KB per warning
✅ **Centralized Management**: Single source of truth for each template version
✅ **Cost Savings**: Significantly lower Firestore storage and bandwidth costs
✅ **Backward Compatible**: Old warnings without version field gracefully fall back to org's current settings
✅ **Version Tracking**: Complete audit trail of template changes
✅ **Faster Writes**: Warning creation faster (stores 5 bytes instead of 5KB)

### **Implementation Details**

**Conditional Object Spreading** (to avoid Firestore `undefined` rejection):
```typescript
// ✅ CORRECT: Only include previousVersion if it exists
const templateVersion: PDFTemplateVersion = {
  version,
  settings,
  activatedAt: new Date(),
  activatedBy: metadata.activatedBy,
  reason: metadata.reason || 'Template version saved',
  ...(metadata.previousVersion ? { previousVersion: metadata.previousVersion } : {})
};
```

**Async Handling** (React hooks can't call async `useMemo`):
```typescript
// ✅ CORRECT: useMemo builds sync data, async transform happens in callback
const extractedData = useMemo(() => {
  // Build simple data structure synchronously for UI
  return { /* sync data */ };
}, [deps]);

const generatePDF = async () => {
  // Call async transformer here
  const transformedData = await transformWarningDataForPDF(...);
  const pdfBlob = await PDFGenerationService.generateWarningPDF(transformedData);
};
```

### **Testing Checklist**

When creating/viewing warnings:

- [ ] New warnings store `pdfTemplateVersion` field in Firestore
- [ ] Template version document exists in `organizations/{orgId}/pdfTemplateVersions/{version}`
- [ ] Console shows: `✅ Fetched template version X.X.X from collection`
- [ ] PDFs generate correctly with fetched template settings
- [ ] Old warnings without version field still generate PDFs (fallback to org settings)
- [ ] No Firestore permissions errors
- [ ] No TypeScript errors

### **Cost Savings Example**

**Scenario**: Organization with 1,000 warnings, each template is 8KB

**Before optimization:**
- Storage: 1,000 warnings × 8KB = 8MB
- Bandwidth: 1,000 regenerations × 8KB = 8MB download
- Cost: ~$0.20/month storage + $0.12/GB bandwidth

**After optimization:**
- Storage: 1,000 warnings × 5 bytes = 5KB + 1 template × 8KB = 8.005KB
- Bandwidth: 1,000 regenerations × 5 bytes = 5KB + 1 template fetch × 8KB = 13KB
- Cost: ~$0.0002/month storage + $0.000015/GB bandwidth

**Savings: 99.9% reduction in storage and bandwidth costs**

### **Relationship to Other Systems**

This optimization works **in conjunction** with:

1. **PDF Generator Versioning** (v1.0.0, v1.1.0) - Ensures code-level consistency for legal compliance
2. **PDF Template Customization** - Provides per-organization visual styling
3. **Template Version Storage** (this system) - Prevents duplication of template data across warnings

All three systems work together:
- **Generator Version** = Which frozen code handler to use (legal compliance)
- **Template Settings** = Visual customization data (colors, fonts, margins)
- **Template Version Storage** = Where template settings are stored (centralized collection vs duplicated)

---

## Reference Documentation

**Quick reference to supporting documentation:**

### Architecture & Security
- `DATABASE_SHARDING_ARCHITECTURE.md` - Complete sharding implementation with validation
- `SECURITY_AUDIT_REPORT.md` - A-grade security framework and assessment
- `TESTING_STRATEGY.md` - Comprehensive testing framework
- `REQUIRED_FIRESTORE_INDEXES.md` - Active operational reference

### Design & UI
- `V2_DESIGN_PRINCIPLES.md` - Production-ready visual design language
- `MODAL_DESIGN_STANDARDS.md` - Gold standard modal design patterns and implementation guidelines
- `MODAL_AUDIT_REPORT.md` - **Modal system audit** - Comprehensive analysis of all 21+ modals (centering, scrolling, body scroll prevention, z-index) with fix recommendations
- `MODAL_FIXES_IMPLEMENTATION.md` - **✅ Week 1 Complete** - Body scroll prevention hook, standardized z-index (9000-9999), all 19 modals updated
- `MODAL_WEEK_2_3_IMPLEMENTATION.md` - **✅ Week 2-3 Complete** - Focus trap hook, ARIA labels, scroll strategy standardization, comprehensive usage guidelines
- `MODAL_USAGE_GUIDELINES.md` - **Complete usage guide** - Decision tree, best practices, accessibility requirements, code examples, testing guidelines
- `ENHANCED_WARNING_WIZARD_MOBILE_OPTIMIZATION.md` - Samsung S8+ mobile optimization details
- `ENHANCED_WARNING_WIZARD_DESIGN_SYSTEM.md` - Unified design system implementation

### Development History
- `CLAUDE_DEVELOPMENT_HISTORY.md` - Historical context and archived implementation details
- `FEATURE_IMPLEMENTATIONS.md` - Completed feature documentation (Department Management, User Management, Dashboard Redesign, Manual Warning Entry)
- `RECENT_UPDATES.md` - **Latest session updates** (Sessions 5-18) - All recent fixes, improvements, and feature implementations
- `SESSION_HISTORY.md` - **Archived session history** - Detailed change logs from Sessions 5-17

---

## 📋 CURRENT FOCUS / PENDING TASKS

### **🔜 Testing & Validation Tasks**

**✅ Priority 1: Deploy Functions** - COMPLETED
- ✅ Redeployed Firebase Functions - all 25/25 functions deployed successfully after cleanup
- ✅ Removed `setCustomClaimsOnSignIn` function
- ✅ No GCIP upgrade errors

**✅ Priority 2: Test Enhanced User Creation** - COMPLETED
- ✅ Business owners can promote existing employees to HR/Department manager roles
- ✅ Business owners can create new managers with automatic employee records
- ✅ Email verification during employee promotion works correctly

**Priority 3: Test Historical Warning Entry**
- 60-day countdown displays correctly for HR managers
- First access timestamp recorded properly
- Urgency indicators work (amber → orange → red progression)
- Button hides after 60 days

**Priority 4: Test Employee Management Fixes**
- HOD managers can view their team members (no "No Employees Found" error)
- HR managers can edit employee records created during manager promotion
- Optional chaining handles missing profile data gracefully

**Priority 5: Test Department System**
- Real-time employee count updates when employees added/removed
- Department management works on Business Owner Dashboard tabs
- Default departments (Operations, Admin) created for new organizations

**✅ Priority 6: Test Bulk Employee-Manager Assignment** - COMPLETED (Feature Verified)
- ✅ Checkbox column appears in Employee Table Browser
- ✅ Select all checkbox toggles all employees on page
- ✅ Bulk actions bar appears when employees selected
- ✅ "Assign to Manager" button visible for HR role only
- ✅ Modal opens with manager dropdown and confirmation
- ✅ Multiple employees assigned to manager successfully
- ✅ Employee list refreshes after assignment

**✅ Priority 7: Test Print & Hand Delivery Workflow** - COMPLETED (Session 19)
- ✅ On-demand PDF generation works for warnings without existing PDF URLs
- ✅ Employee data structure transformation (nested → flat) successful
- ✅ Field mapping corrections (level, issueDate, incidentDate) working
- ✅ Simplified workflow (Steps 2 & 3) streamlined for better UX
- ✅ Dashboard counter refresh mechanism working correctly
- ✅ Status updates propagate to HR Dashboard in real-time

---

### **🎯 Current System State**
- ✅ All code changes committed (Session 22)
- ✅ Frontend deployed and live
- ✅ Development server running at http://localhost:3003/
- ✅ All new features ready for production testing
- ✅ **PDF A4 Formatting** - Professional A4 documents with optimized spacing and typography
- ✅ **Warning scripts rewritten** - All 11 SA languages updated to formal recap format
- ✅ **Witness signature system** - Prominent watermarking with explicit save buttons
- ✅ **Manager Name in PDFs** - All new warnings now store and display manager name in signature section

---

## 🔧 Latest Updates (Session 32)

**See `RECENT_UPDATES.md` and `SESSION_HISTORY.md` for complete change history**

### Most Recent Changes (Session 32 - 2025-10-16)
- **📊 EMPLOYEE CSV IMPORT ENHANCEMENTS** - Simplified CSV format with automatic phone number formatting
  - **Purpose**: Streamline employee bulk import process with SA-specific phone number handling
  - **Implementation**:
    1. **Simplified CSV Template** (`types/employee.ts`):
       - Removed `contractType` column (auto-defaults to "permanent")
       - Removed `department` column (optional field, assigned later)
       - Removed `probationEndDate` column (optional field)
       - Final format: 8 fields (employeeNumber, firstName, lastName, email, phoneNumber, whatsappNumber, position, startDate)
    2. **Updated Field Requirements** (`EmployeeFormModal.tsx`, `types/employee.ts`):
       - **Required (7 fields)**: Employee Number, First Name, Last Name, Phone Number, Position, Start Date, Contract Type
       - **Optional**: Email (changed from required), Department (changed from required), WhatsApp Number, Probation End Date, Managers
       - Form now validates phone number instead of email as mandatory field
    3. **Automatic Phone Number Formatting** (`useEmployeeImport.ts` lines 18-39):
       - Created `formatPhoneNumber()` helper function
       - Accepts local format: `0825254011` → Converts to `+27825254011`
       - Accepts international: `+27825254011` or `27825254011` → Normalizes to `+27825254011`
       - Handles formatted input: `082 525 4011` or `082-525-4011` → Strips formatting, adds `+27`
       - Applied to both phoneNumber and whatsappNumber fields during CSV parsing
    4. **Improved Duplicate Detection** (`useEmployeeImport.ts` lines 160-173):
       - Employee number is the unique identifier
       - Duplicate error message: `"Employee "EMP001" already exists - not imported (duplicate found)"`
       - Clear indication that row was skipped, not failed
    5. **Updated Import Validation** (`useEmployeeImport.ts` lines 110-112):
       - **Required fields**: employeeNumber, firstName, lastName, phoneNumber, position, startDate
       - **Optional fields**: email, whatsappNumber (can be blank in CSV)
       - Contract type defaults to "permanent" if not provided
    6. **Enhanced UI Instructions** (`EmployeeImportModal.tsx` lines 157-176):
       - Added helpful tips about field requirements
       - Clarified that employee number is the unique identifier
       - Explained duplicate handling behavior
       - Documented phone number format flexibility
       - Sample CSV shows both local (0825254011) and international (+27825254011) formats
  - **Phone Number Formatting Logic** (`useEmployeeImport.ts` lines 18-45):
    - Removes all spaces, dashes, parentheses
    - Starts with `0` → Replace with `+27` (e.g., `0825254011` → `+27825254011`)
    - Starts with `27` → Add `+` prefix (e.g., `27825254011` → `+27825254011`)
    - **Excel/Sheets edge case**: Missing leading 0 → Add `+27` (e.g., `825254011` → `+27825254011`)
      - Spreadsheet applications often strip leading zeros from phone numbers
      - This case is explicitly handled to prevent data loss during CSV import
      - No prefix and doesn't start with '27' → Assume local, add `+27`
  - **CSV Sample Format**:
    ```csv
    employeeNumber,firstName,lastName,email,phoneNumber,whatsappNumber,position,startDate
    EMP001,John,Doe,john.doe@company.com,0123456789,0123456789,Software Developer,2024-01-15
    EMP002,Sarah,Johnson,,+27987654321,+27987654321,HR Manager,2023-06-01
    EMP003,Michael,Smith,michael.smith@company.com,0825254011,,Operations Coordinator,2024-11-01
    ```
  - **Key Features**:
    - **Simplified Format**: Only 8 essential fields in CSV
    - **Flexible Phone Numbers**: Accepts local or international format
    - **Auto-Conversion**: All phone numbers standardized to +27 format
    - **Clear Error Messages**: Duplicate employees explicitly identified
    - **Optional Fields**: Email and WhatsApp can be left blank
    - **Smart Defaults**: Contract type NOT imported from CSV - always set to "permanent"
  - **Files Modified** (5 files):
    - `frontend/src/types/employee.ts` - Updated CSV generation, interfaces, validation
    - `frontend/src/components/employees/EmployeeFormModal.tsx` - Changed field requirements (email optional, phone required, department optional)
    - `frontend/src/components/employees/EmployeeImportModal.tsx` - Updated UI with helpful tips and sample data
    - `frontend/src/hooks/employees/useEmployeeImport.ts` - Added phone formatting function, updated validation
    - `frontend/src/types/core.ts` - Updated EmployeeFormData interface
  - **Benefits**:
    - ✅ Simpler CSV format (8 fields vs 12 previously)
    - ✅ SA-friendly phone number input (local format accepted)
    - ✅ Automatic standardization to international format
    - ✅ Clear duplicate detection messaging
    - ✅ Reduced errors from optional field confusion
  - **Example Use Case**: HR downloads template, fills in employee data using local phone format (0825254011), uploads CSV, system auto-converts to +27825254011
  - **Status**: ✅ Complete - Deployed to production

### Previous Changes (Session 31 - 2025-10-15)
- **🎨 EDITABLE PDF TEXT CONTENT SYSTEM** - Complete zero-hardcoded text implementation with subsections editor
  - **Purpose**: Enable SuperAdmin to edit ALL text content in PDF sections (Consequences, Employee Rights, etc.) while maintaining v1.1.0 styling
  - **Business Model**: Provide legally compliant v1.1.0 defaults, SuperAdmin customizes per client request, legal responsibility stays with client
  - **Architecture**: Zero hardcoded fallbacks - all text stored in Firestore and fully editable through UI
  - **Implementation**:
    1. **Fixed Save Template Button** (`PDFTemplateManager.tsx`):
       - Changed `user?.uid` to `user?.id` (AuthContext returns `id` not `uid`)
       - Save button now works, updates Firestore with version tracking
    2. **Enhanced PDFSectionConfig** (`types/core.ts` lines 90-96):
       - Added `subsections` array support for structured multi-part sections
       - Each subsection has `title: string` and `content: string | string[]`
       - Supports both paragraph text and bullet point arrays
    3. **Extracted ALL v1.1.0 Text** (`PDFTemplateService.ts` lines 151-208):
       - Consequences Section: 5 bullet points with full text
       - Employee Rights: 3 subsections ("Your Rights", "What Happens Next", "Important Notice")
       - All default text from v1.1.0 now in Firestore configs
    4. **Removed Hardcoded Fallbacks** (`PDFGenerationService.ts`):
       - Deleted 123 lines of hardcoded English text
       - `addConsequencesSection()` now requires sectionConfig parameter
       - `addEmployeeRightsSection()` now requires sectionConfig.content.subsections
       - Methods log warnings and skip if config missing
    5. **Added Placeholder System** (`PDFGenerationService.ts` lines 587-615):
       - `replacePlaceholders()` helper method for dynamic data
       - Supports: {{validityPeriod}}, {{employee.firstName}}, {{employee.lastName}}, {{issuedDate}}
       - Used in all subsection content rendering
    6. **Subsections Editor UI** (`SectionEditorModal.tsx` lines 376-489):
       - Complete CRUD for subsections (add, edit, delete)
       - Content type toggle: Paragraph ↔ Bullet Points
       - Dynamic bullet point management per subsection
       - Professional UI with gray borders and hover states
       - 8 helper functions for subsection manipulation
    7. **Updated Rendering Methods** (`PDFGenerationService.ts`):
       - `addConsequencesSection()` uses sectionConfig for body and bulletPoints
       - `addEmployeeRightsSection()` iterates through subsections array
       - Maintains 100% v1.1.0 styling (colors, fonts, spacing, backgrounds)
       - Placeholder replacement in all text content
  - **What's Editable Now**:
    - ✅ Consequences red box: heading + 5 bullet points
    - ✅ Employee Rights blue box - "Your Rights:" subsection (4 bullets)
    - ✅ Employee Rights blue box - "What Happens Next:" subsection (3 bullets)
    - ✅ Employee Rights blue box - "Important Notice:" subsection (paragraph)
    - ✅ All section headings
    - ✅ Placeholder support ({{validityPeriod}}, etc.)
  - **Key Features**:
    - **Zero Hardcoded Text**: Everything comes from Firestore section configs
    - **v1.1.0 Baseline**: Orgs created with complete LRA-compliant defaults
    - **Full Customization**: SuperAdmin can edit any text for client requests
    - **Placeholder System**: Dynamic data replacement in custom text
    - **Styling Preservation**: 100% v1.1.0 appearance maintained
    - **Version Tracking**: Every save creates version history entry
  - **Files Modified** (4 files):
    - `frontend/src/components/admin/PDFTemplateManager.tsx` - Fixed save button (user.id)
    - `frontend/src/types/core.ts` - Added subsections support
    - `frontend/src/services/PDFTemplateService.ts` - Extracted all v1.1.0 text to configs
    - `frontend/src/services/PDFGenerationService.ts` - Removed hardcoded fallbacks, added placeholder system
    - `frontend/src/components/admin/SectionEditorModal.tsx` - Added subsections editor UI
  - **Benefits**:
    - ✅ SuperAdmin can customize any client's warning text
    - ✅ Legally compliant defaults provided automatically
    - ✅ No code changes needed for text updates
    - ✅ Full audit trail with version history
    - ✅ Client-specific customization without legal liability
  - **Example Use Case**: Client wants different wording for Employee Rights appeals section - SuperAdmin edits text in UI, saves, client's warnings use custom text
  - **Status**: ✅ Complete - All text editable, zero hardcoded fallbacks, ready for deployment

### Previous Changes (Session 30 - 2025-10-15)
- **🐛 MULTI-MANAGER SYSTEM FIXES & DEBUGGING** - Fixed employee promotion crashes and added diagnostic logging
  - **Problem 1**: PromoteToManagerModal crashed when opening due to employees with missing profile data
  - **Root Cause**: Code tried to access `employee.profile.firstName` without checking if `profile` exists
  - **Solution**:
    - Added defensive null checks throughout PromoteToManagerModal (lines 119-127, 170, 183, 269)
    - Enhanced employee filtering to exclude incomplete records (lines 58-71)
    - Added warning logs for skipped employees
  - **Problem 2**: Backend function returned "Missing required fields" error during promotion
  - **Root Cause**: `createOrganizationUser` function requires `password` field, but ManagerService wasn't sending it
  - **Solution**:
    - Added `password: 'temp123'` to function call (line 256)
    - Added `employeeId` parameter to link existing employee record (line 268)
    - Added `updateEmployeeEmail: true` to sync email address (line 269)
    - Updated success message to inform HR about password reset process (ManagerManagement.tsx line 93)
  - **Problem 3**: Employees assigned to managers not showing up in manager's dashboard
  - **Investigation**: Added comprehensive debug logging to ManagerService to diagnose
    - Lines 135-141: Logs each employee's managerIds array, match status, and inclusion decision
    - Helps identify if employee records have correct managerIds or still using old managerId field
  - **Files Modified**:
    - `frontend/src/components/managers/PromoteToManagerModal.tsx` - Defensive null checks and filtering
    - `frontend/src/services/ManagerService.ts` - Added password field, debug logging
    - `frontend/src/components/managers/ManagerManagement.tsx` - Updated success message
  - **Impact**:
    - ✅ Modal no longer crashes with incomplete employee data
    - ✅ Employee promotion creates proper Firebase Auth account with temp123 password
    - ✅ Employee record linked to new user account
    - ✅ Debug logs help identify manager assignment data issues
  - **Next Steps**: Verify employee's `employment.managerIds` array is correctly updated when assigning to manager
  - **Status**: ⚠️ In Progress - Promotion works, debugging employee visibility issue

### Previous Changes (Session 29 - 2025-10-15)
- **🎨 PDF TEMPLATE CUSTOMIZATION SYSTEM** - Per-organization PDF styling with legal compliance
  - **Purpose**: Allow each organization to customize PDF appearance (colors, fonts, margins) while maintaining legal document consistency
  - **Architecture**: Two-layer system separating global code version (legal) from per-org template settings (visual)
  - **Implementation**:
    1. **Type System** (`types/core.ts`):
       - Added `pdfSettings?: PDFTemplateSettings` to Warning interface (lines 334-335)
       - Warnings now store BOTH code version AND template settings snapshot
    2. **Warning Creation** (`EnhancedWarningWizard.tsx`):
       - Lines 909-912: Stores organization's `pdfSettings` snapshot when creating warning
       - Ensures warnings regenerate with original styling years later
    3. **Data Transformer** (`pdfDataTransformer.ts`):
       - Lines 196-199: Extracts `pdfSettings` from warning or organization data
       - Priority: Stored snapshot → Org's current settings → Defaults
    4. **PDF Generation Service** (`PDFGenerationService.ts`):
       - Updated method signature: `generateWarningPDF(data, version?, settings?)` (lines 198-202)
       - Lines 380-415: Settings merge logic with defaults
       - Lines 436-452: Applies settings to page size, fonts, margins
    5. **All PDF Generation Points** (7 files updated):
       - `DeliveryCompletionStep.tsx` (lines 276-279)
       - `PDFPreviewModal.tsx` (lines 220-223)
       - `SimplePDFDownloadModal.tsx` (lines 213-216)
       - `PDFViewerModal.tsx` (lines 185-188)
       - `ProofOfDeliveryModal.tsx` (lines 280-283)
       - `PrintDeliveryGuide.tsx` (lines 150-153)
       - `PDFTemplatePreview.tsx` (lines 51-54)
    6. **SuperAdmin Components** (3 new files created):
       - `PDFTemplateManager.tsx` - Organization list, editor/preview interface
       - `PDFTemplateEditor.tsx` - Visual editor with color pickers, font selectors
       - `PDFTemplatePreview.tsx` - Real-time PDF preview with debounced regeneration
    7. **Service Layer** (`PDFTemplateService.ts` - new file):
       - Save/load template settings for organizations
       - Version history tracking
  - **Key Features**:
    - **Snapshot Pattern**: Warnings store template settings at creation time
    - **Backward Compatible**: Old warnings without settings use org's current settings
    - **Live Preview**: Real-time preview when editing (500ms debounce)
    - **Version Control**: Template history tracking with audit trail
    - **3-Parameter System**: `generateWarningPDF(data, version, settings)`
  - **Benefits**:
    - ✅ Each organization can have unique PDF branding
    - ✅ Legal compliance maintained through code versioning
    - ✅ Visual consistency guaranteed across time
    - ✅ SuperAdmin control over all organizations
    - ✅ No breaking changes (optional third parameter)
  - **Example**: ABC Corp uses blue headers, DEF Corp uses green headers, both use v1.1.0 generator
  - **Files Modified** (11 files):
    - `frontend/src/types/core.ts` - Added pdfSettings to Warning interface
    - `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` - Store settings snapshot
    - `frontend/src/utils/pdfDataTransformer.ts` - Extract pdfSettings with fallback priority
    - `frontend/src/services/PDFGenerationService.ts` - Accept and apply custom settings
    - All 7 PDF generation call sites (listed above)
  - **Files Created** (4 files):
    - `frontend/src/components/admin/PDFTemplateManager.tsx` (337 lines)
    - `frontend/src/components/admin/PDFTemplateEditor.tsx` (new)
    - `frontend/src/components/admin/PDFTemplatePreview.tsx` (396 lines)
    - `frontend/src/services/PDFTemplateService.ts` (new)
  - **Bug Fix**: Fixed `PDFTemplateManager.tsx` import path - changed `../../contexts/AuthContext` to `../../auth/AuthContext`
  - **Status**: ✅ Complete - Ready for deployment

### Previous Changes (Session 28 - 2025-10-15)
- **✨ MULTI-MANAGER EMPLOYEE ASSIGNMENT SYSTEM** - Complete migration from single-manager to multi-manager architecture
  - **Purpose**: Enable employees to be assigned to multiple managers simultaneously for matrix management structures
  - **Architecture**:
    - Migrated from `managerId?: string` to `managerIds?: string[]` array-based system
    - Maintained backward compatibility with `getManagerIds()` helper function
    - All existing data transparently migrates without breaking changes
  - **7-Phase Implementation**:
    1. **Core Types** (`types/core.ts`, `types/employee.ts`):
       - Added `managerIds?: string[]` to EmploymentDetails interface
       - Created `getManagerIds()` helper for backward compatibility
       - Added `migrateEmployeeManagerData()` helper for batch migration
    2. **Service Layer** (`EmployeeService.ts`, `ManagerService.ts`):
       - Updated `getEmployeesByManager()` to use array `.includes()` check
       - Modified `getManagerEmployeeCounts()` to count across all manager assignments
       - Updated demote/archive functions to handle manager ID arrays
    3. **Bulk Assignment Modal** (`BulkAssignManagerModal.tsx`):
       - Added **ADD mode** (preserves existing managers) and **REPLACE mode** (removes all existing)
       - Radio button selector with visual indicators (Plus/Replace icons)
       - Mode-specific confirmation messages
       - Array deduplication with `[...new Set()]` pattern
    4. **Employee Form** (`EmployeeFormModal.tsx`):
       - Converted single-select dropdown to checkbox-based multi-select
       - Manager selection counter showing `X managers selected`
       - Manager role display for each option
    5. **Table Display** (`EmployeeTableBrowser.tsx`):
       - Displays multiple managers as badge chips
       - CSV export includes all managers (semicolon-separated)
       - Sorting uses first manager in array
    6. **Manager Details Modal** (`ManagerDetailsModal.tsx`):
       - **Add employee** button adds manager to employee's managerIds array
       - **Remove button** (red UserMinus icon) removes manager from array
       - Available employees filter excludes those already assigned to this manager
    7. **Migration Helpers** (`types/employee.ts`):
       - `getManagerIds()` with comprehensive JSDoc documentation
       - Transparent conversion: `managerId: "123"` → `["123"]`
  - **Key Features**:
    - **Backward Compatible**: Old single-manager data automatically converts to array
    - **ADD Mode Default**: Bulk assignment preserves existing managers by default
    - **Visual Feedback**: Manager badges in tables, checkboxes in forms
    - **Easy Management**: Add/remove employees from Manager Details Modal
    - **Type Safety**: Full TypeScript support with optional fields
  - **Files Modified** (9 files):
    - `frontend/src/types/core.ts` - Added managerIds array to EmploymentDetails
    - `frontend/src/types/employee.ts` - Helper functions and migration utilities
    - `frontend/src/services/EmployeeService.ts` - Array-based filtering
    - `frontend/src/services/ManagerService.ts` - Multi-manager counting and updates
    - `frontend/src/components/employees/BulkAssignManagerModal.tsx` - ADD/REPLACE modes
    - `frontend/src/components/employees/EmployeeManagement.tsx` - Mode handling
    - `frontend/src/components/employees/EmployeeFormModal.tsx` - Checkbox multi-select
    - `frontend/src/components/employees/EmployeeTableBrowser.tsx` - Badge display
    - `frontend/src/components/managers/ManagerDetailsModal.tsx` - Add/remove employees
  - **Impact**:
    - ✅ Supports complex organizational structures (matrix management, cross-departmental reporting)
    - ✅ No breaking changes to existing data
    - ✅ Smooth migration path for legacy single-manager assignments
    - ✅ Enhanced flexibility for HR administrators
  - **Status**: ✅ Complete - All 7 phases implemented, ready for testing

### Previous Changes (Session 27 - 2025-10-14)
- **🐛 WARNING WIZARD DATE & AUTO-SAVE FIXES** - Fixed issue date defaulting to wrong date and removed problematic auto-save feature
  - **Problem 1**: Warning wizard Issue Date field was defaulting to October 6, 2025 instead of today's date (October 14)
  - **Root Cause**: Browser localStorage auto-save was restoring old cached form data with stale dates
  - **Solution**:
    - Fixed timezone-safe date initialization in `EnhancedWarningWizard.tsx` (lines 197-214)
    - Changed from `new Date().toISOString().split('T')[0]` (UTC-based) to local date calculation
    - **Removed auto-save feature** entirely from `IncidentDetailsForm.tsx` to prevent future data persistence issues
  - **Problem 2**: Warnings showing October 6 dates in PDFs and list views
  - **Root Cause**: `simplifyWarning()` method was temporarily converting dates to ISO strings, causing timezone shifts
  - **Solution**: Reverted to keeping dates as Date objects - Firestore handles conversion correctly
  - **Problem 3**: `disciplineRecommendation` field not saving to Firestore
  - **Root Cause**: `Warning` interface in `WarningService.ts` was missing the field definition
  - **Solution**: Added `disciplineRecommendation?: EscalationRecommendation` to Warning interface
  - **Files Modified**:
    - `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` (lines 197-214): Timezone-safe date initialization
    - `frontend/src/components/warnings/enhanced/steps/components/IncidentDetailsForm.tsx`: Removed auto-save feature completely
    - `frontend/src/services/WarningService.ts` (lines 102-104): Added missing interface fields
  - **Debug Logging Cleanup**: Removed temporary troubleshooting logs from:
    - `PDFGenerationService.ts` (removed lines 433-441, 860-871)
    - `pdfDataTransformer.ts` (removed lines 231-255, 280-287)
    - `api/index.ts` (removed lines 172-178, 235-240)
  - **Impact**:
    - ✅ Issue Date now correctly defaults to current date
    - ✅ No more localStorage interference with form data
    - ✅ PDFs show correct historical dates
    - ✅ Progressive discipline history properly tracked
  - **User Action Required**: Clear browser localStorage: `localStorage.removeItem('warningWizard_incidentDetails')`
  - **Status**: ✅ Complete - Clean codebase ready for production

### Previous Changes (Session 26 - 2025-10-14)
- **🐛 MOBILE VIEWPORT OVERFLOW FIX** - Fixed horizontal scrolling issue on all mobile dashboards
  - **Problem**: Background could scroll horizontally on mobile devices, revealing a few pixels off-screen to the right
  - **Root Cause**: Container elements using `max-w-7xl mx-auto` combined with padding classes in the same element
    - The `mx-auto` (margin-left/right auto) combined with padding pushed content beyond viewport width
    - Pattern occurred in DashboardRouter.tsx and BusinessDashboard.tsx
  - **Solution**: Separated padding and max-width into nested containers
    - **Pattern**: Outer container handles padding (`w-full px-4 sm:px-6`), inner container handles centering (`max-w-7xl mx-auto`)
    - Added CSS safeguards: `overflow-x: hidden` and `max-width: 100%` to html, body, and #root elements
  - **Files Modified**:
    - `frontend/src/components/dashboard/DashboardRouter.tsx` (lines 85-94): Split super user dashboard containers
    - `frontend/src/pages/business/BusinessDashboard.tsx` (lines 151-167, 225): Split welcome and content containers
    - `frontend/src/index.css` (lines 157-186): Added overflow-x and max-width safeguards to html, body, #root
  - **Impact**: All mobile dashboards now render perfectly within viewport with no horizontal scrolling
  - **Bundle Impact**: No change (CSS-only fix)
  - **Status**: ✅ Complete - Production build successful (18.21s), verified no TypeScript errors

### Previous Changes (Session 25 - 2025-10-14)
- **✨ FORGOT PASSWORD FUNCTIONALITY** - Complete password reset system implementation
  - **Purpose**: Allow users to reset forgotten passwords via email without admin intervention
  - **Implementation**:
    - Added `resetPassword(email: string)` function to AuthContext
    - Created professional ForgotPasswordModal component with WCAG 2.1 AA accessibility
    - Integrated "Forgot Password?" link in LoginForm (next to password label)
    - Firebase `sendPasswordResetEmail` integration for secure email delivery
  - **Key Features**:
    - Security-conscious design prevents email enumeration attacks (same success message regardless of email existence)
    - Comprehensive error handling (invalid-email, too-many-requests, rate limiting)
    - Auto-focus on email input, focus trap, keyboard navigation (Escape to close)
    - Body scroll prevention using `usePreventBodyScroll` hook
    - Standardized z-index from `constants/zIndex.ts`
    - Auto-close modal after successful email send (3 seconds)
    - Two-state UI: Form state → Success state with checkmark
  - **Security Best Practices**:
    - Email enumeration attack prevention (don't reveal if email exists)
    - Input validation (email format, required fields)
    - Rate limiting error handling
    - HTTPS-only Firebase password reset emails
  - **Files Modified**:
    - `AuthContext.tsx` (lines 79-89, 509-561, 564-574): Added `resetPassword` function
    - `LoginForm.tsx` (lines 1-7, 59-66, 120-152, 186-200): Added forgot password link and modal integration
  - **Files Created**:
    - `ForgotPasswordModal.tsx` (new component, 204 lines): Professional modal with accessibility features
  - **Bundle Impact**: +4.58 KB (298.54 KB → 303.12 KB)
  - **Status**: ✅ Complete - Live in production, requires Firebase email configuration for testing

### Previous Changes (Session 24 - 2025-10-14)
- **✅ CRITICAL: Employee Filtering for HR/Business Owners** - Fixed employee visibility when using HOD Dashboard tools
  - **Problem**: HR Managers and Business Owners only saw 1 employee instead of all 5 when using HOD Dashboard tools (warnings, counselling, absences)
  - **Root Cause**: Code checked `user.role` (object) instead of `user.role.id` (string), causing role comparison to fail
  - **Solution**:
    - `useDashboardData.ts` (lines 167-203): Extract `actualUserRoleId` from role object, check against HR/Business Owner role IDs
    - HR/Business Owners now always see ALL employees, even when viewing HOD dashboard
    - HOD Managers still only see their assigned team members (correct behavior)
  - **Files Modified**:
    - `frontend/src/hooks/dashboard/useDashboardData.ts` - Fixed employee loading logic with role object handling
    - `frontend/src/components/dashboard/HODDashboardSection.tsx` - Updated "no employees" alert logic with proper role checking
  - **Impact**: HR and Business Owners can now use HOD tools (warnings, counselling, absences) with full employee access
  - **Status**: ✅ Complete - Verified working with console logs showing all employees loading

- **✅ Team Members Modal Scrolling Fix** - Fixed non-scrollable modal in HOD Dashboard
  - **Problem**: Team Members modal opened but couldn't scroll through employee list
  - **Root Cause**: Modal had `overflow-hidden` on outer container with no height constraint on inner content div
  - **Solution**: Converted to flexbox layout with `flex flex-col`, `flex-shrink-0` header, `flex-1 min-h-0` content area
  - **Files Modified**:
    - `frontend/src/components/dashboard/HODDashboardSection.tsx` (lines 531-550) - Modal layout restructure
  - **Status**: ✅ Complete - Modal now scrolls properly

- **✅ Add Employee Crash Fix** - Fixed ManagerDetailsModal crash when adding employees
  - **Problem**: Clicking "Add Employee" caused `TypeError: Cannot read properties of undefined (reading 'firstName')`
  - **Root Cause**: Some employees have missing or undefined `profile` objects in Firestore
  - **Solution**: Added comprehensive defensive null checks in filter function, dropdown rendering, and employee list display
  - **Files Modified**:
    - `frontend/src/components/managers/ManagerDetailsModal.tsx` (lines 168-185, 418, 468-497)
  - **Status**: ✅ Complete - Add Employee feature now handles incomplete employee data gracefully

- **📚 Pagination Best Practices Verification** - Confirmed current pagination implementation follows best practices
  - **Current Implementation**:
    - Legacy devices: Previous/Next buttons with smaller page size (performance-optimized)
    - Modern devices: Load More button in cards view, full scrollable list in table view
    - Context-appropriate patterns for different use cases
  - **Verdict**: Solid best practice for HR system with 5-500 employee datasets
  - **Recommendation**: Keep current implementation, consider virtual scrolling only if exceeding 1,000+ employees

### Previous Changes (Session 23 - 2025-10-14)
- **🔒 PDF GENERATOR VERSIONING SYSTEM** - Implemented comprehensive versioning for legal compliance
  - Semantic versioning (v1.0.0, v1.1.0) ensures historical warnings regenerate identically years later
  - Frozen v1.0.0 method (old format) + Current v1.1.0 method (new format) with version routing
  - All 6 PDF regeneration points pass stored version, 100+ lines of protective comments
  - **Legal Impact**: Prevents document tampering, ensures court admissibility, maintains audit compliance
  - **Status**: ✅ Complete - Ready for production use

### Previous Changes (Session 22 - 2025-10-13)
- **CRITICAL: Manager Name in PDF Signatures** - Fixed missing manager name in PDF signature section
  - **Problem**: Manager signature section showed blank line `Manager Name: _____________________` instead of actual manager name
  - **Root Cause**: Enhanced Warning Wizard was NOT saving `issuedBy` and `issuedByName` fields to Firestore when creating warnings
  - **Solution**: Added manager information to warning creation in wizard
    - `EnhancedWarningWizard.tsx` (lines 779-781): Added `issuedBy: user?.uid` and `issuedByName: currentManagerName`
    - `pdfDataTransformer.ts` (line 148): Already configured to extract `issuedByName` from warning data
    - `PDFGenerationService.ts`: Already configured to display manager name in signatures
  - **Impact**:
    - ✅ NEW warnings (created after fix) will display manager name correctly
    - ❌ EXISTING warnings (created before fix) do NOT have this field in Firestore and will continue showing blank
  - **Files Modified**:
    - `frontend/src/components/warnings/enhanced/EnhancedWarningWizard.tsx` (lines 779-781)
    - `frontend/src/utils/pdfDataTransformer.ts` (line 148)
- **PDF Signature Layout Fixes** - Improved signature positioning and spacing in PDFs
  - **Problem**: Signatures were rendering on the bottom line of boxes instead of being properly centered
  - **Solution**:
    - Changed from centering vertically to positioning from top (5mm from top)
    - Reduced max signature height from 37mm to 35mm for better spacing
    - Increased padding from 8mm total to 16mm total (8mm each side)
    - Moved manager name and date below signature boxes with better spacing (+7mm and +11mm)
  - **Result**: Signatures now render properly centered with professional spacing throughout
  - **Files Modified**:
    - `frontend/src/services/PDFGenerationService.ts` (lines 970-1093)

### Previous Changes (Session 21 - 2025-10-10)
- **PDF A4 Formatting Fixes**: Comprehensive formatting improvements for professional A4 warning documents
  - **Previous Disciplinary Action Section**: Reduced font from 14pt to 12pt, increased padding and line spacing
  - **Consequences Section**: Removed emoji (⚠️), split heading across 2 lines to prevent cut-off, increased box height and padding
  - **Employee Rights Section**: Removed emoji (⚖️), increased box height from 85mm to 102mm, optimized line spacing from 4.5 to 5mm
  - **Spacing Improvements**: Increased spacing after Employee Rights box from 12mm to 35mm to eliminate overlap with Signatures section
  - **All sections**: Reduced heading font sizes from 14pt to 12pt for proper A4 readability
  - **Result**: Clean, professional PDFs with no emoji rendering issues, no text cut-off, proper spacing throughout
- **CRITICAL: Firestore Timestamp Date Fix**: Fixed historical warnings showing incorrect dates in PDFs
  - **Problem**: Old warnings were showing today's date (10 October 2025) instead of their original issue date in signatures and document fields
  - **Root Cause**: Firestore Timestamp objects (`{ seconds, nanoseconds }`) were not being converted to JavaScript Date objects in PrintDeliveryGuide.tsx
  - **Solution**: Added `convertTimestampToDate()` helper function that properly converts Firestore Timestamps using `new Date(timestamp.seconds * 1000)`
  - **Files Modified**:
    - `frontend/src/components/hr/PrintDeliveryGuide.tsx` (lines 146-177) - Added timestamp conversion for `issuedDate` and `incidentDate`
    - `frontend/src/services/PDFGenerationService.ts` (lines 933-1010) - Updated signature dates to use `issuedDate` parameter
  - **Impact**: Historical warnings now display their correct original dates, ensuring legal compliance and accurate record-keeping
- **Unified PDF Data Transformer**: Created centralized data transformation utility for consistent PDF generation across all components
  - **Created**: `frontend/src/utils/pdfDataTransformer.ts` - Single source of truth for transforming warning data to PDF format
  - **Security-critical**: Ensures consistent data structure across all PDF generation methods (prevents data leakage or inconsistencies)
  - **Updated components**:
    - `PrintDeliveryGuide.tsx` - Uses unified transformer for on-demand PDF generation
    - `PDFPreviewModal.tsx` - Uses unified transformer for preview generation
    - `SimplePDFDownloadModal.tsx` - Uses unified transformer for simple downloads
  - **Benefits**: Eliminates duplicate transformation logic, ensures all PDFs have identical data structure, easier to maintain and debug
- **PDFPreviewModal Data Structure Fix**: Fixed console errors when viewing PDFs in Review Warnings modal
  - **Error**: `Uncaught TypeError: Cannot read properties of undefined (reading 'replace')` at PDFPreviewModal.tsx:177
  - **Root Cause**: After unified transformer migration, `extractedData.category` changed from object `{name: string}` to plain string
  - **Fixed locations**:
    - Line 177: Changed `extractedData.category.name.replace()` → `(extractedData.category || 'Warning').replace()`
    - Lines 194-196: Changed `extractedData.incident.description` → `extractedData.description`
    - Lines 459, 572: Changed `extractedData.category.name` → `extractedData.category`
    - Lines 430, 626: Changed `extractedData.incident.description` → `extractedData.description`
  - **Result**: PDF preview modal now works correctly with unified transformer data structure
- **PDF Signature Aspect Ratio Preservation**: Fixed signature distortion in generated PDFs
  - **Problem**: Signatures appeared stretched/distorted - dimensions didn't match original captured signatures
  - **Root Cause**: Both manager and employee signatures used hardcoded height (15mm) regardless of original proportions
  - **Solution**: Implemented proper aspect ratio preservation algorithm
    - Load original image dimensions from base64 signature data using `Image()` object
    - Calculate aspect ratio: `width / height`
    - Scale to fit max width, check if height exceeds max height
    - If height exceeds max, scale based on height instead
    - Center signature horizontally within box for better presentation
  - **Files Modified**:
    - `PDFGenerationService.ts` (lines 966-997): Manager signature aspect ratio preservation
    - `PDFGenerationService.ts` (lines 1011-1042): Employee signature aspect ratio preservation
  - **Result**: Signatures now maintain original proportions and are professionally centered in PDFs

### Sessions 17-20 Summary (2025-10-07 to 2025-10-08)
- **Session 20**: Modal accessibility completion (WCAG 2.1 AA), full audit of all 21+ modals
- **Session 19**: Print & hand delivery workflow fixes, on-demand PDF generation, dashboard counter refresh
- **Session 18**: LRA-compliant employee rights PDF section, email delivery enhancements, timestamp handling
- **Session 17**: Appeal report system, signature timestamps, sequential signature capture, mobile CSS fixes

### Previous Sessions Summary (5-16)
- Sessions 12-16: Warning wizard finalization, mobile optimizations, multi-language scripts, witness signatures, accessibility
- Sessions 8-11: Console security cleanup, bulk employee-manager assignment, timestamp security, mobile scrolling fixes
- Sessions 5-7: HR dashboard rewrite, SuperAdmin redesign, multi-role dashboard selector, organization wizard

**Full details**: See `SESSION_HISTORY.md`

---

*System is **enterprise-ready** with A-grade security, production monitoring, 2,700+ organization scalability, complete progressive enhancement for 2012-2025 device compatibility, **unified professional design system** across all components, **WCAG AA accessibility compliance**, **versioned PDF generation for legal compliance**, **per-organization PDF template customization**, **1000x storage reduction through centralized template version management**, **fully editable PDF text content with zero hardcoded fallbacks**, and **SA-optimized employee CSV import with automatic phone number formatting**.*

*Last Updated: 2025-10-16 - Session 33: PDF Template Version Storage Optimization Documentation*
