import type { UIKey } from "./types";
import type { Language } from "../config/languages";

// Dynamically load all locale JSON files from ./locales/
const modules = import.meta.glob("./locales/*.json", { eager: true });

const ui: Record<Language, Record<UIKey, string>> = {} as Record<
  Language,
  Record<UIKey, string>
>;

for (const [path, mod] of Object.entries(modules)) {
  const lang = path.match(/\/([a-z]+)\.json$/)?.[1] as Language | undefined;
  if (lang) {
    ui[lang] = (mod as any).default as Record<UIKey, string>;
  }
}

export { ui };
export type { UIKey };
export type { Language, Language as Lang } from "../config/languages";
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../config/languages";
