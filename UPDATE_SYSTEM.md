# Professional Update Notification System

**Last Updated:** November 6, 2026

## Overview

Basha Vara now has a professional update notification system that provides users with clear update information and gives them control over when to update. This is a best-practice approach used by professional apps like Instagram, WhatsApp, and Slack.

## How It Works

### 1. Version System

The app uses a **buildNumber-based version system**:

```typescript
// lib/version.ts
export const CURRENT_VERSION: AppVersion = {
  version: '1.0.0',
  buildNumber: 1,
  releaseDate: '2026-11-06',
  features: [
    'Custom branding with beautiful splash screen',
    'Performance optimizations',
    'OTA updates enabled',
  ],
  isCritical: false,
};
```

**When deploying new features:**
1. Increment `buildNumber` in both `lib/version.ts` and `app/api/version/route.ts`
2. Update `version` string (semantic versioning)
3. Add new features to the `features` array
4. Update `releaseDate`
5. Set `isCritical: true` for security/bug fixes

### 2. Update Check Flow

**Automatic Check (on app open):**
```
User opens app
  ↓
Check if 1 hour passed since last check
  ↓
Yes → Fetch /api/version
  ↓
Compare buildNumber
  ↓
New version available? → Show UpdateModal
```

**Manual Check (via header button):**
```
User clicks "Check Updates"
  ↓
Fetch /api/version immediately
  ↓
Compare buildNumber
  ↓
Show result (update available or "You're on latest")
```

### 3. Update Modal

The modal shows:
- Current version (with badge)
- New version (with badge)
- What's new (feature list)
- Critical update warning (if applicable)
- Three options:
  - **Update Now** - Reloads app to get latest version
  - **Later** - Dismisses modal, will check again later
  - **Skip This Version** - Won't show this version again (non-critical only)

### 4. User Experience

**Normal Update:**
```
User opens app
  ↓
Update modal appears: "New Update Available"
  ↓
User sees: Current 1.0.0 → New 1.1.0
  ↓
User sees: "What's New" list
  ↓
User chooses: Update Now / Later / Skip
```

**Critical Update:**
```
User opens app
  ↓
Update modal appears: "Critical Update Available"
  ↓
Warning banner: "This update includes important security fixes"
  ↓
Only options: Update Now / Later (no skip)
```

## Version Comparison Logic

```typescript
function isUpdateAvailable(current: AppVersion, latest: AppVersion): boolean {
  return latest.buildNumber > current.buildNumber;
}
```

**Simple and reliable:**
- Higher buildNumber = newer version
- No complex semver parsing
- Easy to understand and maintain

## Rate Limiting

**Purpose:** Prevent excessive API calls

**Implementation:**
```typescript
export function shouldCheckForUpdate(): boolean {
  const lastCheck = getLastCheck();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  return now - lastCheck > oneHour;
}
```

**Behavior:**
- Auto-check at most once per hour
- Manual check always works (no rate limit)
- Respects user data usage

## Skip Version Feature

**Purpose:** Allow users to postpone non-critical updates

**Implementation:**
```typescript
// User skips version 1.1.0
skipVersion('1.1.0');

// Next check won't show 1.1.0
if (isVersionSkipped('1.1.0')) {
  // Don't show modal
}

// After updating to 1.1.0, clear skipped version
clearSkippedVersion();
```

**Use Cases:**
- User busy, wants to update later
- User on slow data connection
- User prefers current version

## Deploying Updates

### Step 1: Update Version Numbers

**File: `frontend/lib/version.ts`**
```typescript
export const CURRENT_VERSION: AppVersion = {
  version: '1.1.0',        // Increment
  buildNumber: 2,          // Increment
  releaseDate: '2026-11-07',
  features: [
    'New feature 1',
    'New feature 2',
    'Bug fix for issue X',
  ],
  isCritical: false,       // Set true for critical updates
};
```

**File: `frontend/app/api/version/route.ts`**
```typescript
const LATEST_VERSION: AppVersion = {
  version: '1.1.0',        // Same as above
  buildNumber: 2,          // Same as above
  releaseDate: '2026-11-07',
  features: [
    'New feature 1',
    'New feature 2',
    'Bug fix for issue X',
  ],
  isCritical: false,
};
```

### Step 2: Deploy to Vercel

```bash
cd frontend
git add .
git commit -m "feat: add new features (v1.1.0)"
git push origin dev
```

### Step 3: Users Get Update Notification

- Users with buildNumber 1 will see update modal
- Users can choose to update or skip
- No APK redistribution needed

