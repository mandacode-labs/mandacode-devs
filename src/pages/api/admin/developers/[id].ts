import type { APIRoute } from "astro";
import { developerAdapter } from "@/lib/api/adapters/developers";
import {
  createAdminGetHandler,
  createAdminPutHandler,
  createAdminDeleteHandler,
} from "@/lib/api/admin-crud";

export const GET: APIRoute = createAdminGetHandler(developerAdapter);
export const PUT: APIRoute = createAdminPutHandler(developerAdapter);
export const DELETE: APIRoute = createAdminDeleteHandler(developerAdapter);

export const prerender = false;
