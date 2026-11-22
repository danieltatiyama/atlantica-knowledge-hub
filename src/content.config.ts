
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
    reviewStatus: z.enum([
      "draft",
      "in-review",
      "approved",
    ]).optional(),
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

      // Published guides require editorial approval.
      if (
        data.draft === false &&
        data.reviewStatus !== "approved"
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["reviewStatus"],
          message:
            "Published guides must have reviewStatus: approved.",
        });
      }
    }),
});


/**
 * Curated editorial collections.
 *
 * Client configurations are evidence to review, never automatic publication.
 * Published entries must have editorial approval AND non-client-only validation.
 */
const editorialFields = {
  title: z.string().min(1),
  description: z.string().min(1),
  translationKey: z.string().regex(/^[a-z0-9-]+$/),
  lang: z.enum(["en", "pt-br"]),
  updatedAt: z.coerce.date(),
  draft: z.boolean().default(true),
  reviewStatus: z.enum(["draft", "in-review", "approved"]).default("draft"),
  evidenceStatus: z.enum([
    "client-config",
    "in-game-verified",
    "official-announced",
  ]).default("client-config"),
  verificationUrl: z.string().url().optional(),
  verificationNote: z.string().optional(),
};

function checkEditorialPublication(
  data: {
    draft: boolean;
    reviewStatus: "draft" | "in-review" | "approved";
    evidenceStatus: "client-config" | "in-game-verified" | "official-announced";
    verificationUrl?: string;
    verificationNote?: string;
  },
  ctx: z.RefinementCtx
) {
  if (data.draft) return;
  if (data.reviewStatus !== "approved") {
    ctx.addIssue({ code: "custom", path: ["reviewStatus"], message: "Publication requires editorial approval." });
  }
  if (data.evidenceStatus === "client-config") {
    ctx.addIssue({ code: "custom", path: ["evidenceStatus"], message: "Client-only evidence cannot be published." });
  }
  if (data.evidenceStatus === "official-announced" && !data.verificationUrl) {
    ctx.addIssue({ code: "custom", path: ["verificationUrl"], message: "Official announcements require a verifiable URL." });
  }
  if (data.evidenceStatus === "in-game-verified" && !data.verificationNote?.trim()) {
    ctx.addIssue({ code: "custom", path: ["verificationNote"], message: "In-game verification requires a review note." });
  }
}

const events = defineCollection({
  loader: glob({ pattern: "{en,pt-br}/*.md", base: "./src/content/events" }),
  schema: z.object({
    ...editorialFields,
    kind: z.enum(["event", "pass", "challenge", "promotion", "update"]),
    // Only display start/end after timezone has been independently confirmed.
    startsAt: z.string().datetime({ offset: true }).optional(),
    endsAt: z.string().datetime({ offset: true }).optional(),
  }).superRefine(checkEditorialPublication),
});

const mercenaries = defineCollection({
  loader: glob({ pattern: "{en,pt-br}/*.md", base: "./src/content/mercenaries" }),
  schema: z.object({
    ...editorialFields,
    weaponType: z.string().optional(),
    recruitment: z.string().optional(),
  }).superRefine(checkEditorialPublication),
});

export const collections = {
  guides,
  events,
  mercenaries,
};
