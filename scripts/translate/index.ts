import { translateUI } from "./ui.js";
import { translateContent } from "./content.js";

const mode = process.argv[2] || "all";

async function main() {
  if (mode === "all" || mode === "ui") {
    await translateUI();
  }

  if (mode === "all" || mode === "content") {
    await translateContent();
  }
}

main().catch((error) => {
  console.error("Translation failed:", error);
  process.exit(1);
});
