import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { apiFetch } from "@/lib/api/client";

export interface BlogPostOption {
  id: string;
  title: string;
  original_locale: string;
}

interface BlogPostSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
  label: string;
  locale: string;
}

export default function BlogPostSelector({
  value,
  onChange,
  label,
  locale,
}: BlogPostSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogPostOption[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false));

  useEffect(() => {
    if (!value) {
      setSelectedTitle(null);
      return;
    }
    if (selectedTitle !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ results: BlogPostOption[] }>(
          `/api/admin/posts/search?q=${encodeURIComponent(value)}&limit=1`,
        );
        if (cancelled) return;
        const match = res.results.find((r) => r.id === value);
        setSelectedTitle(match?.title ?? value);
      } catch {
        setSelectedTitle(value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, selectedTitle, locale]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ results: BlogPostOption[] }>(
          `/api/admin/posts/search?q=${encodeURIComponent(trimmed)}&limit=10`,
        );
        setResults(res.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [query, open]);

  function select(post: BlogPostOption) {
    onChange(post.id);
    setSelectedTitle(post.title);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    onChange(null);
    setSelectedTitle(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="block" ref={wrapperRef}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {value ? (
        <div className="mt-1.5 flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-bg-primary">
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm">{selectedTitle ?? value}</div>
            <div className="truncate text-xs text-text-secondary font-mono">
              {value}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-xs px-2 py-1 rounded border border-border hover:bg-bg-secondary"
            aria-label="Clear"
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search posts by title…"
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          {open && query.trim() && (
            <div className="relative">
              <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto border border-border rounded-lg bg-bg-primary shadow-lg">
                {loading && (
                  <li className="px-3 py-2 text-sm text-text-secondary">
                    Loading…
                  </li>
                )}
                {!loading && results.length === 0 && (
                  <li className="px-3 py-2 text-sm text-text-secondary">
                    No posts found.
                  </li>
                )}
                {!loading &&
                  results.map((post) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => select(post)}
                        className="w-full text-left px-3 py-2 hover:bg-bg-secondary focus:bg-bg-secondary focus:outline-none"
                      >
                        <div className="text-sm truncate">{post.title}</div>
                        <div className="text-xs text-text-secondary font-mono truncate">
                          {post.id} · {post.original_locale}
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
