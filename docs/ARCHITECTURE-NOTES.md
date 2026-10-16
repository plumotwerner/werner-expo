# Architecture notes: brownfield React Native, OTA and tooling

Notes on brownfield React Native, OTA updates and tooling, written while building this project. Work in progress.

The topics are: a high level architecture of a **brownfield** app, **OTA updates**, **communication between native and React Native**, and **general React / React Native patterns and tooling**.

| Part | Status |
| --- | --- |
| 1. Brownfield: what it is | Written |
| 2. Brownfield: integrated versus isolated | Written |
| 3. The architecture diagram | Written (generic reference, assumptions listed) |
| 4. Native and React Native communication | Written |
| 5. OTA updates: concepts | Written |
| 5b. OTA updates: hands-on log | Layer A done, layer B (pipeline) done and confirmed on the device |
| 5c. The pipeline explained | Written |
| 5d. Accounts, tokens and cost | Written |
| 6. General React / React Native patterns and tooling | Written (with a list of what is not covered) |
| 7. Practice questions | Started |
| 8. Questions to ask the team (isolated approach) | Written, answers to fill in |

---

## 1. Brownfield: what it is

| Term | Meaning |
| --- | --- |
| Greenfield | A new project. This repository (`werner-expo`) is one. |
| Brownfield | A large existing native app (Swift / Kotlin, several teams) that adds React Native screen by screen instead of being rewritten. |

React Native is **a view inside a native screen**. The native app keeps ownership of the app lifecycle, and usually of navigation, login and analytics.

### Where `ios/` and `android/` are

```
greenfield (this repo)            brownfield
werner-expo/                      existing-app/
  package.json                      package.json     <- added
  src/                              index.js         <- added (RN entry point)
  android/  <- generated (CNG)      src/             <- added (RN screens)
  ios/      <- not built here       android/         <- the existing app, moved here
                                    ios/             <- the existing app, moved here
```

In a greenfield project with Expo, `android/` and `ios/` are **generated** from `app.json` and config plugins (Continuous Native Generation) and are git-ignored. In a brownfield project they are the existing native apps and are committed.

### What the native app does

1. Starts the React Native runtime once.
2. Loads the JavaScript bundle (from Metro in development, from a file in the app or from an OTA update in production).
3. Shows a React Native view inside a native screen (`ReactActivity` on Android, a `ViewController` on iOS), with initial properties.

### Why it is "a problem"

| Question | Why it is hard |
| --- | --- |
| How do we build together? | Gradle and CocoaPods on one side, npm on the other |
| Who owns what? | Native and React Native teams must not block each other |
| How do they talk? | Navigation, signed-in user, settings, events |
| How do we release? | Store release for native, possibly OTA for JavaScript |

---

## 2. Brownfield: integrated versus isolated

Source: the Expo brownfield documentation (overview, isolated approach, integrated approach). Expo marks brownfield support as **alpha**: "Not all Expo tools and services are compatible with existing native projects yet".

> A brownfield app is "an existing native app that was built using another technology, whose main entry point is *not* a React Native view."

### The two approaches

| | Isolated | Integrated |
| --- | --- | --- |
| Where the React Native code lives | A separate repository or monorepo | Inside the existing native project |
| What the native app receives | A **pre-built artifact** (AAR on Android, XCFramework on iOS) used like any dependency | React Native and Expo added **like a library**, built together with the app |
| Team structure | Separate native and React Native teams | One team that manages both |
| Impact on the native build | Minimal: pre-built artifacts | Direct: shared build process |
| Iteration | Looser coupling, slower to change both together | Faster when native and JavaScript change together |
| Native developers need | No Node.js and no React Native tooling | Gradle, CocoaPods, Kotlin / Swift, Metro, two dev environments |

Documented selection criteria:

- Choose **isolated** for "separate teams for native and React Native development", or to "minimize the impact of adding React Native on your existing native build process".
- Choose **integrated** when "you need to frequently iterate on both native and React Native code together".

### Isolated approach in detail

Tool: `expo-brownfield` (`npx expo install expo-brownfield`), configured through a plugin in `app.json` (this is also where versioning is set).

| Platform | Build | Artifact |
| --- | --- | --- |
| Android | `npx expo-brownfield build:android` | An **AAR** published to a Maven repository (local `~/.m2` by default) |
| iOS | `npx expo-brownfield build:ios` | **XCFrameworks** in `./artifacts`: the Expo project as a native library, plus the Hermes framework. Can also be packaged as a Swift Package. |

How the native app uses it:

| Platform | Steps |
| --- | --- |
| Android | Add the Maven dependency, create an activity extending `BrownfieldActivity`, call `showReactNativeFragment()` |
| iOS | Add the XCFrameworks, call `ReactNativeHostManager.shared.initialize()` in the `AppDelegate`, present `ReactNativeViewController` or `ReactNativeView` |

### Integrated approach in detail

The Expo project is created in the root of the existing app and the native code goes into `android/` and `ios/` subdirectories. Monorepos need custom Gradle and CocoaPods paths.

| Platform | What changes in the native project |
| --- | --- |
| Android | `settings.gradle` (autolinking), `build.gradle` (React Native Gradle plugin), `app/build.gradle` (project paths, Expo bundler), `gradle.properties` (new architecture, Hermes), `AndroidManifest.xml` (`INTERNET`, debug cleartext traffic), a `ReactActivity`, and the `Application` class initialising React Native |
| iOS | A `Podfile` with React Native and Expo autolinking, `pod install`, a build phase script that bundles JavaScript and assets into the app, `Info.plist` (`UIViewControllerBasedStatusBarAppearance` = `NO`), and a `ReactViewController` |

At development time Metro bundles the TypeScript and serves it over HTTP, as in a greenfield project.

### Relation to this repository

| This repository (greenfield) | Brownfield |
| --- | --- |
| `android/` is generated by `expo prebuild` and git-ignored (CNG) | `android/` and `ios/` are the existing apps and are committed |
| The app shell is Expo's | The app shell is the company's native app |
| One build produces the app | Isolated: two builds (JS artifact, native app). Integrated: one shared build. |

### How to choose, in an answer

> It depends on who owns what. With separate native and React Native teams, and a native build that must not be disturbed, I would use the **isolated** approach: the JavaScript side ships as a versioned artifact that native developers consume like any dependency, without Node tooling. If one team owns both and changes often cross the boundary, the **integrated** approach is simpler and faster, at the cost of native developers having to deal with Gradle, CocoaPods and Metro.

### Open points (not covered by the pages that were read)

| Question | Why it matters |
| --- | --- |
| How do OTA updates (`expo-updates`) fit each approach? | The runtime version must match the native artifact that was shipped |
| How does navigation hand over between native screens and React Native screens? | Back stack, deep links and the Android back button |
| How are the lifecycle listeners wired? | Expo has a separate page for it |
| How is state shared between native and React Native? | Signed-in user, settings |

---

## 3. The architecture diagram

A generic reference for adding React Native to a large existing native app. Nothing here describes a specific company: it lists **assumptions** and shows what to ask about.

### Assumptions to confirm first

| Assumption | Why it changes the diagram |
| --- | --- |
| One iOS app and one Android app, written in Swift / Objective-C and Kotlin / Java | Determines how React Native is hosted (view controller, activity or fragment) |
| Several native teams, one team that will own React Native | Pushes towards the isolated approach |
| Existing services for authentication, analytics, feature flags and networking live in native code | React Native must reuse them, not duplicate them |
| Native navigation owns the back stack | React Native screens are destinations, not the navigator |
| A store release cycle that cannot be broken | Defines what may ship over the air |

### The diagram

```
                        ┌──────────────────────── users: iOS and Android ───────────────────────┐
                        │                                                                        │
┌───────────────────────▼───────────────────────────────────────────────────────────────────────┐
│ NATIVE HOST APP  (existing, owned by native teams, released through the stores)                │
│                                                                                                │
│  ┌───────────────┐  ┌───────────────┐   ┌─────────────────────────────────────────────────┐   │
│  │ Native screens│  │ Navigation    │   │ Shared native services                          │   │
│  │ (existing)    │  │ + deep links  │   │ auth/session · analytics · feature flags ·      │   │
│  └───────┬───────┘  └──────┬────────┘   │ networking · secure storage · push · logging    │   │
│          │                 │            └──────────────▲──────────────────────────────────┘   │
│          └────────┬────────┘                           │ exposed through a typed contract      │
│                   │ opens a destination + initial props │                                      │
│  ┌────────────────▼─────────────────────────────────────┴──────────────────────────────────┐  │
│  │ INTEGRATION LAYER   (small, versioned, owned jointly)                                   │  │
│  │  RN host manager (starts runtime once) · host view (Activity/Fragment, ViewController)  │  │
│  │  native modules: Session, Navigation, Analytics, Events · lifecycle listeners           │  │
│  └────────────────┬────────────────────────────────────────────────────────────────────────┘  │
└───────────────────┼────────────────────────────────────────────────────────────────────────────┘
                    │ JSI / TurboModules  (JavaScript calls native, typed)
┌───────────────────▼────────────────────────────────────────────────────────────────────────────┐
│ REACT NATIVE  (Hermes runtime, one JS bundle, owned by the React Native team)                  │
│  screens / routes · state · API client · design system · feature code · tests                   │
└───────────────────┬────────────────────────────────────────────────────────────────────────────┘
                    │ HTTPS
              ┌─────▼───────┐
              │ Backend / API│   (shared with native)
              └─────────────┘

DELIVERY
  React Native repo ──CI──► artifact (AAR / XCFramework)  ──► native build consumes it   (isolated)
                     └────► JS bundle ──► OTA service ──► installed apps                  (JS only)
  Compatibility key: the runtime version = the version of the integration contract / native modules.

OBSERVABILITY      crash reporting · performance traces · analytics · OTA adoption (which update runs)
```

