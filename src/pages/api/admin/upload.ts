import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { uploadFile } from "@/lib/r2";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);

    const formData = await context.request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonResponse({ error: "No file provided" }, 400);
    }

    const uploaded = await uploadFile(file);

    return jsonResponse(uploaded);
  } catch (error) {
    return errorResponse(error);
  }
};

export const prerender = false;
