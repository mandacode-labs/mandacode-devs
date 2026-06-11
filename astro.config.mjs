// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "./src/integrations/mermaid";
import path from "node:path";

import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://dev.mandacode.com",
  base: "/",
  trailingSlash: "ignore",
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
  integrations: [
    mermaid({
      theme: "default",
    }),
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
  ],
});
