export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
} as const;

// Short edge-cache TTL for HTML. After this expires, Cloudflare's
// CDN re-hits the Worker which re-runs the build-id versioned Worker
// Cache API, so a deploy becomes visible within this many seconds
// (no manual purge needed). Worker Cache API entries from the prior
// build are unreachable because their build-id prefix no longer matches.
export const HTML_CACHE_CONTROL = "public, max-age=0, s-maxage=60";

export type SecurityHeaderName = keyof typeof SECURITY_HEADERS;

export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  const contentType = headers.get("content-type") ?? "";
  if (contentType.includes("text/html") && !headers.has("cache-control")) {
    headers.set("Cache-Control", HTML_CACHE_CONTROL);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
