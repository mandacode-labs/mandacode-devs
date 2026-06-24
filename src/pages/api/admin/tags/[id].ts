import type { APIRoute } from "astro";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ApiError, jsonResponse, errorResponse } from "@/lib/api/response";
import { deleteTag, getTagById, getTagUsage, renameTag } from "@/lib/db/tags";

export const prerender = false;

const patchSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const id = parseId(context.params.id);
    const tag = await getTagById(id);
    if (!tag) throw new ApiError("Tag not found", 404);
    const usage = await getTagUsage(id);
    return jsonResponse({ tag, usage });
  } catch (error) {
    return errorResponse(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const id = parseId(context.params.id);
    const tag = await getTagById(id);
    if (!tag) throw new ApiError("Tag not found", 404);

    const body = patchSchema.parse(await context.request.json());
    await renameTag(id, body.name);
    return jsonResponse({ success: true, tag: { id, name: body.name } });
  } catch (error) {
    return errorResponse(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const id = parseId(context.params.id);
    const tag = await getTagById(id);
    if (!tag) throw new ApiError("Tag not found", 404);
    await deleteTag(id);
    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

function parseId(raw: unknown): number {
  if (typeof raw !== "string") throw new ApiError("Invalid tag id", 400);
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError("Invalid tag id", 400);
  }
  return id;
}
