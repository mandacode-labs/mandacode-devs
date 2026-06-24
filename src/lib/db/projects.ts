import { getDatabase } from "@/lib/db/client";
import {
  deleteAllEntityTranslations,
  deleteEntity,
  deleteEntityTranslation,
  getByIdWithTranslation,
  getEntityLocaleMeta,
  getEntityLocales,
  getEntityLocalesWithContent,
  getEntityOriginalHash,
  getEntityOriginalLocale,
  getListWithTranslation,
  updateEntityTranslation,
  type ListOptions,
  type LocaleMeta,
  type MainTableConfig,
  type TransTableConfig,
} from "@/lib/db/translation-repo";
import type {
  Project,
  ProjectTranslation,
  ProjectStatus,
  PublishStatus,
} from "@/lib/db/schema";

export type { LocaleMeta as ProjectLocaleMeta };

const MAIN_CFG: MainTableConfig = {
  table: "projects",
  alias: "p",
  idColumn: "id",
  baseColumns: [
    "id",
    "author_id",
    "project_status",
    "start_date",
    "end_date",
    "team_size",
    "project_order",
    "url",
    "source_url",
    "blog_post_id",
    "original_locale",
    "created_at",
    "updated_at",
  ],
};

const TRANS_CFG: TransTableConfig = {
  table: "project_translations",
  alias: "orig",
  idColumn: "project_id",
  transColumns: [
    "title",
    "description",
    "article",
    "role",
    "cover_image_url",
    "publish_status",
    "published_at",
  ],
};

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
  blog_post_id: string | null;
  original_locale: string;
}

export interface CreateProjectTranslationInput {
  id: string;
  project_id: string;
  locale: string;
  title: string;
  description: string | null;
  article: string;
  role: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  source_hash: string;
}

export interface UpdateProjectTranslationInput {
  title?: string;
  description?: string | null;
  article?: string;
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
  blog_post_id?: string | null;
  original_locale?: string;
}

export interface GetProjectsOptions extends ListOptions {}

export interface ProjectWithTranslation extends Project {
  title: string;
  description: string | null;
  article: string;
  role: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  is_fallback: boolean;
}

function mapProjectRow(row: Record<string, unknown>): ProjectWithTranslation {
  const hasTranslation = row.translation_title !== null;
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
    blog_post_id: (row.blog_post_id as string | null) ?? null,
    original_locale: String(row.original_locale),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title: String(hasTranslation ? row.translation_title : row.original_title),
    description: hasTranslation
      ? (row.translation_description as string | null)
      : (row.original_description as string | null),
    article: String(
      hasTranslation ? row.translation_article : row.original_article,
    ),
    role: String(hasTranslation ? row.translation_role : row.original_role),
    cover_image_url: hasTranslation
      ? (row.translation_cover_image_url as string | null)
      : (row.original_cover_image_url as string | null),
    publish_status: String(
      hasTranslation
        ? row.translation_publish_status
        : row.original_publish_status,
    ) as PublishStatus,
    published_at: hasTranslation
      ? (row.translation_published_at as string | null)
      : (row.original_published_at as string | null),
    is_fallback: !hasTranslation,
  };
}

export const rowToProjectWithTranslation = mapProjectRow;

export async function getProjects(
  locale: string,
  options: GetProjectsOptions = {},
): Promise<ProjectWithTranslation[]> {
  return getListWithTranslation(
    MAIN_CFG,
    TRANS_CFG,
    locale,
    options,
    mapProjectRow,
  );
}

export async function getProjectById(
  id: string,
  locale: string,
): Promise<ProjectWithTranslation | null> {
  return getByIdWithTranslation(MAIN_CFG, TRANS_CFG, locale, id, mapProjectRow);
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
        project_order, url, source_url, blog_post_id, original_locale
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
      input.blog_post_id,
      input.original_locale,
    )
    .run();
}

export async function createProjectTranslation(
  input: CreateProjectTranslationInput,
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO project_translations (
        id, project_id, locale, title, description, article,
        role, cover_image_url, publish_status, published_at, source_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.project_id,
      input.locale,
      input.title,
      input.description,
      input.article,
      input.role,
      input.cover_image_url,
      input.publish_status,
      input.published_at,
      input.source_hash,
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

export function updateProjectTranslation(
  projectId: string,
  locale: string,
  input: UpdateProjectTranslationInput,
): Promise<void> {
  return updateEntityTranslation(
    "project_translations",
    "project_id",
    projectId,
    locale,
    input as Record<string, unknown>,
  );
}

export const getProjectLocales = (id: string) =>
  getEntityLocales("project_translations", "project_id", id);

export const getProjectLocaleMeta = (id: string) =>
  getEntityLocaleMeta("project_translations", "project_id", id);

export const getProjectOriginalLocale = (id: string) =>
  getEntityOriginalLocale("projects", id);

export const getProjectOriginalHash = (id: string) =>
  getEntityOriginalHash("projects", "project_translations", "project_id", id);

export function getProjectLocalesWithContent(id: string): Promise<
  Array<{
    locale: string;
    article: string;
    cover_image_url: string | null;
  }>
> {
  return getEntityLocalesWithContent("project_translations", "project_id", id, [
    "cover_image_url",
  ]) as Promise<
    Array<{
      locale: string;
      article: string;
      cover_image_url: string | null;
    }>
  >;
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

export const deleteProject = (id: string) => deleteEntity("projects", id);

export const deleteProjectTranslation = (id: string, locale: string) =>
  deleteEntityTranslation("project_translations", "project_id", id, locale);

export const deleteAllProjectTranslations = (id: string) =>
  deleteAllEntityTranslations("project_translations", "project_id", id);
