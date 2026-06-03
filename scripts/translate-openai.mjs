import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import OpenAI from "openai";

// Load translation configuration
const TRANSLATION_CONFIG = {
  sourceLang: "ko",
  targetLangs: ["en"],
  contentDir: "src/content",
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

const TRANSLATION_STYLE = `You are a professional translator specializing in Korean-to-English technical content.

Style Guidelines:
- Natural, professional English suitable for a developer portfolio
- Technical terms should be used naturally (e.g., "implement" instead of "carry out")
- Maintain a confident, knowledgeable tone
- Avoid overly literal translations
- Use active voice where possible

Rules:
- PRESERVE all code blocks, URLs, file paths, technical terms, and proper nouns
- MAINTAIN all markdown formatting (headers, lists, bold, italic, links)
- DO NOT translate content inside backticks or code fences
- KEEP frontmatter fields like urls, paths, identifiers, and dates unchanged
- PRESERVE date fields (pubDate, updatedDate, etc.) in their original format
- Maintain the original structure and formatting`;

/**
 * Generate MD5 hash for content caching
 * @param {string} content
 * @returns {string}
 */
function getHash(content) {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Load translation cache from disk
 * @returns {Record<string, string>}
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
 * @param {Record<string, string>} cache
 */
function saveCache(cache) {
  fs.writeFileSync(TRANSLATION_CONFIG.cacheFile, JSON.stringify(cache, null, 2));
}

/**
 * Extract translatable fields from frontmatter data
 * @param {string} collection - Collection name
 * @param {Record<string, any>} data - Frontmatter data
 * @returns {{ translatable: Record<string, any>, preserved: Record<string, any> }}
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
      // Handle nested arrays with translatable fields
      translatable[key] = value;
    } else {
      preserved[key] = value;
    }
  }

  return { translatable, preserved };
}

/**
 * Recursively translate nested objects in arrays
 * @param {any[]} items - Array of objects
 * @param {string[]} fields - Fields to translate
 * @param {string} targetLang - Target language
 * @returns {Promise<any[]>}
 */
async function translateNestedItems(items, fields, targetLang) {
  if (!Array.isArray(items)) return items;

  return Promise.all(
    items.map(async (item) => {
      const translatedItem = { ...item };
      for (const field of fields) {
        if (typeof item[field] === "string" && item[field].trim()) {
          translatedItem[field] = await translateText(item[field], targetLang);
        }
      }
      return translatedItem;
    })
  );
}

/**
 * Translate a single text string using OpenAI
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language
 * @returns {Promise<string>}
 */
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: TRANSLATION_STYLE },
        {
          role: "user",
          content: `Translate the following Korean text to ${targetLang === "en" ? "English" : targetLang}:\n\n${text}`,
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
 * @param {Record<string, any>} fields - Fields to translate
 * @param {string} targetLang - Target language
 * @returns {Promise<Record<string, any>>}
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
 * @param {string} body - Markdown body
 * @param {string} targetLang - Target language
 * @returns {Promise<string>}
 */
async function translateBody(body, targetLang) {
  if (!body || !body.trim()) return body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: TRANSLATION_STYLE },
        {
          role: "user",
          content: `Translate the following Korean markdown content to ${targetLang === "en" ? "English" : targetLang}. Keep all markdown formatting, code blocks, and technical terms unchanged:\n\n${body}`,
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
 * @param {Record<string, any>} translated - Translated fields
 * @param {Record<string, any>} preserved - Preserved fields
 * @param {string} targetLang - Target language
 * @returns {Record<string, any>}
 */
function mergeFields(translated, preserved, targetLang) {
  const merged = { ...preserved, ...translated };
  merged.lang = targetLang;
  return merged;
}

/**
 * Process and fix date fields in frontmatter
 * @param {Record<string, any>} data - Frontmatter data
 * @returns {Record<string, any>}
 */
function fixDateFields(data) {
  const fixed = { ...data };

  // Convert ISO date strings back to Date objects
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
 * @param {string} filePath - Source file path
 * @param {string} targetLang - Target language
 * @param {Record<string, string>} cache - Translation cache
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
    // Extract translatable and preserved fields
    const { translatable, preserved } = extractTranslatableFields(
      collection,
      parsed.data
    );

    // Translate top-level fields
    const translatedFields = await translateFrontmatterFields(
      translatable,
      targetLang
    );

    // Translate nested fields (certifications, education, etc.)
    const config = TRANSLATION_CONFIG.collections[collection];
    if (config?.nestedTranslatableFields) {
      for (const [nestedKey, nestedFields] of Object.entries(
        config.nestedTranslatableFields
      )) {
        if (Array.isArray(preserved[nestedKey])) {
          preserved[nestedKey] = await translateNestedItems(
            preserved[nestedKey],
            nestedFields,
            targetLang
          );
        }
      }
    }

    // Merge fields and fix dates
    let mergedData = mergeFields(translatedFields, preserved, targetLang);
    mergedData = fixDateFields(mergedData);

    // Translate body
    const translatedBody = await translateBody(parsed.content, targetLang);

    // Generate new markdown
    const newContent = matter.stringify(translatedBody, mergedData);

    // Save to target directory
    const sourceDir = path.dirname(filePath);
    const targetDir = sourceDir.replace(
      `/${TRANSLATION_CONFIG.sourceLang}`,
      `/${targetLang}`
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
        TRANSLATION_CONFIG.sourceLang
      );
      if (!fs.existsSync(sourceDir)) {
        console.log(
          `  ⚠ ${collection}: No ${TRANSLATION_CONFIG.sourceLang} folder found`
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

/**
 * Translate UI strings (one-shot)
 */
async function translateUIStrings() {
  console.log("🌐 Translating UI strings...\n");

  const KO_PATH = "src/i18n/ko.json";
  const EN_PATH = "src/i18n/en.json";

  const ko = JSON.parse(fs.readFileSync(KO_PATH, "utf-8"));

  let existingEn = {};
  try {
    existingEn = JSON.parse(fs.readFileSync(EN_PATH, "utf-8"));
  } catch {
    console.log("No existing en.json, creating new one");
  }

  // Only translate newly added keys
  const newKeys = Object.keys(ko).filter((key) => !existingEn[key]);

  if (newKeys.length === 0) {
    console.log("  ✓ All UI strings are up to date");
    return;
  }

  console.log(`  Found ${newKeys.length} new strings to translate`);

  const toTranslate = {};
  newKeys.forEach((key) => {
    toTranslate[key] = ko[key];
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TRANSLATION_STYLE },
        {
          role: "user",
          content: `Translate the following Korean UI strings to English. Return a JSON object with the same keys but translated values:\n\n${JSON.stringify(toTranslate, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const translated = JSON.parse(response.choices[0].message.content);

    // Merge with existing translations
    const updated = { ...existingEn, ...translated };

    // Remove keys that no longer exist
    for (const key of Object.keys(updated)) {
      if (!(key in ko)) {
        delete updated[key];
        console.log(`  🗑 ${key}: Removed (no longer in ko.json)`);
      }
    }

    fs.writeFileSync(EN_PATH, JSON.stringify(updated, null, 2) + "\n");
    console.log(
      `\n✅ UI translation complete! ${newKeys.length} strings translated`
    );
  } catch (error) {
    console.error(`  ✗ UI translation failed: ${error.message}`);
  }
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
