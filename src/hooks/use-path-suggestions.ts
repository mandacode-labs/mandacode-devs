import { useEffect, useState } from "react";

export interface PostPathSuggestion {
  path: string;
  count: number;
}

export function usePathSuggestions(
  query: string,
  debounceMs = 150,
): [PostPathSuggestion[], (suggestions: PostPathSuggestion[]) => void] {
  const [suggestions, setSuggestions] = useState<PostPathSuggestion[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/posts/paths?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { paths?: PostPathSuggestion[] };
        setSuggestions(data.paths ?? []);
      } catch {
        setSuggestions([]);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [query, debounceMs]);

  return [suggestions, setSuggestions];
}
