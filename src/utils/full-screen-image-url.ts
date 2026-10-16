const FULL_SCREEN_SIZE = 1600;

// The API sends the 96x96 thumbnail. The picsum URL ends in /<width>/<height>,
// so the same image is requested again in a size that survives full screen.
export function toFullScreenImageUrl(thumbnailUrl: string): string {
  return thumbnailUrl.replace(
    /\/\d+\/\d+$/,
    `/${FULL_SCREEN_SIZE}/${FULL_SCREEN_SIZE}`,
  );
}
