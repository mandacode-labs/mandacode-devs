import type { UIKey } from "./types";
import type { Language } from "../config/languages";

const modules = import.meta.glob("./locales/*.json", { eager: true });

const ui: Partial<Record<Language, Partial<Record<UIKey, string>>>> = {};

for (const [path, mod] of Object.entries(modules)) {
  const match = path.match(/\/([a-z]+)\.json$/);
  if (!match) continue;

  const lang = match[1];
  const data = mod as Record<string, unknown>;
  if (typeof data.default === "object" && data.default !== null) {
    ui[lang as Language] = data.default as Partial<Record<UIKey, string>>;
  }
}

export { ui };
export type { UIKey };
export type { Language, Language as Lang } from "../config/languages";
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../config/languages";
