# CLAUDE.md

## Project Overview
AstroDig — a web app that lets users map cosmic connections between people. Users add family members, friends, and coworkers, see their sun signs and planetary placements, and discover astrological patterns across relationships. Features tree, zodiac wheel, constellation, and tables views, plus "The DIG" (a Wrapped-style story). Deployed at astrodig.com via Vercel.

Built by Christina, sole developer and owner of JupiterDigital (Etsy astrology store). This project may eventually connect to or complement existing JupiterDigital products like birthday calendars.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Tree Visualization:** React Flow (@xyflow/react)
- **Layout:** Dagre (auto-positioning nodes)
- **Astrology:** Celestine (server-side birth chart calculations via `/api/astrology`)
- **Payments:** Stripe (checkout sessions + webhooks)
- **Email:** Resend
- **Styling:** Dark celestial theme — CSS custom properties in `/src/styles/base.css`, split across 19 files in `/src/styles/`
- **State:** React hooks (useTreeState, useChartManager, useExport, useCloudSync, useOnboardingState, useHistoryNav, useSwipe, useCountUp) + localStorage for drafts
- **Backend:** Next.js route handlers in `/src/app/api/` proxying Supabase
- **Database:** Supabase (Postgres) — accessed server-side only, never from client
- **Testing:** Vitest (vite.config.js is test-only — app builds with Next.js)
- **Code Splitting:** xyflow + dagre chunked separately; ZodiacWheel, ConstellationView, html-to-image lazy-loaded
- **Analytics:** Vercel Analytics

---

## Current State
Live at astrodig.com:
- Add family members with name, birthdate, and relationships (parent/child/spouse/friend/coworker)
- Sun sign, moon sign, and inner planets (Mercury, Venus, Mars) calculated server-side via Celestine
- Four visualization modes: tree (React Flow), zodiac wheel, constellation (force-directed), tables (sortable grid)
- The DIG: Wrapped-style personality story with swipeable slides (free users see 3, celestial see all)
- Insights panel with 11 cards (see card order below)
- Optional auth via Supabase magic links — users start anonymous, prompted to add email after first save
- Chart save/load/rename/duplicate with cloud sync
- Shared chart links via `?view=token`
- PNG export with brand bar (all views + insights)
- Paywall/entitlements system with Stripe checkout ($9.99 one-time unlock)
- Admin panel at `/admin` with server-side auth, stats, paywall config
- Email capture for cloud backup restore
- Onboarding progress stepper + canvas onboarding
- Browser history integration (back button works with tabs/views)

---

## Paywall & Entitlements
Celestial unlock: $9.99 one-time via Stripe Checkout. User-facing name is "Celestial" — the internal DB tier value is still `'premium'`.

**Free tier:** Unlimited members, tree view, sun sign + element, basic elemental summary, cloud save, share links, tree PNG export, 3 DIG slides.

**Gated features (celestial):**
- Views: zodiac_view, tables_view, constellation_view
- Insights: advanced_insights, full_compatibility
- DIG: full_dig (beyond 3 slides)
- Export: zodiac_export (PNG), pdf_export
- Limits: unlimited_charts (free=3, celestial=50)

**Key files:** `src/utils/entitlements.js` (client-side gating), `src/utils/checkout.js` (Stripe redirect), `src/admin/AdminPaywallPanel.jsx` (admin config), `src/components/LockedOverlay.jsx`, `src/components/UpgradePrompt.jsx`

**What to never lock:** member count, tree view, share links, basic PNG export.

---

