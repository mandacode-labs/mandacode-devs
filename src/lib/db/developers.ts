import { getDatabase } from "@/lib/db/client";
import { hashContent } from "@/lib/hash";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import type {
  Developer,
  DeveloperTranslation,
  PublishStatus,
} from "@/lib/db/schema";

export interface CreateDeveloperInput {
  id: string;
  author_id: string;
  github_url: string | null;
  email: string | null;
  website_url: string | null;
  tech_stack: string | null;
  certifications: string | null;
  education: string | null;
  original_locale: string;
}

export interface CreateDeveloperTranslationInput {
  id: string;
  developer_id: string;
  locale: string;
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  source_hash?: string | null;
}

export interface UpdateDeveloperTranslationInput {
  name?: string;
  role?: string;
  bio?: string;
  tiptap_json?: string;
  avatar_url?: string | null;
  publish_status?: PublishStatus;
  published_at?: string | null;
  source_hash?: string | null;
}

export interface UpdateDeveloperInput {
  github_url?: string | null;
  email?: string | null;
  website_url?: string | null;
  tech_stack?: string | null;
  certifications?: string | null;
  education?: string | null;
  original_locale?: string;
}

export interface DeveloperWithTranslation extends Developer {
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  is_fallback: boolean;
}

export function rowToDeveloperWithTranslation(
  row: Record<string, unknown>,
): DeveloperWithTranslation {
  const hasTranslation = row.translation_name !== null;
  const name = String(
    hasTranslation ? row.translation_name : row.original_name,
  );
  const role = String(
    hasTranslation ? row.translation_role : row.original_role,
  );
  const bio = String(hasTranslation ? row.translation_bio : row.original_bio);
  const tiptap_json = String(
    hasTranslation ? row.translation_tiptap_json : row.original_tiptap_json,
  );
  const avatar_url = hasTranslation
    ? (row.translation_avatar_url as string | null)
    : (row.original_avatar_url as string | null);
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
    github_url: (row.github_url as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website_url: (row.website_url as string | null) ?? null,
    tech_stack: (row.tech_stack as string | null) ?? null,
    certifications: (row.certifications as string | null) ?? null,
    education: (row.education as string | null) ?? null,
    original_locale: String(row.original_locale),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name,
    role,
    bio,
    tiptap_json,
    avatar_url,
    publish_status,
    published_at,
    is_fallback: !hasTranslation,
  };
}

function buildListQuery(options: GetDevelopersOptions = {}): {
  query: string;
  params: string[];
} {
  const params: string[] = [];
  let query = `
    SELECT
      d.id,
      d.author_id,
      d.github_url,
      d.email,
      d.website_url,
      d.tech_stack,
      d.certifications,
      d.education,
      d.original_locale,
      d.created_at,
      d.updated_at,
      orig.name AS original_name,
      orig.role AS original_role,
      orig.bio AS original_bio,
      orig.tiptap_json AS original_tiptap_json,
      orig.avatar_url AS original_avatar_url,
      orig.publish_status AS original_publish_status,
      orig.published_at AS original_published_at,
      trans.name AS translation_name,
      trans.role AS translation_role,
      trans.bio AS translation_bio,
      trans.tiptap_json AS translation_tiptap_json,
      trans.avatar_url AS translation_avatar_url,
      trans.publish_status AS translation_publish_status,
      trans.published_at AS translation_published_at
    FROM developers d
    LEFT JOIN developer_translations orig
      ON d.id = orig.developer_id AND orig.locale = d.original_locale
    LEFT JOIN developer_translations trans
      ON d.id = trans.developer_id AND trans.locale = ?
  `;
  params.push("placeholder-locale");

  if (!options.includeUnpublished) {
    query += " WHERE orig.publish_status = 'published'";
  }

  query += " ORDER BY orig.name ASC";

  return { query, params };
}

export interface GetDevelopersOptions {
  includeUnpublished?: boolean;
}

export async function getDevelopers(
  locale: string,
  options: GetDevelopersOptions = {},
): Promise<DeveloperWithTranslation[]> {
  const db = getDatabase();
  const { query, params } = buildListQuery(options);
  params[0] = locale;

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return ((result.results ?? []) as Record<string, unknown>[]).map(
    rowToDeveloperWithTranslation,
  );
}

export async function getDeveloperById(
  id: string,
  locale: string,
): Promise<DeveloperWithTranslation | null> {
  const db = getDatabase();

  const result = await db
    .prepare(
      `
      SELECT
        d.id,
        d.author_id,
        d.github_url,
        d.email,
        d.website_url,
        d.tech_stack,
        d.certifications,
        d.education,
        d.original_locale,
        d.created_at,
        d.updated_at,
        orig.name AS original_name,
        orig.role AS original_role,
        orig.bio AS original_bio,
        orig.tiptap_json AS original_tiptap_json,
        orig.avatar_url AS original_avatar_url,
        orig.publish_status AS original_publish_status,
        orig.published_at AS original_published_at,
        trans.name AS translation_name,
        trans.role AS translation_role,
        trans.bio AS translation_bio,
        trans.tiptap_json AS translation_tiptap_json,
        trans.avatar_url AS translation_avatar_url,
        trans.publish_status AS translation_publish_status,
        trans.published_at AS translation_published_at
      FROM developers d
      LEFT JOIN developer_translations orig
        ON d.id = orig.developer_id AND orig.locale = d.original_locale
      LEFT JOIN developer_translations trans
        ON d.id = trans.developer_id AND trans.locale = ?
      WHERE d.id = ?
      `,
    )
    .bind(locale, id)
    .first();

  if (!result) return null;
  return rowToDeveloperWithTranslation(result as Record<string, unknown>);
}

