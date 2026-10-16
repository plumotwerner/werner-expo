import { API_URL } from "./config";

export type ServerNote = {
  id: string;
  text: string;
};

const REQUEST_TIMEOUT_MS = 5000;

export async function fetchServerNotes(): Promise<ServerNote[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/notes`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`The server answered with status ${response.status}`);
    }
    return (await response.json()) as ServerNote[];
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("The server")) {
      throw error;
    }
    throw new Error(`Cannot reach the API at ${API_URL}. Is it running?`);
  } finally {
    clearTimeout(timeout);
  }
}
