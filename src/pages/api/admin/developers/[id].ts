import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as developersRepo from "@/lib/db/developers";
import { updateDeveloperSchema } from "@/lib/api/validation";
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

    const developer = await developersRepo.getDeveloperById(id, locale);

    if (!developer) {
      throw new ApiError("Developer not found", 404);
    }

    return jsonResponse(developer);
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

    const existing = await developersRepo.getDeveloperById(id, locale);
    if (!existing) {
      throw new ApiError("Developer not found", 404);
    }

    const body = await parseJsonBody(context.request, updateDeveloperSchema);

    const updateData: developersRepo.UpdateDeveloperInput = {
      name: body.name,
      role: body.role,
      bio: body.bio,
      tiptap_json: body.tiptap_json,
      avatar_url: body.avatar_url,
      github_url: body.github_url,
      email: body.email,
      website_url: body.website_url,
      tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : undefined,
      certifications: body.certifications
        ? JSON.stringify(body.certifications)
        : undefined,
      education: body.education ? JSON.stringify(body.education) : undefined,
      published_at: body.published_at,
    };

    await developersRepo.updateDeveloper(id, locale, updateData);

    await scheduleTranslations(
      context,
      "developer",
      id,
      locale,
      body.target_locales ?? [],
      user.email,
    );

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("developer", id, SUPPORTED_LANGUAGES as string[]),
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
      await developersRepo.deleteAllDeveloperLocales(id);
    } else {
      if (!locale) {
        throw new ApiError("Missing locale", 400);
      }
      await developersRepo.deleteDeveloper(id, locale);
    }

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("developer", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
