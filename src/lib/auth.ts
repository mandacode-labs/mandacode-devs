import type { APIContext } from "astro";

export interface AuthUser {
  email: string;
}

const ACCESS_EMAIL_HEADER = "CF-Access-Authenticated-User-Email";
const DEV_EMAIL_HEADER = "X-Dev-User-Email";
const DEV_DEFAULT_EMAIL = "dev@mandacode.com";

export function getAuthenticatedUser(context: APIContext): AuthUser | null {
  const accessEmail = context.request.headers.get(ACCESS_EMAIL_HEADER);
  if (accessEmail) {
    return { email: accessEmail };
  }

  if (import.meta.env.DEV) {
    const devEmail = context.request.headers.get(DEV_EMAIL_HEADER);
    return { email: devEmail || DEV_DEFAULT_EMAIL };
  }

  return null;
}

export function requireAuth(context: APIContext): AuthUser {
  const user = getAuthenticatedUser(context);

  if (!user) {
    throw new AuthError("Unauthorized");
  }

  return user;
}

export class AuthError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}
