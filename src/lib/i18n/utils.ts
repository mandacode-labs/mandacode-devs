import { ui, type UIKey } from "./index";
import type { Language } from "../config/languages";
import { getLocaleFromPath, getRelativeLocaleUrl } from "../config/languages";

export type Lang = Language;
export { getLocaleFromPath, getRelativeLocaleUrl };

export function useTranslations(lang: Lang) {
  return function t(
    key: UIKey,
    vars?: Record<string, string | number>,
  ): string {
    const translations = ui[lang as keyof typeof ui] || ui["ko"];
    let text =
      translations[key as keyof typeof translations] ||
      ui["ko"][key as keyof (typeof ui)["ko"]] ||
      key;

    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = String(text).replace(`{${k}}`, String(v));
      });
    }

    return text;
  };
}
