import type { APIRoute } from "astro";
import { developerAdapter } from "@/lib/api/adapters/developers";
import { createAdminPostHandler } from "@/lib/api/admin-crud";

export const POST: APIRoute = createAdminPostHandler(developerAdapter);

export const prerender = false;
