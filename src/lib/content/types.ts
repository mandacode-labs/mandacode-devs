import type { ProjectStatus } from "@/lib/db/schema";

interface BaseUnifiedContent {
  id: string;
  locale: string;
  d1Content?: string;
  markdownContent?: string;
}

export interface UnifiedPost extends BaseUnifiedContent {
  title: string;
  description: string | null;
  pubDate: Date;
  coverImage: string | null;
  ogImage: string | null;
  tags: string[];
  hidden: boolean;
}

export interface UnifiedProject extends BaseUnifiedContent {
  title: string;
  description: string | null;
  status: ProjectStatus;
  techStack: string[];
  duration: string;
  startDate: string | null;
  endDate: string | null;
  teamSize: number;
  role: string;
  order: number;
  url: string | null;
  sourceUrl: string | null;
  blogUrl: string | null;
  coverImage: string | null;
  hidden: boolean;
}

export interface UnifiedDeveloper extends BaseUnifiedContent {
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
}
