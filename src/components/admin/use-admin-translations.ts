import type { UIKey } from "@/lib/i18n";

export type AdminTranslations = Partial<Record<UIKey, string>>;

export function useAdminTranslations(translations: AdminTranslations) {
  return (key: UIKey, fallback: string) => translations[key] ?? fallback;
}
