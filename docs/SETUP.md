# Machine setup and pitfalls

How to prepare a Mac for React Native / Expo development, and the problems that came up while building this project. Written for macOS on Apple Silicon. Replace the `<placeholders>` with your own values.

## Part 1: Machine setup

### 1. Check what is already installed

```bash
sw_vers
uname -m
xcode-select -p
git --version
brew --version
nvm --version
node -v
pnpm -v
```

Also check for leftovers that could conflict later:

```bash
which -a node
git config --global user.name
git config --global user.email
ls -la ~/.ssh
gh auth status
```

### 2. Node with nvm

```bash
touch ~/.zshrc
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
# open a new terminal, then:
nvm install --lts
nvm alias default 'lts/*'
nvm use default
```

Check with `node -v` and `which -a node`: the path should point into `~/.nvm`, not Homebrew.

### 3. pnpm

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.zshrc
pnpm -v
```

### 4. Git identities (optional, for personal and work accounts on one machine)

A global identity for personal projects and an override for a work folder:

```bash
git config --global user.name "<personal-name>"
git config --global user.email "<personal-email>"

git config --file ~/.gitconfig-work user.name "<work-name>"
git config --file ~/.gitconfig-work user.email "<work-email>"
git config --global 'includeIf.gitdir/i:~/work/.path' '~/.gitconfig-work'
```

Verify per folder with `git config --show-origin user.email`.

### 5. One SSH key per GitHub account

```bash
ssh-keygen -t ed25519 -C "<personal-email>" -f ~/.ssh/id_ed25519_personal
chmod 600 ~/.ssh/config
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_personal
pbcopy < ~/.ssh/id_ed25519_personal.pub     # paste into GitHub > Settings > SSH keys
```

`~/.ssh/config` should contain at least:

```
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
```

Test which account each key belongs to:

```bash
ssh -T -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes git@github.com
ssh -T -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes git@github.com
```

Each answers `Hi <account>! You've successfully authenticated`. Make git pick the right key per folder:

```bash
git config --global core.sshCommand "ssh -i ~/.ssh/id_ed25519_personal -o IdentitiesOnly=yes"
git config --file ~/.gitconfig-work core.sshCommand "ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes"
```

### 6. GitHub CLI with two accounts

```bash
gh auth login --hostname github.com --git-protocol ssh --web
gh auth status
gh auth switch --user <account>
```

### 7. Xcode and the iOS simulator

```bash
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS        # several GB, takes a while
xcodebuild -version
xcrun simctl list devices available
```

### 8. Java and Android Studio

```bash
brew install --cask zulu@17
brew install --cask android-studio
/usr/libexec/java_home -V
```

Add to `~/.zshrc`:

