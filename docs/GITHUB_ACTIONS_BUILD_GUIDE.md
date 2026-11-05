# GitHub Actions দিয়ে Android APK Build Guide

এই guide টি আপনাকে দেখাবে কিভাবে GitHub Actions ব্যবহার করে Android Studio ছাড়াই APK build করবেন।

## কেন GitHub Actions?

- ✅ আপনার PC এ কিছুই install করতে হবে না
- ✅ Free unlimited builds
- ✅ Cloud এ build হয়, তাই PC slow হবে না
- ✅ Automatic build যখনই code push করবেন
- ✅ APK download করা যাবে GitHub থেকে

## Setup Steps

### Step 1: GitHub Repository এ Code Push করুন

আপনার কোড GitHub এ push করুন (যদি না থাকে):

```bash
git add .
git commit -m "Add GitHub Actions workflow for Android APK build"
git push origin main
```

### Step 2: GitHub Secrets Configure করুন

Production build এর জন্য আপনার API URL set করতে হবে:

1. GitHub repository এ যান
2. Settings → Secrets and variables → Actions
3. "New repository secret" ক্লিক করুন
4. নিচের secrets add করুন:

**For Debug APK (minimum required):**
```
Name: API_BASE_URL
Value: https://your-production-api-url.com/api/v1
```

**For Release APK (optional - signing):**
```
Name: KEYSTORE_PASSWORD
Value: your-keystore-password

Name: KEY_ALIAS
Value: your-key-alias

Name: KEY_PASSWORD
Value: your-key-password
```

> **Note:** Release APK এর জন্য signing দরকার হয়। শুরুতে Debug APK দিয়ে শুরু করুন।

### Step 3: Manually Trigger Build

**Option A: Debug APK Build (সবচেয়ে easy)**

1. GitHub repository এ যান
2. "Actions" tab এ ক্লিক করুন
3. "Build Android APK" workflow খুঁজুন
4. "Run workflow" বাটনে ক্লিক করুন
5. Branch select করুন (main)
6. Build type: "debug" select করুন
7. "Run workflow" ক্লিক করুন

**Option B: Automatic Build on Push**

যখনই আপনি `main` branch এ code push করবেন, automatically Debug APK build হবে।

### Step 4: APK Download করুন

Build complete হলে:

1. "Actions" tab এ যান
2. Latest workflow run এ ক্লিক করুন
3. Scroll down করে "Artifacts" section দেখুন
4. "basha-vara-debug-apk" এ ক্লিক করুন
5. APK download হবে

## Debug vs Release APK

### Debug APK
- কোনো signing দরকার নেই
- তাৎক্ষণিক build হয়
- Friends দের share করা যায়
- Limitation: Google Play Store এ upload করা যাবে না

### Release APK
- Signing দরকার (keystore file)
- Google Play Store এ upload করা যায়
- Production quality
- শুরুতে Debug APK দিয়ে শুরু করুন

## ফ্রেন্ডস দের APK দিয়ে Share করবেন কিভাবে?

### Option 1: Direct Download Link
1. GitHub repository এ Artifacts enable করুন
2. Friends দের GitHub link দিন
3. তারা Actions → Artifacts থেকে download করতে পারবে

### Option 2: File Sharing Services
- Google Drive
- Dropbox
- WeTransfer
- WhatsApp
- Telegram

### Option 3: Release Page (Recommended)
1. GitHub repository এ "Releases" tab এ যান
2. "Create a new release" ক্লিক করুন
3. Version tag দিন (v1.0.0)
4. APK file attach করুন
5. Friends দের release link দিন

## Troubleshooting

### Build Failed?
- Check workflow logs দেখুন
- Dependencies সঠিকভাবে install হয়েছে কিনা
- Frontend build সফল হয়েছে কিনা লোকালি

### APK Install হচ্ছে না?
- "Allow unknown sources" enable করুন phone settings এ
- Android version check করুন (minimum Android 7.0+)

### App Opening হচ্ছে না?
- API URL সঠিকভাবে set হয়েছে কিনা check করুন
- Backend production server running আছে কিনা

## Next Steps

যখন আপনি Production এ যাবেন:

1. **Release APK Build:**
   - Keystore file create করুন
   - GitHub secrets এ signing details add করুন
   - Release workflow trigger করুন

2. **Google Play Store Upload:**
   - Developer account ($25 one-time)
   - Release APK upload করুন
   - App listing তৈরি করুন

## Quick Reference

**Workflow Trigger Commands:**
```bash
# Push to main branch (auto builds debug APK)
git push origin main

# Manually trigger via GitHub UI
# Actions → Build Android APK → Run workflow
```

**Download APK Location:**
```
GitHub → Actions → Build Android APK → Latest Run → Artifacts → basha-vara-debug-apk
```

**Environment Variables:**
- `API_BASE_URL`: Your production API URL
- `KEYSTORE_PASSWORD`: Release signing password
- `KEY_ALIAS`: Release signing key alias
- `KEY_PASSWORD`: Release signing key password

---

## সাহায্য দরকার?

যদি কোনো problem হয়:
1. Workflow logs check করুন
2. `PROJECT_STATUS.md` দেখুন
3. GitHub Actions documentation দেখুন
