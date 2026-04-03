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
- Family Signature, Full Compatibility Report, and Family Roles insights
- Zodiac Wheel view — circular sun sign chart with member markers
- Sort family members by age (oldest first) everywhere

---

## MVP 3 — Production & Shareability ✅ COMPLETE
Make the app stable and shareable beyond beta testers.

- Autosave draft so refresh never loses work
- Error boundary with recovery screen
- Vercel deployment config
- Export popup blocker fix + visible error feedback
- Favicon (Jupiter-branded), meta tags, OG tags
- Mobile canvas height fix (100dvh)
- Consistent MM/DD/YYYY date input throughout
- Starfield performance fix
- Dead CSS cleanup
- Onboarding stepper walkthrough for new users
- Native share sheet on mobile exports, direct download on desktop
- Export brand bar and JupiterDigital icons
- Rename and duplicate saved charts
- Database save (Supabase) — charts persist beyond localStorage
- Admin panel: date filters, created vs saved columns, By User grouped view
- IP geolocation on device registration
- Security: SECURITY DEFINER RPCs, removed service role key from browser
- Mobile polish: nav fixes, canvas height, social icons, export cleanup

- Shareable read-only link with "Save a copy" option for viewers
- Sample/demo tree on the welcome screen so new visitors understand what they're building
- Zodiac Wheel export (download/share as branded PNG)
- Unified canvas action bar — Download, Share Link, and Insights work on both Tree and Zodiac views

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
- User accounts with login (charts save to Supabase already, but no auth yet)
- Invite family members to add their own birth data via link
- Synastry overlays between any two family members
- AI-written narrative report: "Your family's cosmic story" (Claude API)
- Etsy integration — import customer birth data for a family chart
- Recurring patterns across generations (e.g. Saturn placements, Venus signs)
- Notifications / birthday reminders for family members