### How to read it, in the order to draw it

| # | Draw | Say |
| --- | --- | --- |
| 1 | The native host app as the outer box | "The native app stays the owner of lifecycle, navigation and the shared services. React Native lives inside it." |
| 2 | The shared native services inside it | "Authentication, analytics, flags and networking already exist. React Native should reuse them, not reimplement them." |
| 3 | The integration layer | "A small, versioned boundary: it starts the React Native runtime once, hosts a React Native view in a native screen and exposes the shared services as typed native modules." |
| 4 | The React Native box | "One Hermes runtime and one bundle, owned by one team. Screens are destinations that native navigation can open." |
| 5 | The arrows between native and React Native | "Calls go through JSI and TurboModules. The contract is typed and versioned." |
| 6 | The delivery path | "Native ships through the stores. React Native ships as an artifact for native to consume, and the JavaScript can also go over the air, bound to a runtime version." |
| 7 | Observability | "Crash reporting, performance and analytics across both sides, plus which update a device runs." |

### The flow of one screen

```
user taps a native tile
  -> native navigation resolves the destination "offers"
  -> integration layer opens the host view with route "offers" and initial props (user id, locale)
  -> React Native renders the screen
  -> it asks the Session module for a token, calls the API, renders the result
  -> user presses back: the native back stack pops the host view
```

### Decisions the diagram makes, and the trade-offs to defend

| Decision | Choice here | Trade-off |
| --- | --- | --- |
| Boundary granularity | Whole screens or flows, not small widgets | Fewer crossings and simpler navigation, but less reuse of fine-grained native UI |
| Who owns navigation | Native, React Native screens are destinations | Consistent back stack and deep links, but React Native cannot navigate freely between native screens |
| Shared state | Native owns session and settings, React Native asks through modules | One source of truth, but every shared value needs a module and a version |
| Runtime | One shared Hermes runtime started once | Fast screen opening and low memory, but a crash or leak affects all React Native screens |
| Build coupling | Isolated artifact for separate teams | Native build barely changes, but integration changes take a release of the artifact |
| Updates | OTA for JavaScript, store for native | Fast fixes, but the runtime version has to track the contract strictly |
| Startup | Initialise the runtime early or lazily | Early costs launch time and memory, lazy costs the first React Native screen |

### What to ask before committing to this diagram

| Question | Changes |
| --- | --- |
| Is there React Native in the app already? | Extend or start from nothing |
| UIKit or SwiftUI, XML layouts or Compose? | How the host view is embedded |
| One repository or several, and who owns the native build? | Integrated versus isolated |
| Is there an existing OTA or release tooling? | Whether `expo-updates`, another service, or none |
| How are sessions and feature flags exposed today? | Which native modules are needed |

---

## 4. Communication between native and React Native

> JavaScript and native run in two worlds. They talk through a typed, versioned contract.

### The four directions

| # | Direction | Mechanism | Example in this repository |
| --- | --- | --- | --- |
| 1 | JS calls native | A **native module** (TurboModule). A function that JavaScript calls and that returns a promise. | `db.getAllAsync(...)` (`expo-sqlite`), `scheduleNotificationAsync(...)` (`expo-notifications`) |
| 2 | Native tells JS | An **event emitter** that JavaScript subscribes to | `addNotificationResponseReceivedListener`, used in `useNotificationNavigation` |
| 3 | Native hands values over when it opens a screen | **Initial properties** of a React Native view | Brownfield: user id and locale when a screen is opened |
| 4 | Native draws, JS controls | A **native view** component (Fabric) | The date picker: `DateTimePicker` is a real native control |

### How a call travels

```
application JS  ->  JS wrapper (build/*.js)  ->  requireNativeModule('Name')  ->  Kotlin (Android) / Swift (iOS)
```

| Old architecture | Current (React Native 0.88 here) |
| --- | --- |
| An asynchronous **bridge**: messages serialised as JSON, queued, always asynchronous | **JSI**: JavaScript holds a direct reference to a native object and calls it |
| Every value was converted to text | No serialisation for the call itself |
| No type check at the boundary | **Codegen** produces the glue from typed descriptions |

The new architecture has been the default since React Native 0.76.

### What was observed in the installed packages

| Package | JS side | Native side | Direction |
| --- | --- | --- | --- |
| `expo-sqlite` | One native module: `ExpoSQLite` | Kotlin `NativeDatabase`, `NativeStatement`, `NativeSession` and Swift counterparts, with SQLite itself in C (`vendor/sqlite3`, plus a `sqlcipher` variant) | JS to native only, promise based |
| `expo-notifications` | More than eight native modules, for example `ExpoNotificationScheduler`, `ExpoNotificationPermissionsModule`, `ExpoNotificationChannelManager`, `ExpoNotificationPresenter`, `ExpoBadgeModule` | About 60 Kotlin files on Android. Adds the permissions `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED`. | **Both**: schedule from JS, and a response event back |

The counts come from the installed versions (`expo-notifications` 57.0.21, `expo-sqlite` 57.0.4) and can differ with other versions. The pattern does not.

### Consequences seen in this project

| Observation | Why |
| --- | --- |
| Adding `expo-sqlite` needed a new Android build (about 30 seconds once cached) | The development build is the project's own app and only contains native modules it was built with |
| `expo-notifications` cannot be imported in Expo Go on Android | Expo Go has a fixed set of native modules, and this one is blocked there. The screen loads it lazily and skips it in that environment. |
| A new native package cannot ship over the air | OTA replaces JavaScript only. The runtime version (fingerprint) changes with native modules, so the old binary does not accept the update. |
| A dynamic `import()` of `expo-notifications` failed with `Requiring unknown module` | It loaded as a separate chunk that could not resolve its dependencies. A `require` inside a function worked. |

### In a brownfield app

Native owns shared state. React Native asks for it and does not copy it.

| Need | Mechanism |
| --- | --- |
| Signed-in user | A **Session** module (token or user id), or initial properties when the screen opens |
| Open another screen or go back | A **Navigation** module that calls native navigation |
| Analytics | One **Analytics** module in native, called from JavaScript |
| React Native tells native something happened | An **event** or a module call |
| Native tells React Native something changed | An **event emitter** (for example the session changed) |

Contract rules:

| Rule | Why |
| --- | --- |
| Type it | The boundary is where mistakes are expensive. TypeScript on one side, Kotlin and Swift on the other. |
| Version it | A change breaks old binaries, so the runtime version must follow the contract |
| Keep calls coarse | Every crossing costs something, even with JSI |
| Pass ids and references, not large lists | Large payloads are slow and duplicate state |
| One owner per value | Two copies of the session drift apart |

### Pitfalls

| Pitfall | Effect |
| --- | --- |
| Many small calls in a loop | Slow, even with JSI. Batch them and keep the result in memory. |
| Large payloads across the boundary | Slow and memory heavy |
| An unversioned contract | A JavaScript update calls a function the installed binary lacks, and the app fails |
| Two sources of truth | The state drifts |
| Assuming a module exists everywhere | Expo Go on Android lacks `expo-notifications` |

---

## 5. OTA updates: concepts

**OTA (Over The Air)** replaces the JavaScript bundle of an installed app without a store release.

| Part of the app | Updated how |
| --- | --- |
| Native code (modules, manifest, permissions) | Store release only |
| JavaScript bundle and assets | OTA |

### The path of a new screen

```
developer: eas update        -> bundles JavaScript and assets, uploads to the EAS servers
server:    stores it as the newest update on a branch
app:       at launch asks "anything new for my runtime version and channel?"
app:       downloads it, uses it now or at the next launch
```

The same path with the actual parties, addresses and files:

```
developer / CI                    Expo update server            Expo asset CDN                 installed app
eas update
  1. exports the bundle (.hbc) and assets
  2. uploads the files ----------------------------------------> assets.eascdn.net
                                                                 (stored by content hash)
  3. registers an update ---------> u.expo.dev
                                    (database: branch "production"
                                     -> list of updates, newest is active)

                                                                                     at launch (expo-updates library):
  4.                              <------------------------------------------------- GET u.expo.dev/<project id>
                                                                                          expo-platform: android
                                                                                          expo-runtime-version: <fingerprint>
                                                                                          expo-channel-name: production
  5. picks: channel -> branch -> newest update with that runtime version
     answers with a MANIFEST ----------------------------------------------------->  update id, launchAsset.url, assets[]
  6.                                                  <---------------------------  GET asset URLs (only files it lacks)
  7.                                                                                  stores them in the app's private storage
                                                                                      runs them now or at the next launch
```