```bash
# Android / Java (Expo)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

```bash
source ~/.zshrc
java -version
open -a "Android Studio"       # install the SDK and create a virtual device in the setup wizard
ls $ANDROID_HOME
adb --version
```

The first Android build also installs the NDK and its licence by itself.

### 9. A physical Android phone (optional)

Enable developer options and USB debugging, connect the phone, then:

```bash
adb devices        # the phone should be listed as "device"
```

### 10. Expo account and Expo Go

Create an account on expo.dev and install **Expo Go** on the phone. Phone and Mac must be on the same Wi-Fi network.

### 11. VS Code (optional)

A dedicated profile keeps the extensions apart:

```bash
code --profile "Expo" --install-extension expo.vscode-expo-tools
code --profile "Expo" --install-extension dbaeumer.vscode-eslint
code --profile "Expo" --install-extension esbenp.prettier-vscode
```

### 12. Create the project

```bash
mkdir -p ~/dev/react-native && cd ~/dev/react-native
pnpm create expo-app <project-name>
```

Keep projects outside `Documents`, so iCloud does not sync `node_modules`.

## Part 2: Pitfalls

### Starting and connecting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Metro asks `Use port 8082 instead?` | Another Metro is already running on 8081 | Answer **n** and use the running one. Stop it with `lsof -ti :8081 \| xargs kill`. |
| `Ctrl+C` only beeps in Terminal | The window is not focused | Click inside it first, or use `Cmd+.`. |
| `Error: read ECONNRESET` during "Fetching Expo Go" | The download was interrupted | Press `a` or `i` again. |
| iOS stuck on Expo Go's "Loading 100%" | A hung JS runtime in the simulator. A long screen recording running in the simulator makes it worse. | Stop the recording, press `r`, close Expo Go and press `i`, or restart the Simulator. |
| `Cannot find native module 'ExpoAsset'`, or a blank screen after installing packages | Metro kept a stale module graph, or Expo Go is older than the installed packages | Restart with `pnpm start:go --clear` (or `pnpm start:dev --clear`). If it persists, delete `~/.expo/ios-simulator-app-cache` and `~/.expo/android-apk-cache` so the latest Expo Go is downloaded. |
| Phone cannot reach Metro | Different networks, or the network blocks device-to-device traffic | Same Wi-Fi, or `pnpm start --tunnel`. |

### Expo Go versus development build

| Symptom | Cause | Fix |
| --- | --- | --- |
| Pressing `i` gives `ios.bundleIdentifier is not found` | Installing `expo-dev-client` changed what a plain `pnpm start` does: it now targets the development build instead of Expo Go | Start with `pnpm start:go`, or press `s` to switch to Expo Go, then `i`. |
| Pressing `a` gives `No development build ... installed` | The Android build is missing or not finished | Run `npx expo run:android --no-bundler` first. |
| `pnpm android` / `pnpm ios` start a native build | Prebuild rewrote the scripts to `expo run:android` / `expo run:ios` | Use `pnpm start:go` or `pnpm start:dev` for daily work. |
| The first Android build is very slow | Gradle and the NDK are downloaded | Expect roughly 10 minutes once. Later builds are cached. |
| Android Studio opens its welcome screen by itself | Side effect of starting the emulator | Harmless, close it. |

### Packages and pnpm

| Symptom | Cause | Fix |
| --- | --- | --- |
| Red screen `<package> could not be found within the project` | The package was imported but never installed | Run `npx expo install <package>` and check `package.json`. |
| `npx expo install` ends with `ERR_PNPM_IGNORED_BUILDS` | pnpm 12 wants a decision about a dependency's build script, and the command exits non-zero. Expo then **skips adding the config plugin to `app.json`**. | Decide in `pnpm-workspace.yaml` (`allowBuilds: <pkg>: false`), then add the plugin to `app.json` by hand if it is missing. |
| `expo install` of a native module fails or half works | A package with native code needs a plugin entry and a rebuild | Check `app.json` `plugins`, restart Metro, rebuild the development build if needed. |
| A package works in Expo Go but the Android development build does not know it | The development build is your own app and only contains the native modules it was built with | Rebuild with `npx expo run:android --no-bundler`. After the first build this took about 30 seconds for `expo-sqlite`. |
| A helper library (Faker) adds to the production bundle | Anything reachable from the bundle ships. Behind `__DEV__` it was dropped, without it it ships (6.4 MB became 7.2 MB). | Decide on purpose. For a tool that must not ship, guard it with `__DEV__` and keep it a dev dependency. If it ships, make it a regular dependency and `require` it inside a function so it is only evaluated when used. |
| Sample-data buttons missing in a release build or after an OTA update | They were wrapped in `__DEV__`, which is `false` outside development | Expected for dev tools. Remove the guard, or use a build-time flag, if they must be there. |

### Routing

| Symptom | Cause | Fix |
| --- | --- | --- |
| Red underline on a new route in `href` | Typed routes in `.expo/types` are regenerated by Metro | Wait a moment or press `r`. |
| Route is `/state%20and%20hooks` | Spaces in a file name | Use kebab-case file names. |
| A card or link has no styling | `<Link asChild>` around a `Pressable` with a function `style` does not pass the style on | Use `router.push(...)` in `onPress`. |
| Deep link to a nested screen has nothing to go back to | The nested stack never opened its first screen | Export `unstable_settings = { anchor: "index" }` from that folder's `_layout.tsx`. |
| Code pasted into the wrong file | Several files are called `index.tsx` | Check the full path in the editor tab. |
| `zsh: no matches found` with a folder like `(exercises)` | Parentheses are special in zsh | Quote the path: `"src/app/(exercises)"`. |

### Notifications

| Symptom | Cause | Fix |
| --- | --- | --- |
| Red error in Expo Go on Android: `Android Push notifications ... was removed from Expo Go` | `expo-notifications` logs an error on import in Expo Go on Android since SDK 53 | Use a development build. In code, load it lazily and skip it in that environment. |
| `Requiring unknown module "<id>"` on Android | A dynamic `import()` loaded the module as a separate chunk that could not resolve its dependencies | Use a `require` inside the function instead, and restart Metro with `--clear`. |
| Android notification only appears in the shade, no pop-up | It used the fallback channel and was silent | Create a channel with `importance: MAX`, pass its `channelId` in the trigger and play a sound. |
| iOS shows no notification and the app says `Permission denied` | Permission was refused once | Simulator: Device > Erase All Content and Settings. |
| Tapping a notification does not open a screen | The handler only reads `data.url` when it is a string, and `useNotificationNavigation` must be mounted in a layout that exists after the navigators (here `(exercises)/_layout.tsx`) | Check that the scheduled content has `data: { url: "/some/route" }` and that the hook is still called. In Expo Go on Android nothing is loaded at all, so use the development build. |

### Camera and graphics

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find native module 'ExpoCamera'` | The installed development build was made before `expo-camera` was added | `npx expo prebuild --platform android`, then `npx expo run:android --no-bundler`. The same goes for Skia and any other native module. |
| `CameraView.isAvailableAsync` fails on Android or iOS | The docs list it for web only | Do not use it on native. The iOS simulator is detected with `Platform.OS === "ios" && !Device.isDevice`. |
| The iOS simulator shows "No camera is available here" | The iOS simulator has no camera at all | Expected. Use a real device or the Android emulator. |
| The Android emulator preview works but every photo is a black JPEG with a yellow timestamp | Measured: the saved file itself is black (1080x2169 and 1080x2100 on two AVDs, API 37 and API 35), with the camera set to webcam and to VirtualScene. Not caused by the viewer or by `skipProcessing`. Cause not found; there is a Google issue tracker entry about camera capture on Apple silicon, which could not be read without logging in. | Test photo capture on a real device. |
| `npx expo install @shopify/react-native-skia` ends with `ERR_PNPM_IGNORED_BUILDS` | pnpm wants a decision about the package's `postinstall` | Add `"@shopify/react-native-skia": true` to `allowBuilds` in `pnpm-workspace.yaml` and run `pnpm install`. The script only copies local binaries (checked in `scripts/install-libs.js`). |
| `react-hooks/immutability` error on `sharedValue.value = ...` | The React Compiler lint rule treats the shared value as immutable | Use `sharedValue.set(...)` and `sharedValue.get()`. |
| `SkPath.moveTo() is deprecated` | Paths are now built with a builder | `Skia.PathBuilder.Make().moveTo(...).lineTo(...).build()`. |
| Photos taken with the camera | They are files in the app's cache (`cache/Camera/<uuid>.jpg`), not in the gallery and not in memory | See them with `adb exec-out run-as com.plumotwerner.wernerexpo cat cache/Camera/<file>.jpg > photo.jpg`. |

