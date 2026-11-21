
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { SUBCATEGORY_IDS } from "./data/guide-taxonomy";
import { GUIDE_SUBCATEGORIES } from "./data/guide-taxonomy";

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

    subcategory: z.preprocess(
      (value) => value === "" ? undefined : value,
      z.enum(SUBCATEGORY_IDS).optional()
    ),

    updatedAt: z.coerce.date(),

    draft: z.boolean().default(true),
  }).superRefine((data, ctx) => {
    if (
      data.subcategory &&
      GUIDE_SUBCATEGORIES[data.subcategory].category !==
        data.category
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message:
          `Subcategory "${data.subcategory}" does not belong ` +
          `to category "${data.category}".`,
      });
    }
  }),
});

export const collections = {
  guides,
};
