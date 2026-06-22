import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "./src/integrations/mermaid";
import path from "node:path";

import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

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
