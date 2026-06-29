import { getDatabase } from "@/lib/db/client";
import type {
  TranslationJob,
  TranslationContentType,
  TranslationJobStatus,
} from "@/lib/db/schema";
import { generateEntityId } from "@/lib/id";

export interface CreateTranslationJobInput {
  content_type: TranslationContentType;
  content_id: string;
  source_locale: string;
  target_locale: string;
  author_id: string;
  status?: TranslationJobStatus;
}

export async function createTranslationJobs(
  inputs: CreateTranslationJobInput[],
): Promise<TranslationJob[]> {
  if (inputs.length === 0) return [];

  const db = getDatabase();
  const jobs: TranslationJob[] = inputs.map((input) => ({
    id: generateEntityId(),
    content_type: input.content_type,
    content_id: input.content_id,
    source_locale: input.source_locale,
    target_locale: input.target_locale,
    author_id: input.author_id,
    status: input.status ?? "pending",
    attempts: 0,
    max_attempts: 3,
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
  }));

  const insert = db.prepare(
    `INSERT INTO translation_jobs (
      id, content_type, content_id, source_locale, target_locale, author_id,
      status, attempts, max_attempts, error_message, created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const job of jobs) {
    await insert
      .bind(
        job.id,
        job.content_type,
        job.content_id,
        job.source_locale,
        job.target_locale,
        job.author_id,
        job.status,
        job.attempts,
        job.max_attempts,
        job.error_message,
        job.created_at,
        job.updated_at,
        job.completed_at,
      )
      .run();
  }

  return jobs;
}

export async function getTranslationJobById(
  id: string,
): Promise<TranslationJob | null> {
  const db = getDatabase();
  const result = await db
    .prepare("SELECT * FROM translation_jobs WHERE id = ?")
    .bind(id)
    .first();
  return (result as TranslationJob | null) ?? null;
}

export async function getTranslationJobsByContent(
  contentType: TranslationContentType,
  contentId: string,
): Promise<TranslationJob[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT * FROM translation_jobs WHERE content_type = ? AND content_id = ? ORDER BY target_locale ASC, created_at DESC",
    )
    .bind(contentType, contentId)
    .all();
  return (result.results ?? []) as unknown as TranslationJob[];
}

export async function getLatestTranslationJob(
  contentType: TranslationContentType,
  contentId: string,
  targetLocale: string,
): Promise<TranslationJob | null> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT * FROM translation_jobs WHERE content_type = ? AND content_id = ? AND target_locale = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(contentType, contentId, targetLocale)
    .first();
  return (result as TranslationJob | null) ?? null;
}

export async function getTranslationJobsByContents(
  contentType: TranslationContentType,
  contentIds: string[],
): Promise<TranslationJob[]> {
  if (contentIds.length === 0) return [];

  const db = getDatabase();
  const placeholders = contentIds.map(() => "?").join(",");
  const result = await db
    .prepare(
      `SELECT * FROM translation_jobs WHERE content_type = ? AND content_id IN (${placeholders}) ORDER BY created_at DESC`,
    )
    .bind(contentType, ...contentIds)
    .all();
  return (result.results ?? []) as unknown as TranslationJob[];
}

export async function getPendingTranslationJobs(): Promise<TranslationJob[]> {
  const db = getDatabase();
  const result = await db
    .prepare(
      "SELECT * FROM translation_jobs WHERE status IN ('pending', 'failed') AND attempts < max_attempts ORDER BY created_at ASC",
    )
    .all();
  return (result.results ?? []) as unknown as TranslationJob[];
}

export async function updateTranslationJobStatus(
  id: string,
  status: TranslationJobStatus,
  errorMessage?: string,
): Promise<void> {
  const db = getDatabase();

  const completedAt = status === "completed" ? new Date().toISOString() : null;
  const attemptsIncrement = status === "running" ? 1 : 0;

  await db
    .prepare(
      `UPDATE translation_jobs SET
        status = ?,
        attempts = attempts + ?,
        error_message = COALESCE(?, error_message),
        completed_at = COALESCE(?, completed_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    )
    .bind(status, attemptsIncrement, errorMessage ?? null, completedAt, id)
    .run();
}

// Mark in-flight jobs as failed when their worker is presumed dead. A job
// left at status='running' for more than `staleMinutes` minutes indicates
// the `waitUntil` background task was killed (e.g., worker redeploy or
// instance recycle) before it could update the final status. Returns the
// number of jobs marked stale.
export async function markStaleRunningJobsFailed(
  contentType: TranslationContentType,
  contentId: string,
  staleMinutes: number,
  reason: string,
): Promise<number> {
  const db = getDatabase();
  const result = await db
    .prepare(
      `UPDATE translation_jobs SET
        status = 'failed',
        error_message = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE content_type = ?
        AND content_id = ?
        AND status = 'running'
        AND updated_at < datetime('now', ?)`,
    )
    .bind(reason, contentType, contentId, `-${staleMinutes} minutes`)
    .run();
  return result.meta?.changes ?? 0;
}

export async function resetTranslationJobForRetry(id: string): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      `UPDATE translation_jobs SET
        status = 'pending',
        error_message = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    )
    .bind(id)
    .run();
}

export async function deleteTranslationJobsByContent(
  contentType: TranslationContentType,
  contentId: string,
): Promise<void> {
  const db = getDatabase();
  await db
    .prepare(
      "DELETE FROM translation_jobs WHERE content_type = ? AND content_id = ?",
    )
    .bind(contentType, contentId)
    .run();
}

export async function deleteTranslationJob(id: string): Promise<void> {
  const db = getDatabase();
  await db.prepare("DELETE FROM translation_jobs WHERE id = ?").bind(id).run();
}
