import { getDatabase } from "@/lib/db/client";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import type { PublishStatus } from "@/lib/db/schema";

export interface MainTableConfig {
  table: string;
  alias: string;
  idColumn: string;
  baseColumns: string[];
  orderBy?: string;
}

export interface TransTableConfig {
  table: string;
  alias: string;
  idColumn: string;
  transColumns: string[];
}

export interface ListOptions {
  includeUnpublished?: boolean;
  publishStatus?: PublishStatus;
  pathPrefix?: string;
  pathColumn?: string;
}

function buildSelectColumns(
  mainCfg: MainTableConfig,
  transCfg: TransTableConfig,
): string {
  const mainCols = mainCfg.baseColumns
    .map((c) => `${mainCfg.alias}.${c} AS ${c}`)
    .join(", ");
  const origCols = transCfg.transColumns
    .map((c) => `${transCfg.alias}.${c} AS original_${c}`)
    .join(", ");
  const transAliasCols = transCfg.transColumns
    .map((c) => `trans.${c} AS translation_${c}`)
    .join(", ");
  return `${mainCols}, ${origCols}, ${transAliasCols}`;
}

export function buildListQuery(
  mainCfg: MainTableConfig,
  transCfg: TransTableConfig,
  locale: string,
  options: ListOptions = {},
): { query: string; params: (string | PublishStatus)[] } {
  const params: (string | PublishStatus)[] = [];
  const cols = buildSelectColumns(mainCfg, transCfg);
  const joinClause = `
    LEFT JOIN ${transCfg.table} ${transCfg.alias}
      ON ${mainCfg.alias}.${mainCfg.idColumn} = ${transCfg.alias}.${transCfg.idColumn}
      AND ${transCfg.alias}.locale = ${mainCfg.alias}.original_locale
    LEFT JOIN ${transCfg.table} trans
      ON ${mainCfg.alias}.${mainCfg.idColumn} = trans.${transCfg.idColumn}
      AND trans.locale = ?
  `;
  params.push(locale);

  let query = `
    SELECT ${cols}
    FROM ${mainCfg.table} ${mainCfg.alias}
    ${joinClause}
  `;

  const conditions: string[] = [];
  // Visibility is determined by the post's original translation, not
  // the requested locale's translation. A post shows up in the list
  // as long as its original is in the matching publish state, even
  // when the requested locale has no translation (the original's
  // content is then surfaced as a fallback by the row mapper).
  if (!options.includeUnpublished) {
    conditions.push(`${transCfg.alias}.publish_status = ?`);
    params.push("published");
  }
  if (options.publishStatus) {
    conditions.push(`${transCfg.alias}.publish_status = ?`);
    params.push(options.publishStatus);
  }
  if (options.pathPrefix !== undefined && options.pathColumn) {
    const prefix = options.pathPrefix.replace(/'/g, "''");
    const pathCol = `${mainCfg.alias}.${options.pathColumn}`;
    if (prefix === "/") {
      // root — no extra filter
    } else if (prefix.endsWith("/")) {
      // exact folder match + descendants: /a/ matches /a and /a/b
      const like = prefix + "%";
      conditions.push(`(${pathCol} = ? OR ${pathCol} LIKE ? ESCAPE '\\')`);
      params.push(prefix, like);
    } else {
      // treat as folder (auto-add trailing slash)
      const normalized = prefix + "/";
      const like = normalized + "%";
      conditions.push(`(${pathCol} = ? OR ${pathCol} LIKE ? ESCAPE '\\')`);
      params.push(normalized, like);
    }
  }
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  const orderBy =
    mainCfg.orderBy ??
    `COALESCE(${transCfg.alias}.published_at, ${transCfg.alias}.created_at) DESC`;
  query += ` ORDER BY ${orderBy}`;

  return { query, params };
}

export function buildByIdQuery(
  mainCfg: MainTableConfig,
  transCfg: TransTableConfig,
): { query: string } {
  const cols = buildSelectColumns(mainCfg, transCfg);
  const joinClause = `
    LEFT JOIN ${transCfg.table} ${transCfg.alias}
      ON ${mainCfg.alias}.${mainCfg.idColumn} = ${transCfg.alias}.${transCfg.idColumn}
      AND ${transCfg.alias}.locale = ${mainCfg.alias}.original_locale
    LEFT JOIN ${transCfg.table} trans
      ON ${mainCfg.alias}.${mainCfg.idColumn} = trans.${transCfg.idColumn}
      AND trans.locale = ?
  `;
  const query = `
    SELECT ${cols}
    FROM ${mainCfg.table} ${mainCfg.alias}
    ${joinClause}
    WHERE ${mainCfg.alias}.${mainCfg.idColumn} = ?
  `;
  return { query };
}

export async function getListWithTranslation<T>(
  mainCfg: MainTableConfig,
  transCfg: TransTableConfig,
  locale: string,
  options: ListOptions,
  mapRow: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  const db = getDatabase();
  const { query, params } = buildListQuery(mainCfg, transCfg, locale, options);
  const result = await db
    .prepare(query)
    .bind(...params)
    .all();
  return ((result.results ?? []) as Record<string, unknown>[]).map(mapRow);
}

export async function getByIdWithTranslation<T>(
  mainCfg: MainTableConfig,
  transCfg: TransTableConfig,
  locale: string,
  id: string,
  mapRow: (row: Record<string, unknown>) => T,
): Promise<T | null> {
  const db = getDatabase();
  const { query } = buildByIdQuery(mainCfg, transCfg);
  const result = await db.prepare(query).bind(locale, id).first();
  if (!result) return null;
  return mapRow(result as Record<string, unknown>);
}

export async function getEntityLocales(
  transTable: string,
  transIdColumn: string,
  id: string,
): Promise<string[]> {
  const db = getDatabase();
  const result = await db
    .prepare(`SELECT locale FROM ${transTable} WHERE ${transIdColumn} = ?`)
    .bind(id)
    .all();
  return (result.results ?? []).map(
    (row) => (row as { locale: string }).locale,
  );
}

export async function getEntityLocalesWithContent(
  transTable: string,
  transIdColumn: string,
  id: string,
  contentColumn: string,
  extraColumns: string[] = [],
): Promise<
  Array<{ locale: string; [key: string]: unknown } & Record<string, unknown>>
> {
  const db = getDatabase();
  const extra = extraColumns.length > 0 ? `, ${extraColumns.join(", ")}` : "";
  const result = await db
    .prepare(
      `SELECT locale, ${contentColumn}${extra} FROM ${transTable} WHERE ${transIdColumn} = ?`,
    )
    .bind(id)
    .all();
  return (result.results ?? []) as Array<
    { locale: string; [key: string]: unknown } & Record<string, unknown>
  >;
}

export interface LocaleMeta {
  locale: string;
  publish_status: PublishStatus;
  source_hash: string | null;
  updated_at: string;
}

export async function getEntityLocaleMeta(
  transTable: string,
  transIdColumn: string,
  id: string,
): Promise<LocaleMeta[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `SELECT locale, publish_status, source_hash, updated_at FROM ${transTable} WHERE ${transIdColumn} = ?`,
    )
    .bind(id)
    .all();
  return (result.results ?? []) as unknown as LocaleMeta[];
}

