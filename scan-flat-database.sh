#!/bin/bash

# Database Sharding Validator Script
# Scans codebase for flat database usage patterns

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           DATABASE SHARDING VALIDATION SCAN                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Directories to scan
SCAN_DIR="frontend/src"

# Temporary files for results
FLAT_VIOLATIONS="/tmp/flat_violations.txt"
SHARDED_CORRECT="/tmp/sharded_correct.txt"
> "$FLAT_VIOLATIONS"
> "$SHARDED_CORRECT"

echo -e "${BLUE}🔍 Scanning for flat database patterns...${NC}"
echo ""

# Pattern 1: Direct collection references (BAD)
echo "1. Checking for direct collection references..."
grep -rn "collection(['\"]employees['\"])" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*Reseller*" --exclude="*SuperUser*" >> "$FLAT_VIOLATIONS" 2>/dev/null
grep -rn "collection(['\"]warnings['\"])" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*Reseller*" --exclude="*SuperUser*" >> "$FLAT_VIOLATIONS" 2>/dev/null
grep -rn "collection(['\"]meetings['\"])" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*Reseller*" --exclude="*SuperUser*" >> "$FLAT_VIOLATIONS" 2>/dev/null
grep -rn "collection(['\"]reports['\"])" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*Reseller*" --exclude="*SuperUser*" >> "$FLAT_VIOLATIONS" 2>/dev/null

# Pattern 2: doc() with flat collections (BAD)
echo "2. Checking for doc() with flat collections..."
grep -rn "doc(.*['\"]employees['\"]" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*Reseller*" --exclude="*SuperUser*" >> "$FLAT_VIOLATIONS" 2>/dev/null
grep -rn "doc(.*['\"]warnings['\"]" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*Reseller*" --exclude="*SuperUser*" >> "$FLAT_VIOLATIONS" 2>/dev/null

# Pattern 3: Path strings without organizations (BAD)
echo "3. Checking for path strings without organizations..."
grep -rn "['\"]\/employees\/" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*migration*" >> "$FLAT_VIOLATIONS" 2>/dev/null
grep -rn "['\"]\/warnings\/" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" --exclude="*migration*" >> "$FLAT_VIOLATIONS" 2>/dev/null

# Check for correct sharded patterns (GOOD)
echo "4. Checking for correct sharded patterns..."
grep -rn "organizations.*employees" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" >> "$SHARDED_CORRECT" 2>/dev/null
grep -rn "organizations.*warnings" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" >> "$SHARDED_CORRECT" 2>/dev/null
grep -rn "ShardedDataService" "$SCAN_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir="node_modules" >> "$SHARDED_CORRECT" 2>/dev/null

# Count results
FLAT_COUNT=$(wc -l < "$FLAT_VIOLATIONS")
SHARDED_COUNT=$(wc -l < "$SHARDED_CORRECT")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 SCAN RESULTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FLAT_COUNT" -gt 0 ]; then
    echo -e "${RED}❌ Found $FLAT_COUNT potential flat database violations:${NC}"
    echo ""
    head -20 "$FLAT_VIOLATIONS" | while IFS= read -r line; do
        echo "  $line"
    done
    if [ "$FLAT_COUNT" -gt 20 ]; then
        echo "  ... and $((FLAT_COUNT - 20)) more"
    fi
else
    echo -e "${GREEN}✅ No flat database violations found!${NC}"
fi

echo ""
echo -e "${GREEN}✅ Found $SHARDED_COUNT correct sharded database usages${NC}"

# Check specific files
echo ""
echo -e "${BLUE}🎯 Checking allowed exceptions:${NC}"

# Check for reseller and superuser services (ALLOWED to use flat)
if [ -f "$SCAN_DIR/services/ResellerService.ts" ]; then
    echo -e "${GREEN}✓${NC} ResellerService.ts exists (allowed to use flat structure)"
fi

if [ -f "$SCAN_DIR/services/SuperUserService.ts" ]; then
    echo -e "${GREEN}✓${NC} SuperUserService.ts exists (allowed to use flat structure)"
fi

# Check Firestore rules
echo ""
echo -e "${BLUE}🔐 Checking Firestore rules:${NC}"
if [ -f "config/firestore.rules" ]; then
    if grep -q "organizations/{orgId}/employees" "config/firestore.rules"; then
        echo -e "${GREEN}✓${NC} Firestore rules use sharded structure"
    else
        echo -e "${RED}✗${NC} Firestore rules missing sharded structure"
    fi

    if grep -q "match /employees/{" "config/firestore.rules"; then
        echo -e "${RED}✗${NC} Firestore rules contain flat employee rules"
    else
        echo -e "${GREEN}✓${NC} No flat employee rules in Firestore"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Final summary
if [ "$FLAT_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 PASSED: Database sharding properly implemented!${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Review flat database usage in listed files${NC}"
    echo -e "${YELLOW}   Exception: Reseller and SuperUser services can use flat structure${NC}"
fi

echo ""
echo "To run Playwright tests: npx playwright test src/e2e/database-sharding-validation.spec.ts"
echo ""

# Cleanup
rm -f "$FLAT_VIOLATIONS" "$SHARDED_CORRECT"