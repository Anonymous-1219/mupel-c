# Mupel Clock

Premium Clock / Timer / Stopwatch app with a draggable floating countdown bubble
that overlays other apps.

## What's already done for you

- Full React Native + Expo app: Clock, Timer, Stopwatch, bottom tab navigation
- Timer logic that survives backgrounding (timestamp-based, not a fragile JS interval)
- Local notifications: an ongoing "time remaining" notification while running, and a
  scheduled notification that fires exactly at zero
- Alarm sound + vibration on completion
- A real native Kotlin Expo Module (`modules/floating-timer`) implementing the
  draggable, edge-snapping, rounded-square floating bubble with Pause/+5/Stop buttons,
  running as a proper foreground service
- A config plugin (`plugins/withFloatingTimer.js`) that registers that service in
  AndroidManifest.xml automatically
- Valid `app.json`, real PNG icons, and a real alarm.mp3 — the exact things known to
  break `expo prebuild` if missing

You do **not** need a laptop. Everything from here happens on your Android phone,
using GitHub's mobile web UI + GitHub Codespaces (a browser-based VS Code and
terminal) + Expo's EAS cloud build service.

## Step-by-step: get this running as an installed APK

1. **Create a GitHub repo and upload this project.**
   On your phone, go to github.com → New repository → then use "Upload files" (or
   upload this folder as a zip and unzip it inside a Codespace — see step 2).

2. **Open a Codespace.**
   On the repo page: Code → Codespaces tab → "Create codespace on main". This opens
   a full VS Code + terminal in your phone's browser.

3. In the Codespace terminal, run:
   ```
   npm install
   npm install -g eas-cli
   npx expo login
   ```

4. Configure the build:
   ```
   eas build:configure
   ```
   Choose **Android** when asked.

5. Generate native Android project files:
   ```
   npx expo prebuild -p android
   ```

6. Sanity check before building (fixes ~90% of build failures ahead of time):
   ```
   npx expo-doctor
   node -e "JSON.parse(require('fs').readFileSync('app.json')); console.log('app.json OK')"
   ```

7. Kick off the cloud build:
   ```
   eas build -p android --profile preview
   ```
   This compiles in Expo's cloud — nothing runs on your phone yet. It can take
   several minutes, and free-tier builds queue behind paid ones (occasionally over
   an hour at busy times — that's normal, not broken).

8. When it finishes, EAS prints a download link (and you can also find it at
   expo.dev under your project → Builds). Open that link **on your phone** and
   install the APK (you'll need to allow "install unknown apps" for your browser
   the first time).

9. Open the app. Go to the Timer tab, start a timer — on first use of the floating
   bubble, Android will ask you to grant **"Display over other apps"**. This has to
   be granted manually in system settings; the app cannot auto-grant it, but it will
   detect if it's missing and can send you straight to the settings screen for it.

## If a build fails

Read the error message text first — most failures are one of the exact issues this
project was already built to avoid (see the original build-lessons doc: bad JSON in
app.json, missing icon files, wrong Gradle plugin id in the native module,
non-exhaustive `return@Function` in Kotlin, unstable notification trigger format).
If it's something else, paste the exact `eas build` error output back to me and I'll
fix the specific file it points to.

## Project structure

```
App.js                          — navigation root, 3 tabs
src/context/TimerContext.js     — all timer state, notifications, native bridge
src/screens/ClockScreen.js
src/screens/TimerScreen.js
src/screens/StopwatchScreen.js
src/theme/colors.js
modules/floating-timer/         — native Expo Module (Kotlin) for the bubble
plugins/withFloatingTimer.js    — config plugin registering the foreground service
assets/                         — icons, splash, alarm sound (all real files)
```
