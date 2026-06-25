import { useEffect, useRef, useState } from "react";

export interface SuggestionFetcher<T> {
  endpoint: string;
  extract: (data: unknown) => T[] | undefined;
}

export function useSuggestions<T>(
  fetcher: SuggestionFetcher<T>,
  query: string,
  debounceMs = 150,
): [T[], (items: T[]) => void] {
  const [items, setItems] = useState<T[]>([]);
  // Stash the latest extract in a ref so the effect doesn't need to
  // depend on the fetcher object (callers pass a fresh object literal
  // on every render, which would otherwise loop).
  const extractRef = useRef(fetcher.extract);
  extractRef.current = fetcher.extract;

  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `${fetcher.endpoint}?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as unknown;
        setItems(extractRef.current(data) ?? []);
      } catch {
        setItems([]);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [fetcher.endpoint, query, debounceMs]);

  return [items, setItems];
}
