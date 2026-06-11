import { z } from "zod";

const languageConfigSchema = z.object({
  code: z.string(),
  label: z.string(),
  locale: z.string(),
  dir: z.enum(["ltr", "rtl"]),
});

const languagesConfigSchema = z.object({
  supportedLanguages: z.array(z.string()).min(1),
  defaultLanguage: z.string(),
  languageConfigs: z.record(z.string(), languageConfigSchema),
  translation: z.object({
    source: z.string(),
    targets: z.array(z.string()),
  }),
});

import rawConfig from "../../../config/languages.json";

const parsed = languagesConfigSchema.parse(rawConfig);

export const SUPPORTED_LANGUAGES: readonly string[] = parsed.supportedLanguages;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = parsed.defaultLanguage as Language;

export interface LanguageConfig {
  code: Language;
  label: string;
  locale: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> =
  parsed.languageConfigs as Record<Language, LanguageConfig>;

export function isValidLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang);
}

export function getLanguageConfig(lang: Language): LanguageConfig {
  return LANGUAGE_CONFIGS[lang];
}

export const TRANSLATION_SOURCE: Language = parsed.translation
  .source as Language;
export const TRANSLATION_TARGETS: Language[] = parsed.translation
  .targets as Language[];

export function getLocaleFromPath(pathname: string): Language {
  const match = pathname.match(
    new RegExp(`^/(${SUPPORTED_LANGUAGES.join("|")})(?:/|$)`),
  );
  return (match?.[1] as Language) || DEFAULT_LANGUAGE;
}

export function getRelativeLocaleUrl(lang: Language, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${cleanPath}`;
}
