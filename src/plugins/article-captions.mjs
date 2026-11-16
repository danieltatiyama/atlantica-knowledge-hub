
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
  name: "article-image-captions",

  element: {
    filter: ["p"],

    visit(node, ctx) {
      const children = node.children.filter(
        (child) =>
          child.type !== "text" || child.value.trim() !== ""
      );

      // Only process standalone Markdown images.
      if (children.length !== 1) return;

      const image = children[0];

      if (
        image.type !== "element" ||
        image.tagName !== "img"
      ) {
        return;
      }

      const alt = image.properties?.alt;

      if (typeof alt !== "string" || !alt.includes("|")) {
        return;
      }

      const parts = alt.split("|").map((part) => part.trim());
      const description = parts.shift();

      if (!description) return;

      let size = null;
      let align = null;
      let caption = null;

      for (const part of parts) {
        const match =
          /^(size|align|caption)\s*=\s*(.+)$/i.exec(part);

        if (!match) return;

        const key = match[1].toLowerCase();
        const value = match[2].trim();

        if (key === "size") {
          const normalized = value.toLowerCase();

          if (size || !validSizes.has(normalized)) return;
          size = normalized;
        } else if (key === "align") {
          const normalized = value.toLowerCase();

          if (align || !validAlignments.has(normalized)) return;
          align = normalized;
        } else {
          if (caption || !value) return;
          caption = value;
        }
      }

      // Leave images without captions unchanged.
      if (!caption) return;

      const classes = [
        "article-figure",
        ...(size ? [`article-figure--${size}`] : []),
        ...(align ? [`article-figure--${align}`] : []),
      ];

      const updatedImage = {
        ...image,
        properties: {
          ...image.properties,
          alt: description,
        },
      };

      ctx.replaceNode(node, {
        type: "element",
        tagName: "figure",
        properties: {
          className: classes,
        },
        children: [
          updatedImage,
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [
              {
                type: "text",
                value: caption,
              },
            ],
          },
        ],
      });
    },
  },
};
