# Basha Vara Update System

**Last updated:** November 9, 2026

## Update behavior

Basha Vara has two update paths because the website and the Android app are different distribution targets.

### Website

The website is served by Vercel. Deploying web-only changes updates the website; users do not download or install an APK. If a web update prompt is shown, its action is **Reload Now**.

### Android app

The Capacitor app loads the web experience from the production Vercel URL, so many UI and API changes appear without reinstalling the APK. Native changes and intentional packaged releases use the Android APK updater:

1. The app reads its installed version and build number from Capacitor's native app metadata.
2. It checks `/api/version` for the latest published version.
3. If the published build number is higher, the app shows the update details and **Remind Me Later** / **Update Now & Install** actions. There is no **Skip This Version** action.
4. **Update Now & Install** downloads the HTTPS APK with Android DownloadManager and shows download progress.
5. Android's package installer opens and asks the user to confirm installation. Android does not permit silent installs for an ordinary sideloaded app.

On the first update, Android may ask the user to allow Basha Vara to install apps from this source. The user returns to Basha Vara and taps **Update Now & Install** again. This is an Android security requirement, not an app error.

The APK must be signed with the same release keystore as the installed app. A different signing key cannot update the existing installation.

## Release metadata

`GET /api/version` returns the published metadata:

```json
{
  "version": "1.0.5",
  "buildNumber": 5,
  "releaseDate": "2026-11-09",
  "features": ["Example improvement"],
  "isCritical": false,
  "apkUrl": "https://github.com/OWNER/REPOSITORY/releases/latest/download/basha-vara-latest.apk"
}
```

The GitHub Actions workflow supplies `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_BUILD_NUMBER`, and `NEXT_PUBLIC_ANDROID_APK_URL` at build time. The deployed Vercel environment must use the same release version/build number and APK URL so `/api/version` describes the APK users can actually download.

`buildNumber` maps to Android `versionCode`; it must increase for every APK release. `version` maps to Android `versionName`. A web-only deployment does not require either value to change.

## Development and release workflow

1. Develop and push changes on `dev`.
2. Open a pull request from `dev` into `main` and merge it after review.
3. Decide whether the change needs an APK release. Web-only changes do not.
4. Before any release tag or APK publication, the agent must ask the user: **"Do you want to release this version now?"**
5. After confirmation, update `APP_VERSION` and increment `APP_BUILD_NUMBER` in GitHub Actions Variables. Keep the matching Vercel environment values in sync.
6. Update local `main` to the merged commit, create a matching tag such as `v1.0.6`, and push the tag.
7. The tag workflow builds a signed APK and attaches `basha-vara-latest.apk` to a GitHub Release. The release must be publicly downloadable by app users.

Required GitHub Actions secrets include the release keystore (Base64), keystore password, key alias, key password, production API URL, and Google client ID. Never commit secrets or the keystore to the repository. Keep the same keystore backed up securely.

## Google sign-in cold start

On Android, Google sign-in uses the system browser/Custom Tab as required for the OAuth flow. The app first opens a branded Basha Vara waiting page hosted on Vercel. That page checks backend health through a same-origin Next.js route, keeping Render's cold-start splash page out of the user's browser view. Once the backend is healthy, the browser is redirected to Google OAuth; after authentication, the callback returns to the app through `bashavara://auth/callback`.

The branded wait screen improves the perceived experience but cannot make a sleeping free Render service start instantly. Network outages or a backend that does not become healthy within the wait window show a retry action.

## Implementation map

- `lib/version.ts`: native installed version lookup and latest-version comparison.
- `app/api/version/route.ts`: latest release metadata endpoint.
- `components/shared/update-modal.tsx`: update details, progress, defer, and install/reload actions.
- `lib/app-updater.ts`: Capacitor plugin TypeScript contract.
- `android/app/src/main/java/com/bashavara/app/AppUpdaterPlugin.java`: Android download, progress events, permission handling, and installer launch.
- `app/auth/native-google/page.tsx`: branded OAuth warm-up screen.
- `app/api/auth/native-google/health/route.ts`: backend health proxy used while Render wakes.
- `.github/workflows/build-android-apk.yml`: debug builds on `dev` and signed release publication for version tags.

## Verification checklist

Before publishing a release:

- Frontend TypeScript and focused ESLint pass.
- Backend build and relevant tests pass.
- Android Release APK build succeeds in GitHub Actions.
- Release APK uses the same signing keystore and a strictly higher build number.
- GitHub Release contains the stable `basha-vara-latest.apk` asset and is downloadable without authentication.
- Vercel `/api/version` returns matching version/build metadata and the stable APK URL.
- Test an older installed release on an Android device: update prompt appears, progress advances, installer opens, and Android shows its confirmation.
- Test **Remind Me Later**, missing install permission, failed download, and retry.
- Test native Google sign-in while the Render backend is cold and verify the branded waiting screen is shown before Google.

## Platform limitation

A privately distributed APK cannot silently install itself. The expected user journey is in-app update prompt → download progress → Android's system confirmation → updated app. Google Play's in-app update API is the more seamless option if the app is later distributed through Google Play.
