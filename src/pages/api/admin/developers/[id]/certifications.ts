import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import { createCertificationSchema } from "@/lib/api/validation";
import * as developersRepo from "@/lib/db/developers";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id } = context.params;
    const locale = context.url.searchParams.get("locale");
    if (!id || !locale) {
      return jsonResponse({ error: "Missing id or locale" }, 400);
    }
    const certs = await developersRepo.getDeveloperCertifications(id, locale);
    return jsonResponse(certs);
  } catch (error) {
    return errorResponse(error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id } = context.params;
    if (!id) {
      return jsonResponse({ error: "Missing id" }, 400);
    }
    const body = await parseJsonBody(
      context.request,
      createCertificationSchema,
    );

    const existing = await developersRepo.getDeveloperCertifications(
      id,
      body.locale,
    );
    const orderIndex = existing.length;

    const certId = await developersRepo.createCertification({
      developer_id: id,
      initial_locale: body.locale,
      initial_translation: {
        name: body.translation.name,
        issuer: body.translation.issuer ?? null,
        date: body.translation.date ?? "",
        badge_url: body.translation.badge_url ?? null,
      },
      order_index: orderIndex,
    });

    safeWaitUntil(
      context,
      invalidateContentCache("developer", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ id: certId });
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
