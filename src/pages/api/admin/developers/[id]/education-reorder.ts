import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import { reorderEducationSchema } from "@/lib/api/validation";
import * as developersRepo from "@/lib/db/developers";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id } = context.params;
    if (!id) {
      return jsonResponse({ error: "Missing id" }, 400);
    }
    const body = await parseJsonBody(context.request, reorderEducationSchema);

    await developersRepo.reorderEducation(id, body.orderedIds);

    safeWaitUntil(
      context,
      invalidateContentCache("developer", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

function safeWaitUntil(
  context: {
    locals: { cfContext?: { waitUntil: (p: Promise<unknown>) => void } };
  },
  promise: Promise<unknown>,
): void {
  context.locals.cfContext?.waitUntil(
    promise.catch((error) => {
      console.error("Background task failed:", error);
    }),
  );
}