### iOS 27 and Xcode 27

| Symptom | Cause | Fix |
| --- | --- | --- |
| `npx expo run:ios` builds but the app closes at once. The log says `UIScene life cycle is required for apps built with this SDK` | Xcode 27 builds against the iOS 27 SDK, which requires the UIScene life cycle. Expo SDK 57 generated a classic `AppDelegate` and no `SceneDelegate` (the crash report showed `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`). | **Solved by the upgrade to Expo SDK 58**: after deleting `ios/` and running `npx expo prebuild`, the project has `SceneDelegate.swift` and `UIApplicationSceneManifest` in `Info.plist`, and the app starts. |
| After an SDK upgrade `tsc` reports `ViewToken` or `'unspecified'` | React Native 0.88 renamed `ViewToken` to `ListViewToken` and `useColorScheme()` only returns `light`, `dark` or `null` | Import `ListViewToken` from `react-native` and use `scheme ?? 'light'`. |
| `expo-doctor` says `ios.icon - cannot access file at './assets/expo.icon'` | The check does not accept the `.icon` bundle, which is a folder. The folder exists and `expo prebuild` works. | Not fixed; it does not block anything seen so far. |
| `CocoaPods CLI not found` and two installs fail | `run:ios` installs CocoaPods itself, and a second `run:ios` started in parallel collides with it | Run one build at a time. CocoaPods ends up in `/opt/homebrew/bin/pod`. |

### The .NET API

| Symptom | Cause | Fix |
| --- | --- | --- |
| The dialog says `Cannot reach the API at ... Is it running?` | The API is not running, or the app uses an address that does not belong to its environment | Start it with `pnpm api` and check `curl http://localhost:5080/notes` on the Mac first. |
| It works on the iOS simulator but not on Android | The Android emulator's `localhost` is the emulator itself, not the Mac. The app now uses `http://localhost:5080` on both platforms (it replaced `http://10.0.2.2:5080`). | Run `adb reverse tcp:5080 tcp:5080` (repeat after every emulator restart). Without that command, only `http://10.0.2.2:5080` reaches the Mac. Measured: without the reverse `localhost:5080` fails and `10.0.2.2:5080` connects, with the reverse both connect. |
| The dialog fails in a release build although the API runs and the emulator can connect | Possibly the cleartext policy: the release manifest has no `usesCleartextTraffic` or network security config, the debug manifest enables it. This was **not** confirmed in a log: a release build wrote no cleartext message, and a missing `adb reverse` fails the same way. | Rule the other cause out first: check `adb reverse --list` and look for a `GET /notes` line in the API terminal. A request in the API terminal means the network is fine. If none arrives, use a development build or allow cleartext for the development hosts only with a network security config (a native change that changes the fingerprint). |
| A physical phone cannot reach it | The API listens on `localhost` only, and the phone has its own `localhost` | Bind the API to the network, set `EXPO_PUBLIC_API_URL` to the Mac's address, and allow the port in the macOS firewall. |
| The Long image list stays empty or `/images` answers 404 | `pnpm api` is still running the code from before the images endpoint was added | Stop it and start `pnpm api` again. The migrations then create `api/NotesApi/App_Data/images.db` with 2000 items. |
| The images are grey squares | The thumbnails come from picsum.photos, so the emulator needs internet | Check the emulator's connection. |
| The image viewer does not rotate with the device | `app.json` had `"orientation": "portrait"`, which is written into the native manifest (`android:screenOrientation="portrait"`). Changing it in JavaScript has no effect. | Set `"orientation": "default"`, run `npx expo prebuild --platform android` and rebuild. The manifest then has `unspecified`. All screens rotate, and an OTA update cannot change it. |
| `address already in use` on port 5080 | A previous `dotnet run` is still running | `lsof -ti :5080 \| xargs kill` |

