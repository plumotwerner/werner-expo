import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import * as Device from "expo-device";
import { useIsFocused, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// The iOS simulator has no camera. The Android emulator does (a virtual scene
// or the laptop webcam), so only iOS is checked. `CameraView.isAvailableAsync`
// is documented for web only and cannot be used here.
const hasNoCamera = Platform.OS === "ios" && !Device.isDevice;

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takePhoto() {
    if (isTakingPhoto || !cameraRef.current) return;
    setIsTakingPhoto(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      router.push({ pathname: "/photo-viewer", params: { uri: photo.uri } });
    } catch (takeError) {
      setError(
        takeError instanceof Error
          ? takeError.message
          : "Taking the photo failed",
      );
    } finally {
      setIsTakingPhoto(false);
    }
  }

  if (hasNoCamera) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          No camera is available here. The iOS simulator has none: use a real
          device, or the Android emulator with its webcam enabled.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          The camera needs your permission to show a preview.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Only one preview may be active, so it is unmounted when the screen
          is not focused (for example while the photo is shown). */}
      {isFocused && (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          disabled={isTakingPhoto}
          style={({ pressed }) => [
            styles.shutter,
            pressed && styles.shutterPressed,
          ]}
          onPress={takePhoto}
        >
          {isTakingPhoto && <ActivityIndicator />}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
          style={styles.flip}
          onPress={() =>
            setFacing((current) => (current === "back" ? "front" : "back"))
          }
        >
          <SymbolView
            name={{
              ios: "arrow.triangle.2.circlepath.camera",
              android: "flip_camera_android",
              web: "flip_camera_android",
            }}
            tintColor="white"
            size={28}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  camera: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  message: { textAlign: "center", fontSize: 16 },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#111111",
  },
  primaryButtonText: { color: "#ffffff", fontWeight: "600" },
  error: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    color: "#ffffff",
    backgroundColor: "rgba(176, 0, 32, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  shutterPressed: { backgroundColor: "#dddddd" },
  flip: {
    position: "absolute",
    right: 32,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});
