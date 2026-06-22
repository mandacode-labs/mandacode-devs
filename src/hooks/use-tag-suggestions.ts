import { useEffect, useState } from "react";

export function useTagSuggestions(
  query: string,
  debounceMs = 150,
): [string[], (tags: string[]) => void] {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/tags?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { tags?: string[] };
        setSuggestions(data.tags ?? []);
      } catch {
        setSuggestions([]);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [query, debounceMs]);

  return [suggestions, setSuggestions];
}
