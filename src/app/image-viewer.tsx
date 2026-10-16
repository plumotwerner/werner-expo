import { useLocalSearchParams } from "expo-router";

import { FullScreenImageViewer } from "@/components/full-screen-image-viewer";
import { toFullScreenImageUrl } from "@/utils/full-screen-image-url";

// Opened from the Long image list, outside the drawer so it has no header.
export default function ImageViewerScreen() {
  const { imageUrl } = useLocalSearchParams<{ imageUrl: string }>();

  return <FullScreenImageViewer uri={toFullScreenImageUrl(imageUrl)} />;
}
