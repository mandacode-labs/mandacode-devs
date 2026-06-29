export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
} as const;

export const HTML_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

// Admin and API responses must never be cached — list/editor views
// show live data and stale entries from the CDN caused users to see
// the pre-edit state after a save.
export const NO_STORE_CACHE_CONTROL = "no-store, no-cache, must-revalidate";

export type SecurityHeaderName = keyof typeof SECURITY_HEADERS;

export function applySecurityHeaders(
  response: Response,
  options: { noStore?: boolean } = {},
): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  const contentType = headers.get("content-type") ?? "";
  if (contentType.includes("text/html") && !headers.has("cache-control")) {
    headers.set(
      "Cache-Control",
      options.noStore ? NO_STORE_CACHE_CONTROL : HTML_CACHE_CONTROL,
    );
  } else if (options.noStore && !headers.has("cache-control")) {
    headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
