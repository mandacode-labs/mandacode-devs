export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
} as const;

// HTML is never cached at Cloudflare's CDN edge — every request
// hits the Worker, which serves the response. We still get the
// benefit of the Worker Cache API internally (versioned by build id
// in src/lib/cache.ts), so repeat hits within the same build are
// fast. But content changes (and deploys) are visible immediately
// without manual purge. Trade-off: every request crosses the
// network edge, so a very high-traffic site would feel it.
export const HTML_CACHE_CONTROL =
  "public, max-age=0, s-maxage=0, must-revalidate";

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
