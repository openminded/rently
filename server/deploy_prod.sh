#!/bin/bash

# Ensure we are in the server directory
cd "$(dirname "$0")"

echo "🚀 Starting PRODUCTION Deployment (werently.com)..."

# 1. Pull latest changes
echo "📥 Pulling from Git..."
git config --global --add safe.directory /www/wwwroot/werently.com
git fetch origin main
git reset --hard origin/main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Build and Sync Database
echo "🔨 Building project & syncing database used by PROD..."
npm run build
npx prisma generate
# WARNING: This pushes schema to 'prod_wrnt'. Make sure .env is correct!
npx prisma db push

# 4. Restart Application (Using PROD config)
echo "🔄 Restarting application (werently-prod)..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.prod.config.cjs --env production || pm2 start ecosystem.prod.config.cjs --env production
else
    echo "⚠️ PM2 not found globally, using npx..."
    npx pm2 restart ecosystem.prod.config.cjs --env production || npx pm2 start ecosystem.prod.config.cjs --env production
fi

echo "✅ Production Deployment Complete!"