| Question | Answer |
| --- | --- |
| Who is "the server"? | Two parts. `u.expo.dev` knows the **metadata**: branches, which update is newest, which runtime version. `assets.eascdn.net` holds the **files**: the bundle and the images, addressed by a content hash. |
| Where is the bundle stored? | As a file on Expo's asset CDN. The file name is its content hash, which is why an unchanged asset is never uploaded twice ("reused 33 assets"). |
| Who asks? | The `expo-updates` native library inside the app, automatically at launch (`checkOnLaunch` is `ALWAYS` in the embedded manifest). Application JavaScript does not do it. |
| To whom does it ask? | To the URL in `updates.url` of `app.json`: `https://u.expo.dev/<project id>`. This URL was embedded into the build. |
| What exactly does it ask? | A plain HTTP GET with headers: platform, **runtime version**, **channel name** and the protocol version. |
| How does the server decide the answer? | The channel maps to a branch. Among that branch's updates it returns the newest one whose runtime version equals the one sent. |
| What does it answer with? | A **manifest**: the update ID, the URL of the launch asset (the bundle), and the list of assets with URLs. |
| What does the app do with it? | Compares the update ID with the one it runs. If different it downloads the bundle and only the assets it does not have, stores them, and uses them now or at the next launch. |

#### A real request and response

Reproduced with `curl`, using the same URL and headers that the app sends (the app also sends the ID of the update it currently runs):

```
GET https://u.expo.dev/<project id>
expo-platform: android
expo-runtime-version: 00a926ab0d70ac4e00c3aebd2e34be1ab879e7d7
expo-channel-name: production
expo-protocol-version: 1

HTTP/2 200
content-type: multipart/mixed; boundary=...
expo-update-id: 01a13691-8bdc-7edc-bc90-bd189d69a1c0
expo-manifest-filters: branchname="production"
```

The manifest in the body:

| Field | Value |
| --- | --- |
| `id` | `01a13691-8bdc-7edc-bc90-bd189d69a1c0` (the update that CI published) |
| `runtimeVersion` | `00a926ab0d70ac4e00c3aebd2e34be1ab879e7d7` |
| `launchAsset.url` | `https://assets.eascdn.net/<content hash>?project=<project id>` |
| `launchAsset.contentType` | `application/javascript` |
| number of `assets` | 33, each with an `assets.eascdn.net/<content hash>` URL |

This is the same ID that the app showed after its second launch.

The manifest protocol is the same one that Metro speaks in development (the `launchAsset.url` pointed to `localhost` or the LAN address then). In production the manifest comes from the update server and the files from the CDN.

Not verified here: how the downloaded files are laid out in the app's private storage (a release build is not debuggable, so it cannot be inspected with `run-as`).

### Vocabulary

| Term | Meaning |
| --- | --- |
| Update | A bundle plus assets |
| Branch | A list of updates, the newest is active |
| Channel | A property of a **build**, selects which branch the build follows |
| Runtime version | The contract between JavaScript and the native code of a build |

### Runtime version policies (expo-updates)

| Policy | Behaviour | Risk |
| --- | --- | --- |
| `appVersion` | Uses `version` from `app.json` | You must raise it yourself after a native change |
| `nativeVersion` | Version plus build number | Same, manual |
| `fingerprint` | Hash of everything that affects the native runtime | None of the above. Chosen here. |

### When does the user see the update

`fallbackToCacheTimeout` defaults to `0`.

| Situation | Result |
| --- | --- |
| Download finishes before the timeout | The new update runs immediately |
| It takes longer (including the default of 0) | The app starts with what it has, downloads in the background, uses the update at the **next launch** |
| Download fails | The newest cached update, or the update embedded at build time |

### What cannot be shipped OTA

New native modules, changed permissions, changed native config (`app.json` plugins). A JavaScript update that calls a native module the installed app lacks would crash, which is exactly what the runtime version prevents.

### Fast Refresh is not OTA

Fast Refresh and `r` are a development aid: Metro sends JavaScript to a connected device. A release build is not connected to Metro. It only changes through an update.

---

## 5b. OTA updates: hands-on log

Environment: Expo SDK 57, `expo-updates` 57.0.26, `eas-cli` 24.13, Android emulator, local release build (no EAS Build).

### Layer A: manual loop

| # | Step | Command |
| --- | --- | --- |
| 1 | Log in with the personal account | `npx eas-cli login` (browser flow), check with `npx eas-cli whoami` |
| 2 | Install the library | `npx expo install expo-updates` |
| 3 | Create and link the EAS project | `npx eas-cli init --account <account>` |
| 4 | Configure updates | `npx eas-cli update:configure` |
| 5 | Tune `app.json` by hand | see below |
| 6 | Regenerate the native project | `CI=1 npx expo prebuild --platform android --clean --no-install` |
| 7 | Build a release variant on the emulator | `npx expo run:android --variant release --no-bundler` |
| 8 | Verify the build | see "Checks" |
| 9 | Change the UI, publish | `npx eas-cli update --channel production --platform android --message "OTA test 1"` |
| 10 | Close and open the app twice | |
| 11 | Revert the change, publish again | `npx eas-cli update --channel production --platform android --environment production --message "OTA test 2: remove suffix"` |

### Step 3 and 4 output (abridged)

```
✔ Created @<account>/werner-expo
✔ Project successfully linked (ID: f588b052-3ede-4342-958b-b1ccd6c90dcb) (modified app.json)

✔ Configured updates.url to "https://u.expo.dev/f588b052-3ede-4342-958b-b1ccd6c90dcb"
✔ Configured runtimeVersion for Android and iOS with "{"policy":"appVersion"}"
```

`update:configure` chose `appVersion`. It was changed to `fingerprint`.

### Step 5: what `app.json` looks like afterwards

```json
{
  "expo": {
    "owner": "<account>",
    "extra": { "eas": { "projectId": "f588b052-3ede-4342-958b-b1ccd6c90dcb" } },
    "runtimeVersion": { "policy": "fingerprint" },
    "updates": {
      "url": "https://u.expo.dev/f588b052-3ede-4342-958b-b1ccd6c90dcb",
      "requestHeaders": { "expo-channel-name": "production" }
    }
  }
}
```

Without EAS Build there is no `eas.json` build profile that can carry a channel, so the channel is set through `updates.requestHeaders`.

### Checks on the release build

| Check | How | Result |
| --- | --- | --- |
| It is a release build | `adb shell dumpsys package <package>` has no `DEBUGGABLE` flag | Yes |
| Update settings are embedded | `aapt2 dump xmltree --file AndroidManifest.xml app-release.apk` | `ENABLED=true`, `CHECK_ON_LAUNCH=ALWAYS`, `LAUNCH_WAIT_MS=0`, `UPDATE_URL=https://u.expo.dev/<project id>`, headers `{"expo-channel-name":"production"}` |
| Runtime version in the app | The manifest holds `file:fingerprint`, a pointer to an asset | `7f6cc38069fd1c37ee1f0d257ef4c1a41c5e6045` |
| Same value for the project | `npx expo-updates fingerprint:generate --platform android` | `7f6cc38069fd1c37ee1f0d257ef4c1a41c5e6045` (equal) |

### Updates 1, 2 and 3: output

| | Update 1 | Update 2 | Update 3 |
| --- | --- | --- | --- |
| Message | `OTA test 1` | `OTA test 2: remove suffix` | `OTA test 3: show update id` |
| Change | Heading gets ` (OTA update 1)` | Suffix removed | Overview shows `Updates.updateId` |
| Branch | `production` | `production` | `production` |
| Runtime version | `7f6cc380…6045` | `7f6cc380…6045` | `7f6cc380…6045` |
| Update group ID | `88d9800b-0ffc-476b-b417-80f3b46c82ce` | `1f5439a5-10af-4d1c-92b4-f004f99ebad1` | `bc75d524-f8eb-4ce7-9596-e13928f93e23` |
| Android update ID | `01a135fe-b87f-789c-9ac5-8e73446ed10c` | `01a13661-e882-7eb3-b85d-c259842b8a5c` | `01a13670-c9fa-74de-ac8a-4724170f61fa` |
| Bundle | `entry-a9f940a2….hbc` (6.4 MB, Hermes bytecode) | `entry-57f89fef….hbc` (6.4 MB) | `entry-0cfc5593….hbc` (6.4 MB) |
| Assets | 33, **1 uploaded**, 33 reused | 33, **none uploaded** | 33, **none uploaded** |
| Commit shown | The repository's first commit, with `*` (the working tree had uncommitted changes) | same | same |

The full runtime version is `7f6cc38069fd1c37ee1f0d257ef4c1a41c5e6045` for all three.

Observations:

- The runtime version printed by `eas update` equals the fingerprint embedded in the build. This is the condition for the app to accept the update.
- Update 2 uploaded only the bundle. Assets are content-addressed, so unchanged assets are never uploaded again.
- The bundle is Hermes bytecode (`.hbc`), produced at publish time.
- The trailing `*` on the commit means the update was published from uncommitted changes.
- `[expo-cli] --non-interactive is not supported, use $CI=1 instead` is printed by the export step that `eas update` runs. It is harmless.
- `No environment variables ... found for the "production" environment` is informational: no variables are configured on EAS.

### What the device showed

Tested on the Android emulator with the release build. The developer reported that the observed behaviour matched the expectation at every launch.

