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
    imageService: "cloudflare",
  }),
  image: {
    domains: ["static.mandacode.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.mandacode.com",
      },
    ],
  },
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
    react(),
  ],
});
