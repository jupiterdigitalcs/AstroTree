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


---

## MVP 4 — Beyond Tree ✅ COMPLETE
- Rebrand to Astro Dig and more generic for non family groups 
- Allow adding friends/ coworker relationships 
- Constellation view for when Tree isn't applicable
- Shareable read-only link with "Save a copy" option for viewers
- Sample/demo tree on the welcome screen so new visitors understand what they're building
- Zodiac Wheel export (download/share as branded PNG)
- Unified canvas action bar — Download, Share Link, and Insights work on both Tree and Zodiac views


## MVP 5 — Moon Sign & Social Planets ✅ COMPLETE
- Celestine integration for Moon, Mercury, Venus, Mars (server-side)
- Nodes show Sun + Moon signs
- Moon/inner planet element breakdowns in Insights
- Ingress warnings for uncertain signs
- Zodiac wheel with all social planets
- Constellation and Tables views added

---

## MVP 6 — Monetization ✅ COMPLETE
- $9.99 one-time "Celestial" unlock via Stripe Checkout
- Free tier: tree view, basic insights, 3 DIG slides, 3 charts
- Celestial tier: all views, full insights, full DIG, 50 charts
- Stripe webhooks, refund handling, gift/promo codes
- Auth via Google (GSI) + magic links, cloud sync
- Owner purchase notification email

---

## Next — Content Revamp (Group Astrology)
See `CONTENT_REVAMP_PLAN.md` for full 6-phase plan.
- Add Jupiter + Saturn calculations, degree data (internal only)
- Group chart analysis: hotspots, gaps, collective element maps
- Rewrite all copy in warm/hedging voice
- New DIG slides based on chart math, not sun-sign superlatives

---

## MVP 7 — Advanced Chart Profiles
Require birth time and place, show the Rising and add Aspect patterns.

**Features:**
- Birth time + place inputs (city autocomplete)
- Each node shows Sun / Moon / Rising
- Expanded profile card on node click
- Cross-family Rising sign analysis in Insights
- Major aspects for each person + group aspect patterns

**Goal:** Real astrology product with advanced insights for group dynamics.

---

## Backlog / Future Ideas
- Invite family members to add their own birth data via link
- Synastry overlays between any two family members
- AI-written narrative report: "Your family's cosmic story" (Claude API)
- Etsy integration — import customer birth data for a family chart
- Recurring patterns across generations (e.g. Saturn placements, Venus signs)
