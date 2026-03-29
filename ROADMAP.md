# ROADMAP.md

## Vision
A beautiful, interactive web app where users build a family tree enriched with astrological data — surfacing inherited cosmic patterns across generations. Eventually monetized as a standalone product with a free tier and paid reports, connected to the JupiterDigital brand.

---

## MVP 1 — Visual Tree ✅ COMPLETE
Sun-sign-only family tree builder.
- Add family member (name, birthdate, role)
- Auto-calculate sun sign from birthdate
- Visual tree via React Flow with celestial styling
- Live updates as members are added

---

## MVP 2 — Elemental Pattern Layer
Surface the fire/earth/air/water distribution across the family.

**Features:**
- Sidebar or banner showing elemental breakdown (e.g. "60% Earth")
- Color-coded nodes by element
- Simple insight line: "Your family leans Earth — grounded, practical, and persistent"

**Goal:** First real "aha moment" — feels meaningfully astrological, not just a pretty tree.

---

## MVP 3 — Full Chart Profiles
Collect birth time and place, integrate a chart calculation API, show full Big Three.

**Features:**
- Expand form to collect birth time + place
- Integrate Swiss Ephemeris or similar API (e.g. AstrologyAPI.com)
- Each node shows Sun / Moon / Rising
- Click a node to expand a mini profile card
- Handle "birth time unknown" gracefully — fall back to Sun + Moon only

**Goal:** Becomes a real astrology product, not just a sun sign toy.

---

## MVP 4 — Pattern Recognition
Automatically surface repeating themes across the tree.

**Features:**
- Detect and highlight repeated signs or placements (e.g. "3 family members have Scorpio placements")
- Detect dominant planets across the family
- Generation-to-generation comparisons (e.g. Saturn patterns)
- Shareable insight cards

**Goal:** The feature that creates genuine surprise and social sharing.

---

## MVP 5 — Reports & Monetization
Exportable PDF family report. First paywalled feature.

**Features:**
- Beautiful PDF export of the full family tree + insights
- Stripe integration for one-time purchase per report
- Optional: save/share tree via unique URL
- Branding as JupiterDigital product

**Goal:** Revenue. Bridges to existing Etsy customer base — natural upsell from birthday calendars.

---

## Future / Backlog
- User accounts and saved trees (requires backend)
- Invite family members to add their own data
- Synastry overlays between family members
- Mobile-optimized view
- Etsy integration — import customer birth data directly
- Rising sign inheritance analysis
- "Family constellation" narrative report written by AI
