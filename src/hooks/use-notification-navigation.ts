import type { NotificationResponse } from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";

import { isExpoGoOnAndroid, loadNotifications } from "@/utils/notifications";

/**
 * Opens the screen named in a tapped notification's `data.url`.
 * Covers a tap while the app runs and a tap that launched the app.
 */
export function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    if (isExpoGoOnAndroid) return;

    const Notifications = loadNotifications();
    const handledIds = new Set<string>();

    function openScreenOf(response: NotificationResponse | null) {
      if (!response) return;

      const { identifier, content } = response.notification.request;
      if (handledIds.has(identifier)) return;
      handledIds.add(identifier);

      const url = content.data?.url;
      if (typeof url === "string") {
        router.push(url as Href);
      }
    }

    Notifications.getLastNotificationResponseAsync().then(openScreenOf);
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openScreenOf);

    return () => subscription.remove();
  }, [router]);
}