## Rules & Preferences
- Keep components small and single-responsibility
- Don't refactor working code unless asked
- Astrology logic lives in `/src/utils/astrology/` — do not duplicate it elsewhere
- Prefer readable code over clever code — this is a solo project
- Always use named exports, not default exports, for utility functions
- When adding new features, add them in isolation before wiring into the main tree
- **Keep secrets server-side** — all Supabase/admin/Stripe keys stay in `/src/app/api/` route handlers, never exposed to the client
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only client-exposed env vars (public anon key, safe)
- Environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_PASSWORD`, Stripe keys) are set in Vercel dashboard, not committed to code

---

## Folder Structure
```
/src
  /app                  # Next.js App Router
    layout.jsx          # Root layout (fonts, metadata, SEO, JSON-LD)
    page.jsx            # Wraps App.jsx with dynamic import (ssr: false)
    /admin/page.jsx     # Admin panel entry
    /view/[token]/page.jsx  # Shared chart view
    /api
      _lib/             # Shared server-side helpers (supabase client, admin auth, email)
      chart/route.js    # Chart CRUD (?action=save|load|list|delete|public|share|restore)
      device/route.js   # Device tracking (?action=register|email)
      admin/route.js    # Admin panel (?action=login|charts|stats|devices|trees-per-day)
      astrology/route.js  # Celestine calculations (moon, inner planets, ingress warnings)
      stripe/route.js   # Stripe checkout session creation
      stripe-webhook/route.js  # Stripe webhook handler
      redeem/route.js   # Entitlement/promo code redemption
  /admin                # Admin panel components + utils
  /components           # UI components
    /dig                # The DIG feature
      TheDig.jsx        # Main container (swipe/tap/keyboard navigation)
      DigProgressBar.jsx
      DigSlide.jsx      # Slide renderer
      /slides/          # 19 individual slide components (SlideIntro, SlideCosmicDNA, etc.)
  /hooks                # Custom hooks
    useTreeState.js     # Tree node/edge state management
    useChartManager.js  # Chart CRUD operations
    useExport.js        # PNG export logic
    useCloudSync.js     # Cloud save/load sync
    useOnboardingState.js  # Onboarding flags (localStorage)
    useHistoryNav.js    # Browser back button integration
    useSwipe.js         # Touch swipe detection (for DIG)
    useCountUp.js       # Animated number counter
  /styles               # 19 CSS files (base, layout, sidebar, forms, canvas, tabs, etc.)
  /utils
    /astrology          # sunSign.js, elements.js, birthChart.js, index.js (barrel)
    astrology.js        # Re-export barrel (convenience import path)
    astrologyAPI.js     # Client-side API calls to /api/astrology
    treeHelpers.js      # Shared edge styles, buildNodeData, makeEdge
    cloudStorage.js     # Client-side API calls (fetch to /api/ proxy)
    storage.js          # localStorage helpers
    layout.js           # Dagre layout algorithm
    format.js           # formatRelativeTime
    identity.js         # Device ID management
    entitlements.js     # Feature gating logic (canAccess, isPremium, getChartLimit)
    checkout.js         # Stripe checkout redirect
    digSlides.js        # DIG slide builder (selects 5-7 personalized slides)
    demoData.js         # Sample tree data
    dateInput.js        # Date parsing/validation helpers
  App.jsx               # Root component (~1600 lines) — layout, routing, orchestration
```

---

## What's Next
- **Content Revamp (in progress):** Group astrology depth — degree clustering, collective element maps, copy rewrite. Jupiter/Saturn already added. Full plan at `CONTENT_REVAMP_PLAN.md`.
- **Advanced Charts (future):** Rising sign, house placements, aspects between members' charts (birth time capture already exists).

## Insights Panel Card Order (do not reorder unless asked)
  1. Family Signature
  2. Sun Element distribution
  3. Moon Element distribution
  4. Notable Bonds
  5. Shared Signs
  6. Partner Compatibility
  7. Family Roles
  8. Family Arrivals
  9. Sign Concentration
  10. Full Compatibility Report (after Zodiac Threads)
  11. Pluto Generations

## Component Size Guidelines
  - App.jsx is intentionally large (~1600 lines) — orchestration only, don't split unless asked
  - InsightsPanel.jsx is intentionally large — all insight cards live in one file by design
  - EditMemberPanel.jsx handles all member editing in one place — keep it that way
  - The DIG uses many small slide components (opposite pattern) — each slide is its own file in /components/dig/slides/

## Tree Edge Routing
  - Edge type is enforced at display time in `edgesForDisplay` (useTreeState.js), NOT at creation time in `makeEdge`. This is the single source of truth — changing `makeEdge` alone won't affect existing edges in state.
  - React Flow type names are counterintuitive:
    - `smoothstep` = vertical/horizontal segments with rounded corners (what we use — looks like "straight lines")
    - `step` = same but with sharp corners
    - `straight` = diagonal line from A to B (NOT straight-looking in a tree)
    - `default` = bezier S-curves
  - TB mode: parent-child edges use `smoothstep`, spouse edges use `straight` with side handles
  - LR mode: parent-child edges use `smoothstep` with side handles, spouse edges use `straight` with top/bottom handles
  - Mobile compact spacing is in `layout.js` — if edges look cramped, adjust GEN_GAP/DAGRE_NSEP/DAGRE_RSEP, not the edge type

## CSS Organization
  - 19 CSS files in /src/styles/ — each maps to a feature area
  - Birth time / edit panel styles -> edit-panel.css
  - Zodiac mobile hints, zoom controls -> admin.css (mobile media query section)
  - Tab bar / React Flow controls mobile positioning -> tabs.css
  - DIG styles -> dig.css
  - Tables view -> tables.css
  - New component styles go in the most relevant existing file, not a new file