| Launch | Expected | Observed |
| --- | --- | --- |
| 1st launch after update 1 | Old heading (download in the background) | As expected |
| 2nd launch | `React Native exercises (OTA update 1)` | As expected |
| 1st launch after update 2 | Still the suffix | As expected |
| 2nd launch | Suffix gone | As expected, heading `React Native exercises` (screenshot) |

The updates themselves are confirmed on the server: `eas update:list --all` lists "OTA test 1", "OTA test 2: remove suffix" and "OTA test 3: show update id" on branch `production`, all with the same runtime version.

Limit of the heading evidence: the heading after update 2 is identical to the heading of the embedded build, so a screenshot of it alone does not prove that an update was applied. The intermediate state (`(OTA update 1)`) rests on the developer's observation, not on a recorded artefact. The conclusive proof is the update ID shown by the app, below.

### Proof with `Updates.updateId`

`expo-updates` exposes two values in JavaScript:

| Value | Meaning |
| --- | --- |
| `Updates.updateId` | ID of the update that is running, `null` for the embedded bundle |
| `Updates.isEmbeddedLaunch` | `true` when the app runs the bundled JavaScript, `false` for an OTA update |

Shipping a screen that shows them **through an OTA update** proves the mechanism: the ID on screen must equal the `Android update ID` printed by `eas update`.

| Launch | Expected |
| --- | --- |
| 1st after publishing | Nothing new, the old bundle still runs |
| 2nd | `Running OTA update <id>` with the ID that `eas update` printed |

Status: **verified.**

| Source | Value |
| --- | --- |
| `Android update ID` printed by `eas update` for update 3 | `01a13670-c9fa-74de-ac8a-4724170f61fa` |
| ID shown by the app on the emulator (`Running OTA update: ...`) | `01a13670-c9fa-74de-ac8a-4724170f61fa` |
| Equal | Yes |

How the evidence fits together:

- The app showed the `Running OTA update: <id>` branch, so `Updates.isEmbeddedLaunch` was `false`: it was running a downloaded update, not the bundle shipped inside the APK.
- The ID on screen equals the one the server issued for update 3, and `eas update:list --all` lists that update on branch `production`.
- The proof rests on those two facts. It does **not** rest on the display code being absent from the build: the release build on the emulator was reinstalled at 20:03:47, shortly before update 3 was published, so its embedded bundle may already have contained the display. In that case the first launch would have shown the "bundled version" text, and only the launch after the download shows the update ID.

Server check on 2026-10-13: three updates exist on branch `production`, runtime version `7f6cc38069fd1c37ee1f0d257ef4c1a41c5e6045` for each.

Layer A (the manual loop) is complete: publish, launch twice, and the device runs the new bundle identified by the ID the server issued.

### Problems met on the way

| Problem | Cause | Fix |
| --- | --- | --- |
| Release build failed with `Metaspace` in `kspReleaseKotlin` and `lintVitalAnalyzeRelease` | The Gradle JVM ran out of metaspace; release builds run extra analysis that debug builds skip | Raised `org.gradle.jvmargs` to `-Xmx4096m -XX:MaxMetaspaceSize=1024m` in `android/gradle.properties` |
| Next build: `Timeout waiting to lock journal cache ... in use by another process` | Stale Gradle daemons left over from the failed build kept the lock | Stopped the stale Gradle and Kotlin daemons (`kill`, then `kill -9` for one that ignored SIGTERM) and rebuilt |
| The memory fix would be lost | `android/` is generated and git-ignored, so `prebuild --clean` resets it | A config plugin, `plugins/with-gradle-memory.js`, sets `org.gradle.jvmargs` on every prebuild. See "Config plugin for the Gradle memory" below. |
| `r` in Metro changes nothing on the release build | The release build embeds its JavaScript and is not connected to Metro | Expected. Only `eas update` changes it. |
| A new release build ran old code: the screen showed `Running OTA update: 01a13691-…` although the embedded bundle contained the new UI | The downloaded update was newer than the embedded one. The embedded `app.manifest` had a `commitTime` of 2026-10-13 18:22:13 UTC, the downloaded update was created at 18:41:10 UTC, and `expo-updates` runs the newest compatible update. Gradle had regenerated `index.android.bundle` but reused the old manifest (task `createReleaseUpdatesResources`), and app data survives an install over the old build. | Delete `android/app/build/generated/assets/createReleaseUpdatesResources` and rebuild, or `adb shell pm clear <package>`, or publish the change over the air so the newest update has the new code |
| A release build replaces the development build | Same package name | Rebuild the development build with `npx expo run:android --no-bundler` |

### Switching between the development build and the release build

Both builds have the same package name, so only one of them is on the emulator at a time and each install replaces the other.

| Goal | Command | Duration seen |
| --- | --- | --- |
| Live development (Metro, Fast Refresh) | `npx expo run:android --no-bundler` | about 30 seconds once cached |
| Test OTA like a user (embedded bundle, no Metro) | `npx expo run:android --variant release --no-bundler` | 2 min 36 s |

No `prebuild` is needed in between: `android/` stays, including the Gradle memory setting.

What to keep in mind when going back to the release build:

| Point | Explanation |
| --- | --- |
| The release build embeds the current working tree | A change made before the build is already inside it. For a fair OTA test: change code, build, **then** publish a **new** change with `eas update`. |
| App data survives an install over the old one | Downloaded updates stay on the device and `expo-updates` chooses between them and the embedded bundle. For a clean start run `adb shell pm clear <package>`, which also wipes the SQLite notes. |
| A native change changes the fingerprint | The new build gets a new runtime version, so earlier updates no longer match it. Publish again. |
| `r` in Metro does nothing for the release build | It is not connected to Metro. See the table above. |

### App variants (idea, not implemented)

The switching above is what teams avoid with **app variants**: a second package name for the release build, for example `<package>.preview`, selected through an `APP_VARIANT` environment variable in `app.config.js`. The development build and the release build then sit next to each other on the device.

| | Now | With variants |
| --- | --- | --- |
| Switching | Rebuild (30 s to 2.5 min) | Open another app |
| Cost | none | `app.config.js` and a second install |

### Config plugin for the Gradle memory

CNG rule: never edit generated files, encode the change as code that runs on every prebuild.

`plugins/with-gradle-memory.js`:

```js
const { withGradleProperties } = require("expo/config-plugins");

const KEY = "org.gradle.jvmargs";
const VALUE = "-Xmx4096m -XX:MaxMetaspaceSize=1024m";

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (modConfig) => {
    const properties = modConfig.modResults;
    const existing = properties.find((item) => item.type === "property" && item.key === KEY);
    if (existing) existing.value = VALUE;
    else properties.push({ type: "property", key: KEY, value: VALUE });
    return modConfig;
  });
};
```

Registered in `app.json` under `plugins` as `"./plugins/with-gradle-memory"`.

| Part | Role |
| --- | --- |
| `withGradleProperties` | A **mod**: gives the plugin the parsed `android/gradle.properties` as a list of entries |
| `modResults` | That list. The plugin edits it and returns the config. |
| `find` then `existing.value = ...` | Replaces the value if the key exists, so running prebuild twice never creates a duplicate |
| Import from `expo/config-plugins` | Resolvable from the project root under pnpm, unlike a direct `@expo/config-plugins` import |

How it was verified: the generated value was set back to the default `-Xmx2048m -XX:MaxMetaspaceSize=512m`, `expo prebuild --platform android` was run, and the file contained `-Xmx4096m -XX:MaxMetaspaceSize=1024m` exactly once. A `prebuild --clean` followed by a release build was not re-run.

**Consequence for OTA: the fingerprint changed.** The plugin is part of the native configuration, so the runtime version changed:

| | Value |
| --- | --- |
| Before the plugin (embedded in the installed build, updates 1 to 3) | `7f6cc38069fd1c37ee1f0d257ef4c1a41c5e6045` |
| After the plugin (computed for the project now) | `00a926ab0d70ac4e00c3aebd2e34be1ab879e7d7` |
| Number of fingerprint sources | 52 became 53 (`plugins/with-gradle-memory.js` with reason `expoConfigPlugins`, and `app.json` content) |

So an update published from now on carries a runtime version that the **installed build does not accept**. A new release build is needed before the next OTA test. This is the mechanism working as designed: native configuration changed, so old binaries must not receive JavaScript that was made for the new one.

### Layer B: pipeline

`.github/workflows/eas-update.yml`, triggered by a push to `main` or by hand (`workflow_dispatch`).

```
verify   : checkout, pnpm, node, install --frozen-lockfile, tsc --noEmit, expo lint
publish  : (needs verify) token check, install, print the runtime version,
           eas update --branch production --platform android --environment production --message "<commit message>"
```

| Design choice | Reason |
| --- | --- |
| `publish` needs `verify` | A broken build is never published |
| Commit message passed through an environment variable | A quote in a message cannot break or inject into the shell command |
| `--frozen-lockfile` | CI installs exactly the versions of `pnpm-lock.yaml` |
| The runtime version is printed before publishing | It can be compared with the one embedded in a build |
| `concurrency` group | A newer push replaces a publish that has not started |

Question checked before trusting the pipeline: does the fingerprint depend on the generated `android/` folder that CI does not have? Measured on the Mac with `android/` moved away: **the hash is identical** (`00a926ab0d70ac4e00c3aebd2e34be1ab879e7d7`), only the number of sources differs (53 against 52).

