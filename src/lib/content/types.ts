import type { ProjectStatus, PublishStatus } from "@/lib/db/schema";

interface BaseUnifiedContent {
  id: string;
  locale: string;
  originalLocale: string;
  publishStatus: PublishStatus;
  isFallback: boolean;
  intro?: string;
}

export interface UnifiedPost extends BaseUnifiedContent {
  title: string;
  description: string | null;
  pubDate: Date;
  coverImage: string | null;
  tags: string[];
  hidden: boolean;
}

export interface UnifiedProject extends BaseUnifiedContent {
  title: string;
  description: string | null;
  status: ProjectStatus;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  teamSize: number;
  role: string;
  order: number;
  url: string | null;
  sourceUrl: string | null;
  blogPostId: string | null;
  coverImage: string | null;
  hidden: boolean;
}

export interface UnifiedDeveloper extends BaseUnifiedContent {
  name: string;
  role: string;
  bio: string;
  body?: string;
  avatar: string | null;
  github: string | null;
  email: string | null;
  website: string | null;
  techStack: string[];
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    badge?: string | null;
  }>;
  education: Array<{
    id: string;
    startDate: string | null;
    endDate: string | null;
    institution: string;
    department: string | null;
    status: string | null;
  }>;
}
