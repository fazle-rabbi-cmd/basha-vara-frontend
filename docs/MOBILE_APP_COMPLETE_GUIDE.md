# Basha Vara - Complete Mobile App Setup Guide

**Status:** ✅ Setup Complete
**Last Updated:** November 5, 2026

---

## আপনার জন্য কী কী করা হয়েছে

আপনার web app টি Capacitor দিয়ে real mobile app এর মতো configure করা হয়েছে। Android Studio ছাড়াই APK build করা সম্ভব।

### ✅ Completed Tasks

1. **Capacitor Configuration Updated**
   - Static export enabled (web assets bundled in APK)
   - Removed localhost dependency
   - Added mobile-specific plugins (Splash Screen, Status Bar, Haptics, etc.)
   - Configured app ID: `com.bashavara.app`
   - App name: `Basha Vara`

2. **Next.js Configuration Updated**
   - Static export enabled (`output: 'export'`)
   - Optimized for mobile (image optimization disabled for static build)
   - Build output directory: `out/`

3. **Mobile Plugins Installed**
   - `@capacitor/app` - App lifecycle management
   - `@capacitor/device` - Device info
   - `@capacitor/network` - Network status detection
   - `@capacitor/haptics` - Vibration feedback
   - `@capacitor/splash-screen` - Loading screen
   - `@capacitor/status-bar` - Status bar styling

4. **Android Manifest Configured**
   - Internet permission enabled
   - Location permissions enabled (for map features)
   - Network security config added (allows HTTP for local testing)
   - Cleartext traffic enabled

5. **GitHub Actions Workflow Created**
   - Automatic APK build on push to main branch
   - Manual build trigger option
   - Debug and Release APK support
   - Artifact retention: 30 days

