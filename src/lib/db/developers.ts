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
  type LocaleMeta,
  type MainTableConfig,
  type TransTableConfig,
} from "@/lib/db/translation-repo";
import type {
  Developer,
  DeveloperTranslation,
  PublishStatus,
} from "@/lib/db/schema";
import { hashContent } from "@/lib/hash";

export type { LocaleMeta as DeveloperLocaleMeta };

export type EducationStatus = "graduated" | "enrolled" | "withdrawn";

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
    "original_locale",
    "created_at",
    "updated_at",
  ],
};

const TRANS_CFG: TransTableConfig = {
  table: "developer_translations",
  alias: "orig",
  idColumn: "developer_id",
  transColumns: [
    "name",
    "role",
    "bio",
    "intro",
    "body",
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
  original_locale: string;
}

export interface CreateDeveloperTranslationInput {
  id: string;
  developer_id: string;
  locale: string;
  name: string;
  role: string;
  bio: string;
  intro: string;
  body: string;
  avatar_url: string | null;
  publish_status: PublishStatus;
  published_at: string | null;
  source_hash: string;
}

export interface UpdateDeveloperTranslationInput {
  name?: string;
  role?: string;
  bio?: string;
  intro?: string;
  body?: string;
  avatar_url?: string | null;
  publish_status?: PublishStatus;
  published_at?: string | null;
  source_hash?: string | null;
}

export interface UpdateDeveloperInput {
  github_url?: string | null;
  email?: string | null;
  website_url?: string | null;
  original_locale?: string;
}

export interface DeveloperWithTranslation extends Developer {
  name: string;
  role: string;
  bio: string;
  intro: string;
  body: string;
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
    certifications: (row.certifications as string | null) ?? null,
    education: (row.education as string | null) ?? null,
    original_locale: String(row.original_locale),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name: String(hasTranslation ? row.translation_name : row.original_name),
    role: String(hasTranslation ? row.translation_role : row.original_role),
    bio: String(hasTranslation ? row.translation_bio : row.original_bio),
    intro: String(hasTranslation ? row.translation_intro : row.original_intro),
    body: String(hasTranslation ? row.translation_body : row.original_body),
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
        id, author_id, github_url, email, website_url, original_locale
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.author_id,
      input.github_url,
      input.email,
      input.website_url,
      input.original_locale,
    )
    .run();
}

/**
 * Idempotent bootstrap for a developer row + its first translation. Used by
 * the admin "new profile" flow so the editor always has a row to attach
 * cert/edu/order fields to. Skips when the row already exists.
 */
export async function ensureDeveloperExists(
  id: string,
  locale: string,
  authorId: string,
): Promise<void> {
  const existing = await getDeveloperById(id, locale);
  if (existing) return;

  await createDeveloper({
    id,
    author_id: authorId,
    github_url: null,
    email: null,
    website_url: null,
    original_locale: locale,
  });

  const emptyTiptap = JSON.stringify({ type: "doc", content: [] });
  await createDeveloperTranslation({
    id: `${id}_${locale}`,
    developer_id: id,
    locale,
    name: "",
    role: "",
    bio: "",
    intro: emptyTiptap,
    body: emptyTiptap,
    avatar_url: null,
    publish_status: "draft",
    published_at: null,
    source_hash: await hashContent(emptyTiptap),
  });
}

