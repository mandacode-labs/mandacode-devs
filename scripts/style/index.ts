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

const system = `You are a professional writing assistant.
Improve the writing style of ${getLanguageName(SOURCE_LANGUAGE)} markdown content to be clean, professional, and readable.

Rules:
- Improve clarity and flow without changing the meaning
- Use moderate emphasis (bold, italic) only where it genuinely helps readability
- Do not over-highlight or make the text flashy
- Preserve all markdown formatting, code blocks, URLs, frontmatter structure, and technical terms
- Keep the original tone unless it is overly casual or awkward
- Return the complete improved markdown with frontmatter and body`;

async function styleFile(file: MarkdownFile): Promise<void> {
  const cacheKey = getContentCacheKey(
    file.collection,
    file.slug,
    file.lang,
    "style",
  );
  const hash = getHash(file.raw);
  const cachedHash = getCacheHash("style", cacheKey);

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
    setCacheHash("style", cacheKey, hash);
  }
}

export async function style(): Promise<void> {
  console.log("✨ Improving writing style...\n");

  const files = getSourceContentFiles();

  for (const file of files) {
    try {
      await styleFile(file);
    } catch (error) {
      console.error(`  ✗ ${file.filePath}: ${(error as Error).message}`);
    }
  }

  console.log("\n✅ Style improvement complete!");
}

style().catch((error) => {
  console.error("Style improvement failed:", error);
  process.exit(1);
});
