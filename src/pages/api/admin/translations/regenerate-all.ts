import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { getPostLocales, getPostOriginalLocale } from "@/lib/db/posts";
import { getProjectLocales, getProjectOriginalLocale } from "@/lib/db/projects";
import {
  getDeveloperLocales,
  getDeveloperOriginalLocale,
} from "@/lib/db/developers";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import type { TranslationContentType } from "@/lib/db/schema";
import type { Language } from "@/lib/config/languages";

export const prerender = false;

const validContentTypes: TranslationContentType[] = [
  "post",
  "project",
  "developer",
];

async function getOriginalLocale(
  contentType: TranslationContentType,
  id: string,
): Promise<string> {
  if (contentType === "post") return getPostOriginalLocale(id);
  if (contentType === "project") return getProjectOriginalLocale(id);
  return getDeveloperOriginalLocale(id);
}

async function getLocales(
  contentType: TranslationContentType,
  id: string,
): Promise<string[]> {
  if (contentType === "post") return getPostLocales(id);
  if (contentType === "project") return getProjectLocales(id);
  return getDeveloperLocales(id);
}

export const POST: APIRoute = async (context) => {
  try {
    const auth = requireAuth(context);

    const contentType = context.url.searchParams.get("content_type");
    const contentId = context.url.searchParams.get("content_id");

    if (
      !contentType ||
      !validContentTypes.includes(contentType as TranslationContentType)
    ) {
      return errorResponse(new Error("Invalid or missing content_type"));
    }
    if (!contentId) {
      return errorResponse(new Error("Missing content_id"));
    }

    const typed = contentType as TranslationContentType;
    const [sourceLocale, allLocales] = await Promise.all([
      getOriginalLocale(typed, contentId),
      getLocales(typed, contentId),
    ]);

    const targetLocales = allLocales.filter(
      (loc) => loc !== sourceLocale,
    ) as Language[];

    if (targetLocales.length === 0) {
      return jsonResponse({ success: true, targetLocales: [] });
    }

    await scheduleTranslations(
      context,
      typed,
      contentId,
      sourceLocale as Language,
      targetLocales,
      auth.email,
    );

    return jsonResponse({ success: true, targetLocales });
  } catch (error) {
    return errorResponse(error);
  }
};
