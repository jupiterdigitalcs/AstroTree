# AstroDig Content Revamp Plan

## Why

Beta feedback: sun-sign-only content feels generic and doesn't resonate. The app already calculates Moon, Mercury, Venus, Mars via Celestine, but only uses signs (no degrees), and doesn't use Jupiter or Saturn at all. Celestine provides all of this. The goal: move from pop astrology to genuine **group chart analysis** — degree clustering, collective element weight, gaps, roles derived from what each person uniquely contributes. This is what makes AstroDig different from every other astrology app.

### Voice Principles
- Warm, hedging ("tends to," "may," "often"), Kelly Surtees-inspired
- Group-context descriptions, not individual personality verdicts
- No meme humor — smart, curious, hopeful
- "A birth chart is a starting point, not the whole story"
- Astrology is layered — we lean into different parts of ourselves at different times

### Data Constraints
- Birth time is NOT required — Moon/houses/rising are unreliable without it
- Reliable with date-only: Sun, Mercury, Venus, Mars, Jupiter, Saturn (signs + degrees)
- Moon can be one of two signs on a given day — always flag uncertainty
- Degrees are for **internal calculations only** — never shown to users

---

## Phase 1: Data Foundation

Everything depends on getting degree data + Jupiter/Saturn flowing through the pipeline.

### 1A. Expand API calculations
**File: `src/app/api/astrology/route.js`**
- `calcMoon` → add `moonDegree` to return value
- `calcInnerPlanets` → each planet returns `{ sign, symbol, degree }`
- New `calcOuterPlanets(birthdate, birthTime)` → Jupiter (index 5), Saturn (index 6) → `{ jupiter: { sign, symbol, degree }, saturn: { sign, symbol, degree } }`
- Register `outerPlanets` in `CALCULATORS`
- Extend `INGRESS_PLANETS` to include Jupiter + Saturn

### 1B. Update client API wrapper
**File: `src/utils/astrologyAPI.js`**
- Add `'outerPlanets'` to calculations arrays in both functions

### 1C. Update node data shape
**File: `src/utils/treeHelpers.js`**
- `buildNodeData`: store `astro.outerPlanets` on `base.outerPlanets`
- `hydrateNodes`: extend to also hydrate when `!n.data?.outerPlanets`

---

## Phase 2: Group Calculation Engine

Pure utility functions that power all new insights. Separate file for testability and reuse.

### New file: `src/utils/groupChartCalc.js`

**Core helpers:**
- `getAllPlacements(node)` → extracts all 7 planet placements with uncertainty flags
- `toAbsolute(sign, degree)` → 0-360 zodiac position
- `angularDistance(pos1, pos2)` → shortest arc
- `isAspect(pos1, pos2, orb)` → checks major aspects

**Group analysis functions:**
- `collectiveElementMap(nodes)` → total planetary weight by element across all members (FREE insight)
- `findHotspots(nodes, orb = 8)` → degree ranges where 3+ planets from different people cluster
- `findGaps(nodes)` → longest zodiac arc with zero group planets
- `deriveRoles(nodes)` → what each person uniquely contributes to the collective chart
- `saturnLines(nodes)` → groups by Saturn sign with themes
- `jupiterGifts(nodes)` → groups by Jupiter sign with growth areas
- `findGroupAspects(nodes, edges)` → degree-level aspects framed as group dynamics
- `allPlanetsBySign(nodes)` → ALL planet placements per sign (revamped Shared Signs)
- `findBridgePerson(nodes)` → person whose planets aspect the most others

### Test file: `src/utils/groupChartCalc.test.js`

---

## Phase 3: Tree Node Display

### 3A. Element weight indicators on nodes
**File: `src/components/AstroNode.jsx`**
- Compact row of 4 element dots below element label, sized by planet count per element

### 3B. Jupiter + Saturn in edit panel
**File: `src/components/EditMemberPanel.jsx`**
- Show Jupiter and Saturn placements using existing `PlanetSign` component

---

## Phase 4: Insights Panel Changes

### 4A. New FREE card: "Collective Element Map"
**File: `src/components/InsightsPanel.jsx`**
- After Family Signature card
- Uses `collectiveElementMap(nodes)` — shows total planetary weight across ALL members
- Existing Sun/Moon Element cards remain unchanged
- Not gated

