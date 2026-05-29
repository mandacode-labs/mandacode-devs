import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import * as deepl from "deepl-node";

const CONFIG_PATH = "src/config/translate.json";
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
      targetLang === "en" ? "en-US" : targetLang,
    );

    const translated = Array.isArray(result) ? result[0].text : result.text;
    return restoreCodeBlocks(translated, blocks);
  } catch (error) {
    console.warn(`Translation failed: ${error.message}`);
    return text;
  }
}

async function translateFrontmatter(data, fields, targetLang) {
  const translated = { ...data };
  for (const field of fields) {
    if (data[field] && typeof data[field] === "string") {
      translated[field] = await translateText(data[field], targetLang);
    }
  }
  return translated;
}

function getTranslatableFields(collection) {
  const fields = {
    blog: ["title", "description"],
    projects: ["title", "description"],
    developers: ["name", "role", "bio"],
  };
  return fields[collection] || [];
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
  const fields = getTranslatableFields(collection);

  const translatedData = await translateFrontmatter(
    parsed.data,
    fields,
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
  console.log("🌐 Starting content translation...\n");

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

async function translateUI() {
  console.log("\n🌐 Translating UI text...\n");

  const uiContent = fs.readFileSync(config.uiFile, "utf-8");

  const koMatch = uiContent.match(/ko:\s*\{([\s\S]*?)\n  \},/);
  if (!koMatch) {
    console.warn("Could not find Korean UI strings");
    return;
  }

  const koBlock = koMatch[1];
  const lines = koBlock
    .split("\n")
    .filter((l) => l.includes('"') && l.includes(":"));

  const koStrings = {};
  for (const line of lines) {
    const match = line.match(/"([^"]+)":\s*"([^"]+)"/);
    if (match) {
      const [, key, value] = match;
      koStrings[key] = value;
    }
  }

  const targetStrings = {};
  for (const [key, value] of Object.entries(koStrings)) {
    if (value.match(/[가-힣]/)) {
      targetStrings[key] = await translateText(value, "en");
    } else {
      targetStrings[key] = value;
    }
  }

  let newUI = uiContent;
  for (const targetLang of config.targetLangs) {
    const langBlock = Object.entries(targetStrings)
      .map(([key, value]) => `    "${key}": "${value}",`)
      .join("\n");

    const existingLang = new RegExp(
      `\\n  ${targetLang}:\\s*\\{[\\s\\S]*?\\n  \\},`,
    );
    if (existingLang.test(newUI)) {
      newUI = newUI.replace(
        existingLang,
        `\n  ${targetLang}: {\n${langBlock}\n  },`,
      );
    } else {
      const koBlockMatch = newUI.match(/(ko:\s*\{[\s\S]*?\n  \},)/);
      if (koBlockMatch) {
        newUI = newUI.replace(
          koBlockMatch[1],
          `${koBlockMatch[1]}\n  ${targetLang}: {\n${langBlock}\n  },`,
        );
      }
    }
  }

  fs.writeFileSync(config.uiFile, newUI);
  console.log("✅ UI translation complete!");
}

async function main() {
  await translateContent();
  await translateUI();
}

main().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
