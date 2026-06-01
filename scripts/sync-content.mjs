import fs from "node:fs";
import path from "node:path";

const CONFIG_PATH = "src/config/translate-content.json";
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

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

function syncContent() {
  console.log("Starting content sync...\n");

  const cache = loadCache();
  const contentDir = path.resolve(config.contentDir);
  let deletedCount = 0;
  let cacheCleanedCount = 0;

  for (const targetLang of config.targetLangs) {
    console.log(`Syncing ${targetLang}...`);

    const collections = fs.readdirSync(contentDir);
    for (const collection of collections) {
      const collectionPath = path.join(contentDir, collection);
      if (!fs.statSync(collectionPath).isDirectory()) continue;

      const sourceDir = path.join(collectionPath, config.sourceLang);
      const targetDir = path.join(collectionPath, targetLang);

      if (!fs.existsSync(sourceDir)) {
        console.log(`  ⚠ ${collection}: No ${config.sourceLang} folder found`);
        continue;
      }

      if (!fs.existsSync(targetDir)) {
        console.log(`  ⚠ ${collection}: No ${targetLang} folder found`);
        continue;
      }

      const sourceFiles = new Set(
        fs.readdirSync(sourceDir).filter((f) => f.endsWith(".md")),
      );
      const targetFiles = fs
        .readdirSync(targetDir)
        .filter((f) => f.endsWith(".md"));

      for (const file of targetFiles) {
        if (!sourceFiles.has(file)) {
          const filePath = path.join(targetDir, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`  🗑️ ${file}: Removed from ${targetLang}`);
            deletedCount++;

            // Clean cache entries for this file
            const sourceFilePath = path.join(sourceDir, file);
            const cacheKey = `${sourceFilePath}:${targetLang}`;
            if (cache[cacheKey]) {
              delete cache[cacheKey];
              cacheCleanedCount++;
            }
          } catch (error) {
            console.error(`  ✗ ${file}: Failed to delete - ${error.message}`);
          }
        }
      }

      // Clean up empty target directories
      if (
        fs.existsSync(targetDir) &&
        fs.readdirSync(targetDir).length === 0
      ) {
        try {
          fs.rmdirSync(targetDir);
          console.log(`  📂 Removed empty directory: ${targetDir}`);
        } catch {
          // Ignore errors for directory removal
        }
      }
    }
  }

  saveCache(cache);

  if (deletedCount === 0) {
    console.log("\n✅ Content is already in sync!");
  } else {
    console.log(
      `\n✅ Sync complete! ${deletedCount} file(s) removed, ${cacheCleanedCount} cache entr(y/ies) cleaned.`,
    );
  }
}

syncContent();
