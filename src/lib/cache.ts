import { getSiteUrl } from "@/lib/config/site";

declare const __BUILD_ID__: string;

function getCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

export function getCacheKey(request: Request): Request {
  // Prefix every cache entry with the per-build identifier baked in at
  // build time (`__BUILD_ID__`). A new deployment changes the prefix,
  // so old HTML/JSON responses become unreachable and won't serve
  // stale content with broken asset references.
  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";
  const headers = new Headers(request.headers);
  headers.set("x-build-id", buildId);
  return new Request(request.url, {
    method: request.method,
    headers,
  });
}

export async function getCachedResponse(
  request: Request,
): Promise<Response | undefined> {
  const cache = getCache();
  const cached = await cache.match(getCacheKey(request));
  return cached ?? undefined;
}

export async function cacheResponse(
  request: Request,
  response: Response,
): Promise<void> {
  const cache = getCache();
  await cache.put(getCacheKey(request), response.clone());
}

export async function invalidateCache(path: string): Promise<void> {
  const cache = getCache();
  const url = new URL(path, getSiteUrl());

  try {
    await cache.delete(new Request(url));
  } catch {
    // Ignore cache deletion errors
  }
}

export async function invalidateContentCache(
  contentType: "post" | "project" | "developer",
  id: string,
  locales: string[],
): Promise<void> {
  const paths: string[] = [];

  for (const locale of locales) {
    switch (contentType) {
      case "post":
        paths.push(`/${locale}/blog`, `/${locale}/blog/${id}`);
        break;
      case "project":
        paths.push(`/${locale}/projects`, `/${locale}/projects/${id}`);
        break;
      case "developer":
        paths.push(`/${locale}/developer`);
        break;
    }
  }

  await Promise.all(paths.map((path) => invalidateCache(path)));
}
