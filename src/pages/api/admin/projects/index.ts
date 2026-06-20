import type { APIRoute } from "astro";
import { projectAdapter } from "@/lib/api/adapters/projects";
import { createAdminPostHandler } from "@/lib/api/admin-crud";

export const POST: APIRoute = createAdminPostHandler(projectAdapter);

export const prerender = false;