export async function getEntityOriginalLocale(
  mainTable: string,
  id: string,
): Promise<string> {
  const db = getDatabase();
  const row = await db
    .prepare(`SELECT original_locale FROM ${mainTable} WHERE id = ?`)
    .bind(id)
    .first();
  return String(
    (row as { original_locale?: string } | null)?.original_locale ??
      DEFAULT_LANGUAGE,
  );
}

export async function getEntityOriginalHash(
  mainTable: string,
  transTable: string,
  transIdColumn: string,
  id: string,
): Promise<string | null> {
  const db = getDatabase();
  const post = await db
    .prepare(`SELECT original_locale FROM ${mainTable} WHERE id = ?`)
    .bind(id)
    .first();
  if (!post) return null;

  const row = await db
    .prepare(
      `SELECT source_hash FROM ${transTable} WHERE ${transIdColumn} = ? AND locale = ?`,
    )
    .bind(id, (post as { original_locale: string }).original_locale)
    .first();
  if (!row) return null;

  const hash = (row as { source_hash: string | null }).source_hash;
  return hash ?? null;
}

export async function deleteEntity(
  mainTable: string,
  id: string,
): Promise<void> {
  const db = getDatabase();
  await db.prepare(`DELETE FROM ${mainTable} WHERE id = ?`).bind(id).run();
}

export async function deleteEntityTranslation(
  transTable: string,
  transIdColumn: string,
  id: string,
  locale: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `DELETE FROM ${transTable} WHERE ${transIdColumn} = ? AND locale = ?`,
    )
    .bind(id, locale)
    .run();
}

export async function deleteAllEntityTranslations(
  transTable: string,
  transIdColumn: string,
  id: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(`DELETE FROM ${transTable} WHERE ${transIdColumn} = ?`)
    .bind(id)
    .run();
}

export async function updateEntityTranslation(
  transTable: string,
  transIdColumn: string,
  entityId: string,
  locale: string,
  input: Record<string, unknown>,
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
    .prepare(
      `UPDATE ${transTable} SET ${fields.join(", ")} WHERE ${transIdColumn} = ? AND locale = ?`,
    )
    .bind(...values, entityId, locale)
    .run();
}
