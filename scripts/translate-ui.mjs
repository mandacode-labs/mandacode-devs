import fs from "node:fs";
import * as deepl from "deepl-node";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error("DEEPL_API_KEY environment variable is required");
  process.exit(1);
}

const translator = new deepl.Translator(DEEPL_API_KEY);

const KO_PATH = "src/i18n/ko.json";
const EN_PATH = "src/i18n/en.json";

async function main() {
  console.log("🌐 Translating UI strings...\n");

  const ko = JSON.parse(fs.readFileSync(KO_PATH, "utf-8"));

  let en = {};
  try {
    en = JSON.parse(fs.readFileSync(EN_PATH, "utf-8"));
    console.log(`Loaded existing ${EN_PATH}`);
  } catch {
    console.log(`No existing ${EN_PATH}, creating new one`);
  }

  const updated = { ...en };
  let translated = 0;
  let kept = 0;

  for (const [key, koValue] of Object.entries(ko)) {
    if (updated[key]) {
      console.log(`  ✓ ${key}: Kept existing translation`);
      kept++;
      continue;
    }

    try {
      const result = await translator.translateText(koValue, "KO", "EN-US");
      const translatedText = Array.isArray(result)
        ? result[0].text
        : result.text;
      updated[key] = translatedText;
      console.log(`  ✓ ${key}: ${koValue} → ${translatedText}`);
      translated++;
    } catch (error) {
      console.error(`  ✗ ${key}: Translation failed - ${error.message}`);
      updated[key] = koValue;
    }
  }

  // Remove keys that no longer exist in ko.json
  for (const key of Object.keys(updated)) {
    if (!(key in ko)) {
      delete updated[key];
      console.log(`  🗑 ${key}: Removed (no longer in ko.json)`);
    }
  }

  fs.writeFileSync(EN_PATH, JSON.stringify(updated, null, 2) + "\n");

  console.log(`\n✅ UI translation complete!`);
  console.log(
    `   ${translated} translated, ${kept} kept, ${Object.keys(updated).length} total`,
  );
}

main().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
