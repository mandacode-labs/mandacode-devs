import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { getDatabase } from "@/lib/db/client";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const { id } = context.params;
    if (!id) {
      return errorResponse(new Error("Missing id"));
    }

    const db = getDatabase();
    const result = await db
      .prepare(
        `UPDATE project_translations
            SET publish_status = 'published',
                published_at = COALESCE(published_at, CURRENT_TIMESTAMP)
          WHERE project_id = ?`,
      )
      .bind(id)
      .run();

    await invalidateContentCache(
      "project",
      id,
      SUPPORTED_LANGUAGES as string[],
    );

    return jsonResponse({
      success: true,
      publishedCount: result.meta.changes ?? 0,
    });
  } catch (error) {
    return errorResponse(error);
  }
};
