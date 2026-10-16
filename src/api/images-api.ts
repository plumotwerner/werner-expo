import { API_URL } from "./config";

export const IMAGE_PAGE_SIZE = 50;

export type ImageItem = {
  id: string;
  order: number;
  imageUrl: string;
  description: string;
};

export type ImagePage = {
  total: number;
  page: number;
  pageSize: number;
  items: ImageItem[];
};

const REQUEST_TIMEOUT_MS = 8000;

// Demo only: a local API answers so fast that the spinner is never seen.
// Set to 0 to switch it off.
const ARTIFICIAL_DELAY_MS = 300;

// Optional, development API only: makes the loading indicator visible on a fast
// local server. Set EXPO_PUBLIC_IMAGE_DELAY_MS=800 to try it.
const DELAY_MS = process.env.EXPO_PUBLIC_IMAGE_DELAY_MS;

export async function fetchImagePage(page: number): Promise<ImagePage> {
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const delay = DELAY_MS ? `&delayMs=${encodeURIComponent(DELAY_MS)}` : "";

  try {
    const response = await fetch(
      `${API_URL}/images?page=${page}&pageSize=${IMAGE_PAGE_SIZE}${delay}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`The server answered with status ${response.status}`);
    }
    return (await response.json()) as ImagePage;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("The server")) {
      throw error;
    }
    throw new Error(`Cannot reach the API at ${API_URL}. Is it running?`);
  } finally {
    clearTimeout(timeout);
  }
}
