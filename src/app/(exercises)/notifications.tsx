import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import {
  isExpoGoOnAndroid,
  loadNotifications,
  type NotificationsModule,
} from "@/utils/notifications";

const DELAY_SECONDS = 5;
const ANDROID_CHANNEL_ID = "default";
const TARGET_ROUTE = "/navigation/details";

async function requestPermission(
  Notifications: NotificationsModule,
): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export default function NotificationsScreen() {
  const [status, setStatus] = useState("Nothing scheduled yet");
  const [seconds, setSeconds] = useState(DELAY_SECONDS);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const isButtonDisabled = isScheduling || isCountingDown;

  useEffect(() => {
    if (!isCountingDown) return;

    let remaining = DELAY_SECONDS;
    const timer = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        setIsCountingDown(false);
        setStatus("Notification sent");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown]);

  async function scheduleNotification() {
    if (isExpoGoOnAndroid) {
      setStatus(
        "Not available in Expo Go on Android. Use a development build.",
      );
      return;
    }

    setIsScheduling(true);
    try {
      const Notifications = loadNotifications();

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (!(await requestPermission(Notifications))) {
        setStatus("Permission denied");
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hello from werner-expo",
          body: "Tap to open the navigation details screen.",
          data: { url: TARGET_ROUTE },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: DELAY_SECONDS,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
      setStatus(`Notification scheduled in ${DELAY_SECONDS} seconds`);
      setSeconds(DELAY_SECONDS);
      setIsCountingDown(true);
    } catch (error) {
      console.warn("Notifications unavailable", error);
      setStatus(
        "Not available here. Expo Go on Android needs a development build.",
      );
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.status}>{status}</Text>

      <Pressable
        style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
        disabled={isButtonDisabled}
        onPress={scheduleNotification}
      >
        <Text
          style={isCountingDown ? styles.buttonLabelBusy : styles.buttonLabel}
        >
          {isCountingDown
            ? `Sending in ${seconds}...`
            : `Send in ${DELAY_SECONDS} seconds`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "white",
  },
  title: { fontSize: 28, fontWeight: "bold" },
  status: { textAlign: "center" },
  button: {
    backgroundColor: "royalblue",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonLabel: { color: "white", fontSize: 18 },
  buttonLabelBusy: { color: "black", fontSize: 16 },
});
