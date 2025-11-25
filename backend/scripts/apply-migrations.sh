#!/bin/bash

# ============================================
# Database Migration Application Script
# ============================================
# This script applies all pending Prisma migrations
# to the database.
#
# Usage: ./scripts/apply-migrations.sh
# ============================================

set -e

echo "🚀 VocaVision - Database Migration Script"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "   Please set it in .env file or export it:"
    echo "   export DATABASE_URL=\"postgresql://user:password@localhost:5432/vocavision\""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check PostgreSQL connection
echo "🔍 Testing database connection..."
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo "✅ Database connection successful"
    else
        echo "❌ Cannot connect to database. Please ensure PostgreSQL is running."
        exit 1
    fi
else
    echo "⚠️  psql not found, skipping connection test"
fi
echo ""

# Apply migrations
echo "📦 Applying Prisma migrations..."
echo ""

# Option 1: Using prisma migrate deploy (production)
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Production mode: Using 'prisma migrate deploy'"
    npx prisma migrate deploy
else
    # Option 2: Using prisma migrate dev (development)
    echo "🛠️  Development mode: Using 'prisma migrate dev'"
    npx prisma migrate dev
fi

echo ""
echo "✅ Migrations applied successfully!"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated!"
echo ""

# Run database seeders (optional)
read -p "Do you want to run database seeders? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Running database seeders..."
    npm run seed
    echo "✅ Database seeded!"
fi

echo ""
echo "🎉 All done! Your database is ready."
echo "=========================================="
