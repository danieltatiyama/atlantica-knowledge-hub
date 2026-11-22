# Stage 20.15 — Historical Legendary enhancement (+11, L)

## Source-supported inference

A subset of special equipment can be **enhanced** beyond +10 to a
purple **L** (Legendary) tier, often described as +11. This is not an
ordinary enchantment from a second item. The source pages
[Legendary Weapons](https://atlantica.fandom.com/wiki/Legendary_Weapons)
and [Enhance](https://atlantica.fandom.com/wiki/Enhance)
distinguish enhancement to L from normal enchanting.

The earlier historical +0…+10 numeric multiplier model uses 4.0×
at +10. Three independently named community equipment pages show
**4.3×** at L for scalable base attributes, rounded down:

| Equipment | Numeric base +0 | Listed L | Source |
| --- | --- | --- | --- |
| Immortal Bow | Attack 1,350–2,750; DEX 230 | 5,805–11,825; DEX 989 | https://atlantica.fandom.com/wiki/Immortal_Bow |
| Excalibur | Attack 3,016–3,782; STR/VIT 250 | 12,968–16,262; STR/VIT 1,075 | https://atlantica-online.wikidot.com/item:excalibur |
| Guardian Sheath **Shield** | Defense 15,570; VIT 288 | 66,951; VIT 1,238 | https://atlantica.fandom.com/wiki/Guardian_Sheath_Shield |

Exact model:

```text
L-stat = floor(base +0 stat * 43 / 10)
+10 stat = floor(base +0 stat * 40 / 10)
```

Hence 4.3 vs 4.0 is **7.5% above +10 before truncation**, not
a 30% upgrade applied to +10. Integer BigInt intermediates avoid
floating underflow. In source code grade L is represented as
**the string `"L"`**, not as an ordinary integer enchant grade 11.

### Not every field scales

The Guardian Sheath equipment Shield is **not** the identically
named King Arthur skill. On its historical table,
Magic Defense **198** and Evasion **8.5%** are flat across grades.
The Immortal Bow's *First Hit Damage* bonus changes from 20%
at +0 to 54% at L. Excalibur's *Sage Sword's Judgment* changes
from Lv1 at +0 to Lv12 at L. These effects/skills are NOT
calculated with 4.3×.

### Dell'arte's Ambition: inferred L, no observed L row

https://atlantica.fandom.com/wiki/Dell%27arte%27s_Ambition
lists +0 Attack **4,705–5,901**, STR/VIT **399** and a
partial +3 row (Attack 7,528–9,441, STR/VIT 638).
The [Legendary Weapons list](https://atlantica.fandom.com/wiki/Legendary_Weapons)
includes it among L-eligible swords; however the reviewed item page
does **not** provide a full L row.

Under the historical multiplier the inferred L would be:
- Attack **20,231–25,374**
- Strength and Vitality **+1,715**

The website labels these as **PREDICTED**, not verified historical L
readings or confirmed 2026 Global behavior.

## Implementation

- `src/data/equipment-enchant-projection.mjs`
  supports `projectClassicStat(base, "L")`, with 43/10 and
  integer-exact rounding. The existing +0…+10 multipliers are unchanged.
- `getEnchantStatRows(observed, "wikidot-classic-v1",
  "wikidot-legendary-43-v1")` appends a prediction for L **only when
  explicitly selected**; no L is inferred merely because +10 exists.
  If an observed, reviewed L row exists, it takes precedence over
  prediction at L.
- `reviewed-equipment-profiles-gate.mjs` now requires explicit
  `legendaryEligible: true`, section-level evidence, and an optional
  historical projection model to display an L row in item articles.
  Non-eligible/unsourced L grades are rejected.
- `ItemKnowledgeSections.astro` renders the purple L row **after**
  +10 with clear provenance and a caveat about unscalable fields.
- `src/data/legendary-enhancement-research.json` lists four
  historical case studies **without fabricated item IDs**.
  These examples are not yet part of the verified 551-item ID catalog.
- `src/data/legendary-enhancement-research.mjs` validates historical
  citations, bounded basic stats, source scope and consistency with
  4.3×. It rejects injected fields/URLs, duplicate names and mismatched
  values; missing Dell'arte L remains marked as missing, not invented.
- `src/components/LegendaryEnhancementPage.astro` and two routes
  `en: /items/legendary/` and `pt-br: /pt-br/items/legendary/`:
  compare +0/+10/L for documented equipment; the source status of
  each historical L row appears in the table. A simple local calculator
  requires the operator to explicitly mark the item as eligible before
  an L prediction is displayed.
- A link from the main equipment catalog makes the research discoverable.
- `tests/legendary-enhancement.test.mjs` and the CI checks cover
  4.3× across Immortal Bow, Excalibur, Guardian Sheath Shield, missing
  Dell'arte L, observed L override, fixed Magic Defense and unapproved
  ordinary equipment. The example data and full source boundaries
  are checked before every Astro build.

## Constraints and editor workflow

1. **Not** an official global formula: historic community pages may
   describe different patches/servers; verify within current AO Global.
2. The general +0…+10 model remains separate; Legendary requires
   specifically documented per-item eligibility. Ordinary Spirit Sword,
   Bow and Instrument stay **ineligible by default** in the site
   until independently reviewed.
3. Do not extrapolate fixed Magic Defense, evasion, special abilities,
   magic skill ranks, enchanting probabilities, Atlas costs or
   durability from the numeric basic-stat formula.
4. Do not assign arbitrary numeric item IDs based on similar names.
   The current reviewed equipment item registry is a limited subset
   of names observed in Equipment Box previews; the four researched
   legendary items have no matching reviewed IDs there yet.
5. To add a verified Legendary item to the main catalog, first establish
   the correct numeric item identity using source family comparison,
   then add per-field evidence and explicit eligibility, and review the
   public PR. Do not merge unlike item identities because IDs collide.

## Validation

```powershell
npm run validate:legendary
npm run test:legendary
npm run validate:profiles
npm run test:profiles
npm run build
```

No live website scraping, private SQLite, unreviewed client asset or
gameplay data uploads occur during build or CI.
