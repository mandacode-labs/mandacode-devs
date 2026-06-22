import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { searchPostsByTitle } from "@/lib/db/posts";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);
  } catch (error) {
    return errorResponse(error);
  }

  const query = context.url.searchParams.get("q") ?? "";
  const limitRaw = context.url.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw ?? 10) || 10, 1), 50);

  const results = await searchPostsByTitle(query, limit);
  return jsonResponse({ results });
};
