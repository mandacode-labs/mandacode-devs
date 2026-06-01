import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import * as deepl from "deepl-node";

const CONFIG_PATH = "src/config/translate-content.json";
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error("DEEPL_API_KEY environment variable is required");
  process.exit(1);
}

const translator = new deepl.Translator(DEEPL_API_KEY);

function getHash(content) {
  return crypto.createHash("md5").update(content).digest("hex");
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(config.cacheFile, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(config.cacheFile, JSON.stringify(cache, null, 2));
}

function extractCodeBlocks(text) {
  const blocks = [];
  let index = 0;
  const placeholder = (i) => `\n___CODE_BLOCK_${i}___\n`;

  const result = text.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match);
    return placeholder(index++);
  });

  return { text: result, blocks, placeholder };
}

function restoreCodeBlocks(text, blocks) {
  let i = 0;
  return text.replace(/\n___CODE_BLOCK_\d+___\n/g, () => blocks[i++]);
}

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;

  const { text: cleanText, blocks } = extractCodeBlocks(text);

  try {
    const result = await translator.translateText(
      cleanText,
      config.deepl.sourceLang,
      targetLang === "en" ? "EN-US" : targetLang,
    );

    const translated = Array.isArray(result) ? result[0].text : result.text;
    return restoreCodeBlocks(translated, blocks);
  } catch (error) {
    console.warn(`Translation failed: ${error.message}`);
    return text;
  }
}

async function translateFrontmatter(data, fields, nestedFields, targetLang) {
  const translated = { ...data };

  // Translate top-level fields
  for (const field of fields) {
    if (data[field] && typeof data[field] === "string") {
      translated[field] = await translateText(data[field], targetLang);
    }
  }

  // Translate nested fields (arrays of objects)
  for (const [nestedKey, nestedFieldList] of Object.entries(
    nestedFields || {},
  )) {
    if (!Array.isArray(data[nestedKey])) continue;

    translated[nestedKey] = await Promise.all(
      data[nestedKey].map(async (item) => {
        const translatedItem = { ...item };
        for (const field of nestedFieldList) {
          if (item[field] && typeof item[field] === "string") {
            translatedItem[field] = await translateText(
              item[field],
              targetLang,
            );
          }
        }
        return translatedItem;
      }),
    );
  }

  return translated;
}

function getTranslatableFields(collection) {
  const collectionConfig = config.collections[collection] || {};
  return {
    fields: collectionConfig.fields || [],
    nestedFields: collectionConfig.nestedFields || {},
  };
}

async function translateFile(filePath, targetLang, cache) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const hash = getHash(content);
  const cacheKey = `${filePath}:${targetLang}`;

  if (cache[cacheKey] === hash) {
    console.log(`  ✓ ${fileName}: Up to date`);
    return;
  }

  let parsed;
  try {
    parsed = matter(content);
  } catch (error) {
    console.error(
      `  ✗ ${fileName}: Failed to parse frontmatter - ${error.message}`,
    );
    return;
  }

  const collection = path.basename(path.dirname(path.dirname(filePath)));
  const { fields, nestedFields } = getTranslatableFields(collection);

  const translatedData = await translateFrontmatter(
    parsed.data,
    fields,
    nestedFields,
    targetLang,
  );
  translatedData.lang = targetLang;

  let translatedBody = "";
  if (parsed.content && parsed.content.trim()) {
    translatedBody = await translateText(parsed.content, targetLang);
  }

  const newContent = matter.stringify(translatedBody, translatedData);

  const sourceDir = path.dirname(filePath);
  const targetDir = sourceDir.replace(
    `/${config.sourceLang}`,
    `/${targetLang}`,
  );

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, fileName);

  try {
    fs.writeFileSync(targetPath, newContent);
    cache[cacheKey] = hash;
    console.log(`  ✓ ${fileName}: Translated to ${targetLang}`);
  } catch (error) {
    console.error(`  ✗ ${fileName}: Failed to write file - ${error.message}`);
  }
}

async function translateContent() {
  console.log("Starting content translation...\n");

  const cache = loadCache();
  const contentDir = path.resolve(config.contentDir);

  for (const targetLang of config.targetLangs) {
    console.log(`Translating to ${targetLang}...`);

    const collections = fs.readdirSync(contentDir);
    for (const collection of collections) {
      const collectionPath = path.join(contentDir, collection);
      if (!fs.statSync(collectionPath).isDirectory()) continue;

      const sourceDir = path.join(collectionPath, config.sourceLang);
      if (!fs.existsSync(sourceDir)) {
        console.log(`  ⚠ ${collection}: No ${config.sourceLang} folder found`);
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

translateContent().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
