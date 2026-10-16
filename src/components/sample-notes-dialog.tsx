import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type SampleNotesSource = "faker" | "server";

type SourceOption = {
  value: SampleNotesSource;
  label: string;
  description: string;
};

const SOURCE_OPTIONS: SourceOption[] = [
  {
    value: "faker",
    label: "Faker",
    description: "100 generated sentences, created on the device",
  },
  {
    value: "server",
    label: "Server",
    description: "50 notes from the .NET API on localhost",
  },
];

type SampleNotesDialogProps = {
  visible: boolean;
  isBusy: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: (source: SampleNotesSource) => void;
};

export function SampleNotesDialog({
  visible,
  isBusy,
  errorMessage,
  onCancel,
  onConfirm,
}: SampleNotesDialogProps) {
  const [source, setSource] = useState<SampleNotesSource>("faker");

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Add sample notes</Text>
          <Text style={styles.subtitle}>Where should the notes come from?</Text>

          <View accessibilityRole="radiogroup" style={styles.options}>
            {SOURCE_OPTIONS.map((option) => {
              const isSelected = option.value === source;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  disabled={isBusy}
                  style={styles.option}
                  onPress={() => setSource(option.value)}
                >
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {errorMessage !== null && (
            <Text style={styles.error}>{errorMessage}</Text>
          )}

          <View style={styles.actions}>
            <Pressable disabled={isBusy} onPress={onCancel}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={isBusy}
              style={[styles.confirm, isBusy && styles.confirmDisabled]}
              onPress={() => onConfirm(source)}
            >
              <Text style={styles.confirmLabel}>
                {isBusy ? "Adding..." : "Add notes"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  dialog: {
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "white",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "gray" },
  options: { gap: 12, marginTop: 4 },
  option: { flexDirection: "row", alignItems: "center", gap: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "royalblue",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "royalblue",
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: "bold" },
  optionDescription: { color: "gray" },
  error: { color: "tomato" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
  },
  cancelLabel: { color: "gray", fontSize: 16 },
  confirm: {
    backgroundColor: "royalblue",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmLabel: { color: "white", fontSize: 16 },
});
