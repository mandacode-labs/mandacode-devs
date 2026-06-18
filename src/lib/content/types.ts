import type { ProjectStatus } from "@/lib/db/schema";

export interface UnifiedPost {
  id: string;
  locale: string;
  title: string;
  description: string | null;
  pubDate: Date;
  coverImage: string | null;
  ogImage: string | null;
  tags: string[];
  hidden: boolean;
  source: "d1" | "collection";
  content?: string;
}

export interface UnifiedProject {
  id: string;
  locale: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  techStack: string[];
  duration: string;
  teamSize: number;
  role: string;
  order: number;
  url: string | null;
  sourceUrl: string | null;
  blogUrl: string | null;
  coverImage: string | null;
  hidden: boolean;
  source: "d1" | "collection";
  content?: string;
}

export interface UnifiedDeveloper {
  id: string;
  locale: string;
  name: string;
  role: string;
  bio: string;
  avatar: string | null;
  github: string | null;
  email: string | null;
  website: string | null;
  techStack: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    url?: string;
    badge?: string;
  }>;
  education: Array<{
    period: string;
    institution: string;
    department: string;
    status: string;
  }>;
  source: "d1" | "collection";
  content?: string;
}
