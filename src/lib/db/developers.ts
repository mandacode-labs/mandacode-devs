import { getDatabase } from "@/lib/db/client";
import type { Developer } from "@/lib/db/schema";

export interface CreateDeveloperInput {
  id: string;
  locale: string;
  origin: string | null;
  author_id: string;
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  github_url: string | null;
  email: string | null;
  website_url: string | null;
  tech_stack: string | null;
  certifications: string | null;
  education: string | null;
  published_at: string | null;
}

export interface UpdateDeveloperInput {
  name?: string;
  role?: string;
  bio?: string;
  tiptap_json?: string;
  avatar_url?: string | null;
  github_url?: string | null;
  email?: string | null;
  website_url?: string | null;
  tech_stack?: string | null;
  certifications?: string | null;
  education?: string | null;
  published_at?: string | null;
}

export async function getDevelopers(locale: string): Promise<Developer[]> {
  const db = getDatabase();

  const result = await db
    .prepare("SELECT * FROM developers WHERE locale = ? ORDER BY name ASC")
    .bind(locale)
    .all();

  return (result.results ?? []) as unknown as Developer[];
}

export async function getDeveloperById(
  id: string,
  locale: string,
): Promise<Developer | null> {
  const db = getDatabase();

  const result = await db
    .prepare("SELECT * FROM developers WHERE id = ? AND locale = ?")
    .bind(id, locale)
    .first();

  return (result as Developer | null) ?? null;
}

export async function getDeveloperByIdWithFallback(
  id: string,
  locale: string,
  fallbackLocale: string,
): Promise<Developer | null> {
  const developer = await getDeveloperById(id, locale);
  if (developer) {
    return developer;
  }

  return getDeveloperById(id, fallbackLocale);
}

export async function createDeveloper(
  input: CreateDeveloperInput,
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO developers (
        id, locale, origin, author_id, name, role, bio, tiptap_json,
        avatar_url, github_url, email, website_url, tech_stack,
        certifications, education, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.locale,
      input.origin,
      input.author_id,
      input.name,
      input.role,
      input.bio,
      input.tiptap_json,
      input.avatar_url,
      input.github_url,
      input.email,
      input.website_url,
      input.tech_stack,
      input.certifications,
      input.education,
      input.published_at,
    )
    .run();
}

export async function updateDeveloper(
  id: string,
  locale: string,
  input: UpdateDeveloperInput,
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
      `UPDATE developers SET ${fields.join(", ")} WHERE id = ? AND locale = ?`,
    )
    .bind(...values, id, locale)
    .run();
}

export async function deleteDeveloper(
  id: string,
  locale?: string,
): Promise<void> {
  const db = getDatabase();

  if (locale) {
    await db
      .prepare("DELETE FROM developers WHERE id = ? AND locale = ?")
      .bind(id, locale)
      .run();
    return;
  }

  await db.prepare("DELETE FROM developers WHERE id = ?").bind(id).run();
}

export async function deleteAllDeveloperLocales(id: string): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM developers WHERE id = ?").bind(id).run();
}
