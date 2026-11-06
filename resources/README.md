# App Icon & Splash Screen Resources

এই folder এ আপনার app icon এবং splash screen এর source images রাখতে হবে।

## Custom Basha Vara Branding

### App Icon Design
- **SVG Source:** `basha-vara-icon.svg`
- **Generated:** `icon.png` (1024x1024)
- **Design:** Modern house icon with gradient teal background (#14b8a6 to #0d9488)
- **Features:**
  - Rounded corners for modern look
  - White house icon with windows and door
  - Subtle shadow effect
  - Brand colors: Primary teal gradient

### Splash Screen Design
- **SVG Source:** `basha-vara-splash.svg`
- **Generated:** `splash.png` (2732x2732)
- **Design:** White to light teal gradient background with centered app icon
- **Features:**
  - Large centered app icon (350px radius circle)
  - App name "Basha Vara" below icon
  - Tagline "Find Your Perfect Home"
  - Subtle decorative geometric circles
  - Clean, modern, professional look

### Regenerating Assets

যদি আপনি আইকন বা স্প্ল্যাশ স্ক্রিন পরিবর্তন করতে চান:

```bash
cd frontend/resources

# Step 1: Edit SVG files
# - basha-vara-icon.svg (for app icon)
# - basha-vara-splash.svg (for splash screen)

# Step 2: Generate PNG files
node generate-icon.js
node generate-splash.js

# Step 3: Generate all Android/PWA sizes
cd ..
npx @capacitor/assets generate

# Step 4: Sync with Capacitor
npx cap sync android
```

## Current Configuration

### Splash Screen Animation
- **Duration:** 3 seconds (3000ms)
- **Fade In:** 500ms
- **Fade Out:** 500ms
- **Background:** White (#ffffff)
- **Style:** Full screen, immersive

### Brand Colors
- **Primary:** #14b8a6 (Teal)
- **Primary Dark:** #0d9488 (Darker Teal)
- **Accent:** #2dd4bf (Light Teal)

## Design Files

### SVG Source Files
- `basha-vara-icon.svg` - App icon design (1024x1024)
- `basha-vara-splash.svg` - Splash screen design (2732x2732)

### PNG Output Files
- `icon.png` - High-res app icon (1024x1024)
- `splash.png` - High-res splash screen (2732x2732)

### Generated Asset Locations
After running `npx @capacitor/assets generate`:
- **Android Icons:** `android/app/src/main/res/mipmap-*/`
- **Android Splash:** `android/app/src/main/res/drawable-*/`
- **PWA Icons:** `public/icons/`

## Customization Guide

### Changing Colors
Edit the SVG files and update the gradient colors:
```xml
<stop offset="0%" style="stop-color:#14b8a6;stop-opacity:1" />
<stop offset="100%" style="stop-color:#0d9488;stop-opacity:1" />
```

### Changing Icon
Edit the house icon path in the SVG files or replace with custom design.

### Changing Splash Duration
Edit `capacitor.config.ts`:
```typescript
SplashScreen: {
  launchShowDuration: 3000, // Change this value
  // ...
}
```

## Quick Setup Options

### Option 1: Use Online Tools
1. **Canva:** https://www.canva.com/ (Free app icon templates)
2. **AppIcon.co:** https://appicon.co/ (Automatically generates all sizes)
3. **MakeAppIcon:** https://makeappicon.com/

### Option 2: Use Default Capacitor Resources
যদি আপনি temporarily default icon use করতে চান:

```bash
cd frontend
npx @capacitor/assets generate
```

এটা automatically একটি default icon/splash তৈরি করবে।

### Option 3: Custom Design
1. 1024x1024 icon.png তৈরি করুন
2. 2732x2732 splash.png তৈরি করুন
3. `resources/` folder এ রাখুন
4. Run: `npx @capacitor/assets generate`

## Generation Command

Resources থাকার পর:

```bash
cd frontend
npx @capacitor/assets generate
```

এটা automatically Android এবং iOS এর জন্য সব required sizes generate করবে।

## After Generation

Capacitor sync করুন:

```bash
npx cap sync android
```

---

## Design Tips

### App Icon
- Simple and recognizable
- No text (or minimal text)
- High contrast
- Works on both light and dark backgrounds

### Splash Screen
- Center your logo
- Use your brand color background
- Minimal design
- Loading spinner automatically থাকবে
