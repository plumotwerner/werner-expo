import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ListNavigationBarProps = {
  onTop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onBottom: () => void;
};

type SymbolName = ComponentProps<typeof SymbolView>["name"];

type NavigationButton = {
  label: string;
  symbol: SymbolName;
  onPress: () => void;
};

export function ListNavigationBar({
  onTop,
  onPrevious,
  onNext,
  onBottom,
}: ListNavigationBarProps) {
  const buttons: NavigationButton[] = [
    {
      label: "Top",
      symbol: {
        ios: "arrow.up.to.line",
        android: "vertical_align_top",
        web: "vertical_align_top",
      },
      onPress: onTop,
    },
    {
      label: "Prev",
      symbol: {
        ios: "chevron.up",
        android: "keyboard_arrow_up",
        web: "keyboard_arrow_up",
      },
      onPress: onPrevious,
    },
    {
      label: "Next",
      symbol: {
        ios: "chevron.down",
        android: "keyboard_arrow_down",
        web: "keyboard_arrow_down",
      },
      onPress: onNext,
    },
    {
      label: "Bottom",
      symbol: {
        ios: "arrow.down.to.line",
        android: "vertical_align_bottom",
        web: "vertical_align_bottom",
      },
      onPress: onBottom,
    },
  ];

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        {buttons.map((button) => (
          <Pressable
            key={button.label}
            accessibilityRole="button"
            accessibilityLabel={button.label}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={button.onPress}
          >
            <SymbolView name={button.symbol} tintColor="white" size={22} />
            <Text style={styles.label}>{button.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: 24,
  },
  bar: {
    flexDirection: "row",
    gap: 4,
    padding: 6,
    borderRadius: 32,
    backgroundColor: "rgba(17, 17, 17, 0.65)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
  },
  button: {
    width: 68,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
    borderRadius: 26,
  },
  pressed: { backgroundColor: "rgba(255, 255, 255, 0.18)" },
  label: { color: "white", fontSize: 11, fontWeight: "600" },
});
