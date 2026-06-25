import { useSuggestions } from "@/hooks/use-suggestions";

export function useTagSuggestions(
  query: string,
  debounceMs = 150,
): [string[], (tags: string[]) => void] {
  return useSuggestions<string>(
    {
      endpoint: "/api/admin/tags",
      extract: (data) => (data as { tags?: string[] }).tags,
    },
    query,
    debounceMs,
  );
}
