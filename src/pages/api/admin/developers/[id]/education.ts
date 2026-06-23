import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import { createEducationSchema } from "@/lib/api/validation";
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
    const items = await developersRepo.getDeveloperEducation(id, locale);
    return jsonResponse(items);
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
    const body = await parseJsonBody(context.request, createEducationSchema);

    const existing = await developersRepo.getDeveloperEducation(
      id,
      body.locale,
    );
    const orderIndex = existing.length;

    const eduId = await developersRepo.createEducation({
      developer_id: id,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      initial_locale: body.locale,
      initial_translation: {
        institution: body.translation.institution,
        department: body.translation.department ?? null,
        status: body.translation.status ?? null,
      },
      order_index: orderIndex,
    });

    safeWaitUntil(
      context,
      invalidateContentCache("developer", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ id: eduId });
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
