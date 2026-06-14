import { getCollection, getEntry } from "astro:content";
import type { Lang } from "@/types";
import { getSlugFromEntryId } from "./utils";
import type { CollectionEntry } from "astro:content";

export async function getProjectsByLang(
  lang: Lang,
): Promise<CollectionEntry<"projects">[]> {
  const projects = await getCollection("projects", (project) =>
    project.id.startsWith(`${lang}/`),
  );
  return sortProjectsByOrder(projects);
}

export function sortProjectsByOrder(
  projects: CollectionEntry<"projects">[],
): CollectionEntry<"projects">[] {
  return [...projects].sort((a, b) => a.data.order - b.data.order);
}

export async function getProjectBySlug(lang: Lang, slug: string) {
  return getEntry("projects", `${lang}/${slug}`);
}

export function getProjectSlug(project: CollectionEntry<"projects">): string {
  return getSlugFromEntryId(project.id);
}
