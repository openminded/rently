#!/bin/bash

# Deployment Script for Frontend
# Usage: ./deploy_frontend.sh

echo "🚀 Starting Frontend Deployment..."

# 1. Masuk directory client
cd "$(dirname "$0")/../client" || exit

# 2. Setup Environment Variables
echo "⚙️  Configuring Environment..."
# Set API URL ke domain production dengan path /api
echo "VITE_API_URL=https://werently.telaju.com/api" > .env

# 3. Install Dependencies
echo "📦 Installing Frontend Dependencies..."
npm install

# 4. Build Project
echo "🔨 Building Frontend..."
npm run build

# 5. Build Result Verification
# Nginx is currently configured to look in: /www/wwwroot/werently.telaju.com/client/dist
# The build folder is already there after 'npm run build'.

echo "✅ Frontend Deployment Complete!"
echo "🌐 URL: https://werently.telaju.com"
echo "⚠️  IMPORTANT: In AA Panel, ensure your Website 'Site Directory' or Nginx 'root' is set to:"
echo "   /www/wwwroot/werently.telaju.com/client/dist"
