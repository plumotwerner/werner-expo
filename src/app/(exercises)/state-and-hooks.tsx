import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function StateScreen() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name ? `Hello ${name}` : "Hello"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.count}>{count}</Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => setCount(count + 1)}
      >
        <Text style={styles.buttonLabel}>Count up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
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
  count: { fontSize: 64, fontWeight: "bold" },
  button: {
    backgroundColor: "royalblue",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonPressed: { opacity: 0.6 },
  buttonLabel: { color: "white", fontSize: 18 },
});
