import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as projectsRepo from "@/lib/db/projects";
import { updateProjectSchema } from "@/lib/api/validation";
import { parseJsonBody } from "@/lib/api/request";
import { errorResponse, jsonResponse, ApiError } from "@/lib/api/response";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const id = context.params.id;
    const locale = context.url.searchParams.get("locale");

    if (!id || !locale) {
      throw new ApiError("Missing id or locale", 400);
    }

    const project = await projectsRepo.getProjectById(id, locale);

    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    return jsonResponse(project);
  } catch (error) {
    return errorResponse(error);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const user = requireAuth(context);
    const id = context.params.id;

    if (!id) {
      throw new ApiError("Missing id", 400);
    }

    const locale = context.url.searchParams.get("locale");
    if (!locale) {
      throw new ApiError("Missing locale", 400);
    }

    const existing = await projectsRepo.getProjectById(id, locale);
    if (!existing) {
      throw new ApiError("Project not found", 404);
    }

    const body = await parseJsonBody(context.request, updateProjectSchema);

    const updateData: projectsRepo.UpdateProjectInput = {
      title: body.title,
      description: body.description,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      project_status: body.project_status,
      duration: body.duration,
      team_size: body.team_size,
      role: body.role,
      project_order: body.project_order,
      url: body.url,
      source_url: body.source_url,
      blog_url: body.blog_url,
      cover_image_url: body.cover_image_url,
    };

    if (
      body.publish_status === "published" &&
      existing.publish_status !== "published" &&
      !existing.published_at
    ) {
      updateData.published_at = new Date().toISOString();
    }

    await projectsRepo.updateProject(id, locale, updateData);

    await scheduleTranslations(
      context,
      "project",
      id,
      locale,
      body.target_locales ?? [],
      user.email,
    );

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("project", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const id = context.params.id;
    const locale = context.url.searchParams.get("locale");

    if (!id || !locale) {
      throw new ApiError("Missing id or locale", 400);
    }

    await projectsRepo.deleteProject(id, locale);

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("project", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
