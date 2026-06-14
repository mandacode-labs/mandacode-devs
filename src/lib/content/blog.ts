import { getCollection, getEntry } from "astro:content";
import type { Lang } from "@/types";
import { getSlugFromEntryId } from "./utils";
import type { CollectionEntry } from "astro:content";

export async function getPublishedPostsByLang(
  lang: Lang,
): Promise<CollectionEntry<"blog">[]> {
  const posts = await getCollection(
    "blog",
    (post) => post.id.startsWith(`${lang}/`) && !post.data.draft,
  );
  return sortPostsByDate(posts);
}

export function sortPostsByDate(
  posts: CollectionEntry<"blog">[],
): CollectionEntry<"blog">[] {
  return [...posts].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}

export async function getPostBySlug(lang: Lang, slug: string) {
  return getEntry("blog", `${lang}/${slug}`);
}

export function getBlogSlug(post: CollectionEntry<"blog">): string {
  return getSlugFromEntryId(post.id);
}
