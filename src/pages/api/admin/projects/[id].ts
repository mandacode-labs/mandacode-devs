import type { APIRoute } from "astro";
import { projectAdapter } from "@/lib/api/adapters/projects";
import {
  createAdminGetHandler,
  createAdminPutHandler,
  createAdminDeleteHandler,
} from "@/lib/api/admin-crud";

export const GET: APIRoute = createAdminGetHandler(projectAdapter);
export const PUT: APIRoute = createAdminPutHandler(projectAdapter);
export const DELETE: APIRoute = createAdminDeleteHandler(projectAdapter);

export const prerender = false;
