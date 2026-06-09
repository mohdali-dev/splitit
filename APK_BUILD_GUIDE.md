# Building Android APK for Splitit

## Option 1: GitHub Actions (Cloud Build) - RECOMMENDED ✅

The easiest way to build your Android APK without dealing with local Java/Gradle setup:

### Steps:
1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Setup APK build"
   git push
   ```

2. **Go to your GitHub repository** → **Actions**

3. **Find "Build Android APK" workflow** and it will automatically run

4. **Download the APK**:
   - Click on the completed workflow run
   - Scroll to bottom → "Artifacts" section
   - Download `splitit-debug` 

5. **Install on your Android device**:
   ```bash
   # Connect your device via USB and enable USB debugging
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Option 2: Local Build (If Java Version is Fixed)

If you fix the Java version issue locally:

### Prerequisites:
- Java 17 JDK (important!)
- Android SDK (via Android Studio)

### Build Steps:
```bash
# Install dependencies
npm install

# Build React app
npm run build

# Sync Capacitor
npx cap sync

# Build APK (Debug)
cd android
./gradlew assembleDebug

# APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Option 3: Using Gradle Command (Advanced)

```bash
cd /workspaces/splitit/android
./gradlew assembleDebug --continue
```

Output APK: `/workspaces/splitit/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Troubleshooting

### Issue: "Unsupported class file major version 69"
**Cause**: Using Java 21+ with Gradle 8.13

**Solution**:
- Use Java 17 instead (GitHub Actions does this automatically)
- Or upgrade Gradle to 8.15+ (requires AGP update)

### Issue: APK installation fails
Make sure:
- [ ] Device has "Unknown Sources" enabled (Settings → Apps → Allow from Unknown)
- [ ] USB debugging is enabled on device
- [ ] Device is connected with `adb devices`

---

## After Building the APK

### Test on Device:
```bash
# Connect Android device with USB
adb install -r splitit-debug.apk

# View logs
adb logcat

# Uninstall
adb uninstall com.splitit.app
```

### Installation Without ADB:
- Transfer `app-debug.apk` to your Android device
- Tap to install directly (or use a file manager)

---

## APK vs Release Build

**Debug APK** (what we're building):
- ✅ Smaller file size
- ✅ Quick to build
- ❌ Can't upload to Play Store
- ❌ Has debug symbols

**Release APK** (for production):
```bash
cd android
./gradlew assembleRelease
# Requires keystore file for signing
```

---

## Creating a Signed Release APK

For distributing on Google Play Store:

```bash
# 1. Generate signing key
keytool -genkey -v -keystore splitit.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias splitit

# 2. Sign the APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore splitit.keystore \
  app-release-unsigned.apk splitit
```

---

## Direct File Locations

- **Built APK**: `/workspaces/splitit/android/app/build/outputs/apk/debug/app-debug.apk`
- **Capacitor Config**: `/workspaces/splitit/capacitor.config.ts`
- **Android Config**: `/workspaces/splitit/android/`

---

## Next Steps

1. **Push to GitHub** to trigger automatic APK build
2. **Download APK** from GitHub Actions
3. **Install on device** using ADB or direct file transfer
4. **Test all features** offline and online
5. **Create release APK** when ready for Play Store

