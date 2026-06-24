export type PublishStatus = "draft" | "published" | "archived";

export type ProjectStatus =
  | "production"
  | "development"
  | "planning"
  | "completed";

export type TranslationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type TranslationContentType = "post" | "project" | "developer";

export interface TranslationJob {
  id: string;
  content_type: TranslationContentType;
  content_id: string;
  source_locale: string;
  target_locale: string;
  author_id: string;
  status: TranslationJobStatus;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Post {
  id: string;
  author_id: string;
  original_locale: string;
  created_at: string;
  updated_at: string;
}

export interface PostTranslation {
  id: string;
  post_id: string;
  locale: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  author_id: string;
  project_status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  team_size: number;
  project_order: number;
  url: string | null;
  source_url: string | null;
  blog_url: string | null;
  blog_post_id: string | null;
  original_locale: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTranslation {
  id: string;
  project_id: string;
  locale: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  role: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Developer {
  id: string;
  author_id: string;
  github_url: string | null;
  email: string | null;
  website_url: string | null;
  certifications: string | null;
  education: string | null;
  original_locale: string;
  created_at: string;
  updated_at: string;
}

export interface DeveloperTranslation {
  id: string;
  developer_id: string;
  locale: string;
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  publish_status: PublishStatus;
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
  tag_id: number;
}

export interface ProjectTag {
  project_id: string;
  tag_id: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  badge?: string;
}
