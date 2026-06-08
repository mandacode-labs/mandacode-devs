// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mermaid from "astro-mermaid";
import path from "node:path";

import cloudflare from "@astrojs/cloudflare";

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
  ],
});
