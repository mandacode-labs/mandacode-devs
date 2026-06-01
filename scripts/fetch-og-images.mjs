/**
 * OG Image Caching Script
 * Fetches Open Graph images from project URLs before build.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PROJECTS_DIR = path.join(process.cwd(), "src/content/projects");
const OG_CACHE_DIR = path.join(process.cwd(), "public/og-cache");
const FALLBACK_IMAGE = "/og-cache/fallback.jpg";

async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MandacodeBot/1.0)",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const ogImageMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    );

    if (ogImageMatch) {
      return ogImageMatch[1];
    }

    // Also check reversed property/content order
    const ogImageMatch2 = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    );

    return ogImageMatch2 ? ogImageMatch2[1] : null;
  } catch (error) {
    console.warn(`Failed to fetch OG image from ${url}:`, error.message);
    return null;
  }
}

async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MandacodeBot/1.0)",
      },
    });
    if (!response.ok) return false;

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.warn(`Failed to download image from ${url}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🔍 Fetching OG images...");

  if (!fs.existsSync(OG_CACHE_DIR)) {
    fs.mkdirSync(OG_CACHE_DIR, { recursive: true });
  }

  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(PROJECTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = matter(content);
    const slug = file.replace(".md", "");

    // Skip if custom cover image exists
    if (parsed.data.coverImage) {
      console.log(`  ✓ ${slug}: Using custom cover image`);
      continue;
    }

    // Skip if ogImage already points to a valid path
    if (
      parsed.data.ogImage &&
      parsed.data.ogImage !== FALLBACK_IMAGE &&
      fs.existsSync(path.join(process.cwd(), "public", parsed.data.ogImage))
    ) {
      console.log(`  ✓ ${slug}: OG image already cached`);
      continue;
    }

    const ogUrl = await fetchOgImage(parsed.data.url);

    if (ogUrl) {
      const outputPath = path.join(OG_CACHE_DIR, `${slug}.jpg`);
      const success = await downloadImage(ogUrl, outputPath);

      if (success) {
        parsed.data.ogImage = `/og-cache/${slug}.jpg`;
        console.log(`  ✓ ${slug}: Downloaded OG image`);
      } else {
        parsed.data.ogImage = FALLBACK_IMAGE;
        console.log(`  ⚠ ${slug}: Failed to download, using fallback`);
      }
    } else {
      parsed.data.ogImage = FALLBACK_IMAGE;
      console.log(`  ⚠ ${slug}: No OG image found, using fallback`);
    }

    // Save file
    const newContent = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, newContent);
  }

  console.log("✅ OG image fetching complete!");
}

main().catch(console.error);
