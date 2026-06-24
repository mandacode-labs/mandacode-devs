import { useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { TagReference, TagReferenceType } from "@/lib/db/tags";

export interface TagDetailTag {
  id: number;
  name: string;
}

interface TagDetailProps {
  tag: TagDetailTag;
  usage: TagReference[];
  nameLabel: string;
  renameLabel: string;
  renameHint: string;
  renameSuccessLabel: string;
  deleteLabel: string;
  deleteConfirmLabel: string;
  deleteSuccessLabel: string;
  usageLabel: string;
  noUsageLabel: string;
  viewLabel: string;
  postLabel: string;
  projectLabel: string;
  developerLabel: string;
}

const typeLabels: Record<TagReferenceType, string> = {
  post: "Post",
  project: "Project",
  developer: "Developer",
};

function badgeClass(type: TagReferenceType): string {
  switch (type) {
    case "post":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "project":
      return "bg-green-50 text-green-700 border-green-200";
    case "developer":
      return "bg-purple-50 text-purple-700 border-purple-200";
  }
}

export function TagDetail({
  tag,
  usage,
  nameLabel,
  renameLabel,
  renameHint,
  renameSuccessLabel,
  deleteLabel,
  deleteConfirmLabel,
  deleteSuccessLabel,
  usageLabel,
  noUsageLabel,
  viewLabel,
  postLabel,
  projectLabel,
  developerLabel,
}: TagDetailProps) {
  const [name, setName] = useState(tag.name);
  const [currentName, setCurrentName] = useState(tag.name);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const dirty = name.trim() !== currentName && name.trim().length > 0;

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || renaming) return;
    setRenaming(true);
    setToast(null);
    try {
      await apiFetch(`/api/admin/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setCurrentName(name.trim());
      setToast({ type: "success", message: renameSuccessLabel });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof ApiClientError ? error.message : "Rename failed",
      });
    } finally {
      setRenaming(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function handleDelete() {
    if (!window.confirm(deleteConfirmLabel) || deleting) {
      return;
    }
    setDeleting(true);
    setToast(null);
    try {
      await apiFetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
      window.location.href = "/admin/tags?toast=deleted";
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof ApiClientError ? error.message : "Delete failed",
      });
      setDeleting(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const grouped = usage.reduce<Record<TagReferenceType, TagReference[]>>(
    (acc, ref) => {
      (acc[ref.type] ??= []).push(ref);
      return acc;
    },
    { post: [], project: [], developer: [] },
  );

  const labelMap: Record<TagReferenceType, string> = {
    post: postLabel,
    project: projectLabel,
    developer: developerLabel,
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-bg-primary border border-border rounded-xl p-6">
        <form onSubmit={handleRename} className="space-y-3">
          <label
            htmlFor="tag-name"
            className="block text-sm font-medium text-text-primary"
          >
            {nameLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={renaming}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!dirty || renaming}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-accent text-accent hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {renaming ? "..." : renameLabel}
            </button>
          </div>
          <p className="text-xs text-text-secondary">{renameHint}</p>
          {toast && (
            <p
              className={`text-xs ${
                toast.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {toast.message}
            </p>
          )}
        </form>
      </div>

      <div className="bg-bg-primary border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            {usageLabel}
          </h2>
          <span className="text-xs text-text-secondary">
            {usage.length} {usage.length === 1 ? "reference" : "references"}
          </span>
        </div>

        {usage.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-secondary">{noUsageLabel}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(Object.keys(grouped) as TagReferenceType[]).map((type) => {
              const refs = grouped[type];
              if (refs.length === 0) return null;
              return (
                <div key={type}>
                  <div className="px-6 py-2 bg-bg-secondary/50 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {labelMap[type]} ({refs.length})
                  </div>
                  <ul>
                    {refs.map((ref) => (
                      <li
                        key={`${ref.type}-${ref.id}`}
                        className="px-6 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${badgeClass(ref.type)}`}
                          >
                            {typeLabels[ref.type]}
                          </span>
                          <a
                            href={ref.href}
                            className="text-sm font-medium text-text-primary hover:text-accent truncate"
                          >
                            {ref.title}
                          </a>
                          <code className="text-xs text-text-muted font-mono shrink-0">
                            {ref.id}
                          </code>
                        </div>
                        <a
                          href={ref.href}
                          className="text-xs text-accent hover:text-accent-hover font-medium shrink-0"
                        >
                          {viewLabel} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-bg-primary border border-red-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">
          Danger zone
        </h2>
        <p className="text-sm text-text-secondary mb-3">
          Deleting this tag removes it from all posts, projects, and developers
          that use it. The content itself is not deleted.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? "..." : deleteLabel}
        </button>
      </div>
    </div>
  );
}