#### Result of the first successful run

| | Value |
| --- | --- |
| Run | `38448467139`, both jobs green |
| Branch | `production` |
| Runtime version | `00a926ab0d70ac4e00c3aebd2e34be1ab879e7d7` (same as the embedded one in the rebuilt release build) |
| Update group ID | `a825aa03-7ed1-42f0-9853-2355a71fd6da` |
| Android update ID | `01a13691-8bdc-7edc-bc90-bd189d69a1c0` |
| Commit | The commit that added the committed Expo type reference, without `*`: published from a clean commit |
| Message | `Manual run` (a manual dispatch has no commit message) |

#### Confirmed on the device

| Moment | What the app showed | Meaning |
| --- | --- | --- |
| 1st launch after the run | `Running the bundled version` | The embedded bundle runs, the update is downloaded in the background (`fallbackToCacheTimeout` is 0) |
| 2nd launch | `Running OTA update: 01a13691-8bdc-7edc-bc90-bd189d69a1c0` | The downloaded update runs |
| ID printed by the CI run | `01a13691-8bdc-7edc-bc90-bd189d69a1c0` | Identical |

So the whole chain was observed: push or dispatch, GitHub Actions verifies and publishes, EAS stores the update, the installed release build downloads it and runs it, and the ID on screen equals the ID the server issued. No local build or manual `eas update` was involved.

#### Problems met on the way

| # | Symptom | Cause | Fix |
| --- | --- | --- | --- |
| 1 | `tsc` failed in CI on `animated-icon.module.css` and `global.css`, but passed locally | The type reference for CSS imports comes from `expo-env.d.ts`, which Expo generates and which is git-ignored. A fresh checkout does not have it. | Committed `src/types/expo.d.ts` with `/// <reference types="expo/types" />`. Reproduced locally by hiding `expo-env.d.ts` first. |
| 2 | `expo lint` failed on a template file | `react-hooks/set-state-in-effect` in the web hydration hook | Replaced the `useEffect` + `setState` with `useSyncExternalStore` |
| 3 | `if [ -z "" ]` in the token check | `gh secret set` was given an empty value: the hidden prompt does not show whether a paste arrived. `gh secret list` shows the secret name and a date, never the value, so it looked fine. | Verify with a run, not with the list |
| 4 | `The bearer token is invalid` in `Setup EAS` | The secret held text that was not a token (terminal output from the clipboard) | Create a token and read it with `read -rs`, check its length, test it with `EXPO_TOKEN=... eas whoami`, then set the secret |
| 5 | My `whoami` test succeeded with a wrong token | `EXPO_TOKEN="$(pbpaste)"` on its own line sets a shell variable that is **not exported**, so `eas` used the stored login instead | Put the assignment in front of the command on **one line**. A deliberately invalid token proves the variable takes precedence. |

How the token was handled: read with `read -rs` (hidden, not stored in shell history), tested for length and validity, written to the GitHub secret via stdin with `printf %s`, then removed with `unset`. `gh secret list` only ever shows names and timestamps.

Possible next iterations (not done): a gate that compares the project fingerprint with the one of the last build and warns when a store build is needed; a robot user instead of a personal token; separate branches for `staging` and `production`.

---

## 5c. The pipeline explained

File: `.github/workflows/eas-update.yml`.

### Where it runs

Nothing runs on the developer's machine and nothing needs to be installed there.

```
developer machine            GitHub                          Expo (EAS)
git push  ------------->  receives the commit
                          reads .github/workflows/*.yml
                          starts a temporary VM (the runner) ---> eas update uploads
                          runs the steps                          the bundle and assets
                          discards the VM
```

| Question | Answer |
| --- | --- |
| Where does it run? | On GitHub's servers, in a temporary virtual machine |
| Which machine? | `runs-on: ubuntu-latest`, a **GitHub-hosted runner** |
| Is a runner installed locally? | No. That would be a *self-hosted runner*, which has to be installed and registered. There is none. |
| What is on the machine? | Nothing of ours. Every job starts empty, so the steps install Node, pnpm, EAS and the dependencies. |
| What does it receive? | The code (the `Checkout` step) and the `EXPO_TOKEN` secret, injected for the duration of the run |
| How long does it live? | For one job, then it is thrown away |

Consequence: the runner only sees what is in git. Generated and ignored files (`expo-env.d.ts`, `android/`) do not exist there, which is why `tsc` first failed in CI and passed locally.

### Header of the file

| Part | Meaning |
| --- | --- |
| `on: push` to `main` | Runs on every push to `main` |
| `on: workflow_dispatch` | Can also be started by hand (`gh workflow run eas-update`) |
| `concurrency` with `cancel-in-progress: true` | A newer push cancels a run that is still going, so two updates are not published in parallel |
| `permissions: contents: read` | Least privilege: the pipeline can read the repository, not write to it |
| `env: NODE_VERSION, PNPM_VERSION` | Same versions as the local machine, to avoid "works on my machine" |

### Job 1: `verify` (is the code fine?)

| Step | What it does |
| --- | --- |
| `Checkout` | Fetches the exact commit that triggered the run |
| `Setup pnpm` | Installs pnpm 12.9.1 |
| `Setup Node` | Installs Node 24 and caches the pnpm store for the next run |
| `Install dependencies` | `pnpm install --frozen-lockfile`: installs exactly what `pnpm-lock.yaml` says and **fails** if `package.json` disagrees |
| `Typecheck` | `tsc --noEmit` |
| `Lint` | `expo lint` |

### Job 2: `publish` (ship it)

`needs: verify` is the gate: this job only starts when `verify` succeeded. When `tsc` failed, the publish job showed as *skipped* and nothing reached the servers.

| Step | What it does |
| --- | --- |
| `Check for EXPO_TOKEN` | Fails fast with a readable message when the secret is empty |
| `Checkout`, `Setup pnpm`, `Setup Node` | Repeated: **each job gets its own fresh machine** |
| `Setup EAS` | Installs `eas-cli` and logs in with the token. It validates it with `eas whoami`. |
| `Install dependencies` | Same frozen install |
| `Show the runtime version` | Prints the fingerprint that the update will carry |
| `Publish update` | `eas update --branch production --platform android --environment production --non-interactive --message ...` |

| Flag | Meaning |
| --- | --- |
| `--branch production` | The branch that the release build follows through its channel |
| `--platform android` | Only Android, the only build that exists |
| `--environment production` | The EAS environment, answered up front so that nothing is asked |
| `--non-interactive` | Nobody is there to answer questions |
| `--message "${COMMIT_MESSAGE:-Manual run}"` | The commit message, or `Manual run` for a manual dispatch |

The commit message goes through the `COMMIT_MESSAGE` environment variable and is never interpolated into the command. A quote or `$(...)` in a commit message therefore cannot change what the step does.

### Where the update ends up after `eas update` in the publish job

The runner only builds and sends. It keeps nothing.

| # | Log line (run of the publish step) | What happens | Where it is |
| --- | --- | --- | --- |
| 1 | `Android Bundled ... (1911 modules)` | Metro bundles the code | Memory of the runner |
| 2 | `_expo/static/js/android/entry-<hash>.hbc (6.4MB)` | The bundle is turned into Hermes bytecode and written to disk | A `dist/` folder on the **runner** |
| 3 | `Exported: dist` | The export is complete | Same folder |
| 4 | `Uploaded 1 app bundle`, `Uploaded assetmap.json` | The files are sent to Expo | Expo's **asset CDN** (`assets.eascdn.net`) |
| 5 | `Published!` and an update ID | A record is created: newest update on branch `production` | Expo's **update server** (`u.expo.dev`) |
| 6 | (the job ends) | The runner is discarded, `dist/` with it | Gone |

| Place | Holds the update? | Why |
| --- | --- | --- |
| Expo asset CDN | **Yes** (the files) | Uploaded in step 4 |
| Expo update server | **Yes** (the reference and metadata) | Registered in step 5 |
| The GitHub runner | Only until the job ends | `dist/` is temporary |
| The Git repository | No | `dist/` is git-ignored and no step commits or pushes |
| GitHub Actions artifacts | No | The workflow has no `upload-artifact` step, and the artifact count is 0 |
| The developer's machine | No | Nothing runs there |

Consequences:

| Consequence | Explanation |
| --- | --- |
| Expo, not GitHub, is the source of truth for what was published | Deleting the repository does not remove a published update |
| The bundle cannot be downloaded from GitHub | To go back, publish again or roll back on the server |
| The bundle is derived, so it is not in git | Same principle as the generated `android/` folder |
| Builds are reproducible | The same commit and the same lockfile give the same bundle, hence `--frozen-lockfile` |
| Archiving is a deliberate choice | Add an `upload-artifact` step only if reproducing without Expo is required |

### Whole picture

```
push to main
  runner (Ubuntu VM)
    verify:  checkout -> pnpm -> node -> install -> tsc -> lint
                 | succeeds
    publish: token check -> checkout -> pnpm -> node -> EAS login
             -> install -> print runtime version -> eas update
                 uploads to the EAS servers
                    the installed release build downloads it at its next launch
```

### Cost and visibility

