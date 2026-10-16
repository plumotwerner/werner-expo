import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchImagePage,
  IMAGE_PAGE_SIZE,
  type ImageItem,
} from "@/api/images-api";
import {
  pageCountOf,
  pageOfIndex,
  pagesInWindow,
} from "@/utils/page-window";

type Pages = Record<number, ImageItem[]>;

// Holds only the pages around the one being looked at. Everything else is
// dropped and fetched again from the API when the user scrolls back.
export function useImageWindow() {
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [pages, setPages] = useState<Pages>({});
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const inFlight = useRef(new Set<number>());
  const loaded = useRef(new Set<number>());
  const wanted = useRef<number[]>([0]);
  const pageCountRef = useRef(1);

  useEffect(() => {
    const pageCount = total === null ? 1 : pageCountOf(total, IMAGE_PAGE_SIZE);
    const window = pagesInWindow(currentPage, pageCount);
    wanted.current = window;

    for (const page of window) {
      if (inFlight.current.has(page) || loaded.current.has(page)) continue;
      inFlight.current.add(page);
      fetchImagePage(page)
        .then((result) => {
          pageCountRef.current = pageCountOf(result.total, IMAGE_PAGE_SIZE);
          setTotal(result.total);
          setError(null);
          if (wanted.current.includes(page)) {
            loaded.current.add(page);
            setPages((previous) => ({ ...previous, [page]: result.items }));
          }
        })
        .catch((fetchError: unknown) => {
          setError(
            fetchError instanceof Error ? fetchError.message : "Unknown error",
          );
        })
        .finally(() => inFlight.current.delete(page));
    }
  }, [currentPage, total, retryCount]);

  // Runs from the scroll event, so dropping the pages that fell out of the
  // window happens together with moving it.
  const onFirstVisibleIndex = useCallback((index: number) => {
    const page = pageOfIndex(index, IMAGE_PAGE_SIZE);
    const keep = pagesInWindow(page, pageCountRef.current);
    setCurrentPage(page);
    for (const key of [...loaded.current]) {
      if (!keep.includes(key)) loaded.current.delete(key);
    }
    setPages((previous) => {
      const kept: Pages = {};
      for (const key of keep) {
        if (previous[key]) kept[key] = previous[key];
      }
      return kept;
    });
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setRetryCount((count) => count + 1);
  }, []);

  const itemAt = (index: number): ImageItem | undefined =>
    pages[pageOfIndex(index, IMAGE_PAGE_SIZE)]?.[index % IMAGE_PAGE_SIZE];

  return {
    total,
    error,
    loadedPageCount: Object.keys(pages).length,
    itemAt,
    onFirstVisibleIndex,
    retry,
  };
}
