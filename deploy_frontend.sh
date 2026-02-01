#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Frontend Deployment..."

# 1. Update Codebase
echo "📦 Pulling latest changes..."
git pull origin main

# 2. Install Dependencies
echo "📚 Installing dependencies..."
cd client
npm install

# 3. Build Application
echo "🏗️ Building application..."
npm run build

echo "✅ Deployment Build Complete!"
echo "👉 Ensure your Nginx root points to: $(pwd)/dist"
