import { ui, type Lang, type UIKey } from "./ui";

export function useTranslations(lang: Lang) {
  return function t(
    key: UIKey,
    vars?: Record<string, string | number>,
  ): string {
    let text = ui[lang][key] || ui["ko"][key] || key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  };
}

export function getRelativeLocaleUrl(lang: Lang, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${cleanPath}`;
}

export function getLocaleFromPath(pathname: string): Lang {
  const match = pathname.match(/^\/(ko|en)(?:\/|$)/);
  return (match?.[1] as Lang) || "ko";
}
