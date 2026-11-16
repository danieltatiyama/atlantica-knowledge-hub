# Media authoring guide

This guide describes how to add images, GIFs, YouTube videos, and captions to articles in the **Atlantica Knowledge Hub** using Pages CMS or Markdown.

## Editing in Pages CMS

1. Open the article in the appropriate language collection (**Guides (English)** or **Guias (Português)**).
2. Upload images and GIFs using the content editor. Uploaded article assets use the `/images/guides/` URL prefix.
3. Switch the rich-text editor to **Source** mode to enter or adjust the Markdown examples below.
4. Save the article and check its preview. Use `draft: true` for content not ready for publication.

**Important:** Give every embedded image or video its own paragraph, with a **blank line before and after**. These special media directives are only recognized when the item is alone in its Markdown paragraph.

## Image and GIF syntax

```md
![Descriptive alternative text | size=medium | align=center](/images/guides/example.webp)
```

With a visible caption:

```md
![Avalon dungeon map | size=large | align=center | caption=Map showing the Avalon entrance](/images/guides/avalon-map.webp)
```

GIFs use the same format:

```md
![Crafting interface animation | size=medium | align=center | caption=Example of the crafting interface](/images/guides/crafting.gif)
```

- **Alternative text:** Write a short description of what the image shows. It is used for accessibility, and it is not the visible caption.
- **Caption:** Optional text displayed below the image. The image and caption share the same width and alignment.
- **Without options:** Standard Markdown images still work. A caption is optional.

## YouTube video syntax

```md
[Dungeon walkthrough | embed=youtube | size=medium | align=center](https://www.youtube.com/watch?v=6mClwc1lILc)
```

With a visible caption:

```md
[Dungeon walkthrough | embed=youtube | size=large | align=center | caption=Complete dungeon walkthrough](https://www.youtube.com/watch?v=6mClwc1lILc)
```

- **Link text:** Becomes the embedded player's accessible title.
- **`embed=youtube`:** Required for the link to turn into a player.
- **`caption`:** Optional visible text under the player.
- The player retains a responsive **16:9** aspect ratio.

## Optional Vimeo syntax

Vimeo links also have embed support:

```md
[Vimeo example | embed=vimeo | size=small | align=right | caption=Video demonstration](https://vimeo.com/76979871)
```

**Note:** Vimeo display and captions have been tested, but embedded playback failed in one Android Chrome test while the same video worked directly on Vimeo. Vimeo use is optional; investigate this separately before relying on it in published mobile-facing content.

## Available options

| Option | Allowed values | Images and GIFs | Videos |
| --- | --- | --- | --- |
| `size` | `small`, `medium`, `large`, `full` | 240 px, 420 px, 680 px, 100% | 320 px, 480 px, 680 px, 100% |
| `align` | `left`, `center`, `right` | Yes | Yes |
| `caption` | Plain text | Yes | Yes |
| `embed` | `youtube`, `vimeo` | Not applicable | Required |

Widths are maxima constrained by the available screen space; the actual rendered width may be smaller on mobile.

## Authoring rules and limitations

- Keep each image, GIF, or embed on its **own paragraph**, separated by blank lines.
- Use `|` only to separate options; do **not** put a literal `|` in the description or caption.
- Use `size=...` and `align=...` only with the supported values; use a single instance of each option.
- Captions are plain text rather than Markdown-formatted rich text.
- Keep descriptive alt text on images even when a caption is present.
- Use HTTPS links to recognized YouTube/Vimeo URLs. A normal Markdown link is not automatically embedded unless it has a valid `embed` option.
- Preview the article on desktop and mobile, and use images you have permission to publish.
- When working with a test article locally, keep its unpublished version (`draft: true`) in Git before merging to the production branch.

## Troubleshooting

**A video appears as a text link:** Check that the link is alone in its paragraph, the `embed` value is valid, and every option is separated by `|`.

**A caption does not appear:** Make sure `caption=` has non-empty text and that the item is on its own paragraph.

**Changes do not appear in the development preview:** Save the Markdown article again; if necessary restart the Astro development server and run `npm run build` to verify production output. Avoid treating a stale preview as a parsing failure.

**Mobile layout:** Check that the media and its caption fit the device width without horizontal scrolling. You can access the development server from a device on the same LAN using `npm run dev -- --host 0.0.0.0` and the computer's LAN IPv4 address.
