import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as developersRepo from "@/lib/db/developers";
import { createDeveloperSchema } from "@/lib/api/validation";
import { parseJsonBody } from "@/lib/api/request";
import { errorResponse, jsonResponse, ApiError } from "@/lib/api/response";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import { invalidateContentCache } from "@/lib/cache";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/config/languages";

export const POST: APIRoute = async (context) => {
  try {
    const user = requireAuth(context);
    const body = await parseJsonBody(context.request, createDeveloperSchema);

    const existing = await developersRepo.getDeveloperById(
      body.id,
      body.locale,
    );
    if (existing) {
      throw new ApiError(
        `Developer with id "${body.id}" and locale "${body.locale}" already exists`,
        409,
      );
    }

    const publishedAt =
      body.published_at !== undefined && body.published_at !== null
        ? body.published_at
        : new Date().toISOString();

    await developersRepo.createDeveloper({
      id: body.id,
      locale: body.locale,
      origin: body.locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
      author_id: user.email,
      name: body.name,
      role: body.role,
      bio: body.bio,
      tiptap_json: body.tiptap_json,
      avatar_url: body.avatar_url ?? null,
      github_url: body.github_url ?? null,
      email: body.email ?? null,
      website_url: body.website_url ?? null,
      tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : null,
      certifications: body.certifications
        ? JSON.stringify(body.certifications)
        : null,
      education: body.education ? JSON.stringify(body.education) : null,
      published_at: publishedAt,
    });

    await scheduleTranslations(
      context,
      "developer",
      body.id,
      body.locale,
      body.target_locales,
      user.email,
    );

    context.locals.cfContext?.waitUntil(
      invalidateContentCache(
        "developer",
        body.id,
        SUPPORTED_LANGUAGES as string[],
      ).catch((error) => {
        console.error("Cache invalidation failed:", error);
      }),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
