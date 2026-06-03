/**
 * Central language configuration - single source of truth for all language settings
 * This file loads from root config/languages.json with TypeScript types
 */

import languagesConfig from "../../../config/languages.json";

export const SUPPORTED_LANGUAGES =
  languagesConfig.supportedLanguages as readonly string[];
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language =
  languagesConfig.defaultLanguage as Language;

export interface LanguageConfig {
  code: Language;
  label: string;
  locale: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> =
  languagesConfig.languageConfigs as Record<Language, LanguageConfig>;

export function isValidLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang);
}

export function getLanguageConfig(lang: Language): LanguageConfig {
  return LANGUAGE_CONFIGS[lang];
}

export function getOtherLanguage(lang: Language): Language {
  return lang === "ko" ? "en" : "ko";
}

/**
 * Translation configuration
 */
export const TRANSLATION_SOURCE: Language = languagesConfig.translation
  .source as Language;
export const TRANSLATION_TARGETS: Language[] = languagesConfig.translation
  .targets as Language[];

/**
 * Language-related utility functions
 */
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
