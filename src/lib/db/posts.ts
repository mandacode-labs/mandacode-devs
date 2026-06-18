import { getDatabase } from "@/lib/db/client";
import type { Post, PublishStatus } from "@/lib/db/schema";

export interface CreatePostInput {
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
}

export interface UpdatePostInput {
  title?: string;
  description?: string | null;
  tiptap_json?: string;
  publish_status?: PublishStatus;
  hidden?: number;
  pub_date?: string;
  cover_image_url?: string | null;
  og_image_url?: string | null;
  published_at?: string | null;
}

export interface GetPostsOptions {
  publishStatus?: PublishStatus;
  includeHidden?: boolean;
}

export async function getPosts(
  locale: string,
  options: GetPostsOptions = {},
): Promise<Post[]> {
  const db = getDatabase();

  let query = "SELECT * FROM posts WHERE locale = ?";
  const params: (string | PublishStatus | number)[] = [locale];

  if (options.publishStatus) {
    query += " AND publish_status = ?";
    params.push(options.publishStatus);
  }

  if (!options.includeHidden) {
    query += " AND hidden = 0";
  }

  query += " ORDER BY pub_date DESC";

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return (result.results ?? []) as unknown as Post[];
}

export async function getPostById(
  id: string,
  locale: string,
): Promise<Post | null> {
  const db = getDatabase();

  const result = await db
    .prepare("SELECT * FROM posts WHERE id = ? AND locale = ?")
    .bind(id, locale)
    .first();

  return (result as Post | null) ?? null;
}

export async function getPostByIdWithFallback(
  id: string,
  locale: string,
  fallbackLocale: string,
): Promise<Post | null> {
  const post = await getPostById(id, locale);
  if (post) {
    return post;
  }

  return getPostById(id, fallbackLocale);
}

export async function createPost(input: CreatePostInput): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO posts (
        id, locale, origin, author_id, title, description, tiptap_json,
        publish_status, hidden, pub_date, cover_image_url, og_image_url, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      input.hidden,
      input.pub_date,
      input.cover_image_url,
      input.og_image_url,
      input.published_at,
    )
    .run();
}

export async function updatePost(
  id: string,
  locale: string,
  input: UpdatePostInput,
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
      `UPDATE posts SET ${fields.join(", ")} WHERE id = ? AND locale = ?`,
    )
    .bind(...values, id, locale)
    .run();
}

export async function getAllPosts(locale?: string): Promise<Post[]> {
  const db = getDatabase();

  let query = "SELECT * FROM posts";
  const params: (string | number)[] = [];

  if (locale) {
    query += " WHERE locale = ?";
    params.push(locale);
  }

  query += " ORDER BY pub_date DESC";

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return (result.results ?? []) as unknown as Post[];
}

export async function getPostLocales(id: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT locale FROM posts WHERE id = ?")
    .bind(id)
    .all();
  return (result.results ?? []).map(
    (row) => (row as { locale: string }).locale,
  );
}

export async function deletePost(id: string, locale?: string): Promise<void> {
  const db = getDatabase();

  if (locale) {
    await db
      .prepare("DELETE FROM posts WHERE id = ? AND locale = ?")
      .bind(id, locale)
      .run();
    return;
  }

  await db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
}

export async function deleteAllPostLocales(id: string): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
}
