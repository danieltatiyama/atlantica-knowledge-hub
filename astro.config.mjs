
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import { satteri } from "@astrojs/markdown-satteri";
import articleImages from "./src/plugins/article-images.mjs";

export default defineConfig({
  site: "https://atlantica-knowledge-hub.aocodex.workers.dev",

  integrations: [
    sitemap(),
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en", "pt-br"],

    routing: {
      prefixDefaultLocale: false,
    },
  },

  markdown: {
    processor: satteri({
      hastPlugins: [articleImages],
    }),
  },
});
