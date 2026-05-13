# AstroDig Content Revamp — Status

## Why
Move from pop astrology (sun-sign superlatives) to genuine **group chart analysis** — degree clustering, collective element weight, gaps, roles derived from what each person uniquely contributes.

### Voice Principles
- Warm, hedging ("tends to," "may," "often"), Kelly Surtees-inspired
- Group-context descriptions, not individual personality verdicts
- No meme humor — smart, curious, hopeful
- "A birth chart is a starting point, not the whole story"

### Data Constraints
- Birth time is NOT required — Moon/houses/rising are unreliable without it
- Reliable with date-only: Sun, Mercury, Venus, Mars, Jupiter, Saturn (signs + degrees)
- Moon can be one of two signs on a given day — always flag uncertainty
- Degrees are for **internal calculations only** — never shown to users

---

## Status

### ✅ Phase 1 — Data Foundation (DONE)
- API returns degrees for all inner planets + Jupiter/Saturn via `calcOuterPlanets`
- `astrologyAPI.js` requests `outerPlanets`
- `treeHelpers.js` stores outer planets on nodes

### ✅ Phase 2 — Group Calculation Engine (DONE, minus tests)
- `src/utils/groupChartCalc.js` has all functions: `collectiveElementMap`, `findHotspots`, `findGaps`, `deriveRoles`, `saturnLines`, `jupiterGifts`, `findGroupAspects`, `allPlanetsBySign`, `findBridgePerson`
- ⬜ Test file `groupChartCalc.test.js` not yet written

### 🔶 Phase 3 — Tree Node Display (PARTIAL)
- ✅ Element weight dots on `AstroNode.jsx`
- ⬜ Jupiter + Saturn not yet shown in `EditMemberPanel.jsx`

### ✅ Phase 4 — Insights Panel (DONE, minus one item)
- ✅ Collective Element Map card (free)
- ✅ Group Hotspots, The Gaps, Saturn Lines, Jupiter Gifts cards (premium)
- ✅ `insight-whisper` CSS class in `insights.css`
- ⬜ "Starting point" intro note at top of InsightsPanel not yet added

### ✅ Phase 5 — DIG Slides (DONE)
- ✅ SlideHotspot + SlideBridge registered in DigSlide.jsx
- ✅ SlideVibeCheck revamped to collective chart
- ✅ SlideVenusVibes, SlideMarsEnergy revamped to group patterns
- ✅ SlideMoonMirror handles no-shared-moons case
- ✅ SlideSuperlative uses data-derived titles (no SIGN_SUPERLATIVES)

### ✅ Phase 6 — Copy & Tone (DONE)
- ✅ SIGN_FLAVOR rewritten: warm, hedging, group-context
- ✅ MOON_VIBES rewritten in digSlides.js

---

## Remaining Work

| Item | File | Notes |
|------|------|-------|
| Jupiter/Saturn in edit panel | `src/components/EditMemberPanel.jsx` | Show using existing `PlanetSign` component, read from `node.data.outerPlanets` |
| "Starting point" note | `src/components/InsightsPanel.jsx` | Add at top of insights: "These insights describe tendencies and patterns, not certainties. A birth chart is one layer of a much bigger picture." |
| Test file | `src/utils/groupChartCalc.test.js` | Unit tests for core group calc functions |
