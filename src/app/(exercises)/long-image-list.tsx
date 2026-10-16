import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListViewToken,
} from "react-native";

import { IMAGE_PAGE_SIZE } from "@/api/images-api";
import {
  IMAGE_CARD_HEIGHT,
  ImageCard,
  ImageCardPlaceholder,
} from "@/components/image-card";
import { ListNavigationBar } from "@/components/list-navigation-bar";
import { useImageWindow } from "@/hooks/use-image-window";

const VIEWABILITY = { itemVisiblePercentThreshold: 50 };

export default function LongImageListScreen() {
  const { total, error, itemAt, loadedPageCount, onFirstVisibleIndex, retry } =
    useImageWindow();

  const router = useRouter();
  const listRef = useRef<FlatList<number>>(null);
  const firstVisibleIndex = useRef(0);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      if (total === null) return;
      const clamped = Math.min(Math.max(index, 0), total - 1);
      listRef.current?.scrollToIndex({ index: clamped, animated });
    },
    [total],
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const first = viewableItems[0]?.index;
      if (first == null) return;
      firstVisibleIndex.current = first;
      onFirstVisibleIndex(first);
    },
    [onFirstVisibleIndex],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dynamic scroll</Text>
        <Text style={styles.description}>
          {total === null
            ? "Loading the first page"
            : `Bidirectional infinite scroll of ${total} items. Only 3 pages of 50 stay in memory (${loadedPageCount} loaded).`}
        </Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : total === null ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={Array.from({ length: total }, (_, index) => index)}
          keyExtractor={(index) => String(index)}
          renderItem={({ item: index }) => {
            const item = itemAt(index);
            return item ? (
              <ImageCard
                item={item}
                onPress={(pressed) =>
                  router.push({
                    pathname: "/image-viewer",
                    params: { imageUrl: pressed.imageUrl },
                  })
                }
              />
            ) : (
              <ImageCardPlaceholder />
            );
          }}
          getItemLayout={(_, index) => ({
            length: IMAGE_CARD_HEIGHT,
            offset: IMAGE_CARD_HEIGHT * index,
            index,
          })}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={VIEWABILITY}
          windowSize={5}
          initialNumToRender={10}
          contentContainerStyle={styles.listContent}
        />
      )}

      {total !== null && !error && (
        <ListNavigationBar
          onTop={() => scrollToIndex(0, false)}
          onPrevious={() =>
            scrollToIndex(firstVisibleIndex.current - IMAGE_PAGE_SIZE, true)
          }
          onNext={() =>
            scrollToIndex(firstVisibleIndex.current + IMAGE_PAGE_SIZE, true)
          }
          onBottom={() => scrollToIndex(total - 1, false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  header: { padding: 16, gap: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  description: { fontSize: 14, color: "#555555" },
  listContent: { paddingBottom: 110 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  error: { color: "#b00020", textAlign: "center", paddingHorizontal: 24 },
  retry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#111111",
  },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
