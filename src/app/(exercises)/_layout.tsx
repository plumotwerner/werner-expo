import { Drawer } from "expo-router/drawer";

import { useNotificationNavigation } from "@/hooks/use-notification-navigation";

export default function ExercisesLayout() {
  useNotificationNavigation();

  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{ drawerLabel: "Overview", title: "Overview" }}
      />
      <Drawer.Screen
        name="flexbox"
        options={{ drawerLabel: "20 · Flexbox", title: "Flexbox" }}
      />
      <Drawer.Screen
        name="state-and-hooks"
        options={{
          drawerLabel: "21 · State and hooks",
          title: "State and hooks",
        }}
      />
      <Drawer.Screen
        name="platform"
        options={{ drawerLabel: "22 · Platform", title: "Platform" }}
      />
      <Drawer.Screen
        name="form"
        options={{ drawerLabel: "23 · Form", title: "Form" }}
      />
      <Drawer.Screen
        name="navigation"
        options={{ drawerLabel: "25 · Navigation", title: "Navigation" }}
      />
      <Drawer.Screen
        name="notifications"
        options={{ drawerLabel: "26 · Notifications", title: "Notifications" }}
      />
      <Drawer.Screen
        name="notes"
        options={{ drawerLabel: "27 · Notes", title: "Notes" }}
      />
      <Drawer.Screen
        name="long-image-list"
        options={{
          drawerLabel: "28 · Long image list",
          title: "Long image list",
        }}
      />
      <Drawer.Screen
        name="camera"
        options={{ drawerLabel: "29 · Camera", title: "Camera" }}
      />
      <Drawer.Screen
        name="skia"
        options={{ drawerLabel: "30 · Skia graphics", title: "Skia graphics" }}
      />
    </Drawer>
  );
}
