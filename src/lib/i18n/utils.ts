import { ui, type UIKey, DEFAULT_LANGUAGE } from "./index";
import { getLocaleFromPath, getRelativeLocaleUrl } from "../config/languages";
import type { Lang } from "@/types";

export type { Lang };
export { getLocaleFromPath, getRelativeLocaleUrl };

export function useTranslations(lang: Lang) {
  return function t(
    key: UIKey,
    vars?: Record<string, string | number>,
  ): string {
    const translations = ui[lang] || ui[DEFAULT_LANGUAGE];
    let text = translations?.[key] || ui[DEFAULT_LANGUAGE]?.[key] || key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = String(text).replace(`{${k}}`, String(v));
      });
    }

    return text;
  };
}
