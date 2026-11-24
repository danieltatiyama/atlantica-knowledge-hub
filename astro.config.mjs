
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { LOCALE_IDS } from "./src/i18n/locales.mjs";

import { satteri } from "@astrojs/markdown-satteri";
import articleImages from "./src/plugins/article-images.mjs";
import articleVideos from "./src/plugins/article-videos.mjs";
import articleCaptions from "./src/plugins/article-captions.mjs";

export default defineConfig({
  site: "https://atlantica-knowledge-hub.aocodex.workers.dev",

  integrations: [
    sitemap(),
  ],

  i18n: {
    defaultLocale: "en",
    locales: [...LOCALE_IDS],

    routing: {
      prefixDefaultLocale: false,
    },
  },

  markdown: {
    processor: satteri({
      hastPlugins: [
        articleImages,
        articleVideos,
        articleCaptions,
      ],
    }),
  },
});
