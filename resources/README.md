# App Icon & Splash Screen Resources

এই folder এ আপনার app icon এবং splash screen এর source images রাখতে হবে।

## Required Files

### App Icon
- **File:** `icon.png`
- **Size:** 1024x1024 pixels
- **Format:** PNG with transparency
- **Content:** আপনার app এর logo/icon

### Splash Screen
- **File:** `splash.png`
- **Size:** 2732x2732 pixels
- **Format:** PNG
- **Content:** আপনার app logo with background
- **Recommendation:** Center logo with your brand color background

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
