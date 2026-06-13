import { DEFAULT_LANGUAGE } from "@/lib/config/languages";

interface Env {
  ASSETS: Fetcher;
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

function getLanguageFromPath(pathname: string): string {
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && /^[a-z]{2}$/.test(firstSegment)) {
    return firstSegment;
  }
  return DEFAULT_LANGUAGE;
}

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    let response: Response;
    try {
      response = await env.ASSETS.fetch(request);
    } catch {
      response = new Response("Internal Server Error", { status: 500 });
    }

    if (response.status === 404) {
      const lang = getLanguageFromPath(url.pathname);
      const notFoundUrl = new URL(`/${lang}/404/`, url.origin);

      try {
        const notFoundResponse = await env.ASSETS.fetch(
          new Request(notFoundUrl, request),
        );
        const headers = new Headers(notFoundResponse.headers);

        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
          headers.set(key, value);
        }

        return new Response(notFoundResponse.body, {
          status: 404,
          statusText: "Not Found",
          headers,
        });
      } catch {
        // Fallback to original 404 response with security headers
      }
    }

    return applySecurityHeaders(response);
  },
};
