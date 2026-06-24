import { useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";

export interface TagWithUsage {
  id: number;
  name: string;
  postCount: number;
  projectCount: number;
  developerCount: number;
  totalCount: number;
}

interface TagListProps {
  initialTags: TagWithUsage[];
  searchHint: string;
  emptyTitle: string;
  emptyMessage: string;
}

function filterTags(tags: TagWithUsage[], query: string): TagWithUsage[] {
  if (!query) return tags;
  const q = query.toLowerCase();
  return tags.filter((tag) => tag.name.toLowerCase().includes(q));
}

export function TagList({
  initialTags,
  searchHint,
  emptyTitle,
  emptyMessage,
}: TagListProps) {
  const [query, setQuery] = useState("");
  const [tags] = useState<TagWithUsage[]>(initialTags);

  const filtered = filterTags(tags, query);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchHint}
          className="w-full sm:w-80 px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {tags.length === 0 ? (
        <div className="bg-bg-primary border border-border rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-text-primary">{emptyTitle}</p>
          <p className="text-xs text-text-secondary mt-1">{emptyMessage}</p>
        </div>
      ) : (
        <div className="bg-bg-primary border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary text-xs uppercase tracking-wide w-24">
                    Posts
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary text-xs uppercase tracking-wide w-24">
                    Projects
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary text-xs uppercase tracking-wide w-24">
                    Developers
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary text-xs uppercase tracking-wide w-24">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((tag) => (
                  <tr
                    key={tag.id}
                    className="hover:bg-bg-secondary/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/tags/${tag.id}`}
                        className="font-medium text-text-primary hover:text-accent"
                      >
                        {tag.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {tag.postCount}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {tag.projectCount}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {tag.developerCount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">
                      {tag.totalCount}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-text-secondary"
                    >
                      No tags match "{query}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper used elsewhere if needed
export async function deleteTagApi(id: number): Promise<void> {
  try {
    await apiFetch(`/api/admin/tags/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError("Network error", 0);
  }
}
