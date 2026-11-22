
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


/**
 * Box probabilities require separate provenance and region.
 * A raw client integer or a text-translation ID is NEVER a drop chance.
 */
const boxes = defineCollection({
  loader: glob({ pattern: "{en,pt-br}/*.md", base: "./src/content/boxes" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    translationKey: z.string().regex(/^[a-z0-9-]+$/),
    lang: z.enum(["en", "pt-br"]),
    updatedAt: z.coerce.date(),
    draft: z.boolean().default(true),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).default("draft"),
    evidenceStatus: z.enum(["client-config", "in-game-verified", "official-announced"])
      .default("client-config"),
    verificationUrl: z.string().url().optional(),
    verificationNote: z.string().optional(),
    itemUniqueId: z.string().regex(/^\d+$/).optional(),
    itemNameTextId: z.string().regex(/^\d+$/).optional(),
    region: z.enum(["global", "kr", "jp", "other", "unknown"]).default("unknown"),
    boxType: z.enum(["random", "selection", "fixed", "unknown"]).default("unknown"),
    contentsEvidence: z.enum(["unknown", "server-preview-captured", "family-candidates", "official-published"]).default("unknown"),
    contentsNote: z.string().optional(),
    oddsStatus: z.enum(["unknown", "client-weights-unverified", "regional-published"])
      .default("unknown"),
    rollModel: z.enum(["single-outcome", "multiple-independent", "unknown"])
      .default("unknown"),
    probabilitySourceUrl: z.string().url().optional(),
    probabilityNotes: z.string().optional(),
    outcomes: z.array(z.object({
      itemName: z.string().min(1),
      itemUniqueId: z.string().regex(/^\d+$/).optional(),
      quantity: z.number().int().positive(),
      chancePercent: z.number().min(0).max(100).optional(),
      chanceNotes: z.string().optional(),
      observedCount: z.number().int().min(0).optional(),
      quantityVerified: z.boolean().default(true),
    })).default([]),
  }).superRefine((data, ctx) => {
    const withChances = data.outcomes.filter((row) => row.chancePercent !== undefined);
    if (withChances.length > 0 &&
        (data.oddsStatus !== "regional-published" || !data.probabilitySourceUrl)) {
      ctx.addIssue({
        code: "custom", path: ["outcomes"],
        message: "Percentages require published regional probabilities and a source URL.",
      });
    }
    if (data.oddsStatus === "regional-published" && !data.probabilitySourceUrl) {
      ctx.addIssue({
        code: "custom", path: ["probabilitySourceUrl"],
        message: "Published regional odds require a documented source URL.",
      });
    }
    if (data.region === "unknown" && data.oddsStatus === "regional-published") {
      ctx.addIssue({
        code: "custom", path: ["region"],
        message: "Published probability data must identify a region.",
      });
    }
    // Full one-outcome tables should sum to 100%, but partial tables are valid
    // only when explicitly marked as incomplete in the probability notes.
    if (data.rollModel === "single-outcome" &&
        withChances.length === data.outcomes.length && withChances.length > 0 &&
        !data.probabilityNotes?.toLowerCase().includes("incomplete")) {
      const sum = withChances.reduce((acc, row) => acc + (row.chancePercent ?? 0), 0);
      if (Math.abs(sum - 100) > 0.02) {
        ctx.addIssue({
          code: "custom", path: ["outcomes"],
          message: "Single-outcome probabilities must sum to 100% or be explicitly marked incomplete.",
        });
      }
    }
    if (!data.draft) {
      if (data.contentsEvidence === "family-candidates" && data.outcomes.length > 0) {
        ctx.addIssue({ code: "custom", path: ["contentsEvidence"],
          message: "Inferred family candidates cannot be presented as published reward pools." });
      }
      if (data.reviewStatus !== "approved") {
        ctx.addIssue({ code: "custom", path: ["reviewStatus"],
          message: "Published boxes require editorial approval." });
      }
      if (data.evidenceStatus === "client-config") {
        ctx.addIssue({ code: "custom", path: ["evidenceStatus"],
          message: "Client-only box data cannot be published." });
      }
      if (data.evidenceStatus === "official-announced" && !data.verificationUrl) {
        ctx.addIssue({ code: "custom", path: ["verificationUrl"],
          message: "Officially announced entries require an independently verified source." });
      }
      if (data.evidenceStatus === "in-game-verified" && !data.verificationNote?.trim()) {
        ctx.addIssue({ code: "custom", path: ["verificationNote"],
          message: "In-game verified entries require a review note." });
      }
    }
  }),
});

export const collections = {
  guides,
  events,
  mercenaries,
  boxes,
};
