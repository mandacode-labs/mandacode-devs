import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { searchTags } from "@/lib/db/tags";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const query = context.url.searchParams.get("q") ?? "";
    const limitParam = context.url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 10;

    const tags = await searchTags(query, limit);
    return jsonResponse({ tags });
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
