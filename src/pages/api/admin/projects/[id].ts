import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as projectsRepo from "@/lib/db/projects";
import { updateProjectSchema } from "@/lib/api/validation";
import { parseJsonBody } from "@/lib/api/request";
import { errorResponse, jsonResponse, ApiError } from "@/lib/api/response";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import { cleanupUnusedEntityAssets, deleteEntityDirectory } from "@/lib/assets";
import { extractAssetUrlsFromTiptapJson } from "@/lib/tiptap/extract";

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

    context.locals.cfContext?.waitUntil(
      cleanupProjectAssets(id, locale, body.tiptap_json, {
        cover_image_url: body.cover_image_url ?? null,
      }),
    );

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
    const all = context.url.searchParams.get("all") === "true";
    const confirmation = context.url.searchParams.get("confirmation");

    if (!id) {
      throw new ApiError("Missing id", 400);
    }

    if (confirmation !== "delete") {
      throw new ApiError("Delete confirmation required", 400);
    }

    if (all) {
      await projectsRepo.deleteAllProjectLocales(id);
      context.locals.cfContext?.waitUntil(deleteEntityDirectory("project", id));
    } else {
      if (!locale) {
        throw new ApiError("Missing locale", 400);
      }
      const remainingLocales = await projectsRepo.getProjectLocales(id);
      if (remainingLocales.length <= 1) {
        await projectsRepo.deleteProject(id, locale);
        context.locals.cfContext?.waitUntil(
          deleteEntityDirectory("project", id),
        );
      } else {
        await projectsRepo.deleteProject(id, locale);
      }
    }

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("project", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

async function cleanupProjectAssets(
  id: string,
  locale: string,
  tiptapJson: string | undefined,
  imageUrls: { cover_image_url: string | null },
): Promise<void> {
  const locales = await projectsRepo.getProjectLocalesWithContent(id);
  const usedUrls = new Set<string>();

  for (const row of locales) {
    if (row.locale === locale) {
      if (tiptapJson) {
        for (const url of extractAssetUrlsFromTiptapJson(tiptapJson)) {
          usedUrls.add(url);
        }
      }
      if (imageUrls.cover_image_url) usedUrls.add(imageUrls.cover_image_url);
    } else {
      for (const url of extractAssetUrlsFromTiptapJson(row.tiptap_json)) {
        usedUrls.add(url);
      }
      if (row.cover_image_url) usedUrls.add(row.cover_image_url);
    }
  }

  await cleanupUnusedEntityAssets("project", id, Array.from(usedUrls));
}

export const prerender = false;
