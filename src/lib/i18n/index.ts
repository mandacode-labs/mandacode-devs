import ko from "./ko.json";
import en from "./en.json";

export const ui = {
  ko,
  en,
} as const;

// UIKey: all languages must have the same keys for type safety
export type UIKey = keyof (typeof ui)["ko"] & keyof (typeof ui)["en"];

// Re-export language types from central config
export type { Language, Language as Lang } from "../config/languages";
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../config/languages";
