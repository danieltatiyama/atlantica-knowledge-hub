# Atlas costs in the historical enhancement table

The item profile's existing +0…+10 stat projection now has four independent Atlas Ore (#21559) columns: Power, Safe, AO Day Power and AO Day Safe. These costs are per attempt FROM the current row's grade, not cumulative cost to reach that grade. The stat multipliers do not determine Atlas costs. Atlas [E] is outside this four-column view.

## Reference coverage

`src/data/atlas-enhancement-costs.json` maps 85 explicit catalog identities to historical tables. Judgment, Twilight and Abyssal standard series use https://arcanicvoid.com/atlantica-online/equipment/atlas/. The source explicitly groups standard gear and mercenary sets by series. We include only exact standard family names with equipment suffixes, exported as explicit ItemID/name bindings; boxes, timed/no-trade variants, materials, mounts and other similarly named items are excluded. There is no level-based automatic assignment.

Dark Pegasus is bounded to Instrument, Bow, Lance and Axe. The historical weapon curve is documented at https://atlantica-online.wikidot.com/item:dark-pegasus-instrument and https://atlantica-online.wikidot.com/item:dark-pegasus-bow. The Axe +5 AO-Day comparison is observed; its full curve remains a historical weapon-family reference, not an individually verified table.

Unknown costs show —. No +10→L costs are inferred. Named-family membership is not evidence of current server eligibility. The existing stat-source/model column remains about numeric combat stats, while adjacent cost notes and tooltips separately identify Atlas provenance.

## Discount and observations

AO Day scenario assumes 25% discount: `ceil(base * 3 / 4)`, evaluated with integer arithmetic. This fits all 12 supplied screenshot comparisons: +0 Judgment Staff 30/42, Twilight Axe 39/54, Abyssal Shield 49/68; +5 Judgment Axe 150/203, Twilight Sword 195/264, Dark Pegasus Axe 135/183. Each pair is Power/Safe with discount. Only those exact ItemID/grade discounted cells are marked as in-game observations. Other cells are historical references/estimates. No success chance, Lucky Points, expected number of attempts, downgrade or destruction model is involved.

## Apocalyptic projection and eligibility

User confirmation: Apoca Power cannot be attempted before current +6; Safe is never allowed. The +7 Apocalyptic Leggings screenshot shows 182 normal Atlas Ore at 25% discount. Under the observed ceiling rule, 242 is the only integer normal cost consistent with 182. This is an inferred base, not an undiscounted observation.

The user explicitly requested a provisional projection from other gear curves. We anchor the relative Judgment shape to base 242 at +7:

`P(g) = round(242 * JudgmentPower(g) / 310)` for g=6,7,8,9.

This gives normal estimates 195,242,289,351 and AO-Day estimates 147,182,217,264. Except the original +7 AO-Day leggings observation, all projection cells carry ≈ and projection provenance. Explicitly bound standard level-190 Apocalypse weapons (13) and Apocalyptic armour (14) share this unverified family model. Champion and timed/no-trade variants are excluded. This extension is a family estimate from one leggings sample, not evidence that all 27 items share identical costs.

Other historical relative shapes are retained as sensitivity ranges in projection tooltips: +6 base194–195; +8 base289–291; +9 base351–374. Abyssal's late-grade curve notably differs, so a unique universal grade formula is not established. These ranges compare possible models and are not statistical confidence intervals or guaranteed bounds. No extrapolation below +6, no Safe numbers, no +10/L projection.

## Layout and checks

The existing table gains compact centered cells, a sticky grade column, a keyboard-focusable horizontal scroller and proximity column snapping. ResizeObserver measures the actual grade width for the snap offset and disconnects on table rebuild. Explicit numeric sort values keep ≈ estimates numeric and unknown/unavailable cells last.

Regression tests reproduce all 13 observed discounted costs including Apocalyptic, verify the unique inferred base, mapping identity guards, excluded variants, all grade/mode restrictions, estimate versus observation labels, sensitivity ranges, and eight-locale UI coverage. Raw uploaded client files and the decoder are not published.
