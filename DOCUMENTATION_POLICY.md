# Documentation Policy & Maintenance System

**Purpose**: Prevent CLAUDE.md from growing uncontrollably while maintaining comprehensive documentation.

---

## 📏 Size Limits & Structure

### CLAUDE.md - Maximum 500 Lines

**Purpose**: Essential guidance for Claude Code sessions (primary reference)

**Mandatory Sections** (never remove):
1. **Quick Start** (40 lines) - Commands, system status
2. **Architecture Summary** (20 lines) - Tech stack overview
3. **Development Workflow** (30 lines) - Testing, builds, git rules
4. **Critical Guidelines** (50 lines) - NEVER DO / ALWAYS DO rules
5. **Firebase Regions** (30 lines) - us-central1 vs us-east1 deployment
6. **PDF Systems** (30 lines) - Quick reference + link to PDF_SYSTEM_ARCHITECTURE.md
7. **Reference Documentation** (40 lines) - Links to all other docs
8. **Current Focus** (80 lines) - Pending tasks, system state
9. **Latest Updates** (100 lines) - ONLY current session summary
10. **Previous Sessions** (50 lines) - Brief summaries with links to RECENT_UPDATES.md

**Target Size**: 400-470 lines

---

## 🔄 Session Update Rotation System

### When Adding a New Session

**Step 1: Check Current Size**
- If CLAUDE.md > 450 lines BEFORE adding new session → Trigger refactor
- Run: `wc -l CLAUDE.md` to check line count

**Step 2: Move Previous Session**
- Move current session from CLAUDE.md → RECENT_UPDATES.md (top of file)
- Keep only 1-paragraph summary in CLAUDE.md "Previous Sessions" section

**Step 3: Add New Session**
- Add new session to "Latest Updates" section (max 100 lines)
- Include: Purpose, Implementation highlights, Key features, Status

**Step 4: Archive Old Sessions**
- RECENT_UPDATES.md keeps last 10 sessions (Sessions N-10 to N)
- Move sessions older than 10 → SESSION_HISTORY.md

---

## 📂 Documentation File Hierarchy

### Tier 1: Primary Reference (always check first)
- **CLAUDE.md** (500 lines max) - Essential guidance, current session only
- **QUICK_REFERENCE.md** - File locations catalog (alphabetical index)

### Tier 2: Specialized Systems (deep technical details)
- **PDF_SYSTEM_ARCHITECTURE.md** - All 3 PDF systems (versioning, customization, storage)
- **DATABASE_SHARDING_ARCHITECTURE.md** - Sharding implementation
- **SECURITY_AUDIT_REPORT.md** - A-grade security framework
- **TESTING_STRATEGY.md** - Testing framework

### Tier 3: Design & UI
- **V2_DESIGN_PRINCIPLES.md** - Visual design language
- **MODAL_DESIGN_STANDARDS.md** - Modal patterns
- **MODAL_USAGE_GUIDELINES.md** - Complete modal guide

### Tier 4: Development History (chronological archives)
- **RECENT_UPDATES.md** - Last 10 sessions (Sessions N-10 to N)
- **SESSION_HISTORY.md** - Archived sessions (Sessions 5 to N-11)
- **FEATURE_IMPLEMENTATIONS.md** - Completed major features
- **CLAUDE_DEVELOPMENT_HISTORY.md** - Historical context

---

## ✂️ Content Consolidation Rules

### Important Files Section

**❌ OLD APPROACH** (68 files listed - too verbose):
```markdown
### Core Architecture
- `frontend/src/types/core.ts` - Core type definitions...
- `frontend/src/types/employee.ts` - Employee types...
- `frontend/src/types/billing.ts` - Billing types...
[65 more files...]
```

**✅ NEW APPROACH** (category summary):
```markdown
### Important Files

**Core Systems**:
- Types: `types/core.ts`, `types/employee.ts`, `types/billing.ts`
- Services: `services/` directory - Business logic and Firebase integration
- Utils: `utils/saLocale.ts`, `utils/pdfDataTransformer.ts`

**Design System**: See `QUICK_REFERENCE.md` for complete file catalog
**PDF Systems**: See `PDF_SYSTEM_ARCHITECTURE.md` for all PDF-related files
```

### PDF Systems Section

**❌ OLD APPROACH** (514 lines in CLAUDE.md):
- Full versioning system documentation
- Full customization system documentation
- Full storage optimization documentation

**✅ NEW APPROACH** (30 lines reference):
```markdown
## PDF Systems - Quick Reference

The system has 3 layers working together:

1. **PDF Generator Versioning** (v1.0.0 → v1.1.0)
   - Ensures legal compliance through frozen code versions
   - CRITICAL: Never modify frozen versions (court admissibility)

2. **PDF Template Customization**
   - Per-organization visual styling (colors, fonts, margins)
   - Maintains legal format while allowing branding

3. **Template Version Storage**
   - 1000x storage reduction (5 bytes vs 5KB per warning)
   - Centralized template management

**Complete Documentation**: See `PDF_SYSTEM_ARCHITECTURE.md`
```

