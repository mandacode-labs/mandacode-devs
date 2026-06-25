import { useSuggestions } from "@/hooks/use-suggestions";

export interface PostPathSuggestion {
  path: string;
  count: number;
}

export function usePathSuggestions(
  query: string,
  debounceMs = 150,
): [PostPathSuggestion[], (items: PostPathSuggestion[]) => void] {
  return useSuggestions<PostPathSuggestion>(
    {
      endpoint: "/api/admin/posts/paths",
      extract: (data) => (data as { paths?: PostPathSuggestion[] }).paths,
    },
    query,
    debounceMs,
  );
}
