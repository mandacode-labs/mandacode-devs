import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse, ApiError } from "@/lib/api/response";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import {
  updateEducationSchema,
  updateEducationTranslationSchema,
} from "@/lib/api/validation";
import * as developersRepo from "@/lib/db/developers";

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id, eduId } = context.params;
    if (!id || !eduId) {
      throw new ApiError("Missing id or eduId", 400);
    }

    // Two-part body: dates (top-level) + translation (nested).
    // Use a permissive schema for parsing then validate separately.
    const raw = (await context.request.json()) as {
      start_date?: string | null;
      end_date?: string | null;
      locale?: string;
      translation?: {
        institution: string;
        department?: string | null;
        status?: string | null;
      };
    };

    if (raw.start_date !== undefined || raw.end_date !== undefined) {
      const dateResult = updateEducationSchema.safeParse({
        start_date: raw.start_date,
        end_date: raw.end_date,
      });
      if (!dateResult.success) {
        throw new ApiError(
          `Validation error: ${dateResult.error.issues.map((i) => i.message).join(", ")}`,
          400,
        );
      }
      await developersRepo.updateEducationDates(
        eduId,
        dateResult.data.start_date ?? null,
        dateResult.data.end_date ?? null,
      );
    }

    if (raw.translation && raw.locale) {
      const transResult = updateEducationTranslationSchema.safeParse({
        locale: raw.locale,
        translation: raw.translation,
      });
      if (!transResult.success) {
        throw new ApiError(
          `Validation error: ${transResult.error.issues.map((i) => i.message).join(", ")}`,
          400,
        );
      }
      await developersRepo.upsertEducationTranslation(
        eduId,
        transResult.data.locale,
        {
          institution: transResult.data.translation.institution,
          department: transResult.data.translation.department ?? null,
          status: transResult.data.translation.status ?? null,
        },
      );
    }

    safeWaitUntil(
      context,
      invalidateContentCache("developer", id, SUPPORTED_LANGUAGES as string[]),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id, eduId } = context.params;
    if (!id || !eduId) {
      throw new ApiError("Missing id or eduId", 400);
    }

    await developersRepo.deleteEducation(eduId);

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
