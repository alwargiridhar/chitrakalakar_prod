# ChitraKalakar - Native App Build Instructions

## For Android APK (Using PWABuilder)

### Option 1: PWABuilder (Easiest - Recommended)

1. Go to https://www.pwabuilder.com/
2. Enter your website URL: `https://chitrakalakar.com`
3. Click "Start" and wait for analysis
4. Click "Build My PWA" → Select "Android"
5. Choose "Google Play" package type
6. Download the generated ZIP file
7. Extract and find the APK in the `output` folder

### Option 2: Bubblewrap CLI (For Developers)

```bash
# Install Bubblewrap
npm install -g @nicolo-ribaudo/bubblewrap-cli

# Initialize project
bubblewrap init --manifest https://chitrakalakar.com/manifest.json

# Build APK
bubblewrap build
```

### Option 3: Android Studio TWA

1. Download Android Studio
2. Create new project → "Trusted Web Activity"
3. Configure:
   - Package name: `com.chitrakalakar.app`
   - App name: `ChitraKalakar`
   - Host: `chitrakalakar.com`
4. Build → Generate Signed APK

---

## For iOS (App Store)

iOS doesn't support direct PWA installation like Android. Options:

### Option 1: PWA via Safari (No App Store)
- Users add to home screen via Safari Share menu
- This creates a "Web App" that looks native

### Option 2: Native iOS Wrapper (Requires Apple Developer Account - $99/year)
1. Create Xcode project with WKWebView
2. Point to https://chitrakalakar.com
3. Submit to App Store

---

## Asset Links Setup (Required for Android TWA)

Place this file at: `https://chitrakalakar.com/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.chitrakalakar.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_FROM_KEYSTORE"
      ]
    }
  }
]
```

To get your SHA256 fingerprint:
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

---

## Quick Links

- PWABuilder: https://www.pwabuilder.com/
- Bubblewrap: https://github.com/nicolo-ribaudo/nicolo-nicolo-nicolo-nicolo/nicolo-nicolo-nicolo
- TWA Documentation: https://developer.chrome.com/docs/android/trusted-web-activity/

---

## Files Already Configured

✅ `/manifest.json` - PWA manifest with all required fields
✅ `/service-worker.js` - Offline support and caching
✅ `/logo192.png` - App icon (192x192)
✅ `/logo512.png` - App icon (512x512)
✅ `/apple-touch-icon.png` - iOS icon
✅ `/.well-known/assetlinks.json` - Android app linking (needs SHA256 update)

---

## Download Page URL

After deploying, share this link with users:

**https://chitrakalakar.com/download**

This page provides:
- Platform detection (Android/iOS)
- Step-by-step installation instructions
- Troubleshooting guide