| | |
| --- | --- |
| Cost | GitHub bills runner minutes. Private repositories have a free allowance, check it on the plan in use. |
| Where to look | Repository, **Actions**, workflow `eas-update`, or `gh run list` and `gh run view <id> --log` |

### Docs-only commits

Every push to `main` publishes an update. A documentation-only commit then publishes a useless update. Two ways to avoid it:

| | `[skip ci]` in the commit message | `paths-ignore` in the workflow |
| --- | --- | --- |
| Relies on discipline | Yes | No |
| Mixed commit (docs and code) | Skips the code too | Runs, because code changed |

`[skip ci]` is used for now.

---

## 5d. Accounts, tokens and cost

### Why an account and a token

> An account is who you are. A token is how a program acts as you without your password.

| | Account (user) | Access token |
| --- | --- | --- |
| What it is | The identity that owns things | A revocable credential for automation |
| What it owns or does | The project, its updates, channels, branches, billing and limits | Lets a machine call the Expo API as that account |
| Used by | A person, interactively | The pipeline, where nobody can log in |

The update URL in the app (`https://u.expo.dev/<project id>`) belongs to a project, which belongs to an account. The token does not create a second identity. It is a key to that one account. The CI log shows it: `<account> (authenticated using EXPO_TOKEN)`.

| Option for the pipeline | Why not |
| --- | --- |
| The account password | Gives access to everything, including account and billing settings. A machine cannot complete two-factor login. |
| Logging in on the runner | There is no browser, and the machine lives for minutes |
| **A token** | Revocable on its own, no password exposed, can be created per purpose |

Same pattern elsewhere: a GitHub user and a personal access token, an SSH key for a machine, and the automatic `GITHUB_TOKEN` inside a workflow.

| Now | In a team |
| --- | --- |
| A **personal access token**: can do everything the account can | A **robot user** with only the rights the pipeline needs |
| Tied to one person | Neutral identity: the pipeline keeps working when that person leaves |

### Token handling rules used here

| Rule | How it was done |
| --- | --- |
| Never in the repository or in a chat | Stored only as a GitHub Actions secret |
| Never typed on a command line | Read with `read -rs` (hidden, not in shell history), then piped to `gh secret set` |
| Verify before storing | Check the length, then `EXPO_TOKEN="..." eas whoami` on **one line** |
| `gh secret list` does not prove the value | It shows names and dates only. A run proves it. |
| Remove it from the shell afterwards | `unset TOKEN` |

### What costs money, and what was used

Checked from the machine where possible. Billing data itself was **not** visible, so the plan and payment method must be verified on the two billing pages.

| Part | Used in this project | Cost |
| --- | --- | --- |
| GitHub repository | Public | Free |
| GitHub Actions | 4 runs of a few minutes on `ubuntu-latest` | Free for public repositories. Private repositories have a monthly allowance. |
| GitHub secret | One (`EXPO_TOKEN`) | Free |
| Expo account and project | Free plan | Free |
| `eas update` | Four publications of about 6.4 MB each | Within the free allowance as far as known. The exact limits were **not** fetched and change over time. |
| EAS Build | **Not used.** All builds were local (Gradle, own Android SDK). | None |
| Apple Developer Program | Not used. No physical iPhone, no store, no signing. | Not applicable |

The expensive part of this stack is usually EAS Build in the cloud, and it was deliberately not used.

### How to be sure nothing can be billed

A service cannot charge when no payment method is attached to the account.

| Where | What to check |
| --- | --- |
| GitHub: Settings, Billing and plans | Plan is Free, no payment method |
| Expo: Account settings, Billing | Plan is Free, no card attached |
| Expo: Account settings, Receipts | Empty |

### What is not known

| Unknown | Why |
| --- | --- |
| The exact GitHub plan | The token used for the checks has no `user` scope, so the billing API returned 404 |
| Whether a payment method is attached on either service | Same |
| Current free limits of EAS Update | Not fetched |
| Whether a personal team on Expo has its own plan | It has its own billing page |

### When cost does appear

| What | When |
| --- | --- |
| EAS Build in the cloud | When `eas build` is used |
| Many updates and many users | A real production app |
| A private repository with many Actions minutes | Above the monthly allowance |
| Apple Developer Program (about 99 USD per year) | Only for a physical iPhone or the App Store |

---

## 6. General React and React Native patterns and tooling

What is listed as "used" below was checked in this repository. What is listed as "not covered" is knowledge, not experience from this project.

### Patterns used here

| Pattern | Where | Why it matters |
| --- | --- | --- |
| Function components and hooks (`useState` 30 uses, `useEffect` 6, `useCallback`, `useSyncExternalStore`) | All screens | The React model, the same as on the web |
| **Derived values are not state** | `canSubmit` in the form, `isButtonDisabled` in notifications | A second state can drift out of step. A value that can be computed is computed. |
| Controlled inputs | `TextInput` with `value` and `onChangeText` | One source of truth for the field |
| Effects that clean up | The countdown timer, the `BackHandler` and notification listeners | A leaked interval or listener outlives the screen |
| Guarding async results | `isCurrent` flag in the notes list effect | A late promise must not write to an unmounted screen |
| Data layer outside the UI | `src/db/notes-database.ts`, `src/api/notes-api.ts` | The screen knows three functions, not SQL or `fetch` |
| A hook that wraps a concern | `useNotificationNavigation` | The tap handling lives once and is mounted in a layout |
| Lazy loading of a native module | `src/utils/notifications.ts` (`require` inside a function) | A module that fails to load in one environment cannot break the whole app |
| Platform differences handled where they occur | `Platform.select`, `Platform.OS` (12 uses), `*.web.tsx` and `*.web.ts` files | Not write once run anywhere |
| File-based routing, typed routes, route groups, nested stacks, `anchor` | `src/app/` | Navigation is the file tree, and typos in routes are type errors |
| Gestures with a non-gesture alternative | Swipe and long press, plus visible edit and delete icon buttons with `accessibilityLabel` | A gesture is never the only way |
| Lists with `FlatList` and stable keys | Notes screen | Only visible rows are rendered |
| **A sliding window over server data** | `use-image-window.ts`, `page-window.ts`, Long image list | Memory stays at three pages of 50 whatever the size of the data. `getItemLayout` (fixed row height) makes the scroll position and `scrollToIndex` exact without measuring, and rows without data show a spinner. |
| Pure logic split from the hook | `src/utils/page-window.ts` | The window arithmetic can be checked without React or a device |
| Event-driven state instead of an effect | The window is pruned in the scroll callback | The React Compiler lint rule rejects `setState` in an effect, and the event is the real cause |
| A screen outside the navigator | `src/app/image-viewer.tsx` at the root, not in the drawer | Full screen, no header, closes with the back action |
| Errors surfaced to the user | `try / catch / finally` in notifications and the sample dialog | Failure becomes a readable message and the button is released |
| Measure before optimising | Perf Monitor and the Profiler | Development mode is not representative, so compare before and after |

### Tooling used here

| Tool | Role in this project |
| --- | --- |
| TypeScript, `strict: true`, typed routes | Errors at build time, `Href` rejects unknown routes |
| ESLint with `eslint-config-expo` | Includes the React hooks and React Compiler rules (it caught `setState` in an effect) |
| React Compiler (`reactCompiler: true`) | Memoises automatically, so manual `useMemo` and `useCallback` are rarely needed |
| Metro | Bundler and development server |
| Expo CLI, `expo-doctor`, Expo Router | Running, routing, project checks |
| Config plugins and CNG | Native configuration as code, `android/` generated and git-ignored. `"orientation"` in `app.json` ends up in the native manifest: changing it needs a prebuild and a new build, not an OTA update. |
| Development build, `expo-dev-client` | The project's own Expo Go with its native modules |
| EAS Update and `expo-updates` | Over-the-air JavaScript updates with a fingerprint runtime version |
| GitHub Actions | `tsc` and lint, then publish, from a clean machine |
| React Native DevTools (Profiler, Components, Performance) and the Perf Monitor | Measuring renders and frame rate |
| `adb`, `xcrun simctl`, `aapt2` | Reaching into emulators and APKs: ports, URLs, manifests |
| pnpm with a frozen lockfile | Reproducible installs |

### State: what to reach for

Only local state and SQLite are used here. These are the usual choices and when they apply.

| Kind of state | Typical tool | Rule of thumb |
| --- | --- | --- |
| Local to one component | `useState`, `useReducer` | Start here |
| Shared by a small subtree | Lift the state, or Context | Context is fine for rarely changing values such as a theme or session |
| Shared across the app, changes often | A store such as Zustand or Redux Toolkit | Selectors avoid re-rendering everything that reads the context |
| Server data (caching, retries, refetching) | A query library such as TanStack Query | Do not hand-write loading and error state for every request |
| Must survive a restart or work offline | SQLite or key-value storage | This is what the notes screen does |
| Secrets | A secure store (Keychain, Keystore) | Never plain storage |

### Not covered in this project

