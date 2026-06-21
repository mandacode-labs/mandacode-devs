import { getDatabase } from "@/lib/db/client";
import type { Post, PostTranslation, PublishStatus } from "@/lib/db/schema";

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
  tiptap_json: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
}

export interface UpdatePostTranslationInput {
  title?: string;
  description?: string | null;
  tiptap_json?: string;
  cover_image_url?: string | null;
  publish_status?: PublishStatus;
  published_at?: string | null;
}

export interface UpdatePostInput {
  original_locale?: string;
}

export interface GetPostsOptions {
  publishStatus?: PublishStatus;
}

export interface PostWithTranslation extends Post {
  title: string;
  description: string | null;
  tiptap_json: string;
  cover_image_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  is_fallback: boolean;
}

function rowToPostWithTranslation(
  row: Record<string, unknown>,
  locale: string,
): PostWithTranslation {
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
    original_locale: String(row.original_locale),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    title,
    description,
    tiptap_json,
    cover_image_url,
    publish_status,
    published_at,
    is_fallback: !hasTranslation,
  };
}

function buildListQuery(options: GetPostsOptions = {}): {
  query: string;
  params: (string | PublishStatus)[];
} {
  const params: (string | PublishStatus)[] = [];
  let query = `
    SELECT
      p.id,
      p.author_id,
      p.original_locale,
      p.created_at,
      p.updated_at,
      orig.title AS original_title,
      orig.description AS original_description,
      orig.tiptap_json AS original_tiptap_json,
      orig.cover_image_url AS original_cover_image_url,
      orig.publish_status AS original_publish_status,
      orig.published_at AS original_published_at,
      trans.title AS translation_title,
      trans.description AS translation_description,
      trans.tiptap_json AS translation_tiptap_json,
      trans.cover_image_url AS translation_cover_image_url,
      trans.publish_status AS translation_publish_status,
      trans.published_at AS translation_published_at
    FROM posts p
    LEFT JOIN post_translations orig
      ON p.id = orig.post_id AND orig.locale = p.original_locale
    LEFT JOIN post_translations trans
      ON p.id = trans.post_id AND trans.locale = ?
    WHERE orig.publish_status = ?
  `;
  params.push("placeholder-locale", "published");

  if (options.publishStatus) {
    query += " AND trans.publish_status = ?";
    params.push(options.publishStatus);
  }

  query += " ORDER BY COALESCE(orig.published_at, orig.created_at) DESC";

  return { query, params };
}

export async function getPosts(
  locale: string,
  options: GetPostsOptions = {},
): Promise<PostWithTranslation[]> {
  const db = getDatabase();
  const { query, params } = buildListQuery(options);
  params[0] = locale;

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return ((result.results ?? []) as Record<string, unknown>[]).map((row) =>
    rowToPostWithTranslation(row, locale),
  );
}

export async function getPostById(
  id: string,
  locale: string,
): Promise<PostWithTranslation | null> {
  const db = getDatabase();

  const result = await db
    .prepare(
      `
      SELECT
        p.id,
        p.author_id,
        p.original_locale,
        p.created_at,
        p.updated_at,
        orig.title AS original_title,
        orig.description AS original_description,
        orig.tiptap_json AS original_tiptap_json,
        orig.cover_image_url AS original_cover_image_url,
        orig.publish_status AS original_publish_status,
        orig.published_at AS original_published_at,
        trans.title AS translation_title,
        trans.description AS translation_description,
        trans.tiptap_json AS translation_tiptap_json,
        trans.cover_image_url AS translation_cover_image_url,
        trans.publish_status AS translation_publish_status,
        trans.published_at AS translation_published_at
      FROM posts p
      LEFT JOIN post_translations orig
        ON p.id = orig.post_id AND orig.locale = p.original_locale
      LEFT JOIN post_translations trans
        ON p.id = trans.post_id AND trans.locale = ?
      WHERE p.id = ?
      `,
    )
    .bind(locale, id)
    .first();

  if (!result) return null;
  return rowToPostWithTranslation(result as Record<string, unknown>, locale);
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
        id, post_id, locale, title, description, tiptap_json,
        cover_image_url, publish_status, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.post_id,
      input.locale,
      input.title,
      input.description,
      input.tiptap_json,
      input.cover_image_url,
      input.publish_status,
      input.published_at,
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

export async function updatePostTranslation(
  postId: string,
  locale: string,
  input: UpdatePostTranslationInput,
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
    .prepare(
      `UPDATE post_translations SET ${fields.join(", ")} WHERE post_id = ? AND locale = ?`,
    )
    .bind(...values, postId, locale)
    .run();
}

export async function getPostLocales(id: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT locale FROM post_translations WHERE post_id = ?")
    .bind(id)
    .all();
  return (result.results ?? []).map(
    (row) => (row as { locale: string }).locale,
  );
}

export async function getPostLocalesWithContent(id: string): Promise<
  Array<{
    locale: string;
    tiptap_json: string;
    cover_image_url: string | null;
  }>
> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT locale, tiptap_json, cover_image_url FROM post_translations WHERE post_id = ?",
    )
    .bind(id)
    .all();
  return (result.results ?? []) as Array<{
    locale: string;
    tiptap_json: string;
    cover_image_url: string | null;
  }>;
}

export async function deletePost(id: string): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
}

export async function deletePostTranslation(
  id: string,
  locale: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM post_translations WHERE post_id = ? AND locale = ?")
    .bind(id, locale)
    .run();
}

export async function deleteAllPostTranslations(id: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM post_translations WHERE post_id = ?")
    .bind(id)
    .run();
}
