import { Platform } from "react-native";

// Same address on both platforms.
// iOS simulator: shares the host's network, so localhost is the Mac.
// Android emulator: localhost is the emulator itself. It only reaches the Mac
// after `adb reverse tcp:5080 tcp:5080`, which has to be repeated whenever the
// emulator restarts. This replaces the earlier http://10.0.2.2:5080, the
// emulator's alias for the host, which needed no command.
// Release builds do not enable plain http in their manifest (cleartext policy).
// If the request fails there, first check that the reverse is set and whether
// the API log shows a request.
const DEFAULT_API_URL = Platform.select({
  android: "http://localhost:5080",
  default: "http://localhost:5080",
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
