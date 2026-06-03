import type { Language } from "../config/languages";
import { getLanguageConfig } from "../config/languages";

/**
 * Format a date using the locale for the given language
 */
export function formatDate(date: Date, lang: Language): string {
  const config = getLanguageConfig(lang);
  return new Intl.DateTimeFormat(config.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
