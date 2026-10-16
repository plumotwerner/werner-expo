import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ROLES = ["Developer", "Designer", "Manager"] as const;
type Role = (typeof ROLES)[number];

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB");
}

export default function FormScreen() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [birthDate, setBirthDate] = useState(new Date(1970, 0, 1));
  const [summary, setSummary] = useState("");

  const canSubmit = name.trim() !== "" && role !== null;

  function openAndroidDatePicker() {
    DateTimePickerAndroid.open({
      value: birthDate,
      mode: "date",
      maximumDate: new Date(),
      onValueChange: (_event, selectedDate) => setBirthDate(selectedDate),
    });
  }

  function submit() {
    setSummary(`${name} (${role}), born on ${formatDate(birthDate)}`);
  }

  function clear() {
    setName("");
    setRole(null);
    setBirthDate(new Date(1970, 0, 1));
    setSummary("");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.roles}>
          {ROLES.map((option) => (
            <Pressable
              key={option}
              style={[styles.chip, role === option && styles.chipSelected]}
              onPress={() => setRole(option)}
            >
              <Text style={role === option && styles.chipLabelSelected}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Date of birth</Text>
        {Platform.OS === "android" ? (
          <Pressable style={styles.input} onPress={openAndroidDatePicker}>
            <Text>{formatDate(birthDate)}</Text>
          </Pressable>
        ) : (
          <DateTimePicker
            value={birthDate}
            mode="date"
            maximumDate={new Date()}
            onValueChange={(_event, selectedDate) => setBirthDate(selectedDate)}
          />
        )}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit}
          onPress={submit}
        >
          <Text style={styles.buttonLabel}>Save</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={clear}>
          <Text style={styles.buttonLabel}>Clear</Text>
        </Pressable>

        {summary !== "" && <Text style={styles.summary}>{summary}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "white" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "white",
  },

  label: { fontSize: 16, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roles: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "royalblue",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: "royalblue" },
  chipLabelSelected: { color: "white" },
  button: {
    backgroundColor: "royalblue",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: "white", fontSize: 18 },
  summary: { fontSize: 16, marginTop: 8 },
});