---

## 🚨 Automatic Refactor Triggers

### When to Refactor CLAUDE.md

**Trigger 1: Size Exceeds 500 Lines**
- Action: Move oldest session to RECENT_UPDATES.md
- Action: Compress "Important Files" section if needed
- Action: Remove redundant examples

**Trigger 2: Before Adding New Session**
- Check: `wc -l CLAUDE.md`
- If > 450 lines: Move previous session first
- Then add new session

**Trigger 3: New Major System Added**
- Action: Create dedicated doc (like PDF_SYSTEM_ARCHITECTURE.md)
- Action: Replace detailed section with reference link
- Keep only quick reference in CLAUDE.md

---

## 📝 Session Update Template

### Format for Latest Updates Section (100 lines max)

```markdown
## 🔧 Latest Updates (Session N)

**See `RECENT_UPDATES.md` for Sessions N-10 to N-1**

### Current Session (Session N - YYYY-MM-DD)
- **[EMOJI] FEATURE NAME** - One-line description
  - **Purpose**: Why this was needed
  - **Key Changes**:
    - 3-5 bullet points max
    - Focus on what changed, not how
  - **Files Modified**: Count only (e.g., "5 files")
  - **Status**: ✅ Complete / ⚠️ In Progress / 🔜 Pending

### Previous Session Quick Reference
- **Session N-1**: Feature name - See RECENT_UPDATES.md
- **Session N-2**: Feature name - See RECENT_UPDATES.md
[Max 5 previous sessions listed]

**Full History**: See `RECENT_UPDATES.md` and `SESSION_HISTORY.md`
```

---

## 🔧 Maintenance Commands

### Check Documentation Health

```bash
# Check CLAUDE.md size
wc -l CLAUDE.md
# Target: 400-470 lines (max 500)

# Check if refactor needed
if [ $(wc -l < CLAUDE.md) -gt 450 ]; then
  echo "⚠️  CLAUDE.md approaching size limit - refactor before next session"
fi

# Find all markdown files
find . -name "*.md" -not -path "./node_modules/*" | wc -l
```

### Refactor Checklist

When CLAUDE.md exceeds 450 lines:

- [ ] Move current session to RECENT_UPDATES.md (top)
- [ ] Update "Latest Updates" to only newest session
- [ ] Compress "Previous Sessions" to 1-line summaries
- [ ] Check "Important Files" - consolidate if > 50 lines
- [ ] Verify all external doc links work
- [ ] Update "Last Updated" date at bottom
- [ ] Verify final size < 500 lines

---

## 📋 Quick Reference System

### QUICK_REFERENCE.md Structure

**Purpose**: Alphabetical index of all important files

**Format**:
```markdown
## Core Architecture

- **`frontend/src/api/index.ts`** - API layer, handles pdfTemplateVersion passthrough
- **`frontend/src/types/core.ts`** - Core types (3-color branding, multi-manager)
- **`frontend/src/types/employee.ts`** - Employee types, getManagerIds() helper

[Alphabetical listing continues...]
```

---

## 🎯 Success Metrics

### Well-Maintained Documentation

✅ CLAUDE.md stays under 500 lines
✅ New sessions added without size bloat
✅ All specialized systems in dedicated files
✅ Easy to find information (< 30 seconds)
✅ No duplicate content across files
✅ Clear hierarchy (Tier 1 → Tier 4)

### Warning Signs

⚠️ CLAUDE.md > 500 lines
⚠️ Same content in multiple files
⚠️ "Important Files" section > 50 lines
⚠️ More than 3 session summaries in "Latest Updates"
⚠️ Dead links to moved content

---

## 🔄 Quarterly Review

**Every 3 months** (or every 30 sessions):

1. **Consolidate SESSION_HISTORY.md**
   - Group old sessions by quarter
   - Remove redundant implementation details
   - Keep only: Session number, date, feature name, status

2. **Update FEATURE_IMPLEMENTATIONS.md**
   - Add completed major features from last quarter
   - Remove outdated implementation notes

3. **Review Specialized Docs**
   - PDF_SYSTEM_ARCHITECTURE.md - Still accurate?
   - DATABASE_SHARDING_ARCHITECTURE.md - Any changes?
   - Add new specialized docs if needed

4. **Verify Links**
   - Check all cross-references still work
   - Update any moved/renamed files

---

## 📖 Policy Compliance

**All future Claude Code sessions must**:

1. Check CLAUDE.md size before adding new session content
2. Move previous session to RECENT_UPDATES.md if size > 450 lines
3. Use condensed format for session updates (max 100 lines)
4. Create dedicated docs for new major systems (>300 lines)
5. Update cross-references when moving content
6. Follow the session update template exactly

**This policy ensures CLAUDE.md remains a concise, scannable reference guide while preserving all historical details in appropriate archives.**

---

*Last Updated: 2025-10-23 - Initial policy creation (Session 35)*
*Target CLAUDE.md Size: 400-470 lines (max 500)*
*Current CLAUDE.md Size: 1,299 lines → Refactor in progress*
