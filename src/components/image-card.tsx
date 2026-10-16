import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ImageItem } from "@/api/images-api";

export const IMAGE_CARD_HEIGHT = 88;

type ImageCardProps = {
  item: ImageItem;
  onPress: (item: ImageItem) => void;
};

export function ImageCard({ item, onPress }: ImageCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open image ${item.order}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.text}>
        <Text style={styles.order}>#{item.order}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.description}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

export function ImageCardPlaceholder() {
  return (
    <View style={[styles.card, styles.placeholder]}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: IMAGE_CARD_HEIGHT - 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d0d0d0",
  },
  cardPressed: { backgroundColor: "#ececec" },
  placeholder: { justifyContent: "center" },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#e5e5e5" },
  text: { flex: 1, gap: 4 },
  order: { fontSize: 12, color: "#666666" },
  description: { fontSize: 16, color: "#111111" },
});
