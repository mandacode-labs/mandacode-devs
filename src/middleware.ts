import { defineMiddleware } from "astro:middleware";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/config/languages";

export const onRequest = defineMiddleware(async (context, next) => {
  // Server-side language detection for root path
  if (context.url.pathname === "/") {
    const acceptLang = context.request.headers.get("Accept-Language");
    if (acceptLang) {
      const primaryLang = acceptLang
        .split(",")[0]
        ?.split("-")[0]
        ?.toLowerCase();
      if (
        primaryLang &&
        SUPPORTED_LANGUAGES.includes(primaryLang) &&
        primaryLang !== DEFAULT_LANGUAGE
      ) {
        return context.redirect(`/${primaryLang}/`, 302);
      }
    }
  }

  let response;
  try {
    response = await next();
  } catch (error) {
    response = new Response("Internal Server Error", { status: 500 });
  }

  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
