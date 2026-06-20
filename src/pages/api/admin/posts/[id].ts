import type { APIRoute } from "astro";
import { postAdapter } from "@/lib/api/adapters/posts";
import {
  createAdminGetHandler,
  createAdminPutHandler,
  createAdminDeleteHandler,
} from "@/lib/api/admin-crud";

export const GET: APIRoute = createAdminGetHandler(postAdapter);
export const PUT: APIRoute = createAdminPutHandler(postAdapter);
export const DELETE: APIRoute = createAdminDeleteHandler(postAdapter);

export const prerender = false;