6. **App Icon & Splash Screen Setup**
   - Resources folder created
   - Guide added for custom icons
   - (You'll need to add your custom icons - see below)

---

## এখন আপনার কী করতে হবে

### Step 1: GitHub Repository এ Code Push করুন

```bash
git add .
git commit -m "Configure Capacitor for mobile app with GitHub Actions build"
git push origin main
```

### Step 2: GitHub Secrets Configure করুন

1. GitHub repository এ যান
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** ক্লিক করুন
4. এই secret add করুন:

**Required for API:**
```
Name: API_BASE_URL
Value: https://your-production-api-url.com/api/v1
```

> **Important:** আপনার backend server কোথায় hosting করবেন? Production API URL দরকার হবে।

### Step 3: GitHub Actions দিয়ে APK Build করুন

**Option A: Automatic Build (প্রতিবার push এ)**
- যখনই আপনি `main` branch এ code push করবেন, automatically Debug APK build হবে।

**Option B: Manual Build**
1. GitHub repository এ **Actions** tab এ যান
2. **"Build Android APK"** workflow দেখুন
3. **"Run workflow"** বাটনে ক্লিক করুন
4. Branch: `main` select করুন
5. Build type: `debug` select করুন
6. **"Run workflow"** ক্লিক করুন

### Step 4: APK Download করুন

Build complete হলে (5-10 মিনিট):
1. **Actions** tab এ যান
2. Latest workflow run এ ক্লিক করুন
3. Scroll down করে **"Artifacts"** section দেখুন
4. **"basha-vara-debug-apk"** এ ক্লিক করুন
5. APK download হবে

---

## Customization: App Icon & Splash Screen

আপনার app টি professional দেখানোর জন্য custom icon দরকার।

### Step 1: Icon & Splash Image তৈরি করুন

**App Icon:**
- Size: 1024x1024 pixels
- Format: PNG with transparency
- আপনার logo/icon ব্যবহার করুন

**Splash Screen:**
- Size: 2732x2732 pixels
- Format: PNG
- আপনার logo center এ রাখুন with background color

### Step 2: Images Upload করুন

Files কে `frontend/resources/` folder এ রাখুন:
- `frontend/resources/icon.png`
- `frontend/resources/splash.png`

### Step 3: Generate Assets

```bash
cd frontend
npx @capacitor/assets generate
```

### Step 4: Sync with Android

```bash
cd frontend
npx cap sync android
```

### Step 5: Push to GitHub

```bash
git add .
git commit -m "Add custom app icon and splash screen"
git push origin main
```

### Quick Alternative: Online Tools

যদি design করতে না চান:
- **Canva:** https://www.canva.com/ (Free templates)
- **AppIcon.co:** https://appicon.co/ (Auto-generate all sizes)
- **MakeAppIcon:** https://makeappicon.com/

---

## Friends দের APK দিয়ে Share করবেন কিভাবে?

### Option 1: GitHub Releases (Recommended)

1. GitHub repository এ **Releases** tab এ যান
2. **"Create a new release"** ক্লিক করুন
3. Version tag দিন (যেমন: `v1.0.0`)
4. Release title দিন (যেমন: "Basha Vara v1.0.0")
5. APK file attach করুন (download করা APK)
6. Release notes লিখুন
7. **"Publish release"** ক্লিক করুন
8. Friends দের release link দিন

### Option 2: File Sharing Services

- Google Drive
- Dropbox
- WeTransfer
- WhatsApp
- Telegram

### Option 3: GitHub Artifacts (সহজ কিন্তু temporary)

Friends দের GitHub Actions artifacts link দিন।
Limitation: 30 দিন পর delete হয়ে যাবে।

---

## Production Setup (Important)

আপনার app টি properly work করার জন্য এই things দরকার:

### 1. Backend Server Hosting

আপনার backend server কোথায় hosting করবেন?

**Free Tier Options:**
- **Render:** https://render.com/ (NestJS, PostgreSQL free tier)
- **Railway:** https://railway.app/ (Free tier available)
- **Supabase:** https://supabase.com/ (PostgreSQL + API free tier)

**Steps:**
1. Backend deploy করুন
2. Production URL পান (যেমন: `https://basha-vara-api.onrender.com`)
3. GitHub secret `API_BASE_URL` এ set করুন

### 2. Environment Variables

Frontend `.env.production` file check করুন:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com/api/v1
```

---

## Debugging & Testing

### Local Testing (Without Building APK)

আপনার phone এ live test করতে চান:

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

> **Note:** এটা Android Studio খুলবে। Android Studio ছাড়া local testing করতে চাইলে:

**Alternative: Live Reload on Phone**
```bash
cd frontend
npm run dev
npx cap run android
```

> Requires ADB setup on your PC

### Common Issues

**APK Install হচ্ছে না:**
- Phone settings এ "Install unknown apps" enable করুন
- Android version 7.0+ আছে কিনা check করুন

**App এতে white screen দেখাচ্ছে:**
- API URL সঠিকভাবে set হয়েছে কিনা check করুন
- Backend server running আছে কিনা verify করুন

**Location কাজ করছে না:**
- Phone এ location permission grant করুন
- AndroidManifest এ permission enabled আছে (✅ আমি already enabled করেছি)

---

## Android Studio কি দরকার?

### যেগুলো Android Studio ছাড়া করা যায় ✅

- ✅ APK build (GitHub Actions দিয়ে)
- ✅ Code write (VS Code/Windsurf দিয়ে)
- ✅ Capacitor configuration
- ✅ Android manifest editing
- ✅ Plugin installation
- ✅ Testing with live reload (কিছু setup দরকার)

### যেগুলোর জন্য Android Studio helpful হতে পারে 🤔

- 🤔 Advanced debugging (logs, breakpoints)
- 🤔 Emulator testing (কিন্তু real phone দিয়েও test করা যায়)
- 🤔 Performance profiling
- 🤔 Signing configuration (কিন্তু command line দিয়েও করা যায়)

### আমার Recommendation

**Phase 1 (শুরুতে):**
- Android Studio ব্যবহার করবেন না
- GitHub Actions দিয়ে APK build করুন
- Real phone এ test করুন

**Phase 2 (যদি advanced debugging দরকার হয়):**
- তখন Android Studio install করতে পারেন
- কিন্তু শুরুতে না

---

## Release APK (Google Play Store)

যখন আপনি Google Play Store এ app upload করতে চাইবেন:

### 1. Keystore Generate করুন

```bash
keytool -genkey -v -keystore basha-vara-release.keystore -alias basha-vara -keyalg RSA -keysize 2048 -validity 10000
```

### 2. GitHub Secrets এ Add করুন

```
KEYSTORE_PASSWORD: your-keystore-password
KEY_ALIAS: basha-vara
KEY_PASSWORD: your-key-password
```

### 3. Release Build Trigger করুন

GitHub Actions এ Release build trigger করুন।

### 4. Google Play Developer Account

- $25 one-time fee
- Release APK upload করুন
- App listing তৈরি করুন
- Screenshots, description add করুন
- Submit for review

---

## Summary: What You Can & Can't Do

### ✅ আপনি করতে পারবেন (Android Studio ছাড়া)

1. Web app কে mobile app এ convert করা ✅
2. APK build করা (GitHub Actions দিয়ে) ✅
3. Friends দের APK share করা ✅
4. App icon এবং splash screen customize করা ✅
5. Mobile plugins use করা ✅
6. Code write এবং modify করা ✅
7. New features add করা ✅

### ❌ আপনি করতে পারবেন না (অথবা কঠিন)

1. Advanced debugging without Android Studio (but logging করা যায়) ⚠️
2. Emulator testing without setup (but real phone দিয়ে test করা যায়) ⚠️
3. Google Play Store upload without signing (but signing করা command line দিয়েও যায়) ⚠️

### 🎯 আমার Recommendation

শুরুতে Android Studio ব্যবহার করবেন না। GitHub Actions দিয়েই সব কাজ হবে। যখন advanced debugging দরকার হবে, তখন ভাববেন।

---

## Next Steps Checklist

- [ ] Code push করুন GitHub এ
- [ ] GitHub secrets configure করুন (API_BASE_URL)
- [ ] GitHub Actions trigger করে APK build করুন
- [ ] APK download করুন
- [ ] Phone এ install করে test করুন
- [ ] Custom app icon এবং splash screen add করুন
- [ ] Backend server deploy করুন (if not already)
- [ ] Friends দের APK share করুন
- [ ] Feedback collect করুন
- [ ] Iterations improve করুন

---

## সাহায্য দরকার?

যদি কোনো step এ সমস্যা হয়:

1. **GitHub Actions Build Failed:**
   - Workflow logs check করুন
   - Dependencies সঠিকভাবে install হয়েছে কিনা
   - Frontend build সফল হয়েছে কিনা লোকালি

2. **APK Install হচ্ছে না:**
   - "Install unknown apps" enable করুন phone settings এ
   - Android version check করুন

3. **App এতে white screen:**
   - API URL verify করুন
   - Backend server running আছে কিনা check করুন

4. **অন্য সমস্যা:**
   - `docs/GITHUB_ACTIONS_BUILD_GUIDE.md` দেখুন
   - `docs/MOBILE_APP_SETUP.md` দেখুন
   - Capacitor documentation: https://capacitorjs.com/docs

---

## Documentation Links

- GitHub Actions Build Guide: `docs/GITHUB_ACTIONS_BUILD_GUIDE.md`
- Mobile App Setup: `docs/MOBILE_APP_SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`
- API Specification: `docs/API_SPECIFICATION.md`

---

**আপনার মূল লক্ষ্য অর্জিত:** Web app টি Capacitor দিয়ে real mobile app এর মতো feel করানো সম্ভব এবং Android Studio ছাড়াই APK build করা সম্ভব।

এখন code push করুন এবং প্রথম APK build করুন! 🚀
