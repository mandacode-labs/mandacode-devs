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

export function sortProjectsByDate(
  projects: CollectionEntry<"projects">[],
): CollectionEntry<"projects">[] {
  return [...projects].sort((a, b) => {
    const aDate = getProjectEndDate(a.data.duration);
    const bDate = getProjectEndDate(b.data.duration);
    return bDate.getTime() - aDate.getTime();
  });
}

export function getProjectEndDate(duration: string): Date {
  const match = duration.match(/(\d{4})\.(\d{1,2})\s*$/);
  if (!match) return new Date(0);
  const [, year, month] = match;
  return new Date(Number(year), Number(month) - 1);
}

export function getProjectStartDate(duration: string): Date {
  const match = duration.match(/^(\d{4})\.(\d{1,2})/);
  if (!match) return new Date(0);
  const [, year, month] = match;
  return new Date(Number(year), Number(month) - 1);
}

export async function getProjectBySlug(lang: Lang, slug: string) {
  return getEntry("projects", `${lang}/${slug}`);
}

export function getProjectSlug(project: CollectionEntry<"projects">): string {
  return getSlugFromEntryId(project.id);
}
