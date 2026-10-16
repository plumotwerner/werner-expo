import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function NavigationDetailsScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          Alert.alert("Go back?", "Are you sure you want to go back?", [
            { text: "Stay", style: "cancel" },
            { text: "Go back", onPress: () => router.back() },
          ]);
          return true;
        },
      );
      return () => subscription.remove();
    }, [router]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details</Text>
      <Text>This screen sits on top of the first screen of the stack.</Text>

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonLabel}>Back</Text>
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
  button: {
    backgroundColor: "royalblue",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonLabel: { color: "white", fontSize: 18 },
});
