import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { uploadEntityFile } from "@/lib/assets";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { z } from "zod";

const uploadQuerySchema = z.object({
  type: z.enum(["post", "project", "developer"]),
  id: z.string().min(1),
});

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const query = uploadQuerySchema.safeParse({
      type: context.url.searchParams.get("type"),
      id: context.url.searchParams.get("id"),
    });

    if (!query.success) {
      return jsonResponse(
        { error: "Missing or invalid entity type or id" },
        400,
      );
    }

    const formData = await context.request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonResponse({ error: "No file provided" }, 400);
    }

    const uploaded = await uploadEntityFile(
      query.data.type,
      query.data.id,
      file,
    );

    return jsonResponse(uploaded);
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
