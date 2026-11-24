import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const templates = {
  "nation-dungeon": {
    file: "NATION-DUNGEON.md",
    category: "nation-dungeons",
  },
  mercenaries: {
    file: "MERCENARIES.md",
    category: "mercenaries",
  },
  "game-systems": {
    file: "GAME-SYSTEMS.md",
    category: "game-systems",
  },
};

const subcategoryParents = {
  avalon: "nation-dungeons",
  babel: "nation-dungeons",
  yggdrasil: "nation-dungeons",
  alcatraz: "nation-dungeons",
  pirate: "nation-dungeons",
  introduction: "mercenaries",
  skills: "mercenaries",
  "builds-formations": "mercenaries",
  crafting: "game-systems",
  "equipment-enhancement": "game-systems",
  others: "game-systems",
};

try {
  const args = process.argv.slice(2);

  if (args.length % 2 !== 0) {
    throw new Error("Arguments must use --name value pairs.");
  }

  const input = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (!key.startsWith("--")) {
      throw new Error(`Invalid argument: ${key}`);
    }

    input[key.slice(2)] = value;
  }

  const lang = input.lang;
  const templateName = input.template;
  const title = input.title?.trim();
  const description = input.description?.trim();
  const translationKey = input["translation-key"];
  const subcategory = input.subcategory?.trim();
  const mode = input.mode ?? "dry-run";

  if (!["dry-run", "write"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  if (!["en", "pt-br"].includes(lang)) {
    throw new Error(
        `Unsupported language: ${lang}`
    );
    }

  const template = templates[templateName];

  if (!template) {
    throw new Error("Unknown guide template.");
  }

  if (!title || !description) {
    throw new Error("Title and description are required.");
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      translationKey ?? ""
    )
  ) {
    throw new Error("Invalid article identifier.");
  }

  if (
    subcategory &&
    subcategoryParents[subcategory] !== template.category
  ) {
    throw new Error(
      "Subcategory does not match the selected template."
    );
  }

  const outputPath = resolve(
    "src",
    "content",
    "guides",
    lang,
    `${translationKey}.md`
  );

  if (existsSync(outputPath)) {
    throw new Error(
      `Article already exists: ${outputPath}`
    );
  }

  const templateFile =
    lang === "pt-br"
        ? template.file.replace(/\.md$/, ".pt-br.md")
        : template.file;

  const templatePath = resolve(
    "docs",
    "templates",
    templateFile
  );

  const templateContent = readFileSync(
    templatePath,
    "utf8"
  );

  // Remove template title and editorial instructions.
  const bodyStart = templateContent.search(/^##\s+/m);

  if (bodyStart < 0) {
    throw new Error(
      "Template does not contain article sections."
    );
  }

  const body = templateContent.slice(bodyStart).trim();
  const updatedAt = new Date().toISOString().slice(0, 10);

  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `translationKey: ${JSON.stringify(translationKey)}`,
    `lang: ${JSON.stringify(lang)}`,
    `category: ${JSON.stringify(template.category)}`,
  ];

  if (subcategory) {
    frontmatter.push(
      `subcategory: ${JSON.stringify(subcategory)}`
    );
  }

  frontmatter.push(
    `updatedAt: ${JSON.stringify(updatedAt)}`,
    "draft: true",
    "---"
  );

  const markdown = [
    ...frontmatter,
    "",
    body,
    "",
  ].join("\n");

  console.log("[IC] Mode:", mode.toUpperCase());
  console.log("[IC] Target:", outputPath);
  console.log("[IC] Template:", templateName);

  if (mode === "write") {
    // Only the development branch may create files.
    const branch = execFileSync(
      "git",
      ["branch", "--show-current"],
      { encoding: "utf8" }
    ).trim();

    if (branch !== "dev/i18n") {
      throw new Error(
        `WRITE is only allowed on dev/i18n. Current: ${branch || "detached"}`
      );
    }

    // Additional protection inside GitHub Actions.
    if (
      process.env.GITHUB_ACTIONS === "true" &&
      process.env.GITHUB_REF !== "refs/heads/dev/i18n"
    ) {
      throw new Error(
        "WRITE is blocked outside the dev/i18n workflow ref."
      );
    }

    // Atomic creation: never overwrite existing files.
    writeFileSync(outputPath, markdown, {
      encoding: "utf8",
      flag: "wx",
    });

    console.log("[IC] Draft created successfully.");
    console.log("[IC] No Git commit or push performed.");
  } else {
    console.log("[IC] No files written.");
    console.log(
      "\n========== MARKDOWN PREVIEW ==========\n"
    );
    console.log(markdown);
  }
} catch (error) {
  console.error("[IC] ERROR:", error.message);
  process.exitCode = 1;
}
