/// <reference types="expo/types" />

// expo-env.d.ts has the same reference, but Expo generates it and it is
// git-ignored, so a fresh checkout (CI) would not have it. This committed copy
// makes `tsc` work without running the Expo CLI first. It supplies the types for
// *.css and *.module.css imports, among others.
