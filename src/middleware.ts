import { defineMiddleware } from "astro:middleware";

const DEFAULT_LANG = "ko";
const SUPPORTED_LANGS = ["ko", "en"];

function parseAcceptLanguage(header: string | null): string {
  if (!header) return DEFAULT_LANG;

  const langs = header
    .split(",")
    .map((item) => {
      const [lang, q] = item.trim().split(";q=");
      return {
        lang: lang?.split("-")[0].toLowerCase(),
        q: q ? parseFloat(q) : 1,
      };
    })
    .filter((item): item is { lang: string; q: number } =>
      Boolean(item.lang && SUPPORTED_LANGS.includes(item.lang)),
    )
    .sort((a, b) => b.q - a.q);

  return langs[0]?.lang ?? DEFAULT_LANG;
}

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  if (pathname === "/") {
    const acceptLang = context.request.headers.get("accept-language");
    const lang = parseAcceptLanguage(acceptLang);
    return context.redirect(`/${lang}/`, 301);
  }

  return next();
});