## Testing the Update System

### Test Normal Update

1. **Deploy version 1.0.0** (buildNumber: 1)
2. **Install APK** (or use web)
3. **Update to version 1.1.0** (buildNumber: 2)
4. **Open app**
5. **Result:** Update modal appears

### Test Critical Update

1. Set `isCritical: true` in version config
2. Deploy
3. Open app
4. **Result:** Modal shows critical warning, no "Skip" button

### Test Skip Version

1. Deploy version 1.1.0
2. Open app, click "Skip This Version"
3. Close and reopen app
4. **Result:** Modal doesn't appear
5. Update manually via "Check Updates" button
6. **Result:** Skipped version cleared

### Test Manual Check

1. Click "Check Updates" button in header
2. **Result:** Immediate check, shows update or "latest" message

## API Endpoint

### GET /api/version

**Response:**
```json
{
  "version": "1.0.0",
  "buildNumber": 1,
  "releaseDate": "2026-11-06",
  "features": [
    "Custom branding with beautiful splash screen",
    "Performance optimizations",
    "OTA updates enabled"
  ],
  "isCritical": false
}
```

**Caching:** Next.js automatically caches this endpoint (static generation)

## localStorage Keys

- `basha_vara_version` - Current installed version
- `basha_vara_last_version_check` - Timestamp of last check
- `basha_vara_skip_version` - Version user chose to skip

## Best Practices

### 1. Increment BuildNumber Every Deploy

Even for small changes, increment `buildNumber`:
- Bug fixes → buildNumber + 1
- New features → buildNumber + 1
- Critical fixes → buildNumber + 1

### 2. Use Semantic Versioning

Format: `MAJOR.MINOR.PATCH`
- **Major (1.0.0 → 2.0.0):** Breaking changes
- **Minor (1.0.0 → 1.1.0):** New features
- **Patch (1.0.0 → 1.0.1):** Bug fixes

### 3. Write Clear Feature Descriptions

**Good:**
```
- Add property search filters
- Fix login bug for special characters
- Improve map loading performance
```

**Bad:**
```
- Bug fix
- Update
- New stuff
```

### 4. Mark Critical Updates Appropriately

Set `isCritical: true` for:
- Security vulnerabilities
- Data loss bugs
- Critical functionality breaks
- Compliance requirements

**Don't** mark as critical:
- UI improvements
- New features
- Performance optimizations
- Minor bug fixes

### 5. Test Before Deploying

Always test:
1. Update modal appears
2. "Update Now" works
3. "Later" works
4. "Skip" works (for non-critical)
5. Manual check works

## Troubleshooting

### Update Modal Not Showing

**Cause:** BuildNumber not incremented

**Solution:**
- Check `lib/version.ts` and `app/api/version/route.ts`
- Ensure buildNumber increased
- Clear localStorage and reload

### Update Not Applying

**Cause:** Page reload not triggered

**Solution:**
- Check browser console for errors
- Ensure `window.location.reload()` is called
- Try manual refresh

### Wrong Version Showing

**Cause:** Version files not synced

**Solution:**
- Ensure both files have same buildNumber
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

## Benefits of This System

✅ **Professional UX** - Clear update information, user control
✅ **No APK Redistribution** - Updates delivered via OTA
✅ **Flexible** - Users can choose when to update
✅ **Critical Updates** - Force important updates
✅ **Rate Limited** - Respects user data
✅ **Manual Check** - Users can check anytime
✅ **Skip Feature** - Users can postpone updates
✅ **Clear Communication** - Shows what's new

## Comparison: Old vs New

| Feature | Old (Auto-Update) | New (Professional) |
|---------|-------------------|-------------------|
| User Control | None | Full control |
| Update Info | None | Detailed features |
| Critical Updates | None | Forced update |
| Rate Limiting | None | 1 hour |
| Manual Check | None | Available |
| Skip Option | None | Available |
| Professional | Basic | Industry standard |

## Summary

The professional update notification system provides:
- ✅ Clear update information to users
- ✅ User control over when to update
- ✅ Critical update enforcement
- ✅ Professional UX like major apps
- ✅ No APK redistribution needed
- ✅ Rate limiting for efficiency
- ✅ Manual check capability
- ✅ Skip version feature

This is the industry-standard approach used by professional apps and provides the best user experience.

## Related Documentation

- [OTA Updates Guide](./OTA_UPDATES.md)
- [Performance Guide](./PERFORMANCE.md)
- [Branding Guide](./BRANDING_GUIDE.md)
