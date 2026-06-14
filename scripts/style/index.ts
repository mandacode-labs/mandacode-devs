import fs from "node:fs";
import { chat } from "../lib/openai.js";
import { SOURCE_LANGUAGE, getLanguageName } from "../lib/config.js";
import { getSourceContentFiles, getHash } from "../lib/markdown.js";
import {
  getCacheHash,
  setCacheHash,
  getContentCacheKey,
} from "../lib/cache.js";
import { interactivePatch } from "../lib/diff.js";

const system = `You are a professional writing assistant.
Fix typos, grammar, spelling errors, and incorrect line breaks in ${getLanguageName(SOURCE_LANGUAGE)} markdown content,
and improve the writing style to be clean, professional, and readable — all while preserving the author's original writing tone and voice.

Rules:
- Fix typos, grammar, spelling errors, and incorrect/awkward line breaks
- Improve clarity and flow without changing the meaning
- Preserve the author's original writing tone and voice (어투) — do not change the character or personality of the writing
- Use moderate emphasis (bold, italic) only where it genuinely helps readability
- Do not over-highlight or make the text flashy
- Preserve all markdown formatting, code blocks, URLs, frontmatter structure, and technical terms
- Return the complete corrected and improved markdown with frontmatter and body`;

async function style(): Promise<void> {
  console.log("✨ Proofreading and improving writing style...\n");

  const files = getSourceContentFiles();

  for (const file of files) {
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
      continue;
    }

    try {
      const after = await chat({ system, user: file.raw, model: "gpt-4o" });

      const result = await interactivePatch(file.filePath, file.raw, after);

      if (result === null) {
        console.log(`  ✗ ${file.filePath}: Skipped`);
        continue;
      }

      fs.writeFileSync(file.filePath, result);
      setCacheHash("style", cacheKey, hash);
      console.log(`  ✓ ${file.filePath}: Applied`);
    } catch (error) {
      console.error(`  ✗ ${file.filePath}: ${(error as Error).message}`);
    }
  }

  console.log("\n✅ Proofreading and style improvement complete!");
}

style().catch((error) => {
  console.error("Proofreading / style improvement failed:", error);
  process.exit(1);
});
