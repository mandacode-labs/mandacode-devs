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
  updateEntityTranslationsCascade,
  type LocaleMeta,
  type MainTableConfig,
  type TransTableConfig,
} from "@/lib/db/translation-repo";
import type {
  Developer,
  DeveloperTranslation,
  PublishStatus,
} from "@/lib/db/schema";

export type { LocaleMeta as DeveloperLocaleMeta };

const MAIN_CFG: MainTableConfig = {
  table: "developers",
  alias: "d",
  idColumn: "id",
  baseColumns: [
    "id",
    "author_id",
    "github_url",
    "email",
    "website_url",
    "tech_stack",
    "certifications",
    "education",
    "original_locale",
    "created_at",
    "updated_at",
  ],
  orderBy: "orig.name ASC",
};

const TRANS_CFG: TransTableConfig = {
  table: "developer_translations",
  alias: "orig",
  idColumn: "developer_id",
  transColumns: [
    "name",
    "role",
    "bio",
    "tiptap_json",
    "avatar_url",
    "publish_status",
    "published_at",
  ],
};

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
  source_hash: string;
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

function mapDeveloperRow(
  row: Record<string, unknown>,
): DeveloperWithTranslation {
  const hasTranslation = row.translation_name !== null;
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
    name: String(hasTranslation ? row.translation_name : row.original_name),
    role: String(hasTranslation ? row.translation_role : row.original_role),
    bio: String(hasTranslation ? row.translation_bio : row.original_bio),
    tiptap_json: String(
      hasTranslation ? row.translation_tiptap_json : row.original_tiptap_json,
    ),
    avatar_url: hasTranslation
      ? (row.translation_avatar_url as string | null)
      : (row.original_avatar_url as string | null),
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

export const rowToDeveloperWithTranslation = mapDeveloperRow;

export interface GetDevelopersOptions {
  includeUnpublished?: boolean;
}

export async function getDevelopers(
  locale: string,
  options: GetDevelopersOptions = {},
): Promise<DeveloperWithTranslation[]> {
  return getListWithTranslation(
    MAIN_CFG,
    TRANS_CFG,
    locale,
    options,
    mapDeveloperRow,
  );
}

export async function getDeveloperById(
  id: string,
  locale: string,
): Promise<DeveloperWithTranslation | null> {
  return getByIdWithTranslation(
    MAIN_CFG,
    TRANS_CFG,
    locale,
    id,
    mapDeveloperRow,
  );
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
      input.source_hash,
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

export function updateDeveloperTranslation(
  developerId: string,
  locale: string,
  input: UpdateDeveloperTranslationInput,
): Promise<void> {
  return updateEntityTranslation(
    "developer_translations",
    "developer_id",
    developerId,
    locale,
    input as Record<string, unknown>,
  );
}

export const getDeveloperLocales = (id: string) =>
  getEntityLocales("developer_translations", "developer_id", id);

export const updateDeveloperTranslationsCascade = (
  id: string,
  originalLocale: string,
  newSourceHash: string,
) =>
  updateEntityTranslationsCascade(
    "developer_translations",
    "developer_id",
    id,
    originalLocale,
    newSourceHash,
  );

export const getDeveloperLocaleMeta = (id: string) =>
  getEntityLocaleMeta("developer_translations", "developer_id", id);

export const getDeveloperOriginalLocale = (id: string) =>
  getEntityOriginalLocale("developers", id);

export const getDeveloperOriginalHash = (id: string) =>
  getEntityOriginalHash(
    "developers",
    "developer_translations",
    "developer_id",
    id,
  );

export function getDeveloperLocalesWithContent(id: string): Promise<
  Array<{
    locale: string;
    tiptap_json: string;
    avatar_url: string | null;
  }>
> {
  return getEntityLocalesWithContent(
    "developer_translations",
    "developer_id",
    id,
    ["avatar_url"],
  ) as Promise<
    Array<{
      locale: string;
      tiptap_json: string;
      avatar_url: string | null;
    }>
  >;
}

export const deleteDeveloper = (id: string) => deleteEntity("developers", id);

export const deleteDeveloperTranslation = (id: string, locale: string) =>
  deleteEntityTranslation("developer_translations", "developer_id", id, locale);

export const deleteAllDeveloperTranslations = (id: string) =>
  deleteAllEntityTranslations("developer_translations", "developer_id", id);
