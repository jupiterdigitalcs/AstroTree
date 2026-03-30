# ROADMAP.md

## Vision
A beautiful, interactive web app where users build a family tree enriched with astrological data — surfacing inherited cosmic patterns across generations. Eventually monetized as a standalone product with a free tier and paid reports, connected to the JupiterDigital brand.

---

## MVP 1 — Visual Tree ✅ COMPLETE
Sun-sign-only family tree builder.
- Add family members in bulk (name + birthdate)
- Auto-calculate sun sign + element from birthdate
- Visual tree via React Flow with celestial dark styling
- Color-coded nodes by element (Fire / Earth / Air / Water)
- Parent, child, and spouse/partner edge types

---

## MVP 2 — Elemental Insights ✅ COMPLETE
Surface the cosmic patterns woven through the family.
- Family Insights panel: elemental breakdown bars, shared signs, partner compatibility
- Generational sign threads and elemental threads
- Notable bonds: twins, mirror signs, sibling/cousin element pairs
- Save and load named charts to localStorage
- PDF export (tree image + insights summary)

---

## MVP 3 — Production & Shareability
Make the app stable and shareable beyond beta testers.

**Done:**
- Autosave draft so refresh never loses work
- Error boundary with recovery screen
- Vercel deployment config
- Export popup blocker fix + visible error feedback
- Favicon (Jupiter-branded), meta tags, OG tags
- Mobile canvas height fix (100dvh)
- Consistent MM/DD/YYYY date input throughout
- Starfield performance fix
- Dead CSS cleanup

**Remaining:**
- Shareable read-only link — someone builds a tree, sends a URL, relatives can view but not edit
- Sample/demo tree on the welcome screen so new visitors understand what they're building
- Onboarding tooltip or first-use walkthrough

---

## MVP 4 — Moon Sign & Birth Time
Add depth for users who know more than just birthdate.

**Features:**
- Optional birth time field on add/edit form
- Calculate Moon sign from birthdate + approximate time (falls back gracefully if time unknown)
- Nodes optionally show Sun + Moon (e.g. "☉ Scorpio · ☽ Pisces")
- Moon-sign layer in Family Insights — elemental breakdown for Moon signs
- Flag nodes where Moon sign is uncertain due to missing birth time

**Goal:** Meaningful upgrade for astrology-literate users without breaking the simple flow for casual ones.

---

## MVP 5 — Full Chart Profiles
Collect birth time and place, show the full Big Three.

**Features:**
- Birth time + place inputs (city autocomplete)
- Integrate a chart calculation API (Swiss Ephemeris or AstrologyAPI.com)
- Each node shows Sun / Moon / Rising
- Expanded profile card on node click
- Cross-family Rising sign analysis in Insights

**Goal:** Becomes a real astrology product, not just a sun sign tool.

---

## MVP 6 — Reports & Monetization
First paywalled feature. Bridges to the existing JupiterDigital Etsy customer base.

**Features:**
- Premium PDF export — beautifully designed family astrology report (beyond the current print view)
- Stripe integration for one-time purchase per report
- "Gift a report" flow — natural upsell from birthday calendar customers
- Branding options (add family name, custom title)

**Goal:** Revenue. The export already exists — this is about making it premium and charging for it.

---

## Backlog / Future Ideas
- User accounts and cloud-saved trees (requires backend — Supabase is the likely path)
- Invite family members to add their own birth data via link
- Synastry overlays between any two family members
- AI-written narrative report: "Your family's cosmic story" (Claude API)
- Etsy integration — import customer birth data for a family chart
- Recurring patterns across generations (e.g. Saturn placements, Venus signs)
- Notifications / birthday reminders for family members
