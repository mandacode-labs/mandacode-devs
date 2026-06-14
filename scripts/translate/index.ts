import { translateUI } from "./ui.js";
import { translateContent } from "./content.js";

async function main() {
  await translateUI();
  await translateContent();
}

main().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