| Area | What it would look like | Why it was left out |
| --- | --- | --- |
| **Automated tests** | Unit and component tests with Jest and React Native Testing Library, end to end with Maestro or Detox, run in the `verify` job | No test library is installed. This is the largest gap. |
| **Error boundaries and crash reporting** | An error boundary around route groups and a crash reporting service | There is no `ErrorBoundary` in `src` |
| **Secure storage** | `expo-secure-store` for tokens | The project has no user session |
| **A global state library** | Zustand or Redux Toolkit | One screen owns its state, so none was needed |
| **Server-state library** | TanStack Query | One manual fetch |
| **Internationalisation** | A library and string catalogues | The interface is in English only |
| **Store release and code signing** | EAS Build, certificates, store listings | Builds were local and no store was targeted |
| **Analytics and monitoring of OTA adoption** | Events plus which update each device runs | Only the update id is shown on screen |

### How to talk about it

> What I can point to: derived state, effects with cleanup, a data layer outside the UI, platform differences handled at the point of difference, typed navigation, gestures with an accessible alternative, measurements before optimisation, and a pipeline that verifies before it publishes. What I did not build: automated tests, error boundaries and secure storage, and I would add tests to the `verify` job first.

---

## 7. Practice questions

### OTA

**What does the developer run to publish an update, and what does that command not build?**
`eas update`, for example `eas update --channel production --message "..."`. It bundles the JavaScript and assets and uploads them. It does not build an app: no `.apk` or `.ipa` and nothing for the store. The native code does not change.

**What is the runtime version and why does it exist?**
It describes the contract between the JavaScript and the native code of a build. An update only runs on an app with exactly the same runtime version. It exists to prevent crashes: JavaScript that calls a native module the installed app does not have would fail, so such an app never receives that update. With the `fingerprint` policy it is derived from a hash of everything that affects the native runtime.

**An update downloads slowly. What does the user see?**
The app waits at most `fallbackToCacheTimeout`. With the default of 0 it does not wait at all: it starts with the version it has, downloads in the background and uses the update at the next launch. The user sees the old version, no spinner and no error. If the download fails the app runs the newest cached update or the one embedded at build time.

**Which change cannot go OTA?**
Anything that touches native code: adding a package with native code (for example `expo-notifications` or `expo-sqlite`), changing permissions, or changing native configuration in `app.json`. These need a new store build.

**Why is Fast Refresh not OTA?**
Fast Refresh is a development aid in which Metro pushes JavaScript to a connected device. OTA is a production mechanism in which an installed app fetches a bundle from a server. A release build has no Metro connection.

### CI/CD pipeline for OTA

**Where does the workflow run, and is anything installed on your machine?**
It runs on a GitHub-hosted runner: a temporary Ubuntu virtual machine that GitHub starts for the job and discards afterwards. Nothing is installed locally. A self-hosted runner would be a machine I install and register myself, and I have none.

**What does the runner contain when a job starts?**
Nothing of mine. It receives the code through `Checkout` and the secrets for the duration of the run. Every job gets its own fresh machine, so each job installs Node, pnpm and the dependencies itself.

**Why two jobs, and what does `needs: verify` do?**
`verify` runs the typecheck and lint. `publish` ships the update. `needs` makes `publish` start only when `verify` succeeded, so a broken build is never published. When `tsc` failed in CI the publish job was skipped.

**Why `pnpm install --frozen-lockfile`?**
It installs exactly the versions in the lockfile and fails if `package.json` disagrees. CI then tests the same dependencies I tested locally, and nothing changes silently.

**Where is the Expo token and how is it protected?**
In a GitHub Actions secret. It is not in the repository, and GitHub masks it in the logs. The workflow has `permissions: contents: read`, so the pipeline cannot write to the repository either. A robot user with limited rights would be better than a personal token in a team.

**Why does the commit message go through an environment variable?**
Interpolating `${{ github.event.head_commit.message }}` straight into a `run:` command would put attacker-controlled text into a shell script. Through an environment variable it stays data. A quote or `$(...)` in a commit message cannot change what the step does.

**What does `concurrency` with `cancel-in-progress` do?**
Two pushes close together do not produce two parallel publishes: the newer run cancels the older one if it is still running.

**`tsc` passed locally and failed in CI. Why?**
`expo-env.d.ts` is generated by Expo and git-ignored. My machine had it, a fresh checkout does not, and it supplies the types for CSS imports. I reproduced it locally by hiding the file, then committed the same type reference as `src/types/expo.d.ts`.

**How do you know the update on the device is the one the pipeline published?**
The app shows `Updates.updateId`. The ID on the device equals the `Android update ID` printed in the CI log and listed by `eas update:list`. `Updates.isEmbeddedLaunch` is false for an OTA launch.

**Does the pipeline give a different runtime version than your machine?**
I measured it: the fingerprint is identical with and without the generated `android/` folder, and CI printed the same value that was embedded in the build (`00a926ab…`).

**What does the pipeline deliberately not do?**
Build a new native binary. A native change (new package, permission, config plugin) changes the fingerprint, so the old binary would not accept the update anyway. That needs a deliberate build and store release.

**How would you stop a native change from being "published" pointlessly?**
Store the fingerprint of the last released build, compute the current one in CI and compare. If they differ, fail or warn that a store build is needed instead of publishing an update nobody can receive.

**What is the trade-off of `[skip ci]` versus `paths-ignore`?**
`[skip ci]` depends on someone remembering it and skips a mixed commit entirely. `paths-ignore` is structural and still runs when code changed in the same commit.

**GitHub-hosted versus self-hosted runner?**
Hosted: no maintenance, clean machine every time, billed per minute, no access to a private network. Self-hosted: access to internal systems and macOS or special hardware, but you maintain and secure it, and a persistent machine can leak state between runs.

### React and React Native patterns and tooling

**What is the difference between state and a derived value, and why does it matter?**
A derived value can be computed from other state, for example `canSubmit` from the name and role. Storing it as a second state risks the two drifting apart. Compute it during render instead.

**When does an effect need a cleanup function?**
Whenever it starts something that outlives a render: an interval, a subscription or a listener. The countdown timer clears its interval, and the `BackHandler` and notification listeners are removed, otherwise they keep running after the screen is gone.

**How do you avoid setting state after a screen has gone away?**
Guard the async result. The notes list sets an `isCurrent` flag in the effect and clears it in the cleanup, so a late promise does not write state.

**How do you structure data access in a screen?**
Keep SQL and `fetch` out of the component. The screen calls a few functions from a data layer, which receives the database as an argument. That keeps the screen about presentation and the data layer testable.

**How do you handle platform differences?**
At the point where they occur: `Platform.select` for values and styles, `Platform.OS` for a different interface, and platform files such as `.web.tsx` when the whole file differs. Avoid scattering checks.

**Why does a gesture need an alternative?**
A gesture is invisible and not available to everyone. Swipe to delete is paired with a visible delete button that has an accessibility label, so the action is discoverable and works with a screen reader.

**What does the React Compiler change in your code?**
It memoises components and values automatically, so manual `useMemo` and `useCallback` are rarely needed. Its lint rules also flag patterns it cannot optimise, such as a synchronous `setState` in an effect.

**How do you decide where state lives?**
Start local. Lift it or use context for a small subtree. Use a store when many distant components read and write often. Use a query library for server data, and storage for anything that must survive a restart. Secrets go to a secure store.

**How do you find a performance problem?**
Measure first, in a release build where it matters, because development mode is slower. The Perf Monitor shows the JS and UI frame rate, the Profiler shows which components rendered and why, and the result is compared before and after a change.

**What would you add to this project first?**
Automated tests, in the `verify` job of the pipeline, then an error boundary with crash reporting. The project has neither today.

**What does your CI do and what does it not do?**
It installs from a frozen lockfile, runs `tsc` and lint, and publishes an OTA update only when those pass. It does not run tests, because there are none, and it does not build native binaries.

### Native and React Native communication

**How does JavaScript talk to native code?**
Through native modules. JavaScript calls a function exposed by a native module and gets a promise back. On the current architecture this goes through JSI, so JavaScript holds a direct reference to a native object instead of sending JSON over an asynchronous bridge.

**How does native talk to JavaScript?**
Through events that JavaScript subscribes to, such as a notification response, and through initial properties handed over when a React Native view is shown.

**What is the difference between the old bridge and JSI?**
The bridge serialised every message to JSON, queued it and was always asynchronous. JSI lets JavaScript call native objects directly, without serialisation for the call itself, and Codegen gives the boundary types.

**Give an example from your own app of each direction.**
JS to native: `db.getAllAsync` of `expo-sqlite` and `scheduleNotificationAsync` of `expo-notifications`. Native to JS: `addNotificationResponseReceivedListener`, used to open a screen when the user taps a notification. A native view: the date picker.

**Why did adding `expo-sqlite` need a new build and not an OTA update?**
It is a native module. The installed binary does not contain it, and OTA only replaces JavaScript. The fingerprint changes with native modules, so an old binary does not accept the update.

**In a brownfield app, who owns the signed-in user, and how does React Native get it?**
Native owns it. React Native asks a Session module for a token or user id, or receives it as initial properties. Copying the session into JavaScript would create two sources of truth.

**What rules would you set for the boundary?**
Type it, version it, keep calls coarse, pass ids rather than large lists, and give every value one owner.

**What happens if JavaScript calls a native function the installed app does not have?**
It fails at runtime. That is why updates are bound to a runtime version, which has to follow the contract.

**What can go wrong with many small native calls?**
Each crossing has a cost even with JSI, so a loop of small calls is slow. Batch them and keep the result in memory.

