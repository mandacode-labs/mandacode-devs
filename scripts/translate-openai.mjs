import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import OpenAI from "openai";

// Load translation configuration from central language config
const languagesConfig = JSON.parse(
  fs.readFileSync(
    new URL("../config/languages.json", import.meta.url),
    "utf-8",
  ),
);

const TRANSLATION_CONFIG = {
  sourceLang: languagesConfig.translation.source,
  targetLangs: languagesConfig.translation.targets,
  contentDir: "src/content",
  uiDir: "src/lib/i18n/locales",
  typesFile: "src/lib/i18n/types.ts",
  cacheFile: ".translate-cache.json",
  collections: {
    blog: {
      translatableFields: ["title", "description"],
      preservedFields: [
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
        "duration",
        "teamSize",
        "role",
        "url",
        "sourceUrl",
        "blogUrl",
      ],
    },
    projects: {
      translatableFields: ["title", "description", "duration", "role"],
      preservedFields: [
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
        "teamSize",
        "url",
        "sourceUrl",
        "blogUrl",
      ],
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
  },
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Get human-readable language name
 */
function getLanguageName(langCode) {
  const names = {
    ko: "Korean",
    en: "English",
    ja: "Japanese",
    zh: "Chinese",
    es: "Spanish",
    fr: "French",
    de: "German",
  };
  return names[langCode] || langCode;
}

/**
 * Generate translation prompt with source and target languages
 */
function getTranslationStyle(sourceLang, targetLang) {
  return `You are a professional translator.
Translate the following content from ${getLanguageName(sourceLang)} to ${getLanguageName(targetLang)}.

Guidelines:
- Maintain the original author's tone, style, and voice
- Adapt expressions to sound natural for ${getLanguageName(targetLang)} speakers
- Preserve technical terms, code blocks, URLs, and markdown formatting
- Do not translate content inside backticks or code fences
- Keep frontmatter metadata (dates, URLs, paths) unchanged`;
}

/**
 * Generate MD5 hash for content caching
 */
function getHash(content) {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Load translation cache from disk
 */
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(TRANSLATION_CONFIG.cacheFile, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Save translation cache to disk
 */
function saveCache(cache) {
  fs.writeFileSync(
    TRANSLATION_CONFIG.cacheFile,
    JSON.stringify(cache, null, 2),
  );
}

/**
 * Extract translatable fields from frontmatter data
 */
function extractTranslatableFields(collection, data) {
  const config = TRANSLATION_CONFIG.collections[collection];
  if (!config) {
    return { translatable: {}, preserved: { ...data } };
  }

  const translatable = {};
  const preserved = {};

  for (const [key, value] of Object.entries(data)) {
    if (config.translatableFields.includes(key)) {
      translatable[key] = value;
    } else if (config.nestedTranslatableFields?.[key]) {
      preserved[key] = value;
    } else {
      preserved[key] = value;
    }
  }

  return { translatable, preserved };
}

/**
 * Recursively translate nested objects in arrays
 */
async function translateNestedItems(
  items,
  fields,
  targetLang,
  context = "information",
) {
  if (!Array.isArray(items)) return items;

  return Promise.all(
    items.map(async (item) => {
      const translatedItem = { ...item };

      const toTranslate = {};
      for (const field of fields) {
        if (typeof item[field] === "string" && item[field].trim()) {
          toTranslate[field] = item[field];
        }
      }

      if (Object.keys(toTranslate).length === 0) return translatedItem;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: getTranslationStyle(
                TRANSLATION_CONFIG.sourceLang,
                targetLang,
              ),
            },
            {
              role: "user",
              content: `Translate the following ${context} from ${getLanguageName(TRANSLATION_CONFIG.sourceLang)} to ${getLanguageName(targetLang)}. Return a JSON object with the same keys but translated values. Preserve proper names (like school names, certification acronyms) in their original form if they are universally recognized:\n\n${JSON.stringify(toTranslate, null, 2)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const translated = JSON.parse(response.choices[0].message.content);
        Object.assign(translatedItem, translated);
      } catch (error) {
        console.warn(
          `  ⚠ Nested ${context} translation failed: ${error.message}`,
        );
      }

      return translatedItem;
    }),
  );
}

/**
 * Translate a single text string using OpenAI
 */
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getTranslationStyle(
            TRANSLATION_CONFIG.sourceLang,
            targetLang,
          ),
        },
        {
          role: "user",
          content: `Translate the following ${getLanguageName(TRANSLATION_CONFIG.sourceLang)} text to ${getLanguageName(targetLang)}:\n\n${text}`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.warn(`Translation failed: ${error.message}`);
    return text;
  }
}

/**
 * Translate frontmatter fields using OpenAI
 */
async function translateFrontmatterFields(fields, targetLang) {
  const translated = {};

  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string" && value.trim()) {
      translated[key] = await translateText(value, targetLang);
    } else {
      translated[key] = value;
    }
  }

  return translated;
}

/**
 * Translate markdown body content
 */
async function translateBody(body, targetLang) {
  if (!body || !body.trim()) return body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getTranslationStyle(
            TRANSLATION_CONFIG.sourceLang,
            targetLang,
          ),
        },
        {
          role: "user",
          content: `Translate the following ${getLanguageName(TRANSLATION_CONFIG.sourceLang)} markdown content to ${getLanguageName(targetLang)}. Keep all markdown formatting, code blocks, and technical terms unchanged:\n\n${body}`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.warn(`Body translation failed: ${error.message}`);
    return body;
  }
}

/**
 * Merge translated fields with preserved fields
 */
function mergeFields(translated, preserved, targetLang) {
  const merged = { ...preserved, ...translated };
  merged.lang = targetLang;
  return merged;
}

/**
 * Process and fix date fields in frontmatter
 */
function fixDateFields(data) {
  const fixed = { ...data };

  for (const [key, value] of Object.entries(fixed)) {
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      (key.toLowerCase().includes("date") || key.toLowerCase().includes("time"))
    ) {
      try {
        fixed[key] = new Date(value);
      } catch {
        // Keep original if parsing fails
      }
    }
  }

  return fixed;
}

/**
 * Translate a single markdown file
 */
async function translateFile(filePath, targetLang, cache) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const hash = getHash(content);
  const cacheKey = `${filePath}:${targetLang}`;

  if (cache[cacheKey] === hash) {
    console.log(`  ✓ ${fileName}: Up to date`);
    return;
  }

  const collection = path.basename(path.dirname(path.dirname(filePath)));
  const parsed = matter(content);

  try {
    const { translatable, preserved } = extractTranslatableFields(
      collection,
      parsed.data,
    );

    const translatedFields = await translateFrontmatterFields(
      translatable,
      targetLang,
    );

    const config = TRANSLATION_CONFIG.collections[collection];
    if (config?.nestedTranslatableFields) {
      for (const [nestedKey, nestedFields] of Object.entries(
        config.nestedTranslatableFields,
      )) {
        if (Array.isArray(preserved[nestedKey])) {
          preserved[nestedKey] = await translateNestedItems(
            preserved[nestedKey],
            nestedFields,
            targetLang,
            nestedKey,
          );
        }
      }
    }

    let mergedData = mergeFields(translatedFields, preserved, targetLang);
    mergedData = fixDateFields(mergedData);

    const translatedBody = await translateBody(parsed.content, targetLang);
    const newContent = matter.stringify(translatedBody, mergedData);

    const sourceDir = path.dirname(filePath);
    const targetDir = sourceDir.replace(
      `/${TRANSLATION_CONFIG.sourceLang}`,
      `/${targetLang}`,
    );

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, fileName);
    fs.writeFileSync(targetPath, newContent);

    cache[cacheKey] = hash;
    console.log(`  ✓ ${fileName}: Translated to ${targetLang}`);
  } catch (error) {
    console.error(`  ✗ ${fileName}: ${error.message}`);
  }
}

/**
 * Translate all content collections
 */
async function translateContent() {
  console.log("🌐 Starting content translation with OpenAI...\n");

  const cache = loadCache();
  const contentDir = path.resolve(TRANSLATION_CONFIG.contentDir);

  for (const targetLang of TRANSLATION_CONFIG.targetLangs) {
    console.log(`Translating to ${targetLang}...`);

    const collections = fs.readdirSync(contentDir);
    for (const collection of collections) {
      const collectionPath = path.join(contentDir, collection);
      if (!fs.statSync(collectionPath).isDirectory()) continue;

      const sourceDir = path.join(
        collectionPath,
        TRANSLATION_CONFIG.sourceLang,
      );
      if (!fs.existsSync(sourceDir)) {
        console.log(
          `  ⚠ ${collection}: No ${TRANSLATION_CONFIG.sourceLang} folder found`,
        );
        continue;
      }

      const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".md"));

      console.log(`  📁 ${collection}: ${files.length} files found`);

      for (const file of files) {
        const filePath = path.join(sourceDir, file);
        try {
          await translateFile(filePath, targetLang, cache);
        } catch (error) {
          console.error(`  ✗ ${file}: ${error.message}`);
        }
      }
    }
  }

  saveCache(cache);
  console.log("\n✅ Content translation complete!");
}

// ========== UI TRANSLATION ==========

/**
 * Generate UIKey TypeScript type file from source locale keys
 */
function generateTypesFile(sourceData) {
  const keys = Object.keys(sourceData)
    .sort()
    .map((key) => `  | "${key}"`)
    .join("\n");

  const content = `// Auto-generated by translate script. Do not edit manually.
// Run \`npm run translate:ui\` to regenerate.

export type UIKey =
${keys};
`;

  fs.writeFileSync(TRANSLATION_CONFIG.typesFile, content);
  console.log(`  📝 Generated types at ${TRANSLATION_CONFIG.typesFile}`);
}

/**
 * Translate UI strings for a single target language
 */
async function translateUILanguage(sourceData, targetLang) {
  const targetPath = path.join(TRANSLATION_CONFIG.uiDir, `${targetLang}.json`);

  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
  } catch {
    console.log(`  Creating new ${targetLang}.json`);
  }

  // Find new keys to translate
  const newKeys = Object.keys(sourceData).filter((key) => !existing[key]);

  // Find keys to remove
  const removedKeys = Object.keys(existing).filter(
    (key) => !(key in sourceData),
  );

  if (newKeys.length === 0 && removedKeys.length === 0) {
    console.log(`  ✓ ${targetLang}: All UI strings up to date`);
    return;
  }

  if (removedKeys.length > 0) {
    for (const key of removedKeys) {
      delete existing[key];
      console.log(`  🗑 ${key}: Removed (no longer in source)`);
    }
  }

  if (newKeys.length > 0) {
    console.log(
      `  Found ${newKeys.length} new strings to translate to ${targetLang}`,
    );

    const toTranslate = {};
    newKeys.forEach((key) => {
      toTranslate[key] = sourceData[key];
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getTranslationStyle(
              TRANSLATION_CONFIG.sourceLang,
              targetLang,
            ),
          },
          {
            role: "user",
            content: `Translate the following ${getLanguageName(TRANSLATION_CONFIG.sourceLang)} UI strings to ${getLanguageName(targetLang)}. Return a JSON object with the same keys but translated values. Do not change the keys, only translate the values:\n\n${JSON.stringify(toTranslate, null, 2)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const translated = JSON.parse(response.choices[0].message.content);

      // Merge with existing
      Object.assign(existing, translated);

      console.log(`  ✓ Translated ${newKeys.length} strings to ${targetLang}`);
    } catch (error) {
      console.error(
        `  ✗ UI translation failed for ${targetLang}: ${error.message}`,
      );
      return;
    }
  }

  // Ensure all source keys exist in target (fallback to source if translation failed)
  for (const key of Object.keys(sourceData)) {
    if (!(key in existing)) {
      existing[key] = sourceData[key];
      console.log(`  ⚠ ${key}: Using source text as fallback`);
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2) + "\n");
  console.log(`  💾 Saved ${targetPath}`);
}

/**
 * Translate UI strings for all target languages
 */
async function translateUIStrings() {
  console.log("🌐 Translating UI strings...\n");

  const sourcePath = path.join(
    TRANSLATION_CONFIG.uiDir,
    `${TRANSLATION_CONFIG.sourceLang}.json`,
  );

  if (!fs.existsSync(sourcePath)) {
    console.error(`  ✗ Source file not found: ${sourcePath}`);
    return;
  }

  const sourceData = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

  // Generate TypeScript types from source keys
  generateTypesFile(sourceData);

  // Translate to each target language
  for (const targetLang of TRANSLATION_CONFIG.targetLangs) {
    if (targetLang === TRANSLATION_CONFIG.sourceLang) continue;
    await translateUILanguage(sourceData, targetLang);
  }

  console.log("\n✅ UI translation complete!");
}

// Main execution
const mode = process.argv[2] || "all";

async function main() {
  if (mode === "all" || mode === "content") {
    await translateContent();
  }

  if (mode === "all" || mode === "ui") {
    await translateUIStrings();
  }
}

main().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
