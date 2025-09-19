# 🚀 Enzo Cool Calc - Build & Share Guide

## Prerequisites ✅
Your app is now configured with:
- ✅ Logo.png as app icon and splash screen
- ✅ EAS configuration for building
- ✅ Bundle identifiers for iOS and Android

## Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

## Step 2: Login to Expo
```bash
npx eas login
```
Enter your Expo account credentials (create one at expo.dev if you don't have one)

## Step 3: Configure your project
```bash
npx eas build:configure
```
This will set up your project and generate a unique project ID.

## Step 4: Build for Preview (Shareable Links)
```bash
# For Android APK (works on any Android device)
npx eas build --platform android --profile preview

# For iOS Simulator (if you want iOS testing)
npx eas build --platform ios --profile preview
```

## Step 5: Get Shareable Links
After the build completes (usually 10-15 minutes), you'll get:
- **Download Link**: Direct APK download for Android
- **QR Code**: For easy installation
- **Expo Go Link**: For testing in Expo Go app

## Step 6: Share with Clients

### Option A: Direct APK (Recommended for Android)
1. Send the APK download link to clients
2. Clients download and install directly on Android devices
3. No need for Expo Go app

### Option B: Expo Go (For quick testing)
1. Clients install Expo Go from App Store/Play Store
2. Share the QR code or expo:// link
3. Clients scan QR or open link in Expo Go

### Option C: Development Build (Most reliable)
```bash
npx eas build --platform android --profile development
npx eas build --platform ios --profile development
```

## Alternative: Expo Publish (Legacy but simple)
```bash
# Quick publish for testing
npx expo publish

# Get shareable link
npx expo url
```

## 📱 For iOS without Apple device:
1. Use EAS Build with iOS simulator profile
2. Share with someone who has a Mac for testing
3. Or use Expo Go method for initial testing

## 🔗 What clients need:
- **Android**: Just download APK file (easiest)
- **iOS**: Install Expo Go app, then scan QR code
- **Both**: No local network needed - works anywhere in the world

## 💡 Pro Tips:
1. Use `preview` profile for client testing
2. Use `production` profile for final release
3. APK files work best for non-technical clients
4. Keep build links - they don't expire quickly

## Example Commands to Run Now:
```bash
cd /home/ankush/Music/restart1/project
npx eas login
npx eas build:configure
npx eas build --platform android --profile preview
```

The APK link you get can be shared with anyone worldwide! 🌍
