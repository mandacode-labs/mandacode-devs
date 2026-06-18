import { z } from "zod";
import { ApiError } from "@/lib/api/response";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new ApiError(`Validation error: ${issues.join(", ")}`, 400);
  }

  return parsed.data;
}
