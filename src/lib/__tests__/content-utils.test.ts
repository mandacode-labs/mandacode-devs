import { describe, expect, it } from "vitest";
import {
  dedupeCollectionBySlug,
  getLangFromEntryId,
  getSlugFromEntryId,
  pickByLang,
} from "@/lib/content/utils";
import type { CollectionEntry } from "astro:content";

function fakeEntry(id: string): CollectionEntry<"blog"> {
  return {
    id,
    data: {} as never,
    collection: "blog",
  } as CollectionEntry<"blog">;
}

describe("getSlugFromEntryId", () => {
  it("returns the trailing slug", () => {
    expect(getSlugFromEntryId("ko/foo-bar")).toBe("foo-bar");
    expect(getSlugFromEntryId("en/nested/slug")).toBe("slug");
  });
});

describe("getLangFromEntryId", () => {
  it("returns the leading lang", () => {
    expect(getLangFromEntryId("ko/foo")).toBe("ko");
    expect(getLangFromEntryId("en/nested/slug")).toBe("en");
  });
});

describe("pickByLang", () => {
  const entries = [fakeEntry("ko/a"), fakeEntry("en/a"), fakeEntry("ja/a")];

  it("prefers the requested lang", () => {
    expect(pickByLang(entries, "en", "ko")?.id).toBe("en/a");
  });

  it("falls back to the default lang when requested is missing", () => {
    expect(pickByLang(entries, "zh", "ko")?.id).toBe("ko/a");
  });

  it("falls back to the first entry when neither match", () => {
    const subset = [fakeEntry("ja/a"), fakeEntry("zh/a")];
    expect(pickByLang(subset, "en", "ko")?.id).toBe("ja/a");
  });
});

describe("dedupeCollectionBySlug", () => {
  it("returns one entry per slug, preferring the requested lang", () => {
    const entries = [
      fakeEntry("ko/post-1"),
      fakeEntry("en/post-1"),
      fakeEntry("ko/post-2"),
    ];
    const result = dedupeCollectionBySlug(entries, "en", "ko");
    const slugs = result.map(
      (e) => `${getLangFromEntryId(e.id)}/${getSlugFromEntryId(e.id)}`,
    );
    expect(slugs).toEqual(["en/post-1", "ko/post-2"]);
  });

  it("returns an empty array when input is empty", () => {
    expect(dedupeCollectionBySlug([], "en", "ko")).toEqual([]);
  });
});
