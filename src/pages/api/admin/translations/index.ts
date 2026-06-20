import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import {
  getTranslationJobsByContent,
  getTranslationJobsByContents,
} from "@/lib/db/translation-jobs";
import type { TranslationContentType } from "@/lib/db/schema";

export const prerender = false;

const validContentTypes: TranslationContentType[] = [
  "post",
  "project",
  "developer",
];

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const contentType = context.url.searchParams.get("content_type");

    if (
      !contentType ||
      !validContentTypes.includes(contentType as TranslationContentType)
    ) {
      throw new Error("Invalid or missing content_type");
    }

    const contentIds = context.url.searchParams.getAll("content_id");
    const singleContentId = context.url.searchParams.get("content_id");

    let jobs;
    if (contentIds.length > 1) {
      jobs = await getTranslationJobsByContents(
        contentType as TranslationContentType,
        contentIds,
      );
    } else if (singleContentId) {
      jobs = await getTranslationJobsByContent(
        contentType as TranslationContentType,
        singleContentId,
      );
    } else {
      throw new Error("Missing content_id");
    }

    return jsonResponse({ jobs });
  } catch (error) {
    return errorResponse(error);
  }
};
