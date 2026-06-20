import type { APIRoute } from "astro";
import { postAdapter } from "@/lib/api/adapters/posts";
import { createAdminPostHandler } from "@/lib/api/admin-crud";

export const POST: APIRoute = createAdminPostHandler(postAdapter);

export const prerender = false;
