#!/bin/bash

# Deployment Script for Frontend (PRODUCTION - werently.com)

echo "🚀 Starting Frontend Deployment (werently.com)..."

# 1. Masuk directory client
cd "$(dirname "$0")/../client" || exit

# 2. Setup Environment Variables for PROD
echo "⚙️  Configuring Environment..."
# Set API URL ke domain production BARU
echo "VITE_API_URL=https://werently.com/api" > .env

# 3. Install Dependencies
echo "📦 Installing Frontend Dependencies..."
npm install

# 4. Build Project
echo "🔨 Building Frontend..."
npm run build

echo "✅ Frontend Deployment Complete!"
echo "🌐 URL: https://werently.com"
echo "⚠️  IMPORTANT: In AA Panel (werently.com), set site directory to:"
echo "   /www/wwwroot/werently.com/client/dist"
