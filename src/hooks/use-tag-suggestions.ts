import { useEffect, useRef, useState } from "react";

export function useTagSuggestions(
  query: string,
  debounceMs = 150,
): [string[], (tags: string[]) => void] {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/tags?limit=20&q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { tags?: string[] };
        setItems(data.tags ?? []);
      } catch {
        setItems([]);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [query, debounceMs]);

  return [items, setItems];
}
