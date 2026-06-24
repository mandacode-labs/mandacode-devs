import type { UnifiedProject } from "@/lib/content/types";

function endDateAsDate(project: UnifiedProject): Date {
  if (project.endDate) {
    const match = project.endDate.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const [, year, month] = match;
      return new Date(Number(year), Number(month) - 1);
    }
  }
  return new Date(0);
}

export function sortProjectsByDate(
  projects: UnifiedProject[],
): UnifiedProject[] {
  return [...projects].sort(
    (a, b) => endDateAsDate(b).getTime() - endDateAsDate(a).getTime(),
  );
}

export function getProjectSlug(project: UnifiedProject): string {
  return project.id;
}
