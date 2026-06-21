import type { UIKey } from "@/lib/i18n";

export type AdminTranslations = Partial<Record<UIKey, string>>;

export function useAdminTranslations(translations: AdminTranslations) {
  return (key: UIKey, fallback: string, vars?: Record<string, string>) => {
    let text = translations[key] ?? fallback;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, v);
      }
    }
    return text;
  };
}
