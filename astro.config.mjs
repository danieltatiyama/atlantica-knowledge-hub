
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
});
