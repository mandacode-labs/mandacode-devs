import type { Lang } from "@/types";
import type { UnifiedProject } from "@/lib/content/types";

export async function getProjectsByLang(lang: Lang): Promise<UnifiedProject[]> {
  const { getProjects } = await import("@/lib/content/service");
  const projects = await getProjects(lang);
  return sortProjectsByDate(projects);
}

export function sortProjectsByOrder(
  projects: UnifiedProject[],
): UnifiedProject[] {
  return [...projects].sort((a, b) => a.order - b.order);
}

export function sortProjectsByDate(
  projects: UnifiedProject[],
): UnifiedProject[] {
  return [...projects].sort((a, b) => {
    const aDate = getProjectEndDate(a);
    const bDate = getProjectEndDate(b);
    return bDate.getTime() - aDate.getTime();
  });
}

export function getProjectEndDate(project: UnifiedProject): Date {
  if (project.endDate) {
    const match = project.endDate.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const [, year, month] = match;
      return new Date(Number(year), Number(month) - 1);
    }
  }
  const match = project.duration.match(/(\d{4})\.(\d{1,2})\s*$/);
  if (!match) return new Date(0);
  const [, year, month] = match;
  return new Date(Number(year), Number(month) - 1);
}

export function getProjectStartDate(project: UnifiedProject): Date {
  if (project.startDate) {
    const match = project.startDate.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const [, year, month] = match;
      return new Date(Number(year), Number(month) - 1);
    }
  }
  const match = project.duration.match(/^(\d{4})\.(\d{1,2})/);
  if (!match) return new Date(0);
  const [, year, month] = match;
  return new Date(Number(year), Number(month) - 1);
}

export function getProjectSlug(project: UnifiedProject): string {
  return project.id;
}
