#!/bin/bash

# TODO Tasks - Automated Bootstrapper

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting TODO Tasks Setup..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

echo "📦 Installing root, backend, and frontend dependencies..."
npm run install-all

echo "🏗️ Building frontend assets..."
npm run build

echo "✅ Build completed successfully!"
echo "🌐 Starting server on http://localhost:3000..."
echo "Press Ctrl+C to terminate."
echo ""

npm run start
