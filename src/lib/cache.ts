import { getSiteUrl } from "@/lib/config/site";

declare const __BUILD_ID__: string;

function getCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

export function getCacheKey(request: Request): Request {
  // Cloudflare's Cache API matches entries by URL — setting extra
  // headers on the Request does not change the key. To make each
  // deploy's cache entries independent of previous deploys, append
  // `?_b=<buildId>` to the URL. The user-facing request URL is
  // unchanged (we never expose this), so existing links keep working.
  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";
  const url = new URL(request.url);
  url.searchParams.set("_b", buildId);
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
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
