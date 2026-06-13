import fs from "node:fs";
import { chat } from "../lib/openai.js";
import { SOURCE_LANGUAGE, getLanguageName } from "../lib/config.js";
import {
  getSourceContentFiles,
  getHash,
  type MarkdownFile,
} from "../lib/markdown.js";
import {
  getCacheHash,
  setCacheHash,
  getContentCacheKey,
} from "../lib/cache.js";
import { applyOrSkip } from "../lib/diff.js";

const system = `You are a professional proofreader.
Correct typos, grammar, and spelling errors in ${getLanguageName(SOURCE_LANGUAGE)} markdown content.

Rules:
- Fix only actual errors. Do not rephrase or change style unless the original is grammatically wrong
- Preserve all markdown formatting, code blocks, URLs, frontmatter structure, and technical terms
- Do not change the meaning of the content
- Return the complete corrected markdown with frontmatter and body`;

async function proofreadFile(file: MarkdownFile): Promise<void> {
  const cacheKey = getContentCacheKey(
    file.collection,
    file.slug,
    file.lang,
    "proofread",
  );
  const hash = getHash(file.raw);
  const cachedHash = getCacheHash("proofread", cacheKey);

  if (cachedHash === hash) {
    console.log(`  ✓ ${file.filePath}: Up to date`);
    return;
  }

  const user = file.raw;
  const after = await chat({ system, user, model: "gpt-4o" });

  const applied = await applyOrSkip(file.filePath, file.raw, after, () => {
    fs.writeFileSync(file.filePath, after);
  });

  if (applied) {
    setCacheHash("proofread", cacheKey, hash);
  }
}

export async function proofread(): Promise<void> {
  console.log("📝 Proofreading source language content...\n");

  const files = getSourceContentFiles();

  for (const file of files) {
    try {
      await proofreadFile(file);
    } catch (error) {
      console.error(`  ✗ ${file.filePath}: ${(error as Error).message}`);
    }
  }

  console.log("\n✅ Proofreading complete!");
}

proofread().catch((error) => {
  console.error("Proofreading failed:", error);
  process.exit(1);
});
