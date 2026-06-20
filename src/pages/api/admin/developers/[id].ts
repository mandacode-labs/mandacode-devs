import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as developersRepo from "@/lib/db/developers";
import { updateDeveloperSchema } from "@/lib/api/validation";
import { parseJsonBody } from "@/lib/api/request";
import { errorResponse, jsonResponse, ApiError } from "@/lib/api/response";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import { invalidateContentCache } from "@/lib/cache";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/lib/config/languages";
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

    const body = await parseJsonBody(context.request, updateDeveloperSchema);

    if (existing) {
      const updateData: developersRepo.UpdateDeveloperInput = {
        name: body.name,
        role: body.role,
        bio: body.bio,
        tiptap_json: body.tiptap_json,
        avatar_url: body.avatar_url,
        github_url: body.github_url,
        email: body.email,
        website_url: body.website_url,
        tech_stack: body.tech_stack
          ? JSON.stringify(body.tech_stack)
          : undefined,
        certifications: body.certifications
          ? JSON.stringify(body.certifications)
          : undefined,
        education: body.education ? JSON.stringify(body.education) : undefined,
        published_at: body.published_at,
      };

      await developersRepo.updateDeveloper(id, locale, updateData);
    } else {
      const publishedAt =
        body.published_at !== undefined && body.published_at !== null
          ? body.published_at
          : new Date().toISOString();

      await developersRepo.createDeveloper({
        id,
        locale,
        origin: locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
        author_id: user.email,
        name: body.name ?? "",
        role: body.role ?? "",
        bio: body.bio ?? "",
        tiptap_json:
          body.tiptap_json ?? JSON.stringify({ type: "doc", content: [] }),
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
    }

    context.locals.cfContext?.waitUntil(
      cleanupDeveloperAssets(id, locale, body.tiptap_json, {
        avatar_url: body.avatar_url ?? null,
      }).catch((error) => {
        console.error("Asset cleanup failed:", error);
      }),
    );
    await scheduleTranslations(
      context,
      "developer",
      id,
      locale,
      body.target_locales ?? [],
      user.email,
    );

    context.locals.cfContext?.waitUntil(
      invalidateContentCache(
        "developer",
        id,
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
      context.locals.cfContext?.waitUntil(
        deleteEntityDirectory("developer", id).catch((error) => {
          console.error("Entity directory deletion failed:", error);
        }),
      );
    } else {
      if (!locale) {
        throw new ApiError("Missing locale", 400);
      }
      const remainingLocales = await developersRepo.getDeveloperLocales(id);
      if (remainingLocales.length <= 1) {
        await developersRepo.deleteDeveloper(id, locale);
        context.locals.cfContext?.waitUntil(
          deleteEntityDirectory("developer", id).catch((error) => {
            console.error("Entity directory deletion failed:", error);
          }),
        );
      } else {
        await developersRepo.deleteDeveloper(id, locale);
      }
    }

    context.locals.cfContext?.waitUntil(
      invalidateContentCache(
        "developer",
        id,
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

async function cleanupDeveloperAssets(
  id: string,
  locale: string,
  tiptapJson: string | undefined,
  imageUrls: { avatar_url: string | null },
): Promise<void> {
  const locales = await developersRepo.getDeveloperLocalesWithContent(id);
  const usedUrls = new Set<string>();

  for (const row of locales) {
    if (row.locale === locale) {
      if (tiptapJson) {
        for (const url of extractAssetUrlsFromTiptapJson(tiptapJson)) {
          usedUrls.add(url);
        }
      }
      if (imageUrls.avatar_url) usedUrls.add(imageUrls.avatar_url);
    } else {
      for (const url of extractAssetUrlsFromTiptapJson(row.tiptap_json)) {
        usedUrls.add(url);
      }
      if (row.avatar_url) usedUrls.add(row.avatar_url);
    }
  }

  await cleanupUnusedEntityAssets("developer", id, Array.from(usedUrls));
}

export const prerender = false;
