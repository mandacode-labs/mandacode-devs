import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse, ApiError } from "@/lib/api/response";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import * as developersRepo from "@/lib/db/developers";

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id, certId } = context.params;
    if (!id || !certId) {
      throw new ApiError("Missing id or certId", 400);
    }

    await developersRepo.deleteCertification(certId);

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
