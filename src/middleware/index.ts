import { defineMiddleware } from "astro:middleware";
import type { APIContext } from "astro";
import { env } from "cloudflare:workers";
import { DEFAULT_LANGUAGE, isValidLanguage } from "@/lib/config/languages";
import { applySecurityHeaders } from "@/lib/config/security";
import { getCachedResponse, cacheResponse } from "@/lib/cache";

function getLanguageFromPath(pathname: string): string {
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && isValidLanguage(firstSegment)) {
    return firstSegment;
  }
  return DEFAULT_LANGUAGE;
}

function shouldCache(context: APIContext): boolean {
  return (
    context.request.method === "GET" &&
    !context.url.pathname.startsWith("/admin") &&
    !context.url.pathname.startsWith("/api")
  );
}

async function getLocalizedNotFound(
  context: APIContext,
  lang: string,
): Promise<Response | null> {
  const notFoundUrl = new URL(`/${lang}/404/`, context.url.origin);

  try {
    const assets = env.ASSETS;
    if (!assets) {
      return null;
    }

    const notFoundResponse = await assets.fetch(
      new Request(notFoundUrl, context.request),
    );

    return applySecurityHeaders(
      new Response(notFoundResponse.body, {
        status: 404,
        statusText: "Not Found",
        headers: notFoundResponse.headers,
      }),
    );
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (shouldCache(context)) {
    const cached = await getCachedResponse(context.request);
    if (cached) {
      return applySecurityHeaders(cached);
    }
  }

  const response = await next();

  if (response.status === 404) {
    const lang = getLanguageFromPath(context.url.pathname);
    const notFoundResponse = await getLocalizedNotFound(context, lang);

    if (notFoundResponse) {
      return notFoundResponse;
    }
  }

  if (shouldCache(context) && response.status === 200) {
    context.locals.cfContext?.waitUntil(
      cacheResponse(context.request, response),
    );
  }

  return applySecurityHeaders(response);
});
