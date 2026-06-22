import { getDatabase } from "@/lib/db/client";
import type { Tag } from "@/lib/db/schema";

export async function findOrCreateTags(names: string[]): Promise<Tag[]> {
  const db = getDatabase();
  const normalized = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const tags: Tag[] = [];

  for (const name of normalized) {
    const existing = await db
      .prepare("SELECT id, name FROM tags WHERE name = ?")
      .bind(name)
      .first();

    if (existing) {
      tags.push(existing as unknown as Tag);
      continue;
    }

    const created = await db
      .prepare("INSERT INTO tags (name) VALUES (?) RETURNING id, name")
      .bind(name)
      .first();

    tags.push(created as unknown as Tag);
  }

  return tags;
}

export async function setPostTags(
  postId: string,
  tagNames: string[],
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare("DELETE FROM post_tags WHERE post_id = ?")
    .bind(postId)
    .run();

  const tags = await findOrCreateTags(tagNames);
  if (tags.length === 0) return;

  const placeholders = tags.map(() => "(?, ?)").join(", ");
  const values = tags.flatMap((tag) => [postId, tag.id]);

  await db
    .prepare(`INSERT INTO post_tags (post_id, tag_id) VALUES ${placeholders}`)
    .bind(...values)
    .run();
}

export async function getPostTags(postId: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `
      SELECT t.name
      FROM post_tags pt
      JOIN tags t ON pt.tag_id = t.id
      WHERE pt.post_id = ?
      ORDER BY t.name
      `,
    )
    .bind(postId)
    .all();

  return (result.results ?? []).map((row) => (row as { name: string }).name);
}

export async function setProjectTags(
  projectId: string,
  tagNames: string[],
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare("DELETE FROM project_tags WHERE project_id = ?")
    .bind(projectId)
    .run();

  const tags = await findOrCreateTags(tagNames);
  if (tags.length === 0) return;

  const placeholders = tags.map(() => "(?, ?)").join(", ");
  const values = tags.flatMap((tag) => [projectId, tag.id]);

  await db
    .prepare(
      `INSERT INTO project_tags (project_id, tag_id) VALUES ${placeholders}`,
    )
    .bind(...values)
    .run();
}

export async function getProjectTags(projectId: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `
      SELECT t.name
      FROM project_tags pt
      JOIN tags t ON pt.tag_id = t.id
      WHERE pt.project_id = ?
      ORDER BY t.name
      `,
    )
    .bind(projectId)
    .all();

  return (result.results ?? []).map((row) => (row as { name: string }).name);
}

export async function deletePostTags(postId: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM post_tags WHERE post_id = ?")
    .bind(postId)
    .run();
}

export async function deleteProjectTags(projectId: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM project_tags WHERE project_id = ?")
    .bind(projectId)
    .run();
}

export async function searchTags(query: string, limit = 20): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT ?")
    .bind(`%${query}%`, limit)
    .all();

  return (result.results ?? []).map((row) => (row as { name: string }).name);
}
