// The list keeps at most three pages in memory: the previous, the current and
// the next one. These helpers are pure so they can be tested without React.

export function pageOfIndex(index: number, pageSize: number): number {
  return Math.floor(index / pageSize);
}

export function pagesInWindow(currentPage: number, pageCount: number): number[] {
  const first = Math.max(0, currentPage - 1);
  const last = Math.min(pageCount - 1, currentPage + 1);
  const pages: number[] = [];
  for (let page = first; page <= last; page++) pages.push(page);
  return pages;
}

export function pageCountOf(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
