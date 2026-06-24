import { getDatabase } from "@/lib/db/client";
import type { Tag } from "@/lib/db/schema";

export interface TagWithUsage {
  id: number;
  name: string;
  postCount: number;
  projectCount: number;
  developerCount: number;
  totalCount: number;
}

export type TagReferenceType = "post" | "project" | "developer";

export interface TagReference {
  type: TagReferenceType;
  id: string;
  title: string;
  locale?: string;
  href: string;
}

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

export async function setDeveloperTags(
  developerId: string,
  tagNames: string[],
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare("DELETE FROM developer_tags WHERE developer_id = ?")
    .bind(developerId)
    .run();

  const tags = await findOrCreateTags(tagNames);
  if (tags.length === 0) return;

  const placeholders = tags.map(() => "(?, ?)").join(", ");
  const values = tags.flatMap((tag) => [developerId, tag.id]);

  await db
    .prepare(
      `INSERT INTO developer_tags (developer_id, tag_id) VALUES ${placeholders}`,
    )
    .bind(...values)
    .run();
}

export async function getDeveloperTags(developerId: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `SELECT t.name
       FROM developer_tags dt
       JOIN tags t ON dt.tag_id = t.id
       WHERE dt.developer_id = ?
       ORDER BY t.name`,
    )
    .bind(developerId)
    .all();

  return (result.results ?? []).map((row) => (row as { name: string }).name);
}

export async function deleteDeveloperTags(developerId: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM developer_tags WHERE developer_id = ?")
    .bind(developerId)
    .run();
}

export async function listTagsWithUsage(
  query: string | null = null,
): Promise<TagWithUsage[]> {
  const db = getDatabase();
  const like = query ? `%${query.replace(/[\\%_]/g, "\\$&")}%` : null;
  const result = await db
    .prepare(
      `
      SELECT
        t.id,
        t.name,
        (SELECT COUNT(*) FROM post_tags pt WHERE pt.tag_id = t.id) AS post_count,
        (SELECT COUNT(*) FROM project_tags pt WHERE pt.tag_id = t.id) AS project_count,
        (SELECT COUNT(*) FROM developer_tags dt WHERE dt.tag_id = t.id) AS developer_count
      FROM tags t
      ${like ? "WHERE t.name LIKE ? ESCAPE '\\'" : ""}
      ORDER BY t.name
      `,
    )
    .bind(...(like ? [like] : []))
    .all<TagWithUsageRow>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    postCount: row.post_count,
    projectCount: row.project_count,
    developerCount: row.developer_count,
    totalCount: row.post_count + row.project_count + row.developer_count,
  }));
}

interface TagWithUsageRow {
  id: number;
  name: string;
  post_count: number;
  project_count: number;
  developer_count: number;
}

export async function getTagById(id: number): Promise<Tag | null> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT id, name FROM tags WHERE id = ?")
    .bind(id)
    .first();
  return (result as Tag | null) ?? null;
}

export async function getTagUsage(tagId: number): Promise<TagReference[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `
      SELECT 'post' AS type, p.id AS id, pt.title AS title, NULL AS locale,
             '/admin/posts/edit/' || p.id || '?locale=ko' AS href
      FROM post_tags ptg
      JOIN posts p ON p.id = ptg.post_id
      JOIN post_translations pt ON pt.post_id = p.id AND pt.locale = p.original_locale
      WHERE ptg.tag_id = ?
      UNION ALL
      SELECT 'project' AS type, p.id AS id, pt.title AS title, NULL AS locale,
             '/admin/projects/edit/' || p.id || '?locale=ko' AS href
      FROM project_tags ptg
      JOIN projects p ON p.id = ptg.project_id
      JOIN project_translations pt ON pt.project_id = p.id AND pt.locale = p.original_locale
      WHERE ptg.tag_id = ?
      UNION ALL
      SELECT 'developer' AS type, d.id AS id, dt.name AS title, NULL AS locale,
             '/admin/developers/edit/' || d.id || '?locale=ko' AS href
      FROM developer_tags dtg
      JOIN developers d ON d.id = dtg.developer_id
      JOIN developer_translations dt ON dt.developer_id = d.id AND dt.locale = d.original_locale
      WHERE dtg.tag_id = ?
      ORDER BY type, title
      `,
    )
    .bind(tagId, tagId, tagId)
    .all<{
      type: TagReferenceType;
      id: string;
      title: string;
      locale: string | null;
      href: string;
    }>();

  return (result.results ?? []).map((row) => ({
    type: row.type,
    id: row.id,
    title: row.title,
    href: row.href,
  }));
}

export async function renameTag(id: number, newName: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("UPDATE tags SET name = ? WHERE id = ?")
    .bind(newName, id)
    .run();
}

export async function deleteTag(id: number): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();
}
