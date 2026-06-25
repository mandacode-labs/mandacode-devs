import { useEffect, useState } from "react";

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
        setItems(fetcher.extract(data) ?? []);
      } catch {
        setItems([]);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [fetcher, query, debounceMs]);

  return [items, setItems];
}
