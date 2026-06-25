import type { LucideIcon } from "lucide-react";
import { FileText, Kanban, Archive, User } from "lucide-react";

export interface DashboardStat {
  id: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  meta?: string;
  href?: string;
}

export function getDashboardStats(
  posts: Array<{ publish_status: string }>,
  projects: Array<{ publish_status: string }>,
  developerName: string,
): DashboardStat[] {
  const publishedPosts = posts.filter((p) => p.publish_status === "published");
  const draftPosts = posts.filter((p) => p.publish_status === "draft");
  const archivedPosts = posts.filter((p) => p.publish_status === "archived");
  const publishedProjects = projects.filter(
    (p) => p.publish_status === "published",
  );
  const archivedProjects = projects.filter(
    (p) => p.publish_status === "archived",
  );

  return [
    {
      id: "posts",
      label: "Total Posts",
      value: posts.length,
      icon: FileText,
      meta: `${publishedPosts.length} published · ${draftPosts.length} draft`,
      href: "/admin/posts",
    },
    {
      id: "projects",
      label: "Total Projects",
      value: projects.length,
      icon: Kanban,
      meta: `${publishedProjects.length} published`,
      href: "/admin/projects",
    },
    {
      id: "archived",
      label: "Archived Items",
      value: archivedPosts.length + archivedProjects.length,
      icon: Archive,
      meta: `${archivedPosts.length} posts · ${archivedProjects.length} projects`,
    },
    {
      id: "developer",
      label: "Developer Profile",
      value: developerName,
      icon: User,
      meta: "Edit profile →",
      href: "/admin/developers/new",
    },
  ];
}
