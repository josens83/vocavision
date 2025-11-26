#!/bin/bash

# ============================================
# Environment Variables Validation Script
# ============================================
# Validates that all required environment variables
# are set before deployment or startup.
# ============================================

set -e

echo "🔍 VocaVision - Environment Variables Validation"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
REQUIRED_MISSING=0
OPTIONAL_MISSING=0
REQUIRED_FOUND=0
OPTIONAL_FOUND=0

# Function to check required variable
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    local description=$2

    if [ -z "$var_value" ]; then
        echo -e "${RED}✗${NC} $var_name - MISSING (Required)"
        echo -e "   ${YELLOW}Description:${NC} $description"
        ((REQUIRED_MISSING++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $var_name - OK"
        ((REQUIRED_FOUND++))
        return 0
    fi
}

# Function to check optional variable
check_optional() {
    local var_name=$1
    local var_value=${!var_name}
    local description=$2

    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}○${NC} $var_name - Not set (Optional)"
        echo -e "   ${BLUE}Description:${NC} $description"
        ((OPTIONAL_MISSING++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $var_name - OK"
        ((OPTIONAL_FOUND++))
        return 0
    fi
}

# Load environment variables
if [ -f ".env" ]; then
    echo "Loading .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo ""
elif [ -f "backend/.env" ]; then
    echo "Loading backend/.env file..."
    export $(cat backend/.env | grep -v '^#' | xargs)
    echo ""
else
    echo -e "${YELLOW}⚠️  No .env file found. Using system environment variables.${NC}"
    echo ""
fi

# ============================================
# Critical Variables (Deployment Blockers)
# ============================================

echo "📋 Critical Variables (Required for Production)"
echo "================================================"

check_required "DATABASE_URL" "PostgreSQL connection string"
check_required "JWT_SECRET" "JWT signing secret (min 32 characters)"
check_required "PORT" "Backend server port"
check_required "NODE_ENV" "Environment (development/production)"

# Validate JWT_SECRET length
if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}   ⚠️  JWT_SECRET is too short (${#JWT_SECRET} chars). Minimum 32 characters required.${NC}"
    ((REQUIRED_MISSING++))
fi

echo ""

# ============================================
# Backend Optional Variables
# ============================================

echo "🔧 Backend Optional Variables"
echo "================================================"

check_optional "CORS_ORIGIN" "CORS allowed origin (default: http://localhost:3000)"
check_optional "RATE_LIMIT_WINDOW_MS" "Rate limit window in milliseconds"
check_optional "RATE_LIMIT_MAX_REQUESTS" "Max requests per window"

echo ""

# ============================================
# Database & Caching
# ============================================

echo "💾 Database & Caching"
echo "================================================"

check_optional "REDIS_URL" "Redis connection string for caching"
check_optional "DATABASE_POOL_SIZE" "Database connection pool size"

echo ""

# ============================================
# Authentication & Security
# ============================================

echo "🔐 Authentication & Security"
echo "================================================"

check_required "JWT_EXPIRES_IN" "JWT token expiration time (e.g., 7d)"

echo ""

# ============================================
# External Services
# ============================================

echo "🌐 External Services"
echo "================================================"

# OpenAI
check_optional "OPENAI_API_KEY" "OpenAI API key for AI features"

# Cloudinary
check_optional "CLOUDINARY_CLOUD_NAME" "Cloudinary cloud name"
check_optional "CLOUDINARY_API_KEY" "Cloudinary API key"
check_optional "CLOUDINARY_API_SECRET" "Cloudinary API secret"

# Stripe
check_optional "STRIPE_SECRET_KEY" "Stripe secret key for payments"
check_optional "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret"
check_optional "STRIPE_PRICE_ID_MONTHLY" "Stripe monthly price ID"
check_optional "STRIPE_PRICE_ID_YEARLY" "Stripe yearly price ID"

echo ""

# ============================================
# Monitoring & Analytics
# ============================================

echo "📊 Monitoring & Analytics"
echo "================================================"

# Sentry
check_optional "SENTRY_DSN" "Sentry DSN for error tracking"
check_optional "NEXT_PUBLIC_SENTRY_DSN" "Sentry DSN (client-side)"

# Google Analytics
check_optional "NEXT_PUBLIC_GA_MEASUREMENT_ID" "Google Analytics measurement ID"

# Mixpanel
check_optional "NEXT_PUBLIC_MIXPANEL_TOKEN" "Mixpanel project token"

echo ""

# ============================================
# Email Service
# ============================================

echo "📧 Email Service"
echo "================================================"

check_optional "EMAIL_FROM" "Default 'from' email address"

# Check for at least one email provider
has_email_provider=false

if [ -n "$SENDGRID_API_KEY" ]; then
    check_optional "SENDGRID_API_KEY" "SendGrid API key"
    has_email_provider=true
fi

if [ -n "$AWS_SES_REGION" ]; then
    check_optional "AWS_SES_REGION" "AWS SES region"
    has_email_provider=true
fi

if [ -n "$SMTP_HOST" ]; then
    check_optional "SMTP_HOST" "SMTP server host"
    check_optional "SMTP_PORT" "SMTP server port"
    check_optional "SMTP_USER" "SMTP username"
    check_optional "SMTP_PASSWORD" "SMTP password"
    has_email_provider=true
fi

if [ "$has_email_provider" = false ]; then
    echo -e "${YELLOW}⚠️  No email provider configured. Emails will be logged to console.${NC}"
fi

echo ""

# ============================================
# Frontend Variables
# ============================================

echo "🎨 Frontend Variables"
echo "================================================"

check_required "NEXT_PUBLIC_API_URL" "Backend API URL"
check_optional "NEXT_PUBLIC_APP_URL" "Frontend app URL"
check_optional "NEXT_PUBLIC_CDN_PROVIDER" "CDN provider (cloudinary/unsplash/custom/local)"

echo ""

# ============================================
# PWA & Push Notifications
# ============================================

echo "📱 PWA & Push Notifications"
echo "================================================"

check_optional "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "VAPID public key for push notifications"
check_optional "VAPID_PRIVATE_KEY" "VAPID private key for push notifications"

echo ""

# ============================================
# Summary
# ============================================

echo "================================================"
echo "📊 Validation Summary"
echo "================================================"
echo ""
echo -e "Required Variables:"
echo -e "  ${GREEN}✓ Found:${NC} $REQUIRED_FOUND"
echo -e "  ${RED}✗ Missing:${NC} $REQUIRED_MISSING"
echo ""
echo -e "Optional Variables:"
echo -e "  ${GREEN}✓ Found:${NC} $OPTIONAL_FOUND"
echo -e "  ${YELLOW}○ Not set:${NC} $OPTIONAL_MISSING"
echo ""

# ============================================
# Exit Code
# ============================================

if [ $REQUIRED_MISSING -gt 0 ]; then
    echo -e "${RED}❌ Validation FAILED${NC}"
    echo -e "   $REQUIRED_MISSING required variable(s) are missing."
    echo -e "   Please set them before deploying to production."
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Validation PASSED${NC}"

    if [ $OPTIONAL_MISSING -gt 0 ]; then
        echo -e "   ${YELLOW}Note: $OPTIONAL_MISSING optional variable(s) not set.${NC}"
        echo -e "   ${YELLOW}Some features may have limited functionality.${NC}"
    else
        echo -e "   All variables are configured!"
    fi

    echo ""
    exit 0
fi
