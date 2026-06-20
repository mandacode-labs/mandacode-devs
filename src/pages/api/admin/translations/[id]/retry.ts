import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import {
  getTranslationJobById,
  resetTranslationJobForRetry,
} from "@/lib/db/translation-jobs";
import { runTranslationJob } from "@/lib/translation";
import type { TranslationJob } from "@/lib/db/schema";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const jobId = context.params.id;

    if (!jobId) {
      throw new Error("Missing job id");
    }

    const job = await getTranslationJobById(jobId);
    if (!job) {
      throw new Error("Translation job not found");
    }

    if (job.status !== "failed") {
      throw new Error("Only failed translation jobs can be retried");
    }

    await resetTranslationJobForRetry(jobId);

    const input = mapJobToInput(job);
    const runRetry = async () => {
      try {
        await runTranslationJob(input, jobId);
      } catch (error) {
        console.error("Retry translation failed:", error);
      }
    };

    if (context.locals.cfContext) {
      context.locals.cfContext.waitUntil(
        runRetry().catch((error) => {
          console.error("Background retry translation error:", error);
        }),
      );
    } else {
      await runRetry();
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

function mapJobToInput(job: TranslationJob) {
  return {
    contentType: job.content_type,
    id: job.content_id,
    sourceLocale: job.source_locale,
    targetLocale: job.target_locale,
    authorId: job.author_id,
  };
}
