import { getDatabase } from "@/lib/db/client";
import { hashContent } from "@/lib/hash";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import type {
  Project,
  ProjectTranslation,
  ProjectStatus,
  PublishStatus,
} from "@/lib/db/schema";

export interface CreateProjectInput {
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
  original_locale: string;
}

export interface CreateProjectTranslationInput {
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
  source_hash?: string | null;
}

export interface UpdateProjectTranslationInput {
  title?: string;
  description?: string | null;
  tiptap_json?: string;
  role?: string;
  cover_image_url?: string | null;
  publish_status?: PublishStatus;
  published_at?: string | null;
  source_hash?: string | null;
}

export interface UpdateProjectInput {
  project_status?: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  team_size?: number;
  project_order?: number;
  url?: string | null;
  source_url?: string | null;
  blog_url?: string | null;
  original_locale?: string;
}

export interface GetProjectsOptions {
  publishStatus?: PublishStatus;
  includeUnpublished?: boolean;
}

export interface ProjectWithTranslation extends Project {
  title: string;
  description: string | null;
  tiptap_json: string;
  role: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  is_fallback: boolean;
}

export function rowToProjectWithTranslation(
  row: Record<string, unknown>,
): ProjectWithTranslation {
  const hasTranslation = row.translation_title !== null;
  const title = String(
    hasTranslation ? row.translation_title : row.original_title,
  );
  const description = hasTranslation
    ? (row.translation_description as string | null)
    : (row.original_description as string | null);
  const tiptap_json = String(
    hasTranslation ? row.translation_tiptap_json : row.original_tiptap_json,
  );
  const role = String(
    hasTranslation ? row.translation_role : row.original_role,
  );
  const cover_image_url = hasTranslation
    ? (row.translation_cover_image_url as string | null)
    : (row.original_cover_image_url as string | null);
  const publish_status = String(
    hasTranslation
      ? row.translation_publish_status
      : row.original_publish_status,
  ) as PublishStatus;
  const published_at = hasTranslation
    ? (row.translation_published_at as string | null)
    : (row.original_published_at as string | null);

  return {
    id: String(row.id),
    author_id: String(row.author_id),
    project_status: String(row.project_status) as ProjectStatus,
    start_date: (row.start_date as string | null) ?? null,
    end_date: (row.end_date as string | null) ?? null,
    team_size: Number(row.team_size),
    project_order: Number(row.project_order),
    url: (row.url as string | null) ?? null,
    source_url: (row.source_url as string | null) ?? null,
    blog_url: (row.blog_url as string | null) ?? null,
    original_locale: String(row.original_locale),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title,
    description,
    tiptap_json,
    role,
    cover_image_url,
    publish_status,
    published_at,
    is_fallback: !hasTranslation,
  };
}

function buildListQuery(options: GetProjectsOptions = {}): {
  query: string;
  params: (string | number | PublishStatus)[];
} {
  const params: (string | number | PublishStatus)[] = [];
  let query = `
    SELECT
      p.id,
      p.author_id,
      p.project_status,
      p.start_date,
      p.end_date,
      p.team_size,
      p.project_order,
      p.url,
      p.source_url,
      p.blog_url,
      p.original_locale,
      p.created_at,
      p.updated_at,
      orig.title AS original_title,
      orig.description AS original_description,
      orig.tiptap_json AS original_tiptap_json,
      orig.role AS original_role,
      orig.cover_image_url AS original_cover_image_url,
      orig.publish_status AS original_publish_status,
      orig.published_at AS original_published_at,
      trans.title AS translation_title,
      trans.description AS translation_description,
      trans.tiptap_json AS translation_tiptap_json,
      trans.role AS translation_role,
      trans.cover_image_url AS translation_cover_image_url,
      trans.publish_status AS translation_publish_status,
      trans.published_at AS translation_published_at
    FROM projects p
    LEFT JOIN project_translations orig
      ON p.id = orig.project_id AND orig.locale = p.original_locale
    LEFT JOIN project_translations trans
      ON p.id = trans.project_id AND trans.locale = ?
  `;
  params.push("placeholder-locale");

  if (!options.includeUnpublished) {
    query += " WHERE orig.publish_status = ?";
    params.push("published");
  }

  if (options.publishStatus) {
    query += options.includeUnpublished ? " WHERE " : " AND ";
    query += "trans.publish_status = ?";
    params.push(options.publishStatus);
  }

  query += " ORDER BY COALESCE(orig.published_at, orig.created_at) DESC";

  return { query, params };
}

export async function getProjects(
  locale: string,
  options: GetProjectsOptions = {},
): Promise<ProjectWithTranslation[]> {
  const db = getDatabase();
  const { query, params } = buildListQuery(options);
  params[0] = locale;

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return ((result.results ?? []) as Record<string, unknown>[]).map(
    rowToProjectWithTranslation,
  );
}

export async function getProjectById(
  id: string,
  locale: string,
): Promise<ProjectWithTranslation | null> {
  const db = getDatabase();

  const result = await db
    .prepare(
      `
      SELECT
        p.id,
        p.author_id,
        p.project_status,
        p.start_date,
        p.end_date,
        p.team_size,
        p.project_order,
        p.url,
        p.source_url,
        p.blog_url,
        p.original_locale,
        p.created_at,
        p.updated_at,
        orig.title AS original_title,
        orig.description AS original_description,
        orig.tiptap_json AS original_tiptap_json,
        orig.role AS original_role,
        orig.cover_image_url AS original_cover_image_url,
        orig.publish_status AS original_publish_status,
        orig.published_at AS original_published_at,
        trans.title AS translation_title,
        trans.description AS translation_description,
        trans.tiptap_json AS translation_tiptap_json,
        trans.role AS translation_role,
        trans.cover_image_url AS translation_cover_image_url,
        trans.publish_status AS translation_publish_status,
        trans.published_at AS translation_published_at
      FROM projects p
      LEFT JOIN project_translations orig
        ON p.id = orig.project_id AND orig.locale = p.original_locale
      LEFT JOIN project_translations trans
        ON p.id = trans.project_id AND trans.locale = ?
      WHERE p.id = ?
      `,
    )
    .bind(locale, id)
    .first();

  if (!result) return null;
  return rowToProjectWithTranslation(result as Record<string, unknown>);
}

