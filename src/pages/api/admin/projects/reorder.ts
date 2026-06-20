import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api/response";
import { updateProjectOrderForAllLocales } from "@/lib/db/projects";
import { parseJsonBody } from "@/lib/api/request";
import { z } from "zod";

export const prerender = false;

const reorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().min(1),
      project_order: z.number().int(),
    }),
  ),
});

export const POST: APIRoute = async (context) => {
  try {
    requireAuth(context);
    const body = await parseJsonBody(context.request, reorderSchema);

    await Promise.all(
      body.orders.map(({ id, project_order }) =>
        updateProjectOrderForAllLocales(id, project_order),
      ),
    );

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
};
