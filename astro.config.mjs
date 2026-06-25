import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "./src/integrations/mermaid";
import path from "node:path";

import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

// Per-build identifier baked into the Worker bundle. Used as the
// cache-key prefix so a new deploy instantly orphans all previous
// HTML entries in the Cache API. Without this, stale HTML from
// earlier deployments can outlive their referenced assets.
const BUILD_ID = process.env.BUILD_ID ?? Date.now().toString(36);

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || "https://dev.mandacode.com",
  base: "/",
  trailingSlash: "ignore",
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  vite: {
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    ssr: {
      noExternal: ["zod"],
    },
  },
  integrations: [
    mermaid(),
    sitemap({
      i18n: {
        defaultLocale: "ko",
        locales: {
          ko: "ko",
          en: "en",
          ja: "ja",
          zh: "zh",
        },
      },
    }),
    react(),
  ],
});
