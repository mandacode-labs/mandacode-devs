import type { CollectionEntry } from "astro:content";
import type { Language } from "@/lib/config/languages";

export function getSlugFromEntryId(entryId: string): string {
  return entryId.split("/").pop() ?? entryId;
}

export function getLangFromEntryId(entryId: string): string {
  return entryId.split("/")[0] ?? entryId;
}

export function pickByLang<T extends { id: string }>(
  entries: readonly T[],
  requestedLang: Language,
  defaultLang: Language,
): T | undefined {
  return (
    entries.find((entry) => getLangFromEntryId(entry.id) === requestedLang) ??
    entries.find((entry) => getLangFromEntryId(entry.id) === defaultLang) ??
    entries[0]
  );
}

type SlugKeyedEntry = CollectionEntry<"blog"> | CollectionEntry<"developers">;

function dedupeSlugKeyed(
  entries: readonly SlugKeyedEntry[],
  requestedLang: Language,
  defaultLang: Language,
): SlugKeyedEntry[] {
  const bySlug = new Map<string, SlugKeyedEntry[]>();
  for (const entry of entries) {
    const slug = getSlugFromEntryId(entry.id);
    const list = bySlug.get(slug) ?? [];
    list.push(entry);
    bySlug.set(slug, list);
  }
  const result: SlugKeyedEntry[] = [];
  for (const list of bySlug.values()) {
    const picked = pickByLang(list, requestedLang, defaultLang);
    if (picked) result.push(picked);
  }
  return result;
}

export function dedupeCollectionBySlug<T extends "blog" | "developers">(
  entries: readonly CollectionEntry<T>[],
  requestedLang: Language,
  defaultLang: Language,
): CollectionEntry<T>[] {
  return dedupeSlugKeyed(
    entries,
    requestedLang,
    defaultLang,
  ) as CollectionEntry<T>[];
}
