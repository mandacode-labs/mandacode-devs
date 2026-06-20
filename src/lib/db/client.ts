import { env } from "cloudflare:workers";
import { ApiError } from "@/lib/api/response";

export function getDatabase(): D1Database {
  const db = env.DB;

  if (!db) {
    throw new ApiError("D1 database is not configured", 500);
  }

  return db;
}
