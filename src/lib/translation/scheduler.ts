import { runTranslationJob, createTranslationJobs } from "@/lib/translation";
import type { APIContext } from "astro";
import type { ContentType } from "@/lib/translation";
import type { Language } from "@/lib/config/languages";

export async function scheduleTranslations(
  context: APIContext,
  contentType: ContentType,
  id: string,
  sourceLocale: Language,
  targetLocales: Language[],
  authorId: string,
): Promise<void> {
  if (targetLocales.length === 0) {
    return;
  }

  const jobs = createTranslationJobs(
    contentType,
    id,
    sourceLocale,
    targetLocales,
    authorId,
  );

  const runJobs = async () => {
    try {
      for (const job of jobs) {
        await runTranslationJob(job);
      }
    } catch (error) {
      console.error("Translation job failed:", error);
    }
  };

  if (context.locals.cfContext) {
    context.locals.cfContext.waitUntil(runJobs());
  } else {
    await runJobs();
  }
}
