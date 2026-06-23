import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import { updateCertificationTranslationSchema } from "@/lib/api/validation";
import * as developersRepo from "@/lib/db/developers";

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id, certId } = context.params;
    if (!id || !certId) {
      return jsonResponse({ error: "Missing id or certId" }, 400);
    }
    const body = await parseJsonBody(
      context.request,
      updateCertificationTranslationSchema,
    );

    await developersRepo.upsertCertificationTranslation(certId, body.locale, {
      name: body.translation.name,
      issuer: body.translation.issuer,
      date: body.translation.date,
      badge_url: body.translation.badge_url ?? null,
      url: body.translation.url ?? null,
    });

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
