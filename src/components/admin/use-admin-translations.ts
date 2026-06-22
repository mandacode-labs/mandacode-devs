import type { UIKey } from "@/lib/i18n";
import { interpolate } from "@/lib/utils/interpolate";

export type AdminTranslations = Partial<Record<UIKey, string>>;

export function useAdminTranslations(translations: AdminTranslations) {
  return (
    key: UIKey,
    fallback: string,
    vars?: Record<string, string | number>,
  ) => {
    const text = translations[key] ?? fallback;
    return interpolate(text, vars);
  };
}
