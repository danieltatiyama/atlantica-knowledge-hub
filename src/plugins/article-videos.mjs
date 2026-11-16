
function getYouTubeId(href) {
  if (typeof href !== "string") return null;

  let url;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  let id = null;

  if (hostname === "youtu.be") {
    id = parts[0];
  } else if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "www.youtube-nocookie.com",
    ].includes(hostname)
  ) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else if (
      ["shorts", "live", "embed"].includes(parts[0])
    ) {
      id = parts[1];
    }
  }

  return typeof id === "string" &&
    /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? id
      : null;
}

function getVimeoEmbedUrl(href) {
  if (typeof href !== "string") return null;

  let url;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  let videoId = null;

  if (
    hostname === "vimeo.com" ||
    hostname === "www.vimeo.com"
  ) {
    if (parts.length === 1) {
      videoId = parts[0];
    }
  } else if (hostname === "player.vimeo.com") {
    if (parts.length === 2 && parts[0] === "video") {
      videoId = parts[1];
    }
  }

  if (!videoId || !/^\d+$/.test(videoId)) {
    return null;
  }

  const embedUrl = new URL(
    `https://player.vimeo.com/video/${videoId}`
  );

  // Support Vimeo unlisted videos using a privacy hash.
  const hash = url.searchParams.get("h");

  if (hash && /^[a-zA-Z0-9]+$/.test(hash)) {
    embedUrl.searchParams.set("h", hash);
  }

  return embedUrl.href;
}

export default {
  name: "article-video-embeds",

  element: {
    filter: ["p"],

    visit(node, ctx) {

      const children = node.children.filter(
        (child) =>
          child.type !== "text" || child.value.trim() !== ""
      );

      // Only transform standalone Markdown links.
      if (children.length !== 1) return;

      const link = children[0];

      if (link.type !== "element" || link.tagName !== "a") {
        return;
      }

      const label = link.children
        .map((child) =>
          child.type === "text" ? child.value : ""
        )
        .join("")
        .trim();
      
      const options = label.split("|").map((part) => part.trim());
      const title = options.shift();

      if (!title) return;

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
      
      let provider = null;
      let size = null;
      let align = null;
      let caption = null;

      for (const option of options) {
        const match =
          /^(embed|size|align|caption)\s*=\s*(.+)$/i.exec(option);

        if (!match) return;

        const key = match[1].toLowerCase();
        const value = match[2].trim();
        const normalized = value.toLowerCase();

        if (key === "embed") {
          if (
            provider ||
            !["youtube", "vimeo"].includes(normalized)
          ) return;

          provider = normalized;
        } else if (key === "size") {
          if (size || !validSizes.has(normalized)) return;
          size = normalized;
        } else if (key === "align") {
          if (align || !validAlignments.has(normalized)) return;
          align = normalized;
        } else if (key === "caption") {
          if (caption !== null || !value) return;
          caption = value;
        }
      }

      if (!provider) return;

      let embedUrl = null;

      if (provider === "youtube") {
        const videoId = getYouTubeId(link.properties?.href);

        if (videoId) {
          embedUrl =
            `https://www.youtube-nocookie.com/embed/${videoId}`;
        }
      } else if (provider === "vimeo") {
        embedUrl = getVimeoEmbedUrl(link.properties?.href);
      }

      if (!embedUrl) return;

      const videoNode = {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "article-video",
            ...(size ? [`article-video--${size}`] : []),
            ...(align ? [`article-video--${align}`] : []),
          ],
        },
        children: [
          {
            type: "element",
            tagName: "iframe",
            properties: {
              src: embedUrl,
              title: title,
              loading: "lazy",
              allowFullScreen: true,
              allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
              referrerPolicy: "strict-origin-when-cross-origin",
            },
            children: [],
          },
        ],
      };

      // Preserve the existing output when there is no caption.
      if (!caption) {
        ctx.replaceNode(node, videoNode);
        return;
      }

      ctx.replaceNode(node, {
        type: "element",
        tagName: "figure",
        properties: {
          className: [
            "article-video-figure",
            ...(size ? [`article-video-figure--${size}`] : []),
            ...(align ? [`article-video-figure--${align}`] : []),
          ],
        },
        children: [
          videoNode,
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
