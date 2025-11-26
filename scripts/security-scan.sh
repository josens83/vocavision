#!/bin/bash

# ============================================
# Security Vulnerability Scan Script
# ============================================
# Scans for security vulnerabilities in dependencies
# and code using npm audit and additional tools.
# ============================================

set -e

echo "🔒 VocaVision - Security Vulnerability Scan"
echo "============================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCAN_FAILED=0

# ============================================
# Backend Dependency Scan
# ============================================

echo "📦 Scanning Backend Dependencies..."
echo "============================================"

cd backend

# Run npm audit
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✓ Backend dependencies: No vulnerabilities found${NC}"
else
    echo -e "${RED}✗ Backend dependencies: Vulnerabilities detected${NC}"
    SCAN_FAILED=1

    # Show fix suggestions
    echo ""
    echo "💡 Run 'npm audit fix' to automatically fix issues"
    echo "   For breaking changes: 'npm audit fix --force'"
fi

cd ..

echo ""

# ============================================
# Frontend Dependency Scan
# ============================================

echo "📦 Scanning Frontend Dependencies..."
echo "============================================"

cd web

if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✓ Frontend dependencies: No vulnerabilities found${NC}"
else
    echo -e "${RED}✗ Frontend dependencies: Vulnerabilities detected${NC}"
    SCAN_FAILED=1

    echo ""
    echo "💡 Run 'npm audit fix' to automatically fix issues"
fi

cd ..

echo ""

# ============================================
# Check for Hardcoded Secrets
# ============================================

echo "🔑 Checking for Hardcoded Secrets..."
echo "============================================"

# Check for common secret patterns
SECRETS_FOUND=0

# API Keys
if grep -r "api_key\s*=\s*['\"][a-zA-Z0-9]" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules .; then
    echo -e "${RED}✗ Potential API keys found in code${NC}"
    SECRETS_FOUND=1
fi

# Passwords
if grep -r "password\s*=\s*['\"][^'\"]*['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git .; then
    echo -e "${YELLOW}⚠️  Potential passwords found (may be test data)${NC}"
fi

# AWS Keys
if grep -r "AKIA[0-9A-Z]{16}" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules .; then
    echo -e "${RED}✗ AWS access keys found in code${NC}"
    SECRETS_FOUND=1
    SCAN_FAILED=1
fi

# Private Keys
if grep -r "BEGIN.*PRIVATE KEY" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules .; then
    echo -e "${RED}✗ Private keys found in code${NC}"
    SECRETS_FOUND=1
    SCAN_FAILED=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi

echo ""

# ============================================
# Check Environment Files
# ============================================

echo "📄 Checking Environment Files..."
echo "============================================"

# Check if .env files are in .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .env files are in .gitignore${NC}"
else
    echo -e "${RED}✗ .env files are NOT in .gitignore${NC}"
    SCAN_FAILED=1
fi

# Check if .env files are committed
if git ls-files | grep -q "\.env$"; then
    echo -e "${RED}✗ .env files are committed to git${NC}"
    echo -e "   ${YELLOW}Please remove them: git rm --cached .env${NC}"
    SCAN_FAILED=1
else
    echo -e "${GREEN}✓ No .env files committed${NC}"
fi

echo ""

# ============================================
# Check for Sensitive Data Exposure
# ============================================

echo "🔍 Checking for Sensitive Data Exposure..."
echo "============================================"

# Check for console.log with sensitive data
if grep -r "console\.log.*password" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules .; then
    echo -e "${YELLOW}⚠️  console.log with 'password' found${NC}"
fi

if grep -r "console\.log.*token" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules .; then
    echo -e "${YELLOW}⚠️  console.log with 'token' found${NC}"
fi

echo ""

# ============================================
# Security Best Practices Check
# ============================================

echo "✅ Security Best Practices..."
echo "============================================"

# Check for helmet usage
if grep -q "helmet()" backend/src/index.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Helmet.js is configured${NC}"
else
    echo -e "${YELLOW}⚠️  Helmet.js not found in backend${NC}"
fi

# Check for CORS configuration
if grep -q "cors(" backend/src/index.ts 2>/dev/null; then
    echo -e "${GREEN}✓ CORS is configured${NC}"
else
    echo -e "${RED}✗ CORS configuration not found${NC}"
fi

# Check for rate limiting
if grep -q "rateLimit" backend/src/index.ts 2>/dev/null || grep -q "rateLimiter" backend/src/index.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Rate limiting is configured${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limiting not clearly configured${NC}"
fi

# Check for JWT usage
if grep -q "jwt" backend/package.json 2>/dev/null || grep -q "jose" backend/package.json 2>/dev/null; then
    echo -e "${GREEN}✓ JWT authentication is used${NC}"
else
    echo -e "${RED}✗ JWT library not found${NC}"
fi

echo ""

# ============================================
# Docker Security Check
# ============================================

if [ -f "Dockerfile" ] || [ -f "backend/Dockerfile" ] || [ -f "web/Dockerfile" ]; then
    echo "🐳 Docker Security Check..."
    echo "============================================"

    # Check for running as non-root
    if grep -q "USER" Dockerfile backend/Dockerfile web/Dockerfile 2>/dev/null; then
        echo -e "${GREEN}✓ Non-root user configured in Dockerfile${NC}"
    else
        echo -e "${YELLOW}⚠️  Consider adding non-root USER in Dockerfile${NC}"
    fi

    # Check for .dockerignore
    if [ -f ".dockerignore" ]; then
        echo -e "${GREEN}✓ .dockerignore file exists${NC}"

        if grep -q "\.env" .dockerignore 2>/dev/null; then
            echo -e "${GREEN}✓ .env files excluded in .dockerignore${NC}"
        else
            echo -e "${YELLOW}⚠️  Add .env to .dockerignore${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  .dockerignore file not found${NC}"
    fi

    echo ""
fi

# ============================================
# Summary
# ============================================

echo "============================================"
echo "📊 Security Scan Summary"
echo "============================================"
echo ""

if [ $SCAN_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Security scan PASSED${NC}"
    echo ""
    echo "All security checks completed successfully."
    echo "Project is ready for deployment."
    echo ""
    exit 0
else
    echo -e "${RED}❌ Security scan FAILED${NC}"
    echo ""
    echo "Some security issues were detected."
    echo "Please review and fix the issues above before deploying."
    echo ""
    exit 1
fi