### 4B. Uncertainty handling across all cards
- Extend `warningsPerNode` pattern for all degree-based insights
- Show both possible signs when uncertain, with warm note

### 4C. New PREMIUM cards (under existing `advanced_insights` key)
- **Group Hotspots** — plain language, no degree numbers
- **The Gaps** — describes missing zodiac territory
- **Saturn Lines** — groups by Saturn sign with responsibility themes
- **Jupiter Gifts** — groups by Jupiter sign with growth themes
- Update paywall preview banner

### 4D. Revamped existing cards
- **Family Roles** — replace element+modality blurb with unique-contribution roles
- **Shared Signs** — count ALL planets per sign, not just suns
- **Notable Bonds** — add group dynamics/triangles via degree aspects (no degree numbers)

---

## Phase 5: DIG Slide Revamps

### 5A. Kill sun-sign superlatives
**File: `src/utils/digSlides.js`**
- Remove `SIGN_SUPERLATIVES` — replace with data-derived titles earned from chart math

### 5B. "Collective Chart" replaces "Vibe Check"
- Show full planetary weight, all four elements, richer narrative

### 5C. Revamp Venus/Mars slides
- Group patterns (clustering, range) instead of one person's sign blurb

### 5D. New slides
- **`SlideHotspot.jsx`** — dramatic reveal of strongest degree cluster
- **`SlideBridge.jsx`** — person whose chart touches the most others
- Register in `DigSlide.jsx`, add candidates in `digSlides.js`

### 5E. Revamp Moon Mirror
- Add "no shared moons" message for groups of 4+
- Generate slide even when no pairs exist

---

## Phase 6: Copy & Tone Revamp

### 6A. Rewrite SIGN_FLAVOR (InsightsPanel.jsx)
Group-context: "When Aries energy shows up in a group, it tends to push everyone toward action."

### 6B. Rewrite MOON_VIBES (digSlides.js)
Genuine emotional insight: "Tends to process feeling through conversation — often needs a sounding board."

### 6C. Rewrite Venus/Mars blurbs (InsightsPanel.jsx)
Same treatment: warm, hedging, group-context.

### 6D. Educational whispers
- New CSS class `insight-whisper`
- "Sun sign reflects how you tend to express yourself outwardly..."
- "Moon sign speaks to emotional needs and inner rhythms..."
- "A birth chart is a starting point, not the whole story."

### 6E. "Starting point" note at top of insights
"These insights describe tendencies and patterns, not certainties. A birth chart is one layer of a much bigger picture."

---

## File Summary

| File | Phase | Change |
|------|-------|--------|
| `src/app/api/astrology/route.js` | 1 | Add degrees, Jupiter/Saturn, extend ingress |
| `src/utils/astrologyAPI.js` | 1 | Add outerPlanets to requests |
| `src/utils/treeHelpers.js` | 1 | Store outer planets + degrees on nodes |
| `src/utils/groupChartCalc.js` | 2 | **NEW** — all group analysis functions |
| `src/utils/groupChartCalc.test.js` | 2 | **NEW** — tests |
| `src/components/AstroNode.jsx` | 3 | Element weight dots |
| `src/components/EditMemberPanel.jsx` | 3 | Jupiter/Saturn display |
| `src/components/InsightsPanel.jsx` | 4, 6 | New cards, revamps, copy, whispers |
| `src/utils/entitlements.js` | 4 | Update FEATURE_KEYS description |
| `src/utils/digSlides.js` | 5, 6 | Slide revamps, copy rewrites |
| `src/components/dig/DigSlide.jsx` | 5 | Register new slide types |
| `src/components/dig/slides/SlideVibeCheck.jsx` | 5 | Revamp to collective chart |
| `src/components/dig/slides/SlideVenusVibes.jsx` | 5 | Group patterns |
| `src/components/dig/slides/SlideMarsEnergy.jsx` | 5 | Group patterns |
| `src/components/dig/slides/SlideMoonMirror.jsx` | 5 | No-shared-moons case |
| `src/components/dig/slides/SlideSuperlative.jsx` | 5 | Data-derived titles |
| `src/components/dig/slides/SlideHotspot.jsx` | 5 | **NEW** |
| `src/components/dig/slides/SlideBridge.jsx` | 5 | **NEW** |
| `src/styles/*.css` | 4, 6 | `insight-whisper` class, new card styles |
