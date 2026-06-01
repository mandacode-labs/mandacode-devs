/**
 * Fallback Image Generation Script
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OG_CACHE_DIR = path.join(process.cwd(), "public/og-cache");

async function generateFallback() {
  if (!fs.existsSync(OG_CACHE_DIR)) {
    fs.mkdirSync(OG_CACHE_DIR, { recursive: true });
  }

  const width = 640;
  const height = 360;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="18" 
        font-weight="500"
        fill="#a3a3a3" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        No Preview
      </text>
      <rect 
        x="${width / 2 - 40}" 
        y="${height / 2 + 20}" 
        width="80" 
        height="2" 
        fill="#FF8400" 
        rx="1"
      />
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 80 })
    .toFile(path.join(OG_CACHE_DIR, "fallback.jpg"));

  console.log("✅ Fallback image generated");
}

generateFallback().catch(console.error);
