import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function NavigationHomeScreen() {
  const router = useRouter();
  const [note, setNote] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation</Text>
      <Text>This is the first screen of its own screen stack.</Text>

      <TextInput
        style={styles.input}
        placeholder="Type something here"
        value={note}
        onChangeText={setNote}
      />

      <Pressable
        style={styles.button}
        onPress={() => router.push("/navigation/details")}
      >
        <Text style={styles.buttonLabel}>Go to details</Text>
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
  input: {
    width: 240,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "royalblue",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonLabel: { color: "white", fontSize: 18 },
});