export async function createDeveloperTranslation(
  input: CreateDeveloperTranslationInput,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `INSERT INTO developer_translations (
        id, developer_id, locale, name, role, bio, intro, body,
        avatar_url, publish_status, published_at, source_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.developer_id,
      input.locale,
      input.name,
      input.role,
      input.bio,
      input.intro,
      input.body,
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
    if (value === undefined) continue;
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
    intro: string;
    avatar_url: string | null;
  }>
> {
  return getEntityLocalesWithContent(
    "developer_translations",
    "developer_id",
    id,
    "intro",
    ["avatar_url"],
  ) as Promise<
    Array<{
      locale: string;
      intro: string;
      avatar_url: string | null;
    }>
  >;
}

export const deleteDeveloper = (id: string) => deleteEntity("developers", id);

export const deleteDeveloperTranslation = (id: string, locale: string) =>
  deleteEntityTranslation("developer_translations", "developer_id", id, locale);

export const deleteAllDeveloperTranslations = (id: string) =>
  deleteAllEntityTranslations("developer_translations", "developer_id", id);

// =====================================================================
// Certifications (nested table with per-locale translations)
// =====================================================================

export interface DeveloperCertificationTranslation {
  certification_id: string;
  locale: string;
  name: string;
  issuer: string | null;
  date: string;
  badge_url: string | null;
}

export interface DeveloperCertification {
  id: string;
  developer_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DeveloperCertificationFull extends DeveloperCertification {
  /** Locale that was used to populate the translated fields (after fallback). */
  resolved_locale: string;
  name: string;
  issuer: string;
  date: string;
  badge_url: string | null;
}

interface CertificationRow {
  id: string;
  developer_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Joined translation columns (NULL if no translation row exists for the requested locale)
  name: string | null;
  issuer: string | null;
  date: string | null;
  badge_url: string | null;
  locale: string | null;
}

function mapCertificationRow(
  row: CertificationRow,
): DeveloperCertificationFull {
  return {
    id: row.id,
    developer_id: row.developer_id,
    order_index: row.order_index,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_locale: row.locale ?? "",
    name: row.name ?? "",
    issuer: row.issuer ?? "",
    date: row.date ?? "",
    badge_url: row.badge_url,
  };
}

/**
 * Fetch certifications with their resolved translation. Order is by order_index asc.
 * If the requested locale has no translation row, falls back to the developer's
 * original_locale. If that also has nothing, returns placeholder values.
 */
export async function getDeveloperCertifications(
  developerId: string,
  locale: string,
): Promise<DeveloperCertificationFull[]> {
  const db = getDatabase();
  const developer = await db
    .prepare("SELECT original_locale FROM developers WHERE id = ?")
    .bind(developerId)
    .first();
  const originalLocale = String(
    (developer as { original_locale?: string } | null)?.original_locale ??
      locale,
  );

  // COALESCE-style: try requested locale first, fall back to original locale.
  const result = await db
    .prepare(
      `SELECT c.id, c.developer_id, c.order_index, c.created_at, c.updated_at,
              COALESCE(t.locale, fallback.locale) AS locale,
              COALESCE(t.name, fallback.name) AS name,
              COALESCE(t.issuer, fallback.issuer) AS issuer,
              COALESCE(t.date, fallback.date) AS date,
              COALESCE(t.badge_url, fallback.badge_url) AS badge_url
         FROM developer_certifications c
         LEFT JOIN developer_certification_translations t
           ON t.certification_id = c.id AND t.locale = ?
         LEFT JOIN developer_certification_translations fallback
           ON fallback.certification_id = c.id AND fallback.locale = ?
        WHERE c.developer_id = ?
          AND (t.locale IS NOT NULL OR fallback.locale IS NOT NULL)
        ORDER BY c.order_index ASC, c.id ASC`,
    )
    .bind(locale, originalLocale, developerId)
    .all<CertificationRow>();

  return (result.results ?? []).map((row) =>
    mapCertificationRow({
      ...row,
      locale: row.locale ?? originalLocale,
    }),
  );
}

export async function getCertificationTranslations(
  certificationId: string,
): Promise<DeveloperCertificationTranslation[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT certification_id, locale, name, issuer, date, badge_url FROM developer_certification_translations WHERE certification_id = ? ORDER BY locale ASC",
    )
    .bind(certificationId)
    .all();
  return (result.results ??
    []) as unknown as DeveloperCertificationTranslation[];
}

export interface CreateCertificationInput {
  developer_id: string;
  initial_locale: string;
  initial_translation: Omit<
    DeveloperCertificationTranslation,
    "certification_id" | "locale"
  >;
  order_index: number;
}

export async function createCertification(
  input: CreateCertificationInput,
): Promise<string> {
  const db = getDatabase();
  const id = `cert-${crypto.randomUUID().slice(0, 8)}`;
  await db
    .prepare(
      "INSERT INTO developer_certifications (id, developer_id, order_index) VALUES (?, ?, ?)",
    )
    .bind(id, input.developer_id, input.order_index)
    .run();
  await upsertCertificationTranslation(
    id,
    input.initial_locale,
    input.initial_translation,
  );
  return id;
}

export async function upsertCertificationTranslation(
  certificationId: string,
  locale: string,
  data: Omit<DeveloperCertificationTranslation, "certification_id" | "locale">,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `INSERT INTO developer_certification_translations
        (certification_id, locale, name, issuer, date, badge_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(certification_id, locale) DO UPDATE SET
        name = excluded.name,
        issuer = excluded.issuer,
        date = excluded.date,
        badge_url = excluded.badge_url`,
    )
    .bind(
      certificationId,
      locale,
      data.name,
      data.issuer,
      data.date,
      data.badge_url,
    )
    .run();
}

export async function deleteCertification(id: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM developer_certifications WHERE id = ?")
    .bind(id)
    .run();
}

export async function reorderCertifications(
  developerId: string,
  orderedIds: string[],
): Promise<void> {
  const db = getDatabase();
  await Promise.all(
    orderedIds.map((id, idx) =>
      db
        .prepare(
          "UPDATE developer_certifications SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND developer_id = ?",
        )
        .bind(idx, id, developerId)
        .run(),
    ),
  );
}

// =====================================================================
// Education (nested table with per-locale translations, dates are shared)
// =====================================================================

export interface DeveloperEducationTranslation {
  education_id: string;
  locale: string;
  institution: string;
  department: string | null;
  status: EducationStatus | null;
}

export interface DeveloperEducation {
  id: string;
  developer_id: string;
  start_date: string | null;
  end_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DeveloperEducationFull extends DeveloperEducation {
  resolved_locale: string;
  institution: string;
  department: string | null;
  status: EducationStatus | null;
}

interface EducationRow {
  id: string;
  developer_id: string;
  start_date: string | null;
  end_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  institution: string | null;
  department: string | null;
  status: string | null;
  locale: string | null;
}

function mapEducationRow(row: EducationRow): DeveloperEducationFull {
  return {
    id: row.id,
    developer_id: row.developer_id,
    start_date: row.start_date,
    end_date: row.end_date,
    order_index: row.order_index,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_locale: row.locale ?? "",
    institution: row.institution ?? "",
    department: row.department,
    status: (row.status as EducationStatus | null) ?? null,
  };
}

export async function getDeveloperEducation(
  developerId: string,
  locale: string,
): Promise<DeveloperEducationFull[]> {
  const db = getDatabase();
  const developer = await db
    .prepare("SELECT original_locale FROM developers WHERE id = ?")
    .bind(developerId)
    .first();
  const originalLocale = String(
    (developer as { original_locale?: string } | null)?.original_locale ??
      locale,
  );

  const result = await db
    .prepare(
      `SELECT e.id, e.developer_id, e.start_date, e.end_date, e.order_index,
              e.created_at, e.updated_at,
              COALESCE(t.locale, fallback.locale) AS locale,
              COALESCE(t.institution, fallback.institution) AS institution,
              COALESCE(t.department, fallback.department) AS department,
              COALESCE(t.status, fallback.status) AS status
         FROM developer_education e
         LEFT JOIN developer_education_translations t
           ON t.education_id = e.id AND t.locale = ?
         LEFT JOIN developer_education_translations fallback
           ON fallback.education_id = e.id AND fallback.locale = ?
        WHERE e.developer_id = ?
          AND (t.locale IS NOT NULL OR fallback.locale IS NOT NULL)
        ORDER BY e.order_index ASC, e.id ASC`,
    )
    .bind(locale, originalLocale, developerId)
    .all<EducationRow>();

  return (result.results ?? []).map((row) =>
    mapEducationRow({
      ...row,
      locale: row.locale ?? originalLocale,
    }),
  );
}

export async function getEducationTranslations(
  educationId: string,
): Promise<DeveloperEducationTranslation[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT education_id, locale, institution, department, status FROM developer_education_translations WHERE education_id = ? ORDER BY locale ASC",
    )
    .bind(educationId)
    .all();
  return (result.results ?? []) as unknown as DeveloperEducationTranslation[];
}

export interface CreateEducationInput {
  developer_id: string;
  start_date: string | null;
  end_date: string | null;
  initial_locale: string;
  initial_translation: Omit<
    DeveloperEducationTranslation,
    "education_id" | "locale"
  >;
  order_index: number;
}

export async function createEducation(
  input: CreateEducationInput,
): Promise<string> {
  const db = getDatabase();
  const id = `edu-${crypto.randomUUID().slice(0, 8)}`;
  await db
    .prepare(
      "INSERT INTO developer_education (id, developer_id, start_date, end_date, order_index) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      input.developer_id,
      input.start_date,
      input.end_date,
      input.order_index,
    )
    .run();
  await upsertEducationTranslation(
    id,
    input.initial_locale,
    input.initial_translation,
  );
  return id;
}

export async function upsertEducationTranslation(
  educationId: string,
  locale: string,
  data: Omit<DeveloperEducationTranslation, "education_id" | "locale">,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `INSERT INTO developer_education_translations
        (education_id, locale, institution, department, status)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(education_id, locale) DO UPDATE SET
        institution = excluded.institution,
        department = excluded.department,
        status = excluded.status`,
    )
    .bind(educationId, locale, data.institution, data.department, data.status)
    .run();
}

export async function updateEducationDates(
  educationId: string,
  startDate: string | null,
  endDate: string | null,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      "UPDATE developer_education SET start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(startDate, endDate, educationId)
    .run();
}

export async function deleteEducation(id: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare("DELETE FROM developer_education WHERE id = ?")
    .bind(id)
    .run();
}

export async function reorderEducation(
  developerId: string,
  orderedIds: string[],
): Promise<void> {
  const db = getDatabase();
  await Promise.all(
    orderedIds.map((id, idx) =>
      db
        .prepare(
          "UPDATE developer_education SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND developer_id = ?",
        )
        .bind(idx, id, developerId)
        .run(),
    ),
  );
}
