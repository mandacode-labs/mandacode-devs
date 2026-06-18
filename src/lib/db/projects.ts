import { getDatabase } from "@/lib/db/client";
import type { Project, ProjectStatus, PublishStatus } from "@/lib/db/schema";

export interface CreateProjectInput {
  id: string;
  locale: string;
  origin: string | null;
  author_id: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  publish_status: PublishStatus;
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
}

export interface UpdateProjectInput {
  title?: string;
  description?: string | null;
  tiptap_json?: string;
  publish_status?: PublishStatus;
  project_status?: ProjectStatus;
  duration?: string;
  team_size?: number;
  role?: string;
  project_order?: number;
  url?: string | null;
  source_url?: string | null;
  blog_url?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
}

export async function getProjects(
  locale: string,
  options: { publishStatus?: PublishStatus } = {},
): Promise<Project[]> {
  const db = getDatabase();

  let query = "SELECT * FROM projects WHERE locale = ?";
  const params: (string | PublishStatus)[] = [locale];

  if (options.publishStatus) {
    query += " AND publish_status = ?";
    params.push(options.publishStatus);
  }

  query += " ORDER BY project_order ASC";

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return (result.results ?? []) as unknown as Project[];
}

export async function getProjectById(
  id: string,
  locale: string,
): Promise<Project | null> {
  const db = getDatabase();

  const result = await db
    .prepare("SELECT * FROM projects WHERE id = ? AND locale = ?")
    .bind(id, locale)
    .first();

  return (result as Project | null) ?? null;
}

export async function getProjectByIdWithFallback(
  id: string,
  locale: string,
  fallbackLocale: string,
): Promise<Project | null> {
  const project = await getProjectById(id, locale);
  if (project) {
    return project;
  }

  return getProjectById(id, fallbackLocale);
}

export async function createProject(input: CreateProjectInput): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO projects (
        id, locale, origin, author_id, title, description, tiptap_json,
        publish_status, project_status, duration, team_size, role, project_order,
        url, source_url, blog_url, cover_image_url, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.locale,
      input.origin,
      input.author_id,
      input.title,
      input.description,
      input.tiptap_json,
      input.publish_status,
      input.project_status,
      input.duration,
      input.team_size,
      input.role,
      input.project_order,
      input.url,
      input.source_url,
      input.blog_url,
      input.cover_image_url,
      input.published_at,
    )
    .run();
}

export async function updateProject(
  id: string,
  locale: string,
  input: UpdateProjectInput,
): Promise<void> {
  const db = getDatabase();

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) {
    return;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");

  await db
    .prepare(
      `UPDATE projects SET ${fields.join(", ")} WHERE id = ? AND locale = ?`,
    )
    .bind(...values, id, locale)
    .run();
}

export async function deleteProject(id: string, locale: string): Promise<void> {
  const db = getDatabase();

  await db
    .prepare("DELETE FROM projects WHERE id = ? AND locale = ?")
    .bind(id, locale)
    .run();
}
