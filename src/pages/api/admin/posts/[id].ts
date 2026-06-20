import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import * as postsRepo from "@/lib/db/posts";
import { updatePostSchema } from "@/lib/api/validation";
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

    const post = await postsRepo.getPostById(id, locale);

    if (!post) {
      throw new ApiError("Post not found", 404);
    }

    return jsonResponse(post);
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

    const existing = await postsRepo.getPostById(id, locale);
    if (!existing) {
      throw new ApiError("Post not found", 404);
    }

    const body = await parseJsonBody(context.request, updatePostSchema);

    const updateData: postsRepo.UpdatePostInput = {
      title: body.title,
      description: body.description,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      pub_date: body.pub_date,
      cover_image_url: body.cover_image_url,
      og_image_url: body.og_image_url,
    };

    if (
      body.publish_status === "published" &&
      existing.publish_status !== "published" &&
      !existing.published_at
    ) {
      updateData.published_at = new Date().toISOString();
    }

    await postsRepo.updatePost(id, locale, updateData);

    context.locals.cfContext?.waitUntil(
      cleanupPostAssets(id, locale, body.tiptap_json, {
        cover_image_url: body.cover_image_url ?? null,
        og_image_url: body.og_image_url ?? null,
      }),
    );

    await scheduleTranslations(
      context,
      "post",
      id,
      locale,
      body.target_locales ?? [],
      user.email,
    );

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("post", id, SUPPORTED_LANGUAGES as string[]),
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
      await postsRepo.deleteAllPostLocales(id);
      context.locals.cfContext?.waitUntil(deleteEntityDirectory("post", id));
    } else {
      if (!locale) {
        throw new ApiError("Missing locale", 400);
      }
      const remainingLocales = await postsRepo.getPostLocales(id);
      if (remainingLocales.length <= 1) {
        await postsRepo.deletePost(id, locale);
        context.locals.cfContext?.waitUntil(deleteEntityDirectory("post", id));
      } else {
        await postsRepo.deletePost(id, locale);
      }
    }

    context.locals.cfContext?.waitUntil(
      invalidateContentCache("post", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

async function cleanupPostAssets(
  id: string,
  locale: string,
  tiptapJson: string | undefined,
  imageUrls: { cover_image_url: string | null; og_image_url: string | null },
): Promise<void> {
  const locales = await postsRepo.getPostLocalesWithContent(id);
  const usedUrls = new Set<string>();

  for (const row of locales) {
    if (row.locale === locale) {
      if (tiptapJson) {
        for (const url of extractAssetUrlsFromTiptapJson(tiptapJson)) {
          usedUrls.add(url);
        }
      }
      if (imageUrls.cover_image_url) usedUrls.add(imageUrls.cover_image_url);
      if (imageUrls.og_image_url) usedUrls.add(imageUrls.og_image_url);
    } else {
      for (const url of extractAssetUrlsFromTiptapJson(row.tiptap_json)) {
        usedUrls.add(url);
      }
      if (row.cover_image_url) usedUrls.add(row.cover_image_url);
      if (row.og_image_url) usedUrls.add(row.og_image_url);
    }
  }

  await cleanupUnusedEntityAssets("post", id, Array.from(usedUrls));
}

export const prerender = false;