### CI and OTA updates

| Symptom | Cause | Fix |
| --- | --- | --- |
| `tsc` passes locally but fails in CI on `*.css` imports | The CSS module types come from `expo-env.d.ts`, which Expo generates and git ignores | Commit `src/types/expo.d.ts` with `/// <reference types="expo/types" />` |
| The `Check for EXPO_TOKEN` step fails although `gh secret list` shows `EXPO_TOKEN` | The secret exists but its value is empty. The list shows names and dates, never values. | Set it again and check with a workflow run |
| `The bearer token is invalid` in the `Setup EAS` step | The secret holds something that is not an Expo access token, often clipboard text | Create a token on expo.dev, read it with `read -rs`, test it, then set the secret |
| `eas whoami` succeeds in a "token test" although the token is wrong | `EXPO_TOKEN="..."` on its own line is not exported, so the stored login was used | Put the assignment before the command on one line. A deliberately invalid token must fail. |
| A release build fails with `Metaspace` | The Gradle JVM runs out of metaspace during release-only tasks (KSP, lint) | The `plugins/with-gradle-memory.js` config plugin sets `org.gradle.jvmargs` on every prebuild |
| `Timeout waiting to lock journal cache` | A stale Gradle daemon from a failed build holds the lock | Stop the stale Gradle and Kotlin daemons and rebuild |
| An OTA update does not reach the installed app | The update's runtime version differs from the one embedded in the build, which happens after any native or config plugin change | Rebuild the release build, then publish again. Compare `assets/fingerprint` in the APK with `expo-updates fingerprint:generate`. |
| `r` in Metro changes nothing | The release build embeds its JavaScript and is not connected to Metro | Expected. Publish an update or rebuild. |
| A freshly built release build runs OLD code (the screen shows `Running OTA update: <id>`) | An update downloaded earlier is newer than the embedded manifest. `expo-updates` runs the newest compatible update by timestamp, and Gradle reused an old `app.manifest` (its `commitTime` was from the previous build) while it rebuilt the bundle. App data also survives an install over the old one. | Delete `android/app/build/generated/assets/createReleaseUpdatesResources` and rebuild, or `adb shell pm clear <package>` (wipes the notes), or publish the change as an OTA update. |

### Simulators and emulators

| Symptom | Cause | Fix |
| --- | --- | --- |
| No software keyboard in the iOS simulator | It uses the Mac keyboard | Device > Keyboard > Toggle Software Keyboard (`Option+Cmd+K`). `Cmd+K` is Keyboard Capture, which steals your typing; hold `Esc` to leave it. |
| The Android hardware back button does nothing in the emulator | It is a button in the emulator sidebar | Use the triangle button. |
| Android emulator shows a Gemini panel at startup | System overlay | Dismiss it, it is unrelated to the app. |

### Git and GitHub

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Permission denied to <work-account>` when pushing to a personal repository | The default SSH key belongs to the other account | Test with `ssh -T -i <key> -o IdentitiesOnly=yes git@github.com`, then set `core.sshCommand` per folder or, for one repository, `git config --local core.sshCommand "ssh -i <key> -o IdentitiesOnly=yes"`. |
| `gh` acts as the wrong account | Two accounts are logged in | `gh auth status`, then `gh auth switch --user <account>`. |
| Commits show the wrong author | The identity is global instead of per folder | Use `includeIf` (see Part 1, step 4) and check with `git config --show-origin user.email`. |
| Warning: `pnpm reset-project` | `scripts/reset-project.js` comes from the Expo template and moves or deletes the example screens | Do not run it in this project. |
