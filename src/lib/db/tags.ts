import { getDatabase } from "@/lib/db/client";
import type { Tag } from "@/lib/db/schema";

export interface EntityTags {
  id: string;
  locale: string;
  tags: string[];
}

export async function findOrCreateTags(names: string[]): Promise<Tag[]> {
  const db = getDatabase();
  const normalized = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const tags: Tag[] = [];

  for (const name of normalized) {
    const existing = await db
      .prepare("SELECT id, name FROM tags WHERE name = ?")
      .bind(name)
      .first<Tag>();

    if (existing) {
      tags.push(existing);
    } else {
      const result = await db
        .prepare("INSERT INTO tags (name) VALUES (?) RETURNING id, name")
        .bind(name)
        .first<Tag>();
      if (result) tags.push(result);
    }
  }

  return tags;
}

export async function setPostTags(
  postId: string,
  locale: string,
  tagNames: string[],
): Promise<void> {
  const db = getDatabase();
  const tags = await findOrCreateTags(tagNames);

  await db
    .prepare("DELETE FROM post_tags WHERE post_id = ? AND post_locale = ?")
    .bind(postId, locale)
    .run();

  if (tags.length === 0) return;

  const placeholders = tags.map(() => "(?, ?, ?)").join(", ");
  const values = tags.flatMap((tag) => [postId, locale, tag.id]);

  await db
    .prepare(
      `INSERT INTO post_tags (post_id, post_locale, tag_id) VALUES ${placeholders}`,
    )
    .bind(...values)
    .run();
}

export async function getPostTags(
  postId: string,
  locale: string,
): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `SELECT t.name FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       WHERE pt.post_id = ? AND pt.post_locale = ?
       ORDER BY t.name`,
    )
    .bind(postId, locale)
    .all();
  return ((result.results ?? []) as { name: string }[]).map((row) => row.name);
}

export async function setProjectTags(
  projectId: string,
  locale: string,
  tagNames: string[],
): Promise<void> {
  const db = getDatabase();
  const tags = await findOrCreateTags(tagNames);

  await db
    .prepare(
      "DELETE FROM project_tags WHERE project_id = ? AND project_locale = ?",
    )
    .bind(projectId, locale)
    .run();

  if (tags.length === 0) return;

  const placeholders = tags.map(() => "(?, ?, ?)").join(", ");
  const values = tags.flatMap((tag) => [projectId, locale, tag.id]);

  await db
    .prepare(
      `INSERT INTO project_tags (project_id, project_locale, tag_id) VALUES ${placeholders}`,
    )
    .bind(...values)
    .run();
}

export async function getProjectTags(
  projectId: string,
  locale: string,
): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `SELECT t.name FROM tags t
       JOIN project_tags pt ON pt.tag_id = t.id
       WHERE pt.project_id = ? AND pt.project_locale = ?
       ORDER BY t.name`,
    )
    .bind(projectId, locale)
    .all();
  return ((result.results ?? []) as { name: string }[]).map((row) => row.name);
}

export async function deletePostTags(
  postId: string,
  locale?: string,
): Promise<void> {
  const db = getDatabase();
  if (locale) {
    await db
      .prepare("DELETE FROM post_tags WHERE post_id = ? AND post_locale = ?")
      .bind(postId, locale)
      .run();
    return;
  }
  await db
    .prepare("DELETE FROM post_tags WHERE post_id = ?")
    .bind(postId)
    .run();
}

export async function deleteProjectTags(
  projectId: string,
  locale?: string,
): Promise<void> {
  const db = getDatabase();
  if (locale) {
    await db
      .prepare(
        "DELETE FROM project_tags WHERE project_id = ? AND project_locale = ?",
      )
      .bind(projectId, locale)
      .run();
    return;
  }
  await db
    .prepare("DELETE FROM project_tags WHERE project_id = ?")
    .bind(projectId)
    .run();
}

export async function searchTags(query: string, limit = 10): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT ?")
    .bind(`%${query}%`, limit)
    .all();
  return ((result.results ?? []) as { name: string }[]).map((row) => row.name);
}

export async function cleanupUnusedTags(): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `DELETE FROM tags WHERE id NOT IN (
        SELECT tag_id FROM post_tags
        UNION
        SELECT tag_id FROM project_tags
      )`,
    )
    .run();
}
