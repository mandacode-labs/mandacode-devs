import { ui, type UIKey, DEFAULT_LANGUAGE } from "./index";
import { getLocaleFromPath, getRelativeLocaleUrl } from "../config/languages";
import { interpolate } from "@/lib/utils/interpolate";
import type { Lang } from "@/types";

export type { Lang };
export { getLocaleFromPath, getRelativeLocaleUrl };

export function useTranslations(lang: Lang) {
  return function t(
    key: UIKey,
    vars?: Record<string, string | number>,
  ): string {
    const translations = ui[lang] || ui[DEFAULT_LANGUAGE];
    const text = translations?.[key] || ui[DEFAULT_LANGUAGE]?.[key] || key;
    return interpolate(text, vars);
  };
}
