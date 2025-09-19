#!/bin/bash

# Enzo Cool Calc - Quick Build Script
# Run this to create a shareable build for your clients

echo "🚀 Building Enzo Cool Calc for sharing..."
echo "1. Make sure you're logged into Expo"
echo "2. Run: npx eas login (if not logged in)"
echo ""
jl

# Step 1: Login (you'll need to do this manually)
echo "Step 1: Please run manually:"
echo "npx eas login"
echo ""

# Step 2: Configure project
echo "Step 2: Configuring project..."
npx eas build:configure

# Step 3: Build Android APK for sharing
echo "Step 3: Building Android APK..."
npx eas build --platform android --profile preview

echo ""
echo "✅ Build complete! You'll get a shareable link that works worldwide."
echo "📱 Clients can download the APK directly on Android devices."
echo "🌍 No local network needed - link works anywhere!"
