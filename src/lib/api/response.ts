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
  if (error instanceof ApiError || error instanceof Error) {
    const status = error instanceof ApiError ? error.statusCode : 500;
    return jsonResponse({ error: error.message }, status);
  }

  return jsonResponse({ error: "Internal server error" }, 500);
}
