import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { createTranslationJobs } from "@/lib/db/translation-jobs";
import { getPostOriginalLocale, getPostTranslationById } from "@/lib/db/posts";
import {
  getProjectOriginalLocale,
  getProjectTranslationById,
} from "@/lib/db/projects";
import {
  getDeveloperOriginalLocale,
  getDeveloperTranslationById,
} from "@/lib/db/developers";
import { runTranslationJob, type TranslationJobInput } from "@/lib/translation";
import type { TranslationContentType } from "@/lib/db/schema";
import type { Language } from "@/lib/config/languages";

export const prerender = false;

const validContentTypes: TranslationContentType[] = [
  "post",
  "project",
  "developer",
];

export const POST: APIRoute = async (context) => {
  try {
    const auth = requireAuth(context);

    const contentType = context.url.searchParams.get("content_type");
    const contentId = context.url.searchParams.get("content_id");
    const targetLocale = context.url.searchParams.get("target_locale");

    if (
      !contentType ||
      !validContentTypes.includes(contentType as TranslationContentType)
    ) {
      return errorResponse(new Error("Invalid or missing content_type"));
    }
    if (!contentId) {
      return errorResponse(new Error("Missing content_id"));
    }
    if (!targetLocale) {
      return errorResponse(new Error("Missing target_locale"));
    }

    const typed = contentType as TranslationContentType;
    const sourceLocale = await getOriginalLocale(typed, contentId);

    if (targetLocale === sourceLocale) {
      return errorResponse(new Error("Cannot regenerate the original locale"));
    }

    const existing = await getTranslationById(typed, contentId, targetLocale);
    if (!existing) {
      return errorResponse(
        new Error(
          "No existing translation to regenerate. Create a new translation first.",
        ),
      );
    }

    const authorId = auth.email;
    const jobs = await createTranslationJobs([
      {
        content_type: typed,
        content_id: contentId,
        source_locale: sourceLocale,
        target_locale: targetLocale,
        author_id: authorId,
        status: "pending",
      },
    ]);
    const job = jobs[0];
    if (!job) {
      return errorResponse(new Error("Failed to create translation job"));
    }

    const jobInput: TranslationJobInput = {
      contentType: typed,
      id: contentId,
      sourceLocale: sourceLocale as Language,
      targetLocale: targetLocale as Language,
      authorId,
    };

    if (context.locals.cfContext) {
      context.locals.cfContext.waitUntil(
        runTranslationJob(jobInput, job.id).catch((error) => {
          console.error("Background regenerate translation error:", error);
        }),
      );
    } else {
      await runTranslationJob(jobInput, job.id);
    }

    return jsonResponse({ success: true, jobId: job.id });
  } catch (error) {
    return errorResponse(error);
  }
};

async function getOriginalLocale(
  contentType: TranslationContentType,
  id: string,
): Promise<string> {
  if (contentType === "post") return getPostOriginalLocale(id);
  if (contentType === "project") return getProjectOriginalLocale(id);
  return getDeveloperOriginalLocale(id);
}

async function getTranslationById(
  contentType: TranslationContentType,
  id: string,
  locale: string,
): Promise<unknown | null> {
  if (contentType === "post") {
    return getPostTranslationById(id, locale);
  }
  if (contentType === "project") {
    return getProjectTranslationById(id, locale);
  }
  return getDeveloperTranslationById(id, locale);
}
