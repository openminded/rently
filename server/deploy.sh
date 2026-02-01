#!/bin/bash

# Ensure we are in the server directory
cd "$(dirname "$0")"

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "📥 Pulling from Git..."
git config --global --add safe.directory /www/wwwroot/werently.telaju.com
git fetch origin main
git reset --hard origin/main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Build the project
echo "🔨 Building project..."
npm run build

# 4. Restart Application
echo "🔄 Restarting application..."
# Check if PM2 is installed globally, otherwise use npx
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
else
    echo "⚠️ PM2 not found globally, using npx..."
    npx pm2 restart ecosystem.config.cjs --env production || npx pm2 start ecosystem.config.cjs --env production
fi

echo "✅ Deployment Complete!"