export async function getDeveloperTranslationById(
  id: string,
  locale: string,
): Promise<DeveloperTranslation | null> {
  const db = getDatabase();

  const result = await db
    .prepare(
      "SELECT * FROM developer_translations WHERE developer_id = ? AND locale = ?",
    )
    .bind(id, locale)
    .first();

  return (result as DeveloperTranslation | null) ?? null;
}

export async function createDeveloper(
  input: CreateDeveloperInput,
): Promise<void> {
  const db = getDatabase();

  await db
    .prepare(
      `INSERT INTO developers (
        id, author_id, github_url, email, website_url, tech_stack,
        certifications, education, original_locale
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.author_id,
      input.github_url,
      input.email,
      input.website_url,
      input.tech_stack,
      input.certifications,
      input.education,
      input.original_locale,
    )
    .run();
}

export async function createDeveloperTranslation(
  input: CreateDeveloperTranslationInput,
): Promise<void> {
  const db = getDatabase();
  const sourceHash =
    input.source_hash ?? (await hashContent(input.tiptap_json));

  await db
    .prepare(
      `INSERT INTO developer_translations (
        id, developer_id, locale, name, role, bio, tiptap_json,
        avatar_url, publish_status, published_at, source_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.developer_id,
      input.locale,
      input.name,
      input.role,
      input.bio,
      input.tiptap_json,
      input.avatar_url,
      input.publish_status,
      input.published_at,
      sourceHash,
    )
    .run();
}

export async function updateDeveloper(
  id: string,
  input: UpdateDeveloperInput,
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
    .prepare(`UPDATE developers SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function updateDeveloperTranslation(
  developerId: string,
  locale: string,
  input: UpdateDeveloperTranslationInput,
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
      `UPDATE developer_translations SET ${fields.join(", ")} WHERE developer_id = ? AND locale = ?`,
    )
    .bind(...values, developerId, locale)
    .run();
}

export async function getDeveloperLocales(id: string): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT locale FROM developer_translations WHERE developer_id = ?")
    .bind(id)
    .all();
  return (result.results ?? []).map(
    (row) => (row as { locale: string }).locale,
  );
}

export async function updateDeveloperTranslationsCascade(
  id: string,
  originalLocale: string,
  newSourceHash: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `UPDATE developer_translations
       SET source_hash = ?, updated_at = CURRENT_TIMESTAMP
       WHERE developer_id = ? AND locale != ?`,
    )
    .bind(newSourceHash, id, originalLocale)
    .run();
}

export interface DeveloperLocaleMeta {
  locale: string;
  publish_status: PublishStatus;
  source_hash: string | null;
  updated_at: string;
}

export async function getDeveloperLocaleMeta(
  id: string,
): Promise<DeveloperLocaleMeta[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT locale, publish_status, source_hash, updated_at FROM developer_translations WHERE developer_id = ?",
    )
    .bind(id)
    .all();
  return (result.results ?? []) as unknown as DeveloperLocaleMeta[];
}

export async function getDeveloperOriginalLocale(id: string): Promise<string> {
  const db = getDatabase();
  const row = await db
    .prepare("SELECT original_locale FROM developers WHERE id = ?")
    .bind(id)
    .first();
  return String(
    (row as { original_locale?: string } | null)?.original_locale ??
      DEFAULT_LANGUAGE,
  );
}

export async function getDeveloperOriginalHash(
  id: string,
): Promise<string | null> {
  const db = getDatabase();
  const developer = await db
    .prepare("SELECT original_locale FROM developers WHERE id = ?")
    .bind(id)
    .first();
  if (!developer) return null;

  const row = await db
    .prepare(
      "SELECT source_hash FROM developer_translations WHERE developer_id = ? AND locale = ?",
    )
    .bind(id, (developer as { original_locale: string }).original_locale)
    .first();
  if (!row) return null;

  const hash = (row as { source_hash: string | null }).source_hash;
  return hash ?? null;
}

export async function getDeveloperLocalesWithContent(id: string): Promise<
  Array<{
    locale: string;
    tiptap_json: string;
    avatar_url: string | null;
  }>
> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT locale, tiptap_json, avatar_url FROM developer_translations WHERE developer_id = ?",
    )
    .bind(id)
    .all();
  return (result.results ?? []) as Array<{
    locale: string;
    tiptap_json: string;
    avatar_url: string | null;
  }>;
}

export async function deleteDeveloper(id: string): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM developers WHERE id = ?").bind(id).run();
}

export async function deleteDeveloperTranslation(
  id: string,
  locale: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      "DELETE FROM developer_translations WHERE developer_id = ? AND locale = ?",
    )
    .bind(id, locale)
    .run();
}

export async function deleteAllDeveloperTranslations(
  id: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM developer_translations WHERE developer_id = ?")
    .bind(id)
    .run();
}
