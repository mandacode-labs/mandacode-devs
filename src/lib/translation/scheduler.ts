import {
  createTranslationJobs as createPersistedTranslationJobs,
  getTranslationJobById,
  markAllStaleRunningJobsFailed,
  markStaleRunningJobsFailed,
  pruneOldTranslationJobs,
  resetTranslationJobForRetry,
} from "@/lib/db/translation-jobs";
import {
  createTranslationJobInputs,
  runTranslationJob,
} from "@/lib/translation";
import type { APIContext } from "astro";
import type { ContentType } from "@/lib/translation";
import type { Language } from "@/lib/config/languages";
import type { TranslationJob } from "@/lib/db/schema";

export async function scheduleTranslations(
  context: APIContext,
  contentType: ContentType,
  id: string,
  sourceLocale: Language,
  targetLocales: Language[],
  authorId: string,
): Promise<TranslationJob[]> {
  if (targetLocales.length === 0) {
    return [];
  }

  await pruneOldTranslationJobs(30);
  await markAllStaleRunningJobsFailed(
    5,
    "Worker terminated before completion (stale job superseded)",
  );
  await markStaleRunningJobsFailed(
    contentType,
    id,
    5,
    "Worker terminated before completion (stale job superseded for this content)",
  );

  const inputs = createTranslationJobInputs(
    contentType,
    id,
    sourceLocale,
    targetLocales,
    authorId,
  );

  const jobs = await createPersistedTranslationJobs(
    inputs.map((input) => ({
      content_type: input.contentType,
      content_id: input.id,
      source_locale: input.sourceLocale,
      target_locale: input.targetLocale,
      author_id: input.authorId,
    })),
  );

  const inputMap = new Map(
    inputs.map((input) => {
      const job = jobs.find(
        (j) =>
          j.content_type === input.contentType &&
          j.content_id === input.id &&
          j.source_locale === input.sourceLocale &&
          j.target_locale === input.targetLocale,
      );
      return [job?.id ?? "", input] as const;
    }),
  );

  const runJobWithRetry = async (job: TranslationJob) => {
    const input = inputMap.get(job.id);
    if (!input) return;

    try {
      await runTranslationJob(input, job.id);
    } catch (error) {
      const updated = await getTranslationJobById(job.id);
      if (
        updated &&
        updated.attempts < updated.max_attempts &&
        updated.status === "failed"
      ) {
        await resetTranslationJobForRetry(updated.id);
        await runJobWithRetry(updated);
      }
    }
  };

  const runJobs = async () => {
    try {
      await Promise.all(jobs.map((job) => runJobWithRetry(job)));
    } catch (error) {
      console.error("Translation scheduler error:", error);
    }
  };

  if (context.locals.cfContext) {
    context.locals.cfContext.waitUntil(
      runJobs().catch((error) => {
        console.error("Background translation error:", error);
      }),
    );
  } else {
    await runJobs();
  }

  return jobs;
}
