import { useLocalSearchParams } from "expo-router";

import { FullScreenImageViewer } from "@/components/full-screen-image-viewer";

// Shows the photo that was just taken, outside the drawer.
export default function PhotoViewerScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();

  return <FullScreenImageViewer uri={uri} />;
}
