import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { listPostPaths } from "@/lib/db/posts";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const q = context.url.searchParams.get("q");
    const limitParam = context.url.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100);

    const paths = await listPostPaths(q, limit);
    return jsonResponse({ paths });
  } catch (error) {
    return errorResponse(error);
  }
};