export async function getProjectTranslationById(
  id: string,
  locale: string,
): Promise<ProjectTranslation | null> {
  const db = getDatabase();

  const result = await db
    .prepare(
      "SELECT * FROM project_translations WHERE project_id = ? AND locale = ?",
    )
    .bind(id, locale)
    .first();

  return (result as ProjectTranslation | null) ?? null;
}

export async function createProject(input: CreateProjectInput): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO projects (
        id, author_id, project_status, start_date, end_date, team_size,
        project_order, url, source_url, blog_url, original_locale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.author_id,
      input.project_status,
      input.start_date,
      input.end_date,
      input.team_size,
      input.project_order,
      input.url,
      input.source_url,
      input.blog_url,
      input.original_locale,
    )
    .run();
}

export async function createProjectTranslation(
  input: CreateProjectTranslationInput,
): Promise<void> {
  const db = getDatabase();
  const sourceHash =
    input.source_hash ?? (await hashContent(input.tiptap_json));

  await db
    .prepare(
      `INSERT INTO project_translations (
        id, project_id, locale, title, description, tiptap_json,
        role, cover_image_url, publish_status, published_at, source_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.project_id,
      input.locale,
      input.title,
      input.description,
      input.tiptap_json,
      input.role,
      input.cover_image_url,
      input.publish_status,
      input.published_at,
      sourceHash,
    )
    .run();
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<void> {
  const db = getDatabase();

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = CURRENT_TIMESTAMP");

  await db
    .prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function updateProjectTranslation(
  projectId: string,
  locale: string,
  input: UpdateProjectTranslationInput,
): Promise<void> {
  const db = getDatabase();

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (input.tiptap_json !== undefined && input.source_hash === undefined) {
    fields.push("source_hash = ?");
    values.push(await hashContent(input.tiptap_json));
  }

  if (fields.length === 0) return;

  fields.push("updated_at = CURRENT_TIMESTAMP");

  await db
    .prepare(
      `UPDATE project_translations SET ${fields.join(", ")} WHERE project_id = ? AND locale = ?`,
    )
    .bind(...values, projectId, locale)
    .run();
}

export async function getProjectLocales(id: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT locale FROM project_translations WHERE project_id = ?")
    .bind(id)
    .all();
  return (result.results ?? []).map(
    (row) => (row as { locale: string }).locale,
  );
}

export async function updateProjectTranslationsCascade(
  id: string,
  originalLocale: string,
  newSourceHash: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `UPDATE project_translations
       SET source_hash = ?, updated_at = CURRENT_TIMESTAMP
       WHERE project_id = ? AND locale != ?`,
    )
    .bind(newSourceHash, id, originalLocale)
    .run();
}

export interface ProjectLocaleMeta {
  locale: string;
  publish_status: PublishStatus;
  source_hash: string | null;
  updated_at: string;
}

export async function getProjectLocaleMeta(
  id: string,
): Promise<ProjectLocaleMeta[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT locale, publish_status, source_hash, updated_at FROM project_translations WHERE project_id = ?",
    )
    .bind(id)
    .all();
  return (result.results ?? []) as unknown as ProjectLocaleMeta[];
}

export async function getProjectOriginalLocale(id: string): Promise<string> {
  const db = getDatabase();
  const row = await db
    .prepare("SELECT original_locale FROM projects WHERE id = ?")
    .bind(id)
    .first();
  return String(
    (row as { original_locale?: string } | null)?.original_locale ??
      DEFAULT_LANGUAGE,
  );
}

export async function getProjectOriginalHash(
  id: string,
): Promise<string | null> {
  const db = getDatabase();
  const project = await db
    .prepare("SELECT original_locale FROM projects WHERE id = ?")
    .bind(id)
    .first();
  if (!project) return null;

  const row = await db
    .prepare(
      "SELECT source_hash FROM project_translations WHERE project_id = ? AND locale = ?",
    )
    .bind(id, (project as { original_locale: string }).original_locale)
    .first();
  if (!row) return null;

  const hash = (row as { source_hash: string | null }).source_hash;
  return hash ?? null;
}

export async function getProjectLocalesWithContent(id: string): Promise<
  Array<{
    locale: string;
    tiptap_json: string;
    cover_image_url: string | null;
  }>
> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT locale, tiptap_json, cover_image_url FROM project_translations WHERE project_id = ?",
    )
    .bind(id)
    .all();
  return (result.results ?? []) as Array<{
    locale: string;
    tiptap_json: string;
    cover_image_url: string | null;
  }>;
}

export async function updateProjectOrderForAllLocales(
  id: string,
  projectOrder: number,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      "UPDATE projects SET project_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(projectOrder, id)
    .run();
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}

export async function deleteProjectTranslation(
  id: string,
  locale: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      "DELETE FROM project_translations WHERE project_id = ? AND locale = ?",
    )
    .bind(id, locale)
    .run();
}

export async function deleteAllProjectTranslations(id: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM project_translations WHERE project_id = ?")
    .bind(id)
    .run();
}
