import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export type NotificationsModule = typeof import("expo-notifications");

export const isExpoGoOnAndroid =
  Platform.OS === "android" &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Importing expo-notifications logs an error in Expo Go on Android (SDK 53+).
// A require inside a function only evaluates the module when it is first called,
// so the rest of the app keeps working. A dynamic import() would load it as a
// separate bundle chunk, which fails to resolve its dependencies on Android.
export function loadNotifications(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require, see above
  return require("expo-notifications");
}
