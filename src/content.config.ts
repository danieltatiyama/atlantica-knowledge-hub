
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const guides = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/guides",
  }),

  schema: z.object({
    title: z.string(),
    description: z.string(),

    translationKey: z.string(),

    lang: z.enum([
      "en",
      "pt-br",
      "fr",
      "ja",
    ]),

    category: z.enum([
      "nation-dungeons",
      "mercenaries",
      "game-systems",
    ]),

    updatedAt: z.coerce.date(),

    draft: z.boolean().default(false),
  }),
});

export const collections = {
  guides,
};
