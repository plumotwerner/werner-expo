import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StatusBar, StyleSheet, View } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Black full-screen image. It closes with the button at the top left, with a
// swipe to the left or right, or with the system back action.
export function FullScreenImageViewer({ uri }: { uri: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const swipeToClose = Gesture.Fling()
    .direction(Directions.LEFT | Directions.RIGHT)
    .runOnJS(true)
    .onEnd(() => router.back());

  return (
    <GestureDetector gesture={swipeToClose}>
      <View style={styles.container}>
        <StatusBar hidden />
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close image"
          hitSlop={12}
          style={[
            styles.closeButton,
            { top: insets.top + 12, left: insets.left + 16 },
          ]}
          onPress={() => router.back()}
        >
          <SymbolView
            name={{ ios: "xmark", android: "close", web: "close" }}
            tintColor="white"
            size={20}
          />
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  image: { flex: 1 },
  closeButton: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
});
