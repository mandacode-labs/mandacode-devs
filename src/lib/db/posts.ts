import { getDatabase } from "@/lib/db/client";
import {
  buildByIdQuery,
  buildListQuery,
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
import type { Post, PostTranslation, PublishStatus } from "@/lib/db/schema";

export type { LocaleMeta as PostLocaleMeta };

const MAIN_CFG: MainTableConfig = {
  table: "posts",
  alias: "p",
  idColumn: "id",
  baseColumns: [
    "id",
    "author_id",
    "original_locale",
    "created_at",
    "updated_at",
  ],
};

const TRANS_CFG: TransTableConfig = {
  table: "post_translations",
  alias: "orig",
  idColumn: "post_id",
  transColumns: [
    "title",
    "description",
    "body",
    "cover_image_url",
    "publish_status",
    "published_at",
  ],
};

export interface CreatePostInput {
  id: string;
  author_id: string;
  original_locale: string;
}

export interface CreatePostTranslationInput {
  id: string;
  post_id: string;
  locale: string;
  title: string;
  description: string | null;
  body: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  source_hash: string;
}

export interface UpdatePostTranslationInput {
  title?: string;
  description?: string | null;
  body?: string;
  cover_image_url?: string | null;
  publish_status?: PublishStatus;
  published_at?: string | null;
  source_hash?: string | null;
}

export interface UpdatePostInput {
  original_locale?: string;
}

export interface GetPostsOptions extends ListOptions {}

export interface PostWithTranslation extends Post {
  title: string;
  description: string | null;
  body: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  is_fallback: boolean;
}

function mapPostRow(row: Record<string, unknown>): PostWithTranslation {
  const hasTranslation = row.translation_title !== null;
  return {
    id: String(row.id),
    author_id: String(row.author_id),
    original_locale: String(row.original_locale),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title: String(hasTranslation ? row.translation_title : row.original_title),
    description: hasTranslation
      ? (row.translation_description as string | null)
      : (row.original_description as string | null),
    body: String(hasTranslation ? row.translation_body : row.original_body),
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

export const rowToPostWithTranslation = mapPostRow;

export async function getPosts(
  locale: string,
  options: GetPostsOptions = {},
): Promise<PostWithTranslation[]> {
  return getListWithTranslation(
    MAIN_CFG,
    TRANS_CFG,
    locale,
    options,
    mapPostRow,
  );
}

export async function getPostById(
  id: string,
  locale: string,
): Promise<PostWithTranslation | null> {
  return getByIdWithTranslation(MAIN_CFG, TRANS_CFG, locale, id, mapPostRow);
}

export interface PostSearchResult {
  id: string;
  title: string;
  original_locale: string;
}

export async function searchPostsByTitle(
  query: string,
  limit = 10,
): Promise<PostSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const db = getDatabase();
  // Match by id prefix OR by title in any locale (substring). The
  // returned title is always the canonical original-locale title so
  // the admin sees the same text regardless of UI language.
  // Rank id matches above title matches; tie-break on recency.
  const like = escapeLike(trimmed);
  const result = await db
    .prepare(
      `SELECT p.id, p.original_locale, orig.title AS original_title,
              CASE
                WHEN LOWER(p.id) LIKE LOWER(?) ESCAPE '\\' THEN 0
                ELSE 1
              END AS match_kind
         FROM posts p
         LEFT JOIN post_translations orig
           ON orig.post_id = p.id AND orig.locale = p.original_locale
        WHERE LOWER(p.id) LIKE LOWER(?) ESCAPE '\\'
           OR EXISTS (
             SELECT 1 FROM post_translations pt
             WHERE pt.post_id = p.id
               AND LOWER(pt.title) LIKE LOWER(?) ESCAPE '\\'
           )
        ORDER BY match_kind ASC, p.updated_at DESC
        LIMIT ?`,
    )
    .bind(`${like}%`, `${like}%`, `%${like}%`, limit)
    .all<{
      id: string;
      original_locale: string;
      original_title: string | null;
      match_kind: number;
    }>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    original_locale: row.original_locale,
    title: row.original_title ?? "(untitled)",
  }));
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getPostTranslationById(
  id: string,
  locale: string,
): Promise<PostTranslation | null> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT * FROM post_translations WHERE post_id = ? AND locale = ?")
    .bind(id, locale)
    .first();
  return (result as PostTranslation | null) ?? null;
}

export async function createPost(input: CreatePostInput): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      "INSERT INTO posts (id, author_id, original_locale) VALUES (?, ?, ?)",
    )
    .bind(input.id, input.author_id, input.original_locale)
    .run();
}

export async function createPostTranslation(
  input: CreatePostTranslationInput,
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO post_translations (
        id, post_id, locale, title, description, body,
        cover_image_url, publish_status, published_at, source_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.post_id,
      input.locale,
      input.title,
      input.description,
      input.body,
      input.cover_image_url,
      input.publish_status,
      input.published_at,
      input.source_hash,
    )
    .run();
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
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
    .prepare(`UPDATE posts SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export function updatePostTranslation(
  postId: string,
  locale: string,
  input: UpdatePostTranslationInput,
): Promise<void> {
  return updateEntityTranslation(
    "post_translations",
    "post_id",
    postId,
    locale,
    input as Record<string, unknown>,
  );
}

export const getPostLocales = (id: string) =>
  getEntityLocales("post_translations", "post_id", id);

export const getPostLocaleMeta = (id: string) =>
  getEntityLocaleMeta("post_translations", "post_id", id);

export const getPostOriginalLocale = (id: string) =>
  getEntityOriginalLocale("posts", id);

export const getPostOriginalHash = (id: string) =>
  getEntityOriginalHash("posts", "post_translations", "post_id", id);

export function getPostLocalesWithContent(id: string): Promise<
  Array<{
    locale: string;
    body: string;
    cover_image_url: string | null;
  }>
> {
  return getEntityLocalesWithContent(
    "post_translations",
    "post_id",
    id,
    "body",
    ["cover_image_url"],
  ) as Promise<
    Array<{
      locale: string;
      body: string;
      cover_image_url: string | null;
    }>
  >;
}

export const deletePost = (id: string) => deleteEntity("posts", id);

export const deletePostTranslation = (id: string, locale: string) =>
  deleteEntityTranslation("post_translations", "post_id", id, locale);

export const deleteAllPostTranslations = (id: string) =>
  deleteAllEntityTranslations("post_translations", "post_id", id);
