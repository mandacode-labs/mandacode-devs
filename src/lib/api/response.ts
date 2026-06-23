import { AuthError } from "@/lib/auth";

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message }, error.statusCode);
  }

  if (error instanceof AuthError) {
    return jsonResponse({ error: error.message }, error.statusCode);
  }

  if (error instanceof Error) {
    console.error("API error:", error.message, error.stack);
    return jsonResponse({ error: "Internal server error" }, 500);
  }

  console.error("API error:", error);
  return jsonResponse({ error: "Internal server error" }, 500);
}
