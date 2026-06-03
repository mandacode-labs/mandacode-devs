import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import OpenAI from "openai";
import { z } from "zod";

const CONFIG_PATH = "src/config/translate-content.json";
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Translation style configuration
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

/**
 * Translate markdown content using OpenAI
 * Processes frontmatter and body together
 */
async function translateMarkdown(content, sourceLang, targetLang) {
  const parsed = matter(content);
  
  // Prepare content for translation
  const frontmatterStr = JSON.stringify(parsed.data, null, 2);
  const bodyStr = parsed.content;
  
  const prompt = `Translate the following Korean markdown content to English.

Original frontmatter:
${frontmatterStr}

Original body:
${bodyStr}

Return a JSON object with this exact structure:
{
  "frontmatter": { /* translated frontmatter object */ },
  "body": "/* translated markdown body */"
}

Important:
- Translate title, description, and body content
- Keep URLs, paths, technical terms unchanged
- PRESERVE these frontmatter fields exactly as-is: pubDate, updatedDate, lang, coverImage, ogImage, sourceUrl, url, blogUrl, status, order, techStack, tags (and array values)
- Preserve all markdown formatting
- Do not translate code blocks or content in backticks`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: TRANSLATION_STYLE },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Validate required fields
    if (!result.frontmatter || !result.body) {
      throw new Error("Invalid response structure");
    }

    return result;
  } catch (error) {
    console.warn(`Translation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Translate UI JSON file (process all at once)
 */
async function translateUI(koJson) {
  const prompt = `Translate the following Korean UI strings to English.

Input JSON:
${JSON.stringify(koJson, null, 2)}

Return a JSON object with the same keys but translated values.
Rules:
- Keep technical terms natural in English
- Maintain consistency with common UI patterns
- Do not translate keys, only values
- Return valid JSON only`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Smaller model is sufficient for UI strings
      messages: [
        { role: "system", content: TRANSLATION_STYLE },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error(`UI translation failed: ${error.message}`);
    throw error;
  }
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

  try {
    const result = await translateMarkdown(content, config.sourceLang, targetLang);
    
    // Determine lang from file path (deterministic behavior)
    const sourceDir = path.dirname(filePath);
    const targetDir = sourceDir.replace(
      `/${config.sourceLang}`,
      `/${targetLang}`,
    );
    const pathLang = path.basename(targetDir);
    result.frontmatter.lang = pathLang;
    
    // Generate new markdown
    const newContent = matter.stringify(result.body, result.frontmatter);

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

async function translateContent() {
  console.log("🌐 Starting content translation with OpenAI...\n");

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
  const newKeys = Object.keys(ko).filter(key => !existingEn[key]);
  
  if (newKeys.length === 0) {
    console.log("  ✓ All UI strings are up to date");
    return;
  }

  console.log(`  Found ${newKeys.length} new strings to translate`);
  
  const toTranslate = {};
  newKeys.forEach(key => {
    toTranslate[key] = ko[key];
  });

  try {
    const translated = await translateUI(toTranslate);
    
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
    console.log(`\n✅ UI translation complete! ${newKeys.length} strings translated`);
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
