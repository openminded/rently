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

# 5. Move Build Files to Web Root
# Asumsi web root adalah folder induk dari folder 'client' dan 'server'
WEB_ROOT="/www/wwwroot/werently.telaju.com"

echo "📂 Moving build files to $WEB_ROOT..."
# Hapus file lama di root (hati-hati jangan hapus folder server)
# Kita gunakan rsync atau copy yang aman
cp -r dist/* $WEB_ROOT/

echo "✅ Frontend Deployment Complete!"
echo "⚠️  IMPORTANT: Please configure Nginx in AA Panel to serve these files and proxy /api to port 3000."
