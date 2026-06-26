import { getSiteUrl } from "@/lib/config/site";

function getCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

function requestToKey(request: Request): Request {
  return new Request(request.url, { method: "GET" });
}

function pathToKey(path: string): Request {
  return new Request(new URL(path, getSiteUrl()).toString(), { method: "GET" });
}

export async function getCachedResponse(
  request: Request,
): Promise<Response | undefined> {
  const cache = getCache();
  const cached = await cache.match(requestToKey(request));
  return cached ?? undefined;
}

export async function cacheResponse(
  request: Request,
  response: Response,
): Promise<void> {
  const cache = getCache();
  await cache.put(requestToKey(request), response.clone());
}

export async function invalidateCache(path: string): Promise<void> {
  const cache = getCache();
  try {
    await cache.delete(pathToKey(path));
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
