import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as projectsRepo from "@/lib/db/projects";
import { createProjectSchema } from "@/lib/api/validation";
import { parseJsonBody } from "@/lib/api/request";
import { errorResponse, jsonResponse, ApiError } from "@/lib/api/response";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import { invalidateContentCache } from "@/lib/cache";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/config/languages";

export const POST: APIRoute = async (context) => {
  try {
    const user = requireAuth(context);
    const body = await parseJsonBody(context.request, createProjectSchema);

    const existing = await projectsRepo.getProjectById(body.id, body.locale);
    if (existing) {
      throw new ApiError(
        `Project with id "${body.id}" and locale "${body.locale}" already exists`,
        409,
      );
    }

    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;

    await projectsRepo.createProject({
      id: body.id,
      locale: body.locale,
      origin: body.locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
      author_id: user.email,
      title: body.title,
      description: body.description ?? null,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      hidden: body.hidden ? 1 : 0,
      project_status: body.project_status,
      duration: body.duration,
      team_size: body.team_size,
      role: body.role,
      project_order: body.project_order,
      url: body.url ?? null,
      source_url: body.source_url ?? null,
      blog_url: body.blog_url ?? null,
      cover_image_url: body.cover_image_url ?? null,
      published_at: publishedAt,
    });

    await scheduleTranslations(
      context,
      "project",
      body.id,
      body.locale,
      body.target_locales,
      user.email,
    );

    context.locals.cfContext?.waitUntil(
      invalidateContentCache(
        "project",
        body.id,
        SUPPORTED_LANGUAGES as string[],
      ),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
