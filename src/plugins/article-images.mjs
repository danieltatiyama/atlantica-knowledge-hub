
const validSizes = new Set([
  "small",
  "medium",
  "large",
  "full",
]);

const validAlignments = new Set([
  "left",
  "center",
  "right",
]);

export default {
  name: "article-image-options",

  element: {
    filter: ["img"],

    visit(node, ctx) {
      const alt = node.properties?.alt;

      if (typeof alt !== "string" || !alt.includes("|")) {
        return;
      }

      const parts = alt.split("|").map((part) => part.trim());
      const description = parts.shift();

      if (!description || parts.length === 0) {
        return;
      }

      let size;
      let align;

      for (const part of parts) {
        const match = /^(size|align)\s*=\s*([a-z]+)$/i.exec(part);

        if (!match) {
          return;
        }

        const key = match[1].toLowerCase();
        const value = match[2].toLowerCase();

        if (key === "size") {
          if (!validSizes.has(value) || size) return;
          size = value;
        } else {
          if (!validAlignments.has(value) || align) return;
          align = value;
        }
      }

      const existing = node.properties.className;

      const classes = Array.isArray(existing)
        ? [...existing]
        : typeof existing === "string"
          ? existing.split(/\s+/)
          : [];

      classes.push("article-image");

      if (size) {
        classes.push(`article-image--${size}`);
      }

      if (align) {
        classes.push(`article-image--${align}`);
      }

      ctx.setProperty(node, "alt", description);
      ctx.setProperty(node, "className", classes);
    },
  },
};
