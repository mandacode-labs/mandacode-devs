import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { listTagsWithUsage, searchTags } from "@/lib/db/tags";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const q = context.url.searchParams.get("q");
    const limitParam = context.url.searchParams.get("limit");
    const hasLimit = limitParam !== null;

    if (hasLimit) {
      const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 50);
      const names = await searchTags(q ?? "", limit);
      return jsonResponse({ tags: names });
    }

    const tags = await listTagsWithUsage(q);
    return jsonResponse({ tags });
  } catch (error) {
    return errorResponse(error);
  }
};
