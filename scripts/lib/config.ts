import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

interface LanguageConfig {
  code: string;
  label: string;
  locale: string;
  dir: "ltr" | "rtl";
}

interface RawLanguagesConfig {
  supportedLanguages: string[];
  defaultLanguage: string;
  languageConfigs: Record<string, LanguageConfig>;
  translation: {
    source: string;
    targets: string[];
  };
}

const rawConfig: RawLanguagesConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, "config/languages.json"), "utf-8"),
);

export const SUPPORTED_LANGUAGES = rawConfig.supportedLanguages;
export const DEFAULT_LANGUAGE = rawConfig.defaultLanguage;
export const SOURCE_LANGUAGE = rawConfig.translation.source;
export const TARGET_LANGUAGES = rawConfig.translation.targets;
export const LANGUAGE_CONFIGS = rawConfig.languageConfigs;

export interface CollectionConfig {
  translatableFields: string[];
  preservedFields: string[];
  nestedTranslatableFields?: Record<string, string[]>;
}

const SHARED_PRESERVED_FIELDS = [
  "pubDate",
  "updatedDate",
  "lang",
  "coverImage",
  "ogImage",
  "tags",
  "draft",
  "status",
  "order",
  "techStack",
  "url",
  "sourceUrl",
  "blogUrl",
];

export const COLLECTION_CONFIGS: Record<string, CollectionConfig> = {
  blog: {
    translatableFields: ["title", "description"],
    preservedFields: [
      ...SHARED_PRESERVED_FIELDS,
      "duration",
      "teamSize",
      "role",
    ],
  },
  projects: {
    translatableFields: ["title", "description", "duration", "role"],
    preservedFields: [...SHARED_PRESERVED_FIELDS],
  },
  developers: {
    translatableFields: ["name", "role", "bio"],
    nestedTranslatableFields: {
      certifications: ["name", "issuer"],
      education: ["institution", "department", "status"],
    },
    preservedFields: [
      "pubDate",
      "updatedDate",
      "lang",
      "coverImage",
      "ogImage",
      "tags",
      "draft",
      "avatar",
      "github",
      "email",
      "website",
      "techStack",
      "date",
      "period",
      "badge",
      "url",
    ],
  },
};

export const COLLECTIONS = Object.keys(COLLECTION_CONFIGS);

export const PATHS = {
  root: ROOT_DIR,
  content: path.join(ROOT_DIR, "src/content"),
  uiDir: path.join(ROOT_DIR, "src/lib/i18n/locales"),
  uiTypes: path.join(ROOT_DIR, "src/lib/i18n/types.ts"),
  cache: path.join(ROOT_DIR, ".ai-cache.json"),
};

export function isValidLanguage(lang: string): boolean {
  return SUPPORTED_LANGUAGES.includes(lang);
}

export function getLanguageName(langCode: string): string {
  return LANGUAGE_CONFIGS[langCode]?.label || langCode;
}
