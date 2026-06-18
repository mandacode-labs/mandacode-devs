export type PublishStatus = "draft" | "published" | "archived";

export type ProjectStatus =
  | "production"
  | "development"
  | "planning"
  | "completed";

export interface Post {
  id: string;
  locale: string;
  origin: string | null;
  author_id: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  publish_status: PublishStatus;
  hidden: number;
  pub_date: string;
  cover_image_url: string | null;
  og_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  locale: string;
  origin: string | null;
  author_id: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  publish_status: PublishStatus;
  hidden: number;
  project_status: ProjectStatus;
  duration: string;
  team_size: number;
  role: string;
  project_order: number;
  url: string | null;
  source_url: string | null;
  blog_url: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Developer {
  id: string;
  locale: string;
  origin: string | null;
  author_id: string;
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  github_url: string | null;
  email: string | null;
  website_url: string | null;
  tech_stack: string | null;
  certifications: string | null;
  education: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PostTag {
  post_id: string;
  post_locale: string;
  tag_id: number;
}

export interface ProjectTag {
  project_id: string;
  project_locale: string;
  tag_id: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  badge?: string;
}

export interface Education {
  period: string;
  institution: string;
  department: string;
  status: string;
}
