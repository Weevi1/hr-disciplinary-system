#!/bin/bash

# HR Disciplinary System - Quick Health Check
# Run this script to test all major components

echo "╔════════════════════════════════════════════════════╗"
echo "║     HR DISCIPLINARY SYSTEM - QUICK TEST SUITE      ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
WARNINGS=0

# Function to test endpoint
test_endpoint() {
    local route=$1
    local expected=$2
    local description=$3

    response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${route}")

    if [ "$response" -eq "$expected" ] || [ "$response" -lt 400 ]; then
        echo -e "${GREEN}✓${NC} $description (${route}): HTTP $response"
        ((PASSED++))
    elif [ "$response" -ge 400 ] && [ "$response" -lt 500 ]; then
        echo -e "${YELLOW}⚠${NC} $description (${route}): HTTP $response (Client error)"
        ((WARNINGS++))
    else
        echo -e "${RED}✗${NC} $description (${route}): HTTP $response"
        ((FAILED++))
    fi
}

# Function to test HTML content
test_html_content() {
    local content=$(curl -s "${BASE_URL}")

    if echo "$content" | grep -q '<div id="root">'; then
        echo -e "${GREEN}✓${NC} React root element found"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} React root element missing"
        ((FAILED++))
    fi

    if echo "$content" | grep -q 'vite'; then
        echo -e "${GREEN}✓${NC} Vite development server detected"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Vite not detected"
        ((WARNINGS++))
    fi

    if echo "$content" | grep -q 'viewport'; then
        echo -e "${GREEN}✓${NC} Mobile viewport configured"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Mobile viewport not configured"
        ((WARNINGS++))
    fi
}

# Function to test performance
test_performance() {
    echo -e "\n📊 Performance Tests:"

    start=$(date +%s%N)
    curl -s "${BASE_URL}" > /dev/null
    end=$(date +%s%N)
    response_time=$(( (end - start) / 1000000 ))

    if [ "$response_time" -lt 500 ]; then
        echo -e "${GREEN}✓${NC} Fast response time: ${response_time}ms"
        ((PASSED++))
    elif [ "$response_time" -lt 1000 ]; then
        echo -e "${YELLOW}⚠${NC} Moderate response time: ${response_time}ms"
        ((WARNINGS++))
    else
        echo -e "${RED}✗${NC} Slow response time: ${response_time}ms"
        ((FAILED++))
    fi
}

# Function to check processes
test_processes() {
    echo -e "\n🔧 Process Checks:"

    if lsof -i:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Dev server running on port 3000"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} No process on port 3000"
        ((FAILED++))
    fi

    node_process=$(ps aux | grep -E "node.*vite|vite.*dev" | grep -v grep | wc -l)
    if [ "$node_process" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Vite process running"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Vite process not detected"
        ((WARNINGS++))
    fi
}

# Function to check file system
test_filesystem() {
    echo -e "\n📁 File System Checks:"

    if [ -f "package.json" ]; then
        echo -e "${GREEN}✓${NC} package.json found"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} package.json missing"
        ((FAILED++))
    fi

    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} node_modules directory exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} node_modules missing"
        ((FAILED++))
    fi

    if [ -d "src" ]; then
        component_count=$(find src -name "*.tsx" -o -name "*.jsx" | wc -l)
        echo -e "${GREEN}✓${NC} React components found: $component_count files"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} src directory missing"
        ((FAILED++))
    fi
}

# Run all tests
echo "🌐 Testing Endpoints:"
test_endpoint "/" 200 "Home page"
test_endpoint "/login" 200 "Login page"
test_endpoint "/dashboard" 200 "Dashboard"
test_endpoint "/employees" 200 "Employees"
test_endpoint "/warnings" 200 "Warnings"

echo -e "\n📄 HTML Content Tests:"
test_html_content

test_performance
test_processes
test_filesystem

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Passed:${NC} $PASSED"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "${RED}✗ Failed:${NC} $FAILED"

TOTAL=$((PASSED + WARNINGS + FAILED))
if [ $TOTAL -gt 0 ]; then
    SCORE=$((PASSED * 100 / TOTAL))
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎯 Health Score: ${SCORE}%"

    if [ $SCORE -eq 100 ]; then
        echo -e "${GREEN}🎉 Perfect! All systems operational!${NC}"
    elif [ $SCORE -ge 80 ]; then
        echo -e "${GREEN}👍 Good health! Minor issues only.${NC}"
    elif [ $SCORE -ge 60 ]; then
        echo -e "${YELLOW}⚠️ Moderate health. Review warnings.${NC}"
    else
        echo -e "${RED}🚨 Critical issues detected!${NC}"
    fi
fi

echo ""

# Recommendations
if [ $FAILED -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "📝 RECOMMENDATIONS:"
    if ! lsof -i:3000 > /dev/null 2>&1; then
        echo "  • Start dev server: npm run dev"
    fi
    if [ ! -d "node_modules" ]; then
        echo "  • Install dependencies: npm install"
    fi
    echo ""
fi