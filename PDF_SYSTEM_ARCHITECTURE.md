# PDF System Architecture

Complete documentation for the three-layer PDF generation and customization system.

---

## Table of Contents

1. [PDF Generator Versioning System](#pdf-generator-versioning-system) - Legal compliance through semantic versioning
2. [PDF Template Customization System](#pdf-template-customization-system) - Per-organization visual styling
3. [PDF Template Version Storage Optimization](#pdf-template-version-storage-optimization) - Database efficiency (1000x reduction)

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

*This document provides complete technical reference for all PDF system layers. For quick guidance, see the PDF sections in CLAUDE.md.*

*Last Updated: 2025-10-23 - Extracted from CLAUDE.md for better organization*