### The architecture diagram

**Walk me through the architecture.**
The native app stays the owner of lifecycle, navigation and the shared services such as authentication, analytics, feature flags and networking. A small integration layer starts the React Native runtime once, hosts a React Native view inside a native screen, and exposes the shared services to JavaScript as typed native modules. React Native code runs in one Hermes runtime with one bundle and is owned by one team. Native ships through the stores. React Native ships as a versioned artifact for native to consume, and its JavaScript can also be updated over the air, bound to a runtime version.

**Who owns navigation, and why?**
Native, in this design. React Native screens are destinations that native navigation opens. That keeps one back stack, consistent deep links and the Android back button predictable. The cost is that React Native cannot move freely between native screens.

**How does a React Native screen get the signed-in user?**
Native owns the session. React Native asks a Session module for a token or a user id, or receives it as initial properties when the screen is opened. Duplicating the session in JavaScript would create a second source of truth.

**What happens when the user presses back on a React Native screen?**
The host view is a normal native screen on the native back stack, so the native back stack pops it. Inside a React Native flow with several screens, a nested navigator handles back and only the first screen hands back to native.

**What are the risks of one shared runtime?**
A crash or memory leak in React Native code affects all React Native screens, and the runtime has a startup and memory cost. Starting it early costs launch time, starting it lazily costs the first React Native screen.

**What would you measure after launch?**
Crash rate of React Native screens against native ones, time to first screen, bundle size, memory, and OTA adoption: which update each device runs.

### Where an update is stored

**After `eas update` in CI, where does the update live?**
On Expo's servers, in two parts: the files (bundle and assets) on the asset CDN, addressed by a content hash, and the metadata on the update server (branch, newest update, runtime version). The CI runner only had a temporary `dist/` folder and is discarded. Nothing is stored in the Git repository or in GitHub artifacts.

**Who asks for updates, and to whom?**
The `expo-updates` library inside the installed app, automatically at launch. It sends an HTTP GET to the `updates.url` that was embedded in the build, with the platform, the runtime version and the channel name as headers. It is not application JavaScript.

**How does the server decide which update to return?**
The channel maps to a branch, and among that branch's updates it returns the newest one whose runtime version equals the one the app sent. If none matches, the app keeps what it has.

**What does the server answer with?**
A manifest: the update ID, the URL of the launch asset (the bundle) and the list of assets with URLs. The app downloads the bundle and only the assets it does not have, stores them, and runs them now or at the next launch.

**Why is an unchanged asset never uploaded twice?**
Assets are stored under the hash of their content. The same content has the same name, so it already exists.

### Accounts, tokens and cost

**Why do you need both an account and a token?**
The account is the identity that owns the project, the updates and the billing. The token is a revocable credential that lets the pipeline act as that account without a password. It is not a second identity, it is a key to the same one. A password would give far more access than needed, and a machine cannot complete a two-factor login.

**How would you secure the token in a team?**
Use a robot user with minimal permissions instead of a personal token, so the pipeline does not depend on one person and a leak does limited damage. Keep it in the CI secret store, never in the repository, and revoke it from the provider when it is no longer needed.

**What would running this setup cost?**
Almost nothing. The repository was public, and Actions on public repositories is free. Builds were local, so no EAS Build. OTA publications stayed within the free allowance as far as I could tell. The costs to watch are EAS Build in the cloud, many users on updates, and the Apple Developer Program if a store release is needed.

**How do you verify that nothing can be billed?**
Check the billing pages of both services: plan Free and no payment method attached, and empty receipts. Without a payment method a service cannot charge.

**What do you not know about the cost?**
The exact plan and payment status of the two accounts, because the API access used did not include billing scope, and the current free limits of EAS Update. Those have to be checked on the billing pages.

### Brownfield

**What is a brownfield app?**
An existing native app, built with another technology, whose main entry point is not a React Native view. React Native is added to it screen by screen instead of rewriting the app. A greenfield app uses React Native from the start.

**What is the difference between the integrated and the isolated approach?**
Integrated: the React Native code lives inside the native project, and React Native and Expo are added like a library and built together with the app. Isolated: the React Native code lives in its own repository and is packaged as an AAR (Android) and an XCFramework (iOS), which the native app consumes as a normal dependency.

**When would you choose isolated?**
When native and React Native are owned by separate teams, or when the existing native build must be disturbed as little as possible. Native developers then need no Node.js or React Native tooling.

**When would you choose integrated?**
When one team owns both and native and JavaScript change together often. It is simpler and faster to iterate, but native developers need to handle Gradle, CocoaPods, Kotlin or Swift and Metro, and the two build systems must be kept in sync.

**What does the native app do in a brownfield setup?**
It starts the React Native runtime once, loads the JavaScript bundle (Metro in development, a file in the app or an OTA update in production), and shows a React Native view inside a native screen: a `ReactActivity` or fragment on Android, a view controller on iOS, with initial properties.

**What are the practical problems of brownfield?**
Building two worlds together (Gradle and CocoaPods next to npm), who owns what, how the two sides talk (navigation, signed-in user, settings, events), and how releases are coordinated (store release for native, possibly OTA for JavaScript).

**Why is this a different problem from this repository?**
Here `android/` is generated from `app.json` and plugins and git-ignored. In a brownfield project `android/` and `ios/` are the existing apps and are committed, so a native configuration change cannot be a config plugin that regenerates them. The app shell belongs to the company, not to Expo.

**What is the status of Expo's brownfield support?**
Alpha. Not all Expo tools and services are compatible with existing native projects yet, so I would verify OTA updates and lifecycle handling before committing to it.

### One sentence

> OTA replaces the JavaScript bundle, not the app. The runtime version is the contract between the two, and it guarantees that an update only runs on an app that can handle it.

> The pipeline verifies first and publishes only when verification passed, from a clean machine that sees only what is in git, with a token that never appears in the repository.

> Brownfield means React Native lives inside someone else's native app. Isolated ships it as a versioned artifact for separate teams, integrated builds it together with the app for one team.

---

## 8. Questions to ask the team (isolated approach)

Follow-up questions that only make sense when React Native is built separately and consumed by the native app as an artifact. Fill in the answers, then adjust the assumptions in section 3.

| # | Question | Why it matters | Answer |
| --- | --- | --- | --- |
| 1 | Where are the artifacts published (a Maven repository, Artifactory, a Swift Package, ...) and how are they versioned? | How the native app pulls in a new React Native version, and how a rollback works | |
| 2 | Who builds the artifact, and with which tool: `expo-brownfield`, custom scripts, or plain React Native? | Whether Expo is part of the build at all | |
| 3 | How do over-the-air updates fit into a built artifact? Is `expo-updates` inside it, or is there another mechanism? | The whole OTA story: where updates are hosted and who may publish | |
| 4 | How is the runtime version tied to the native app? | The safety check that stops an update from reaching a binary that cannot run it | |
| 5 | When does a user get a JavaScript change: through a new artifact in a store release, or over the air? | How fast a fix reaches users, and what needs a release | |
| 6 | How does the native team test the artifact? Is there a sample app that integrates it? | Quality at the boundary and who finds integration problems | |

### Questions that apply to any approach

| # | Question | Why it matters | Answer |
| --- | --- | --- | --- |
| 7 | Which EAS services are used (Build, Update, Submit), or is there own build and release tooling? | Whether the pipeline in this repository resembles the real one | **No EAS.** Custom build and release pipelines. Details unknown. |
| 8 | How are session, feature flags and analytics exposed to React Native today, and can it reuse them? | Which native modules the contract needs | **A custom bridge** between native and React Native, chosen per use case. Example: feature flags are owned by native and React Native reads them through the bridge. |
| 9 | Who may publish an update, is there an approval step, and how is a bad update rolled back? | Governance and risk | |
| 10 | How is adoption monitored: which update does each device run? | Observability of the OTA channel | |

### Follow-ups after the first answers

| # | Question | Why it matters | Answer |
| --- | --- | --- | --- |
| 11 | Are JavaScript changes shipped outside store releases at all, and by what mechanism, given that EAS Update is not used? | The OTA story may not apply, or may be custom | |
| 12 | How is the bridge defined, typed and versioned? Are calls synchronous or promise based, and how does JavaScript learn that a value (a feature flag) changed? | Whether the contract is a list of functions, events or both, and how breaking changes are handled | |
| 13 | How do React Native developers run and test a screen without the native host app: is the bridge mocked, and is there a sample host? | The development loop and what the CI of the React Native repository can verify | |

### How the first answers change the picture

| Earlier assumption | After the answers |
| --- | --- |
| The delivery path uses `expo-updates` and EAS | Not necessarily. Builds and releases run on custom pipelines, so the mechanism is not EAS. The principles hold: a bundle, a version contract between JavaScript and native, a compatibility check, and a rollback. |
| Native modules are Expo modules | A **custom bridge** takes that role. It is the integration layer of the diagram, and the "native owns shared state, React Native asks for it" rule is confirmed by the feature flag example. |
| The pipeline in this repository mirrors the real one | It is a **model of the mechanics**, not a copy. Concept mapping: EAS Update corresponds to the custom delivery mechanism, a channel to an environment, the fingerprint runtime version to the bridge contract version, GitHub Actions to the custom pipelines. |
