import { Platform, StyleSheet, Text, View } from "react-native";

const backHint = Platform.select({
  ios: "Swipe from the left edge to go back",
  android: "Use the Android back button or back gesture",
  default: "Use the browser back button",
});

export default function PlatformScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>I am running on {Platform.OS}</Text>
        <Text>Version: {Platform.Version}</Text>
        <Text style={styles.hint}>{backHint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e5e5",
    padding: 24,
  },
  card: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  title: { fontSize: 22, fontWeight: "bold" },
  hint: { color: "gray" },
});
