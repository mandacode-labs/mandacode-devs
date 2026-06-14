import fs from "node:fs";
import { chat } from "../lib/openai.js";
import {
  COLLECTION_CONFIGS,
  SOURCE_LANGUAGE,
  TARGET_LANGUAGES,
  getLanguageName,
} from "../lib/config.js";
import {
  getSourceContentFiles,
  getTargetPath,
  getHash,
  type MarkdownFile,
} from "../lib/markdown.js";
import {
  getCacheHash,
  setCacheHash,
  getContentCacheKey,
} from "../lib/cache.js";
import { applyOrSkip } from "../lib/diff.js";

function buildTranslatePrompt(collection: string, targetLang: string): string {
  const config = COLLECTION_CONFIGS[collection];
  const translatableFields = config?.translatableFields || [];
  const nestedFields = config?.nestedTranslatableFields || {};

  let prompt = `You are a professional translator.
Translate the following markdown content from ${getLanguageName(SOURCE_LANGUAGE)} to ${getLanguageName(targetLang)}.

Rules:
- Translate only these frontmatter fields: ${translatableFields.join(", ") || "none"}`;

  if (Object.keys(nestedFields).length > 0) {
    for (const [key, fields] of Object.entries(nestedFields)) {
      prompt += `\n- Inside the "${key}" array, translate only these fields: ${fields.join(", ")}`;
    }
  }

  prompt += `
- Keep all other frontmatter fields exactly as they are
- Preserve markdown formatting, code blocks, URLs, and technical terms
- Translate the body (markdown content) naturally
- Return the complete markdown with frontmatter and body`;

  return prompt;
}

async function translateFile(
  sourceFile: MarkdownFile,
  targetLang: string,
): Promise<void> {
  const targetPath = getTargetPath(sourceFile, targetLang);
  const cacheKey = getContentCacheKey(
    sourceFile.collection,
    sourceFile.slug,
    targetLang,
    "translate",
  );

  const sourceHash = getHash(sourceFile.raw);
  const cachedHash = getCacheHash("translate", cacheKey);

  let before = "";
  try {
    before = fs.readFileSync(targetPath, "utf-8");
  } catch {
    before = "";
  }

  if (cachedHash === sourceHash && before) {
    console.log(`  ✓ ${targetPath}: Up to date`);
    return;
  }

  const system = buildTranslatePrompt(sourceFile.collection, targetLang);
  const user = sourceFile.raw;

  const response = await chat({ system, user, model: "gpt-4o" });
  const after = response;

  const applied = await applyOrSkip(targetPath, before, after, () => {
    fs.writeFileSync(targetPath, after);
  });

  if (applied) {
    setCacheHash("translate", cacheKey, sourceHash);
  }
}

export async function translateContent(): Promise<void> {
  console.log("🌐 Translating content...\n");

  const sourceFiles = getSourceContentFiles();

  for (const targetLang of TARGET_LANGUAGES) {
    if (targetLang === SOURCE_LANGUAGE) continue;

    console.log(`Translating to ${getLanguageName(targetLang)}...`);

    for (const sourceFile of sourceFiles) {
      try {
        await translateFile(sourceFile, targetLang);
      } catch (error) {
        console.error(
          `  ✗ ${sourceFile.filePath}: ${(error as Error).message}`,
        );
      }
    }
  }

  console.log("\n✅ Content translation complete!");
}
